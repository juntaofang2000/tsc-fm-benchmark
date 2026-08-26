# Reproducible benchmark result pipeline

This directory stores the per-dataset results used by the ChorusTIC UCR, UEA,
MVCore66, and joint leaderboards. The pipeline is designed so that changing the benchmark
dataset set does not require rerunning unaffected method-dataset experiments.

For Chinese instructions, see [README.zh-CN.md](README.zh-CN.md).

## Source of truth

`source/results_long.csv` is the only editable result source. Each row is one
observed accuracy for one method, dataset, protocol, run, and seed.

```text
archive,dataset,method,protocol_id,run_id,seed,status,accuracy,source
UCR,Adiac,ChorusTIC,paper-standard-v1,run-001,0,ok,0.823529,results/run-001.json
```

Column definitions:

| Column | Meaning |
|---|---|
| `archive` | Dataset namespace: `UCR`, `UEA`, or `MVCore66`. |
| `dataset` | Exact dataset identifier used in the suite list. |
| `method` | Stable method identifier shown in generated tables. |
| `protocol_id` | Evaluation protocol version. Never mix incompatible protocols. |
| `run_id` | Identifier for an experiment batch or independent replicate. |
| `seed` | Random seed or a stable label such as `published`. |
| `status` | `ok` rows are aggregated; other statuses are retained but excluded. |
| `accuracy` | Numeric proportion in `[0, 1]`, not a percentage string. |
| `source` | Log, result file, or other provenance reference. |

Multiple `ok` rows for the same method, dataset, and protocol are averaged
before archive-level aggregation. A row is uniquely identified by archive,
dataset, method, protocol, run ID, and seed. If a completed run is later found
invalid, change its status to `superseded` or `invalid` and append the corrected
run; do not silently overwrite provenance.

## Suite configuration

Suite files live in `suites/*.json`. Dataset membership is stored separately in
`suites/datasets/*.txt`, one exact dataset name per line. Blank lines and lines
beginning with `#` are ignored.

- `ucr_128.json` selects the paper UCR-128 datasets and 11 UCR methods.
- `uea_30.json` selects the paper UEA-30 datasets and 9 UEA methods.
- `mvcore66_66.json` selects all 66 verified MVCore66 tasks and 12 methods.
- `mvcore66_only_40.json` selects the 40 MVCore66 tasks that do not overlap UEA.
- `overall_198.json` combines UCR-128, UEA-30, and MVCore66-only-40 and selects
  the 11 methods with complete 198/198 coverage.
- `overall_158.json` remains an immutable historical UCR+UEA snapshot.

Treat published suite IDs as immutable snapshots. For a changed benchmark,
copy the JSON and dataset list to a new version such as `ucr_v2.json` and
`datasets/ucr_v2.txt`. This preserves the ability to reproduce older tables.

## Build

Run from this directory with Python 3.10 or later. The builder uses only the
Python standard library.

```bash
python scripts/build_results.py
```

Build one suite only:

```bash
python scripts/build_results.py --suite ucr_128
```

For a dry run or automated test, write to a temporary directory without
refreshing the compatibility release files:

```bash
python scripts/build_results.py --output-dir /tmp/benchmark-build --no-release-wide
```

The generated outputs are:

| Output | Purpose |
|---|---|
| `generated/*_per_dataset_accuracy.csv` | Selected long-source values pivoted into a wide table. |
| `generated/*_per_dataset_rank.csv` | Ranks recomputed within every selected dataset. |
| `generated/*_leaderboard.csv` | Mean accuracy, mean rank, coverage, and leaderboard order. |
| `generated/coverage_report.csv` | Coverage and eligibility for every configured method. |
| `generated/missing_results.csv` | Exact method-dataset experiments still required. |
| `generated/BUILD_AUDIT.md` | Source/configuration hashes and build rules. |

## Capability Map data

The website capability analysis is built from these generated per-dataset
tables plus dataset attributes extracted from the official archives:

```bash
python scripts/build_capability_map.py \
  --ucr-root /path/to/UCRArchive_2018 \
  --uea-root /path/to/UEA \
  --web-output /path/to/benchmark-site/src/data/official/capability-map.json
```

The archive arguments refresh `generated/capability_dataset_metadata.csv`.
Once that cache exists, they may be omitted for later result-only rebuilds.
The script writes `generated/capability_map.json`, including task-condition
bins, mean accuracy, mean rank, win/tie/loss, actual coverage, dataset-level
bootstrap intervals, conservative supported-difference summaries, and complete
row-level provenance.

Domain metadata is deliberately left empty until it is manually curated. The
builder never infers domains from names and never replaces missing results with
zero. The Capability Map currently remains a UCR/UEA-only analysis; the official
MVCore66 Standard results are not mixed into it until reviewed task metadata is
available. Low-shot and OOD also remain separate analyses.

## Import verified MVCore66 results

Import the checked source exports before rebuilding the suites:

```bash
python scripts/import_mvcore66_results.py \
  --source-root /path/to/results/standard/MVCore66 \
  --overlap-file /path/to/benchmark_overlap_uea_mvcore66.csv
python scripts/build_results.py --no-release-wide
```

The importer requires the same 66 datasets for all 12 method variants, validates
every accuracy and status, and writes `source/mvcore66_sources_manifest.json`
with source hashes and the frozen overlap policy. It replaces only existing
`MVCore66` facts, leaving UCR and UEA provenance unchanged.

The deduplicated union keeps the UEA record for every one of the 26 UEA/MVCore66
overlaps. The Overall suite therefore contains 128 UCR + 30 UEA + 40
MVCore66-only datasets. The separate MVCore66 leaderboard still evaluates all
66 MVCore66 tasks.

The two legacy release files remain at their original paths for compatibility:

- `ucr_128_per_dataset_accuracy.csv`
- `uea_30_per_dataset_accuracy.csv`

They are generated artifacts. Do not edit them directly.

## Add or remove datasets

### Remove a dataset

1. Create a new suite version rather than changing a published snapshot.
2. Remove the dataset name from the new `suites/datasets/*.txt` file.
3. Run the builder.

No model needs to rerun. The builder filters the fact table, then recomputes all
means and per-dataset average-tie ranks for the reduced suite.

### Add a dataset

1. Add its exact name to the new suite's dataset text file.
2. Run the builder immediately.
3. Read `generated/missing_results.csv` to obtain the precise experiments that
   must be run.
4. Append only those new results to `source/results_long.csv`.
5. Run the builder again. A method becomes leaderboard-eligible only after it
   has complete coverage of the suite.

Existing method-dataset results are reused unchanged.

## Add a method

1. Add the stable method name to the suite's `methods` array.
2. Append available per-dataset facts to `source/results_long.csv`.
3. Run the builder and use `missing_results.csv` as the remaining work queue.

Adding an eligible method changes every method's average rank because ranks are
recomputed within each dataset, but it does not require rerunning existing
predictions.

## Ranking and eligibility rules

For each selected dataset:

1. Only methods with complete suite coverage are ranked.
2. Higher accuracy receives the better rank.
3. Exact ties within `1e-12` receive the average of the occupied ranks.
4. `avg_rank` is the arithmetic mean of those per-dataset ranks.
5. `avg_accuracy` is the unweighted mean across selected datasets.
6. The displayed leaderboard rank is ordered by `avg_accuracy` descending.

The current joint Overall suite therefore uses equal dataset weighting, not
equal archive weighting:

```text
(128 × UCR mean + 30 × UEA mean + 40 × MVCore66-only mean) / 198
```

Only methods with complete `198 / 198` coverage are eligible for Overall.

## Protocol changes

If preprocessing, train/test splits, checkpoints, classifiers, hyperparameter
search, metrics, or evaluation rules change, create a new `protocol_id` and a
new suite version. Old results must not be reused across incompatible protocol
IDs.

## Migration utility

`scripts/import_wide_results.py` created the initial long table and suite files
from the historical wide release tables. It is not part of routine updates and
refuses to replace the fact table unless `--force` is explicitly supplied.
