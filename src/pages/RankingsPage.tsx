import { useMemo } from "react";
import { useApp } from "../app/providers";
import { navigate } from "../app/navigation";
import { byString } from "../utils/sorting";
import { CATEGORY_META } from "../data/catalog";
import { PageHeader } from "../components/layout/PageHeader";
import { Button } from "../components/common/Button";
import { Icon } from "../components/common/Icon";
import { EmptyState } from "../components/common/EmptyState";
import { RankedList } from "../components/rankings/RankedList";

export function RankingsPage() {
  const { data, activeUser } = useApp();

  const rankings = useMemo(
    () =>
      data.rankings
        .filter((r) => r.userId === activeUser.id && r.rankedBusinessIds.length > 0)
        .sort(byString((r) => CATEGORY_META[r.category].label, "asc")),
    [data.rankings, activeUser.id]
  );

  return (
    <>
      <PageHeader
        eyebrow="Rankings"
        title="Your personal rankings"
        subtitle="Built from quick comparisons after each review — binary insertion keeps the questions short."
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
      )}
    </>
  );
}
