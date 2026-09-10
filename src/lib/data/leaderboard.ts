import {
  allOfficialEntries,
  lowShotLeaderboards,
  officialLeaderboard,
  standardLeaderboards,
} from "@/data/official/leaderboard";
import type { BenchmarkScope, LeaderboardEntry, LowShotSetting, Track, MethodResultGroup } from "@/types";
import { canonicalMethodSlug } from "@/data/official/methods";

export async function getLeaderboard(options?: {
  track?: Track;
  limit?: number;
}): Promise<LeaderboardEntry[]> {
  const track = options?.track ?? "Overall";
  const rows = officialLeaderboard.filter((entry) => entry.tracks.includes(track));
  return options?.limit ? rows.slice(0, options.limit) : rows;
}

export async function getLeaderboardEntry(slug: string) {
  return allOfficialEntries.find((entry) => entry.slug === slug) ?? null;
}

export async function getMethodResults(slug: string): Promise<MethodResultGroup[]> {
  const canonical = canonicalMethodSlug(slug);
  const groups: MethodResultGroup[] = [];
  const settings = { Standard: standardLeaderboards, ...lowShotLeaderboards };
  for (const [setting, scopes] of Object.entries(settings)) {
    for (const [scope, entries] of Object.entries(scopes)) {
      const matches = entries.filter((entry) => canonicalMethodSlug(entry.slug) === canonical);
      if (matches.length) groups.push({ setting: setting as MethodResultGroup["setting"], scope: scope as BenchmarkScope, comparisonCount: entries.length, entries: matches });
    }
  }
  return groups;
}

export async function getStandardLeaderboards() {
  return standardLeaderboards;
}

export async function getLowShotLeaderboards() {
  return lowShotLeaderboards;
}

export async function getStandardLeaderboard(scope: BenchmarkScope) {
  return standardLeaderboards[scope];
}

export async function getLowShotLeaderboard(setting: LowShotSetting, scope: BenchmarkScope = "Overall") {
  return lowShotLeaderboards[setting][scope];
}
