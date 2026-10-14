import Link from "next/link";
import { canonicalMethodSlug } from "@/data/official/methods";
import { getLowShotLeaderboards, getStandardLeaderboards } from "@/lib/data/leaderboard";
import { formatMetric } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types";

function ConfigurationLink({ entry }: { entry: LeaderboardEntry }) {
  return <Link href={`/methods/${canonicalMethodSlug(entry.slug)}`} className="font-medium text-primary underline underline-offset-4">{entry.model}</Link>;
}

export async function HomeResearchSummary() {
  const [standard, lowShot] = await Promise.all([getStandardLeaderboards(), getLowShotLeaderboards()]);
  const [leader, runnerUp] = standard.Overall;
  const gap = leader.avgAccuracy !== null && runnerUp.avgAccuracy !== null
    ? leader.avgAccuracy - runnerUp.avgAccuracy
    : null;
  const fiveShot = lowShot["5-shot"].Overall[0];
  const tenShot = lowShot["10-shot"].Overall[0];
  const modalityResults = (["5-shot", "10-shot"] as const).map((setting) => ({
    setting,
    univariate: lowShot[setting].Univariate[0],
    multivariate: lowShot[setting].Multivariate[0],
  }));

  return (
    <section id="research-summary" aria-labelledby="research-summary-heading" className="scroll-mt-24 border-y border-border bg-muted/25">
      <div className="container-wide py-10 md:py-12">
        <div data-testid="home-benchmark-purpose" className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Benchmark purpose</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Why compare classification configurations?</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            A pretrained backbone is only one part of a classifier. In-context methods use labeled examples at prediction time, while frozen encoders need a classifier fitted on their representations. Changing that classifier or the label budget changes the configuration being evaluated. A model name alone does not describe this comparison.
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            TSC-FM makes the configuration, label budget and dataset coverage explicit. It compares classification predictions on official train/test splits, with equal weight for each dataset. Researchers can check which configurations lead within a setting, how the ordering differs by input type, and where coverage limits a comparison.
          </p>
        </div>

        <div data-testid="home-research-findings" className="mt-8">
          <h2 id="research-summary-heading" className="text-xl font-semibold tracking-tight">What the current results show</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
            These observations use the same published results as the leaderboard. They describe the evaluated configurations and task pools; they are not claims of universal superiority or statistical significance.
          </p>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <article className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold">A close Standard Overall comparison</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                <ConfigurationLink entry={leader} /> leads {standard.Overall.length} complete configurations with {formatMetric(leader.avgAccuracy)}% mean accuracy and {formatMetric(leader.avgRank)} average rank across {leader.coverage} datasets. <ConfigurationLink entry={runnerUp} /> follows at {formatMetric(runnerUp.avgAccuracy)}%.
                {gap !== null && <> The mean-accuracy gap is {formatMetric(gap)} percentage points; this aggregate gap alone does not establish statistical significance.</>}
              </p>
              <Link href="/leaderboard#standard-overall-summary" className="mt-4 inline-flex text-sm font-medium text-primary underline underline-offset-4">Compare Standard results</Link>
            </article>
            <article className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold">Low-shot Overall leaders differ by budget</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                At five labels per class, <ConfigurationLink entry={fiveShot} /> leads with {formatMetric(fiveShot.avgAccuracy)}% mean accuracy on {fiveShot.coverage} datasets. At ten labels per class, <ConfigurationLink entry={tenShot} /> leads with {formatMetric(tenShot.avgAccuracy)}% on {tenShot.coverage} datasets.
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">The eligible pools differ, so subtracting these means would not isolate the effect of adding labels.</p>
              <Link href="/evaluation#low-shot" className="mt-4 inline-flex text-sm font-medium text-primary underline underline-offset-4">Check low-shot eligibility</Link>
            </article>
            <article className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold">Input type changes the low-shot leader</h3>
              <ul className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
                {modalityResults.map(({ setting, univariate, multivariate }) => (
                  <li key={setting}>
                    <span className="font-medium text-foreground">{setting}:</span> <ConfigurationLink entry={univariate} /> leads Univariate at {formatMetric(univariate.avgAccuracy)}% ({univariate.coverage}); <ConfigurationLink entry={multivariate} /> leads Multivariate at {formatMetric(multivariate.avgAccuracy)}% ({multivariate.coverage}).
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Choose the relevant input type before using an Overall rank to shortlist configurations.</p>
              <Link href="/leaderboard#modality-summary" className="mt-4 inline-flex text-sm font-medium text-primary underline underline-offset-4">Compare modality results</Link>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
