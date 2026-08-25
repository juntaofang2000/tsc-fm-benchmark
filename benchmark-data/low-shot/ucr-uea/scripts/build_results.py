"""Build Low-shot leaderboards from the canonical per-dataset fact table."""

from __future__ import annotations

import csv
import hashlib
import json
import math
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
FACT_PATH = ROOT / "source" / "results_long.csv"
PROTOCOL_PATH = ROOT / "protocol.json"
DATASET_MANIFEST_PATH = ROOT / "source" / "dataset_manifest.json"
GENERATED_DIR = ROOT / "generated"
REQUIRED_COLUMNS = {
    "archive", "dataset", "method", "protocol_id", "setting", "run_id",
    "seed", "status", "accuracy", "source",
}
TIE_TOLERANCE = 1e-12


def write_csv(path: Path, fieldnames: list[str], rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore", lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def average_tie_ranks(values: dict[str, float]) -> dict[str, float]:
    ordered = sorted(values.items(), key=lambda item: (-item[1], item[0]))
    result: dict[str, float] = {}
    index = 0
    while index < len(ordered):
        end = index + 1
        while end < len(ordered) and math.isclose(
            ordered[end][1], ordered[index][1], rel_tol=0.0, abs_tol=TIE_TOLERANCE
        ):
            end += 1
        rank = (index + 1 + end) / 2.0
        for method, _ in ordered[index:end]:
            result[method] = rank
        index = end
    return result


def load_facts(protocol_id: str, settings: list[str]) -> tuple[dict[tuple[str, str, str, str], float], int]:
    values: dict[tuple[str, str, str, str], float] = {}
    seen: set[tuple[str, str, str, str, str, str]] = set()
    row_count = 0
    with FACT_PATH.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        missing = REQUIRED_COLUMNS - set(reader.fieldnames or [])
        if missing:
            raise ValueError(f"Missing columns: {sorted(missing)}")
        for line_number, row in enumerate(reader, start=2):
            row_count += 1
            if row["protocol_id"] != protocol_id:
                raise ValueError(f"Unexpected protocol at line {line_number}: {row['protocol_id']}")
            if row["setting"] not in settings:
                raise ValueError(f"Unexpected setting at line {line_number}: {row['setting']}")
            key = (
                row["setting"], row["archive"], row["dataset"], row["method"],
                row["run_id"], row["seed"],
            )
            if key in seen:
                raise ValueError(f"Duplicate result key at line {line_number}: {key}")
            seen.add(key)
            if row["status"].lower() != "ok":
                continue
            accuracy = float(row["accuracy"])
            if not math.isfinite(accuracy) or not 0.0 <= accuracy <= 1.0:
                raise ValueError(f"Invalid accuracy at line {line_number}: {accuracy}")
            aggregate_key = (row["setting"], row["archive"], row["dataset"], row["method"])
            if aggregate_key in values:
                raise ValueError(f"Multiple successful runs require an explicit aggregation policy: {aggregate_key}")
            values[aggregate_key] = accuracy
    return values, row_count


def build_leaderboard(
    setting: str,
    benchmark: str,
    archives: list[str],
    facts: dict[tuple[str, str, str, str], float],
    dataset_manifest: dict[str, dict[str, list[str]]],
) -> tuple[dict, list[dict]]:
    dataset_keys = sorted(
        (archive, dataset)
        for archive in archives
        for dataset in dataset_manifest[setting][archive]
    )
    methods = sorted(
        {method for shot, archive, _, method in facts if shot == setting and archive in archives}
    )
    if not dataset_keys or not methods:
        raise ValueError(f"No facts for {setting} / {benchmark}")

    coverage_rows: list[dict] = []
    eligible: list[str] = []
    for method in methods:
        available = sum((setting, archive, dataset, method) in facts for archive, dataset in dataset_keys)
        is_eligible = available == len(dataset_keys)
        if is_eligible:
            eligible.append(method)
        coverage_rows.append({
            "setting": setting,
            "benchmark": benchmark,
            "method": method,
            "available_datasets": available,
            "required_datasets": len(dataset_keys),
            "coverage": f"{available} / {len(dataset_keys)}",
            "eligible": str(is_eligible).lower(),
        })

    prefix = f"{setting.replace('-', '')}_{benchmark.lower()}"
    accuracy_rows: list[dict] = []
    rank_rows: list[dict] = []
    rank_values: dict[tuple[str, str, str], float] = {}
    for archive, dataset in dataset_keys:
        accuracy_row = {"archive": archive, "dataset": dataset}
        for method in methods:
            value = facts.get((setting, archive, dataset, method))
            accuracy_row[method] = "" if value is None else repr(value)
        accuracy_rows.append(accuracy_row)

        per_dataset = {
            method: facts[(setting, archive, dataset, method)]
            for method in eligible
        }
        ranks = average_tie_ranks(per_dataset)
        rank_row = {"archive": archive, "dataset": dataset}
        for method in eligible:
            rank_values[(archive, dataset, method)] = ranks[method]
            rank_row[method] = repr(ranks[method])
        rank_rows.append(rank_row)

    leaderboard_rows: list[dict] = []
    for method in eligible:
        all_values = [facts[(setting, archive, dataset, method)] for archive, dataset in dataset_keys]
        row = {
            "method": method,
            "avg_accuracy": sum(all_values) / len(all_values),
            "avg_accuracy_pct": 100.0 * sum(all_values) / len(all_values),
            "avg_rank": sum(rank_values[(archive, dataset, method)] for archive, dataset in dataset_keys) / len(dataset_keys),
            "datasets": len(dataset_keys),
            "coverage": f"{len(dataset_keys)} / {len(dataset_keys)}",
            "ucr_accuracy_pct": None,
            "uea_accuracy_pct": None,
            "mvcore66_accuracy_pct": None,
        }
        for archive, field in (
            ("UCR", "ucr_accuracy_pct"),
            ("UEA", "uea_accuracy_pct"),
            ("MVCore66", "mvcore66_accuracy_pct"),
        ):
            component = [
                facts[(setting, item_archive, dataset, method)]
                for item_archive, dataset in dataset_keys
                if item_archive == archive
            ]
            if component:
                row[field] = 100.0 * sum(component) / len(component)
        leaderboard_rows.append(row)

    leaderboard_rows.sort(key=lambda row: (-row["avg_accuracy"], row["method"]))
    for rank, row in enumerate(leaderboard_rows, start=1):
        row["rank"] = rank

    write_csv(GENERATED_DIR / f"{prefix}_per_dataset_accuracy.csv", ["archive", "dataset", *methods], accuracy_rows)
    write_csv(GENERATED_DIR / f"{prefix}_per_dataset_rank.csv", ["archive", "dataset", *eligible], rank_rows)
    write_csv(
        GENERATED_DIR / f"{prefix}_leaderboard.csv",
        [
            "rank", "method", "avg_accuracy", "avg_accuracy_pct", "avg_rank", "datasets", "coverage",
            "ucr_accuracy_pct", "uea_accuracy_pct", "mvcore66_accuracy_pct",
        ],
        leaderboard_rows,
    )
    return {
        "datasetCount": len(dataset_keys),
        "archives": archives,
        "rows": leaderboard_rows,
    }, coverage_rows


def sha256_text(path: Path) -> str:
    normalized = path.read_text(encoding="utf-8-sig").replace("\r\n", "\n").encode("utf-8")
    return hashlib.sha256(normalized).hexdigest()


def main() -> None:
    protocol = json.loads(PROTOCOL_PATH.read_text(encoding="utf-8-sig"))
    dataset_payload = json.loads(DATASET_MANIFEST_PATH.read_text(encoding="utf-8-sig"))
    if dataset_payload["protocolId"] != protocol["protocol_id"]:
        raise ValueError("Dataset manifest protocol does not match protocol.json")
    dataset_manifest = dataset_payload["settings"]
    settings = protocol["settings"]
    facts, fact_rows = load_facts(protocol["protocol_id"], settings)
    allowed = {
        (setting, archive, dataset)
        for setting in settings
        for archive, datasets in dataset_manifest[setting].items()
        for dataset in datasets
    }
    unexpected = sorted({(setting, archive, dataset) for setting, archive, dataset, _ in facts} - allowed)
    if unexpected:
        raise ValueError(f"Facts outside the dataset manifest: {unexpected[:5]}")
    payload = {
        "protocolId": protocol["protocol_id"],
        "generatedFrom": "source/results_long.csv",
        "settings": settings,
        "benchmarks": {},
    }
    coverage_rows: list[dict] = []
    for setting in settings:
        payload["benchmarks"][setting] = {}
        for benchmark, archives in protocol["benchmarks"].items():
            leaderboard, coverage = build_leaderboard(setting, benchmark, archives, facts, dataset_manifest)
            payload["benchmarks"][setting][benchmark] = leaderboard
            coverage_rows.extend(coverage)

    GENERATED_DIR.mkdir(parents=True, exist_ok=True)
    json_path = GENERATED_DIR / "leaderboards.json"
    json_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    write_csv(
        GENERATED_DIR / "coverage_report.csv",
        ["setting", "benchmark", "method", "available_datasets", "required_datasets", "coverage", "eligible"],
        coverage_rows,
    )
    generated_files = sorted(path for path in GENERATED_DIR.iterdir() if path.is_file() and path.name != "BUILD_AUDIT.md")
    audit_lines = [
        "# Low-shot build audit",
        "",
        f"- Protocol: `{protocol['protocol_id']}`",
        f"- Canonical fact rows: {fact_rows}",
        f"- Fact-table normalized SHA-256: `{sha256_text(FACT_PATH)}`",
        f"- Dataset-manifest normalized SHA-256: `{sha256_text(DATASET_MANIFEST_PATH)}`",
        "- Missing results are left blank and never replaced with zero.",
        "- Eligibility requires complete coverage of the selected feasible-dataset set.",
        "",
        "## Normalized SHA-256",
        "",
    ]
    audit_lines.extend(f"- `{path.relative_to(ROOT).as_posix()}`: `{sha256_text(path)}`" for path in generated_files)
    (GENERATED_DIR / "BUILD_AUDIT.md").write_text("\n".join(audit_lines) + "\n", encoding="utf-8", newline="\n")
    print(f"Built {len(settings) * len(protocol['benchmarks'])} Low-shot leaderboards from {fact_rows} facts")


if __name__ == "__main__":
    main()
