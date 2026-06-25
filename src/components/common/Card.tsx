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

/** Surface primitive. Solid white for content, glass for chrome/accents, tint for color. */
export function Card({
  variant = "solid",
  className,
  ...props
}: ComponentProps<"div"> & { variant?: CardVariant }) {
  return (
    <div className={cn("rounded-[var(--tile-radius)]", VARIANTS[variant], className)} {...props} />
  );
}
