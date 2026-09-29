import { AlertCircle } from "lucide-react";
import { LeaderboardView } from "@/components/leaderboard/leaderboard-view";
import { PageHeader } from "@/components/shared/page-header";
import { getLowShotLeaderboards, getStandardLeaderboards } from "@/lib/data/leaderboard";

import { pageMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { benchmarkProfile } from "@/data/official/benchmark-profile";

export const metadata = pageMetadata("/leaderboard");

export default async function LeaderboardPage() {
  const [standardEntries, lowShotEntries] = await Promise.all([
    getStandardLeaderboards(),
    getLowShotLeaderboards(),
  ]);
  return (
    <>
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
      </div>
    </>
  );
}
