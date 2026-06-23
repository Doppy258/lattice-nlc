import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Business, Claim, ClaimStatus, Offer } from '@/models'
import { useSession } from '@/app/SessionContext'
import { useDatabase } from '@/app/useDatabase'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { ReviewModal } from '@/components/reviews/ReviewModal'
import { PairwiseModal } from '@/components/rankings/PairwiseModal'
import { cancelClaim, expireOldClaims } from '@/services/claimService'
import { countdown, formatLongDate } from '@/utils/dateTime'
import styles from './claims.module.css'

type Tab = Extract<ClaimStatus, 'active' | 'redeemed' | 'expired'>
const TABS: { key: Tab; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'redeemed', label: 'Redeemed' },
  { key: 'expired', label: 'Expired' },
]

export function ClaimsPage() {
  const { user } = useSession()
  const db = useDatabase()
  const [tab, setTab] = useState<Tab>('active')
  const [reviewFor, setReviewFor] = useState<{ claim: Claim; offer: Offer; business: Business } | null>(null)
  const [pairwiseFor, setPairwiseFor] = useState<Business | null>(null)

  // Reconcile any claims whose expiry has passed when the page opens.
  useEffect(() => {
    expireOldClaims()
  }, [])

  const myClaims = db.claims.filter((c) => c.userId === user.id)
  const bizById = (id: string) => db.businesses.find((b) => b.id === id)
  const offerById = (id: string) => db.offers.find((o) => o.id === id)
  const hasReview = (claimId: string) => db.reviews.some((r) => r.claimId === claimId)

  const countByTab = (t: Tab) =>
    myClaims.filter((c) => (t === 'expired' ? c.status === 'expired' || c.status === 'cancelled' : c.status === t)).length

  const visible = myClaims
    .filter((c) => (tab === 'expired' ? c.status === 'expired' || c.status === 'cancelled' : c.status === tab))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const openReview = (claim: Claim) => {
    const offer = offerById(claim.offerId)
    const business = bizById(claim.businessId)
    if (offer && business) setReviewFor({ claim, offer, business })
  }

  return (
    <div>
      <PageHeader
        eyebrow="Claims"
        title="Your claims"
        description="Show a claim code to redeem, then leave a verified review."
      />

      <div className={styles.tabs} role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={tab === t.key ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            <span className={styles.tabCount}>{countByTab(t.key)}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<Icon name="ticket" size={40} />}
          title={`No ${tab} claims`}
          action={
            <Link to="/create" className="btn btn--primary">
              Create a Ping
            </Link>
          }
        >
          {tab === 'active'
            ? 'Claim an offer from your matches and the code will appear here.'
            : tab === 'redeemed'
              ? 'Redeemed offers will show up here, ready to review.'
              : 'Expired and cancelled claims will be listed here.'}
        </EmptyState>
      ) : (
        <div className={styles.list}>
          {visible.map((claim) => {
            const business = bizById(claim.businessId)
            const offer = offerById(claim.offerId)
            if (!business || !offer) return null
            const left = countdown(claim.expiresAt)

            return (
              <article key={claim.id} className={styles.card}>
                <div className={styles.head}>
                  <div>
                    <div className={styles.biz}>
                      <Link to={`/business/${business.id}`}>{business.name}</Link>
                    </div>
                    <div className={styles.offer}>{offer.title}</div>
                  </div>
                  {claim.status === 'active' && <Badge tone="signal">Active</Badge>}
                  {claim.status === 'redeemed' && (
                    <Badge tone="emerald">
                      <Icon name="check" size={11} /> Redeemed
                    </Badge>
                  )}
                  {claim.status === 'expired' && <Badge tone="outline">Expired</Badge>}
                  {claim.status === 'cancelled' && <Badge tone="outline">Cancelled</Badge>}
                </div>

                {claim.status === 'active' && (
                  <>
                    <div className={styles.codeRow}>
                      <div>
                        <div className={styles.codeLabel}>Claim code</div>
                        <div className={styles.code}>{claim.claimCode}</div>
                      </div>
                      <div className={styles.expiry}>
                        Expires in
                        <b>{left}</b>
                      </div>
                    </div>
                    <div className={styles.actions}>
                      <Link to={`/business/${business.id}`} className="btn btn--secondary btn--sm">
                        <Icon name="location" size={15} /> Directions
                      </Link>
                      <Button variant="danger" size="sm" onClick={() => cancelClaim(claim.id)}>
                        Cancel claim
                      </Button>
                    </div>
                  </>
                )}

                {claim.status === 'redeemed' && (
                  <>
                    <div className={styles.metaRow}>
                      <Icon name="check" size={15} />
                      Redeemed {claim.redeemedAt ? formatLongDate(claim.redeemedAt) : ''}
                    </div>
                    <div className={styles.actions}>
                      {hasReview(claim.id) ? (
                        <Button variant="secondary" size="sm" disabled>
                          <Icon name="check" size={15} /> Reviewed
                        </Button>
                      ) : (
                        <Button variant="primary" size="sm" onClick={() => openReview(claim)}>
                          <Icon name="star" size={15} /> Leave a review
                        </Button>
                      )}
                    </div>
                  </>
                )}

                {(claim.status === 'expired' || claim.status === 'cancelled') && (
                  <div className={styles.actions}>
                    <Link to="/create" className="btn btn--secondary btn--sm">
                      Find similar offers
                    </Link>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      {reviewFor && (
        <ReviewModal
          open
          onClose={() => setReviewFor(null)}
          claim={reviewFor.claim}
          offer={reviewFor.offer}
          business={reviewFor.business}
          onSubmitted={() => setPairwiseFor(reviewFor.business)}
        />
      )}

      {pairwiseFor && (
        <PairwiseModal open business={pairwiseFor} onClose={() => setPairwiseFor(null)} />
      )}
    </div>
  )
}
