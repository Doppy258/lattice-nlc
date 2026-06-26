import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "violet"
  | "outline";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  brand: "bg-[var(--brand-tint)] text-[var(--primary-strong)]",
  success: "bg-[var(--success-tint)] text-[var(--success)]",
  warning: "bg-[var(--warning-tint)] text-[var(--warning)]",
  danger: "bg-[var(--danger-tint)] text-[var(--danger)]",
  violet: "bg-[var(--tint-violet)] text-[var(--brand-violet)]",
  outline: "border border-border bg-card/60 text-foreground",
};

/**
 * Badge — compact status/label pill in semantic tones.
 * Use `dot` for a live-indicator (online/offline), `icon` for a leading
 * glyph. Tints are solid — no gradients — to keep the UI clean.
 */
export function Badge({
  tone = "neutral",
  dot = false,
  icon,
  className,
  children,
  ...props
}: ComponentProps<"span"> & { tone?: BadgeTone; dot?: boolean; icon?: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold leading-none",
        TONES[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {icon}
      {children}
    </span>
  );
}
