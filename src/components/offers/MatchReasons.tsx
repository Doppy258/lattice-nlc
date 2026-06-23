import { Icon } from "../common/Icon";

type Props = {
  reasons: string[];
};

/** Renders the "why this matched" explanations produced by OfferRank. */
export function MatchReasons({ reasons }: Props) {
  if (reasons.length === 0) return null;
  return (
    <div className="match-reasons">
      <span className="match-reasons__title">Why this matched</span>
      <ul className="match-reasons__list">
        {reasons.map((reason) => (
          <li key={reason} className="match-reasons__item">
            <Icon name="check" size={14} className="match-reasons__check" />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
