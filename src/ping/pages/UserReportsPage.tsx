import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { BusinessCategory, ClaimStatus, ReportFilters } from '@/models'
import { useSession } from '@/app/SessionContext'
import { useDatabase } from '@/app/useDatabase'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { downloadCsv } from '@/utils/export'
import { MetricCard } from '@/components/reports/MetricCard'
import { ChartCard, TrendChart, CategoryBars } from '@/components/reports/Charts'
import { buildUserReport } from '@/services/reportService'
import { CATEGORIES } from '@/data/pingConfig'
import { categoryLabel, formatCurrency, formatRating, pluralize } from '@/utils/formatting'
import styles from './userreports.module.css'

const STATUSES: (ClaimStatus | 'all')[] = ['all', 'active', 'redeemed', 'expired']

export function UserReportsPage() {
  const { user } = useSession()
  const db = useDatabase()

  const [category, setCategory] = useState<BusinessCategory | 'all'>('all')
  const [claimStatus, setClaimStatus] = useState<ClaimStatus | 'all'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const filters: ReportFilters = {
    category,
    claimStatus,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo ? `${dateTo}T23:59:59` : undefined,
  }
  const report = buildUserReport(db, user.id, filters)

  const claimsByCategory = report.claimsByCategory.map((c) => ({
    label: categoryLabel(c.category),
    value: c.count,
  }))
  const savings = report.savingsByMonth.map((s) => ({ label: s.month, value: s.savings }))
  const ratingDist = report.ratingDistribution.map((r) => ({ label: `${r.rating}★`, value: r.count }))

  const exportCsv = () => {
    const rows: (string | number)[][] = [
      ['Metric', 'Value'],
      ['Offers claimed', report.totalClaimed],
      ['Offers redeemed', report.totalRedeemed],
      ['Estimated savings', report.estimatedSavings],
      ['Businesses supported', report.businessesSupported],
      ['Reviews submitted', report.reviewsSubmitted],
      ['Average rating given', report.averageRatingGiven],
      ['Favourite category', report.favoriteCategory ? categoryLabel(report.favoriteCategory) : '—'],
      [],
      ['Category', 'Claims'],
      ...report.claimsByCategory.map((c) => [categoryLabel(c.category), c.count] as (string | number)[]),
    ]
    downloadCsv('ping-impact-report.csv', rows)
  }

  return (
    <div>
      <PageHeader
        eyebrow="Reports"
        title="Your impact report"
        description="How many local businesses you’ve supported, and how much you’ve saved."
        actions={
          <Button variant="secondary" onClick={exportCsv} iconLeft={<Icon name="arrowRight" size={16} />}>
            Export CSV
          </Button>
        }
      />

      <div className={styles.filterBar}>
        <div className={styles.filterField}>
          <span className={styles.filterLabel}>Category</span>
          <select className={styles.select} value={category} onChange={(e) => setCategory(e.target.value as typeof category)}>
            <option value="all">All</option>
            {CATEGORIES.map((c) => (
              <option key={c.category} value={c.category}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filterField}>
          <span className={styles.filterLabel}>Claim status</span>
          <select className={styles.select} value={claimStatus} onChange={(e) => setClaimStatus(e.target.value as typeof claimStatus)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.filterField}>
          <span className={styles.filterLabel}>From</span>
          <input className={styles.dateInput} type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className={styles.filterField}>
          <span className={styles.filterLabel}>To</span>
          <input className={styles.dateInput} type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      {report.totalClaimed === 0 ? (
        <EmptyState
          icon={<Icon name="chart" size={44} />}
          title="Your report will appear after you claim or redeem offers"
          action={
            <Link to="/create" className="btn btn--primary">
              Create a Ping
            </Link>
          }
        >
          Claim and redeem local offers and your savings, support, and rankings show up here.
        </EmptyState>
      ) : (
        <>
          <div className={styles.reportCards}>
            <div className={styles.reportCard}>
              <div className={styles.reportBig}>{report.businessesSupported}</div>
              <div className={styles.reportText}>
                You supported {pluralize(report.businessesSupported, 'local business', 'local businesses')}.
              </div>
            </div>
            <div className={styles.reportCard}>
              <div className={styles.reportBig}>{formatCurrency(report.estimatedSavings)}</div>
              <div className={styles.reportText}>Estimated saved across your redeemed offers.</div>
            </div>
            <div className={styles.reportCard}>
              <div className={styles.reportBig}>
                {report.favoriteCategory ? categoryLabel(report.favoriteCategory) : '—'}
              </div>
              <div className={styles.reportText}>Your most-claimed category.</div>
            </div>
          </div>

          <div className={styles.metricsGrid}>
            <MetricCard label="Offers claimed" value={report.totalClaimed} icon="ticket" />
            <MetricCard label="Redeemed" value={report.totalRedeemed} icon="check" tone="emerald" />
            <MetricCard label="Estimated savings" value={formatCurrency(report.estimatedSavings)} icon="sparkle" tone="signal" />
            <MetricCard label="Reviews submitted" value={report.reviewsSubmitted} icon="star" />
            <MetricCard
              label="Avg rating given"
              value={report.averageRatingGiven ? formatRating(report.averageRatingGiven) : '—'}
              icon="star"
            />
          </div>

          <div className={styles.chartsGrid}>
            <ChartCard title="Claims by category" icon="chart">
              <CategoryBars data={claimsByCategory} />
            </ChartCard>
            <ChartCard title="Savings over time" icon="sparkle">
              <TrendChart data={savings} color="#0f7b57" />
            </ChartCard>
            <ChartCard title="Ratings you’ve given" icon="star">
              <CategoryBars data={ratingDist} />
            </ChartCard>
          </div>
        </>
      )}
    </div>
  )
}
