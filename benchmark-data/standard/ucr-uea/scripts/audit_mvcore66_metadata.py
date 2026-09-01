#!/usr/bin/env python3
"""Audit and append metadata for the 40 MVCore66-only benchmark datasets."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import statistics
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path


FIELDS = [
    "archive",
    "dataset",
    "trainSize",
    "testSize",
    "classes",
    "length",
    "channels",
    "imbalanceRatio",
    "domain",
    "metadataSource",
]


def decode_line(raw: bytes) -> str:
    try:
        return raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        return raw.decode("latin-1")


def parse_split(path: Path) -> dict:
    headers: dict[str, str] = {}
    labels: list[str] = []
    lengths: list[int] = []
    observed_dimensions: set[int] = set()
    digest = hashlib.sha256()
    in_data = False

    with path.open("rb") as handle:
        for raw in handle:
            digest.update(raw)
            line = decode_line(raw).strip()
            if not line or line.startswith("#"):
                continue
            if line.startswith("@"):
                key, _, value = line.partition(" ")
                headers[key.lower()] = value.strip()
                if key.lower() == "@data":
                    in_data = True
                continue
            if not in_data:
                continue
            series, separator, label = line.rpartition(":")
            if not separator:
                raise ValueError(f"Missing class label separator in {path}")
            labels.append(label.strip())
            observed_dimensions.add(series.count(":") + 1)
            first_dimension = series.split(":", 1)[0]
            lengths.append(0 if not first_dimension else len(first_dimension.split(",")))

    if not labels:
        raise ValueError(f"No data rows found in {path}")
    return {
        "headers": headers,
        "labels": labels,
        "lengths": lengths,
        "observedDimensions": observed_dimensions,
        "sha256": digest.hexdigest(),
        "bytes": path.stat().st_size,
    }


def choose_split(folder: Path, split: str) -> Path:
    matches = sorted(folder.glob(f"*_{split}.ts"))
    if len(matches) != 1:
        raise FileNotFoundError(f"Expected one {split} .ts file in {folder}, found {len(matches)}")
    return matches[0]


def class_ratio(labels: list[str]) -> tuple[float, dict[str, int]]:
    counts = Counter(labels)
    ratio = max(counts.values()) / min(counts.values())
    return ratio, dict(sorted(counts.items()))


def parse_dataset(root: Path, dataset: str) -> tuple[dict, dict]:
    folder = root / dataset
    train_path = choose_split(folder, "TRAIN")
    test_path = choose_split(folder, "TEST")
    train = parse_split(train_path)
    test = parse_split(test_path)

    dimensions_raw = train["headers"].get("@dimensions")
    observed_dimensions = train["observedDimensions"] | test["observedDimensions"]
    if len(observed_dimensions) != 1:
        raise ValueError(f"Inconsistent dimensions in {folder}: {sorted(observed_dimensions)}")
    dimensions = int(dimensions_raw) if dimensions_raw else next(iter(observed_dimensions))
    if dimensions not in observed_dimensions:
        raise ValueError(f"Header/observed dimension mismatch in {folder}: {dimensions} vs {sorted(observed_dimensions)}")
    all_labels = train["labels"] + test["labels"]
    all_lengths = train["lengths"] + test["lengths"]
    ratio, train_distribution = class_ratio(train["labels"])

    metadata = {
        "archive": "MVCore66",
        "dataset": dataset,
        "trainSize": len(train["labels"]),
        "testSize": len(test["labels"]),
        "classes": len(set(all_labels)),
        "length": int(round(statistics.median(all_lengths))),
        "channels": dimensions,
        "imbalanceRatio": ratio,
        "domain": "",
        "metadataSource": "MVCore66 evaluation .ts headers and train/test labels; independently checked against the full-train evaluation manifest",
    }
    evidence = {
        "dataset": dataset,
        "trainFile": train_path.name,
        "testFile": test_path.name,
        "trainSha256": train["sha256"],
        "testSha256": test["sha256"],
        "trainBytes": train["bytes"],
        "testBytes": test["bytes"],
        "trainClassDistribution": train_distribution,
        "observedMinLength": min(all_lengths),
        "observedMedianLength": statistics.median(all_lengths),
        "observedMaxLength": max(all_lengths),
        **{key: metadata[key] for key in ("trainSize", "testSize", "classes", "length", "channels", "imbalanceRatio")},
    }
    return metadata, evidence


def read_reference(path: Path) -> dict[str, dict[str, int]]:
    rows: dict[str, dict[str, int]] = {}
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            rows[row["dataset"]] = {
                "trainSize": int(row["n_train"]),
                "testSize": int(row["n_test"]),
                "classes": int(row["n_classes"]),
                "length": int(row["aligned_length"]),
                "channels": int(row["original_channels"]),
            }
    return rows


def write_metadata(path: Path, existing: list[dict], additions: list[dict]) -> int:
    retained = [row for row in existing if row.get("archive") != "MVCore66"]
    combined = sorted(retained + additions, key=lambda row: (row["archive"], row["dataset"]))
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(combined)
    return len(combined)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mvcore-root", required=True, type=Path)
    parser.add_argument("--dataset-list", required=True, type=Path)
    parser.add_argument("--reference-csv", required=True, type=Path)
    parser.add_argument("--metadata-csv", required=True, type=Path)
    parser.add_argument("--audit-json", required=True, type=Path)
    args = parser.parse_args()

    datasets = [line.strip() for line in args.dataset_list.read_text(encoding="utf-8").splitlines() if line.strip()]
    if len(datasets) != 40 or len(set(datasets)) != 40:
        raise ValueError(f"Expected 40 unique dataset names, received {len(datasets)}")

    reference = read_reference(args.reference_csv)
    metadata_rows: list[dict] = []
    evidence_rows: list[dict] = []
    mismatches: list[dict] = []

    for index, dataset in enumerate(datasets, start=1):
        metadata, evidence = parse_dataset(args.mvcore_root, dataset)
        metadata_rows.append(metadata)
        evidence_rows.append(evidence)
        expected = reference.get(dataset)
        if expected is None:
            mismatches.append({"dataset": dataset, "field": "reference", "expected": "present", "observed": "missing"})
        else:
            for field in ("trainSize", "testSize", "classes", "length", "channels"):
                if metadata[field] != expected[field]:
                    mismatches.append({"dataset": dataset, "field": field, "expected": expected[field], "observed": metadata[field]})
        print(f"[{index:02d}/40] {dataset}: train={metadata['trainSize']} test={metadata['testSize']} classes={metadata['classes']} length={metadata['length']} channels={metadata['channels']} imbalance={metadata['imbalanceRatio']:.6g}", flush=True)

    if mismatches:
        raise ValueError(f"Reference cross-check failed: {json.dumps(mismatches, ensure_ascii=False)}")

    with args.metadata_csv.open("r", encoding="utf-8-sig", newline="") as handle:
        existing = list(csv.DictReader(handle))
    total_metadata_rows = write_metadata(args.metadata_csv, existing, metadata_rows)

    audit = {
        "schemaVersion": 1,
        "auditedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "datasetCount": len(metadata_rows),
        "checks": {
            "uniqueDatasetNames": len(set(datasets)) == 40,
            "sourceSplitsPresent": True,
            "requiredFieldsComplete": all(all(row.get(field) not in (None, "") for field in FIELDS if field != "domain") for row in metadata_rows),
            "positiveCounts": all(all(row[field] > 0 for field in ("trainSize", "testSize", "classes", "length", "channels", "imbalanceRatio")) for row in metadata_rows),
            "classCountValid": all(row["classes"] >= 2 for row in metadata_rows),
            "referenceCrossCheckMismatches": 0,
        },
        "referenceCsv": args.reference_csv.name,
        "datasets": evidence_rows,
    }
    args.audit_json.write_text(json.dumps(audit, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {args.metadata_csv} with {total_metadata_rows} total metadata rows.")
    print(f"Wrote {args.audit_json} with {len(evidence_rows)} audited records.")


if __name__ == "__main__":
    main()
