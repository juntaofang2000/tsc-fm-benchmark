"use client";

import { useMemo, useState } from "react";
import { Database, Info, Layers3, ShieldCheck } from "lucide-react";
import type { CapabilityBundle, CapabilityCell } from "@/types/capability";

type Metric = "meanAccuracy" | "meanRank";

function formatMetric(value: number | null | undefined, metric: Metric) {
  if (value === null || value === undefined) return "—";
  return metric === "meanAccuracy" ? `${(value * 100).toFixed(1)}%` : value.toFixed(2);
}

function heatStyle(cell: CapabilityCell | undefined, metric: Metric) {
  const value = metric === "meanAccuracy" ? cell?.meanAccuracy : cell?.meanRank;
  if (value === null || value === undefined) return undefined;
  const strength = metric === "meanAccuracy"
    ? Math.max(10, Math.min(42, Math.round((value - 0.35) * 70)))
    : Math.max(10, Math.min(42, Math.round((4 - value) * 14)));
  return { backgroundColor: `color-mix(in srgb, var(--primary) ${strength}%, var(--card))` };
}

export function CapabilityMapView({ data }: { data: CapabilityBundle }) {
  const [propertyKey, setPropertyKey] = useState("modality");
  const [taxonomyKey, setTaxonomyKey] = useState("evaluation-paradigm");
  const [metric, setMetric] = useState<Metric>("meanAccuracy");
  const property = data.properties.find((item) => item.key === propertyKey) ?? data.properties[0];
  const taxonomy = data.taxonomies.find((item) => item.key === taxonomyKey) ?? data.taxonomies[0];
  const coverage = data.metadataCoverage[property.key] ?? 0;
  const cells = useMemo(
    () => data.cells.filter((cell) => cell.property === property.key && cell.taxonomy === taxonomy.key),
    [data.cells, property.key, taxonomy.key],
  );

  return (
    <div className="container-wide py-8 md:py-10">
      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-5 md:p-6">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <h2 className="font-semibold">Fixed Overall capability core</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">The analysis uses the same complete method universe as the Standard Overall leaderboard: 12 configurations across 7 backbones, each evaluated on all 198 datasets.</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">Configuration scores are averaged within each backbone first. Backbones and datasets then receive equal weight, preventing classifier-rich backbones from receiving extra influence.</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 rounded-xl border border-border bg-card sm:grid-cols-4 xl:grid-cols-2" data-testid="capability-coverage">
          {[["198", "datasets"], [String(data.configurationCount), "configurations"], [String(data.backboneCount), "backbones"], ["198 / 198", "result coverage"]].map(([value, label]) => (
            <div key={label} className="border-b border-r border-border px-4 py-4 sm:border-b-0 xl:border-b xl:[&:nth-last-child(-n+2)]:border-b-0">
              <p className="text-xl font-semibold tabular-nums">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-9">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Comparison taxonomy</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">Choose one independent analysis lens</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">Groups are mutually exclusive within each taxonomy. Evaluation Paradigm and Model Origin are calculated and ranked separately.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2" data-testid="capability-taxonomy">
          {data.taxonomies.map((item) => {
            const active = item.key === taxonomy.key;
            return (
              <button key={item.key} type="button" onClick={() => setTaxonomyKey(item.key)} className={active ? "rounded-xl border border-primary bg-primary/[0.06] p-4 text-left ring-1 ring-primary/20" : "rounded-xl border border-border bg-card p-4 text-left hover:border-primary/40"}>
                <div className="flex items-center justify-between gap-3"><span className="font-medium">{item.label}</span><span className={active ? "rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground" : "rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"}>{item.groups.length} groups</span></div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="border-t border-border py-9">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Property coverage</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Choose a benchmark attribute</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">Every property has reviewed metadata for all 198 datasets; coverage remains visible for audit transparency.</p>
          </div>
          <div className="inline-flex w-fit rounded-lg border border-border bg-muted/30 p-1" aria-label="Metric">
            {(["meanAccuracy", "meanRank"] as Metric[]).map((item) => (
              <button key={item} type="button" onClick={() => setMetric(item)} className={metric === item ? "rounded-md bg-background px-3 py-1.5 text-sm font-medium shadow-sm" : "rounded-md px-3 py-1.5 text-sm text-muted-foreground"}>{item === "meanAccuracy" ? "Accuracy" : "Average Group Rank"}</button>
            ))}
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="capability-property">
          {data.properties.map((item) => {
            const itemCoverage = data.metadataCoverage[item.key] ?? 0;
            const active = item.key === property.key;
            return (
              <button key={item.key} type="button" onClick={() => setPropertyKey(item.key)} className={active ? "rounded-xl border border-primary bg-primary/[0.06] p-4 text-left ring-1 ring-primary/20" : "rounded-xl border border-border bg-card p-4 text-left hover:border-primary/40"}>
                <div className="flex items-center justify-between gap-3"><span className="font-medium">{item.label}</span><span className={active ? "rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground" : "rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"}>{itemCoverage} / {data.totalDatasetCount}</span></div>
                <p className="mt-2 text-xs text-muted-foreground">{((itemCoverage / data.totalDatasetCount) * 100).toFixed(1)}% reviewed coverage · {item.bins.length} conditions</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="border-t border-border py-9">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Capability heatmap</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">{taxonomy.label} × {property.label.toLowerCase()}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{coverage} of {data.totalDatasetCount} datasets contribute to this property view. N is the dataset count in each condition.</p>
          </div>
          <span className="rounded-full border border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">Fixed core · {data.configurationCount} configurations · {data.backboneCount} backbones</span>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border" data-testid="capability-heatmap">
          <table className="w-full border-collapse text-sm" style={{ minWidth: Math.max(880, 310 + property.bins.length * 150) }}>
            <thead><tr className="bg-muted/50"><th className="w-[310px] border-b border-r border-border px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Taxonomy group</th>{property.bins.map((bin) => <th key={bin.key} className="border-b border-border px-3 py-3 text-left"><span className="block font-medium">{bin.label}</span><span className="mt-0.5 block text-xs font-normal text-muted-foreground">{bin.description}</span></th>)}</tr></thead>
            <tbody>{taxonomy.groups.map((group) => <tr key={group.key} className="border-b border-border last:border-b-0"><th className="border-r border-border px-4 py-4 text-left"><span className="block font-medium">{group.label}</span><span className="mt-1 block text-xs font-normal leading-5 text-muted-foreground">{group.backboneCount} backbone{group.backboneCount === 1 ? "" : "s"} · {group.configurationCount} configuration{group.configurationCount === 1 ? "" : "s"}</span></th>{property.bins.map((bin) => { const cell = cells.find((item) => item.bin === bin.key && item.group === group.key); return <td key={bin.key} className="px-3 py-3"><div className="rounded-lg border border-primary/10 px-3 py-3" style={heatStyle(cell, metric)}><p className="font-mono text-base font-semibold tabular-nums">{formatMetric(metric === "meanAccuracy" ? cell?.meanAccuracy : cell?.meanRank, metric)}</p><p className="mt-1 text-xs text-muted-foreground">N={cell?.coverage ?? 0}</p></div></td>; })}</tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="border-t border-border py-9">
        <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Aggregate evidence</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Condition-level detail</h2><p className="mt-1 text-sm text-muted-foreground">Every row is a fixed-core aggregate; no dataset-level record is exposed or downloadable.</p></div>
        <div className="mb-5 grid gap-4 rounded-xl border border-primary/20 bg-primary/[0.04] p-5 md:grid-cols-2" data-testid="capability-metric-definitions">
          <div className="flex gap-3"><Info className="mt-0.5 size-5 shrink-0 text-primary" /><div><h3 className="font-semibold">Hierarchical Accuracy</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{data.methodology.configurationAggregation} {data.methodology.backboneAggregation} {data.methodology.weighting}</p></div></div>
          <div className="flex gap-3"><Info className="mt-0.5 size-5 shrink-0 text-primary" /><div><h3 className="font-semibold">Best / Tied Best / Other</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{data.methodology.outcomeDefinition}</p></div></div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border" data-testid="capability-table">
          <table className="w-full min-w-[980px] text-sm">
            <thead><tr className="border-b border-border bg-muted/50 text-xs text-muted-foreground"><th className="px-4 py-3 text-left">Condition</th><th className="px-4 py-3 text-left">Taxonomy group</th><th className="px-3 py-3 text-right">Accuracy</th><th className="px-3 py-3 text-right">Avg. Group Rank</th><th className="px-3 py-3 text-right">Best / Tied / Other</th><th className="px-3 py-3 text-right">Datasets</th><th className="px-3 py-3 text-right">Backbones</th><th className="px-4 py-3 text-right">Configurations</th></tr></thead>
            <tbody>{cells.map((cell) => <tr key={`${cell.bin}-${cell.taxonomy}-${cell.group}`} className="border-b border-border last:border-0"><td className="px-4 py-3 font-medium">{property.bins.find((bin) => bin.key === cell.bin)?.label}</td><td className="px-4 py-3 text-muted-foreground">{taxonomy.groups.find((group) => group.key === cell.group)?.label}</td><td className="px-3 py-3 text-right font-mono tabular-nums">{formatMetric(cell.meanAccuracy, "meanAccuracy")}</td><td className="px-3 py-3 text-right font-mono tabular-nums">{formatMetric(cell.meanRank, "meanRank")}</td><td className="px-3 py-3 text-right font-mono tabular-nums">{cell.bestCount} / {cell.tiedBestCount} / {cell.otherCount}</td><td className="px-3 py-3 text-right font-mono tabular-nums">{cell.coverage}</td><td className="px-3 py-3 text-right font-mono tabular-nums">{cell.backboneCount}</td><td className="px-4 py-3 text-right font-mono tabular-nums">{cell.configurationCount}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section className="border-t border-border py-9">
        <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Reading guide</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Methodology and privacy boundaries</h2></div>
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-border bg-card p-5"><Database className="size-5 text-primary" /><h3 className="mt-3 font-semibold">Fixed result universe</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{data.methodology.resultUniverse}</p></article>
          <article className="rounded-xl border border-border bg-card p-5"><Info className="size-5 text-primary" /><h3 className="mt-3 font-semibold">Rank definition</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{data.methodology.rankDefinition}</p></article>
          <article className="rounded-xl border border-border bg-card p-5"><Layers3 className="size-5 text-primary" /><h3 className="mt-3 font-semibold">Separate taxonomies</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{data.methodology.taxonomy}</p></article>
          <article className="rounded-xl border border-border bg-card p-5"><ShieldCheck className="size-5 text-primary" /><h3 className="mt-3 font-semibold">Public data boundary</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{data.methodology.privacy}</p></article>
        </div>
      </section>
    </div>
  );
}
