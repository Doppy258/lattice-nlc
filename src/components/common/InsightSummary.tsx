import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type InsightSummaryItem = {
  label: ReactNode;
  value: ReactNode;
  detail?: ReactNode;
  onClick?: () => void;
};

type Columns = "one" | "two" | "three" | "four";

const COLUMN_CLASSES: Record<Columns, string> = {
  one: "grid-cols-1",
  two: "sm:grid-cols-2",
  three: "sm:grid-cols-3",
  four: "sm:grid-cols-2 lg:grid-cols-4",
};

type Density = "compact" | "comfortable";

/** Compact metric band for contextual counts without turning KPIs into page heroes. */
export function InsightSummary({
  title,
  items,
  columns = "four",
  density = "compact",
  className,
}: {
  title?: ReactNode;
  items: InsightSummaryItem[];
  columns?: Columns;
  density?: Density;
  className?: string;
}) {
  const roomy = density === "comfortable";
  return (
    <section
      className={cn(
        "rounded-[var(--tile-radius)] border border-border bg-card/85 shadow-[var(--shadow-soft)]",
        roomy ? "p-5 sm:p-6" : "p-3",
        className,
      )}
    >
      {title && (
        <div
          className={cn(
            "px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground",
            roomy ? "mb-4" : "mb-2.5",
          )}
        >
          {title}
        </div>
      )}
      <div className={cn("grid", roomy ? "gap-3.5" : "gap-2.5", COLUMN_CLASSES[columns])}>
        {items.map((item, index) => {
          const content = (
            <>
              <div className="truncate text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                {item.label}
              </div>
              <div
                className={cn(
                  "truncate font-display font-semibold leading-none tracking-[-0.025em] text-foreground",
                  roomy ? "mt-2 text-[26px]" : "mt-1 text-[20px]",
                )}
              >
                {item.value}
              </div>
              {item.detail && (
                <div className={cn("text-[12px] leading-snug text-muted-foreground", roomy ? "mt-2" : "mt-1")}>
                  {item.detail}
                </div>
              )}
            </>
          );

          const itemClassName = cn(
            "min-w-0 rounded-2xl bg-muted/35 text-left",
            roomy ? "px-4 py-4" : "px-3 py-2.5",
          );

          if (item.onClick) {
            return (
              <button
                key={index}
                type="button"
                onClick={item.onClick}
                className={cn(
                  itemClassName,
                  "cursor-pointer transition-colors duration-200 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                {content}
              </button>
            );
          }

          return (
            <div key={index} className={itemClassName}>
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
