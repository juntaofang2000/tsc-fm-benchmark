import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const officialDir = path.join(root, "src", "data", "official");
const benchmarkDir = path.join(root, "benchmark-data", "standard", "ucr-uea");
const generatedDir = path.join(benchmarkDir, "generated");
const sourcePath = path.join(officialDir, "capability-map.json");
const leaderboardPath = path.join(generatedDir, "leaderboards.json");
const taxonomyPath = path.join(benchmarkDir, "capability_taxonomy.json");
const outputPath = path.join(officialDir, "public-capability-map.json");
const metadataPath = path.join(generatedDir, "capability_dataset_metadata.csv");
const domainPath = path.join(generatedDir, "capability_dataset_domains.json");
const overallAccuracyPath = path.join(generatedDir, "overall_198_per_dataset_accuracy.csv");

const sourceText = fs.readFileSync(sourcePath, "utf8");
const source = JSON.parse(sourceText);
const leaderboardText = fs.readFileSync(leaderboardPath, "utf8");
const leaderboard = JSON.parse(leaderboardText);
const taxonomyText = fs.readFileSync(taxonomyPath, "utf8");
const taxonomySource = JSON.parse(taxonomyText);
const domainSourceText = fs.readFileSync(domainPath, "utf8");
const domainSource = JSON.parse(domainSourceText);

const allowedProperties = new Set(["modality", "trainSize", "classCount", "length", "channels", "imbalance", "domain"]);
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

function assertSameSet(actual, expected, label) {
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  const missing = expected.filter((value) => !actualSet.has(value));
  const unexpected = actual.filter((value) => !expectedSet.has(value));
  if (actualSet.size !== actual.length || expectedSet.size !== expected.length || missing.length || unexpected.length) {
    throw new Error(`${label} mismatch; missing: ${missing.join(", ") || "none"}; unexpected: ${unexpected.join(", ") || "none"}.`);
  }
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

if (taxonomySource.scope !== "Overall" || taxonomySource.requiredDatasets !== 198) {
  throw new Error("Capability taxonomy must define the fixed Overall 198 scope.");
}
if (taxonomySource.backbones.length !== 7) {
  throw new Error(`Expected 7 fixed backbones, received ${taxonomySource.backbones.length}.`);
}
const configurationNames = taxonomySource.backbones.flatMap((backbone) => backbone.configurations);
if (configurationNames.length !== 12) {
  throw new Error(`Expected 12 fixed configurations, received ${configurationNames.length}.`);
}

const overallRows = leaderboard.suites.overall_198.rows;
const eligibleMethods = overallRows.map((row) => row.method);
if (overallRows.length !== 12 || overallRows.some((row) => row.coverage !== "198 / 198")) {
  throw new Error("Standard Overall must contain exactly 12 configurations with 198 / 198 coverage.");
}
assertSameSet(configurationNames, eligibleMethods, "Capability and Standard Overall method universe");

for (const taxonomy of taxonomySource.taxonomies) {
  const groupKeys = taxonomy.groups.map((group) => group.key);
  if (new Set(groupKeys).size !== groupKeys.length) throw new Error(`Duplicate group in taxonomy ${taxonomy.key}.`);
  for (const backbone of taxonomySource.backbones) {
    const group = backbone.groups[taxonomy.key];
    if (!groupKeys.includes(group)) throw new Error(`Backbone ${backbone.key} has no valid ${taxonomy.key} group.`);
  }
  for (const group of groupKeys) {
    if (!taxonomySource.backbones.some((backbone) => backbone.groups[taxonomy.key] === group)) {
      throw new Error(`Taxonomy group ${taxonomy.key}/${group} has no backbone.`);
    }
  }
}

const accuracyRows = readCsv(overallAccuracyPath);
if (accuracyRows.length !== 198) throw new Error(`Expected 198 Overall accuracy rows, received ${accuracyRows.length}.`);

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
  if (!metadata) throw new Error(`Missing metadata for ${datasetKey}.`);

  const configurationScores = new Map(configurationNames.map((configuration) => {
    const score = Number(row[configuration]);
    if (!Number.isFinite(score)) throw new Error(`Missing fixed-core score for ${datasetKey}/${configuration}.`);
    return [configuration, score];
  }));
  const backboneScores = new Map(taxonomySource.backbones.map((backbone) => [
    backbone.key,
    average(backbone.configurations.map((configuration) => configurationScores.get(configuration))),
  ]));
  const taxonomyScores = new Map();
  const taxonomyRanks = new Map();
  for (const taxonomy of taxonomySource.taxonomies) {
    const scores = new Map(taxonomy.groups.map((group) => {
      const backbones = taxonomySource.backbones
        .filter((backbone) => backbone.groups[taxonomy.key] === group.key)
        .map((backbone) => backboneScores.get(backbone.key));
      return [group.key, average(backbones)];
    }));
    taxonomyScores.set(taxonomy.key, scores);
    taxonomyRanks.set(taxonomy.key, averageRanks(scores));
  }

  return {
    metadata: { ...metadata, domain: domainByDataset.get(datasetKey) },
    taxonomyScores,
    taxonomyRanks,
  };
});

const publicProperties = source.properties
  .filter((property) => allowedProperties.has(property.key))
  .map((property) => property.key === "domain" ? { ...property, bins: domainBins } : property);

const publicTaxonomies = taxonomySource.taxonomies.map((taxonomy) => ({
  key: taxonomy.key,
  label: taxonomy.label,
  description: taxonomy.description,
  groups: taxonomy.groups.map((group) => {
    const backbones = taxonomySource.backbones.filter((backbone) => backbone.groups[taxonomy.key] === group.key);
    return {
      ...group,
      backboneCount: backbones.length,
      configurationCount: backbones.reduce((sum, backbone) => sum + backbone.configurations.length, 0),
    };
  }),
}));

const computedCells = publicProperties.flatMap((property) => property.bins.flatMap((bin) => {
  const selected = datasets.filter((dataset) => propertyBin(dataset.metadata, property.key) === bin.key);
  return publicTaxonomies.flatMap((taxonomy) => taxonomy.groups.map((group) => {
    const accuracies = [];
    const ranks = [];
    const outcomes = [];
    for (const dataset of selected) {
      const scores = dataset.taxonomyScores.get(taxonomy.key);
      const ranksByGroup = dataset.taxonomyRanks.get(taxonomy.key);
      const value = scores.get(group.key);
      const top = Math.max(...scores.values());
      const tiedTop = [...scores.values()].filter((score) => approximatelyEqual(score, top)).length > 1;
      accuracies.push(value);
      ranks.push(ranksByGroup.get(group.key));
      outcomes.push(approximatelyEqual(value, top) ? (tiedTop ? "tied-best" : "best") : "other");
    }
    const bestCount = outcomes.filter((value) => value === "best").length;
    const tiedBestCount = outcomes.filter((value) => value === "tied-best").length;
    const otherCount = outcomes.filter((value) => value === "other").length;
    if (bestCount + tiedBestCount + otherCount !== selected.length) {
      throw new Error(`Outcome count mismatch for ${property.key}/${bin.key}/${taxonomy.key}/${group.key}.`);
    }
    return {
      property: property.key,
      bin: bin.key,
      taxonomy: taxonomy.key,
      group: group.key,
      meanAccuracy: accuracies.length ? average(accuracies) : null,
      meanRank: ranks.length ? average(ranks) : null,
      coverage: accuracies.length,
      backboneCount: group.backboneCount,
      configurationCount: group.configurationCount,
      bestCount,
      tiedBestCount,
      otherCount,
    };
  }));
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
  .update(leaderboardText)
  .update(taxonomyText)
  .update(fs.readFileSync(metadataPath))
  .update(domainSourceText)
  .update(fs.readFileSync(overallAccuracyPath))
  .digest("hex")
  .slice(0, 12);

const output = {
  schemaVersion: 3,
  dataVersion: `capability-overall-${digest}`,
  scope: "Overall",
  totalDatasetCount: 198,
  configurationCount: configurationNames.length,
  backboneCount: taxonomySource.backbones.length,
  taxonomies: publicTaxonomies,
  properties: publicProperties,
  metadataCoverage,
  cells: computedCells,
  methodology: {
    unit: "Dataset",
    resultUniverse: "The fixed core matches the Standard Overall leaderboard: 12 configurations across 7 backbones, each with complete 198 / 198 coverage.",
    configurationAggregation: "For each dataset, configuration accuracies are averaged within their shared backbone.",
    backboneAggregation: "Backbone scores are then averaged with equal backbone weight within each taxonomy group.",
    weighting: "The resulting group scores are averaged with equal dataset weight within the selected condition.",
    rankDefinition: "Average Rank ranks the mutually exclusive groups within the active taxonomy on each dataset, using average ranks for exact ties.",
    outcomeDefinition: "Best / Tied Best / Other counts whether a group is uniquely highest / tied for highest / below the highest within the active taxonomy on each dataset.",
    taxonomy: "Evaluation Paradigm and Model Origin are separate taxonomies. Groups are mutually exclusive within each taxonomy and are never ranked across taxonomies.",
    privacy: "Only aggregate condition-level statistics are published. Dataset identities, source mappings, backbone names, and configuration names are excluded.",
  },
};

fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Wrote ${path.relative(root, outputPath)}.`);
