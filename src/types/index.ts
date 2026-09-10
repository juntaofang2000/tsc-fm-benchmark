export type Track =
  | "Overall"
  | "Standard"
  | "Low-shot"
  | "Training-Free / ICL"
  | "Frozen-Probe";

export type EvaluationType =
  | "Foundation Model"
  | "Representation Model"
  | "Supervised Baseline"
  | "In-Context"
  | "Frozen Probe";

export interface LeaderboardEntry {
  id: string;
  rank: number;
  model: string;
  slug: string;
  organization: string;
  category: string;
  avgAccuracy: number | null;
  avgRank: number | null;
  univariateAccuracy: number | null;
  multivariateAccuracy: number | null;
  coverage: string;
  evaluationType: EvaluationType;
  paperUrl: string | null;
  codeUrl: string | null;
  checkpointUrl: string | null;
  tracks: Track[];
}

export type BenchmarkScope = "Overall" | "Univariate" | "Multivariate";

export type LowShotSetting = "5-shot" | "10-shot";

export interface MethodResultGroup {
  setting: "Standard" | LowShotSetting;
  scope: BenchmarkScope;
  comparisonCount: number;
  entries: LeaderboardEntry[];
}

export interface Method {
  id: string;
  name: string;
  slug: string;
  organization: string;
  category: string;
  description: string;
  paperUrl: string | null;
  codeUrl: string | null;
  checkpointUrl: string | null;
  checkpointName: string;
  parameterCount: string | null;
  evaluatedConfigurations: string[];
  inputType: string;
  inferenceParadigm: string;
  evaluationStatus: "Complete" | "Partial" | "Planned";
}

export interface BenchmarkDataset {
  dataset: string;
  trainSize: number | null;
  testSize: number | null;
  length: string | null;
  channels: number | null;
  classes: number | null;
}

export interface DatasetResult {
  dataset: string;
  accuracy: number | null;
  rank: number | null;
  runtime: string | null;
  memory: string | null;
}
