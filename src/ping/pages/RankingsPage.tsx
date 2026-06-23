import { Link } from 'react-router-dom'
import type { BusinessCategory, NeedType } from '@/models'
import { useSession } from '@/app/SessionContext'
import { useDatabase } from '@/app/useDatabase'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Icon } from '@/components/common/Icon'
import { SaveButton } from '@/components/common/SaveButton'
import { categoryLabel, formatRating, needTypeLabel, pluralize } from '@/utils/formatting'
import { formatDate } from '@/utils/dateTime'
import styles from './rankings.module.css'

const SPECIAL_TITLES: Record<string, string> = {
  'food:lunch': 'Best lunch spots',
  'food:cafeStudySpot': 'Best cafes',
  'services:haircut': 'Best haircut places',
  'education:': 'Best learning spots',
  'retail:gift': 'Best gift shops',
}

function rankingTitle(category: BusinessCategory, needType?: NeedType): string {
  const key = `${category}:${needType ?? ''}`
  if (SPECIAL_TITLES[key]) return SPECIAL_TITLES[key]
  return needType ? `Best ${needTypeLabel(needType).toLowerCase()}` : `Best ${categoryLabel(category).toLowerCase()}`
}

export function RankingsPage() {
  const { user } = useSession()
  const db = useDatabase()

  const rankings = db.rankings.filter((r) => r.userId === user.id && r.rankedBusinessIds.length > 0)
  const bizById = (id: string) => db.businesses.find((b) => b.id === id)

  const lastVisit = (businessId: string): string | null => {
    const redeemed = db.claims.filter(
      (c) => c.userId === user.id && c.businessId === businessId && c.status === 'redeemed' && c.redeemedAt,
    )
    if (redeemed.length === 0) return null
    return redeemed.sort((a, b) => new Date(b.redeemedAt!).getTime() - new Date(a.redeemedAt!).getTime())[0]
      .redeemedAt!
  }

  if (rankings.length === 0) {
    return (
      <div>
        <PageHeader eyebrow="Rankings" title="Your rankings" />
        <EmptyState
          icon={<Icon name="trophy" size={44} />}
          title="No rankings yet"
          action={
            <Link to="/claims" className="btn btn--primary">
              Review a redeemed offer
            </Link>
          }
        >
          After you review a business, a quick comparison places it in your personal rankings.
        </EmptyState>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow="Rankings"
        title="Your rankings"
        description="Personal lists built from your reviews and quick head-to-head comparisons."
      />

      {rankings.map((ranking) => (
        <section key={`${ranking.category}:${ranking.needType ?? ''}`} className={styles.group}>
          <div className={styles.groupHead}>
            <span className={styles.groupTitle}>{rankingTitle(ranking.category, ranking.needType)}</span>
            <span className={styles.groupMeta}>{pluralize(ranking.rankedBusinessIds.length, 'spot')}</span>
          </div>
          <div className={styles.list}>
            {ranking.rankedBusinessIds.map((bid, i) => {
              const b = bizById(bid)
              if (!b) return null
              const lv = lastVisit(bid)
              return (
                <div key={bid} className={styles.row}>
                  <span className={`${styles.num} ${i === 0 ? styles.numTop : ''}`}>{i + 1}</span>
                  <div className={styles.info}>
                    <div className={styles.name}>
                      <Link to={`/business/${b.id}`}>{b.name}</Link>
                    </div>
                    <div className={styles.meta}>
                      <span>
                        <Icon name={b.category} size={12} /> {categoryLabel(b.category)}
                      </span>
                      <span>
                        <Icon name="star" size={12} /> {formatRating(b.ratingAverage)}
                      </span>
                      {lv && (
                        <span>
                          <Icon name="clock" size={12} /> Last visit {formatDate(lv)}
                        </span>
                      )}
                    </div>
                  </div>
                  <SaveButton kind="business" id={b.id} />
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
