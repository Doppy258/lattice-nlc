import { useMemo, useState } from "react";
import { useApp } from "@/app/providers";
import { navigate } from "@/app/navigation";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Icon } from "@/components/common/Icon";
import { InsightSummary } from "@/components/common/InsightSummary";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { Select } from "@/components/ui/select";
import { BarColumns, BarList } from "@/components/charts/Charts";
import {
  getBusinessReport,
  rangeToFromDate,
  RANGE_PRESETS,
  type RangePreset,
} from "@/services/reportService";
import { formatCurrency, formatPercent, formatRating } from "@/utils/formatting";
import { downloadCsv, dateStamp, slugify, printReport, type CsvSection } from "@/utils/export";
import type { ClaimStatus, ReportFilters, SeriesPoint } from "@/models";

/** Solid panel with a titled header used for each analytics chart. */
function ChartCard({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <Card variant="solid" className="space-y-4 p-5">
      <div>
        <h3 className="font-display text-[17px] font-semibold tracking-[-0.02em]">{title}</h3>
        {sub && <p className="text-[13px] text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </Card>
  );
}

/** Turns a chart's SeriesPoint[] into a labelled CSV section. */
function seriesSection(title: string, points: SeriesPoint[]): CsvSection {
  return {
    title,
    headers: ["Label", "Value"],
    rows: points.length > 0 ? points.map((p) => [p.label, p.value]) : [["No data", 0]],
  };
}

export function AnalyticsPage() {
  const { data, activeBusiness } = useApp();
  const [range, setRange] = useState<RangePreset>("all");
  const [status, setStatus] = useState<ClaimStatus | "all">("all");

  const report = useMemo(() => {
    if (!activeBusiness) return null;
    const filters: ReportFilters = {
      fromDate: rangeToFromDate(range),
      claimStatus: status === "all" ? undefined : status,
    };
    return getBusinessReport(activeBusiness.id, filters, {
      claims: data.claims,
      offers: data.offers,
      businesses: data.businesses,
      reviews: data.reviews,
    });
  }, [activeBusiness, range, status, data.claims, data.offers, data.businesses, data.reviews]);

  if (!activeBusiness) {
    return (
      <EmptyState
        icon="store"
        title="No business selected"
        body="This is the business workspace. Create your storefront in onboarding, or sign in with a business account to manage your offers."
        action={
          <Button variant="brand" iconLeft={<Icon name="explore" size={17} />} onClick={() => navigate("/home")}>
            Back to Home
          </Button>
        }
      />
    );
  }

  if (!report) return null;

  const funnel: SeriesPoint[] = [
    { label: "Views", value: report.offerViews },
    { label: "Claims", value: report.claims },
    { label: "Redeemed", value: report.redemptions },
  ];

  function exportCsv() {
    if (!report || !activeBusiness) return;
    const rangeLabel = RANGE_PRESETS.find((r) => r.value === range)?.label ?? "All time";
    const sections: CsvSection[] = [
      {
        title: `Performance analytics — ${activeBusiness.name}`,
        headers: ["Metric", "Value"],
        rows: [
          ["Date range", rangeLabel],
          ["Status filter", status === "all" ? "Any status" : status],
          ["Offer views", report.offerViews],
          ["Claims", report.claims],
          ["Redemptions", report.redemptions],
          ["Pending passes", report.pending],
          ["Expired passes", report.expired],
          ["Conversion rate", formatPercent(report.conversionRate)],
          ["Pass approval rate", formatPercent(report.passApprovalRate)],
          ["Repeat customers", report.repeatCustomers],
          ["Revenue influenced", formatCurrency(report.revenueInfluenced)],
          ["Average rating", report.reviewCount > 0 ? formatRating(report.averageRating) : "—"],
          ["Review count", report.reviewCount],
          ["Top offer", report.topOfferTitle ?? "—"],
        ],
      },
      seriesSection("Conversion funnel", funnel),
      seriesSection("Claims by month", report.claimsByMonth),
      seriesSection("Common review tags", report.commonTags),
    ];
    downloadCsv(`lattice-analytics-${slugify(activeBusiness.name)}-${dateStamp()}.csv`, sections);
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title="Performance"
        accent="analytics"
        subtitle={`How customers move from discovery to redemption at ${activeBusiness.name} — conversion, loyalty, revenue, and what they're saying.`}
        actions={
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Select value={range} onChange={(e) => setRange(e.target.value as RangePreset)} className="w-40" aria-label="Filter by date range">
              {RANGE_PRESETS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value as ClaimStatus | "all")} className="w-36" aria-label="Filter by status">
              <option value="all">Any status</option>
              <option value="pending">Pending</option>
              <option value="redeemed">Redeemed</option>
              <option value="expired">Expired</option>
            </Select>
            <Button variant="secondary" iconLeft={<Icon name="download" size={16} />} onClick={exportCsv}>
              Export CSV
            </Button>
            <Button variant="secondary" iconLeft={<Icon name="print" size={16} />} onClick={printReport}>
              Print
            </Button>
          </div>
        }
      />

      <InsightSummary
        title="Performance summary"
        items={[
          {
            label: "Conversion",
            value: formatPercent(report.conversionRate),
            detail: "Views to redeemed",
          },
          {
            label: "Pass approval",
            value: formatPercent(report.passApprovalRate),
            detail: "Claimed passes approved",
          },
          {
            label: "Expired passes",
            value: report.expired,
            detail: "Timed out before approval",
          },
          {
            label: "Repeat guests",
            value: report.repeatCustomers,
            detail: "Redeemed more than once",
          },
          {
            label: "Revenue",
            value: formatCurrency(report.revenueInfluenced),
            detail: "Influenced by redemptions",
          },
          {
            label: "Review score",
            value: `${formatRating(report.averageRating)}★`,
            detail: `${report.reviewCount} reviews`,
          },
        ]}
      />

      <ChartCard title="Conversion funnel" sub="Where customers drop off between seeing an offer and redeeming it">
        <BarList data={funnel} color="var(--primary)" />
        <p className="text-[13px] text-muted-foreground">
          <span className="font-semibold text-foreground">{formatPercent(report.conversionRate)}</span> of offer views convert
          all the way to an in-store redemption.
        </p>
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Claims by month" sub="Claim volume over time">
          <BarColumns data={report.claimsByMonth} color="var(--brand-violet)" />
        </ChartCard>
        <ChartCard title="What customers mention" sub="Most common tags from your reviews">
          <BarList data={report.commonTags} color="var(--success)" />
        </ChartCard>
      </div>
    </div>
  );
}
