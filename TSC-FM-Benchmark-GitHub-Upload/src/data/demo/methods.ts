import type { Method } from "@/types";

// Method metadata is intentionally conservative. Performance values live in
// src/data/official/leaderboard.ts and are not duplicated here.
export const demoMethods: Method[] = [
  {
    id: "chorustic", name: "ChorusTIC", slug: "chorustic", organization: "—",
    category: "In-Context Learning",
    description: "A support-conditioned foundation model for univariate and multivariate time series classification.",
    paperUrl: null, codeUrl: null, checkpointUrl: null, parameterCount: "—",
    inputType: "Univariate + multivariate time series", inferenceParadigm: "Training-free in-context classification", evaluationStatus: "Complete",
  },
  {
    id: "mantisv2-lr", name: "MantisV2+LR", slug: "mantisv2-lr", organization: "—",
    category: "Representation Learning", description: "Frozen MantisV2 representations evaluated with a logistic-regression probe.",
    paperUrl: null, codeUrl: null, checkpointUrl: null, parameterCount: "—", inputType: "Time series", inferenceParadigm: "Frozen probe", evaluationStatus: "Complete",
  },
  {
    id: "unishape-rf", name: "UniShape+RF", slug: "unishape-rf", organization: "—",
    category: "Representation Learning", description: "Frozen UniShape representations evaluated with a random-forest probe.",
    paperUrl: null, codeUrl: null, checkpointUrl: null, parameterCount: "—", inputType: "Time series", inferenceParadigm: "Frozen probe", evaluationStatus: "Complete",
  },
  {
    id: "mantisv2-rf", name: "MantisV2+RF", slug: "mantisv2-rf", organization: "—",
    category: "Representation Learning", description: "Frozen MantisV2 representations evaluated with a random-forest probe.",
    paperUrl: null, codeUrl: null, checkpointUrl: null, parameterCount: "—", inputType: "Time series", inferenceParadigm: "Frozen probe", evaluationStatus: "Complete",
  },
  {
    id: "mantis-rf", name: "Mantis+RF", slug: "mantis-rf", organization: "—",
    category: "Representation Learning", description: "Frozen Mantis representations evaluated with a random-forest probe.",
    paperUrl: null, codeUrl: null, checkpointUrl: null, parameterCount: "—", inputType: "Time series", inferenceParadigm: "Frozen probe", evaluationStatus: "Complete",
  },
  {
    id: "tabiclv2", name: "TabICLv2", slug: "tabiclv2", organization: "—",
    category: "In-Context Learning", description: "A generic tabular in-context learner evaluated on vectorized time series inputs.",
    paperUrl: null, codeUrl: null, checkpointUrl: null, parameterCount: "—", inputType: "Vectorized time series", inferenceParadigm: "In-context", evaluationStatus: "Complete",
  },
  {
    id: "moment-svm", name: "MOMENT+SVM", slug: "moment-svm", organization: "—",
    category: "Representation Learning", description: "Frozen MOMENT representations evaluated with an SVM classifier.",
    paperUrl: null, codeUrl: null, checkpointUrl: null, parameterCount: "—", inputType: "Time series", inferenceParadigm: "Frozen probe", evaluationStatus: "Complete",
  },
  {
    id: "tabicl", name: "TabICL", slug: "tabicl", organization: "—",
    category: "In-Context Learning", description: "A generic tabular in-context learner evaluated on vectorized time series inputs.",
    paperUrl: null, codeUrl: null, checkpointUrl: null, parameterCount: "—", inputType: "Vectorized time series", inferenceParadigm: "In-context", evaluationStatus: "Complete",
  },
  {
    id: "nutime-rf", name: "NuTime+RF", slug: "nutime-rf", organization: "—",
    category: "Representation Learning", description: "Frozen NuTime representations evaluated with a random-forest probe.",
    paperUrl: null, codeUrl: null, checkpointUrl: null, parameterCount: "—", inputType: "Time series", inferenceParadigm: "Frozen probe", evaluationStatus: "Complete",
  },
  {
    id: "tic-fm", name: "TIC-FM", slug: "tic-fm", organization: "—",
    category: "In-Context Learning", description: "A training-free in-context classifier evaluated across the complete UCR-128 archive.",
    paperUrl: null, codeUrl: null, checkpointUrl: null, parameterCount: "—", inputType: "Univariate time series", inferenceParadigm: "Training-free in-context classification", evaluationStatus: "Complete",
  },
  {
    id: "tict", name: "TiCT", slug: "tict", organization: "—",
    category: "In-Context Learning", description: "A synthetically pretrained in-context time series classifier evaluated across the complete UCR-128 archive.",
    paperUrl: null, codeUrl: null, checkpointUrl: null, parameterCount: "—", inputType: "Univariate time series", inferenceParadigm: "Training-free in-context classification", evaluationStatus: "Complete",
  },
];
