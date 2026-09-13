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
CHORUSTIC_SUPPLEMENT_PATH = RESULTS_ROOT / "source" / "chorustic_insectwingbeatsubset_results.csv"
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


def normalize_dataset(value: str) -> str:
    """Drop an experiment-directory suffix while preserving the archive ID."""
    dataset = value.strip().split("/", 1)[0]
    if not dataset:
        raise ValueError(f"Blank dataset identifier: {value!r}")
    return dataset


def accuracy(value: str, source: Path) -> float:
    parsed = float(value)
    if not math.isfinite(parsed) or not 0.0 <= parsed <= 1.0:
        raise ValueError(f"Invalid accuracy {value!r} in {source}")
    return parsed


def percentage_accuracy(value: str, source: Path) -> float:
    stripped = value.strip()
    if not stripped.endswith("%"):
        raise ValueError(f"Expected percentage accuracy in {source}: {value!r}")
    parsed = float(stripped[:-1]) / 100.0
    if not math.isfinite(parsed) or not 0.0 <= parsed <= 1.0:
        raise ValueError(f"Invalid percentage accuracy {value!r} in {source}")
    return round(parsed, 12)


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

    def register_repo_source(path: Path, rows: list[dict[str, str]]) -> None:
        source_files.append(
            {
                "path": path.relative_to(RESULTS_ROOT).as_posix(),
                "sha256": file_sha256(path),
                "rows": len(rows),
            }
        )

    chorustic_values: dict[tuple[str, str, str], float] = {}
    for archive_key in ("ucr", "uea", "mvcore66"):
        path = source_root / "ChorusTIC" / f"{archive_key}_sampled_results.csv"
        rows = read_rows(path)
        register(path, rows)
        for row in rows:
            if row["protocol"].strip().lower() != "fewshot":
                continue
            setting = normalize_setting(row["setting"])
            if setting is None:
                continue
            if row.get("status", "ok").strip().lower() != "ok":
                continue
            archive = ARCHIVES[archive_key]
            dataset = normalize_dataset(row["dataset"])
            value = accuracy(row["acc"], path)
            fact_key = (archive, dataset, setting)
            if fact_key in chorustic_values:
                raise ValueError(f"Duplicate ChorusTIC result: {fact_key}")
            chorustic_values[fact_key] = value
            dataset_sets[("ChorusTIC", archive, setting)].add(dataset)
            facts.append(
                {
                    "archive": archive,
                    "dataset": dataset,
                    "method": "ChorusTIC",
                    "protocol_id": PROTOCOL_ID,
                    "setting": setting,
                    "run_id": "chorustic-lowshot-classifier-v2",
                    "seed": f"sample={row['sample_seed']}",
                    "status": "ok",
                    "accuracy": value,
                    "source": relative_source(source_root, path),
                }
            )

    supplement_rows = read_rows(CHORUSTIC_SUPPLEMENT_PATH)
    register_repo_source(CHORUSTIC_SUPPLEMENT_PATH, supplement_rows)
    expected_supplement_keys = {
        ("fewshot", "1-shot"),
        ("fewshot", "5-shot"),
        ("fewshot", "10-shot"),
        ("test_ratio", "10%"),
        ("test_ratio", "20%"),
        ("test_ratio", "30%"),
        ("test_ratio", "40%"),
        ("test_ratio", "50%"),
    }
    supplement_keys = {
        (row["protocol"].strip().lower(), row["setting"].strip())
        for row in supplement_rows
    }
    if len(supplement_rows) != len(supplement_keys) or supplement_keys != expected_supplement_keys:
        raise ValueError("ChorusTIC supplement must contain the exact 8 supplied protocol settings")
    for row in supplement_rows:
        if row["suite"].strip().lower() != "uea" or row["dataset"].strip() != "InsectWingbeatSubset":
            raise ValueError("ChorusTIC supplement must describe UEA/InsectWingbeatSubset only")
        if any(row[field].strip() != "1" for field in (
            "actual_datasets", "rows", "min_seeds_per_dataset", "max_seeds_per_dataset"
        )):
            raise ValueError("ChorusTIC supplement must describe one dataset with one reported seed")
        expected_pool = "TRAIN" if row["protocol"].strip().lower() == "fewshot" else "TEST"
        if row["sample_pool"].strip().upper() != expected_pool:
            raise ValueError(f"Unexpected ChorusTIC supplement sample pool: {row['sample_pool']!r}")
        percentage_accuracy(row["accuracy_percent"], CHORUSTIC_SUPPLEMENT_PATH)
    for row in supplement_rows:
        if row["protocol"].strip().lower() != "fewshot":
            continue
        setting = normalize_setting(row["setting"])
        if setting is None:
            raise ValueError(f"Unknown ChorusTIC supplement setting: {row['setting']!r}")
        archive_key = row["suite"].strip().lower()
        if archive_key not in ARCHIVES:
            raise ValueError(f"Unknown ChorusTIC supplement suite: {row['suite']!r}")
        archive = ARCHIVES[archive_key]
        dataset = normalize_dataset(row["dataset"])
        value = percentage_accuracy(row["accuracy_percent"], CHORUSTIC_SUPPLEMENT_PATH)
        fact_key = (archive, dataset, setting)
        if fact_key in chorustic_values:
            if not math.isclose(chorustic_values[fact_key], value, rel_tol=0.0, abs_tol=1e-12):
                raise ValueError(f"Conflicting ChorusTIC supplement result: {fact_key}")
            continue
        chorustic_values[fact_key] = value
        dataset_sets[("ChorusTIC", archive, setting)].add(dataset)
        facts.append(
            {
                "archive": archive,
                "dataset": dataset,
                "method": "ChorusTIC",
                "protocol_id": PROTOCOL_ID,
                "setting": setting,
                "run_id": "chorustic-insectwingbeatsubset-supplement-20260826",
                "seed": "reported-summary",
                "status": "ok",
                "accuracy": value,
                "source": CHORUSTIC_SUPPLEMENT_PATH.relative_to(RESULTS_ROOT).as_posix(),
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
            dataset = normalize_dataset(row["dataset"])
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

    mantisv2_heads = {
        "logreg_scaled": "MantisV2+ScaledLR",
        "rf": "MantisV2+RF",
    }
    for archive_key in ("ucr", "uea", "mvcore66"):
        path = source_root / "Mantisv2" / (
            f"mantisv2_{archive_key}_lowshot_logreg_scaled_rf_seed42_gpu0_"
            "20260821_results.csv"
        )
        rows = read_rows(path)
        register(path, rows)
        for row in rows:
            if row["protocol"].strip().lower() != "fewshot":
                continue
            setting = normalize_setting(row["setting"])
            if setting is None:
                continue
            classifier = row["classifier"].strip().lower()
            if classifier not in mantisv2_heads:
                raise ValueError(f"Unknown MantisV2 classifier in {path}: {classifier!r}")
            archive = ARCHIVES[archive_key]
            dataset = normalize_dataset(row["dataset"])
            method = mantisv2_heads[classifier]
            dataset_sets[("MantisV2", archive, setting)].add(dataset)
            facts.append(
                {
                    "archive": archive,
                    "dataset": dataset,
                    "method": method,
                    "protocol_id": PROTOCOL_ID,
                    "setting": setting,
                    "run_id": "mantisv2-lowshot-20260821",
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
            dataset = normalize_dataset(row["dataset"])
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
            dataset = normalize_dataset(row["dataset"])
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

    for folder, method in (("tabicl", "TabICL"), ("tabiclv2", "TabICLv2")):
        for archive_key in ("ucr", "uea", "mvcore66"):
            path = source_root / folder / archive_key / "sampled_results.csv"
            rows = read_rows(path)
            register(path, rows)
            for row in rows:
                if row["protocol"].strip().lower() != "fewshot":
                    continue
                setting = normalize_setting(row["setting"])
                if setting is None:
                    continue
                if row.get("status", "ok").strip().lower() != "ok":
                    continue
                archive = ARCHIVES[archive_key]
                dataset = normalize_dataset(row["dataset"])
                dataset_sets[(method, archive, setting)].add(dataset)
                facts.append(
                    {
                        "archive": archive,
                        "dataset": dataset,
                        "method": method,
                        "protocol_id": PROTOCOL_ID,
                        "setting": setting,
                        "run_id": f"{folder}-lowshot",
                        "seed": f"sample={row['sample_seed']}",
                        "status": "ok",
                        "accuracy": accuracy(row["accuracy"], path),
                        "source": relative_source(source_root, path),
                    }
                )

    tabicl_supplements = (
        ("tabicl", "TabICL", "tabicl_InsectWingbeatSubset_lowshot.csv"),
        ("tabiclv2", "TabICLv2", "tabicl2_InsectWingbeatSubset_lowshot.csv"),
    )
    for folder, method, filename in tabicl_supplements:
        path = source_root / folder / filename
        rows = read_rows(path)
        register(path, rows)
        if len(rows) != 8:
            raise ValueError(f"Expected 8 {method} supplement rows, found {len(rows)}")
        for row in rows:
            if (
                row["suite"].strip().lower() != "uea"
                or normalize_dataset(row["dataset"]) != "InsectWingbeatSubset"
                or row["model"].strip().lower() != folder
                or row.get("status", "ok").strip().lower() != "ok"
            ):
                raise ValueError(f"Unexpected {method} supplement row in {path}")
            if row["protocol"].strip().lower() != "fewshot":
                continue
            setting = normalize_setting(row["setting"])
            if setting is None:
                raise ValueError(f"Unknown {method} supplement setting: {row['setting']!r}")
            dataset = "InsectWingbeatSubset"
            dataset_sets[(method, "UEA", setting)].add(dataset)
            facts.append(
                {
                    "archive": "UEA",
                    "dataset": dataset,
                    "method": method,
                    "protocol_id": PROTOCOL_ID,
                    "setting": setting,
                    "run_id": f"{folder}-insectwingbeatsubset-supplement-20260827",
                    "seed": f"sample={row['sample_seed']}",
                    "status": "ok",
                    "accuracy": accuracy(row["accuracy"], path),
                    "source": relative_source(source_root, path),
                }
            )

    # The final detail file already includes Crop; do not append patch/backup rows.
    tic_path = source_root / "TIC-FM" / "ucr_lowlabel_TSEncoder_orion_icl_5shot10shot_results.csv"
    tic_rows = read_rows(tic_path)
    register(tic_path, tic_rows)
    tic_keys: set[tuple[str, str]] = set()
    for row in tic_rows:
        setting = normalize_setting(row["setting"])
        if (
            row["suite"] != "ucr"
            or row["protocol"] != "fewshot"
            or setting not in ("5-shot", "10-shot")
            or row["sample_pool"] != "TRAIN"
            or row["sample_seed"] != "0"
            or row["mode"] != "classifier_v2"
            or row["status"] != "ok"
            or row["error"].strip()
        ):
            raise ValueError(f"Unexpected TIC-FM protocol/result: {row}")
        classes = int(row["n_classes"])
        shot = int(setting.split("-")[0])
        if (
            classes < 2
            or int(row["n_classes_support"]) != classes
            or int(row["n_context"]) != shot * classes
            or int(row["n_eval"]) != int(row["n_test"])
            or int(row["n_test"]) <= 0
        ):
            raise ValueError(f"Invalid TIC-FM context/test coverage: {row}")
        dataset = normalize_dataset(row["dataset"])
        key = (setting, dataset)
        if key in tic_keys:
            raise ValueError(f"Duplicate TIC-FM result: {key}")
        tic_keys.add(key)
        dataset_sets[("TIC-FM", "UCR", setting)].add(dataset)
        facts.append({
            "archive": "UCR", "dataset": dataset, "method": "TIC-FM",
            "protocol_id": PROTOCOL_ID, "setting": setting,
            "run_id": "tic-fm-classifier-v2-lowshot-crop-complete-20260913",
            "seed": f"sample={row['sample_seed']}", "status": "ok",
            "accuracy": accuracy(row["acc"], tic_path),
            "source": relative_source(source_root, tic_path),
        })
    for setting in ("5-shot", "10-shot"):
        reference = dataset_sets[("Mantis", "UCR", setting)]
        candidate = dataset_sets[("TIC-FM", "UCR", setting)]
        if candidate != reference:
            raise ValueError(
                f"TIC-FM {setting} dataset mismatch: "
                f"missing={sorted(reference - candidate)} extra={sorted(candidate - reference)}"
            )

    for archive in ("UCR", "UEA", "MVCore66"):
        families = (
            ("Mantis", "MOMENT", "NuTime", "ChorusTIC")
            if archive != "MVCore66"
            else ("MOMENT", "NuTime", "ChorusTIC")
        )
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

            for family in ("MantisV2", "TabICL", "TabICLv2"):
                candidate = dataset_sets[(family, archive, setting)]
                extra = candidate - reference
                if extra:
                    raise ValueError(
                        f"Unexpected datasets for {family} {archive} {setting}: {sorted(extra)[:5]}"
                    )
                if family == "MantisV2" and candidate != reference:
                    raise ValueError(
                        f"Incomplete MantisV2 coverage for {archive} {setting}: "
                        f"missing={sorted(reference - candidate)[:5]}"
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
