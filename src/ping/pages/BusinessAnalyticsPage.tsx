import { useDatabase } from '@/app/useDatabase'
import { useBusinessContext } from '@/app/useBusinessContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Icon } from '@/components/common/Icon'
import { MetricCard } from '@/components/reports/MetricCard'
import { ChartCard, TrendChart, CategoryBars } from '@/components/reports/Charts'
import { BusinessSwitcher } from '@/components/businesses/BusinessSwitcher'
import { getBusinessReport } from '@/services/reportService'
import { formatDate } from '@/utils/dateTime'
import { formatCurrency, formatPercent, formatRating, pluralize } from '@/utils/formatting'
import styles from './business.module.css'

export function BusinessAnalyticsPage() {
  const db = useDatabase()
  const { current } = useBusinessContext()

  if (!current) {
    return (
      <div>
        <PageHeader eyebrow="Business" title="Analytics" />
        <EmptyState icon={<Icon name="chart" size={44} />} title="No business selected">
          Switch to a business-owner profile to view analytics.
        </EmptyState>
      </div>
    )
  }

  const report = getBusinessReport(current.id)
  const offerTitle = (id: string) => db.offers.find((o) => o.id === id)?.title ?? id

  const trend = report.claimsOverTime.map((d) => ({ label: formatDate(d.date), value: d.claims }))
  const byOffer = report.redemptionsByOffer
    .filter((d) => d.redemptions > 0)
    .map((d) => ({ label: offerTitle(d.offerId).split(' ').slice(0, 2).join(' '), value: d.redemptions }))
  const tags = report.commonTags.map((t) => ({ label: t.tag.split(' ')[0], value: t.count }))

  return (
    <div>
      <PageHeader
        eyebrow="Business"
        title="Analytics"
        description={`Customer interest and performance for ${current.name}.`}
        actions={<BusinessSwitcher />}
      />

      <div className={styles.metricsGrid}>
        <MetricCard label="Offer views" value={report.offerViews.toLocaleString()} icon="compass" />
        <MetricCard label="Claims" value={report.claims} icon="ticket" />
        <MetricCard label="Redemptions" value={report.redemptions} icon="check" tone="emerald" />
        <MetricCard
          label="Conversion"
          value={formatPercent(report.conversionRate, true)}
          icon="chart"
          tone="signal"
          tooltip="Conversion rate = redeemed claims ÷ offer views"
        />
        <MetricCard label="Avg rating" value={formatRating(report.averageRating)} icon="star" />
        <MetricCard label="Repeat customers" value={report.repeatCustomers} icon="heart" />
        <MetricCard
          label="Revenue influenced"
          value={formatCurrency(report.revenueInfluenced)}
          icon="sparkle"
          tone="emerald"
          tooltip="Revenue influenced = redeemed claims × offer price"
        />
        <MetricCard label="Reviews" value={pluralize(report.reviewCount, 'review')} icon="star" />
      </div>

      <div className={styles.dashGrid}>
        <ChartCard title="Claims over time" icon="chart">
          <TrendChart data={trend} />
        </ChartCard>
        <ChartCard title="Redemptions by offer" icon="ticket">
          <CategoryBars data={byOffer} color="#0f7b57" />
        </ChartCard>
      </div>

      <div className={styles.section}>
        <ChartCard title="Most common review tags" icon="star">
          <CategoryBars data={tags} color="#ef4a23" />
        </ChartCard>
      </div>
    </div>
  )
}
