import type { ReactNode } from "react";
import { Icon } from "@/components/common/Icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/** A small "?" affordance that reveals an explanation on hover/focus. */
export function HelpTooltip({ label }: { label: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="More information"
          className="inline-grid size-[18px] cursor-help place-items-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
        >
          <Icon name="help" size={12} />
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
