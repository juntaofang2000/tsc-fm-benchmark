"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Code2, FileText, Package, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import type { Method } from "@/types";

const categories = ["All", "Representation Learning", "In-Context Learning"];

function ResourceLink({ href, label, icon: Icon }: { href: string | null; label: string; icon: typeof Code2 }) {
  if (!href) return <span className="whitespace-nowrap text-xs text-muted-foreground">Not released</span>;
  return <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-primary hover:underline"><Icon className="size-3.5" />{label}</a>;
}

export function MethodTable({ methods }: { methods: Method[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const filtered = useMemo(
    () => methods.filter((method) =>
      (category === "All" || method.category === category)
      && `${method.name} ${method.organization} ${method.evaluatedConfigurations.join(" ")}`.toLowerCase().includes(query.toLowerCase()),
    ),
    [methods, query, category],
  );

  return <div>
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="relative w-full md:max-w-xs"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search models or organizations" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={category === item ? "whitespace-nowrap rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground" : "whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"}>{item}</button>)}</div>
    </div>
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[1160px] text-sm">
        <thead className="bg-muted/70"><tr>{["Model", "Organization", "Parameters", "Evaluated configurations", "Paper", "Code", "Checkpoint"].map((label) => <th key={label} className="h-11 border-b border-border px-4 text-left text-xs font-medium text-muted-foreground">{label}</th>)}</tr></thead>
        <tbody>{filtered.map((method) => <tr key={method.id} className="border-b border-border/70 last:border-0 hover:bg-muted/30">
          <td className="px-4 py-4 align-top"><Link href={`/methods/${method.slug}`} className="font-medium hover:text-primary">{method.name}</Link><div className="mt-1"><Badge variant="secondary">{method.category}</Badge></div></td>
          <td className="max-w-[280px] px-4 py-4 align-top text-xs leading-5 text-muted-foreground">{method.organization}</td>
          <td className="max-w-[190px] px-4 py-4 align-top text-xs leading-5">{method.parameterCount}</td>
          <td className="max-w-[260px] px-4 py-4 align-top"><p className="text-xs font-medium">{method.checkpointName}</p><div className="mt-2 flex flex-wrap gap-1.5">{method.evaluatedConfigurations.map((item) => <Badge key={item} variant="outline">{item}</Badge>)}</div></td>
          <td className="px-4 py-4 align-top"><ResourceLink href={method.paperUrl} label="Paper" icon={FileText} /></td>
          <td className="px-4 py-4 align-top"><ResourceLink href={method.codeUrl} label="Code" icon={Code2} /></td>
          <td className="px-4 py-4 align-top"><ResourceLink href={method.checkpointUrl} label="Weights" icon={Package} /></td>
        </tr>)}</tbody>
      </table>
      {filtered.length === 0 && <EmptyState />}
    </div>
    <p className="mt-4 text-xs leading-5 text-muted-foreground">Parameter counts marked as backbone-only exclude dataset-specific classifier heads. “Not reported” is used when an official source does not publish the full count.</p>
  </div>;
}
