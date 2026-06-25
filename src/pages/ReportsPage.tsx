import { useMemo, useState } from "react";
import { useApp } from "@/app/providers";
import { navigate } from "@/app/navigation";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Icon } from "@/components/common/Icon";
import { EmptyState } from "@/components/common/EmptyState";
import { StatTile } from "@/components/common/StatTile";
import { PageHeader } from "@/components/common/PageHeader";
import { Select } from "@/components/ui/select";
import { Stagger, StaggerItem } from "@/components/motion/Reveal";
import { BarColumns, BarList, Donut } from "@/components/charts/Charts";
import { getUserReport } from "@/services/reportService";
import { ALL_CATEGORIES, CATEGORY_META } from "@/data/catalog";
import { formatCurrency } from "@/utils/formatting";
import type { BusinessCategory, ClaimStatus, ReportFilters } from "@/models";

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

  const report = useMemo(() => {
    const filters: ReportFilters = {
      category: category === "all" ? undefined : category,
      claimStatus: status === "all" ? undefined : status,
    };
    return getUserReport(activeUser.id, filters, {
      claims: data.claims,
      offers: data.offers,
      businesses: data.businesses,
      reviews: data.reviews,
    });
  }, [activeUser.id, category, status, data.claims, data.offers, data.businesses, data.reviews]);

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
          <div className="flex items-center gap-2">
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
          </div>
        }
      />

      <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StaggerItem>
          <StatTile tone="mint" label="Est. saved" value={formatCurrency(report.estimatedSavings)} icon={<Icon name="reports" size={17} />} sub={`${report.totalRedeemed} redeemed`} />
        </StaggerItem>
        <StaggerItem>
          <StatTile tone="blue" label="Claimed" value={report.totalClaimed} icon={<Icon name="claims" size={17} />} sub="Total offers claimed" />
        </StaggerItem>
        <StaggerItem>
          <StatTile tone="violet" label="Businesses" value={report.businessesSupported} icon={<Icon name="store" size={17} />} sub="Supported locally" />
        </StaggerItem>
        <StaggerItem>
          <StatTile tone="amber" label="Reviews" value={report.reviewsSubmitted} icon={<Icon name="reviews" size={17} />} sub={report.averageRatingGiven > 0 ? `${report.averageRatingGiven}★ avg given` : "None yet"} />
        </StaggerItem>
      </Stagger>

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
