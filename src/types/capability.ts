export type CapabilityScope = "Overall" | "UCR" | "UEA";

export interface CapabilityMethod {
  name: string;
  primary: string;
  lenses: string[];
}

export interface CapabilityBin {
  key: string;
  label: string;
  description: string;
}

export interface CapabilityProperty {
  key: string;
  label: string;
  bins: CapabilityBin[];
}

export interface CapabilityCell {
  scope: CapabilityScope;
  property: string;
  bin: string;
  paradigm: string;
  meanAccuracy: number | null;
  accuracyCi95: [number | null, number | null];
  meanRank: number | null;
  rankCi95: [number | null, number | null];
  coverage: number;
  methodObservations: number;
  wins: number;
  ties: number;
  losses: number;
}

export interface CapabilitySummary {
  scope: CapabilityScope;
  property: string;
  bin: string;
  winner: string;
  runnerUp: string;
  coverage: number;
  meanDifference: number | null;
  differenceCi95: [number | null, number | null];
  adjustedP: number;
  supported: boolean;
  message: string;
}

export interface CapabilityDataset {
  archive: "UCR" | "UEA";
  dataset: string;
  scores: Record<string, number>;
  ranks: Record<string, number>;
  trainSize: number | null;
  testSize: number | null;
  classes: number | null;
  length: number | null;
  channels: number | null;
  imbalanceRatio: number | null;
  domain: string | null;
  bins: Record<string, string | null>;
  bestModels: string[];
  bestParadigms: string[];
  resultSource: string;
  metadataSource: string;
}

export interface CapabilityBundle {
  schemaVersion: number;
  dataVersion: string;
  generatedAt: string;
  datasetCount: number;
  methodCount: number;
  methods: CapabilityMethod[];
  paradigms: string[];
  primaryParadigms: string[];
  properties: CapabilityProperty[];
  metadataCoverage: Record<string, number>;
  cells: CapabilityCell[];
  summaries: CapabilitySummary[];
  datasets: CapabilityDataset[];
  methodology: {
    unit: string;
    bootstrap: string;
    claimRule: string;
    missingness: string;
    taxonomy: string;
    domain: string;
  };
  sources: string[];
  demoTracks: string[];
}
