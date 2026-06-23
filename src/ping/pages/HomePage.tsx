import { Link } from 'react-router-dom'
import { useSession } from '@/app/SessionContext'
import { useDatabase } from '@/app/useDatabase'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Icon } from '@/components/common/Icon'
import { RingField } from '@/components/common/RingField'
import { haversineKm } from '@/utils/distance'
import { countdown } from '@/utils/dateTime'
import {
  categoryLabel,
  firstName,
  formatCurrency,
  formatDistance,
  formatPrice,
  formatRating,
  initials,
  pluralize,
} from '@/utils/formatting'
import type { Offer } from '@/models'
import styles from './home.module.css'

function greeting(date: Date): string {
  const h = date.getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export function HomePage() {
  const { user } = useSession()
  const db = useDatabase()
  const now = new Date()

  const homePoint = db.locations.find((l) => l.id === user.homeLocationId)?.point
  const bizById = (id: string) => db.businesses.find((b) => b.id === id)
  const offerById = (id: string) => db.offers.find((o) => o.id === id)
  const distanceTo = (businessId: string): number | null => {
    const biz = bizById(businessId)
    if (!biz || !homePoint) return null
    return haversineKm(homePoint, biz.location)
  }

  /* ── Derived dashboard data for the active profile ──────────────────── */
  const myClaims = db.claims.filter((c) => c.userId === user.id)
  const activeClaims = myClaims.filter((c) => c.status === 'active')
  const redeemedClaims = myClaims.filter((c) => c.status === 'redeemed')

  const savings = redeemedClaims.reduce((sum, claim) => {
    const offer = offerById(claim.offerId)
    if (offer?.originalPrice) return sum + (offer.originalPrice - offer.price)
    return sum
  }, 0)

  const savedBusinesses = db.savedBusinesses
    .filter((s) => s.userId === user.id)
    .map((s) => bizById(s.businessId))
    .filter((b): b is NonNullable<typeof b> => Boolean(b))

  const liveOffers = db.offers.filter((o) => o.active)
  const recentOffers: Offer[] = [...liveOffers].sort((a, b) => b.views - a.views).slice(0, 3)

  const categoryCounts = liveOffers.reduce<Record<string, number>>((acc, o) => {
    acc[o.category] = (acc[o.category] ?? 0) + 1
    return acc
  }, {})
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const locationLabel = db.locations.find((l) => l.id === user.homeLocationId)?.label ?? 'Oakville'

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className={`${styles.hero} ${styles.reveal}`}>
        <RingField />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <span className={styles.heroEyebrow}>Ping · {locationLabel}</span>
            <p className={styles.heroGreeting}>
              {greeting(now)}, {firstName(user.name)}.
            </p>
            <h1 className={styles.heroTitle}>What do you need nearby?</h1>
            <p className={styles.heroSub}>
              Match with local businesses based on your budget, timing, distance, and preferences.
            </p>
            <div className={styles.heroCtas}>
              <Link to="/create" className="btn btn--primary btn--lg btn--pulse">
                Create a Ping
                <Icon name="ping" size={18} />
              </Link>
              <Link to="/explore" className="btn btn--secondary btn--lg">
                Explore Businesses
              </Link>
            </div>
            <p className={styles.heroMeta}>
              <b>{liveOffers.length}</b> live offers · <b>{db.businesses.length}</b> local businesses
            </p>
          </div>

          {/* Sample ping preview — communicates the product at a glance */}
          <aside className={styles.sampleCard} aria-hidden="true">
            <div className={styles.sampleHead}>
              <span className={styles.sampleDot} />
              Sample Ping
            </div>
            <p className={styles.sampleSentence}>
              I need <b>lunch</b> under <b>$15</b> within <b>3&nbsp;km</b> after school.
            </p>
            <div className={styles.sampleChips}>
              <span className={styles.sampleChip}>
                <Icon name="ticket" size={12} /> Under $15
              </span>
              <span className={styles.sampleChip}>
                <Icon name="location" size={12} /> 3 km
              </span>
              <span className={styles.sampleChip}>
                <Icon name="clock" size={12} /> 3:30–5:00 PM
              </span>
            </div>
            <div className={styles.sampleFoot}>
              <span className={styles.sampleFootLabel}>Estimated matches</span>
              <span className={styles.sampleScore}>8</span>
            </div>
          </aside>
        </div>
      </section>

      {/* ── Stat tiles ───────────────────────────────────────────────── */}
      <div className={`${styles.statRow} ${styles.reveal}`} style={{ animationDelay: '60ms' }}>
        <Card className={styles.statTile}>
          <span className={styles.statIcon} data-tone="emerald">
            <Icon name="sparkle" size={22} />
          </span>
          <div className="stat">
            <span className="stat__value">{formatCurrency(savings)}</span>
            <span className="stat__label">
              Saved with Ping · {pluralize(redeemedClaims.length, 'redemption')}
            </span>
          </div>
        </Card>
        <Card className={styles.statTile}>
          <span className={styles.statIcon} data-tone="signal">
            <Icon name="ticket" size={22} />
          </span>
          <div className="stat">
            <span className="stat__value">{activeClaims.length}</span>
            <span className="stat__label">Active claims</span>
          </div>
        </Card>
        <Card className={styles.statTile}>
          <span className={styles.statIcon}>
            <Icon name="bookmark" size={22} />
          </span>
          <div className="stat">
            <span className="stat__value">{savedBusinesses.length}</span>
            <span className="stat__label">Saved businesses</span>
          </div>
        </Card>
      </div>

      {/* ── Active claims + Saved businesses ─────────────────────────── */}
      <div className={`${styles.grid2} ${styles.reveal}`} style={{ animationDelay: '120ms' }}>
        <Card>
          <div className={styles.cardHead}>
            <h2>Active claims</h2>
            <Link to="/claims" className={styles.seeAll}>
              View all <Icon name="chevronRight" size={14} />
            </Link>
          </div>
          {activeClaims.length === 0 ? (
            <p className="muted">No active claims yet. Create a Ping to find an offer to claim.</p>
          ) : (
            <div className={styles.list}>
              {activeClaims.slice(0, 3).map((claim) => {
                const biz = bizById(claim.businessId)
                const offer = offerById(claim.offerId)
                const left = countdown(claim.expiresAt, now)
                const soon = !left.includes('day')
                return (
                  <div key={claim.id} className={styles.listRow}>
                    <span className={styles.rowAvatar}>{initials(biz?.name ?? '?')}</span>
                    <div className={styles.rowMain}>
                      <div className={styles.rowTitle}>{biz?.name}</div>
                      <div className={styles.rowSub}>{offer?.title}</div>
                    </div>
                    <div className={styles.rowEnd}>
                      <span className={styles.code}>{claim.claimCode}</span>
                      <span className={soon ? styles.expirySoon : styles.expiry}>
                        {left === 'Expired' ? 'Expired' : `Expires in ${left}`}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card>
          <div className={styles.cardHead}>
            <h2>Saved businesses</h2>
            <Link to="/saved" className={styles.seeAll}>
              View all <Icon name="chevronRight" size={14} />
            </Link>
          </div>
          {savedBusinesses.length === 0 ? (
            <p className="muted">You haven’t saved any businesses yet.</p>
          ) : (
            <div className={styles.list}>
              {savedBusinesses.slice(0, 3).map((biz) => {
                const dist = distanceTo(biz.id)
                return (
                  <Link key={biz.id} to={`/business/${biz.id}`} className={styles.listRow}>
                    <span className={styles.rowAvatar}>{initials(biz.name)}</span>
                    <div className={styles.rowMain}>
                      <div className={styles.rowTitle}>{biz.name}</div>
                      <div className={styles.rowSub}>
                        {categoryLabel(biz.category)}
                        {dist !== null ? ` · ${formatDistance(dist)}` : ''}
                      </div>
                    </div>
                    <div className={styles.rowEnd}>
                      <Badge tone="outline">
                        <Icon name="star" size={11} /> {formatRating(biz.ratingAverage)}
                      </Badge>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ── Recent offers ────────────────────────────────────────────── */}
      <div className={styles.reveal} style={{ animationDelay: '180ms' }}>
        <h2 className={`${styles.sectionLabel} section-title`}>Fresh offers near you</h2>
        <div className={styles.offersGrid}>
          {recentOffers.map((offer) => {
            const biz = bizById(offer.businessId)
            const dist = biz ? distanceTo(biz.id) : null
            return (
              <Link key={offer.id} to={`/business/${offer.businessId}`} className="card card--link">
                <div className={styles.offerMini}>
                  <div className={styles.offerTop}>
                    <span className={styles.offerBiz}>{biz?.name}</span>
                    {offer.studentOnly ? (
                      <Badge tone="signal">Student</Badge>
                    ) : offer.originalPrice ? (
                      <Badge tone="emerald">
                        Save {formatCurrency(offer.originalPrice - offer.price)}
                      </Badge>
                    ) : null}
                  </div>
                  <div className={styles.offerTitle}>{offer.title}</div>
                  <div className={styles.offerPrice}>
                    <span className={styles.priceNow}>{formatPrice(offer.price)}</span>
                    {offer.originalPrice && (
                      <span className={styles.priceWas}>{formatCurrency(offer.originalPrice)}</span>
                    )}
                  </div>
                  <div className={styles.offerMeta}>
                    {dist !== null && (
                      <span>
                        <Icon name="location" size={13} /> {formatDistance(dist)}
                      </span>
                    )}
                    {biz && (
                      <span>
                        <Icon name="star" size={13} /> {formatRating(biz.ratingAverage)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Top categories ───────────────────────────────────────────── */}
      <div className={styles.reveal} style={{ animationDelay: '240ms' }}>
        <h2 className={`${styles.sectionLabel} section-title`}>Browse by category</h2>
        <div className={styles.cats}>
          {topCategories.map(([cat, count]) => (
            <Link key={cat} to="/explore" className={styles.catChip}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  background: 'var(--signal)',
                  display: 'inline-block',
                }}
              />
              {categoryLabel(cat as never)}
              <span className={styles.catCount}>{count}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
