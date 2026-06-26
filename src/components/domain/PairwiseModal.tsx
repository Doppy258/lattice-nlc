/**
 * PairwiseModal - one step of the binary-insertion ranking flow. The user
 * compares the business being inserted against the current pivot and answers
 * "better", "worse", "same", or "skip". Their answers drive the bounds in
 * rankingService to efficiently place the new entry.
 * Props: open, onOpenChange, newBusiness, compareBusiness, comparison (step #),
 *        onAnswer (ComparisonAnswer => void)
 * Role in architecture: Domain — the interactive component of the ranking
 * algorithm; each answer halves the remaining search space.
 */
import { motion } from "motion/react";
import type { Business } from "@/models";
import type { ComparisonAnswer } from "@/services/rankingService";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { Icon } from "@/components/common/Icon";
import { RatingStars } from "@/components/common/RatingStars";
import { BusinessImage } from "./BusinessImage";
import { formatRating } from "@/utils/formatting";

function Choice({ business, badge }: { business: Business; badge: string }) {
  return (
    <div className="flex-1 overflow-hidden rounded-[var(--tile-radius)] border border-border bg-card">
      <BusinessImage business={business} className="h-24 w-full" width={360}>
        <span className="pointer-events-none absolute left-2.5 top-2.5 rounded-full bg-card/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--primary-strong)] shadow-[var(--shadow-soft)] backdrop-blur-sm">
          {badge}
        </span>
      </BusinessImage>
      <div className="p-3">
        <h4 className="truncate font-display text-[15px] font-semibold tracking-[-0.02em]">{business.name}</h4>
        <span className="mt-1 inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <RatingStars rating={business.ratingAverage} size={12} />
          {formatRating(business.ratingAverage)}
        </span>
      </div>
    </div>
  );
}

/**
 * One step of the binary-insertion ranking: the user compares the business being
 * inserted against the current pivot. Answers drive the bounds in rankingService.
 */
export function PairwiseModal({
  open,
  onOpenChange,
  newBusiness,
  compareBusiness,
  comparison,
  onAnswer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newBusiness: Business;
  compareBusiness: Business;
  comparison: number;
  onAnswer: (answer: ComparisonAnswer) => void;
}) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Which do you prefer?"
      description={`Comparison ${comparison} · we use your answers to place it in your ranking with as few questions as possible.`}
    >
      <div className="space-y-4">
        <div className="flex items-stretch gap-3">
          <Choice business={newBusiness} badge="New" />
          <div className="flex items-center">
            <span className="grid size-8 place-items-center rounded-full bg-muted text-[12px] font-semibold text-muted-foreground">
              vs
            </span>
          </div>
          <Choice business={compareBusiness} badge="Ranked" />
        </div>

        <div className="grid gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => onAnswer("better")}
            className="flex cursor-pointer items-center justify-between rounded-2xl border border-[var(--tint-blue-border)] bg-[var(--tint-blue)] px-4 py-3 text-left text-sm font-semibold text-foreground transition-colors hover:border-primary/40"
          >
            <span className="truncate">I prefer {newBusiness.name}</span>
            <Icon name="arrow" size={16} className="shrink-0 text-primary" />
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            onClick={() => onAnswer("worse")}
            className="flex cursor-pointer items-center justify-between rounded-2xl border border-[var(--tint-blue-border)] bg-[var(--tint-blue)] px-4 py-3 text-left text-sm font-semibold text-foreground transition-colors hover:border-primary/40"
          >
            <span className="truncate">I prefer {compareBusiness.name}</span>
            <Icon name="arrow" size={16} className="shrink-0 text-primary" />
          </motion.button>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => onAnswer("same")}>
              About the same
            </Button>
            <Button variant="ghost" className="flex-1" onClick={() => onAnswer("skip")}>
              Skip
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
