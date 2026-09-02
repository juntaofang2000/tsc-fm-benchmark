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
  property: string;
  bin: string;
  paradigm: string;
  meanAccuracy: number | null;
  meanRank: number | null;
  coverage: number;
  methodObservations: number;
  wins: number;
  ties: number;
  losses: number;
}

export interface CapabilityBundle {
  schemaVersion: number;
  dataVersion: string;
  totalDatasetCount: number;
  methodCount: number;
  paradigms: string[];
  properties: CapabilityProperty[];
  metadataCoverage: Record<string, number>;
  cells: CapabilityCell[];
  methodology: {
    unit: string;
    missingness: string;
    weighting: string;
    accuracyAggregation: string;
    wtlDefinition: string;
    taxonomy: string;
    privacy: string;
  };
}
