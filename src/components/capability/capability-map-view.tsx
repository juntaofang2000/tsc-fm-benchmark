"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Download, Info, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  CapabilityBundle,
  CapabilityCell,
  CapabilityDataset,
  CapabilityScope,
} from "@/types/capability";

const scopes: CapabilityScope[] = ["Overall", "UCR", "UEA"];
const pageSize = 20;

function percent(value: number | null, digits = 2) {
  return value === null ? "—" : `${(value * 100).toFixed(digits)}%`;
}

function number(value: number | null, digits = 2) {
  return value === null ? "—" : value.toFixed(digits);
}

function csvEscape(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function Select({ value, onChange, label, children }: { value: string; onChange: (value: string) => void; label: string; children: React.ReactNode }) {
  return <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{children}</select>;
}

function SectionTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">{title}</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

function EmptyProperty({ label }: { label: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-border bg-muted/15 px-6 text-center">
      <div>
        <Info className="mx-auto size-5 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium">{label} metadata is not curated yet</p>
        <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">The interface is ready, but this analysis remains empty until reviewed metadata is added. Dataset names are not used to infer domains.</p>
      </div>
    </div>
  );
}

function heatStyle(cell: CapabilityCell | undefined, metric: "meanAccuracy" | "meanRank") {
  const raw = metric === "meanAccuracy" ? cell?.meanAccuracy : cell?.meanRank;
  if (raw === null || raw === undefined) return undefined;
  const strength = metric === "meanAccuracy" ? Math.max(0.08, Math.min(0.38, (raw - 0.35) * 0.65)) : Math.max(0.08, Math.min(0.38, (12 - raw) / 32));
  return { backgroundColor: `color-mix(in srgb, var(--primary) ${Math.round(strength * 100)}%, var(--card))` };
}

export function CapabilityMapView({ data }: { data: CapabilityBundle }) {
  const [scope, setScope] = useState<CapabilityScope>("Overall");
  const [heatProperty, setHeatProperty] = useState("trainSize");
  const [heatMetric, setHeatMetric] = useState<"meanAccuracy" | "meanRank">("meanAccuracy");
  const [compareProperty, setCompareProperty] = useState("trainSize");
  const [query, setQuery] = useState("");
  const [modelFilter, setModelFilter] = useState("all");
  const [paradigmFilter, setParadigmFilter] = useState("all");
  const [exploreProperty, setExploreProperty] = useState("trainSize");
  const [binFilter, setBinFilter] = useState("all");
  const [winnerFilter, setWinnerFilter] = useState("all");
  const [page, setPage] = useState(1);

  const property = (key: string) => data.properties.find((item) => item.key === key)!;
  const heatBins = property(heatProperty).bins;
  const compareBins = property(compareProperty).bins;
  const explorerBins = property(exploreProperty).bins;
  const heatCells = data.cells.filter((cell) => cell.scope === scope && cell.property === heatProperty);
  const comparisonCells = data.cells.filter((cell) => cell.scope === scope && cell.property === compareProperty);
  const summaries = data.summaries.filter((item) => item.scope === scope && item.property === compareProperty);

  const visibleMethods = useMemo(() => {
    if (modelFilter !== "all") return data.methods.filter((item) => item.name === modelFilter);
    if (paradigmFilter !== "all") return data.methods.filter((item) => item.lenses.includes(paradigmFilter));
    return data.methods;
  }, [data.methods, modelFilter, paradigmFilter]);

  const filteredDatasets = useMemo(() => data.datasets.filter((row) => {
    if (scope !== "Overall" && row.archive !== scope) return false;
    if (query && !row.dataset.toLowerCase().includes(query.toLowerCase())) return false;
    if (modelFilter !== "all" && row.scores[modelFilter] === undefined) return false;
    if (binFilter !== "all" && row.bins[exploreProperty] !== binFilter) return false;
    if (winnerFilter !== "all" && !row.bestModels.includes(winnerFilter)) return false;
    return true;
  }), [binFilter, data.datasets, exploreProperty, modelFilter, query, scope, winnerFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredDatasets.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filteredDatasets.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function resetPage() { setPage(1); }

  function exportCells(filename: string, cells: CapabilityCell[]) {
    downloadCsv(filename,
      ["scope", "property", "bin", "paradigm", "mean_accuracy", "ci95_low", "ci95_high", "mean_rank", "coverage", "wins", "ties", "losses"],
      cells.map((cell) => [cell.scope, cell.property, cell.bin, cell.paradigm, cell.meanAccuracy, cell.accuracyCi95[0], cell.accuracyCi95[1], cell.meanRank, cell.coverage, cell.wins, cell.ties, cell.losses]));
  }

  function exportDatasets() {
    const methods = data.methods.map((item) => item.name);
    downloadCsv(`capability-datasets-${scope.toLowerCase()}.csv`,
      ["archive", "dataset", "train_size", "test_size", "classes", "length", "channels", "imbalance_ratio", "domain", "best_models", "best_paradigms", ...methods, "result_source", "metadata_source"],
      filteredDatasets.map((row) => [row.archive, row.dataset, row.trainSize, row.testSize, row.classes, row.length, row.channels, row.imbalanceRatio, row.domain, row.bestModels.join(" | "), row.bestParadigms.join(" | "), ...methods.map((method) => row.scores[method] ?? null), row.resultSource, row.metadataSource]));
  }

  return (
    <div className="container-wide py-6 md:py-8">
      <section className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-5">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <h2 className="font-semibold">Read this as a capability boundary, not a causal conclusion</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Grouped differences describe the current per-dataset accuracy evidence. Every estimate reports its contributing dataset count; missing results are excluded rather than replaced with zero.</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">Classification-native and General TSFM are overlapping model-origin lenses. Formal winner statements use the non-overlapping decision-interface groups only.</p>
            </div>
          </div>
        </div>
        <div className="grid min-w-64 grid-cols-3 rounded-xl border border-border bg-card">
          <div className="px-4 py-4"><p className="text-2xl font-semibold">{data.datasetCount}</p><p className="text-xs text-muted-foreground">datasets</p></div>
          <div className="border-x border-border px-4 py-4"><p className="text-2xl font-semibold">{data.methodCount}</p><p className="text-xs text-muted-foreground">methods</p></div>
          <div className="px-4 py-4"><p className="text-2xl font-semibold">{data.metadataCoverage.domain}</p><p className="text-xs text-muted-foreground">domain labels</p></div>
        </div>
      </section>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-border py-3">
        <div className="flex items-center gap-1" aria-label="Benchmark scope">
          {scopes.map((item) => <button key={item} onClick={() => { setScope(item); resetPage(); }} className={scope === item ? "rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground" : "rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"}>{item}</button>)}
        </div>
        <div className="text-right text-xs leading-5 text-muted-foreground">
          <p>Data version <span className="font-mono text-foreground">{data.dataVersion}</span></p>
          <p>Generated {data.generatedAt.replace("T", " ").replace("+00:00", " UTC")}</p>
        </div>
      </div>

      <section className="py-9">
        <SectionTitle eyebrow="01 · Descriptive map" title="Paradigm × task condition heatmap" description="Select one task property at a time. Darker cells indicate higher accuracy or better (lower) rank; N is the actual dataset coverage." action={<Button variant="outline" size="sm" onClick={() => exportCells(`capability-heatmap-${scope.toLowerCase()}-${heatProperty}.csv`, heatCells)}><Download className="size-4" />CSV</Button>} />
        <div className="mb-4 flex flex-wrap gap-2">
          <Select label="Heatmap task property" value={heatProperty} onChange={setHeatProperty}>{data.properties.map((item) => <option key={item.key} value={item.key}>{item.label}{item.bins.length ? "" : " — pending"}</option>)}</Select>
          <Select label="Heatmap metric" value={heatMetric} onChange={(value) => setHeatMetric(value as "meanAccuracy" | "meanRank")}><option value="meanAccuracy">Mean accuracy</option><option value="meanRank">Mean rank</option></Select>
        </div>
        {heatBins.length === 0 ? <EmptyProperty label={property(heatProperty).label} /> : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[820px] border-collapse text-sm">
              <thead><tr className="bg-muted/50"><th className="w-64 border-b border-r border-border px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Paradigm / lens</th>{heatBins.map((bin) => <th key={bin.key} className="border-b border-border px-3 py-3 text-left"><span className="block font-medium">{bin.label}</span><span className="mt-0.5 block text-xs font-normal text-muted-foreground">{bin.description}</span></th>)}</tr></thead>
              <tbody>{data.paradigms.map((paradigm) => <tr key={paradigm} className="border-b border-border last:border-b-0"><th className="border-r border-border px-4 py-4 text-left font-medium">{paradigm}</th>{heatBins.map((bin) => { const cell = heatCells.find((item) => item.bin === bin.key && item.paradigm === paradigm); return <td key={bin.key} className="px-3 py-3"><div className="rounded-lg border border-primary/10 px-3 py-3" style={heatStyle(cell, heatMetric)}><p className="font-mono text-base font-semibold tabular-nums">{heatMetric === "meanAccuracy" ? percent(cell?.meanAccuracy ?? null) : number(cell?.meanRank ?? null)}</p><p className="mt-1 text-xs text-muted-foreground">N={cell?.coverage ?? 0}</p></div></td>; })}</tr>)}</tbody>
            </table>
          </div>
        )}
      </section>

      <section className="border-t border-border py-9">
        <SectionTitle eyebrow="02 · Uncertainty-aware comparison" title="Model-family comparison" description="Dots show mean accuracy and horizontal ranges show dataset-level 95% bootstrap confidence intervals. The table adds mean rank, win/tie/loss and coverage." action={<Button variant="outline" size="sm" onClick={() => exportCells(`capability-comparison-${scope.toLowerCase()}-${compareProperty}.csv`, comparisonCells)}><Download className="size-4" />CSV</Button>} />
        <div className="mb-5"><Select label="Comparison task property" value={compareProperty} onChange={setCompareProperty}>{data.properties.map((item) => <option key={item.key} value={item.key}>{item.label}{item.bins.length ? "" : " — pending"}</option>)}</Select></div>
        {compareBins.length === 0 ? <EmptyProperty label={property(compareProperty).label} /> : (
          <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
            <div className="rounded-xl border border-border p-4 md:p-5">
              <div className="mb-4 flex justify-between text-[11px] text-muted-foreground"><span>0%</span><span>Mean accuracy with 95% CI</span><span>100%</span></div>
              <div className="space-y-6">{compareBins.map((bin) => <div key={bin.key}><div className="mb-2 flex items-baseline justify-between"><h3 className="text-sm font-semibold">{bin.label}</h3><span className="text-xs text-muted-foreground">{bin.description}</span></div><div className="space-y-2">{data.paradigms.map((paradigm) => { const cell = comparisonCells.find((item) => item.bin === bin.key && item.paradigm === paradigm); const value = cell?.meanAccuracy; const low = cell?.accuracyCi95[0]; const high = cell?.accuracyCi95[1]; return <div key={paradigm} className="grid grid-cols-[150px_1fr_58px] items-center gap-2"><span className="truncate text-xs text-muted-foreground" title={paradigm}>{paradigm}</span><div className="relative h-5 rounded bg-muted/60"><div className="absolute top-[9px] h-0.5 bg-primary/55" style={{ left: `${(low ?? 0) * 100}%`, width: `${Math.max(0, (high ?? 0) - (low ?? 0)) * 100}%` }} /><span className="absolute top-[5px] size-2.5 -translate-x-1/2 rounded-full border-2 border-background bg-primary" style={{ left: `${(value ?? 0) * 100}%` }} /></div><span className="text-right font-mono text-xs tabular-nums">{percent(value ?? null, 1)}</span></div>; })}</div></div>)}</div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs"><thead><tr className="border-b border-border bg-muted/50"><th className="px-3 py-3 text-left">Condition</th><th className="px-3 py-3 text-left">Paradigm</th><th className="px-3 py-3 text-right">Acc.</th><th className="px-3 py-3 text-right">Rank</th><th className="px-3 py-3 text-right">W/T/L</th><th className="px-3 py-3 text-right">N</th></tr></thead><tbody>{comparisonCells.map((cell) => <tr key={`${cell.bin}-${cell.paradigm}`} className="border-b border-border last:border-0"><td className="px-3 py-2.5 font-medium">{compareBins.find((bin) => bin.key === cell.bin)?.label}</td><td className="max-w-40 px-3 py-2.5 text-muted-foreground">{cell.paradigm}</td><td className="px-3 py-2.5 text-right font-mono">{percent(cell.meanAccuracy, 1)}</td><td className="px-3 py-2.5 text-right font-mono">{number(cell.meanRank)}</td><td className="px-3 py-2.5 text-right font-mono">{cell.wins}/{cell.ties}/{cell.losses}</td><td className="px-3 py-2.5 text-right font-mono">{cell.coverage}</td></tr>)}</tbody></table>
            </div>
          </div>
        )}
      </section>

      <section className="border-t border-border py-9">
        <SectionTitle eyebrow="03 · Conservative synthesis" title="Where each paradigm wins" description="A directional statement appears only after the minimum coverage, paired-bootstrap and multiplicity-adjusted sign-test checks all pass." />
        {compareBins.length === 0 ? <EmptyProperty label={property(compareProperty).label} /> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{summaries.map((item) => <article key={item.bin} className={item.supported ? "rounded-xl border border-emerald-500/25 bg-emerald-500/[0.05] p-4" : "rounded-xl border border-border bg-card p-4"}><div className="flex gap-3">{item.supported ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}<div><p className="text-sm leading-6">{item.message}</p><p className="mt-2 text-xs text-muted-foreground">Paired Δ {percent(item.meanDifference)} · 95% CI [{percent(item.differenceCi95[0])}, {percent(item.differenceCi95[1])}] · Holm p={item.adjustedP.toFixed(3)}</p></div></div></article>)}</div>}
      </section>

      <section className="border-t border-border py-9">
        <SectionTitle eyebrow="04 · Dataset-level evidence" title="Dataset explorer" description="Filter the evidence at dataset level, inspect every available method result, and trace each row to its result and metadata source." action={<Button variant="outline" size="sm" onClick={exportDatasets}><Download className="size-4" />CSV</Button>} />
        <div className="mb-4 grid gap-2 md:grid-cols-2 xl:grid-cols-6">
          <label className="relative xl:col-span-2"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input aria-label="Search dataset" value={query} onChange={(event) => { setQuery(event.target.value); resetPage(); }} placeholder="Search dataset" className="pl-9" /></label>
          <Select label="Filter model" value={modelFilter} onChange={(value) => { setModelFilter(value); resetPage(); }}><option value="all">All models</option>{data.methods.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</Select>
          <Select label="Filter paradigm" value={paradigmFilter} onChange={(value) => { setParadigmFilter(value); resetPage(); }}><option value="all">All paradigms</option>{data.paradigms.map((item) => <option key={item} value={item}>{item}</option>)}</Select>
          <Select label="Filter property" value={exploreProperty} onChange={(value) => { setExploreProperty(value); setBinFilter("all"); resetPage(); }}>{data.properties.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</Select>
          <Select label="Filter property bucket" value={binFilter} onChange={(value) => { setBinFilter(value); resetPage(); }}><option value="all">All conditions</option>{explorerBins.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</Select>
          <Select label="Filter winning model" value={winnerFilter} onChange={(value) => { setWinnerFilter(value); resetPage(); }}><option value="all">Any winner</option>{data.methods.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</Select>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[1100px] text-sm">
            <thead><tr className="border-b border-border bg-muted/50 text-xs text-muted-foreground"><th className="px-4 py-3 text-left">Dataset</th><th className="px-3 py-3 text-left">Attributes</th><th className="px-3 py-3 text-left">Best model / paradigm</th><th className="px-3 py-3 text-left">Method results</th><th className="px-3 py-3 text-left">Source</th></tr></thead>
            <tbody>{pageRows.map((row) => <DatasetRow key={`${row.archive}-${row.dataset}`} row={row} methods={visibleMethods.map((item) => item.name)} />)}</tbody>
          </table>
          {pageRows.length === 0 && <div className="px-6 py-14 text-center text-sm text-muted-foreground">No datasets match the current filters.</div>}
        </div>
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground"><span>{filteredDatasets.length} datasets · Page {currentPage} of {pageCount}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>Next</Button></div></div>
      </section>

      <section className="border-t border-border py-9">
        <SectionTitle eyebrow="Methods & provenance" title="Statistical safeguards and data status" description="The analysis is designed to remain auditable when datasets or methods are added later." />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border p-5"><h3 className="font-semibold">Statistical protocol</h3><ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground"><li>{data.methodology.missingness}</li><li>{data.methodology.bootstrap}</li><li>{data.methodology.claimRule}</li><li>{data.methodology.taxonomy}</li></ul></div>
          <div className="rounded-xl border border-border p-5"><h3 className="font-semibold">Sources and pending tracks</h3><ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">{data.sources.map((source) => <li key={source} className="font-mono text-xs">{source}</li>)}</ul><div className="mt-4 flex flex-wrap gap-2">{data.demoTracks.map((track) => <span key={track} className="rounded-full border border-amber-500/30 bg-amber-500/[0.07] px-2.5 py-1 text-xs text-amber-700 dark:text-amber-300">{track} · Demo / no official data</span>)}</div><p className="mt-3 text-xs leading-5 text-muted-foreground">{data.methodology.domain}</p></div>
        </div>
      </section>
    </div>
  );
}

function DatasetRow({ row, methods }: { row: CapabilityDataset; methods: string[] }) {
  const binSummary = [row.trainSize !== null ? `train ${row.trainSize}` : null, row.classes !== null ? `${row.classes} classes` : null, row.length !== null ? `L=${row.length}` : null, row.channels !== null ? `${row.channels} ch.` : null, row.imbalanceRatio !== null ? `IR ${row.imbalanceRatio.toFixed(2)}` : null].filter(Boolean).join(" · ");
  return (
    <tr className="border-b border-border align-top last:border-0">
      <td className="px-4 py-3"><p className="font-medium">{row.dataset}</p><span className="mt-1 inline-block rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{row.archive}</span></td>
      <td className="max-w-64 px-3 py-3 text-xs leading-5 text-muted-foreground">{binSummary || "Metadata unavailable"}<br />Domain: {row.domain ?? "pending"}</td>
      <td className="max-w-56 px-3 py-3"><p className="text-xs font-medium">{row.bestModels.join(" / ")}</p><p className="mt-1 text-xs text-muted-foreground">{row.bestParadigms.join(" / ")}</p></td>
      <td className="w-[390px] px-3 py-3"><details><summary className="cursor-pointer text-xs font-medium text-primary">View {methods.filter((method) => row.scores[method] !== undefined).length} method results</summary><div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">{methods.filter((method) => row.scores[method] !== undefined).map((method) => <div key={method} className="flex justify-between gap-2 border-b border-border/60 pb-1 text-xs"><span className="truncate text-muted-foreground">{method}</span><span className="font-mono">{percent(row.scores[method])}</span></div>)}</div></details></td>
      <td className="max-w-64 px-3 py-3 text-[11px] leading-5 text-muted-foreground"><p className="font-mono">{row.resultSource}</p><p className="mt-1">{row.metadataSource}</p></td>
    </tr>
  );
}
