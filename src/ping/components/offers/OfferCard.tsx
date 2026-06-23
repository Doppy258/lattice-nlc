import { Link } from 'react-router-dom'
import type { Business, Offer } from '@/models'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { SaveButton } from '@/components/common/SaveButton'
import { countdown } from '@/utils/dateTime'
import { categoryLabel, formatCurrency, formatDistance, formatPrice, formatRating } from '@/utils/formatting'
import { MatchScoreBadge } from './MatchScoreBadge'
import { MatchReasons } from './MatchReasons'
import styles from './offers.module.css'

type OfferCardProps = {
  offer: Offer
  business: Business
  distanceKm: number
  score?: number
  reasons?: string[]
  onClaim: (offerId: string) => void
}

export function OfferCard({ offer, business, distanceKm, score, reasons, onClaim }: OfferCardProps) {
  const savings = offer.originalPrice ? offer.originalPrice - offer.price : 0
  const full = offer.currentClaims >= offer.maxClaims

  return (
    <article className={styles.card}>
      <div className={styles.head}>
        <div>
          <div className={styles.bizLine}>
            <span className={styles.bizName}>
              <Link to={`/business/${business.id}`}>{business.name}</Link>
            </span>
            {business.verified && (
              <Badge tone="emerald">
                <Icon name="shield" size={11} /> Verified
              </Badge>
            )}
          </div>
          <span className="muted" style={{ fontSize: 'var(--fs-xs)' }}>
            {categoryLabel(business.category)}
          </span>
        </div>
        {score !== undefined && <MatchScoreBadge score={score} />}
      </div>

      <h3 className={styles.title}>{offer.title}</h3>

      <div className={styles.priceRow}>
        <span className={styles.priceNow}>{formatPrice(offer.price)}</span>
        {offer.originalPrice && <span className={styles.priceWas}>{formatCurrency(offer.originalPrice)}</span>}
        {savings > 0 && <Badge tone="emerald">Save {formatCurrency(savings)}</Badge>}
        {offer.studentOnly && <Badge tone="signal">Student</Badge>}
      </div>

      {reasons && reasons.length > 0 && <MatchReasons reasons={reasons} />}

      <div className={styles.meta}>
        <span>
          <Icon name="location" size={14} /> {formatDistance(distanceKm)}
        </span>
        <span>
          <Icon name="star" size={14} /> {formatRating(business.ratingAverage)} ({business.reviewCount})
        </span>
        <span>
          <Icon name="clock" size={14} /> Ends in {countdown(offer.validUntil)}
        </span>
      </div>

      <div className={styles.foot}>
        <div className={styles.footMain}>
          <Button variant="primary" block disabled={full} onClick={() => onClaim(offer.id)}>
            {full ? 'Offer full' : 'Claim Offer'}
          </Button>
        </div>
        <SaveButton kind="offer" id={offer.id} />
        <Link to={`/business/${business.id}`} className="btn btn--secondary" aria-label={`View ${business.name}`}>
          <Icon name="arrowRight" size={18} />
        </Link>
      </div>
    </article>
  )
}
