import {
  allOfficialEntries,
  lowShotLeaderboards,
  officialLeaderboard,
  standardLeaderboards,
} from "@/data/official/leaderboard";
import type { BenchmarkScope, LeaderboardEntry, LowShotSetting, Track } from "@/types";

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
