import standardGenerated from "../../../benchmark-data/standard/ucr-uea/generated/leaderboards.json";
import lowShotGenerated from "../../../benchmark-data/low-shot/ucr-uea/generated/leaderboards.json";
import type { EvaluationType, LeaderboardEntry, Track } from "@/types";

export type BenchmarkScope = "Overall" | "UCR" | "UEA" | "MVCore66";
export type LowShotSetting = "1-shot" | "5-shot" | "10-shot";

type GeneratedRow = {
  rank: number;
  method: string;
  avg_accuracy_pct: number;
  avg_rank: number;
  coverage: string;
  ucr_accuracy_pct?: number | null;
  uea_accuracy_pct?: number | null;
  mvcore66_accuracy_pct?: number | null;
};

type StandardData = {
  suites: Record<string, { datasetCount: number; rows: GeneratedRow[] }>;
};

type LowShotData = {
  benchmarks: Record<LowShotSetting, Record<BenchmarkScope, { datasetCount: number; rows: GeneratedRow[] }>>;
};

const standard = standardGenerated as StandardData;
const lowShot = lowShotGenerated as LowShotData;

export function methodSlug(method: string) {
  return method.toLowerCase().replace(/\+/g, "-").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function isInContext(method: string) {
  return ["ChorusTIC", "TIC-FM", "TiCT", "TabICL", "TabICLv2"].includes(method);
}

function metadata(method: string): { category: string; evaluationType: EvaluationType } {
  if (isInContext(method)) {
    return {
      category: method.startsWith("TabICL") ? "Generic ICL" : "Time Series ICL",
      evaluationType: "In-Context",
    };
  }
  return { category: "Frozen TSFM", evaluationType: "Frozen Probe" };
}

function makeEntry(
  row: GeneratedRow,
  scope: BenchmarkScope,
  tracks: Track[],
  components?: Partial<Record<"UCR" | "UEA" | "MVCore66", number | null>>,
): LeaderboardEntry {
  const slug = methodSlug(row.method);
  const methodMetadata = metadata(row.method);
  return {
    id: slug,
    rank: row.rank,
    model: row.method,
    slug,
    organization: "—",
    category: methodMetadata.category,
    avgAccuracy: row.avg_accuracy_pct,
    avgRank: row.avg_rank,
    ucrAccuracy: scope === "UCR" ? row.avg_accuracy_pct : (row.ucr_accuracy_pct ?? components?.UCR ?? null),
    ueaAccuracy: scope === "UEA" ? row.avg_accuracy_pct : (row.uea_accuracy_pct ?? components?.UEA ?? null),
    mvcore66Accuracy: scope === "MVCore66" ? row.avg_accuracy_pct : (row.mvcore66_accuracy_pct ?? components?.MVCore66 ?? null),
    coverage: row.coverage,
    evaluationType: methodMetadata.evaluationType,
    paperUrl: null,
    codeUrl: null,
    checkpointUrl: null,
    isFeatured: row.method === "ChorusTIC",
    tracks,
  };
}

const standardComponentMaps = {
  UCR: new Map(standard.suites.ucr_128.rows.map((row) => [row.method, row.avg_accuracy_pct])),
  UEA: new Map(standard.suites.uea_30.rows.map((row) => [row.method, row.avg_accuracy_pct])),
  MVCore66Only: new Map(standard.suites.mvcore66_only_40.rows.map((row) => [row.method, row.avg_accuracy_pct])),
};

export const standardLeaderboards: Record<BenchmarkScope, LeaderboardEntry[]> = {
  Overall: standard.suites.overall_198.rows.map((row) => makeEntry(
    row,
    "Overall",
    ["Overall", "Standard", metadata(row.method).evaluationType === "In-Context" ? "Training-Free / ICL" : "Frozen-Probe"],
    {
      UCR: standardComponentMaps.UCR.get(row.method),
      UEA: standardComponentMaps.UEA.get(row.method),
      MVCore66: standardComponentMaps.MVCore66Only.get(row.method),
    },
  )),
  UCR: standard.suites.ucr_128.rows.map((row) => makeEntry(
    row,
    "UCR",
    ["Standard", metadata(row.method).evaluationType === "In-Context" ? "Training-Free / ICL" : "Frozen-Probe"],
  )),
  UEA: standard.suites.uea_30.rows.map((row) => makeEntry(
    row,
    "UEA",
    ["Standard", metadata(row.method).evaluationType === "In-Context" ? "Training-Free / ICL" : "Frozen-Probe"],
  )),
  MVCore66: standard.suites.mvcore66_66.rows.map((row) => makeEntry(
    row,
    "MVCore66",
    ["Standard", metadata(row.method).evaluationType === "In-Context" ? "Training-Free / ICL" : "Frozen-Probe"],
  )),
};

export const lowShotLeaderboards: Record<LowShotSetting, Record<BenchmarkScope, LeaderboardEntry[]>> = Object.fromEntries(
  (["1-shot", "5-shot", "10-shot"] as LowShotSetting[]).map((setting) => [
    setting,
    Object.fromEntries(
      (["Overall", "UCR", "UEA", "MVCore66"] as BenchmarkScope[]).map((scope) => [
        scope,
        lowShot.benchmarks[setting][scope].rows.map((row) => makeEntry(row, scope, ["Low-shot", "Frozen-Probe"])),
      ]),
    ),
  ]),
) as Record<LowShotSetting, Record<BenchmarkScope, LeaderboardEntry[]>>;

export const officialLeaderboard = standardLeaderboards.Overall;
export const ucrLeaderboard = standardLeaderboards.UCR;
export const ueaLeaderboard = standardLeaderboards.UEA;

export const allOfficialEntries = [
  ...Object.values(standardLeaderboards).flat(),
  ...Object.values(lowShotLeaderboards).flatMap((byScope) => Object.values(byScope).flat()),
];
