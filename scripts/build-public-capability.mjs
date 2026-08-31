import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const officialDir = path.join(root, "src", "data", "official");
const generatedDir = path.join(root, "benchmark-data", "standard", "ucr-uea", "generated");
const sourcePath = path.join(officialDir, "capability-map.json");
const outputPath = path.join(officialDir, "public-capability-map.json");

const sourceText = fs.readFileSync(sourcePath, "utf8");
const source = JSON.parse(sourceText);
const allowedProperties = new Set(["modality", "trainSize", "classCount", "length", "channels", "imbalance"]);

function readAccuracyCsv(filename) {
  const text = fs.readFileSync(path.join(generatedDir, filename), "utf8").trim();
  const [headerLine, ...lines] = text.split(/\r?\n/);
  const headers = headerLine.split(",");
  return lines.map((line) => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
}

function approximatelyEqual(a, b) {
  return Math.abs(a - b) <= 1e-12;
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function averageRanks(scores) {
  const ordered = [...scores.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const ranks = new Map();
  let index = 0;
  while (index < ordered.length) {
    let end = index + 1;
    while (end < ordered.length && approximatelyEqual(ordered[end][1], ordered[index][1])) end += 1;
    const rank = (index + 1 + end) / 2;
    for (let cursor = index; cursor < end; cursor += 1) ranks.set(ordered[cursor][0], rank);
    index = end;
  }
  return ranks;
}

const methodNames = source.methods.map((method) => method.name);
const methodsByName = new Map(source.methods.map((method) => [method.name, method]));
const lensMethods = (lens) => methodNames.filter((method) => methodsByName.get(method)?.lenses.includes(lens));

function groupScore(dataset, methods) {
  const values = methods.map((method) => dataset.scores.get(method)).filter(Number.isFinite);
  return values.length ? average(values) : null;
}

function publicCell(cell) {
  return {
    property: cell.property,
    bin: cell.bin,
    paradigm: cell.paradigm,
    meanAccuracy: cell.meanAccuracy,
    meanRank: cell.meanRank,
    coverage: cell.coverage,
    methodObservations: cell.methodObservations,
    wins: cell.wins,
    ties: cell.ties,
    losses: cell.losses,
  };
}

const multivariateRows = [
  ...readAccuracyCsv("uea_30_per_dataset_accuracy.csv"),
  ...readAccuracyCsv("mvcore66_only_40_per_dataset_accuracy.csv"),
];

if (multivariateRows.length !== 70) {
  throw new Error(`Expected 70 multivariate datasets, received ${multivariateRows.length}.`);
}

const multivariateDatasets = multivariateRows.map((row) => {
  const scores = new Map();
  for (const method of methodNames) {
    const rawScore = row[method];
    if (rawScore === undefined || rawScore === "") continue;
    const score = Number(rawScore);
    if (Number.isFinite(score)) scores.set(method, score);
  }
  return { scores, ranks: averageRanks(scores) };
});

const multivariateCells = source.paradigms.map((paradigm) => {
  const methods = lensMethods(paradigm);
  const accuracies = [];
  const ranks = [];
  const outcomes = [];
  let methodObservations = 0;

  for (const dataset of multivariateDatasets) {
    const value = groupScore(dataset, methods);
    const rankValues = methods.map((method) => dataset.ranks.get(method)).filter(Number.isFinite);
    methodObservations += methods.filter((method) => dataset.scores.has(method)).length;
    if (value !== null) accuracies.push(value);
    if (rankValues.length) ranks.push(average(rankValues));

    const lensScores = source.paradigms
      .map((lens) => [lens, groupScore(dataset, lensMethods(lens))])
      .filter(([, score]) => score !== null);
    if (value !== null && lensScores.length) {
      const top = Math.max(...lensScores.map(([, score]) => score));
      const tied = lensScores.filter(([, score]) => approximatelyEqual(score, top)).length > 1;
      outcomes.push(approximatelyEqual(value, top) ? (tied ? "tie" : "win") : "loss");
    }
  }

  return {
    property: "modality",
    bin: "multivariate",
    paradigm,
    meanAccuracy: accuracies.length ? average(accuracies) : null,
    meanRank: ranks.length ? average(ranks) : null,
    coverage: accuracies.length,
    methodObservations,
    wins: outcomes.filter((value) => value === "win").length,
    ties: outcomes.filter((value) => value === "tie").length,
    losses: outcomes.filter((value) => value === "loss").length,
  };
});

const retainedCells = source.cells
  .filter((cell) => cell.scope === "Overall" && allowedProperties.has(cell.property))
  .filter((cell) => cell.property !== "modality" || cell.bin === "univariate")
  .map(publicCell);

const digest = crypto
  .createHash("sha256")
  .update(sourceText)
  .update(fs.readFileSync(path.join(generatedDir, "mvcore66_only_40_per_dataset_accuracy.csv")))
  .digest("hex")
  .slice(0, 12);

const output = {
  schemaVersion: 2,
  dataVersion: `capability-public-${digest}`,
  totalDatasetCount: 198,
  methodCount: source.methodCount,
  paradigms: source.paradigms,
  properties: source.properties.filter((property) => allowedProperties.has(property.key)),
  metadataCoverage: {
    modality: 198,
    trainSize: 158,
    classCount: 158,
    length: 158,
    channels: 158,
    imbalance: 158,
  },
  cells: [...retainedCells, ...multivariateCells],
  methodology: {
    unit: "Dataset",
    missingness: "Missing method–dataset results are excluded and are never replaced with zero.",
    weighting: "Each contributing dataset receives equal weight within its selected condition bin.",
    taxonomy: "Decision-interface groups are mutually exclusive; model-origin lenses may overlap and are descriptive only.",
    privacy: "Only aggregate condition-level statistics are published. Dataset identities and source mappings are excluded.",
  },
};

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote ${path.relative(root, outputPath)}.`);
