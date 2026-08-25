"""Import local Low-shot experiment outputs into one canonical long fact table."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
from collections import defaultdict
from pathlib import Path


RESULTS_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = RESULTS_ROOT / "source" / "results_long.csv"
MANIFEST_PATH = RESULTS_ROOT / "source" / "sources_manifest.json"
DATASET_MANIFEST_PATH = RESULTS_ROOT / "source" / "dataset_manifest.json"
PROTOCOL_ID = "low-shot-per-class-v1"
SETTINGS = {"1shot": "1-shot", "5shot": "5-shot", "10shot": "10-shot"}
ARCHIVES = {"ucr": "UCR", "uea": "UEA", "mvcore66": "MVCore66"}
FACT_FIELDS = [
    "archive",
    "dataset",
    "method",
    "protocol_id",
    "setting",
    "run_id",
    "seed",
    "status",
    "accuracy",
    "source",
]


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def normalize_setting(value: str) -> str | None:
    compact = value.strip().lower().replace("-", "")
    return SETTINGS.get(compact)


def accuracy(value: str, source: Path) -> float:
    parsed = float(value)
    if not math.isfinite(parsed) or not 0.0 <= parsed <= 1.0:
        raise ValueError(f"Invalid accuracy {value!r} in {source}")
    return parsed


def relative_source(source_root: Path, path: Path) -> str:
    return f"results/few-shot/{path.relative_to(source_root).as_posix()}"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-root", type=Path, required=True)
    args = parser.parse_args()
    source_root = args.source_root.resolve()
    facts: list[dict[str, str | float]] = []
    source_files: list[dict[str, str | int]] = []
    dataset_sets: dict[tuple[str, str, str], set[str]] = defaultdict(set)

    def register(path: Path, rows: list[dict[str, str]]) -> None:
        source_files.append(
            {
                "path": relative_source(source_root, path),
                "sha256": file_sha256(path),
                "rows": len(rows),
            }
        )

    mantis_heads = {
        "logreg": "Mantis+LR",
        "logreg_scaled": "Mantis+ScaledLR",
        "svm": "Mantis+SVM",
        "rf": "Mantis+RF",
        "knn": "Mantis+kNN",
        "nc": "Mantis+NC",
    }
    for archive_key in ("ucr", "uea"):
        path = source_root / "Mantisv1" / (
            f"portable_mantisv1_{archive_key}_lowshot_all_heads_seed42_gpu5_"
            "20260818_results.csv"
        )
        rows = read_rows(path)
        register(path, rows)
        for row in rows:
            if row["protocol"].strip().lower() != "fewshot":
                continue
            setting = normalize_setting(row["setting"])
            if setting is None:
                continue
            archive = ARCHIVES[archive_key]
            dataset = row["dataset"].strip()
            method = mantis_heads[row["classifier"].strip().lower()]
            dataset_sets[("Mantis", archive, setting)].add(dataset)
            facts.append(
                {
                    "archive": archive,
                    "dataset": dataset,
                    "method": method,
                    "protocol_id": PROTOCOL_ID,
                    "setting": setting,
                    "run_id": "mantisv1-lowshot-20260818",
                    "seed": f"sample={row['sample_seed']};classifier={row['classifier_seed']}",
                    "status": "ok",
                    "accuracy": accuracy(row["acc"], path),
                    "source": relative_source(source_root, path),
                }
            )

    moment_heads = {
        "logreg_test_mean": "MOMENT+LR",
        "rf_test_mean": "MOMENT+RF",
        "svm_test_mean": "MOMENT+SVM",
        "mlp_test_mean": "MOMENT+MLP",
        "knn_test_mean": "MOMENT+kNN",
        "nc_test_mean": "MOMENT+NC",
    }
    for archive_key in ("ucr", "uea", "mvcore66"):
        path = source_root / "Moment" / (
            f"moment_{archive_key}_lowlabel_both_seed0_fixed_results.csv"
        )
        rows = read_rows(path)
        register(path, rows)
        for row in rows:
            if row["protocol"].strip().lower() != "fewshot":
                continue
            setting = normalize_setting(row["setting"])
            if setting is None:
                continue
            archive = ARCHIVES[archive_key]
            dataset = row["dataset"].strip()
            dataset_sets[("MOMENT", archive, setting)].add(dataset)
            for column, method in moment_heads.items():
                facts.append(
                    {
                        "archive": archive,
                        "dataset": dataset,
                        "method": method,
                        "protocol_id": PROTOCOL_ID,
                        "setting": setting,
                        "run_id": "moment-lowshot-fixed",
                        "seed": f"sample={row['sample_seed']}",
                        "status": "ok",
                        "accuracy": accuracy(row[column], path),
                        "source": relative_source(source_root, path),
                    }
                )

    nutime_files = {
        "ucr": "ucr_lowlabel_nutime_rf_results.csv",
        "uea": "uea_lowlabel_nutime_rf_results.csv",
        "mvcore66": "mvcore66_lowlabel_nutime_rf_results.csv",
    }
    for archive_key, filename in nutime_files.items():
        path = source_root / "NuTime" / filename
        rows = read_rows(path)
        register(path, rows)
        for row in rows:
            if row["protocol"].strip().lower() != "fewshot":
                continue
            setting = normalize_setting(row["setting"])
            if setting is None:
                continue
            archive = ARCHIVES[archive_key]
            dataset = row["dataset"].strip()
            dataset_sets[("NuTime", archive, setting)].add(dataset)
            facts.append(
                {
                    "archive": archive,
                    "dataset": dataset,
                    "method": "NuTime+RF",
                    "protocol_id": PROTOCOL_ID,
                    "setting": setting,
                    "run_id": "nutime-lowshot-rf",
                    "seed": f"sample={row['sample_seed']}",
                    "status": "ok",
                    "accuracy": accuracy(row["acc"], path),
                    "source": relative_source(source_root, path),
                }
            )

    for archive in ("UCR", "UEA", "MVCore66"):
        families = ("Mantis", "MOMENT", "NuTime") if archive != "MVCore66" else ("MOMENT", "NuTime")
        for setting in SETTINGS.values():
            reference = dataset_sets[(families[0], archive, setting)]
            if not reference:
                raise ValueError(f"No datasets for {families[0]} {archive} {setting}")
            for family in families[1:]:
                candidate = dataset_sets[(family, archive, setting)]
                if candidate != reference:
                    only_reference = sorted(reference - candidate)
                    only_candidate = sorted(candidate - reference)
                    raise ValueError(
                        f"Dataset mismatch for {archive} {setting}: {families[0]} vs {family}; "
                        f"missing={only_reference[:5]} extra={only_candidate[:5]}"
                    )

    seen: set[tuple[str, ...]] = set()
    for fact in facts:
        key = tuple(str(fact[field]) for field in FACT_FIELDS[:7])
        if key in seen:
            raise ValueError(f"Duplicate canonical fact key: {key}")
        seen.add(key)

    setting_order = {value: index for index, value in enumerate(SETTINGS.values())}
    archive_order = {"UCR": 0, "UEA": 1, "MVCore66": 2}
    facts.sort(
        key=lambda row: (
            setting_order[str(row["setting"])],
            archive_order[str(row["archive"])],
            str(row["dataset"]),
            str(row["method"]),
        )
    )
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FACT_FIELDS, lineterminator="\n")
        writer.writeheader()
        writer.writerows(facts)

    excluded = []
    for path in sorted((source_root / "Unishape").glob("*_setting_summary.csv")):
        rows = read_rows(path)
        excluded.append(
            {
                "method": "UniShape+RF",
                "path": relative_source(source_root, path),
                "sha256": file_sha256(path),
                "rows": len(rows),
                "reason": "Aggregate summaries only; per-dataset results are unavailable.",
            }
        )
    manifest = {
        "sourceRootHint": "时序基模发布/results/few-shot",
        "canonicalRows": len(facts),
        "files": sorted(source_files, key=lambda item: str(item["path"])),
        "excluded": excluded,
    }
    with MANIFEST_PATH.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(manifest, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    dataset_manifest = {
        "protocolId": PROTOCOL_ID,
        "settings": {
            setting: {
                "UCR": sorted(dataset_sets[("Mantis", "UCR", setting)]),
                "UEA": sorted(dataset_sets[("Mantis", "UEA", setting)]),
                "MVCore66": sorted(dataset_sets[("MOMENT", "MVCore66", setting)]),
            }
            for setting in SETTINGS.values()
        },
    }
    with DATASET_MANIFEST_PATH.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(dataset_manifest, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    print(f"Imported {len(facts)} Low-shot facts from {len(source_files)} files")


if __name__ == "__main__":
    main()
