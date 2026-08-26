"""Import verified Standard MVCore66 results and freeze the deduplicated union."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
FACT_PATH = ROOT / "source" / "results_long.csv"
MANIFEST_PATH = ROOT / "source" / "mvcore66_sources_manifest.json"
DATASETS_DIR = ROOT / "suites" / "datasets"
PROTOCOL_ID = "paper-standard-v1"
FACT_FIELDS = [
    "archive", "dataset", "method", "protocol_id", "run_id",
    "seed", "status", "accuracy", "source",
]


def read_rows(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def parse_accuracy(raw: str, path: Path, dataset: str, method: str) -> float:
    value = float(raw)
    if not math.isfinite(value) or not 0.0 <= value <= 1.0:
        raise ValueError(f"Invalid accuracy for {dataset} / {method} in {path}: {raw!r}")
    return value


def write_dataset_file(path: Path, datasets: set[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(sorted(datasets)) + "\n", encoding="utf-8", newline="\n")


def normalize_dataset(value: str) -> str:
    """Normalize loader paths such as Dataset/Dataset_eq to the suite ID."""
    dataset = value.strip().split("/", 1)[0]
    if not dataset:
        raise ValueError(f"Blank dataset identifier: {value!r}")
    return dataset


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-root", type=Path, required=True)
    parser.add_argument("--overlap-file", type=Path, required=True)
    args = parser.parse_args()
    source_root = args.source_root.resolve()
    overlap_path = args.overlap_file.resolve()

    facts: list[dict[str, str | float]] = []
    sources: list[dict[str, str | int]] = []
    datasets_by_method: dict[str, set[str]] = {}

    def register(path: Path, rows: list[dict[str, str]]) -> None:
        sources.append({
            "path": f"results/standard/MVCore66/{path.relative_to(source_root).as_posix()}",
            "sha256": sha256(path),
            "rows": len(rows),
        })

    def add_fact(
        *, dataset: str, method: str, accuracy: str, path: Path,
        run_id: str, seed: str,
    ) -> None:
        dataset = normalize_dataset(dataset)
        if not dataset or not method:
            raise ValueError(f"Blank dataset or method in {path}")
        datasets_by_method.setdefault(method, set()).add(dataset)
        facts.append({
            "archive": "MVCore66",
            "dataset": dataset,
            "method": method,
            "protocol_id": PROTOCOL_ID,
            "run_id": run_id,
            "seed": seed,
            "status": "ok",
            "accuracy": parse_accuracy(accuracy, path, dataset, method),
            "source": f"results/standard/MVCore66/{path.relative_to(source_root).as_posix()}",
        })

    path = source_root / "ChorusTIC_MV-core_66_step-6000_results.csv.csv"
    rows = read_rows(path)
    register(path, rows)
    for row in rows:
        if row.get("status", "ok").strip().lower() != "ok":
            raise ValueError(f"Non-ok ChorusTIC row: {row['dataset']}")
        add_fact(
            dataset=row["dataset"], method="ChorusTIC", accuracy=row["accuracy"], path=path,
            run_id="chorustic-mvcore66-step-6000", seed="unspecified",
        )

    moment_columns = {
        "svm_test_mean": "MOMENT+SVM",
        "rf_test_mean": "MOMENT+RF",
        "mlp_test_mean": "MOMENT+MLP",
        "knn_test_mean": "MOMENT+kNN",
        "nc_test_mean": "MOMENT+NC",
    }
    path = source_root / "mvcore66_moment_allchannels_zeroshot_results.csv"
    rows = read_rows(path)
    register(path, rows)
    for row in rows:
        for column, method in moment_columns.items():
            add_fact(
                dataset=row["dataset"], method=method, accuracy=row[column], path=path,
                run_id="moment-allchannels-zeroshot", seed="reported-mean",
            )

    path = source_root / "MVcore66_NuTime_merged_ok.csv"
    rows = read_rows(path)
    register(path, rows)
    for row in rows:
        if row.get("status", "ok").strip().lower() != "ok":
            raise ValueError(f"Non-ok NuTime row: {row['dataset']}")
        add_fact(
            dataset=row["dataset"], method="NuTime+RF", accuracy=row["acc"], path=path,
            run_id="nutime-mvcore66-frozen-rf", seed=row.get("seed", "unspecified"),
        )

    path = source_root / "mvcore66_zeroshot_unishape_rf200_20260821.csv"
    rows = read_rows(path)
    register(path, rows)
    for row in rows:
        add_fact(
            dataset=row["dataset"], method="UniShape+RF", accuracy=row["acc"], path=path,
            run_id="unishape-rf200-20260821", seed=row.get("seed", "unspecified"),
        )

    for folder, method in (("tabicl", "TabICL"), ("tabiclv2", "TabICLv2")):
        path = source_root / folder / "results.csv"
        rows = read_rows(path)
        register(path, rows)
        for row in rows:
            if row.get("status", "ok").strip().lower() != "ok":
                raise ValueError(f"Non-ok {method} row: {row['dataset']}")
            add_fact(
                dataset=row["dataset"], method=method, accuracy=row["accuracy"], path=path,
                run_id=f"{folder}-mvcore66-standard", seed="unspecified",
            )

    mantisv2_files = (
        (
            "results_testMantisV2_MV-core_66_last_cls_LR.csv",
            "MantisV2+LR",
            "mantisv2-mvcore66-last-cls-logreg",
        ),
        (
            "results_testMantisV2_MVCORE66_last_cls_logreg_scaled.csv",
            "MantisV2+ScaledLR",
            "mantisv2-mvcore66-last-cls-logreg-scaled",
        ),
    )
    for filename, method, run_id in mantisv2_files:
        path = source_root / "Mantisv2" / filename
        rows = read_rows(path)
        register(path, rows)
        for row in rows:
            add_fact(
                dataset=row["dataset"], method=method, accuracy=row["acc"], path=path,
                run_id=run_id, seed=row.get("seed", "unspecified"),
            )

    expected_methods = {
        "ChorusTIC", "MOMENT+SVM", "MOMENT+RF", "MOMENT+MLP", "MOMENT+kNN",
        "MOMENT+NC", "NuTime+RF", "UniShape+RF", "TabICL", "TabICLv2",
        "MantisV2+LR", "MantisV2+ScaledLR",
    }
    if set(datasets_by_method) != expected_methods:
        raise ValueError(f"Unexpected method set: {sorted(datasets_by_method)}")
    reference = datasets_by_method["ChorusTIC"]
    if len(reference) != 66:
        raise ValueError(f"Expected 66 MVCore66 datasets, found {len(reference)}")
    for method, datasets in datasets_by_method.items():
        if datasets != reference:
            raise ValueError(
                f"Dataset mismatch for {method}: missing={sorted(reference - datasets)[:5]} "
                f"extra={sorted(datasets - reference)[:5]}"
            )

    overlap_rows = read_rows(overlap_path)
    overlap_datasets = [row["dataset"].strip() for row in overlap_rows]
    if len(overlap_rows) != 70 or len(overlap_datasets) != len(set(overlap_datasets)):
        raise ValueError("Overlap file must contain 70 unique UEA/MVCore66 union rows")
    common = {
        row["dataset"].strip() for row in overlap_rows
        if row["in_uea"] == "yes" and row["in_mvcore66"] == "yes"
    }
    mvcore_only = {
        row["dataset"].strip() for row in overlap_rows
        if row["in_uea"] == "no" and row["in_mvcore66"] == "yes"
    }
    uea_only = {
        row["dataset"].strip() for row in overlap_rows
        if row["in_uea"] == "yes" and row["in_mvcore66"] == "no"
    }
    if (len(common), len(mvcore_only), len(uea_only)) != (26, 40, 4):
        raise ValueError(
            f"Unexpected overlap counts: common={len(common)} mvcore_only={len(mvcore_only)} "
            f"uea_only={len(uea_only)}"
        )
    if common | mvcore_only != reference:
        raise ValueError("Overlap file MVCore66 membership does not match result datasets")

    with FACT_PATH.open("r", encoding="utf-8-sig", newline="") as handle:
        existing = list(csv.DictReader(handle))
    retained = [row for row in existing if row["archive"] != "MVCore66"]
    combined = [*retained, *facts]
    seen: set[tuple[str, ...]] = set()
    for row in combined:
        key = tuple(str(row[field]) for field in FACT_FIELDS[:6])
        if key in seen:
            raise ValueError(f"Duplicate canonical fact key: {key}")
        seen.add(key)
    facts.sort(key=lambda row: (
        str(row["dataset"]), str(row["method"]),
        str(row["run_id"]), str(row["seed"]),
    ))
    combined = [*retained, *facts]
    with FACT_PATH.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FACT_FIELDS, lineterminator="\n")
        writer.writeheader()
        writer.writerows(combined)

    write_dataset_file(DATASETS_DIR / "mvcore66_66.txt", reference)
    write_dataset_file(DATASETS_DIR / "mvcore66_only_40.txt", mvcore_only)
    manifest = {
        "protocolId": PROTOCOL_ID,
        "deduplicationPolicy": {
            "overallSuite": "UCR-128 + UEA-30 + MVCore66-only-40",
            "overlapResolution": "Keep UEA result for all 26 UEA/MVCore66 overlaps",
            "uniqueDatasetCount": 198,
            "common": len(common),
            "mvcore66Only": len(mvcore_only),
            "ueaOnly": len(uea_only),
        },
        "overlapFile": {
            "path": "benchmark_overlap_uea_mvcore66.csv",
            "sha256": sha256(overlap_path),
            "rows": len(overlap_rows),
        },
        "sources": sorted(sources, key=lambda item: str(item["path"])),
        "canonicalRowsAdded": len(facts),
        "methods": sorted(expected_methods),
    }
    MANIFEST_PATH.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8", newline="\n",
    )
    print(
        f"Imported {len(facts)} MVCore66 facts; frozen union: "
        f"128 UCR + 30 UEA + {len(mvcore_only)} MVCore66-only = 198"
    )


if __name__ == "__main__":
    main()
