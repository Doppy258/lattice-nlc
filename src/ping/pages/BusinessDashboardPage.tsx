import { Link } from 'react-router-dom'
import { useDatabase } from '@/app/useDatabase'
import { useBusinessContext } from '@/app/useBusinessContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Icon } from '@/components/common/Icon'
import { MetricCard } from '@/components/reports/MetricCard'
import { ChartCard, TrendChart, CategoryBars } from '@/components/reports/Charts'
import { BusinessSwitcher } from '@/components/businesses/BusinessSwitcher'
import { getBusinessReport } from '@/services/reportService'
import { getOfferStatus } from '@/services/businessService'
import { formatDate } from '@/utils/dateTime'
import { formatCurrency, formatPercent, formatRating } from '@/utils/formatting'
import styles from './business.module.css'

export function BusinessDashboardPage() {
  const db = useDatabase()
  const { current } = useBusinessContext()

  if (!current) {
    return (
      <div>
        <PageHeader eyebrow="Business" title="Dashboard" />
        <EmptyState icon={<Icon name="grid" size={44} />} title="No business selected">
          Switch to a business-owner profile (Sam or Nina) from the top-right menu to manage offers.
        </EmptyState>
      </div>
    )
  }

  const report = getBusinessReport(current.id)
  const offers = db.offers.filter((o) => o.businessId === current.id)
  const activeCount = offers.filter((o) => getOfferStatus(o) === 'active').length
  const popular = [...offers].sort((a, b) => b.currentClaims - a.currentClaims)[0]

  const offerTitle = (id: string) => db.offers.find((o) => o.id === id)?.title ?? id
  const trend = report.claimsOverTime.map((d) => ({ label: formatDate(d.date), value: d.claims }))
  const byOffer = report.redemptionsByOffer
    .filter((d) => d.redemptions > 0)
    .map((d) => ({ label: offerTitle(d.offerId).split(' ').slice(0, 2).join(' '), value: d.redemptions }))

  return (
    <div>
      <PageHeader
        eyebrow="Business"
        title={current.name}
        description="How your offers are performing right now."
        actions={
          <>
            <BusinessSwitcher />
            <Link to="/biz/redeem" className="btn btn--secondary">
              <Icon name="scan" size={16} /> Redeem
            </Link>
            <Link to="/biz/create-offer" className="btn btn--primary">
              <Icon name="plus" size={16} /> Create offer
            </Link>
          </>
        }
      />

      <div className={styles.metricsGrid}>
        <MetricCard label="Active offers" value={activeCount} icon="tag" tone="signal" />
        <MetricCard label="Total views" value={report.offerViews.toLocaleString()} icon="compass" />
        <MetricCard label="Claims" value={report.claims} icon="ticket" />
        <MetricCard label="Redemptions" value={report.redemptions} icon="check" tone="emerald" />
        <MetricCard
          label="Conversion"
          value={formatPercent(report.conversionRate, true)}
          icon="chart"
          tooltip="Conversion rate = redeemed claims ÷ offer views"
        />
        <MetricCard label="Avg rating" value={formatRating(report.averageRating)} icon="star" />
      </div>

      <div className={styles.dashGrid}>
        <ChartCard title="Claims over time" icon="chart">
          <TrendChart data={trend} />
        </ChartCard>
        <ChartCard title="Redemptions by offer" icon="ticket">
          <CategoryBars data={byOffer} color="#0f7b57" />
        </ChartCard>
      </div>

      {popular && (
        <div className={styles.section}>
          <h2 className="section-title">Most popular offer</h2>
          <div className={styles.offerRow}>
            <div className={styles.offerInfo}>
              <div className={styles.offerTitle}>{popular.title}</div>
              <div className={styles.offerDates}>{formatCurrency(popular.price)}</div>
            </div>
            <div className={styles.offerStats}>
              <div className={styles.oStat}>
                <span className={styles.oStatVal}>{popular.currentClaims}</span>
                <span className={styles.oStatLabel}>Claims</span>
              </div>
              <div className={styles.oStat}>
                <span className={styles.oStatVal}>{popular.views}</span>
                <span className={styles.oStatLabel}>Views</span>
              </div>
            </div>
            <Link to="/biz/offers" className="btn btn--secondary btn--sm">
              Manage offers
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
