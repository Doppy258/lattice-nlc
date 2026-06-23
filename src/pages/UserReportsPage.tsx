import { useMemo, useState } from "react";
import type { ReportFilters as Filters } from "../models";
import { useApp } from "../app/providers";
import { navigate } from "../app/navigation";
import { getUserReport } from "../services/reportService";
import { CATEGORY_META } from "../data/catalog";
import { formatCurrency, formatRating } from "../utils/formatting";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/common/Card";
import { Button } from "../components/common/Button";
import { Icon } from "../components/common/Icon";
import { EmptyState } from "../components/common/EmptyState";
import { StatCard } from "../components/business/StatCard";
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

  const callouts = useMemo(() => {
    const lines: string[] = [];
    if (report.businessesSupported > 0)
      lines.push(`You supported ${report.businessesSupported} local business${report.businessesSupported === 1 ? "" : "es"}.`);
    if (report.estimatedSavings > 0)
      lines.push(`You saved an estimated ${formatCurrency(report.estimatedSavings)}.`);
    if (report.favoriteCategory)
      lines.push(`Your top category is ${CATEGORY_META[report.favoriteCategory].label}.`);
    return lines;
  }, [report]);

  return (
    <>
      <PageHeader
        eyebrow="Reports"
        title="Your local support report"
        subtitle="Savings, businesses supported, and rating patterns — filtered however you like."
      />

      <Card className="report-filters-card">
        <ReportFilters filters={filters} onChange={setFilters} />
      </Card>

      {!hasActivity ? (
        <EmptyState
          icon="reports"
          title="Your report will appear after you claim or redeem offers"
          body="Claim an offer, redeem it, and leave a review to see your savings and support grow."
          actions={
            <Button onClick={() => navigate("/create-ping")} iconLeft={<Icon name="ping" size={16} />}>
              Create a Ping
            </Button>
          }
        />
      ) : (
        <>
          {callouts.length > 0 && (
            <div className="report-callouts">
              {callouts.map((line) => (
                <div key={line} className="report-callout">
                  <span className="report-callout__icon">
                    <Icon name="check" size={16} />
                  </span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          )}

          <div className="stat-grid">
            <StatCard icon="ticket" label="Offers claimed" value={String(report.totalClaimed)} />
            <StatCard icon="redeem" label="Offers redeemed" value={String(report.totalRedeemed)} />
            <StatCard
              icon="reports"
              label="Estimated saved"
              value={formatCurrency(report.estimatedSavings)}
            />
            <StatCard
              icon="store"
              label="Businesses supported"
              value={String(report.businessesSupported)}
            />
            <StatCard icon="reviews" label="Reviews submitted" value={String(report.reviewsSubmitted)} />
            <StatCard
              icon="star"
              label="Avg rating given"
              value={report.reviewsSubmitted > 0 ? formatRating(report.averageRatingGiven) : "—"}
            />
          </div>

          <div className="analytics-columns">
            <Card>
              <h2 className="section-title">Claims by category</h2>
              <MiniBarChart data={report.claimsByCategory} emptyLabel="No claims in range" />
            </Card>
            <Card>
              <h2 className="section-title">Savings over time</h2>
              <ColumnChart
                data={report.savingsByMonth}
                formatValue={(v) => formatCurrency(v)}
                emptyLabel="No savings in range"
                label="Savings over time"
              />
            </Card>
            <Card>
              <h2 className="section-title">Businesses supported by month</h2>
              <ColumnChart
                data={report.businessesByMonth}
                emptyLabel="No visits in range"
                label="Businesses supported by month"
              />
            </Card>
            <Card>
              <h2 className="section-title">Your rating distribution</h2>
              <MiniBarChart data={report.ratingDistribution} emptyLabel="No reviews yet" />
            </Card>
          </div>
        </>
      )}
    </>
  );
}
