import Link from "next/link";
import { canonicalMethodSlug } from "@/data/official/methods";
import { formatMetric } from "@/lib/utils";
import type { BenchmarkScope, LeaderboardEntry, LowShotSetting } from "@/types";

type StandardLeaderboards = Record<BenchmarkScope, LeaderboardEntry[]>;
type LowShotLeaderboards = Record<LowShotSetting, StandardLeaderboards>;

function datasetCount(entries: LeaderboardEntry[]) {
  return entries[0]?.coverage.split("/")[1] ?? "—";
}

function SummaryTable({
  id,
  testId,
  title,
  description,
  entries,
}: {
  id: string;
  testId: string;
  title: string;
  description: string;
  entries: LeaderboardEntry[];
}) {
  return (
    <article id={id} data-testid={testId} className="scroll-mt-24 rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-4 sm:px-5">
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <caption className="sr-only">Top five configurations for {title}</caption>
          <thead className="bg-muted/70 text-xs text-muted-foreground">
            <tr>
              <th className="h-10 w-16 px-4 text-left font-medium">Rank</th>
              <th className="h-10 px-3 text-left font-medium">Configuration</th>
              <th className="h-10 w-28 px-3 text-right font-medium">Avg. Accuracy</th>
              <th className="h-10 w-24 px-3 text-right font-medium">Avg. Rank</th>
              <th className="h-10 w-24 px-4 text-right font-medium">Coverage</th>
            </tr>
          </thead>
          <tbody>
            {entries.slice(0, 5).map((entry) => (
              <tr key={entry.id} className="border-t border-border/70">
                <td className="h-12 px-4 tabular-nums">{entry.rank}</td>
                <td className="h-12 px-3">
                  <Link href={`/methods/${canonicalMethodSlug(entry.slug)}`} className="font-medium hover:text-primary">
                    {entry.model}
                  </Link>
                </td>
                <td className="h-12 px-3 text-right font-medium tabular-nums">{formatMetric(entry.avgAccuracy)}</td>
                <td className="h-12 px-3 text-right tabular-nums text-muted-foreground">{formatMetric(entry.avgRank)}</td>
                <td className="h-12 px-4 text-right tabular-nums text-muted-foreground">{entry.coverage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function ScopeComparison({
  label,
  scopes,
}: {
  label: string;
  scopes: StandardLeaderboards;
}) {
  const univariate = scopes.Univariate[0];
  const multivariate = scopes.Multivariate[0];

  return (
    <article className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <h3 className="font-semibold">{label}</h3>
      <dl className="mt-4 space-y-4 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Univariate · {datasetCount(scopes.Univariate)} datasets</dt>
          <dd className="mt-1 leading-6">
            <Link href={`/methods/${canonicalMethodSlug(univariate.slug)}`} className="font-medium hover:text-primary">{univariate.model}</Link>
            {" leads at "}<span className="font-medium tabular-nums">{formatMetric(univariate.avgAccuracy)}</span>
            {" average accuracy."}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Multivariate · {datasetCount(scopes.Multivariate)} datasets</dt>
          <dd className="mt-1 leading-6">
            <Link href={`/methods/${canonicalMethodSlug(multivariate.slug)}`} className="font-medium hover:text-primary">{multivariate.model}</Link>
            {" leads at "}<span className="font-medium tabular-nums">{formatMetric(multivariate.avgAccuracy)}</span>
            {" average accuracy."}
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function LeaderboardStaticSummary({
  standardEntries,
  lowShotEntries,
  releaseId,
}: {
  standardEntries: StandardLeaderboards;
  lowShotEntries: LowShotLeaderboards;
  releaseId: string;
}) {
  const standardCount = datasetCount(standardEntries.Overall);
  const fiveShotCount = datasetCount(lowShotEntries["5-shot"].Overall);
  const tenShotCount = datasetCount(lowShotEntries["10-shot"].Overall);

  return (
    <section aria-labelledby="published-summaries-heading" className="mt-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Server-rendered result summary</p>
          <h2 id="published-summaries-heading" className="mt-2 text-2xl font-semibold tracking-tight">Published leaderboard summaries</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            These tables summarize the same verified results as the interactive explorer above and are included directly in the page HTML.
          </p>
        </div>
        <p className="shrink-0 text-xs text-muted-foreground">Protocol v0.1 · Release {releaseId}</p>
      </div>

      <div className="mt-6 grid gap-5">
        <SummaryTable
          id="standard-overall-summary"
          testId="server-summary-standard"
          title="Standard Overall"
          description={`${standardEntries.Overall.length} complete configurations across ${standardCount} datasets. Each dataset has equal weight; rank is ordered by mean accuracy and average rank is recomputed within this view.`}
          entries={standardEntries.Overall}
        />
        <SummaryTable
          id="low-shot-5-summary"
          testId="server-summary-5-shot"
          title="5-shot Overall"
          description={`${lowShotEntries["5-shot"].Overall.length} complete configurations across ${fiveShotCount} eligible datasets with five labeled examples per class. Results are ranked only against this budget and scope.`}
          entries={lowShotEntries["5-shot"].Overall}
        />
        <SummaryTable
          id="low-shot-10-summary"
          testId="server-summary-10-shot"
          title="10-shot Overall"
          description={`${lowShotEntries["10-shot"].Overall.length} complete configurations across ${tenShotCount} eligible datasets with ten labeled examples per class. Results are ranked only against this budget and scope.`}
          entries={lowShotEntries["10-shot"].Overall}
        />
      </div>

      <div id="modality-summary" data-testid="server-summary-modality" className="mt-8 scroll-mt-24">
        <h2 className="text-xl font-semibold tracking-tight">Univariate and multivariate leaders</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          The two scopes use different dataset pools, so compare configurations within the same column rather than comparing their accuracy values as if they came from one test set.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <ScopeComparison label="Standard" scopes={standardEntries} />
          <ScopeComparison label="5-shot" scopes={lowShotEntries["5-shot"]} />
          <ScopeComparison label="10-shot" scopes={lowShotEntries["10-shot"]} />
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-muted/25 p-4 text-sm leading-6 text-muted-foreground sm:p-5">
        <p>
          <strong className="text-foreground">How ranking works.</strong> Average Accuracy is the unweighted mean across the eligible datasets shown by Coverage. Exact accuracy ties within 1e-12 receive average ranks. Low-shot budgets and modality scopes remain separate.
        </p>
        <p className="mt-2">
          Read the complete <Link href="/evaluation#ranking" className="font-medium text-primary underline underline-offset-4">ranking rules and reproducibility protocol</Link>. The release identifier above is a content fingerprint for the currently published public results.
        </p>
      </div>
    </section>
  );
}

