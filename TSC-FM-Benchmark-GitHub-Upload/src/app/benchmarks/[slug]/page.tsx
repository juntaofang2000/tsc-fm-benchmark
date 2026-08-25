import { notFound } from "next/navigation";
import { DatasetTable } from "@/components/benchmark/dataset-table";
import { PageHeader } from "@/components/shared/page-header";
import { MetricCard } from "@/components/shared/metric-card";
import { getBenchmark, getBenchmarkDatasets, getBenchmarks } from "@/lib/data/benchmarks";

export async function generateStaticParams() { return (await getBenchmarks()).map((benchmark) => ({ slug: benchmark.slug })); }

export default async function BenchmarkDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [benchmark, datasets] = await Promise.all([getBenchmark(slug), getBenchmarkDatasets(slug)]);
  if (!benchmark) notFound();
  return <><PageHeader eyebrow="Benchmark details" title={benchmark.name} description={benchmark.description} demo /><div className="container-wide py-10"><section><h2 className="text-xl font-semibold">Benchmark Overview</h2><div className="mt-4 grid gap-3 sm:grid-cols-3"><MetricCard label="Number of datasets" value={benchmark.datasetCount.toString()} /><MetricCard label="Modality" value={benchmark.modality} /><MetricCard label="Evaluation metric" value={benchmark.metric} /></div></section><section className="mt-12"><div className="mb-5"><h2 className="text-xl font-semibold">Dataset Table</h2><p className="mt-2 text-sm text-muted-foreground">A small demo subset is shown. The same typed structure supports loading the complete suite.</p></div><DatasetTable datasets={datasets} /></section></div></>;
}
