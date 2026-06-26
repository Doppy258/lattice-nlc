/**
 * SegmentedControl - classic tab-like segmented control (pill-shaped). The
 * active segment is elevated with a card-style background and shadow.
 * Props: options (SegmentOption<T>[]), value (T), onChange (T => void), className?
 * Role in architecture: Common UI — used anywhere the user picks between a
 * small set of mutually exclusive views (e.g. chart period, filter mode).
 */
import { cn } from "@/lib/utils";

export type SegmentOption<T extends string> = { value: T; label: string };

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 p-1",
        className,
      )}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(opt.value)}
            className={cn(
              "cursor-pointer rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-200",
              selected
                ? "bg-card text-foreground shadow-[var(--shadow-soft)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
