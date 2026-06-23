import { useMemo, useState } from 'react'
import type { Business } from '@/models'
import { useDatabase } from '@/app/useDatabase'
import { Badge } from '@/components/common/Badge'
import { Icon } from '@/components/common/Icon'
import { StarRating } from '@/components/common/StarRating'
import { EmptyState } from '@/components/common/EmptyState'
import { formatDate } from '@/utils/dateTime'
import { firstName, formatRating } from '@/utils/formatting'
import styles from './businesses.module.css'

export function BusinessReviews({ business }: { business: Business }) {
  const db = useDatabase()
  const [tag, setTag] = useState<string | null>(null)

  // Verified reviews first, then newest.
  const reviews = useMemo(
    () =>
      db.reviews
        .filter((r) => r.businessId === business.id)
        .sort((a, b) => {
          if (a.verified !== b.verified) return a.verified ? -1 : 1
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }),
    [db.reviews, business.id],
  )

  const userName = (id: string) => {
    const u = db.users.find((x) => x.id === id)
    return u ? firstName(u.name) : 'Local user'
  }

  const allTags = useMemo(() => [...new Set(reviews.flatMap((r) => r.tags))].sort(), [reviews])
  const verifiedPct = reviews.length
    ? Math.round((reviews.filter((r) => r.verified).length / reviews.length) * 100)
    : 0
  const filtered = tag ? reviews.filter((r) => r.tags.includes(tag)) : reviews

  if (reviews.length === 0) {
    return (
      <EmptyState icon={<Icon name="star" size={36} />} title="No reviews yet">
        Be the first to leave a verified review after redeeming an offer here.
      </EmptyState>
    )
  }

  return (
    <div>
      <div className={styles.reviewSummary}>
        <span className={styles.reviewBig}>{formatRating(business.ratingAverage)}</span>
        <div>
          <StarRating value={business.ratingAverage} size={18} />
          <div className="muted" style={{ fontSize: 'var(--fs-sm)', marginTop: 4 }}>
            {business.reviewCount} reviews · <span className={styles.reviewVerified}>{verifiedPct}% verified</span>
          </div>
        </div>
      </div>

      {allTags.length > 0 && (
        <div className={styles.tagFilter}>
          <button type="button" className="chip" aria-pressed={tag === null} onClick={() => setTag(null)}>
            All
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              type="button"
              className="chip"
              aria-pressed={tag === t}
              onClick={() => setTag((cur) => (cur === t ? null : t))}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <div className={styles.reviewList}>
        {filtered.map((r) => (
          <div key={r.id} className={styles.reviewItem}>
            <div className={styles.reviewHead}>
              <StarRating value={r.rating} size={13} />
              <span className={styles.reviewer}>{userName(r.userId)}</span>
              {r.verified && (
                <Badge tone="emerald">
                  <Icon name="shield" size={10} /> Verified
                </Badge>
              )}
              <span className={styles.reviewDate}>{formatDate(r.createdAt)}</span>
            </div>
            <p className={styles.reviewText}>{r.text}</p>
            {r.tags.length > 0 && (
              <div className={styles.reviewTags}>
                {r.tags.map((t) => (
                  <Badge key={t} tone="outline">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
