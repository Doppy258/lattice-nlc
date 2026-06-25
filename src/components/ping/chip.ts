import { cn } from "@/lib/utils";

/** Shared selectable pill styling for the request-studio selectors. */
export const chipClass = (on: boolean) =>
  cn(
    "inline-flex h-10 items-center justify-center rounded-full border px-4 text-sm font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring/40",
    on
      ? "border-primary bg-primary text-primary-foreground"
      : "border-border bg-card text-foreground hover:bg-muted",
  );
