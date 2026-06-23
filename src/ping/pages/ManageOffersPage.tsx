import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Offer } from '@/models'
import { useDatabase } from '@/app/useDatabase'
import { useBusinessContext } from '@/app/useBusinessContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { Modal } from '@/components/common/Modal'
import { OfferForm } from '@/components/businesses/OfferForm'
import { BusinessSwitcher } from '@/components/businesses/BusinessSwitcher'
import { getOfferStatus, setOfferActive, updateOffer } from '@/services/businessService'
import { formatCurrency } from '@/utils/formatting'
import { formatDate } from '@/utils/dateTime'
import styles from './business.module.css'

type Tab = 'active' | 'scheduled' | 'expired'
const TABS: Tab[] = ['active', 'scheduled', 'expired']

export function ManageOffersPage() {
  const db = useDatabase()
  const { current } = useBusinessContext()
  const [tab, setTab] = useState<Tab>('active')
  const [editing, setEditing] = useState<Offer | null>(null)

  if (!current) {
    return (
      <div>
        <PageHeader eyebrow="Business" title="Manage offers" />
        <EmptyState icon={<Icon name="tag" size={44} />} title="No business selected">
          Switch to a business-owner profile to manage offers.
        </EmptyState>
      </div>
    )
  }

  const offers = db.offers.filter((o) => o.businessId === current.id)
  const redemptionsFor = (offerId: string) =>
    db.claims.filter((c) => c.offerId === offerId && c.status === 'redeemed').length
  const countFor = (t: Tab) => offers.filter((o) => getOfferStatus(o) === t).length
  const visible = offers.filter((o) => getOfferStatus(o) === tab)

  return (
    <div>
      <PageHeader
        eyebrow="Business"
        title="Manage offers"
        description={`${current.name}'s active, scheduled, and expired offers.`}
        actions={
          <>
            <BusinessSwitcher />
            <Link to="/biz/create-offer" className="btn btn--primary">
              <Icon name="plus" size={16} /> Create offer
            </Link>
          </>
        }
      />

      <div className={styles.tabs} role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            onClick={() => setTab(t)}
          >
            {t[0].toUpperCase() + t.slice(1)}
            <span className={styles.tabCount}>{countFor(t)}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={<Icon name="tag" size={40} />} title={`No ${tab} offers`}>
          {tab === 'active'
            ? 'Publish an offer to start matching with customers.'
            : `Offers that are ${tab} will appear here.`}
        </EmptyState>
      ) : (
        <div className={styles.offerList}>
          {visible.map((offer) => (
            <div key={offer.id} className={styles.offerRow}>
              <div className={styles.offerInfo}>
                <div className={styles.offerTitle}>{offer.title}</div>
                <div className={styles.offerDates}>
                  {formatCurrency(offer.price)} · {formatDate(offer.validFrom)} – {formatDate(offer.validUntil)}
                </div>
              </div>

              <div className={styles.offerStats}>
                <div className={styles.oStat}>
                  <span className={styles.oStatVal}>{offer.currentClaims}</span>
                  <span className={styles.oStatLabel}>Claims</span>
                </div>
                <div className={styles.oStat}>
                  <span className={styles.oStatVal}>{redemptionsFor(offer.id)}</span>
                  <span className={styles.oStatLabel}>Redeemed</span>
                </div>
                <div className={styles.oStat}>
                  <span className={styles.oStatVal}>{offer.views}</span>
                  <span className={styles.oStatLabel}>Views</span>
                </div>
              </div>

              {tab === 'active' && <Badge tone="emerald">Active</Badge>}
              {tab === 'scheduled' && <Badge tone="info">Scheduled</Badge>}
              {tab === 'expired' && <Badge tone="outline">Expired</Badge>}

              <div className={styles.offerActions}>
                <Button variant="secondary" size="sm" onClick={() => setEditing(offer)}>
                  Edit
                </Button>
                {offer.active ? (
                  <Button variant="danger" size="sm" onClick={() => setOfferActive(offer.id, false)}>
                    Deactivate
                  </Button>
                ) : (
                  <Button variant="secondary" size="sm" onClick={() => setOfferActive(offer.id, true)}>
                    Reactivate
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} eyebrow="Edit offer" title={editing?.title ?? ''} size="lg">
        {editing && (
          <OfferForm
            defaultCategory={current.category}
            initial={editing}
            submitLabel="Save changes"
            onSubmit={(draft) => {
              updateOffer(editing.id, draft)
              setEditing(null)
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  )
}
