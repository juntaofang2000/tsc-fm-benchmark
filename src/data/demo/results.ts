import type { DatasetResult } from "@/types";

export const demoDatasetResults: DatasetResult[] = [
  { dataset: "BasicMotions", accuracy: 94.8, rank: 1, runtime: "00:18", memory: "3.2 GB" },
  { dataset: "CharacterTrajectories", accuracy: 91.6, rank: 2, runtime: "01:42", memory: "5.8 GB" },
  { dataset: "Epilepsy", accuracy: 86.2, rank: 2, runtime: "00:31", memory: "3.7 GB" },
  { dataset: "NATOPS", accuracy: 88.4, rank: 1, runtime: "00:46", memory: "4.5 GB" },
  { dataset: "PEMS-SF", accuracy: null, rank: null, runtime: null, memory: null },
];

export const demoLowShot = [
  { shot: "5-shot", accuracy: 67.7 },
  { shot: "10-shot", accuracy: 72.9 },
];
