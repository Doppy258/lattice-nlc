import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Business, Claim, Offer } from '@/models'
import { useSession } from '@/app/SessionContext'
import { useDatabase } from '@/app/useDatabase'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Icon } from '@/components/common/Icon'
import { Modal } from '@/components/common/Modal'
import { EmptyState } from '@/components/common/EmptyState'
import { BusinessProfileHeader } from '@/components/businesses/BusinessProfileHeader'
import { ActiveOffers } from '@/components/businesses/ActiveOffers'
import { BusinessReviews } from '@/components/businesses/BusinessReviews'
import { BusinessCard } from '@/components/businesses/BusinessCard'
import { ClaimCodeCard } from '@/components/offers/ClaimCodeCard'
import { createClaim } from '@/services/claimService'
import { haversineKm } from '@/utils/distance'
import { formatClock } from '@/utils/dateTime'
import { priceLevelLabel } from '@/utils/formatting'
import bizStyles from '@/components/businesses/businesses.module.css'
import styles from './profile.module.css'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function BusinessProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useSession()
  const db = useDatabase()
  const now = Date.now()
  const today = new Date().getDay()

  const business = db.businesses.find((b) => b.id === id)
  const origin = db.locations.find((l) => l.id === user.homeLocationId)?.point ?? db.locations[0]?.point

  const [claimed, setClaimed] = useState<{ claim: Claim; offer: Offer; business: Business } | null>(null)
  const [actionError, setActionError] = useState('')

  if (!business) {
    return (
      <EmptyState
        icon={<Icon name="search" size={48} />}
        title="Business not found"
        action={
          <Link to="/explore" className="btn btn--primary">
            Back to Explore
          </Link>
        }
      >
        That business isn’t in our local directory.
      </EmptyState>
    )
  }

  const distance = origin ? haversineKm(origin, business.location) : null
  const activeOffers = db.offers.filter(
    (o) =>
      o.businessId === business.id &&
      o.active &&
      new Date(o.validFrom).getTime() <= now &&
      new Date(o.validUntil).getTime() >= now,
  )
  const similar = db.businesses
    .filter((b) => b.id !== business.id && b.category === business.category)
    .sort((a, b) => b.ratingAverage - a.ratingAverage)
    .slice(0, 3)
  const studentFriendly = activeOffers.some((o) => o.studentOnly || o.offerType === 'studentOffer')

  const handleClaim = (offerId: string) => {
    const res = createClaim(user.id, offerId)
    if (res.ok) {
      const offer = activeOffers.find((o) => o.id === offerId)
      if (offer) setClaimed({ claim: res.claim, offer, business })
    } else {
      setActionError(res.error)
    }
  }

  return (
    <div>
      <Link to="/explore" className={styles.back}>
        <Icon name="chevronRight" size={14} style={{ transform: 'rotate(180deg)' }} /> All businesses
      </Link>

      <BusinessProfileHeader business={business} distanceKm={distance} />

      {actionError && (
        <p style={{ color: 'var(--danger)', marginTop: 'var(--sp-3)', fontWeight: 500 }}>{actionError}</p>
      )}

      <section className={styles.section}>
        <h2 className="section-title">Active offers</h2>
        <ActiveOffers business={business} offers={activeOffers} distanceKm={distance ?? 0} onClaim={handleClaim} />
      </section>

      <section className={styles.section}>
        <h2 className="section-title">Details</h2>
        <Card pad="lg">
          <div className={bizStyles.detailGrid}>
            <div className={bizStyles.detail}>
              <span className={bizStyles.detailLabel}>Address</span>
              <span className={bizStyles.detailValue}>{business.address}</span>
            </div>
            <div className={bizStyles.detail}>
              <span className={bizStyles.detailLabel}>Price range</span>
              <span className={bizStyles.detailValue}>{priceLevelLabel(business.priceLevel)}</span>
            </div>
            <div className={bizStyles.detail}>
              <span className={bizStyles.detailLabel}>Student discount</span>
              <span className={bizStyles.detailValue}>{studentFriendly ? 'Yes — active student offers' : 'Not currently'}</span>
            </div>
            <div className={bizStyles.detail}>
              <span className={bizStyles.detailLabel}>Accessibility</span>
              <span className={bizStyles.detailValue}>
                {business.accessibilityFeatures.length ? business.accessibilityFeatures.join(', ') : 'Not listed'}
              </span>
            </div>
            <div className={bizStyles.detail}>
              <span className={bizStyles.detailLabel}>Hours</span>
              <div className={bizStyles.hours}>
                {DAY_NAMES.map((day, i) => {
                  const h = business.hours.find((x) => x.dayOfWeek === i)
                  return (
                    <div key={day} className={bizStyles.hourRow}>
                      <span className={i === today ? bizStyles.hourToday : bizStyles.hourDay}>{day}</span>
                      <span className={i === today ? bizStyles.hourToday : undefined}>
                        {h ? `${formatClock(h.openTime)} – ${formatClock(h.closeTime)}` : 'Closed'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className={bizStyles.detail}>
              <span className={bizStyles.detailLabel}>Tags</span>
              <div className={styles.tagWrap}>
                {business.tags.map((t) => (
                  <Badge key={t} tone="outline">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className={styles.section}>
        <h2 className="section-title">Reviews</h2>
        <Card pad="lg">
          <BusinessReviews business={business} />
        </Card>
      </section>

      {similar.length > 0 && (
        <section className={styles.section}>
          <h2 className="section-title">Similar businesses</h2>
          <div className={styles.similarGrid}>
            {similar.map((b) => (
              <BusinessCard
                key={b.id}
                business={b}
                distanceKm={origin ? haversineKm(origin, b.location) : null}
              />
            ))}
          </div>
        </section>
      )}

      <Modal
        open={claimed !== null}
        onClose={() => setClaimed(null)}
        eyebrow="Confirmation"
        title="You’re all set"
        footer={
          <Link to="/claims" className="btn btn--primary">
            Go to Claims
          </Link>
        }
      >
        {claimed && <ClaimCodeCard claim={claimed.claim} offer={claimed.offer} business={claimed.business} />}
      </Modal>
    </div>
  )
}
