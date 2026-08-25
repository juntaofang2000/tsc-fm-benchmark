# Low-shot benchmark data

This directory contains verified per-dataset Low-shot accuracy facts for fixed
per-class label budgets. `source/results_long.csv` is the canonical source used
to generate every displayed aggregate, rank, and coverage count.
`source/dataset_manifest.json` freezes the feasible dataset set for every shot
budget and archive so a partial new method cannot silently change the denominator.

## Protocol

- Settings: 1-shot, 5-shot, and 10-shot per class.
- Sampling seed: 0 for the imported runs.
- Evaluation: official test split; the sampled training context is drawn from
  the training split.
- Missing results are never replaced with zero.
- A method is ranked only when it covers every dataset feasible for the
  selected archive and shot budget.
- Overall combines UCR and UEA dataset rows with equal weight per dataset.
  MVCore66 remains a separate benchmark and is never mixed into Overall.

## Sources included

- MantisV1 frozen features with LR, scaled LR, SVM, RF, kNN, and nearest-centroid heads.
- MOMENT frozen features with LR, SVM, RF, MLP, kNN, and nearest-centroid heads.
- NuTime frozen features with an RF head.

UniShape Low-shot files currently contain aggregate summaries only. They are
recorded in `source/sources_manifest.json`, but excluded from official ranking
until per-dataset results are available.

## Rebuild

```bash
python benchmark-data/low-shot/ucr-uea/scripts/build_results.py
```

To refresh the canonical long table from the local experiment bundle:

```bash
python benchmark-data/low-shot/ucr-uea/scripts/import_local_results.py \
  --source-root "../时序基模发布/results/few-shot"
```

The importer validates identifiers, accuracy ranges, duplicate keys, and
dataset-set agreement across independently produced method families.
