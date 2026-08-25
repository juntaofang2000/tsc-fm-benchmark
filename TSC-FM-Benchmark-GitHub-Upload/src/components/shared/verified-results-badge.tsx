import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function VerifiedResultsBadge() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="success" className="cursor-help gap-1">
          <BadgeCheck className="size-3" />
          Verified UCR+UEA
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        Recomputed from 128 UCR and 30 UEA per-dataset accuracy records.
      </TooltipContent>
    </Tooltip>
  );
}
