"use client";

import { Code2, ExternalLink, FileText, Package } from "lucide-react";
import type { LeaderboardEntry, Method } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricCard } from "@/components/shared/metric-card";
import { Badge } from "@/components/ui/badge";
import { formatMetric } from "@/lib/utils";

function Resource({ label, href, icon: Icon, unavailable }: { label: string; href: string | null; icon: typeof FileText; unavailable?: string }) {
  return <li className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-0"><span className="inline-flex items-center gap-2 font-medium"><Icon className="size-4 text-muted-foreground" />{label}</span>{href ? <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">Open official resource<ExternalLink className="size-3.5" /></a> : <span className="text-sm text-muted-foreground">{unavailable ?? "Not available"}</span>}</li>;
}

export function MethodDetailTabs({ method, result }: { method: Method; result: LeaderboardEntry | null }) {
  return <Tabs defaultValue="overview">
    <div className="no-scrollbar overflow-x-auto"><TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="results">Results</TabsTrigger><TabsTrigger value="resources">Resources</TabsTrigger></TabsList></div>
    <TabsContent value="overview"><div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="prose-panel"><h2>Method overview</h2><p>{method.description}</p><h3>Evaluated configurations</h3><div className="flex flex-wrap gap-2">{method.evaluatedConfigurations.map((item) => <Badge key={item} variant="outline">{item}</Badge>)}</div><p>Classifier heads are grouped on this page under their shared pretrained model. They remain separate leaderboard entries because they represent different experimental configurations.</p></div>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border">{[["Organization",method.organization],["Parameters",method.parameterCount],["Checkpoint used",method.checkpointName],["Input Type",method.inputType],["Inference",method.inferenceParadigm]].map(([label,value]) => <div key={label} className={label === "Organization" || label === "Checkpoint used" || label === "Inference" ? "col-span-2 bg-card p-4" : "bg-card p-4"}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-sm font-medium">{value ?? "Not reported"}</dd></div>)}</dl>
    </div></TabsContent>
    <TabsContent value="results"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><MetricCard label="Aggregate Accuracy" value={formatMetric(result?.avgAccuracy ?? null)} /><MetricCard label="Univariate Accuracy" value={formatMetric(result?.univariateAccuracy ?? null)} /><MetricCard label="Multivariate Accuracy" value={formatMetric(result?.multivariateAccuracy ?? null)} /><MetricCard label="Average Rank" value={formatMetric(result?.avgRank ?? null)} /><MetricCard label="Coverage" value={result?.coverage ?? "See leaderboard configurations"} /></div><p className="mt-4 text-sm leading-6 text-muted-foreground">For representation models, results are reported separately for each fitted classifier on the leaderboard.</p></TabsContent>
    <TabsContent value="resources"><div className="rounded-xl border border-border bg-card px-5"><ul><Resource label="Paper" href={method.paperUrl} icon={FileText} /><Resource label="Code" href={method.codeUrl} icon={Code2} /><Resource label="Checkpoint" href={method.checkpointUrl} icon={Package} unavailable={method.checkpointName} /></ul></div></TabsContent>
  </Tabs>;
}
