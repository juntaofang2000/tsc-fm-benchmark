import Link from "next/link";
import { ArrowRight, Database } from "lucide-react";
import type { Benchmark } from "@/types";
import { Card, CardContent } from "@/components/ui/card";

export function BenchmarkCard({ benchmark }: { benchmark: Benchmark }) {
  return (
    <Card>
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-primary">{benchmark.modality}</p>
            <h3 className="mt-1.5 text-lg font-semibold">{benchmark.name}</h3>
          </div>
          <div className="flex items-center gap-2 text-right">
            <Database className="size-4 text-muted-foreground" />
            <div><p className="text-lg font-semibold leading-none tabular-nums">{benchmark.datasetCount}</p><p className="mt-1 text-[11px] text-muted-foreground">datasets</p></div>
          </div>
        </div>
        <p className="mt-3 text-sm leading-5 text-muted-foreground">{benchmark.description}</p>
        <Link href={`/benchmarks/${benchmark.slug}`} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-foreground hover:text-primary">View benchmark <ArrowRight className="size-3.5" /></Link>
      </CardContent>
    </Card>
  );
}
