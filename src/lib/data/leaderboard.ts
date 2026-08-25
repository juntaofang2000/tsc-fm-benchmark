import { officialLeaderboard, ucrLeaderboard } from "@/data/official/leaderboard";
import type { LeaderboardEntry, Track } from "@/types";

export async function getLeaderboard(options?: {
  track?: Track;
  limit?: number;
}): Promise<LeaderboardEntry[]> {
  const track = options?.track ?? "Overall";
  const rows = officialLeaderboard.filter((entry) => entry.tracks.includes(track));
  return options?.limit ? rows.slice(0, options.limit) : rows;
}

export async function getLeaderboardEntry(slug: string) {
  return officialLeaderboard.find((entry) => entry.slug === slug)
    ?? ucrLeaderboard.find((entry) => entry.slug === slug)
    ?? null;
}

export async function getUcrLeaderboard() {
  return ucrLeaderboard;
}
