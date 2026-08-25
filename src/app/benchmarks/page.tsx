import Link from "next/link";
import { ArrowRight, Orbit } from "lucide-react";
import { BenchmarkCard } from "@/components/benchmark/benchmark-card";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { benchmarkCoverage, oodBenchmarks } from "@/data/demo/benchmarks";
import { getBenchmarks } from "@/lib/data/benchmarks";

export const metadata = { title: "Benchmarks" };

export default async function BenchmarksPage() {
  const benchmarks = await getBenchmarks();
  return <><PageHeader eyebrow="Dataset suites" title="Benchmarks" description={`The benchmark contains ${benchmarkCoverage.uniqueDatasetCount} unique datasets across ${benchmarkCoverage.suiteMembershipCount} UCR, UEA, and MVCore66 suite memberships; overlapping datasets are counted once.`} /><div className="container-wide section-space"><div className="grid gap-4 md:grid-cols-3">{benchmarks.map((benchmark) => <BenchmarkCard key={benchmark.id} benchmark={benchmark} />)}</div><div className="mt-16"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Distribution shift</p><h2 className="mt-2 text-2xl font-semibold">OOD Evaluation</h2></div><Button variant="outline" size="sm" asChild><Link href="/evaluation#ood">View protocol <ArrowRight className="size-4" /></Link></Button></div><div className="mt-6 grid gap-3 md:grid-cols-3">{oodBenchmarks.map((item) => <Card key={item.name}><CardContent className="pt-5"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-md bg-muted"><Orbit className="size-4" /></span><div><h3 className="font-semibold">{item.name}</h3><p className="text-xs text-muted-foreground">{item.domain}</p></div></div><p className="mt-4 text-sm text-muted-foreground">{item.shift}</p></CardContent></Card>)}</div></div></div></>;
}
