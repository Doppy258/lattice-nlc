import type { Business } from '@/models'
import { Icon } from '@/components/common/Icon'
import { StarRating } from '@/components/common/StarRating'
import { SaveButton } from '@/components/common/SaveButton'
import { categoryLabel, formatDistance, formatRating, pluralize, priceLevelLabel } from '@/utils/formatting'
import styles from './businesses.module.css'

export function BusinessProfileHeader({
  business,
  distanceKm,
}: {
  business: Business
  distanceKm?: number | null
}) {
  return (
    <header className={styles.header}>
      <div className={styles.headerTop}>
        <div>
          <div className={styles.headerCat}>
            <Icon name={business.category} size={13} /> {categoryLabel(business.category)} ·{' '}
            {priceLevelLabel(business.priceLevel)}
          </div>
          <h1 className={styles.headerName}>{business.name}</h1>
          <div className={styles.headerMeta}>
            <span>
              <StarRating value={business.ratingAverage} size={15} /> <b>{formatRating(business.ratingAverage)}</b>
            </span>
            <span>{pluralize(business.reviewCount, 'review')}</span>
            {distanceKm != null && (
              <span>
                <Icon name="location" size={14} /> {formatDistance(distanceKm)}
              </span>
            )}
            {business.verified && (
              <span>
                <Icon name="shield" size={14} /> Verified
              </span>
            )}
          </div>
          <div className={styles.headerTags}>
            {business.tags.map((t) => (
              <span key={t} className={styles.headerTag}>
                {t}
              </span>
            ))}
          </div>
        </div>
        <SaveButton kind="business" id={business.id} withLabel />
      </div>
    </header>
  )
}
