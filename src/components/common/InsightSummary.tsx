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

/** Compact metric band for contextual counts without turning KPIs into page heroes. */
export function InsightSummary({
  title,
  items,
  columns = "four",
  className,
}: {
  title?: ReactNode;
  items: InsightSummaryItem[];
  columns?: Columns;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[var(--tile-radius)] border border-border bg-card/85 p-3 shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      {title && (
        <div className="mb-2.5 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {title}
        </div>
      )}
      <div className={cn("grid gap-2.5", COLUMN_CLASSES[columns])}>
        {items.map((item, index) => {
          const content = (
            <>
              <div className="truncate text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                {item.label}
              </div>
              <div className="mt-1 truncate font-display text-[20px] font-semibold leading-none tracking-[-0.025em] text-foreground">
                {item.value}
              </div>
              {item.detail && (
                <div className="mt-1 text-[12px] leading-snug text-muted-foreground">
                  {item.detail}
                </div>
              )}
            </>
          );

          const itemClassName =
            "min-w-0 rounded-2xl bg-muted/35 px-3 py-2.5 text-left";

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
