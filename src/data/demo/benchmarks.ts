import type { Benchmark } from "@/types";

export const benchmarkCoverage = {
  benchmarkCount: 3,
  uniqueDatasetCount: 198,
  suiteMembershipCount: 224,
} as const;

export const demoBenchmarks: Benchmark[] = [
  {
    id: "ucr-128",
    name: "UCR-128",
    slug: "ucr",
    datasetCount: 128,
    modality: "Univariate",
    description: "A broad collection of univariate time series classification tasks evaluated with official train/test splits.",
    metric: "Average Accuracy",
  },
  {
    id: "uea-30",
    name: "UEA-30",
    slug: "uea",
    datasetCount: 30,
    modality: "Multivariate",
    description: "Multivariate classification tasks spanning motion, sensing, audio, and physiological domains.",
    metric: "Average Accuracy",
  },
  {
    id: "mvcore-66",
    name: "MVCore66",
    slug: "mvcore66",
    datasetCount: 66,
    modality: "Multivariate core",
    description: "A curated core benchmark for consistent multivariate evaluation across model families.",
    metric: "Average Accuracy",
  },
];

export const oodBenchmarks = [
  { name: "HHAR", domain: "Human activity", shift: "Device and subject shift" },
  { name: "PCL", domain: "Sensor classification", shift: "Acquisition shift" },
  { name: "Spurious-Fourier", domain: "Synthetic control", shift: "Frequency shortcut shift" },
];

export const evaluationTracks = [
  { name: "Standard", description: "Full official training split as context or training data." },
  { name: "Low-shot", description: "Matched label budgets across methods and datasets." },
  { name: "OOD", description: "Controlled distribution shifts with unchanged evaluation rules." },
  { name: "Training-Free / ICL", description: "Predictions without target-specific parameter updates." },
  { name: "Frozen-Probe", description: "Frozen representations with a standardized lightweight probe." },
];
