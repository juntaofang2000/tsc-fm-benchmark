export type Track =
  | "Overall"
  | "Standard"
  | "Low-shot"
  | "OOD"
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
  ucrAccuracy: number | null;
  ueaAccuracy: number | null;
  mvcore66Accuracy: number | null;
  coverage: string;
  evaluationType: EvaluationType;
  paperUrl: string | null;
  codeUrl: string | null;
  checkpointUrl: string | null;
  isFeatured: boolean;
  tracks: Track[];
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
  parameterCount: string | null;
  inputType: string;
  inferenceParadigm: string;
  evaluationStatus: "Complete" | "Partial" | "Planned";
}

export interface Benchmark {
  id: string;
  name: string;
  slug: "ucr" | "uea" | "mvcore66";
  datasetCount: number;
  modality: string;
  description: string;
  metric: string;
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
