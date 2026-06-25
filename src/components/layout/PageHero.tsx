import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "split" | "command" | "compact";

type Props = {
  variant?: Variant;
  kicker?: string;
  title: ReactNode;
  subtitle?: string;
  aside?: ReactNode;
  actions?: ReactNode;
};

function Kicker({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
        <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
      </span>
      {children}
    </span>
  );
}

export function PageHero({
  variant = "split",
  kicker,
  title,
  subtitle,
  aside,
  actions,
}: Props) {
  const titleSize =
    variant === "command"
      ? "text-[2.4rem] leading-[1.02] sm:text-5xl lg:text-[3.5rem]"
      : variant === "compact"
        ? "text-2xl sm:text-[1.75rem]"
        : "text-[2rem] leading-[1.05] sm:text-4xl lg:text-[2.85rem]";

  return (
    <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {kicker && <Kicker>{kicker}</Kicker>}
        <h1
          className={cn(
            "font-display font-medium tracking-[-0.02em] text-balance text-foreground",
            kicker ? "mt-2.5" : "",
            titleSize,
          )}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            {subtitle}
          </p>
        )}
        {actions && (
          <div className="mt-5 flex flex-wrap items-center gap-2.5">{actions}</div>
        )}
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </header>
  );
}

/** @deprecated Use PageHero instead */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <PageHero
      variant="split"
      kicker={eyebrow}
      title={title}
      subtitle={subtitle}
      actions={actions}
    />
  );
}
