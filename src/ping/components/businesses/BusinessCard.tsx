import { Link } from 'react-router-dom'
import type { Business } from '@/models'
import { Badge } from '@/components/common/Badge'
import { Icon } from '@/components/common/Icon'
import { StarRating } from '@/components/common/StarRating'
import { SaveButton } from '@/components/common/SaveButton'
import { categoryLabel, formatDistance, formatRating, pluralize, priceLevelLabel } from '@/utils/formatting'
import styles from './businesses.module.css'

export function BusinessCard({
  business,
  distanceKm,
  activeDeals = 0,
}: {
  business: Business
  distanceKm?: number | null
  activeDeals?: number
}) {
  return (
    <article className={styles.card}>
      <div className={styles.cardTop}>
        <div>
          <h3 className={styles.name}>
            <Link to={`/business/${business.id}`}>{business.name}</Link>
          </h3>
          <span className={styles.cat}>
            <Icon name={business.category} size={13} /> {categoryLabel(business.category)} ·{' '}
            {priceLevelLabel(business.priceLevel)}
          </span>
        </div>
        {business.verified && (
          <Badge tone="emerald">
            <Icon name="shield" size={11} /> Verified
          </Badge>
        )}
      </div>

      <div className={styles.ratingRow}>
        <StarRating value={business.ratingAverage} size={14} />
        <span className={styles.ratingVal}>{formatRating(business.ratingAverage)}</span>
        <span className={styles.ratingCount}>({pluralize(business.reviewCount, 'review')})</span>
      </div>

      <div className={styles.meta}>
        {distanceKm != null && (
          <span>
            <Icon name="location" size={14} /> {formatDistance(distanceKm)}
          </span>
        )}
        {activeDeals > 0 && (
          <span>
            <Icon name="ticket" size={14} /> {pluralize(activeDeals, 'active deal')}
          </span>
        )}
      </div>

      <div className={styles.foot}>
        <Link to={`/business/${business.id}`} className="btn btn--secondary btn--sm">
          View profile
        </Link>
        <SaveButton kind="business" id={business.id} />
      </div>
    </article>
  )
}
