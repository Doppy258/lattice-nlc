import { useState } from 'react'
import type { Claim, Offer } from '@/models'
import { useDatabase } from '@/app/useDatabase'
import { useBusinessContext } from '@/app/useBusinessContext'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/common/Button'
import { Icon } from '@/components/common/Icon'
import { BusinessSwitcher } from '@/components/businesses/BusinessSwitcher'
import { redeemClaim, validateClaimCode, validateRedemption } from '@/services/claimService'
import { countdown } from '@/utils/dateTime'
import styles from './business.module.css'

type RedeemState =
  | { kind: 'idle' }
  | { kind: 'error'; message: string }
  | { kind: 'verified'; claim: Claim; offer: Offer }
  | { kind: 'redeemed'; claim: Claim }

export function RedeemClaimPage() {
  const db = useDatabase()
  const { current } = useBusinessContext()
  const [code, setCode] = useState('')
  const [state, setState] = useState<RedeemState>({ kind: 'idle' })

  if (!current) {
    return (
      <div>
        <PageHeader eyebrow="Business" title="Redeem a claim" />
        <EmptyState icon={<Icon name="scan" size={44} />} title="No business selected">
          Switch to a business-owner profile to redeem claim codes.
        </EmptyState>
      </div>
    )
  }

  const verify = (raw?: string) => {
    const value = raw ?? code
    if (raw) setCode(raw)
    const lookup = validateClaimCode(value)
    if (!lookup.valid) {
      setState({ kind: 'error', message: lookup.reason })
      return
    }
    const offer = db.offers.find((o) => o.id === lookup.claim.offerId)
    if (!offer) {
      setState({ kind: 'error', message: 'That offer could not be found.' })
      return
    }
    const rule = validateRedemption(lookup.claim, offer, current.id)
    if (!rule.ok) {
      setState({ kind: 'error', message: rule.error })
      return
    }
    setState({ kind: 'verified', claim: lookup.claim, offer })
  }

  const redeem = () => {
    const res = redeemClaim(code, current.id)
    setState(res.ok ? { kind: 'redeemed', claim: res.claim } : { kind: 'error', message: res.error })
  }

  const activeClaims = db.claims.filter((c) => c.businessId === current.id && c.status === 'active')
  const offerTitle = (id: string) => db.offers.find((o) => o.id === id)?.title ?? ''

  return (
    <div>
      <PageHeader
        eyebrow="Business"
        title="Redeem a claim"
        description="Enter a customer's claim code to verify and mark the offer redeemed."
        actions={<BusinessSwitcher />}
      />

      <div className={styles.redeemGrid}>
        <Card pad="lg">
          <label className={styles.label} htmlFor="redeem-code">
            Claim code
          </label>
          <div className={styles.codeForm}>
            <input
              id="redeem-code"
              className={styles.codeInput}
              placeholder="PING-0000"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase())
                setState({ kind: 'idle' })
              }}
            />
            <Button variant="ink" onClick={() => verify()}>
              Verify
            </Button>
          </div>

          {state.kind === 'error' && (
            <div className={`${styles.result} ${styles.resultErr}`}>
              <Icon name="x" size={18} />
              <div className={styles.resultBody}>{state.message}</div>
            </div>
          )}

          {state.kind === 'verified' && (
            <div className={`${styles.result} ${styles.resultPending}`}>
              <Icon name="shield" size={18} />
              <div className={styles.resultBody}>
                <b>Claim verified</b>
                {state.offer.title} · expires in {countdown(state.claim.expiresAt)}
                <div style={{ marginTop: 'var(--sp-3)' }}>
                  <Button variant="primary" size="sm" onClick={redeem}>
                    Mark as redeemed
                  </Button>
                </div>
              </div>
            </div>
          )}

          {state.kind === 'redeemed' && (
            <div className={`${styles.result} ${styles.resultOk}`}>
              <Icon name="check" size={18} />
              <div className={styles.resultBody}>
                <b>Claim redeemed successfully</b>
                The customer can now leave a verified review.
              </div>
            </div>
          )}
        </Card>

        <Card pad="lg">
          <h3 style={{ marginBottom: 'var(--sp-2)' }}>Active claims here</h3>
          <p className="muted" style={{ fontSize: 'var(--fs-sm)', marginBottom: 'var(--sp-3)' }}>
            Outstanding claim codes for {current.name}.
          </p>
          {activeClaims.length === 0 ? (
            <p className="muted">No active claims right now.</p>
          ) : (
            activeClaims.map((c) => (
              <div key={c.id} className={styles.activeClaim}>
                <div>
                  <span className={styles.activeClaimCode}>{c.claimCode}</span>
                  <div className="muted" style={{ fontSize: 'var(--fs-xs)' }}>
                    {offerTitle(c.offerId)}
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => verify(c.claimCode)}>
                  Use
                </Button>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  )
}
