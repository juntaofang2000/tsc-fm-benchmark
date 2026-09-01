import "server-only";

import publicGenerated from "./public-leaderboards.json";
import type {
  BenchmarkScope,
  EvaluationType,
  LeaderboardEntry,
  LowShotSetting,
  Track,
} from "@/types";

type PublicRow = {
  rank: number;
  method: string;
  avgAccuracy: number;
  avgRank: number;
  coverage: string;
  univariateAccuracy?: number | null;
  multivariateAccuracy?: number | null;
};

type PublicData = {
  standard: Record<BenchmarkScope, PublicRow[]>;
  lowShot: Record<LowShotSetting, Record<BenchmarkScope, PublicRow[]>>;
};

const generated = publicGenerated as PublicData;

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

function makeEntry(row: PublicRow, tracks: Track[], scope: BenchmarkScope | "Low-shot"): LeaderboardEntry {
  const slug = methodSlug(row.method);
  const methodMetadata = metadata(row.method);
  return {
    id: slug,
    rank: row.rank,
    model: row.method,
    slug,
    organization: "—",
    category: methodMetadata.category,
    avgAccuracy: row.avgAccuracy,
    avgRank: row.avgRank,
    univariateAccuracy: scope === "Univariate" ? row.avgAccuracy : (row.univariateAccuracy ?? null),
    multivariateAccuracy: scope === "Multivariate" ? row.avgAccuracy : (row.multivariateAccuracy ?? null),
    coverage: row.coverage,
    evaluationType: methodMetadata.evaluationType,
    paperUrl: null,
    codeUrl: null,
    checkpointUrl: null,
    tracks,
  };
}

export const standardLeaderboards: Record<BenchmarkScope, LeaderboardEntry[]> = Object.fromEntries(
  (["Overall", "Univariate", "Multivariate"] as BenchmarkScope[]).map((scope) => [
    scope,
    generated.standard[scope].map((row) => makeEntry(row, [
      ...(scope === "Overall" ? ["Overall" as const] : []),
      "Standard",
      metadata(row.method).evaluationType === "In-Context" ? "Training-Free / ICL" : "Frozen-Probe",
    ], scope)),
  ]),
) as Record<BenchmarkScope, LeaderboardEntry[]>;

export const lowShotLeaderboards: Record<LowShotSetting, Record<BenchmarkScope, LeaderboardEntry[]>> = Object.fromEntries(
  (["5-shot", "10-shot"] as LowShotSetting[]).map((setting) => [
    setting,
    Object.fromEntries(
      (["Overall", "Univariate", "Multivariate"] as BenchmarkScope[]).map((scope) => [
        scope,
        generated.lowShot[setting][scope].map((row) => makeEntry(row, [
          "Low-shot",
          metadata(row.method).evaluationType === "In-Context" ? "Training-Free / ICL" : "Frozen-Probe",
        ], scope)),
      ]),
    ),
  ]),
) as Record<LowShotSetting, Record<BenchmarkScope, LeaderboardEntry[]>>;

export const officialLeaderboard = standardLeaderboards.Overall;

export const allOfficialEntries = [
  ...Object.values(standardLeaderboards).flat(),
  ...Object.values(lowShotLeaderboards).flatMap((scopes) => Object.values(scopes).flat()),
];
