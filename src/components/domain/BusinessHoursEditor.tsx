/**
 * BusinessHoursEditor — animated day-by-day hours editor with open/closed
 * toggles and time pickers. Each day row expands inline when opened,
 * revealing Opens/Closes inputs. "Apply to all" copies one day's schedule
 * across the whole week. Emits `BusinessHours[]` (closed days omitted).
 * Used in the business profile settings.
 */
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Icon } from "@/components/common/Icon";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { BusinessHours } from "@/models";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DEFAULT_OPEN = "09:00";
const DEFAULT_CLOSE = "17:00";
const EASE = [0.16, 1, 0.3, 1] as const;

type DayRow = { open: boolean; openTime: string; closeTime: string };

function rowsFromHours(hours: BusinessHours[]): DayRow[] {
  return Array.from({ length: 7 }, (_, i) => {
    const h = hours.find((x) => x.dayOfWeek === i);
    return h
      ? { open: true, openTime: h.openTime, closeTime: h.closeTime }
      : { open: false, openTime: DEFAULT_OPEN, closeTime: DEFAULT_CLOSE };
  });
}

function rowsToHours(rows: DayRow[]): BusinessHours[] {
  return rows.flatMap((r, i) =>
    r.open ? [{ dayOfWeek: i, openTime: r.openTime, closeTime: r.closeTime }] : [],
  );
}

/**
 * Animated weekly-hours editor. Each day has an open/closed switch that springs
 * the knob across and expands a pair of time pickers; "Apply to all" copies one
 * day's schedule across the week. Emits the open days as `BusinessHours[]`.
 */
export function BusinessHoursEditor({
  value,
  onChange,
}: {
  value: BusinessHours[];
  onChange: (hours: BusinessHours[]) => void;
}) {
  const [rows, setRows] = useState<DayRow[]>(() => rowsFromHours(value));
  const today = new Date().getDay();

  function commit(next: DayRow[]) {
    setRows(next);
    onChange(rowsToHours(next));
  }

  const setDay = (i: number, patch: Partial<DayRow>) =>
    commit(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const applyToAll = (i: number) => commit(rows.map(() => ({ ...rows[i] })));

  const openCount = rows.filter((r) => r.open).length;

  return (
    <div className="space-y-2.5">
      <p className="text-[13px] text-muted-foreground">
        {openCount === 0
          ? "Closed all week — flip a day on to set its hours."
          : `Open ${openCount} ${openCount === 1 ? "day" : "days"} a week.`}
      </p>

      <div className="space-y-1.5">
        {rows.map((row, i) => (
          <motion.div
            layout
            key={i}
            transition={{ duration: 0.22, ease: EASE }}
            className={cn(
              "rounded-xl border px-3 py-2.5 transition-colors",
              row.open ? "border-[var(--tint-blue-border)] bg-[var(--tint-blue)]/50" : "border-border bg-card",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <DayToggle open={row.open} onToggle={() => setDay(i, { open: !row.open })} label={DAY_LABELS[i]} />
                <span
                  className={cn(
                    "truncate text-sm font-medium",
                    row.open ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {DAY_LABELS[i]}
                </span>
                {i === today && (
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    Today
                  </span>
                )}
              </div>
              {!row.open && <span className="shrink-0 text-[13px] font-medium text-muted-foreground">Closed</span>}
            </div>

            <AnimatePresence initial={false}>
              {row.open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: EASE }}
                  className="overflow-hidden"
                >
                  <div className="mt-2.5 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <label className="space-y-1">
                        <span className="text-[11px] font-medium text-muted-foreground">Opens</span>
                        <Input
                          type="time"
                          value={row.openTime}
                          onChange={(e) => setDay(i, { openTime: e.target.value })}
                          className="h-9"
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-[11px] font-medium text-muted-foreground">Closes</span>
                        <Input
                          type="time"
                          value={row.closeTime}
                          onChange={(e) => setDay(i, { closeTime: e.target.value })}
                          className="h-9"
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => applyToAll(i)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold text-primary transition-colors hover:bg-[var(--tint-blue)]"
                    >
                      <Icon name="check" size={13} /> Apply to every day
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function DayToggle({ open, onToggle, label }: { open: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={open}
      aria-label={`${label} ${open ? "open" : "closed"}`}
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200",
        open ? "bg-primary" : "bg-[var(--muted)]",
      )}
    >
      <motion.span
        className="inline-block size-5 rounded-full bg-white shadow-[var(--shadow-soft)]"
        animate={{ x: open ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 520, damping: 34 }}
      />
    </button>
  );
}
