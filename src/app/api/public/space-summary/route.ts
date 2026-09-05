import release from "../../../../../public/release.json";
import { siteConfig } from "@/config/site";
import capabilityData from "@/data/official/public-capability-map.json";
import { benchmarkProfile, evaluationTracks } from "@/data/official/benchmark-profile";
import { getLeaderboard } from "@/lib/data/leaderboard";

export const dynamic = "force-static";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store",
};

function officialUrl(path: string) {
  return new URL(path, `${siteConfig.primaryUrl}/`).toString();
}

export async function GET() {
  const topModels = (await getLeaderboard({ track: "Overall", limit: 5 })).map((entry) => ({
    rank: entry.rank,
    model: entry.model,
    slug: entry.slug,
    organization: entry.organization,
    avgAccuracy: entry.avgAccuracy,
    avgRank: entry.avgRank,
    coverage: entry.coverage,
    univariateAccuracy: entry.univariateAccuracy,
    multivariateAccuracy: entry.multivariateAccuracy,
    evaluationType: entry.evaluationType,
  }));

  const payload = {
    schemaVersion: 1,
    contentRevision: release.contentRevision,
    benchmark: {
      totalDatasets: benchmarkProfile.totalDatasetCount,
      univariateDatasets: benchmarkProfile.univariateCount,
      multivariateDatasets: benchmarkProfile.multivariateCount,
      tracks: benchmarkProfile.trackCount,
      primaryMetric: benchmarkProfile.primaryMetric,
    },
    leaderboard: {
      scope: "Overall",
      methodology: "Dataset-level equal weighting",
      topModels,
    },
    evaluationTracks,
    capability: {
      dataVersion: capabilityData.dataVersion,
      configurationCount: capabilityData.configurationCount,
      backboneCount: capabilityData.backboneCount,
      taxonomies: capabilityData.taxonomies.map((taxonomy) => ({
        label: taxonomy.label,
        groups: taxonomy.groups.map((group) => group.label),
      })),
    },
    links: {
      officialSite: officialUrl("/"),
      leaderboard: officialUrl("/leaderboard"),
      datasetProfile: officialUrl("/benchmarks"),
      capabilityMap: officialUrl("/capability-map"),
      evaluation: officialUrl("/evaluation"),
      submit: officialUrl("/submit"),
    },
  };

  return Response.json(payload, {
    headers: {
      ...headers,
      "X-TSCFM-Content-Revision": release.contentRevision,
    },
  });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers });
}
