import { useMemo, useState } from "react";
import type { Business, Offer } from "../../models";
import { REVIEW_TAGS } from "../../models";
import { validateReview } from "../../services/reviewService";
import { REVIEW_TEXT_MAX, REVIEW_TEXT_MIN } from "../../utils/constants";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Icon } from "../common/Icon";
import { RatingInput } from "../common/RatingInput";

/** The fields the review form collects before the parent adds claim/user ids. */
export type ReviewDraft = { rating: number; text: string; tags: string[] };

type Props = {
  open: boolean;
  offer: Offer;
  business: Business;
  onClose: () => void;
  /** Returns an error message to display, or null on success. */
  onSubmit: (draft: ReviewDraft) => string | null;
};

const RECOMMEND_TAG = "Would recommend";

/** Verified-review form, unlocked once a claim is redeemed (PRD 10.7). */
export function ReviewModal({ open, offer, business, onClose, onSubmit }: Props) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [recommend, setRecommend] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);

  const draft = useMemo<ReviewDraft>(
    () => ({
      rating,
      text,
      tags: recommend ? [...tags, RECOMMEND_TAG] : tags,
    }),
    [rating, text, tags, recommend]
  );

  const toggleTag = (tag: string) =>
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateReview({
      userId: "",
      businessId: business.id,
      offerId: offer.id,
      claimId: "",
      rating,
      text,
      tags: draft.tags,
    });
    if (!validation.valid) {
      setErrors(Object.fromEntries(validation.errors.map((x) => [x.field, x.message])));
      return;
    }
    setErrors({});
    const error = onSubmit(draft);
    if (error) {
      setBanner(error);
      return;
    }
    setBanner(null);
  };

  return (
    <Modal open={open} title={`Review ${business.name}`} onClose={onClose}>
      <form className="review-form" onSubmit={submit} noValidate>
        <p className="review-form__offer">{offer.title}</p>

        {banner && (
          <div className="form-banner form-banner--error" role="alert">
            <Icon name="alert" size={16} />
            <span>{banner}</span>
          </div>
        )}

        <div className="field">
          <span className="field__label">Your rating</span>
          <RatingInput value={rating} onChange={setRating} />
          {errors.rating && <span className="field__error">{errors.rating}</span>}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="review-text">
            Your review
          </label>
          <textarea
            id="review-text"
            className="text-input text-area"
            value={text}
            maxLength={REVIEW_TEXT_MAX}
            placeholder="What stood out? Be specific to help other students decide."
            onChange={(e) => setText(e.target.value)}
          />
          <span className="field__hint">
            {text.trim().length}/{REVIEW_TEXT_MAX} · minimum {REVIEW_TEXT_MIN} characters
          </span>
          {errors.text && <span className="field__error">{errors.text}</span>}
        </div>

        <div className="field">
          <span className="field__label">Tags (optional)</span>
          <div className="chip-select">
            {REVIEW_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`chip ${tags.includes(tag) ? "chip--on" : ""}`}
                aria-pressed={tags.includes(tag)}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <label className="verify__check">
          <input
            type="checkbox"
            checked={recommend}
            onChange={(e) => setRecommend(e.target.checked)}
          />
          <span>I would recommend this business</span>
        </label>

        <div className="review-form__actions">
          <Button type="submit" iconLeft={<Icon name="check" size={16} />}>
            Submit review
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
