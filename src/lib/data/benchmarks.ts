import { demoBenchmarks } from "@/data/demo/benchmarks";
import { demoDatasets } from "@/data/demo/datasets";

export async function getBenchmarks() {
  return demoBenchmarks;
}

export async function getBenchmark(slug: string) {
  return demoBenchmarks.find((benchmark) => benchmark.slug === slug) ?? null;
}

export async function getBenchmarkDatasets(slug: string) {
  return demoDatasets[slug] ?? [];
}
