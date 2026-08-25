"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CircleDashed, Code2, FileText, Package, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import type { Method } from "@/types";

const categories = ["All", "Foundation Models", "Representation Learning", "In-Context Learning", "Supervised"];

function LinkIcon({ href, label, icon: Icon }: { href: string | null; label: string; icon: typeof Code2 }) {
  return href ? <a href={href} aria-label={label} className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"><Icon className="size-4" /></a> : <span className="inline-flex size-8 items-center justify-center text-muted-foreground">—</span>;
}

export function MethodTable({ methods }: { methods: Method[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const filtered = useMemo(() => methods.filter((method) => (category === "All" || method.category === category) && `${method.name} ${method.organization}`.toLowerCase().includes(query.toLowerCase())), [methods, query, category]);

  return <div><div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div className="relative w-full md:max-w-xs"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Search methods" value={query} onChange={(event) => setQuery(event.target.value)} /></div><div className="no-scrollbar flex gap-2 overflow-x-auto">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={category === item ? "whitespace-nowrap rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground" : "whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"}>{item}</button>)}</div></div><div className="overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[850px] text-sm"><thead className="bg-muted/70"><tr>{["Model", "Organization", "Category", "Paper", "Code", "Checkpoint", "Evaluation Status"].map((label) => <th key={label} className="h-11 border-b border-border px-4 text-left text-xs font-medium text-muted-foreground">{label}</th>)}</tr></thead><tbody>{filtered.map((method) => <tr key={method.id} className="border-b border-border/70 last:border-0 hover:bg-muted/30"><td className="h-14 px-4"><Link href={`/methods/${method.slug}`} className="font-medium hover:text-primary">{method.name}</Link></td><td className="px-4 text-muted-foreground">{method.organization}</td><td className="px-4"><Badge variant="secondary">{method.category}</Badge></td><td className="px-4"><LinkIcon href={method.paperUrl} label="Paper" icon={FileText} /></td><td className="px-4"><LinkIcon href={method.codeUrl} label="Code" icon={Code2} /></td><td className="px-4"><LinkIcon href={method.checkpointUrl} label="Checkpoint" icon={Package} /></td><td className="px-4"><span className="inline-flex items-center gap-1.5 text-xs">{method.evaluationStatus === "Complete" ? <CheckCircle2 className="size-4 text-emerald-600" /> : <CircleDashed className="size-4 text-muted-foreground" />}{method.evaluationStatus}</span></td></tr>)}</tbody></table>{filtered.length === 0 && <EmptyState />}</div></div>;
}
