import { useMemo, useState } from "react";
import type { ReportFilters as Filters } from "../models";
import { useApp } from "../app/providers";
import { navigate } from "../app/navigation";
import { getUserReport } from "../services/reportService";
import { CATEGORY_META } from "../data/catalog";
import { formatCurrency, formatRating } from "../utils/formatting";
import { PageHero } from "../components/layout/PageHero";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Icon } from "../components/common/Icon";
import { EmptyState } from "../components/common/EmptyState";
import { MetricTile } from "../components/common/MetricTile";
import { MiniBarChart } from "../components/business/MiniBarChart";
import { ColumnChart } from "../components/charts/ColumnChart";
import { ReportFilters } from "../components/reports/ReportFilters";

export function UserReportsPage() {
  const { data, activeUser } = useApp();
  const [filters, setFilters] = useState<Filters>({});

  const report = useMemo(
    () => getUserReport(activeUser.id, filters, data),
    [activeUser.id, filters, data]
  );

  const hasActivity = report.totalClaimed > 0 || report.reviewsSubmitted > 0;

  return (
    <>
      <PageHero
        variant="split"
        kicker="Reports"
        title="Your local support report"
        subtitle="Savings, businesses supported, and rating patterns filtered however you like."
        aside={
          hasActivity ? (
            <div className="page-hero__stat-pill">
              <strong>{formatCurrency(report.estimatedSavings)}</strong>
              <span>estimated saved</span>
            </div>
          ) : undefined
        }
      />

      <div className="reports-split">
        <aside className="reports-split__filters">
          <Card variant="glass" pad>
            <ReportFilters filters={filters} onChange={setFilters} />
          </Card>
        </aside>

        <div>
          {!hasActivity ? (
            <EmptyState
              icon="reports"
              title="Your report will appear after you claim or redeem offers"
              body="Claim an offer, redeem it, and leave a review to see your savings and support grow."
              actionLabel="Create a Ping"
              onAction={() => navigate("/create-ping")}
            />
          ) : (
            <>
              {report.favoriteCategory && (
                <p style={{ marginBottom: "var(--space-6)", color: "var(--text-muted)", fontSize: "var(--text-lg)" }}>
                  Top category: <strong style={{ color: "var(--ink)" }}>{CATEGORY_META[report.favoriteCategory].label}</strong>
                </p>
              )}

              <div className="bento-grid bento-grid--metrics" style={{ marginBottom: "var(--space-6)" }}>
                <MetricTile label="Offers claimed" value={report.totalClaimed} />
                <MetricTile label="Offers redeemed" value={report.totalRedeemed} />
                <MetricTile label="Businesses supported" value={report.businessesSupported} />
                <MetricTile
                  label="Avg rating given"
                  value={report.reviewsSubmitted > 0 ? report.averageRatingGiven : 0}
                  hint={report.reviewsSubmitted > 0 ? formatRating(report.averageRatingGiven) : "No reviews yet"}
                />
              </div>

              <div className="analytics-columns">
                <Card variant="inset">
                  <h2 className="section-title">Claims by category</h2>
                  <MiniBarChart data={report.claimsByCategory} emptyLabel="No claims in range" />
                </Card>
                <Card variant="inset">
                  <h2 className="section-title">Savings over time</h2>
                  <ColumnChart
                    data={report.savingsByMonth}
                    formatValue={(v) => formatCurrency(v)}
                    emptyLabel="No savings in range"
                    label="Savings over time"
                  />
                </Card>
                <Card variant="inset">
                  <h2 className="section-title">Businesses supported by month</h2>
                  <ColumnChart
                    data={report.businessesByMonth}
                    emptyLabel="No visits in range"
                    label="Businesses supported by month"
                  />
                </Card>
                <Card variant="inset">
                  <h2 className="section-title">Your rating distribution</h2>
                  <MiniBarChart data={report.ratingDistribution} emptyLabel="No reviews yet" />
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
