import { useMemo } from "react";
import { useApp } from "../app/providers";
import { getBusinessReport } from "../services/reportService";
import { formatPercent } from "../utils/formatting";
import { PageHero } from "../components/layout/PageHero";
import { Card } from "../components/common/Card";
import { MetricTile } from "../components/common/MetricTile";
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
      <PageHero
        variant="split"
        kicker="Business"
        title="Analytics"
        subtitle={`Performance trends for ${activeBusiness.name}.`}
        aside={
          <div className="page-hero__stat-pill">
            <strong>{formatPercent(report.conversionRate)}</strong>
            <span>conversion</span>
          </div>
        }
      />

      <div className="bento-grid bento-grid--metrics" style={{ marginBottom: "var(--space-6)" }}>
        <MetricTile label="Offer views" value={report.offerViews} />
        <MetricTile label="Redemptions" value={report.redemptions} hint={`${report.redemptions} of ${report.offerViews} views`} />
        <MetricTile label="Revenue influenced" value={report.revenueInfluenced} prefix="$" />
        <MetricTile label="Repeat customers" value={report.repeatCustomers} />
      </div>

      <div className="analytics-columns">
        <Card variant="inset">
          <h2 className="section-title">Conversion funnel</h2>
          <MiniBarChart data={funnel} formatValue={(v) => v.toLocaleString()} />
        </Card>
        <Card variant="inset">
          <h2 className="section-title">Claims by month</h2>
          <MiniBarChart data={report.claimsByMonth} emptyLabel="No claims recorded yet" />
        </Card>
        <Card variant="inset">
          <h2 className="section-title">Top review tags</h2>
          <MiniBarChart data={report.commonTags} emptyLabel="No tagged reviews yet" />
        </Card>
      </div>
    </>
  );
}
