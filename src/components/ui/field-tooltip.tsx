import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FieldTooltipProps {
  content: string;
}

export function FieldTooltip({ content }: FieldTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger type="button" tabIndex={-1} className="flex items-center" onClick={(e) => e.preventDefault()}>
          <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors ml-1.5" />
          <span className="sr-only">Field information</span>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="max-w-[250px] text-xs">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
