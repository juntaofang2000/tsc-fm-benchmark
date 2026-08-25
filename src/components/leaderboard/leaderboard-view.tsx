"use client";

import { useMemo, useState } from "react";
import type { LeaderboardEntry, Track } from "@/types";
import type { BenchmarkScope, LowShotSetting } from "@/data/official/leaderboard";
import { LeaderboardTable } from "./leaderboard-table";

const tracks: Track[] = ["Overall", "Standard", "Low-shot", "OOD", "Training-Free / ICL", "Frozen-Probe"];
const benchmarkOptions = ["Overall", "UCR", "UEA", "MVCore66"] as const;
const lowShotSettings = ["1-shot", "5-shot", "10-shot"] as const;

type Props = {
  standardEntries: Record<BenchmarkScope, LeaderboardEntry[]>;
  lowShotEntries: Record<LowShotSetting, Record<BenchmarkScope, LeaderboardEntry[]>>;
};

export function LeaderboardView({ standardEntries, lowShotEntries }: Props) {
  const [track, setTrack] = useState<Track>("Overall");
  const [benchmark, setBenchmark] = useState<BenchmarkScope>("Overall");
  const [lowShotSetting, setLowShotSetting] = useState<LowShotSetting>("1-shot");

  const filtered = useMemo(() => {
    if (track === "Standard") return standardEntries[benchmark];
    if (track === "Low-shot") return lowShotEntries[lowShotSetting][benchmark];
    if (track === "Overall") return standardEntries.Overall;
    if (track === "OOD") return [];
    return standardEntries.Overall.filter((entry) => entry.tracks.includes(track));
  }, [benchmark, lowShotEntries, lowShotSetting, standardEntries, track]);

  const showBenchmarkSelector = track === "Standard" || track === "Low-shot";
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
          <span className="mr-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Benchmark</span>
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
        <div className="mb-4 flex flex-wrap items-center gap-2">
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
      )}

      {track === "Standard" && filtered.length > 0 && (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Ranking is recomputed per dataset across all {filtered.length} methods with complete {benchmark} coverage
          {requiredDatasets ? ` (${requiredDatasets} datasets)` : ""}; exact ties receive average ranks.
        </p>
      )}
      {track === "Low-shot" && filtered.length > 0 && (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          {lowShotSetting} uses a fixed number of training labels per class. This ranking covers {requiredDatasets} feasible datasets;
          missing results are excluded rather than filled with zero, and ranks are recomputed within this exact comparison set.
        </p>
      )}
      {track === "Standard" && benchmark === "MVCore66" && (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">Standard MVCore66 has not yet been imported into the canonical per-dataset source.</p>
      )}
      {track === "OOD" && (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">OOD remains a Demo track until verified per-dataset results are available.</p>
      )}

      <div className="mt-4">
        <LeaderboardTable data={filtered} scope={showBenchmarkSelector ? benchmark : "Overall"} />
      </div>
    </div>
  );
}
