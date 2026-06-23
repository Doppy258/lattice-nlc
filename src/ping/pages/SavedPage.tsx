import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Business, Claim, Offer, SavedOffer } from '@/models'
import { useSession } from '@/app/SessionContext'
import { useDatabase } from '@/app/useDatabase'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Icon } from '@/components/common/Icon'
import { Modal } from '@/components/common/Modal'
import { BusinessCard } from '@/components/businesses/BusinessCard'
import { OfferCard } from '@/components/offers/OfferCard'
import { ClaimCodeCard } from '@/components/offers/ClaimCodeCard'
import { createClaim } from '@/services/claimService'
import { haversineKm } from '@/utils/distance'
import styles from './saved.module.css'

type Tab = 'businesses' | 'offers'

export function SavedPage() {
  const { user } = useSession()
  const db = useDatabase()
  const now = Date.now()
  const origin = db.locations.find((l) => l.id === user.homeLocationId)?.point ?? db.locations[0]?.point

  const [tab, setTab] = useState<Tab>('businesses')
  const [bizSort, setBizSort] = useState('recent')
  const [offerSort, setOfferSort] = useState('ending')
  const [claimed, setClaimed] = useState<{ claim: Claim; offer: Offer; business: Business } | null>(null)
  const [actionError, setActionError] = useState('')

  const dealCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const o of db.offers) {
      if (o.active && new Date(o.validFrom).getTime() <= now && new Date(o.validUntil).getTime() >= now) {
        map.set(o.businessId, (map.get(o.businessId) ?? 0) + 1)
      }
    }
    return map
  }, [db.offers, now])

  const distanceTo = (b: Business): number | null => (origin ? haversineKm(origin, b.location) : null)

  const savedBusinesses = db.savedBusinesses
    .filter((s) => s.userId === user.id)
    .map((s) => ({ saved: s, business: db.businesses.find((b) => b.id === s.businessId) }))
    .filter((x): x is { saved: (typeof x)['saved']; business: Business } => Boolean(x.business))
    .sort((a, b) => {
      switch (bizSort) {
        case 'category':
          return a.business.category.localeCompare(b.business.category)
        case 'rating':
          return b.business.ratingAverage - a.business.ratingAverage
        case 'distance':
          return (distanceTo(a.business) ?? 1e9) - (distanceTo(b.business) ?? 1e9)
        case 'deals':
          return (dealCounts.get(b.business.id) ?? 0) - (dealCounts.get(a.business.id) ?? 0)
        default:
          return new Date(b.saved.savedAt).getTime() - new Date(a.saved.savedAt).getTime()
      }
    })

  const savedOffers = db.savedOffers
    .filter((s) => s.userId === user.id)
    .map((s) => {
      const offer = db.offers.find((o) => o.id === s.offerId)
      const business = offer ? db.businesses.find((b) => b.id === offer.businessId) : undefined
      return offer && business ? { saved: s, offer, business } : null
    })
    .filter((x): x is { saved: SavedOffer; offer: Offer; business: Business } => x !== null)
    .sort((a, b) => {
      switch (offerSort) {
        case 'savings':
          return (
            (b.offer.originalPrice ? b.offer.originalPrice - b.offer.price : 0) -
            (a.offer.originalPrice ? a.offer.originalPrice - a.offer.price : 0)
          )
        case 'rating':
          return b.business.ratingAverage - a.business.ratingAverage
        case 'category':
          return a.offer.category.localeCompare(b.offer.category)
        default:
          return new Date(a.offer.validUntil).getTime() - new Date(b.offer.validUntil).getTime()
      }
    })

  const handleClaim = (offerId: string) => {
    const res = createClaim(user.id, offerId)
    if (res.ok) {
      const offer = db.offers.find((o) => o.id === offerId)
      const business = offer ? db.businesses.find((b) => b.id === offer.businessId) : undefined
      if (offer && business) setClaimed({ claim: res.claim, offer, business })
    } else {
      setActionError(res.error)
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Saved" title="Saved" description="Your bookmarked businesses and offers." />

      <div className={styles.bar}>
        <div className={styles.tabs} role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'businesses'}
            className={tab === 'businesses' ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            onClick={() => setTab('businesses')}
          >
            Businesses <span className={styles.tabCount}>{savedBusinesses.length}</span>
          </button>
          <button
            role="tab"
            aria-selected={tab === 'offers'}
            className={tab === 'offers' ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            onClick={() => setTab('offers')}
          >
            Offers <span className={styles.tabCount}>{savedOffers.length}</span>
          </button>
        </div>

        {tab === 'businesses' ? (
          <select className={styles.select} value={bizSort} onChange={(e) => setBizSort(e.target.value)} aria-label="Sort saved businesses">
            <option value="recent">Recently saved</option>
            <option value="rating">Rating</option>
            <option value="distance">Distance</option>
            <option value="category">Category</option>
            <option value="deals">Active deals</option>
          </select>
        ) : (
          <select className={styles.select} value={offerSort} onChange={(e) => setOfferSort(e.target.value)} aria-label="Sort saved offers">
            <option value="ending">Ending soon</option>
            <option value="savings">Highest savings</option>
            <option value="rating">Business rating</option>
            <option value="category">Category</option>
          </select>
        )}
      </div>

      {actionError && <p style={{ color: 'var(--danger)', marginBottom: 'var(--sp-4)' }}>{actionError}</p>}

      {tab === 'businesses' ? (
        savedBusinesses.length === 0 ? (
          <EmptyState
            icon={<Icon name="bookmark" size={40} />}
            title="No saved businesses yet"
            action={
              <Link to="/explore" className="btn btn--primary">
                Explore businesses
              </Link>
            }
          >
            Explore local businesses or create a Ping to find offers, then bookmark your favourites.
          </EmptyState>
        ) : (
          <div className={styles.grid}>
            {savedBusinesses.map(({ business }) => (
              <BusinessCard
                key={business.id}
                business={business}
                distanceKm={distanceTo(business)}
                activeDeals={dealCounts.get(business.id) ?? 0}
              />
            ))}
          </div>
        )
      ) : savedOffers.length === 0 ? (
        <EmptyState
          icon={<Icon name="bookmark" size={40} />}
          title="No saved offers yet"
          action={
            <Link to="/create" className="btn btn--primary">
              Create a Ping
            </Link>
          }
        >
          Save offers from your matches or a business profile to keep them here.
        </EmptyState>
      ) : (
        <div className={styles.grid}>
          {savedOffers.map(({ offer, business }) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              business={business}
              distanceKm={distanceTo(business) ?? 0}
              onClaim={handleClaim}
            />
          ))}
        </div>
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
