import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const officialDir = path.join(root, "src", "data", "official");
const generatedDir = path.join(root, "benchmark-data", "standard", "ucr-uea", "generated");
const sourcePath = path.join(officialDir, "capability-map.json");
const outputPath = path.join(officialDir, "public-capability-map.json");
const metadataPath = path.join(generatedDir, "capability_dataset_metadata.csv");
const domainPath = path.join(generatedDir, "capability_dataset_domains.json");

const sourceText = fs.readFileSync(sourcePath, "utf8");
const source = JSON.parse(sourceText);
const allowedProperties = new Set(["modality", "trainSize", "classCount", "length", "channels", "imbalance", "domain"]);
const domainSourceText = fs.readFileSync(domainPath, "utf8");
const domainSource = JSON.parse(domainSourceText);
const domainBins = [
  { key: "healthcare-biomedical", label: "Healthcare & Biomedical", description: "Clinical, physiological and biomedical tasks" },
  { key: "human-activity-motion", label: "Human Activity & Motion", description: "Human actions, gestures, sports and rehabilitation" },
  { key: "industrial-engineering", label: "Industrial & Engineering", description: "Machines, manufacturing, devices and robotics" },
  { key: "environment-energy", label: "Environment & Energy", description: "Weather, ecology, land cover and power" },
  { key: "audio-speech", label: "Audio & Speech", description: "Speech, acoustics and wingbeat sound" },
  { key: "image-shape-trajectory", label: "Image, Shape & Trajectory", description: "Visual outlines, shapes and writing trajectories" },
  { key: "transportation-mobility", label: "Transportation & Mobility", description: "Traffic, vehicles, driving and road condition" },
  { key: "synthetic-other", label: "Synthetic & Other", description: "Simulations and uncategorized real-world tasks" },
];
const domainKeyByLabel = new Map(domainBins.map((bin) => [bin.label, bin.key]));

function readCsv(filePath) {
  const text = fs.readFileSync(filePath, "utf8").trim();
  const [headerLine, ...lines] = text.split(/\r?\n/);
  const headers = headerLine.split(",");
  return lines.map((line) => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
}

function readAccuracyCsv(filename) {
  return readCsv(path.join(generatedDir, filename));
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

function propertyBin(metadata, property) {
  const trainSize = Number(metadata.trainSize);
  const classes = Number(metadata.classes);
  const length = Number(metadata.length);
  const channels = Number(metadata.channels);
  const imbalance = Number(metadata.imbalanceRatio);
  switch (property) {
    case "modality": return channels === 1 ? "univariate" : "multivariate";
    case "trainSize": return trainSize <= 100 ? "small" : trainSize <= 500 ? "medium" : "large";
    case "classCount": return classes === 2 ? "binary" : classes <= 10 ? "3-10" : ">10";
    case "length": return length <= 200 ? "short" : length <= 500 ? "medium" : "long";
    case "channels": return channels === 1 ? "univariate" : channels <= 10 ? "low-mv" : "high-mv";
    case "imbalance": return imbalance <= 1.5 ? "balanced" : imbalance <= 3 ? "moderate" : "severe";
    case "domain": return domainKeyByLabel.get(metadata.domain) ?? null;
    default: throw new Error(`Unsupported capability property: ${property}`);
  }
}

const accuracyRows = [
  ...readAccuracyCsv("ucr_128_per_dataset_accuracy.csv"),
  ...readAccuracyCsv("uea_30_per_dataset_accuracy.csv"),
  ...readAccuracyCsv("mvcore66_only_40_per_dataset_accuracy.csv"),
];
if (accuracyRows.length !== 198) throw new Error(`Expected 198 accuracy rows, received ${accuracyRows.length}.`);

const metadataRows = readCsv(metadataPath);
const metadataByDataset = new Map(metadataRows.map((row) => [`${row.archive}::${row.dataset}`, row]));
if (metadataByDataset.size !== 198) throw new Error(`Expected 198 unique metadata rows, received ${metadataByDataset.size}.`);

const domainByDataset = new Map();
for (const [domain, datasetKeys] of Object.entries(domainSource.domains)) {
  if (!domainKeyByLabel.has(domain)) throw new Error(`Unsupported curated domain: ${domain}.`);
  for (const datasetKey of datasetKeys) {
    if (domainByDataset.has(datasetKey)) throw new Error(`Duplicate curated domain mapping for ${datasetKey}.`);
    domainByDataset.set(datasetKey, domain);
  }
}
if (domainByDataset.size !== 198) throw new Error(`Expected 198 curated domain mappings, received ${domainByDataset.size}.`);
for (const datasetKey of metadataByDataset.keys()) {
  if (!domainByDataset.has(datasetKey)) throw new Error(`Missing curated domain mapping for ${datasetKey}.`);
}

const datasets = accuracyRows.map((row) => {
  const datasetKey = `${row.archive}::${row.dataset}`;
  const metadata = metadataByDataset.get(datasetKey);
  if (!metadata) throw new Error(`Missing metadata for ${row.archive}::${row.dataset}.`);
  const scores = new Map();
  for (const method of methodNames) {
    const rawScore = row[method];
    if (rawScore === undefined || rawScore === "") continue;
    const score = Number(rawScore);
    if (Number.isFinite(score)) scores.set(method, score);
  }
  return { metadata: { ...metadata, domain: domainByDataset.get(datasetKey) }, scores, ranks: averageRanks(scores) };
});

const publicProperties = source.properties
  .filter((property) => allowedProperties.has(property.key))
  .map((property) => property.key === "domain" ? { ...property, bins: domainBins } : property);
const computedCells = publicProperties.flatMap((property) => property.bins.flatMap((bin) => {
  const selected = datasets.filter((dataset) => propertyBin(dataset.metadata, property.key) === bin.key);
  return source.paradigms.map((paradigm) => {
    const methods = lensMethods(paradigm);
    const accuracies = [];
    const ranks = [];
    const outcomes = [];
    let methodObservations = 0;

    for (const dataset of selected) {
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

    return publicCell({
      property: property.key,
      bin: bin.key,
      paradigm,
      meanAccuracy: accuracies.length ? average(accuracies) : null,
      meanRank: ranks.length ? average(ranks) : null,
      coverage: accuracies.length,
      methodObservations,
      wins: outcomes.filter((value) => value === "win").length,
      ties: outcomes.filter((value) => value === "tie").length,
      losses: outcomes.filter((value) => value === "loss").length,
    });
  });
}));

const metadataCoverage = Object.fromEntries(publicProperties.map((property) => [
  property.key,
  datasets.filter((dataset) => propertyBin(dataset.metadata, property.key) !== null).length,
]));
for (const [property, coverage] of Object.entries(metadataCoverage)) {
  if (coverage !== 198) throw new Error(`Expected complete ${property} metadata, received ${coverage}/198.`);
}

const digest = crypto
  .createHash("sha256")
  .update(sourceText)
  .update(fs.readFileSync(metadataPath))
  .update(domainSourceText)
  .update(fs.readFileSync(path.join(generatedDir, "ucr_128_per_dataset_accuracy.csv")))
  .update(fs.readFileSync(path.join(generatedDir, "uea_30_per_dataset_accuracy.csv")))
  .update(fs.readFileSync(path.join(generatedDir, "mvcore66_only_40_per_dataset_accuracy.csv")))
  .digest("hex")
  .slice(0, 12);

const output = {
  schemaVersion: 2,
  dataVersion: `capability-public-${digest}`,
  totalDatasetCount: 198,
  methodCount: source.methodCount,
  paradigms: source.paradigms,
  properties: publicProperties,
  metadataCoverage,
  cells: computedCells,
  methodology: {
    unit: "Dataset",
    missingness: "Missing method–dataset results are excluded and are never replaced with zero.",
    weighting: "Each contributing dataset receives equal weight within its selected condition bin.",
    accuracyAggregation: "For each dataset, Accuracy first averages all available method accuracies assigned to the paradigm or lens. These dataset-level scores are then averaged with equal dataset weight within the selected condition.",
    wtlDefinition: "W / T / L counts datasets where the paradigm- or lens-level score is uniquely best / tied for best / below the best among all displayed paradigms and lenses on that dataset. It is not a pairwise comparison against ChorusTIC or any fixed baseline; ties use a 1e-12 numerical tolerance.",
    taxonomy: "Decision-interface groups are mutually exclusive; model-origin lenses may overlap and are descriptive only.",
    privacy: "Only aggregate condition-level statistics are published. Dataset identities and source mappings are excluded.",
  },
};

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote ${path.relative(root, outputPath)}.`);
