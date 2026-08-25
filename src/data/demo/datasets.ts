import type { BenchmarkDataset } from "@/types";

export const demoDatasets: Record<string, BenchmarkDataset[]> = {
  ucr: [
    { dataset: "ECG200", trainSize: 100, testSize: 100, length: "96", channels: 1, classes: 2 },
    { dataset: "GunPoint", trainSize: 50, testSize: 150, length: "150", channels: 1, classes: 2 },
    { dataset: "Coffee", trainSize: 28, testSize: 28, length: "286", channels: 1, classes: 2 },
    { dataset: "FordA", trainSize: 3601, testSize: 1320, length: "500", channels: 1, classes: 2 },
    { dataset: "Phoneme", trainSize: 214, testSize: 1896, length: "1024", channels: 1, classes: 39 },
  ],
  uea: [
    { dataset: "BasicMotions", trainSize: 40, testSize: 40, length: "100", channels: 6, classes: 4 },
    { dataset: "CharacterTrajectories", trainSize: 1422, testSize: 1436, length: "Variable", channels: 3, classes: 20 },
    { dataset: "Epilepsy", trainSize: 137, testSize: 138, length: "206", channels: 3, classes: 4 },
    { dataset: "NATOPS", trainSize: 180, testSize: 180, length: "51", channels: 24, classes: 6 },
    { dataset: "PEMS-SF", trainSize: 267, testSize: 173, length: "144", channels: 963, classes: 7 },
  ],
  mvcore66: [
    { dataset: "CoreMotion-01", trainSize: 800, testSize: 200, length: "256", channels: 9, classes: 6 },
    { dataset: "CoreSensor-07", trainSize: 1200, testSize: 300, length: "512", channels: 12, classes: 8 },
    { dataset: "CoreAudio-12", trainSize: 640, testSize: 160, length: "Variable", channels: 4, classes: 10 },
    { dataset: "CorePhysio-18", trainSize: 920, testSize: 230, length: "1024", channels: 6, classes: 5 },
    { dataset: "CoreIndustrial-24", trainSize: null, testSize: null, length: null, channels: null, classes: null },
  ],
};
