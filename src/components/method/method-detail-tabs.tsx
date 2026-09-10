"use client";

import { Code2, ExternalLink, FileText, Package } from "lucide-react";
import type { Method, MethodResultGroup } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatMetric } from "@/lib/utils";

function Resource({ label, href, icon: Icon, unavailable }: { label: string; href: string | null; icon: typeof FileText; unavailable?: string }) {
  return <li className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-0"><span className="inline-flex items-center gap-2 font-medium"><Icon className="size-4 text-muted-foreground" />{label}</span>{href ? <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">Open official resource<ExternalLink className="size-3.5" /></a> : <span className="text-sm text-muted-foreground">{unavailable ?? "Not available"}</span>}</li>;
}

export function MethodDetailTabs({ method, results }: { method: Method; results: MethodResultGroup[] }) {
  return <Tabs defaultValue="overview">
    <div className="no-scrollbar overflow-x-auto"><TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="results">Results</TabsTrigger><TabsTrigger value="resources">Resources</TabsTrigger></TabsList></div>
    <TabsContent value="overview"><div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="prose-panel"><h2>Method overview</h2><p>{method.description}</p><h3>Evaluated configurations</h3><div className="flex flex-wrap gap-2">{method.evaluatedConfigurations.map((item) => <Badge key={item} variant="outline">{item}</Badge>)}</div><p>Classifier heads are grouped on this page under their shared pretrained model. They remain separate leaderboard entries because they represent different experimental configurations.</p></div>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border">{[["Organization",method.organization],["Parameters",method.parameterCount],["Checkpoint used",method.checkpointName],["Input Type",method.inputType],["Inference",method.inferenceParadigm]].map(([label,value]) => <div key={label} className={label === "Organization" || label === "Checkpoint used" || label === "Inference" ? "col-span-2 bg-card p-4" : "bg-card p-4"}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-sm font-medium">{value ?? "Not reported"}</dd></div>)}</dl>
    </div></TabsContent>
    <TabsContent value="results">
      <p className="mb-5 text-sm leading-6 text-muted-foreground">Each configuration is reported separately for its evaluation setting and dataset scope. Rank and average rank use the full comparison set for that setting and scope, including other models. Scores are not averaged across configurations.</p>
      {results.length === 0 ? <p className="rounded-lg border border-border p-5 text-sm text-muted-foreground">No published results are available for this model.</p> : <div className="space-y-6">{results.map((group) => <section key={`${group.setting}-${group.scope}`} className="overflow-hidden rounded-xl border border-border">
        <div className="bg-muted/40 p-4"><h2 className="font-semibold">{group.setting} · {group.scope}</h2><p className="mt-1 text-xs text-muted-foreground">Coverage: {group.entries[0].coverage} datasets · Comparison set: {group.comparisonCount} configurations{group.setting !== "Standard" && " · Budget-feasible Low-shot subset"}</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-sm"><thead><tr className="border-y border-border text-left text-xs text-muted-foreground"><th className="px-4 py-3">Configuration</th><th className="px-4 py-3">{group.scope} Rank</th><th className="px-4 py-3">{group.scope} Accuracy (%)</th><th className="px-4 py-3">Avg. Rank</th><th className="px-4 py-3">Coverage</th></tr></thead><tbody>{group.entries.map((entry) => <tr key={entry.id} className="border-b border-border last:border-0"><td className="px-4 py-3 font-medium">{entry.model}</td><td className="px-4 py-3 tabular-nums">{entry.rank}</td><td className="px-4 py-3 tabular-nums">{formatMetric(entry.avgAccuracy)}</td><td className="px-4 py-3 tabular-nums">{formatMetric(entry.avgRank)}</td><td className="px-4 py-3 tabular-nums">{entry.coverage}</td></tr>)}</tbody></table></div>
      </section>)}</div>}
    </TabsContent>
    <TabsContent value="resources"><div className="rounded-xl border border-border bg-card px-5"><ul><Resource label="Paper" href={method.paperUrl} icon={FileText} /><Resource label="Code" href={method.codeUrl} icon={Code2} /><Resource label="Checkpoint" href={method.checkpointUrl} icon={Package} unavailable={method.checkpointName} /></ul></div></TabsContent>
  </Tabs>;
}
