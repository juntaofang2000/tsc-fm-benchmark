export const benchmarkProfile = {
  totalDatasetCount: 198,
  univariateCount: 128,
  multivariateCount: 70,
  trackCount: 4,
  univariateShare: 64.6,
  multivariateShare: 35.4,
  primaryMetric: "Accuracy",
} as const;

export const evaluationTracks = [
  { name: "Standard", description: "Full official training splits with dataset-level equal weighting." },
  { name: "Low-shot", description: "Matched label budgets across methods and feasible datasets." },
  { name: "Training-Free / ICL", description: "Predictions without target-specific parameter updates." },
  { name: "Frozen-Probe", description: "Frozen representations with a standardized lightweight probe." },
];
