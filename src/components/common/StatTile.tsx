import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StatTone = "plain" | "blue" | "violet" | "mint" | "amber";

const SURFACE: Record<StatTone, string> = {
  plain: "bg-card border-border shadow-[var(--shadow-card)]",
  blue: "bg-[var(--tint-blue)] border-[var(--tint-blue-border)]",
  violet: "bg-[var(--tint-violet)] border-[var(--tint-violet-border)]",
  mint: "bg-[var(--tint-mint)] border-[var(--tint-mint-border)]",
  amber: "bg-[var(--tint-amber)] border-[var(--tint-amber-border)]",
};

const VALUE: Record<StatTone, string> = {
  plain: "text-foreground",
  blue: "text-[var(--primary-strong)]",
  violet: "text-[var(--brand-violet)]",
  mint: "text-[var(--success)]",
  amber: "text-[var(--warning)]",
};

const ICON_WRAP: Record<StatTone, string> = {
  plain: "bg-accent text-primary",
  blue: "bg-[var(--brand-tint)] text-[var(--primary-strong)]",
  violet: "bg-white/60 text-[var(--brand-violet)]",
  mint: "bg-white/60 text-[var(--success)]",
  amber: "bg-white/60 text-[var(--warning)]",
};

/** A KPI tile: tracked label, large display value, optional sub + icon. */
export function StatTile({
  label,
  value,
  sub,
  icon,
  tone = "plain",
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  tone?: StatTone;
  className?: string;
}) {
  return (
    <div className={cn("rounded-[var(--tile-radius)] border p-5", SURFACE[tone], className)}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {label}
        </span>
        {icon && (
          <span className={cn("grid size-8 shrink-0 place-items-center rounded-xl", ICON_WRAP[tone])}>
            {icon}
          </span>
        )}
      </div>
      <div className={cn("mt-2.5 font-display text-[30px] font-semibold leading-none tracking-[-0.03em]", VALUE[tone])}>
        {value}
      </div>
      {sub && <div className="mt-1.5 text-sm text-muted-foreground">{sub}</div>}
    </div>
  );
}
