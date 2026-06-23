import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Business, Claim, Offer } from '@/models'
import { useSession } from '@/app/SessionContext'
import { useDatabase } from '@/app/useDatabase'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Modal } from '@/components/common/Modal'
import { Icon } from '@/components/common/Icon'
import { RadarMark } from '@/components/common/RadarMark'
import { OfferCard } from '@/components/offers/OfferCard'
import { ClaimCodeCard } from '@/components/offers/ClaimCodeCard'
import {
  getMatchingOffers,
  getNearMissOffers,
  isBusinessOpenAt,
  type ScoredOffer,
} from '@/services/offerMatchingService'
import { createClaim } from '@/services/claimService'
import { formatTime } from '@/utils/dateTime'
import { formatCurrency, needTypeLabel } from '@/utils/formatting'
import styles from './matches.module.css'

const SORTS = [
  { v: 'best', l: 'Best match' },
  { v: 'rating', l: 'Highest rating' },
  { v: 'closest', l: 'Closest' },
  { v: 'price', l: 'Lowest price' },
  { v: 'ending', l: 'Ending soon' },
  { v: 'claimed', l: 'Most claimed' },
] as const

const FILTERS = [
  { k: 'deals', l: 'Active deals' },
  { k: 'openNow', l: 'Open now' },
  { k: 'studentDiscount', l: 'Student discount' },
  { k: 'verified', l: 'Verified' },
  { k: 'saved', l: 'Saved businesses' },
]

type Enriched = { s: ScoredOffer; offer: Offer; business: Business }

export function MatchesPage() {
  const { user } = useSession()
  const db = useDatabase()
  const now = new Date()
  const origin = db.locations.find((l) => l.id === user.homeLocationId)?.point ?? db.locations[0]?.point

  const [sort, setSort] = useState<(typeof SORTS)[number]['v']>('best')
  const [active, setActive] = useState<Set<string>>(new Set())
  const [claimed, setClaimed] = useState<{ claim: Claim; offer: Offer; business: Business } | null>(null)
  const [actionError, setActionError] = useState('')

  // The most recent request for this profile drives the page.
  const request = useMemo(
    () =>
      [...db.pingRequests]
        .filter((r) => r.userId === user.id && (r.status === 'matched' || r.status === 'submitted'))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0],
    [db.pingRequests, user.id],
  )

  const bizById = (id: string) => db.businesses.find((b) => b.id === id)
  const offerById = (id: string) => db.offers.find((o) => o.id === id)

  const enrich = (scored: ScoredOffer[]): Enriched[] =>
    scored
      .map((s) => {
        const offer = offerById(s.offerId)
        const business = bizById(s.businessId)
        return offer && business ? { s, offer, business } : null
      })
      .filter((x): x is Enriched => x !== null)

  const matchesAll = useMemo(
    () => (request && origin ? enrich(getMatchingOffers(request, db.offers, db.businesses, user, origin, now)) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [request, db.offers, db.businesses, origin, user],
  )

  if (!request) {
    return (
      <div>
        <PageHeader eyebrow="Results" title="Matched offers" />
        <EmptyState
          icon={<RadarMark size={64} />}
          title="No Ping yet"
          action={
            <Link to="/create" className="btn btn--primary">
              Create a Ping
            </Link>
          }
        >
          Create a Ping describing what you need, and your ranked local offers will land here.
        </EmptyState>
      </div>
    )
  }

  const toggle = (key: string) =>
    setActive((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const passesFilters = ({ offer, business }: Enriched): boolean => {
    if (active.has('deals') && !offer.originalPrice) return false
    if (active.has('openNow') && !isBusinessOpenAt(business, now)) return false
    if (active.has('studentDiscount') && !(offer.studentOnly || offer.offerType === 'studentOffer')) return false
    if (active.has('verified') && !business.verified) return false
    if (active.has('saved') && !db.savedBusinesses.some((s) => s.userId === user.id && s.businessId === business.id))
      return false
    return true
  }

  const sorted = [...matchesAll.filter(passesFilters)].sort((a, b) => {
    switch (sort) {
      case 'rating':
        return b.business.ratingAverage - a.business.ratingAverage
      case 'closest':
        return a.s.distanceKm - b.s.distanceKm
      case 'price':
        return a.offer.price - b.offer.price
      case 'ending':
        return new Date(a.offer.validUntil).getTime() - new Date(b.offer.validUntil).getTime()
      case 'claimed':
        return b.offer.currentClaims - a.offer.currentClaims
      default:
        return b.s.score - a.s.score
    }
  })

  const handleClaim = (offerId: string) => {
    const res = createClaim(user.id, offerId)
    if (res.ok) {
      const offer = offerById(offerId)
      const business = offer ? bizById(offer.businessId) : undefined
      if (offer && business) setClaimed({ claim: res.claim, offer, business })
    } else {
      setActionError(res.error)
    }
  }

  const budgetText = request.budgetMax !== undefined ? `Under ${formatCurrency(request.budgetMax)}` : 'Any budget'
  const timeText = `${formatTime(new Date(request.timeStart))}–${formatTime(new Date(request.timeEnd))}`

  const nearMiss = sorted.length === 0 && origin ? enrich(getNearMissOffers(request, db.offers, db.businesses, user, origin, 3, now)) : []

  return (
    <div>
      <PageHeader
        eyebrow="Results"
        title="Matched offers"
        actions={
          <Link to="/create" className="btn btn--secondary">
            <Icon name="ping" size={16} /> New Ping
          </Link>
        }
      />

      {actionError && (
        <div className={styles.banner}>
          <Icon name="x" size={16} />
          {actionError}
          <button className={styles.bannerClose} onClick={() => setActionError('')} aria-label="Dismiss">
            <Icon name="x" size={15} />
          </button>
        </div>
      )}

      <div className={styles.toolbar}>
        <div className={styles.summary}>
          <span className={styles.summaryChip}>
            <Icon name="target" size={14} /> {needTypeLabel(request.needType)}
          </span>
          <span className={styles.summaryChip}>
            <Icon name="ticket" size={14} /> {budgetText}
          </span>
          <span className={styles.summaryChip}>
            <Icon name="location" size={14} /> Within {request.distanceKm} km
          </span>
          <span className={styles.summaryChip}>
            <Icon name="clock" size={14} /> {timeText}
          </span>
        </div>

        <div className={styles.controls}>
          <span className={styles.count}>
            <b>{sorted.length}</b> {sorted.length === 1 ? 'offer matches' : 'offers match'} your Ping
          </span>
          <div className={styles.sort}>
            <label htmlFor="sort">Sort by</label>
            <select
              id="sort"
              className={styles.select}
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
            >
              {SORTS.map((s) => (
                <option key={s.v} value={s.v}>
                  {s.l}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.filters}>
          <span className={styles.filtersLabel}>
            <Icon name="filter" size={14} /> Filter
          </span>
          {FILTERS.map((f) => (
            <button
              key={f.k}
              type="button"
              className="chip"
              aria-pressed={active.has(f.k)}
              onClick={() => toggle(f.k)}
            >
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {sorted.length > 0 ? (
        <div className={styles.results}>
          {sorted.map(({ s, offer, business }) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              business={business}
              distanceKm={s.distanceKm}
              score={s.score}
              reasons={s.reasons}
              onClaim={handleClaim}
            />
          ))}
        </div>
      ) : (
        <div>
          <EmptyState icon={<RadarMark size={56} />} title="No exact matches found">
            Try increasing your distance, raising your budget, or changing your time window.
          </EmptyState>
          <div className={styles.suggestions}>
            <span className={styles.suggestion}>
              <Icon name="location" size={13} /> Widen distance
            </span>
            <span className={styles.suggestion}>
              <Icon name="ticket" size={13} /> Raise budget
            </span>
            <span className={styles.suggestion}>
              <Icon name="clock" size={13} /> Change time window
            </span>
          </div>

          {nearMiss.length > 0 && (
            <div className={styles.nearMiss}>
              <h2 className="section-title">Close, but not quite</h2>
              <div className={styles.results}>
                {nearMiss.map(({ s, offer, business }) => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    business={business}
                    distanceKm={s.distanceKm}
                    score={s.score}
                    reasons={s.reasons}
                    onClaim={handleClaim}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal
        open={claimed !== null}
        onClose={() => setClaimed(null)}
        eyebrow="Confirmation"
        title="You’re all set"
        footer={
          claimed && (
            <>
              <Link to={`/business/${claimed.business.id}`} className="btn btn--secondary">
                View business
              </Link>
              <Link to="/claims" className="btn btn--primary">
                Go to Claims
              </Link>
            </>
          )
        }
      >
        {claimed && <ClaimCodeCard claim={claimed.claim} offer={claimed.offer} business={claimed.business} />}
      </Modal>
    </div>
  )
}
