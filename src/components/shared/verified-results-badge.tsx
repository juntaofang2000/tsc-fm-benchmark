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
        Recomputed from per-dataset records for 128 UCR, 30 UEA, and 66 MVCore66 tasks. Overall keeps UEA for the 26 overlaps and adds 40 MVCore66-only tasks.
      </TooltipContent>
    </Tooltip>
  );
}
