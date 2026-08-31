"use client";

import { useMemo, useState } from "react";
import type { BenchmarkScope, LeaderboardEntry, LowShotSetting, Track } from "@/types";
import { LeaderboardTable } from "./leaderboard-table";

const tracks: Track[] = ["Overall", "Standard", "Low-shot", "OOD", "Training-Free / ICL", "Frozen-Probe"];
const benchmarkOptions = ["Overall", "Univariate", "Multivariate"] as const;
const lowShotSettings = ["5-shot", "10-shot"] as const;

type Props = {
  standardEntries: Record<BenchmarkScope, LeaderboardEntry[]>;
  lowShotEntries: Record<LowShotSetting, Record<BenchmarkScope, LeaderboardEntry[]>>;
};

export function LeaderboardView({ standardEntries, lowShotEntries }: Props) {
  const [track, setTrack] = useState<Track>("Overall");
  const [benchmark, setBenchmark] = useState<BenchmarkScope>("Overall");
  const [lowShotSetting, setLowShotSetting] = useState<LowShotSetting>("5-shot");
  const [lowShotBenchmark, setLowShotBenchmark] = useState<BenchmarkScope>("Overall");

  const filtered = useMemo(() => {
    if (track === "Standard") return standardEntries[benchmark];
    if (track === "Low-shot") return lowShotEntries[lowShotSetting][lowShotBenchmark];
    if (track === "Overall") return standardEntries.Overall;
    if (track === "OOD") return [];
    return standardEntries.Overall
      .filter((entry) => entry.tracks.includes(track))
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }, [benchmark, lowShotBenchmark, lowShotEntries, lowShotSetting, standardEntries, track]);

  const showBenchmarkSelector = track === "Standard";
  const activeScope = track === "Standard" ? benchmark : track === "Low-shot" ? lowShotBenchmark : "Overall";
  const requiredDatasets = filtered[0]?.coverage.split("/")[1]?.trim();

  return (
    <div>
      <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-border" role="tablist" aria-label="Leaderboard track">
        {tracks.map((item) => (
          <button
            key={item}
            role="tab"
            aria-selected={track === item}
            onClick={() => setTrack(item)}
            className={track === item
              ? "border-b-2 border-primary px-3 py-3 text-sm font-medium text-foreground"
              : "border-b-2 border-transparent px-3 py-3 text-sm text-muted-foreground hover:text-foreground"}
          >
            {item}
          </button>
        ))}
      </div>

      {showBenchmarkSelector && (
        <div className="my-4 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">View</span>
          {benchmarkOptions.map((item) => (
            <button
              key={item}
              onClick={() => setBenchmark(item)}
              className={benchmark === item
                ? "rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                : "rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"}
            >
              {item}
            </button>
          ))}
        </div>
      )}

      {track === "Low-shot" && (
        <div className="my-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">View</span>
            {benchmarkOptions.map((item) => (
              <button
                key={item}
                onClick={() => setLowShotBenchmark(item)}
                className={lowShotBenchmark === item
                  ? "rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                  : "rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Labels per class</span>
            {lowShotSettings.map((item) => (
              <button
                key={item}
                onClick={() => setLowShotSetting(item)}
                className={lowShotSetting === item
                  ? "rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background"
                  : "rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {track === "Standard" && filtered.length > 0 && (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Ranking is recomputed per dataset across all {filtered.length} eligible methods with complete {benchmark.toLowerCase()} coverage
          {requiredDatasets ? ` (${requiredDatasets} datasets)` : ""}; exact ties receive average ranks.
        </p>
      )}
      {track === "Low-shot" && filtered.length > 0 && (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          {lowShotSetting} uses a fixed number of training labels per class. The {lowShotBenchmark} ranking covers {requiredDatasets} feasible datasets;
          every displayed rank is recomputed within this exact modality view, and missing results are never filled with zero.
        </p>
      )}
      {track === "OOD" && (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">OOD remains a Demo track until verified per-dataset results are available.</p>
      )}

      <div className="mt-4">
        <LeaderboardTable
          data={filtered}
          scope={activeScope}
          rankLabel={track === "Training-Free / ICL" || track === "Frozen-Probe" ? "Track Rank" : undefined}
        />
      </div>
    </div>
  );
}
