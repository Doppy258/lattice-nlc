import { useApp } from "@/app/providers";
import { navigate } from "@/app/navigation";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Icon } from "@/components/common/Icon";
import { StatTile } from "@/components/common/StatTile";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { BarColumns, BarList } from "@/components/charts/Charts";
import { getBusinessReport } from "@/services/reportService";
import { formatCurrency, formatPercent, formatRating } from "@/utils/formatting";
import type { SeriesPoint } from "@/models";

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

export function AnalyticsPage() {
  const { data, activeBusiness } = useApp();

  if (!activeBusiness) {
    return (
      <EmptyState
        icon="store"
        title="No business selected"
        body="Switch to a business-owner account (Sam or Nina) from the account menu in the top bar to manage a storefront."
        action={
          <Button variant="brand" iconLeft={<Icon name="explore" size={17} />} onClick={() => navigate("/home")}>
            Back to Home
          </Button>
        }
      />
    );
  }

  const report = getBusinessReport(
    activeBusiness.id,
    {},
    { claims: data.claims, offers: data.offers, businesses: data.businesses, reviews: data.reviews },
  );

  const funnel: SeriesPoint[] = [
    { label: "Views", value: report.offerViews },
    { label: "Claims", value: report.claims },
    { label: "Redeemed", value: report.redemptions },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        title="Performance"
        accent="analytics"
        subtitle={`How customers move from discovery to redemption at ${activeBusiness.name} — conversion, loyalty, revenue, and what they're saying.`}
      />

      <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StaggerItem>
          <StatTile tone="blue" label="Conversion rate" value={formatPercent(report.conversionRate)} icon={<Icon name="rankings" size={17} />} sub="Views → redeemed" />
        </StaggerItem>
        <StaggerItem>
          <StatTile tone="violet" label="Repeat customers" value={report.repeatCustomers} icon={<Icon name="matches" size={17} />} sub="Redeemed more than once" />
        </StaggerItem>
        <StaggerItem>
          <StatTile tone="mint" label="Revenue influenced" value={formatCurrency(report.revenueInfluenced)} icon={<Icon name="reports" size={17} />} sub="From redemptions" />
        </StaggerItem>
        <StaggerItem>
          <StatTile tone="amber" label="Review score" value={`${formatRating(report.averageRating)}★`} icon={<Icon name="star" size={17} />} sub={`${report.reviewCount} reviews`} />
        </StaggerItem>
      </Stagger>

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
