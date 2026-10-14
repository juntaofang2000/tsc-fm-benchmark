import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { VerifiedResultsBadge } from "@/components/shared/verified-results-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { benchmarkProfile, evaluationTracks } from "@/data/official/benchmark-profile";
import { getLeaderboard } from "@/lib/data/leaderboard";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import { StructuredData } from "@/components/shared/structured-data";
import { benchmarkPublication } from "@/config/benchmark-publication";
import { HomeResearchSummary } from "@/components/home/home-research-summary";

export const metadata = pageMetadata("/");

const scope = [`${benchmarkProfile.totalDatasetCount} datasets`, "Univariate", "Multivariate", "Low-shot", "Training-Free / ICL", "Frozen-Probe"];

export default async function Home() {
  const leaders = await getLeaderboard({ track: "Overall", limit: 5 });
  const stats = [
    ["Total", benchmarkProfile.totalDatasetCount],
    ["Univariate", benchmarkProfile.univariateCount],
    ["Multivariate", benchmarkProfile.multivariateCount],
    ["Tracks", benchmarkProfile.trackCount],
  ] as const;

  return (
    <>
      <StructuredData data={{
        "@context": "https://schema.org", "@type": "CollectionPage",
        "@id": `${siteConfig.primaryUrl}/#webpage`, url: `${siteConfig.primaryUrl}/`,
        name: siteConfig.seoTitle, description: siteConfig.description, inLanguage: "en",
        isPartOf: { "@id": `${siteConfig.primaryUrl}/#website` },
        about: [{ "@type": "Thing", name: "Time series classification" }, { "@type": "Thing", name: "Foundation model evaluation" }, { "@id": `${siteConfig.primaryUrl}/leaderboard#dataset` }],
        citation: { "@type": "ScholarlyArticle", "@id": benchmarkPublication.url, name: benchmarkPublication.title, url: benchmarkPublication.url, datePublished: benchmarkPublication.datePublished },
        mainEntity: {
          "@type": "ItemList", name: "TSC-FM Benchmark resources",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Time Series Classification Leaderboard", url: `${siteConfig.primaryUrl}/leaderboard` },
            { "@type": "ListItem", position: 2, name: "Dataset Profile", url: `${siteConfig.primaryUrl}/benchmarks` },
            { "@type": "ListItem", position: 3, name: "Evaluated Foundation Models", url: `${siteConfig.primaryUrl}/methods` },
            { "@type": "ListItem", position: 4, name: "Evaluation Protocol", url: `${siteConfig.primaryUrl}/evaluation` },
          ],
        },
      }} />
      <section className="border-b border-border bg-[linear-gradient(to_bottom,var(--background),color-mix(in_srgb,var(--muted)_45%,var(--background)))]">
        <div className="container-wide grid min-h-[470px] items-center gap-8 py-10 md:py-12 lg:grid-cols-[1.2fr_.8fr]">
          <div>
            <Badge variant="outline" className="mb-4">TSC-FM Benchmark</Badge>
            <h1 className="max-w-4xl text-4xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-5xl">
              Time Series Classification Benchmark for <span className="text-primary">Foundation Models</span>
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">
              TSC-FM Benchmark is a time series classification benchmark for foundation models, spanning {benchmarkProfile.totalDatasetCount} unique datasets. Compare Standard and Low-shot results across in-context and frozen-probe approaches, with equal weighting for every dataset.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild><Link href="/leaderboard">Explore Leaderboard <ArrowRight className="size-4" /></Link></Button>
              <Button variant="outline" asChild><Link href="/benchmarks">Dataset Profile</Link></Button>
              <Button variant="outline" asChild><a href={benchmarkPublication.url} target="_blank" rel="noreferrer">Read the Paper</a></Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">{scope.map((item) => <Badge key={item} variant="secondary">{item}</Badge>)}</div>
          </div>
          <div>
            <Card className="overflow-hidden">
              <div className="border-b border-border bg-muted/50 px-5 py-2.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Benchmark composition</div>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border">
                  {stats.map(([label, value]) => (
                    <div key={label} className="bg-card p-3.5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1.5 text-xl font-semibold tabular-nums">{value}</p></div>
                  ))}
                </div>
                <div className="mt-4 overflow-hidden rounded-full bg-muted" aria-label="Dataset modality composition">
                  <div className="flex h-2.5">
                    <div className="bg-primary" style={{ width: `${benchmarkProfile.univariateShare}%` }} />
                    <div className="bg-primary/35" style={{ width: `${benchmarkProfile.multivariateShare}%` }} />
                  </div>
                </div>
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>Univariate {benchmarkProfile.univariateShare}%</span><span>Multivariate {benchmarkProfile.multivariateShare}%</span>
                </div>
                <div className="mt-4 space-y-2.5">
                  {["Equal dataset weighting", "Reviewed metadata coverage", "Primary metric: Accuracy"].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm"><span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary"><Check className="size-3.5" /></span>{item}</div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="section-space">
        <div className="container-wide">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{benchmarkProfile.totalDatasetCount} unique datasets</p><VerifiedResultsBadge /></div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Overall Leaderboard Preview</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Ranked by mean accuracy with equal weighting across {benchmarkProfile.totalDatasetCount} unique datasets.</p>
            </div>
            <Button variant="outline" asChild><Link href="/leaderboard">View Full Leaderboard <ArrowRight className="size-4" /></Link></Button>
          </div>
          <LeaderboardTable data={leaders} compact />
        </div>
      </section>

      <HomeResearchSummary />

      <section className="container-wide py-10 md:py-12">
        <h2 className="text-2xl font-semibold tracking-tight">Choose a configuration for your classification task</h2>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">
          Start with the input type and the number of labels available for your task. Standard uses the full official training split; 5-shot and 10-shot use five or ten labels per class on their own eligible dataset pools. Then choose whether you need in-context prediction or a frozen encoder with a fitted classifier.
        </p>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">
          The unit of comparison is a complete classification configuration: a pretrained model, its target prediction approach and a defined label budget. The same backbone can appear with different classifier heads, so compare configurations within the same dataset scope and evaluation setting rather than treating a model name as a single score.
        </p>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">
          Use the <Link className="text-primary underline underline-offset-4" href="/leaderboard">classification leaderboard</Link> to compare average accuracy, average rank and dataset coverage.
          {" "}The catalog of <Link className="text-primary underline underline-offset-4" href="/methods">foundation models for time series classification</Link> provides evaluated configurations and available paper, code and checkpoint references, while the <Link className="text-primary underline underline-offset-4" href="/evaluation">evaluation protocol</Link> explains full-training and 5-shot / 10-shot comparisons. Low-shot coverage is reported separately for each label budget.
        </p>
        <h3 className="mt-6 text-lg font-semibold">Scope and limits of the published results</h3>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">
          These rankings summarize classification accuracy on the published task pools. They do not establish the best model for every individual dataset, measure forecasting quality, or rank deployment latency and memory. The public site reports aggregate results and dataset profiles; it does not publish individual dataset or suite identities. Read the <Link className="text-primary underline underline-offset-4" href="/evaluation#ranking">ranking definitions</Link> and <Link className="text-primary underline underline-offset-4" href="/benchmarks">dataset coverage</Link> before transferring a result to a new application.
        </p>
      </section>

      <section id="research-paper" className="container-wide border-t border-border py-10 md:py-12 scroll-mt-24">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Research behind the benchmark</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">{benchmarkPublication.title}</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            The accompanying survey introduces the TSC-FM Benchmark and examines how the target classification procedure affects comparisons between foundation models.
            Use the <Link href="/leaderboard" className="text-primary underline underline-offset-4">live classification results</Link> alongside the paper and the <Link href="/evaluation" className="text-primary underline underline-offset-4">evaluation protocol</Link> to check the setting, configuration and dataset scope of a comparison.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">{benchmarkPublication.status} · Published September 24, 2026</p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Jointly released by {siteConfig.publishers.map((publisher) => publisher.name).join(" and ")}. Maintained by <a href={siteConfig.maintainer.url} className="text-primary underline underline-offset-4">{siteConfig.maintainer.name}</a>. New model submissions are reviewed before their results enter the official leaderboard.
          </p>
          <a href={benchmarkPublication.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-medium text-primary underline underline-offset-4">Read the survey and benchmark paper</a>
        </div>
      </section>

      <section className="container-wide border-t border-border py-10 md:py-12">
        <div className="grid gap-7 lg:grid-cols-[.65fr_1.35fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Protocol</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Evaluation Tracks</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Standard and Low-shot define the label budget. ICL and Frozen-Probe describe how predictions are produced; these approaches can appear in either budget setting. Results remain separated by budget and dataset scope.</p>
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            {evaluationTracks.map((track, index) => (
              <div key={track.name} className="grid gap-1 border-b border-border px-4 py-3 last:border-0 sm:grid-cols-[150px_1fr] sm:gap-5">
                <h3 className="text-sm font-semibold"><span className="mr-2 text-xs font-medium tabular-nums text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>{track.name}</h3>
                <p className="text-xs leading-5 text-muted-foreground">{track.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
