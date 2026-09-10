import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { benchmarkProfile } from "@/data/official/benchmark-profile";

export function VerifiedResultsBadge({ label = "Verified Standard", datasetCount = benchmarkProfile.totalDatasetCount, scope = "Overall" }: { label?: string; datasetCount?: number; scope?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="success" className="cursor-help gap-1">
          <BadgeCheck className="size-3" />
          {label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        {scope}: recomputed from verified records across {datasetCount} datasets with equal dataset weighting.
      </TooltipContent>
    </Tooltip>
  );
}
