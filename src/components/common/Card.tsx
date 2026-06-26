import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type CardVariant = "solid" | "glass" | "glassBlue" | "tint" | "interactive";

const VARIANTS: Record<CardVariant, string> = {
  solid: "bg-card border border-border shadow-[var(--shadow-card)]",
  glass: "glass",
  glassBlue: "glass-blue",
  tint: "bg-[var(--tint-blue)] border border-[var(--tint-blue-border)]",
  interactive:
    "bg-card border border-border shadow-[var(--shadow-card)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] hover:border-[color-mix(in_oklab,var(--primary)_22%,var(--border))]",
};

/**
 * Card — surface primitive for content containers.
 * `solid`: standard card on light background. `glass`/`glassBlue`: frosted
 * panels for navigation or hero regions. `tint`: subtle blue fill for
 * secondary info. `interactive`: same as solid but lifts on hover,
 * intended for clickable card grids.
 */
export function Card({
  variant = "solid",
  className,
  ...props
}: ComponentProps<"div"> & { variant?: CardVariant }) {
  return (
    <div className={cn("rounded-[var(--tile-radius)]", VARIANTS[variant], className)} {...props} />
  );
}
