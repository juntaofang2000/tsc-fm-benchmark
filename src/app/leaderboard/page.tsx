import { AlertCircle } from "lucide-react";
import { LeaderboardView } from "@/components/leaderboard/leaderboard-view";
import { PageHeader } from "@/components/shared/page-header";
import { VerifiedResultsBadge } from "@/components/shared/verified-results-badge";
import { getLowShotLeaderboards, getStandardLeaderboards } from "@/lib/data/leaderboard";

export const metadata = { title: "Leaderboard" };

export default async function LeaderboardPage() {
  const [standardEntries, lowShotEntries] = await Promise.all([
    getStandardLeaderboards(),
    getLowShotLeaderboards(),
  ]);
  return (
    <>
      <PageHeader
        compact
        eyebrow="Unified ranking"
        title="Leaderboard"
        description="Unified evaluation of time series classification foundation models."
      />
      <div className="container-wide py-5 md:py-6">
        <div className="mb-3 flex justify-end">
          <VerifiedResultsBadge />
        </div>
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/[0.04] px-4 py-3 text-sm">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <p>Only methods covering all 198 unique datasets are eligible for the Standard Overall leaderboard.</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Overall Average Accuracy is the unweighted mean across 198 unique datasets. Every dataset receives equal weight, and repeated tasks are counted once.
            </p>
          </div>
        </div>
        <LeaderboardView standardEntries={standardEntries} lowShotEntries={lowShotEntries} />
      </div>
    </>
  );
}
