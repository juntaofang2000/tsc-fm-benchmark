"use client";

import { useMemo, useState } from "react";
import type { LeaderboardEntry, Track } from "@/types";
import { LeaderboardTable } from "./leaderboard-table";

const tracks: Track[] = ["Overall", "Standard", "Low-shot", "OOD", "Training-Free / ICL", "Frozen-Probe"];
const benchmarks = ["All", "UCR", "UEA", "MVCore66"] as const;

export function LeaderboardView({ entries, ucrEntries }: { entries: LeaderboardEntry[]; ucrEntries: LeaderboardEntry[] }) {
  const [track, setTrack] = useState<Track>("Overall");
  const [benchmark, setBenchmark] = useState<(typeof benchmarks)[number]>("All");
  const filtered = useMemo(() => {
    if (track === "Standard" && benchmark === "UCR") return ucrEntries;
    return entries.filter((entry) => entry.tracks.includes(track)).map((entry) => {
    if (track !== "Standard" || benchmark === "All") return entry;
    const value = benchmark === "UCR" ? entry.ucrAccuracy : benchmark === "UEA" ? entry.ueaAccuracy : entry.mvcore66Accuracy;
    return { ...entry, avgAccuracy: value };
  });
  }, [entries, ucrEntries, track, benchmark]);

  return (
    <div>
      <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-border" role="tablist" aria-label="Leaderboard track">
        {tracks.map((item) => <button key={item} role="tab" aria-selected={track === item} onClick={() => setTrack(item)} className={track === item ? "border-b-2 border-primary px-3 py-3 text-sm font-medium text-foreground" : "border-b-2 border-transparent px-3 py-3 text-sm text-muted-foreground hover:text-foreground"}>{item}</button>)}
      </div>
      {track === "Standard" && <div className="my-4 flex flex-wrap items-center gap-2"><span className="mr-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Benchmark</span>{benchmarks.map((item) => <button key={item} onClick={() => setBenchmark(item)} className={benchmark === item ? "rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground" : "rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"}>{item}</button>)}</div>}
      {track === "Standard" && benchmark === "UCR" && <p className="mt-3 text-xs leading-5 text-muted-foreground">UCR ranking covers all 11 methods with complete UCR-128 results. Average Rank is recomputed per dataset across these 11 methods, with average ranks assigned to exact ties.</p>}
      <div className="mt-4"><LeaderboardTable data={filtered} scope={track === "Standard" && benchmark === "UCR" ? "UCR" : "Overall"} /></div>
    </div>
  );
}
