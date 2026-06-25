import { useId, type ReactNode } from "react";
import { motion } from "motion/react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { SPRING } from "@/components/motion/tokens";

type Segment = { id: string; label: string };

type Props = {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  segments?: Segment[];
  activeSegment?: string;
  onSegmentChange?: (id: string) => void;
  children?: ReactNode;
};

/**
 * Sticky filter toolbar. Public API unchanged; the segmented control now has a
 * shared-layout indicator that glides between options.
 */
export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Search…",
  segments,
  activeSegment,
  onSegmentChange,
  children,
}: Props) {
  const layoutId = useId();
  return (
    <div className="mb-5 flex flex-col gap-3 rounded-3xl border border-border bg-card/80 p-3 shadow-soft backdrop-blur-xl">
      {onSearchChange !== undefined && (
        <div className="relative flex items-center">
          <Search
            className="pointer-events-none absolute left-4 size-4 text-muted-foreground"
            strokeWidth={1.8}
          />
          <input
            className="h-11 w-full rounded-full border border-input bg-card pr-4 pl-11 text-[15px] outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            type="search"
            value={search ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2.5">
        {segments && segments.length > 0 && onSegmentChange && (
          <div
            className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/70 p-1"
            role="tablist"
          >
            {segments.map((seg) => {
              const on = activeSegment === seg.id;
              return (
                <button
                  key={seg.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => onSegmentChange(seg.id)}
                  className={cn(
                    "relative inline-flex h-9 items-center rounded-full px-3.5 text-[13px] font-semibold transition-colors duration-200",
                    on ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {on && (
                    <motion.span
                      layoutId={`${layoutId}-seg`}
                      transition={SPRING}
                      className="absolute inset-0 rounded-full bg-card shadow-sm"
                    />
                  )}
                  <span className="relative z-10">{seg.label}</span>
                </button>
              );
            })}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
