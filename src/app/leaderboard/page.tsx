import { AlertCircle } from "lucide-react";
import { LeaderboardView } from "@/components/leaderboard/leaderboard-view";
import { LeaderboardStaticSummary } from "@/components/leaderboard/leaderboard-static-summary";
import { PageHeader } from "@/components/shared/page-header";
import { getLowShotLeaderboards, getStandardLeaderboards } from "@/lib/data/leaderboard";

import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { benchmarkProfile } from "@/data/official/benchmark-profile";
import { benchmarkPublication } from "@/config/benchmark-publication";
import { siteConfig } from "@/config/site";
import { StructuredData } from "@/components/shared/structured-data";
import release from "../../../public/release.json";

export const metadata = pageMetadata("/leaderboard");

export default async function LeaderboardPage() {
  const [standardEntries, lowShotEntries] = await Promise.all([
    getStandardLeaderboards(),
    getLowShotLeaderboards(),
  ]);
  return (
    <>
      <StructuredData data={{
        "@context": "https://schema.org", "@type": "Dataset",
        "@id": `${siteConfig.primaryUrl}/leaderboard#dataset`,
        name: "TSC-FM Benchmark Classification Results",
        description: "Public aggregate accuracy, average rank, and dataset coverage for foundation model classification configurations evaluated across 198 time series datasets under Standard and Low-shot settings.",
        url: `${siteConfig.primaryUrl}/leaderboard`,
        mainEntityOfPage: `${siteConfig.primaryUrl}/leaderboard`,
        creator: siteConfig.publishers.map((publisher) => ({ "@type": "Organization", name: publisher.name, ...("url" in publisher ? { url: publisher.url } : {}) })),
        citation: `${benchmarkPublication.title}. ${benchmarkPublication.url}`,
        keywords: ["time series classification", "foundation models", "benchmark results", "TSC-FM"],
        version: release.contentRevision.slice(0, 12),
        measurementTechnique: "Average accuracy and per-dataset average rank under TSC-FM Benchmark Protocol v0.1",
        isAccessibleForFree: true,
      }} />
      <Breadcrumbs items={[{ name: "Leaderboard", path: "/leaderboard" }]} />
      <PageHeader
        compact
        eyebrow="Unified ranking"
        title="Time Series Classification Leaderboard"
        description="Compare foundation models in the TSC-FM Benchmark by accuracy, average rank and coverage, with Standard and Low-shot evaluation."
      />
      <div className="container-wide py-5 md:py-6">
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/[0.04] px-4 py-3 text-sm">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <p>Only configurations covering all {benchmarkProfile.totalDatasetCount} unique datasets are eligible for the Standard Overall leaderboard.</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Standard Overall Average Accuracy is the unweighted mean across {benchmarkProfile.totalDatasetCount} unique datasets. Every dataset receives equal weight. Other views use their displayed dataset coverage.
            </p>
          </div>
        </div>
        <LeaderboardView standardEntries={standardEntries} lowShotEntries={lowShotEntries} />
        <LeaderboardStaticSummary
          standardEntries={standardEntries}
          lowShotEntries={lowShotEntries}
          releaseId={release.contentRevision.slice(0, 12)}
        />
        <section className="prose-panel mt-10">
          <h2>How to compare time series classification foundation models</h2>
          <p>Start with Standard Overall to compare configurations covering all {benchmarkProfile.totalDatasetCount} datasets. Select Univariate or Multivariate when that matches your task. A model name can appear with several classifier heads: the head is part of the evaluated configuration, so the rankings compare complete prediction procedures.</p>
          <p>For few-shot time series classification, select Low-shot and then 5-shot or 10-shot. Compare models within the same budget and scope; dataset eligibility changes with the label budget. Average accuracy weights each eligible dataset equally, while average rank describes performance relative to the comparison set.</p>
          <p>The leaderboard reports classification, where a sequence is assigned a class label. It does not rank time series forecasting models on future-value prediction. Inspect the model pages for checkpoints and configuration results before selecting a model.</p>
        </section>
      </div>
    </>
  );
}

