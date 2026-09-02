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

export interface CapabilityGroup {
  key: string;
  label: string;
  description: string;
  backboneCount: number;
  configurationCount: number;
}

export interface CapabilityTaxonomy {
  key: string;
  label: string;
  description: string;
  groups: CapabilityGroup[];
}

export interface CapabilityCell {
  property: string;
  bin: string;
  taxonomy: string;
  group: string;
  meanAccuracy: number | null;
  meanRank: number | null;
  coverage: number;
  backboneCount: number;
  configurationCount: number;
  bestCount: number;
  tiedBestCount: number;
  otherCount: number;
}

export interface CapabilityBundle {
  schemaVersion: number;
  dataVersion: string;
  scope: "Overall";
  totalDatasetCount: number;
  configurationCount: number;
  backboneCount: number;
  taxonomies: CapabilityTaxonomy[];
  properties: CapabilityProperty[];
  metadataCoverage: Record<string, number>;
  cells: CapabilityCell[];
  methodology: {
    unit: string;
    resultUniverse: string;
    configurationAggregation: string;
    backboneAggregation: string;
    weighting: string;
    rankDefinition: string;
    outcomeDefinition: string;
    taxonomy: string;
    privacy: string;
  };
}
