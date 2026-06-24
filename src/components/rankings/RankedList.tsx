import type { Business, PersonalRanking } from "../../models";
import { CATEGORY_META, NEED_TYPE_LABELS } from "../../data/catalog";
import { Card } from "../common/Card";
import { Badge } from "../common/Badge";
import { Icon } from "../common/Icon";
import { StarRating } from "../common/StarRating";
import { navigate } from "../../app/navigation";

type Props = {
  ranking: PersonalRanking;
  businesses: Business[];
  savedBusinessIds: string[];
};

/** Title like "Food - Lunch", falling back to the category when no need type. */
function listTitle(ranking: PersonalRanking): string {
  const category = CATEGORY_META[ranking.category].label;
  return ranking.needType ? `${category} - ${NEED_TYPE_LABELS[ranking.needType]}` : category;
}

/** One ranked list for a (category, needType) pair, ordered best to worst. */
export function RankedList({ ranking, businesses, savedBusinessIds }: Props) {
  const byId = new Map(businesses.map((b) => [b.id, b]));
  const items = ranking.rankedBusinessIds
    .map((id) => byId.get(id))
    .filter((b): b is Business => Boolean(b));

  if (items.length === 0) return null;

  return (
    <section className="ranked-list">
      <h2 className="section-title">{listTitle(ranking)}</h2>
      <Card pad={false}>
        <ol className="ranked-list__items">
          {items.map((business, i) => (
            <li key={business.id} className="ranked-row">
              <span className={`ranked-row__num ${i === 0 ? "ranked-row__num--top" : ""}`}>
                {i + 1}
              </span>
              <button
                className="ranked-row__main"
                onClick={() => navigate(`/business/profile?b=${business.id}`)}
              >
                <span className="ranked-row__name">{business.name}</span>
                <span className="ranked-row__meta">
                  <Badge tone="neutral">{CATEGORY_META[business.category].label}</Badge>
                  <StarRating
                    value={business.ratingAverage}
                    reviewCount={business.reviewCount}
                    size={13}
                  />
                </span>
              </button>
              {savedBusinessIds.includes(business.id) && (
                <span className="ranked-row__saved" title="Saved">
                  <Icon name="saved" size={16} />
                </span>
              )}
            </li>
          ))}
        </ol>
      </Card>
    </section>
  );
}
