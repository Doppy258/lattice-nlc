/**
 * shadcn/ui Progress primitive — Radix-based progress bar with
 * configurable indicator classes/style for tinting the fill (e.g.
 * match-score gauge colours by tier).
 */
import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

/**
 * Progress bar. `indicatorClassName` / `indicatorStyle` let callers tint the
 * fill (e.g. the match-score gauge colours by tier). Solid fill — no gradient.
 */
function Progress({
  className,
  value = 0,
  indicatorClassName,
  indicatorStyle,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  indicatorClassName?: string;
  indicatorStyle?: React.CSSProperties;
}) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn("h-full w-full flex-1 rounded-full bg-primary transition-transform duration-500 ease-[var(--ease-out-expo)]", indicatorClassName)}
        style={{ transform: `translateX(-${100 - (value ?? 0)}%)`, ...indicatorStyle }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
