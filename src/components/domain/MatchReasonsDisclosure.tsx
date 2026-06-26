import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { MatchReasons } from "./MatchReasons";

/**
 * MatchReasonsDisclosure — collapsible "Why this match?" panel inside
 * OfferCard. Starts collapsed to keep grid rows aligned; expands with
 * an AnimatePresence height animation. The score is shown in the trigger
 * row for quick context before opening. Returns null when reasons is empty.
 */
export function MatchReasonsDisclosure({
  reasons,
  score,
}: {
  reasons: string[];
  score?: number;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  if (!reasons.length) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--tint-blue-border)] bg-[var(--tint-blue)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full cursor-pointer items-center justify-between gap-2 px-3.5 py-2.5 text-left text-[13px] font-semibold text-foreground transition-colors hover:text-primary"
      >
        <span className="inline-flex items-center gap-2">
          Why this match?
          {score !== undefined && (
            <span className="mono text-[12px] font-semibold text-primary">{score}%</span>
          )}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-muted-foreground" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <MatchReasons reasons={reasons} title="" className="px-3.5 pb-3.5" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
