import { useMemo } from "react";
import { useApp } from "../app/providers";
import { getBusinessReport } from "../services/reportService";
import { formatCurrency, formatPercent, formatRating } from "../utils/formatting";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/common/Card";
import { StatCard } from "../components/business/StatCard";
import { MiniBarChart } from "../components/business/MiniBarChart";
import { NoBusiness } from "../components/business/NoBusiness";

export function BusinessAnalyticsPage() {
  const { data, activeBusiness } = useApp();

  const report = useMemo(
    () => (activeBusiness ? getBusinessReport(activeBusiness.id, {}, data) : null),
    [activeBusiness, data]
  );

  if (!activeBusiness || !report) return <NoBusiness />;

  const funnel = [
    { label: "Views", value: report.offerViews },
    { label: "Claims", value: report.claims },
    { label: "Redemptions", value: report.redemptions },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Business"
        title="Analytics"
        subtitle={`Performance trends for ${activeBusiness.name}.`}
      />

      <div className="stat-grid">
        <StatCard icon="reports" label="Offer views" value={report.offerViews.toLocaleString()} />
        <StatCard
          icon="redeem"
          label="Conversion"
          value={formatPercent(report.conversionRate)}
          caption={`${report.redemptions} of ${report.offerViews} views`}
          hint="Conversion rate = redeemed claims ÷ offer views."
        />
        <StatCard
          icon="analytics"
          label="Revenue influenced"
          value={formatCurrency(report.revenueInfluenced)}
          hint="Revenue influenced = redeemed claims × offer price."
        />
        <StatCard icon="claims" label="Repeat customers" value={String(report.repeatCustomers)} />
        <StatCard
          icon="star"
          label="Avg rating"
          value={report.reviewCount > 0 ? formatRating(report.averageRating) : "—"}
          caption={`${report.reviewCount} reviews`}
        />
        <StatCard icon="ticket" label="Total claims" value={String(report.claims)} />
      </div>

      <div className="analytics-columns">
        <Card>
          <h2 className="section-title">Conversion funnel</h2>
          <MiniBarChart data={funnel} formatValue={(v) => v.toLocaleString()} />
        </Card>
        <Card>
          <h2 className="section-title">Claims by month</h2>
          <MiniBarChart
            data={report.claimsByMonth}
            emptyLabel="No claims recorded yet"
          />
        </Card>
        <Card>
          <h2 className="section-title">Top review tags</h2>
          <MiniBarChart data={report.commonTags} emptyLabel="No tagged reviews yet" />
        </Card>
      </div>
    </>
  );
}
