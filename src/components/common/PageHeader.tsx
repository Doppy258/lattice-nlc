import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

/** Standard page title row: title (+ serif accent) / subtitle / actions. */
export function PageHeader({
  title,
  accent,
  subtitle,
  actions,
  className,
}: {
  title: ReactNode;
  accent?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="space-y-1.5">
        <h1 className="font-display text-[28px] font-semibold tracking-[-0.035em] sm:text-[34px]">
          {title}
          {accent && (
            <>
              {" "}
              <span className="font-accent font-normal text-primary">{accent}</span>
            </>
          )}
        </h1>
        {subtitle && (
          <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}

/** Hero header on a blue-glass panel — the premium "moment" at the top of a page. */
export function PageHero({
  eyebrow,
  title,
  accent,
  subtitle,
  actions,
  aside,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  accent?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        "glass-blue beam-host overflow-hidden rounded-[var(--tile-radius-lg)] p-6 sm:p-8",
        className,
      )}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          {eyebrow && (
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-card/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary shadow-[var(--shadow-soft)]">
              {eyebrow}
            </div>
          )}
          <h1 className="font-display text-[30px] font-semibold leading-[1.04] tracking-[-0.04em] sm:text-[42px]">
            {title}
            {accent && (
              <>
                {" "}
                <span className="font-accent font-normal text-primary">{accent}</span>
              </>
            )}
          </h1>
          {subtitle && (
            <p className="mt-3.5 text-base leading-relaxed text-muted-foreground sm:text-[17px]">
              {subtitle}
            </p>
          )}
          {actions && <div className="mt-6 flex flex-wrap items-center gap-3">{actions}</div>}
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>
    </Reveal>
  );
}
