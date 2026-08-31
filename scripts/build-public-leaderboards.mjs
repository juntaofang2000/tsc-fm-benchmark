import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const standardDir = path.join(root, "benchmark-data", "standard", "ucr-uea", "generated");
const lowShotPath = path.join(root, "benchmark-data", "low-shot", "ucr-uea", "generated", "leaderboards.json");
const outputPath = path.join(root, "src", "data", "official", "public-leaderboards.json");

const standard = JSON.parse(fs.readFileSync(path.join(standardDir, "leaderboards.json"), "utf8"));
const lowShot = JSON.parse(fs.readFileSync(lowShotPath, "utf8"));

function publicRow(row) {
  return {
    rank: row.rank,
    method: row.method,
    avgAccuracy: row.avg_accuracy_pct,
    avgRank: row.avg_rank,
    coverage: row.coverage,
  };
}

function readAccuracyCsv(filename) {
  const [headerLine, ...lines] = fs.readFileSync(path.join(standardDir, filename), "utf8").trim().split(/\r?\n/);
  const headers = headerLine.split(",");
  return lines.map((line) => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function averageRanks(scores) {
  const ordered = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const ranks = new Map();
  let index = 0;
  while (index < ordered.length) {
    let end = index + 1;
    while (end < ordered.length && ordered[end][1] === ordered[index][1]) end += 1;
    const rank = (index + 1 + end) / 2;
    for (let cursor = index; cursor < end; cursor += 1) ranks.set(ordered[cursor][0], rank);
    index = end;
  }
  return ranks;
}

const overallRows = standard.suites.overall_198.rows;
const eligibleMethods = overallRows.map((row) => row.method);
const multivariateDatasets = [
  ...readAccuracyCsv("uea_30_per_dataset_accuracy.csv"),
  ...readAccuracyCsv("mvcore66_only_40_per_dataset_accuracy.csv"),
];

if (multivariateDatasets.length !== 70) {
  throw new Error(`Expected 70 multivariate datasets, received ${multivariateDatasets.length}.`);
}

const rankValues = Object.fromEntries(eligibleMethods.map((method) => [method, []]));
const accuracyValues = Object.fromEntries(eligibleMethods.map((method) => [method, []]));

for (const dataset of multivariateDatasets) {
  const scores = new Map();
  for (const method of eligibleMethods) {
    const score = Number(dataset[method]);
    if (!Number.isFinite(score)) throw new Error(`Missing multivariate score for ${method}.`);
    scores.set(method, score);
    accuracyValues[method].push(score);
  }
  for (const [method, rank] of averageRanks(scores)) rankValues[method].push(rank);
}

const multivariate = eligibleMethods
  .map((method) => ({
    method,
    avgAccuracy: average(accuracyValues[method]) * 100,
    avgRank: average(rankValues[method]),
    coverage: "70 / 70",
  }))
  .sort((a, b) => b.avgAccuracy - a.avgAccuracy)
  .map((row, index) => ({ rank: index + 1, ...row }));

const univariateByMethod = new Map(
  standard.suites.ucr_128.rows.map((row) => [row.method, publicRow(row)]),
);
const multivariateByMethod = new Map(multivariate.map((row) => [row.method, row]));

const output = {
  standard: {
    Overall: overallRows.map((row) => ({
      ...publicRow(row),
      univariateAccuracy: univariateByMethod.get(row.method)?.avgAccuracy ?? null,
      multivariateAccuracy: multivariateByMethod.get(row.method)?.avgAccuracy ?? null,
    })),
    Univariate: standard.suites.ucr_128.rows.map(publicRow),
    Multivariate: multivariate,
  },
  lowShot: Object.fromEntries(
    ["1-shot", "5-shot", "10-shot"].map((setting) => [
      setting,
      lowShot.benchmarks[setting].Overall.rows.map(publicRow),
    ]),
  ),
};

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote ${path.relative(root, outputPath)}.`);
