import type { CSSProperties } from "react";

type Props = {
  score: number;
};

/** Radial gauge for OfferRank match score. */
export function MatchScoreBadge({ score }: Props) {
  return (
    <span
      className="match-gauge"
      title="OfferRank match score"
      style={{ "--score": score } as CSSProperties}
    >
      <span className="match-gauge__ring" aria-hidden />
      <span className="match-gauge__num">{score}%</span>
    </span>
  );
}
