import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function VerifiedResultsBadge() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="success" className="cursor-help gap-1">
          <BadgeCheck className="size-3" />
          Verified Standard
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        Recomputed from verified records across 198 unique datasets with equal dataset weighting.
      </TooltipContent>
    </Tooltip>
  );
}
