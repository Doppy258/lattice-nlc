import { useMemo } from "react";
import type { Business, PersonalRanking } from "../models";
import { useApp } from "../app/providers";
import { navigate } from "../app/navigation";
import { byString } from "../utils/sorting";
import { CATEGORY_META } from "../data/catalog";
import { PageHero } from "../components/layout/PageHero";
import { Button } from "../components/common/Button";
import { Icon } from "../components/common/Icon";
import { EmptyState } from "../components/common/EmptyState";
import { RankedList } from "../components/rankings/RankedList";

function PodiumPreview({
  ranking,
  businesses,
}: {
  ranking: PersonalRanking;
  businesses: Business[];
}) {
  const byId = new Map(businesses.map((b) => [b.id, b]));
  const top3 = ranking.rankedBusinessIds
    .slice(0, 3)
    .map((id) => byId.get(id))
    .filter((b): b is Business => Boolean(b));

  if (top3.length === 0) return null;

  const first = top3[0];
  const second = top3[1];
  const third = top3[2];

  return (
    <div className="podium">
      {second ? (
        <div className="podium__slot">
          <span className="podium__rank">#2</span>
          <span className="podium__name">{second.name}</span>
        </div>
      ) : (
        <div />
      )}
      <div className="podium__slot podium__slot--first">
        <span className="podium__rank">#1</span>
        <span className="podium__name">{first.name}</span>
      </div>
      {third ? (
        <div className="podium__slot">
          <span className="podium__rank">#3</span>
          <span className="podium__name">{third.name}</span>
        </div>
      ) : (
        <div />
      )}
    </div>
  );
}

export function RankingsPage() {
  const { data, activeUser } = useApp();

  const rankings = useMemo(
    () =>
      data.rankings
        .filter((r) => r.userId === activeUser.id && r.rankedBusinessIds.length > 0)
        .sort(byString((r) => CATEGORY_META[r.category].label, "asc")),
    [data.rankings, activeUser.id]
  );

  const firstRanking = rankings[0];

  return (
    <>
      <PageHero
        variant="compact"
        kicker="Rankings"
        title="Your personal rankings"
        subtitle="Built from quick comparisons after each review. Binary insertion keeps the questions short."
      />

      {rankings.length === 0 ? (
        <EmptyState
          icon="rankings"
          title="No rankings yet"
          body="Redeem an offer and leave a review to start placing businesses in your personal rankings."
          actions={
            <Button onClick={() => navigate("/claims")} iconLeft={<Icon name="claims" size={16} />}>
              Go to claims
            </Button>
          }
        />
      ) : (
        <>
          {firstRanking && (
            <PodiumPreview ranking={firstRanking} businesses={data.businesses} />
          )}
          <div className="rankings-grid">
            {rankings.map((ranking) => (
              <RankedList
                key={`${ranking.category}-${ranking.needType ?? "all"}`}
                ranking={ranking}
                businesses={data.businesses}
                savedBusinessIds={activeUser.preferences.savedBusinessIds}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
