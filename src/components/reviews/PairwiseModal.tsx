import { useEffect, useState } from "react";
import type { Business, BusinessCategory, NeedType, PersonalRanking } from "../../models";
import {
  getRanking,
  insertBusinessAtIndex,
  processComparison,
  startBinaryInsertion,
  type ComparisonAnswer,
  type InsertionSession,
} from "../../services/rankingService";
import { CATEGORY_META } from "../../data/catalog";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Icon } from "../common/Icon";
import { StarRating } from "../common/StarRating";

/** Demo cap so a single review never asks for more than a few comparisons. */
const MAX_COMPARISONS = 3;

type Props = {
  open: boolean;
  userId: string;
  newBusiness: Business;
  category: BusinessCategory;
  needType?: NeedType;
  rankings: PersonalRanking[];
  businesses: Business[];
  onComplete: (ranking: PersonalRanking) => void;
  onClose: () => void;
};

/**
 * Places the just-reviewed business into the user's personal ranking via binary
 * insertion (PRD 10.8 / 13.5). The user answers a few better/worse comparisons;
 * the result is an updated ordered list handed back to the parent to persist.
 */
export function PairwiseModal({
  open,
  userId,
  newBusiness,
  category,
  needType,
  rankings,
  businesses,
  onComplete,
  onClose,
}: Props) {
  const [session, setSession] = useState<InsertionSession | null>(null);

  useEffect(() => {
    if (!open) return;
    setSession(startBinaryInsertion(userId, newBusiness.id, category, needType, rankings));
    // Re-seed only when a new placement begins.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, newBusiness.id]);

  if (!session) return null;

  const bizName = (id: string) => businesses.find((b) => b.id === id)?.name ?? "a business";
  const bizRating = (id: string) => businesses.find((b) => b.id === id)?.ratingAverage ?? 0;

  const capReached = session.comparisons >= MAX_COMPARISONS;
  const done = session.compareToId === null || capReached;

  const finalize = () => {
    const index = session.insertIndex ?? session.lo;
    const ranking = getRanking(userId, category, needType, rankings);
    const next = insertBusinessAtIndex(ranking, newBusiness.id, index);
    onComplete(next);
  };

  const answer = (a: ComparisonAnswer) => setSession((prev) => (prev ? processComparison(prev, a) : prev));

  const finalIndex = session.insertIndex ?? session.lo;
  const finalRank = finalIndex + 1;
  const total = session.list.length + 1;

  return (
    <Modal open={open} title="Rank this business" onClose={onClose}>
      {done ? (
        <div className="pairwise pairwise--done">
          <span className="pairwise__done-icon">
            <Icon name="rankings" size={24} />
          </span>
          <p className="pairwise__done-title">
            {newBusiness.name} is now <strong>#{finalRank}</strong> of {total} in your{" "}
            {CATEGORY_META[category].label} rankings.
          </p>
          <p className="pairwise__sub">
            Pairwise comparisons use binary insertion, so you only answer about log<sub>2</sub>(n)
            questions.
          </p>
          <div className="pairwise__actions">
            <Button onClick={finalize} iconLeft={<Icon name="check" size={16} />}>
              Save ranking
            </Button>
          </div>
        </div>
      ) : (
        <div className="pairwise">
          <p className="pairwise__prompt">
            Which is better for <strong>{CATEGORY_META[category].label.toLowerCase()}</strong>?
          </p>
          <div className="pairwise__pair">
            <div className="pairwise__option pairwise__option--new">
              <span className="pairwise__badge">New</span>
              <span className="pairwise__name">{newBusiness.name}</span>
              <StarRating value={newBusiness.ratingAverage} showValue size={13} />
            </div>
            <span className="pairwise__vs">vs</span>
            <div className="pairwise__option">
              <span className="pairwise__name">{bizName(session.compareToId!)}</span>
              <StarRating value={bizRating(session.compareToId!)} showValue size={13} />
            </div>
          </div>

          <div className="pairwise__buttons">
            <Button variant="secondary" onClick={() => answer("better")}>
              {newBusiness.name.split(" ")[0]} is better
            </Button>
            <Button variant="secondary" onClick={() => answer("worse")}>
              {bizName(session.compareToId!).split(" ")[0]} is better
            </Button>
            <Button variant="ghost" onClick={() => answer("same")}>
              About the same
            </Button>
            <Button variant="ghost" onClick={() => answer("skip")}>
              Skip
            </Button>
          </div>

          <p className="pairwise__progress">
            Comparison {session.comparisons + 1} of up to {MAX_COMPARISONS}
          </p>
        </div>
      )}
    </Modal>
  );
}
