import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
  aside?: ReactNode;
  className?: string;
};

/**
 * Slim page header for migrated bento screens. Pages start straight into the
 * BentoGrid; this just states the title (and optional actions) above it.
 */
export function CommandHeader({ title, subtitle, actions, aside, className }: Props) {
  return (
    <header className={cn("mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="font-display text-[1.9rem] leading-tight font-bold tracking-tight sm:text-[2.2rem]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {(actions || aside) && (
        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          {aside}
          {actions}
        </div>
      )}
    </header>
  );
}
