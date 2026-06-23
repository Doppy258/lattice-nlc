type Props = {
  score: number;
};

/** Compact "Match NN%" pill, colored by how strong the OfferRank score is. */
export function MatchScoreBadge({ score }: Props) {
  const tier = score >= 85 ? "high" : score >= 65 ? "mid" : "low";
  return (
    <span className={`match-score match-score--${tier}`} title="OfferRank match score">
      <span className="match-score__num">{score}%</span>
      <span className="match-score__label">match</span>
    </span>
  );
}
