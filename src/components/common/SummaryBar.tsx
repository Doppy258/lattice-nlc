/**
 * SummaryBar — the slim "at a glance" stat strip shown under a page header
 * (e.g. "3 active, 5 redeemed, $42 saved"). A single source for the strip's
 * surface so it reads identically on every page that uses it.
 */
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function SummaryBar({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-[var(--tile-radius)] border border-border bg-card/75 px-4 py-3 text-sm text-muted-foreground shadow-[var(--shadow-soft)]",
        className,
      )}
      {...props}
    />
  );
}
