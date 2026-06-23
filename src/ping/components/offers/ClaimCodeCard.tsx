import type { Business, Claim, Offer } from '@/models'
import { Icon } from '@/components/common/Icon'
import { formatLongDate } from '@/utils/dateTime'
import { formatPrice } from '@/utils/formatting'
import styles from './offers.module.css'

/** The post-claim confirmation: the PING-#### code plus redemption details. */
export function ClaimCodeCard({
  claim,
  offer,
  business,
}: {
  claim: Claim
  offer: Offer
  business: Business
}) {
  return (
    <div className={styles.claim}>
      <div className={styles.claimCheck}>
        <Icon name="check" size={28} />
      </div>
      <h3>Offer claimed</h3>
      <p className="muted">Show this code at {business.name} to redeem.</p>

      <div className={styles.claimCodeBox}>
        <div className={styles.claimCodeLabel}>Claim code</div>
        <div className={styles.claimCode}>{claim.claimCode}</div>
      </div>

      <div>
        <div className={styles.claimDetail}>
          <span>Offer</span>
          <span>{offer.title}</span>
        </div>
        <div className={styles.claimDetail}>
          <span>Price</span>
          <span>{formatPrice(offer.price)}</span>
        </div>
        <div className={styles.claimDetail}>
          <span>Expires</span>
          <span>{formatLongDate(claim.expiresAt)}</span>
        </div>
      </div>

      <p className={styles.claimInstructions}>You’ll find this anytime under Claims.</p>
    </div>
  )
}
