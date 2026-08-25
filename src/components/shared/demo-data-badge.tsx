import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function DemoDataBadge() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className="cursor-help gap-1"><Info className="size-3" />Demo Data</Badge>
      </TooltipTrigger>
      <TooltipContent>Values shown in this preview are illustrative and will be replaced by official evaluation results.</TooltipContent>
    </Tooltip>
  );
}
