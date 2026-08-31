import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle2, Layers3, Scale } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { benchmarkProfile } from "@/data/demo/benchmarks";

export const metadata = {
  title: "Dataset Profile",
  description: "Aggregate composition and evaluation principles for the 198-dataset TSC-FM Benchmark.",
};

const stats = [
  { label: "Total datasets", value: 198, detail: "100% of the benchmark" },
  { label: "Univariate", value: 128, detail: "64.6% of datasets" },
  { label: "Multivariate", value: 70, detail: "35.4% of datasets" },
  { label: "Evaluation tracks", value: 5, detail: "Protocol-separated reporting" },
];

const principles = [
  { icon: Scale, title: "Equal weighting", body: "Every dataset contributes equally to aggregate accuracy, regardless of sample count or sequence length." },
  { icon: CheckCircle2, title: "Unique-task counting", body: "Repeated tasks are resolved before aggregation and contribute exactly once to the Overall score." },
  { icon: Layers3, title: "Modality views", body: "Overall, Univariate, and Multivariate rankings are computed as distinct, auditable views." },
  { icon: BarChart3, title: "Primary metric", body: "Accuracy is the primary metric; Average Rank and Coverage provide complementary context." },
];

export default function DatasetProfilePage() {
  return (
    <>
      <PageHeader
        eyebrow="Dataset profile"
        title="Benchmark Composition"
        description="Aggregate statistics for 198 unique datasets. Individual dataset and suite identities are intentionally not published on this site."
      />
      <div className="container-wide section-space">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <Card key={item.label}>
              <CardContent className="pt-5">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-3xl font-semibold tabular-nums">{item.value}</p>
                <p className="mt-2 text-xs text-muted-foreground">{item.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <section className="mt-10 rounded-xl border border-border bg-card p-5 md:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Modality distribution</p>
              <h2 className="mt-2 text-2xl font-semibold">128 univariate · 70 multivariate</h2>
            </div>
            <p className="text-sm text-muted-foreground">{benchmarkProfile.totalDatasetCount} unique datasets</p>
          </div>
          <div className="mt-6 overflow-hidden rounded-full bg-muted" aria-label="64.6 percent univariate and 35.4 percent multivariate">
            <div className="flex h-5">
              <div className="bg-primary" style={{ width: `${benchmarkProfile.univariateShare}%` }} />
              <div className="bg-primary/35" style={{ width: `${benchmarkProfile.multivariateShare}%` }} />
            </div>
          </div>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"><span>Univariate</span><span className="font-medium tabular-nums">128 · 64.6%</span></div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"><span>Multivariate</span><span className="font-medium tabular-nums">70 · 35.4%</span></div>
          </div>
        </section>

        <section className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Evaluation principles</p>
          <h2 className="mt-2 text-2xl font-semibold">How aggregate reporting works</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {principles.map(({ icon: Icon, title, body }) => (
              <Card key={title}>
                <CardContent className="pt-5">
                  <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary"><Icon className="size-4" /></span>
                  <h3 className="mt-4 font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <div className="mt-10 flex flex-wrap gap-3 rounded-xl border border-border bg-muted/20 p-5">
          <div className="mr-auto">
            <h2 className="font-semibold">Explore aggregate results</h2>
            <p className="mt-1 text-sm text-muted-foreground">Compare Overall, Univariate, and Multivariate Standard rankings.</p>
          </div>
          <Button asChild><Link href="/leaderboard">Open Leaderboard <ArrowRight className="size-4" /></Link></Button>
          <Button variant="outline" asChild><Link href="/evaluation">Evaluation Protocol</Link></Button>
        </div>
      </div>
    </>
  );
}
