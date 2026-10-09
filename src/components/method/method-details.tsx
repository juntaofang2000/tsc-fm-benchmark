import Link from "next/link";
import { Code2, ExternalLink, FileText, Package } from "lucide-react";
import type { Method, MethodResultGroup } from "@/types";
import { Badge } from "@/components/ui/badge";
import { formatMetric } from "@/lib/utils";

function Resource({ label, href, icon: Icon, unavailable }: { label: string; href: string | null; icon: typeof FileText; unavailable?: string }) {
  return <li className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-0"><span className="inline-flex items-center gap-2 font-medium"><Icon className="size-4" />{label}</span>{href ? <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">Open official resource<ExternalLink className="size-3.5" /></a> : <span className="text-sm text-muted-foreground">{unavailable ?? "Not available"}</span>}</li>;
}

function ResultGroup({ method, group }: { method: Method; group: MethodResultGroup }) {
  const highest = group.entries.filter((entry) => entry.avgAccuracy !== null)
    .reduce<MethodResultGroup["entries"][number] | undefined>((best, entry) => !best || entry.avgAccuracy! > best.avgAccuracy! ? entry : best, undefined);
  const id = `results-${group.setting.toLowerCase()}-${group.scope.toLowerCase()}`;
  return <section id={id} data-result-setting={group.setting} data-result-scope={group.scope} className="scroll-mt-24 overflow-hidden rounded-xl border border-border">
    <div className="bg-muted/40 p-4">
      <h3 className="font-semibold">{group.setting} · {group.scope}</h3>
      <p className="mt-1 text-xs text-muted-foreground">Comparison set: {group.comparisonCount} configurations{group.setting !== "Standard" && " · Budget-feasible Low-shot subset"}</p>
    </div>
    <div className="px-4 py-4 text-sm leading-6 text-muted-foreground">
      <p>This {group.setting} time series classification comparison reports {group.entries.length} {method.name} {group.entries.length === 1 ? "configuration" : "configurations"} for the {group.scope.toLowerCase()} dataset scope. Each row shows its own coverage.</p>
      {highest && <p className="mt-2">The highest reported average accuracy among this model&apos;s configurations in this setting is {formatMetric(highest.avgAccuracy)}%, reported by <span className="font-medium text-foreground">{highest.model}</span> with coverage {highest.coverage}. This configuration ranks {highest.rank} of {group.comparisonCount} in this comparison set. The result describes this configuration and setting, rather than every possible use of the pretrained model.</p>}
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-sm">
        <caption className="sr-only">{method.name} — {group.setting} {group.scope} time series classification benchmark results</caption>
        <thead><tr className="border-y border-border text-left text-xs text-muted-foreground">
          {["Configuration", `${group.scope} Rank`, `${group.scope} Accuracy (%)`, "Avg. Rank", "Coverage"].map((label) => <th key={label} scope="col" className="px-4 py-3">{label}</th>)}
        </tr></thead>
        <tbody>{group.entries.map((entry) => <tr key={entry.id} className="border-b border-border last:border-0">
          <th scope="row" className="px-4 py-3 text-left font-medium">{entry.model}</th>
          <td className="px-4 py-3 tabular-nums">{entry.rank}</td>
          <td className="px-4 py-3 tabular-nums">{formatMetric(entry.avgAccuracy)}</td>
          <td className="px-4 py-3 tabular-nums">{formatMetric(entry.avgRank)}</td>
          <td className="px-4 py-3 tabular-nums">{entry.coverage}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </section>;
}

// All result groups are server rendered; anchor navigation works without scripts.
export function MethodDetails({ method, results }: { method: Method; results: MethodResultGroup[] }) {
  return <div className="space-y-10">
    <nav aria-label={`${method.name} page sections`} className="flex flex-wrap gap-2 rounded-lg border border-border bg-muted/30 p-2">
      {[["overview", "Overview"], ["results", "Benchmark results"], ["resources", "Paper, code & checkpoint"]].map(([id, label]) => <a key={id} href={`#${id}`} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-background hover:text-primary">{label}</a>)}
    </nav>
    <section id="overview" className="grid scroll-mt-24 gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="prose-panel">
        <h2>Using {method.name} for time series classification</h2>
        <p>{method.description}</p>
        <p>In this benchmark, {method.name} is evaluated using {method.inferenceParadigm.toLowerCase()}. Checkpoint information: {method.checkpointName}. Check the results below for the settings and dataset scopes with published scores.</p>
        <h3>Evaluated configurations</h3>
        <div className="flex flex-wrap gap-2">{method.evaluatedConfigurations.map((item) => <Badge key={item} variant="outline">{item}</Badge>)}</div>
        <p>Classifier heads are grouped under their shared pretrained model here. They remain separate leaderboard entries because they are different experimental configurations.</p>
      </div>
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border">
        {[["Organization", method.organization], ["Parameters", method.parameterCount], ["Checkpoint used", method.checkpointName], ["Input Type", method.inputType], ["Inference", method.inferenceParadigm]].map(([label, value]) => <div key={label} className={label === "Organization" || label === "Checkpoint used" || label === "Inference" ? "col-span-2 bg-card p-4" : "bg-card p-4"}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-sm font-medium">{value ?? "Not reported"}</dd></div>)}
      </dl>
    </section>
    <section id="results" className="scroll-mt-24">
      <h2 className="text-xl font-semibold">{method.name} classification benchmark results</h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">Compare accuracy and average rank only within the same evaluation setting and dataset scope. Standard uses the official training splits; 5-shot and 10-shot use different budget-feasible subsets. Rank and average rank include other models in the full comparison set. Scores are not averaged across configurations.</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">For comparisons with other backbones, open the <Link href="/leaderboard" className="text-primary underline underline-offset-4">foundation model classification leaderboard</Link> and use the same setting and scope. The <Link href="/evaluation#low-shot" className="text-primary underline underline-offset-4">few-shot evaluation protocol</Link> explains the label budgets.</p>
      {results.length === 0 ? <p className="mt-5 rounded-lg border border-border p-5 text-sm text-muted-foreground">No published results are available for this model.</p> : <div className="mt-5 space-y-6">{results.map((group) => <ResultGroup key={`${group.setting}-${group.scope}`} method={method} group={group} />)}</div>}
    </section>
    <section id="resources" className="scroll-mt-24">
      <h2 className="text-xl font-semibold">{method.name} paper, code and checkpoint</h2>
      <div className="mt-4 rounded-xl border border-border bg-card px-5"><ul>
        <Resource label="Paper" href={method.paperUrl} icon={FileText} />
        <Resource label="Code" href={method.codeUrl} icon={Code2} />
        <Resource label="Checkpoint" href={method.checkpointUrl} icon={Package} unavailable={method.checkpointName} />
      </ul></div>
    </section>
  </div>;
}
