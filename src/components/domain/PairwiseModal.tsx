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

/** A tappable shop card — clicking it is how the user picks a winner. */
function Choice({
  business,
  badge,
  onSelect,
}: {
  business: Business;
  badge: string;
  onSelect: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      aria-label={`Choose ${business.name}`}
      className="group flex flex-1 cursor-pointer flex-col overflow-hidden rounded-[var(--tile-radius)] border-2 border-border bg-card text-left shadow-[var(--shadow-soft)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-[var(--shadow-card)] focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
    >
      <BusinessImage business={business} className="h-40 w-full" width={440}>
        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-card/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--primary-strong)] shadow-[var(--shadow-soft)] backdrop-blur-sm">
          {badge}
        </span>
      </BusinessImage>
      <div className="flex flex-1 flex-col p-4">
        <h4 className="line-clamp-2 font-display text-[17px] font-semibold leading-snug tracking-[-0.02em]">
          {business.name}
        </h4>
        <span className="mb-4 mt-1.5 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <RatingStars rating={business.ratingAverage} size={13} />
          {formatRating(business.ratingAverage)}
        </span>
        <span className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--tint-blue-border)] bg-[var(--tint-blue)] py-2 text-[13px] font-semibold text-[var(--primary-strong)] transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-white">
          Choose this <Icon name="arrow" size={15} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </motion.button>
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
      description={`Comparison ${comparison} · tap the shop you like more and we'll place it in your ranking with as few questions as possible.`}
      className="max-w-2xl"
    >
      <div className="space-y-5">
        <div className="flex items-stretch gap-3 sm:gap-4">
          <Choice business={newBusiness} badge="New" onSelect={() => onAnswer("better")} />
          <div className="flex items-center">
            <span className="grid size-9 place-items-center rounded-full bg-muted text-[12px] font-semibold text-muted-foreground">
              vs
            </span>
          </div>
          <Choice business={compareBusiness} badge="Ranked" onSelect={() => onAnswer("worse")} />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => onAnswer("same")}>
            About the same
          </Button>
          <Button variant="ghost" className="flex-1" onClick={() => onAnswer("skip")}>
            Skip
          </Button>
        </div>
      </div>
    </Modal>
  );
}
