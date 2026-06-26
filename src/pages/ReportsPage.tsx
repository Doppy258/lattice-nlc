import { useMemo, useState } from "react";
import { useApp } from "@/app/providers";
import { navigate } from "@/app/navigation";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Icon } from "@/components/common/Icon";
import { EmptyState } from "@/components/common/EmptyState";
import { InsightSummary } from "@/components/common/InsightSummary";
import { PageHeader } from "@/components/common/PageHeader";
import { Select } from "@/components/ui/select";
import { BarColumns, BarList, Donut } from "@/components/charts/Charts";
import {
  getUserReport,
  rangeToFromDate,
  RANGE_PRESETS,
  type RangePreset,
} from "@/services/reportService";
import { ALL_CATEGORIES, CATEGORY_META } from "@/data/catalog";
import { formatCurrency, formatRating } from "@/utils/formatting";
import { downloadCsv, dateStamp, printReport, type CsvSection } from "@/utils/export";
import type { BusinessCategory, ClaimStatus, ReportFilters } from "@/models";

/** Turns a chart's SeriesPoint[] into a labelled CSV section. */
function seriesSection(title: string, points: { label: string; value: number }[]): CsvSection {
  return {
    title,
    headers: ["Label", "Value"],
    rows: points.length > 0 ? points.map((p) => [p.label, p.value]) : [["No data", 0]],
  };
}

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

export function ReportsPage() {
  const { data, activeUser } = useApp();
  const [category, setCategory] = useState<BusinessCategory | "all">("all");
  const [status, setStatus] = useState<ClaimStatus | "all">("all");
  const [range, setRange] = useState<RangePreset>("all");

  const report = useMemo(() => {
    const filters: ReportFilters = {
      fromDate: rangeToFromDate(range),
      category: category === "all" ? undefined : category,
      claimStatus: status === "all" ? undefined : status,
    };
    return getUserReport(activeUser.id, filters, {
      claims: data.claims,
      offers: data.offers,
      businesses: data.businesses,
      reviews: data.reviews,
    });
  }, [activeUser.id, range, category, status, data.claims, data.offers, data.businesses, data.reviews]);

  function exportCsv() {
    const rangeLabel = RANGE_PRESETS.find((r) => r.value === range)?.label ?? "All time";
    const sections: CsvSection[] = [
      {
        title: "Impact report — summary",
        headers: ["Metric", "Value"],
        rows: [
          ["Date range", rangeLabel],
          ["Category filter", category === "all" ? "All categories" : CATEGORY_META[category].label],
          ["Status filter", status === "all" ? "Any status" : status],
          ["Estimated saved", formatCurrency(report.estimatedSavings)],
          ["Offers claimed", report.totalClaimed],
          ["Offers redeemed", report.totalRedeemed],
          ["Businesses supported", report.businessesSupported],
          ["Reviews submitted", report.reviewsSubmitted],
          ["Average rating given", report.averageRatingGiven > 0 ? formatRating(report.averageRatingGiven) : "—"],
          [
            "Favourite category",
            report.favoriteCategory ? CATEGORY_META[report.favoriteCategory].label : "—",
          ],
        ],
      },
      seriesSection("Claims by category", report.claimsByCategory),
      seriesSection("Savings by month", report.savingsByMonth),
      seriesSection("Ratings you've given", report.ratingDistribution),
      seriesSection("Businesses supported by month", report.businessesByMonth),
    ];
    downloadCsv(`lattice-impact-report-${dateStamp()}.csv`, sections);
  }

  const hasClaims = data.claims.some((c) => c.userId === activeUser.id);

  if (!hasClaims) {
    return (
      <div className="space-y-7">
        <PageHeader title="Your" accent="impact report" subtitle="See how much you've saved and which local businesses you support most." />
        <EmptyState
          icon="reports"
          title="No activity to report yet"
          body="Claim and redeem a few offers and your savings, categories, and supported businesses will chart here."
          action={
            <Button variant="brand" iconLeft={<Icon name="ping" size={17} />} onClick={() => navigate("/create")}>
              Create a Lattice
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title="Your"
        accent="impact report"
        subtitle="How much you've saved, what you claim most, and the local businesses you support — generated from your activity."
        actions={
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <Select value={range} onChange={(e) => setRange(e.target.value as RangePreset)} className="w-40" aria-label="Filter by date range">
              {RANGE_PRESETS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
            <Select value={category} onChange={(e) => setCategory(e.target.value as BusinessCategory | "all")} className="w-40" aria-label="Filter by category">
              <option value="all">All categories</option>
              {ALL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_META[c].label}
                </option>
              ))}
            </Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value as ClaimStatus | "all")} className="w-36" aria-label="Filter by status">
              <option value="all">Any status</option>
              <option value="active">Active</option>
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
        title="Report summary"
        items={[
          {
            label: "Est. saved",
            value: formatCurrency(report.estimatedSavings),
            detail: `${report.totalRedeemed} redeemed`,
          },
          { label: "Claimed", value: report.totalClaimed, detail: "Total offers" },
          { label: "Businesses", value: report.businessesSupported, detail: "Supported locally" },
          {
            label: "Reviews",
            value: report.reviewsSubmitted,
            detail: report.averageRatingGiven > 0 ? `${report.averageRatingGiven}★ avg given` : "None yet",
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Claims by category" sub="Where you use Lattice most">
          <Donut data={report.claimsByCategory} centerLabel={String(report.totalClaimed)} centerSub="Claims" />
        </ChartCard>
        <ChartCard title="Savings by month" sub="Estimated savings from redeemed offers">
          <BarColumns data={report.savingsByMonth} format={(n) => formatCurrency(n)} color="var(--success)" />
        </ChartCard>
        <ChartCard title="Ratings you've given" sub="Distribution across your reviews">
          <BarList data={report.ratingDistribution} color="var(--primary)" />
        </ChartCard>
        <ChartCard title="Businesses supported" sub="Unique businesses redeemed per month">
          <BarColumns data={report.businessesByMonth} color="var(--brand-violet)" />
        </ChartCard>
      </div>

      {report.favoriteCategory && (
        <Card variant="glassBlue" className="flex items-center gap-4 p-5">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-card/70 text-primary shadow-[var(--shadow-soft)]">
            <Icon name={CATEGORY_META[report.favoriteCategory].icon as never} size={24} />
          </span>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Your favourite category</div>
            <div className="font-display text-xl font-semibold tracking-[-0.02em]">
              {CATEGORY_META[report.favoriteCategory].label}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
