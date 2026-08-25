import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { BenchmarkCard } from "@/components/benchmark/benchmark-card";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { VerifiedResultsBadge } from "@/components/shared/verified-results-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { benchmarkCoverage, evaluationTracks } from "@/data/demo/benchmarks";
import { getBenchmarks } from "@/lib/data/benchmarks";
import { getLeaderboard } from "@/lib/data/leaderboard";

const scope = ["UCR-128", "UEA-30", "MVCore66", "Low-shot", "OOD", "Training-Free / ICL", "Frozen-Probe"];

export default async function Home() {
  const [benchmarks, leaders] = await Promise.all([
    getBenchmarks(),
    getLeaderboard({ track: "Overall", limit: 5 }),
  ]);

  return (
    <>
      <section className="border-b border-border bg-[linear-gradient(to_bottom,var(--background),color-mix(in_srgb,var(--muted)_45%,var(--background)))]">
        <div className="container-wide grid min-h-[470px] items-center gap-8 py-10 md:py-12 lg:grid-cols-[1.2fr_.8fr]">
          <div>
            <Badge variant="outline" className="mb-4">TSC-FM Benchmark</Badge>
            <h1 className="max-w-4xl text-4xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-5xl">
              Benchmarking Foundation Models for <span className="text-primary">Time Series Classification</span>
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">
              A unified benchmark for evaluating time series classification foundation models across standard classification, low-shot adaptation, out-of-distribution generalization, in-context learning, and frozen representation transfer.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild><Link href="/leaderboard">Explore Leaderboard <ArrowRight className="size-4" /></Link></Button>
              <Button variant="outline" asChild><Link href="/evaluation">Evaluation Protocol</Link></Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">{scope.map((item) => <Badge key={item} variant="secondary">{item}</Badge>)}</div>
          </div>
          <div className="hidden lg:block">
            <Card className="overflow-hidden">
              <div className="border-b border-border bg-muted/50 px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Evaluation surface</div>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border">
                  {[["Benchmarks", benchmarkCoverage.benchmarkCount.toString()], ["Unique datasets", benchmarkCoverage.uniqueDatasetCount.toString()], ["Tracks", "5"], ["Primary metric", "Accuracy"]].map(([label, value]) => (
                    <div key={label} className="bg-card p-3.5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1.5 text-xl font-semibold tabular-nums">{value}</p></div>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  {benchmarkCoverage.uniqueDatasetCount} unique datasets across {benchmarkCoverage.suiteMembershipCount} suite memberships; overlaps are counted once.
                </p>
                <div className="mt-4 space-y-2.5">
                  {["Equal dataset weighting", "Protocol-specific leaderboards", "Reproducible result records"].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm"><span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary"><Check className="size-3.5" /></span>{item}</div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="container-wide">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">UCR-128 + UEA-30</p><VerifiedResultsBadge /></div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Overall Leaderboard Preview</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Ranked by mean accuracy across all 158 UCR and UEA datasets with equal dataset weighting.</p>
            </div>
            <Button variant="outline" asChild><Link href="/leaderboard">View Full Leaderboard <ArrowRight className="size-4" /></Link></Button>
          </div>
          <LeaderboardTable data={leaders} compact />
        </div>
      </section>

      <section className="border-y border-border bg-muted/25">
        <div className="container-wide py-10 md:py-12">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Coverage</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Benchmark Overview</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Major archives and a curated multivariate core, evaluated through one consistent data and reporting layer.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">{benchmarks.map((benchmark) => <BenchmarkCard key={benchmark.id} benchmark={benchmark} />)}</div>
        </div>
      </section>

      <section className="container-wide py-10 md:py-12">
        <div className="grid gap-7 lg:grid-cols-[.65fr_1.35fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Protocol</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Evaluation Tracks</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Results remain separated by adaptation setting so each score has a clear scientific meaning.</p>
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            {evaluationTracks.map((track, index) => (
              <div key={track.name} className="grid gap-1 border-b border-border px-4 py-3 last:border-0 sm:grid-cols-[150px_1fr] sm:gap-5">
                <h3 className="text-sm font-semibold"><span className="mr-2 text-xs font-medium tabular-nums text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>{track.name}</h3>
                <p className="text-xs leading-5 text-muted-foreground">{track.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
