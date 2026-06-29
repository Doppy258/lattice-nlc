/**
 * ReviewModal - verified-review composer. Only unlocked for the user's own
 * redeemed claim. Captures a 1–5 star rating, free-text review (with min/max
 * length enforced), and optional tags (selected via ToggleChip). Persists the
 * review and recalculates the business's aggregate rating optimistically.
 * Props: open, onOpenChange, claim (Claim), offer (Offer), business (Business)
 * Role in architecture: Domain — the sole path for submitting verified reviews
 * after redemption, ensuring only genuine customers can rate a business.
 */
import { useState } from "react";
import { motion } from "motion/react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/app/providers";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { FormField } from "@/components/common/FormField";
import { ToggleChip, ChipGroup } from "@/components/common/ToggleChip";
import { Textarea } from "@/components/ui/textarea";
import { createReview, updateBusinessRating, type ReviewInput } from "@/services/reviewService";
import { insertReview, upsertBusiness } from "@/services/dbService";
import { REVIEW_TAGS } from "@/models";
import { REVIEW_TEXT_MAX, REVIEW_TEXT_MIN } from "@/utils/constants";
import type { Business, Claim, Offer } from "@/models";
import { cn } from "@/lib/utils";

const RATING_WORDS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

/** Verified-review composer. Unlocks only for the user's own redeemed claim. */
export function ReviewModal({
  open,
  onOpenChange,
  claim,
  offer,
  business,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  claim: Claim;
  offer: Offer;
  business: Business;
}) {
  const { data, activeUser, setData } = useApp();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ratingError, setRatingError] = useState<string | null>(null);

  const shown = hover || rating;

  function toggleTag(tag: string) {
    setTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]));
  }

  function reset() {
    setRating(0);
    setHover(0);
    setText("");
    setTags([]);
    setError(null);
    setRatingError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
<<<<<<< HEAD
=======
    // Semantic check surfaced inline (not just as a toast) so the user sees
    // exactly which field needs attention before the request is attempted.
>>>>>>> de7766ac840f51fe3477c146fca301d5b923dbc9
    if (rating < 1) {
      setRatingError("Tap a star to rate your visit from 1 to 5.");
      return;
    }
    const input: ReviewInput = {
      userId: activeUser.id,
      businessId: business.id,
      offerId: offer.id,
      claimId: claim.id,
      rating,
      text,
      tags,
    };
    const res = createReview(input, data.claims, data.reviews);
    if (!res.ok) {
      setError(res.error);
      toast.error(res.error);
      return;
    }
    const review = res.review;
<<<<<<< HEAD
    let updatedBusiness: Business | undefined;
=======
    const updatedBusiness = updateBusinessRating(business.id, [...data.reviews, review], business);
>>>>>>> de7766ac840f51fe3477c146fca301d5b923dbc9
    setData((d) => {
      const reviews = [...d.reviews, review];
      const updatedBiz = updateBusinessRating(business.id, reviews, business);
      updatedBusiness = updatedBiz;
      const businesses = d.businesses.map((b) =>
        b.id === business.id ? updatedBiz : b,
      );
      return { ...d, reviews, businesses };
    });
<<<<<<< HEAD
    try {
      await insertReview(review);
      if (updatedBusiness) await upsertBusiness(updatedBusiness);
    } catch {
      toast.error("Failed to save review. Please try again.");
      return;
    }
=======
    // Persist the verified review + recalculated rating so they show everywhere.
    void insertReview(review);
    void upsertBusiness(updatedBusiness);
>>>>>>> de7766ac840f51fe3477c146fca301d5b923dbc9
    toast.success("Review posted — thanks for the feedback!");
    reset();
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
      title="Write a verified review"
      description={`Share your experience at ${business.name}. Your review is marked verified because you redeemed ${offer.title}.`}
    >
      <form onSubmit={submit} className="space-y-4">
        <FormField label="Your rating" htmlFor="rating" error={ratingError ?? undefined}>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <motion.button
                  key={n}
                  type="button"
                  whileTap={{ scale: 0.85 }}
                  onMouseEnter={() => setHover(n)}
                  onClick={() => {
                    setRating(n);
                    setError(null);
                    setRatingError(null);
                  }}
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                  className="cursor-pointer p-0.5 text-primary"
                >
                  <Star
                    size={28}
                    strokeWidth={1.6}
                    fill={n <= shown ? "currentColor" : "none"}
                    className={n <= shown ? "text-primary" : "text-muted-foreground/35"}
                  />
                </motion.button>
              ))}
            </div>
            {shown > 0 && (
              <span className="text-sm font-semibold text-[var(--primary-strong)]">{RATING_WORDS[shown]}</span>
            )}
          </div>
        </FormField>

        <FormField
          label="Your review"
          htmlFor="review-text"
          error={error ?? undefined}
          hint={`${text.trim().length}/${REVIEW_TEXT_MAX} · at least ${REVIEW_TEXT_MIN} characters`}
        >
          <Textarea
            id="review-text"
            value={text}
            maxLength={REVIEW_TEXT_MAX}
            onChange={(e) => {
              setText(e.target.value);
              setError(null);
            }}
            placeholder="What stood out? Was it good value, fast, student-friendly?"
            className="min-h-24"
          />
        </FormField>

        <FormField label="Tags (optional)" htmlFor="tags">
          <ChipGroup>
            {REVIEW_TAGS.map((tag) => (
              <ToggleChip
                key={tag}
                type="button"
                active={tags.includes(tag)}
                onClick={() => toggleTag(tag)}
                className={cn("text-[13px]")}
              >
                {tag}
              </ToggleChip>
            ))}
          </ChipGroup>
        </FormField>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="brand" iconLeft={<Star size={16} />}>
            Post review
          </Button>
        </div>
      </form>
    </Modal>
  );
}
