import type { Business, Offer } from '@/models'
import { EmptyState } from '@/components/common/EmptyState'
import { Icon } from '@/components/common/Icon'
import { OfferCard } from '@/components/offers/OfferCard'

export function ActiveOffers({
  business,
  offers,
  distanceKm,
  onClaim,
}: {
  business: Business
  offers: Offer[]
  distanceKm: number
  onClaim: (offerId: string) => void
}) {
  if (offers.length === 0) {
    return (
      <EmptyState icon={<Icon name="ticket" size={36} />} title="No active offers right now">
        Check back soon — this business hasn’t published a live offer.
      </EmptyState>
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))',
        gap: 'var(--sp-4)',
      }}
    >
      {offers.map((offer) => (
        <OfferCard key={offer.id} offer={offer} business={business} distanceKm={distanceKm} onClaim={onClaim} />
      ))}
    </div>
  )
}
