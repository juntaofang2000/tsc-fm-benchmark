"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronLeft, ChevronRight, Code2, FileText, Medal, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { cn, formatMetric } from "@/lib/utils";
import type { EvaluationType, LeaderboardEntry } from "@/types";

const evaluationTypes: Array<EvaluationType | "All types"> = [
  "All types",
  "Foundation Model",
  "Representation Model",
  "Supervised Baseline",
  "In-Context",
  "Frozen Probe",
];

function SortHeader({ label, column }: { label: string; column: { toggleSorting: (desc?: boolean) => void; getIsSorted: () => false | "asc" | "desc" } }) {
  return <button className="inline-flex items-center gap-1.5 whitespace-nowrap font-medium" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>{label}<ArrowUpDown className="size-3.5 text-muted-foreground" /></button>;
}

function Metric({ value }: { value: number | null }) {
  return <span className="font-medium tabular-nums">{formatMetric(value)}</span>;
}

function ExternalIcon({ href, kind }: { href: string | null; kind: "paper" | "code" }) {
  if (!href) return <span className="text-muted-foreground">—</span>;
  const Icon = kind === "paper" ? FileText : Code2;
  return <a href={href} aria-label={`${kind} link`} className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"><Icon className="size-4" /></a>;
}

function getColumns(scope: "Overall" | "UCR"): ColumnDef<LeaderboardEntry>[] {
  return [
  {
    accessorKey: "rank",
    header: ({ column }) => <SortHeader label={scope === "UCR" ? "UCR Rank" : "Rank"} column={column} />,
    cell: ({ row }) => <div className="flex items-center gap-1.5 tabular-nums">{row.original.rank <= 3 && <Medal className="size-3.5 text-primary/70" />}<span>{row.original.rank}</span></div>,
  },
  {
    accessorKey: "model",
    header: ({ column }) => <SortHeader label="Method" column={column} />,
    cell: ({ row }) => (
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <Link href={`/methods/${row.original.slug}`} className="truncate font-medium hover:text-primary">{row.original.model}</Link>
          {row.original.isFeatured && <Badge className="shrink-0">Featured</Badge>}
        </div>
        {row.original.organization !== "—" && <p className="mt-0.5 truncate text-xs text-muted-foreground">{row.original.organization}</p>}
      </div>
    ),
  },
  { accessorKey: "avgAccuracy", header: ({ column }) => <SortHeader label={scope === "UCR" ? "UCR Avg." : "Overall Avg."} column={column} />, cell: ({ getValue }) => <Metric value={getValue<number | null>()} /> },
  { accessorKey: "avgRank", header: ({ column }) => <SortHeader label="Avg. Rank" column={column} />, cell: ({ getValue }) => <Metric value={getValue<number | null>()} /> },
  { accessorKey: "ucrAccuracy", header: "UCR", cell: ({ getValue }) => <Metric value={getValue<number | null>()} /> },
  { accessorKey: "ueaAccuracy", header: "UEA", cell: ({ getValue }) => <Metric value={getValue<number | null>()} /> },
  { accessorKey: "coverage", header: "Coverage", cell: ({ getValue }) => <span className="whitespace-nowrap tabular-nums text-muted-foreground">{getValue<string>()}</span> },
  { accessorKey: "evaluationType", header: "Evaluation Type", cell: ({ getValue }) => <Badge variant="secondary" className="whitespace-nowrap">{getValue<EvaluationType>()}</Badge> },
  { id: "paper", header: "Paper", cell: ({ row }) => <ExternalIcon href={row.original.paperUrl} kind="paper" /> },
  { id: "code", header: "Code", cell: ({ row }) => <ExternalIcon href={row.original.codeUrl} kind="code" /> },
  ];
}

function columnClass(columnId: string, scope: "Overall" | "UCR") {
  switch (columnId) {
    case "rank": return "w-[70px]";
    case "model": return "w-[220px]";
    case "avgAccuracy": return "w-[125px]";
    case "avgRank": return "hidden w-[100px] lg:table-cell";
    case "ucrAccuracy": return scope === "UCR" ? "hidden" : "hidden w-[80px] sm:table-cell";
    case "ueaAccuracy": return scope === "UCR" ? "hidden" : "hidden w-[80px] sm:table-cell";
    case "coverage": return "hidden w-[105px] md:table-cell";
    case "evaluationType": return "hidden w-[140px] xl:table-cell";
    case "paper":
    case "code": return "hidden w-[60px] xl:table-cell";
    default: return "";
  }
}

export function LeaderboardTable({ data, compact = false, scope = "Overall" }: { data: LeaderboardEntry[]; compact?: boolean; scope?: "Overall" | "UCR" }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "rank", desc: false }]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<(typeof evaluationTypes)[number]>("All types");
  const filtered = useMemo(() => data.filter((entry) => type === "All types" || entry.evaluationType === type), [data, type]);
  const columns = useMemo(() => getColumns(scope), [scope]);
  // TanStack Table intentionally owns mutable table state; React Compiler skips this hook.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, globalFilter: query },
    onSortingChange: setSorting,
    onGlobalFilterChange: setQuery,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: compact ? 5 : 15 } },
  });

  return (
    <div>
      {!compact && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search method" className="pl-9" /></div>
          <select aria-label="Filter evaluation type" value={type} onChange={(event) => setType(event.target.value as typeof type)} className="h-9 rounded-md border border-input bg-background px-3 text-sm">{evaluationTypes.map((item) => <option key={item}>{item}</option>)}</select>
        </div>
      )}
      <div data-testid="leaderboard-scroll" className="overflow-x-auto rounded-xl border border-border">
        <table data-testid="leaderboard-table" className="w-full min-w-[470px] table-fixed border-collapse text-sm">
          <thead className="bg-muted/95">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>{headerGroup.headers.map((header) => <th key={header.id} className={cn("h-11 border-b border-border px-3 text-left text-xs font-medium text-muted-foreground", columnClass(header.column.id, scope))}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</th>)}</tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className={cn("border-b border-border/70 last:border-0 hover:bg-muted/35", row.original.isFeatured && "bg-primary/[0.035]")}>{row.getVisibleCells().map((cell) => <td key={cell.id} className={cn("h-14 px-3 align-middle", columnClass(cell.column.id, scope))}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>
            ))}
          </tbody>
        </table>
        {table.getRowModel().rows.length === 0 && <EmptyState />}
      </div>
      {!compact && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <p>{table.getFilteredRowModel().rows.length} methods</p>
          <div className="flex items-center gap-2"><span className="tabular-nums">Page {table.getState().pagination.pageIndex + 1} of {Math.max(1, table.getPageCount())}</span><Button variant="outline" size="icon" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Previous page"><ChevronLeft className="size-4" /></Button><Button variant="outline" size="icon" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Next page"><ChevronRight className="size-4" /></Button></div>
        </div>
      )}
    </div>
  );
}
