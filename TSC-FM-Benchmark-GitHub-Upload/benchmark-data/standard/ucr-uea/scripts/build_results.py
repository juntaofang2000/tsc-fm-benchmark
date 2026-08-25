"""Generate release tables and leaderboards from the long result fact table."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


RESULTS_ROOT = Path(__file__).resolve().parents[1]
FACT_PATH = RESULTS_ROOT / "source" / "results_long.csv"
SUITES_DIR = RESULTS_ROOT / "suites"
GENERATED_DIR = RESULTS_ROOT / "generated"
TIE_TOLERANCE = 1e-12
REQUIRED_FACT_COLUMNS = {
    "archive", "dataset", "method", "protocol_id", "run_id",
    "seed", "status", "accuracy", "source",
}


@dataclass(frozen=True)
class DatasetKey:
    archive: str
    dataset: str


@dataclass
class Suite:
    suite_id: str
    display_name: str
    protocol_id: str
    datasets: list[DatasetKey]
    methods: list[str]
    output_prefix: str
    release_wide_output: str | None


def read_dataset_file(config_path: Path, archive: str, relative_path: str) -> list[DatasetKey]:
    path = config_path.parent / relative_path
    values = []
    for raw_line in path.read_text(encoding="utf-8-sig").splitlines():
        value = raw_line.strip()
        if value and not value.startswith("#"):
            values.append(DatasetKey(archive=archive, dataset=value))
    if len(values) != len(set(values)):
        raise ValueError(f"Duplicate dataset in {path}")
    return values


def load_suites() -> tuple[dict[str, Suite], dict[str, Path]]:
    raw_by_id: dict[str, tuple[Path, dict]] = {}
    for path in sorted(SUITES_DIR.glob("*.json")):
        payload = json.loads(path.read_text(encoding="utf-8-sig"))
        suite_id = payload["suite_id"]
        if suite_id in raw_by_id:
            raise ValueError(f"Duplicate suite_id: {suite_id}")
        raw_by_id[suite_id] = (path, payload)

    resolved: dict[str, Suite] = {}
    resolving: set[str] = set()

    def resolve(suite_id: str) -> Suite:
        if suite_id in resolved:
            return resolved[suite_id]
        if suite_id in resolving:
            raise ValueError(f"Cyclic suite inclusion involving {suite_id}")
        if suite_id not in raw_by_id:
            raise ValueError(f"Unknown included suite: {suite_id}")
        resolving.add(suite_id)
        path, payload = raw_by_id[suite_id]
        datasets: list[DatasetKey] = []
        for included_id in payload.get("include_suites", []):
            included = resolve(included_id)
            if included.protocol_id != payload["protocol_id"]:
                raise ValueError(f"Protocol mismatch between {suite_id} and {included_id}")
            datasets.extend(included.datasets)
        for archive, relative_path in payload.get("dataset_files", {}).items():
            datasets.extend(read_dataset_file(path, archive, relative_path))
        if not datasets:
            raise ValueError(f"Suite {suite_id} selects no datasets")
        if len(datasets) != len(set(datasets)):
            raise ValueError(f"Suite {suite_id} selects a dataset more than once")
        methods = payload.get("methods", [])
        if not methods or len(methods) != len(set(methods)):
            raise ValueError(f"Suite {suite_id} must list unique methods")
        suite = Suite(
            suite_id=suite_id,
            display_name=payload["display_name"],
            protocol_id=payload["protocol_id"],
            datasets=datasets,
            methods=methods,
            output_prefix=payload["output_prefix"],
            release_wide_output=payload.get("release_wide_output"),
        )
        resolving.remove(suite_id)
        resolved[suite_id] = suite
        return suite

    for suite_id in raw_by_id:
        resolve(suite_id)
    return resolved, {suite_id: path for suite_id, (path, _) in raw_by_id.items()}


def load_facts() -> tuple[dict[tuple[str, str, str, str], float], int]:
    grouped: dict[tuple[str, str, str, str], list[float]] = defaultdict(list)
    seen_runs: set[tuple[str, str, str, str, str, str]] = set()
    row_count = 0
    with FACT_PATH.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        missing_columns = REQUIRED_FACT_COLUMNS - set(reader.fieldnames or [])
        if missing_columns:
            raise ValueError(f"Missing fact columns: {sorted(missing_columns)}")
        for line_number, row in enumerate(reader, start=2):
            row_count += 1
            archive = row["archive"].strip()
            dataset = row["dataset"].strip()
            method = row["method"].strip()
            protocol_id = row["protocol_id"].strip()
            run_id = row["run_id"].strip()
            seed = row["seed"].strip()
            if not all((archive, dataset, method, protocol_id, run_id, seed)):
                raise ValueError(f"Blank identifier at line {line_number}")
            run_key = (archive, dataset, method, protocol_id, run_id, seed)
            if run_key in seen_runs:
                raise ValueError(f"Duplicate fact key at line {line_number}: {run_key}")
            seen_runs.add(run_key)
            if row["status"].strip().lower() != "ok":
                continue
            value = float(row["accuracy"])
            if not math.isfinite(value) or not 0.0 <= value <= 1.0:
                raise ValueError(f"Invalid accuracy at line {line_number}: {value}")
            grouped[(archive, dataset, method, protocol_id)].append(value)
    aggregated = {key: sum(values) / len(values) for key, values in grouped.items()}
    return aggregated, row_count


def average_tie_ranks(values: dict[str, float]) -> dict[str, float]:
    ordered = sorted(values.items(), key=lambda item: (-item[1], item[0]))
    ranks: dict[str, float] = {}
    index = 0
    while index < len(ordered):
        end = index + 1
        while end < len(ordered) and math.isclose(
            ordered[end][1], ordered[index][1], rel_tol=0.0, abs_tol=TIE_TOLERANCE
        ):
            end += 1
        average_rank = (index + 1 + end) / 2.0
        for method, _ in ordered[index:end]:
            ranks[method] = average_rank
        index = end
    return ranks


def write_csv(path: Path, fieldnames: list[str], rows: Iterable[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def accuracy_text(value: float | None) -> str:
    return "" if value is None else repr(value)


def build_suite(
    suite: Suite,
    facts: dict[tuple[str, str, str, str], float],
) -> tuple[list[dict], list[dict]]:
    values: dict[tuple[DatasetKey, str], float] = {}
    coverage_rows: list[dict] = []
    missing_rows: list[dict] = []
    for key in suite.datasets:
        for method in suite.methods:
            value = facts.get((key.archive, key.dataset, method, suite.protocol_id))
            if value is not None:
                values[(key, method)] = value
            else:
                missing_rows.append(
                    {
                        "suite_id": suite.suite_id,
                        "archive": key.archive,
                        "dataset": key.dataset,
                        "method": method,
                        "protocol_id": suite.protocol_id,
                    }
                )

    eligible_methods: list[str] = []
    for method in suite.methods:
        available = sum((key, method) in values for key in suite.datasets)
        eligible = available == len(suite.datasets)
        if eligible:
            eligible_methods.append(method)
        coverage_rows.append(
            {
                "suite_id": suite.suite_id,
                "method": method,
                "available_datasets": available,
                "required_datasets": len(suite.datasets),
                "coverage": f"{available} / {len(suite.datasets)}",
                "eligible": str(eligible).lower(),
            }
        )

    accuracy_rows = []
    for key in suite.datasets:
        row = {"archive": key.archive, "dataset": key.dataset}
        row.update({method: accuracy_text(values.get((key, method))) for method in suite.methods})
        accuracy_rows.append(row)

    per_dataset_ranks: dict[tuple[DatasetKey, str], float] = {}
    rank_rows = []
    for key in suite.datasets:
        row_values = {method: values[(key, method)] for method in eligible_methods}
        ranks = average_tie_ranks(row_values) if row_values else {}
        row = {"archive": key.archive, "dataset": key.dataset}
        for method in eligible_methods:
            per_dataset_ranks[(key, method)] = ranks[method]
            row[method] = repr(ranks[method])
        rank_rows.append(row)

    leaderboard_rows = []
    for method in eligible_methods:
        accuracies = [values[(key, method)] for key in suite.datasets]
        ranks = [per_dataset_ranks[(key, method)] for key in suite.datasets]
        leaderboard_rows.append(
            {
                "method": method,
                "avg_accuracy": sum(accuracies) / len(accuracies),
                "avg_accuracy_pct": 100.0 * sum(accuracies) / len(accuracies),
                "avg_rank": sum(ranks) / len(ranks),
                "datasets": len(accuracies),
                "coverage": f"{len(accuracies)} / {len(suite.datasets)}",
            }
        )
    leaderboard_rows.sort(key=lambda row: (-row["avg_accuracy"], row["method"]))
    for rank, row in enumerate(leaderboard_rows, start=1):
        row["rank"] = rank

    accuracy_fields = ["archive", "dataset", *suite.methods]
    rank_fields = ["archive", "dataset", *eligible_methods]
    leaderboard_fields = [
        "rank", "method", "avg_accuracy", "avg_accuracy_pct", "avg_rank", "datasets", "coverage"
    ]
    generated_accuracy = GENERATED_DIR / f"{suite.output_prefix}_per_dataset_accuracy.csv"
    write_csv(generated_accuracy, accuracy_fields, accuracy_rows)
    write_csv(GENERATED_DIR / f"{suite.output_prefix}_per_dataset_rank.csv", rank_fields, rank_rows)
    write_csv(GENERATED_DIR / f"{suite.output_prefix}_leaderboard.csv", leaderboard_fields, leaderboard_rows)

    if suite.release_wide_output:
        release_rows = [{"dataset": row["dataset"], **{m: row[m] for m in suite.methods}} for row in accuracy_rows]
        write_csv(
            RESULTS_ROOT / suite.release_wide_output,
            ["dataset", *suite.methods],
            release_rows,
        )
    return coverage_rows, missing_rows


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--suite", action="append", help="suite_id to build; repeat as needed")
    parser.add_argument("--output-dir", type=Path, help="write generated reports to another directory")
    parser.add_argument(
        "--no-release-wide",
        action="store_true",
        help="do not refresh the legacy release wide CSV files",
    )
    args = parser.parse_args()

    suites, suite_paths = load_suites()
    selected_ids = args.suite or sorted(suites)
    unknown = sorted(set(selected_ids) - set(suites))
    if unknown:
        raise SystemExit(f"Unknown suite(s): {', '.join(unknown)}")
    facts, fact_rows = load_facts()

    global GENERATED_DIR
    if args.output_dir:
        GENERATED_DIR = args.output_dir.resolve()

    GENERATED_DIR.mkdir(parents=True, exist_ok=True)

    all_coverage: list[dict] = []
    all_missing: list[dict] = []
    for suite_id in selected_ids:
        suite = suites[suite_id]
        if args.no_release_wide and suite.release_wide_output:
            suite = Suite(
                suite_id=suite.suite_id,
                display_name=suite.display_name,
                protocol_id=suite.protocol_id,
                datasets=suite.datasets,
                methods=suite.methods,
                output_prefix=suite.output_prefix,
                release_wide_output=None,
            )
        coverage, missing = build_suite(suite, facts)
        all_coverage.extend(coverage)
        all_missing.extend(missing)

    write_csv(
        GENERATED_DIR / "coverage_report.csv",
        ["suite_id", "method", "available_datasets", "required_datasets", "coverage", "eligible"],
        all_coverage,
    )
    write_csv(
        GENERATED_DIR / "missing_results.csv",
        ["suite_id", "archive", "dataset", "method", "protocol_id"],
        all_missing,
    )
    audit_lines = [
        "# Generated results audit",
        "",
        f"- Source: `source/results_long.csv`",
        f"- Source SHA-256: `{sha256(FACT_PATH)}`",
        f"- Fact rows read: {fact_rows}",
        f"- Suites built: {', '.join(selected_ids)}",
        f"- Missing method-dataset results: {len(all_missing)}",
        "- Ranking: descending accuracy within each dataset; exact ties use average ranks.",
        "- Leaderboard eligibility: complete coverage of the selected suite.",
        "",
        "## Suite configuration hashes",
        "",
    ]
    for suite_id in selected_ids:
        path = suite_paths[suite_id]
        audit_lines.append(f"- `{path.relative_to(RESULTS_ROOT).as_posix()}`: `{sha256(path)}`")
    audit_lines.append("")
    (GENERATED_DIR / "BUILD_AUDIT.md").write_text("\n".join(audit_lines), encoding="utf-8")
    print(f"Built {len(selected_ids)} suite(s); missing results: {len(all_missing)}")


if __name__ == "__main__":
    main()
