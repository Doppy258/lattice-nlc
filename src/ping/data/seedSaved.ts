import type { SavedBusiness, SavedOffer } from '@/models'
import { isoFrom } from '@/utils/dateTime'

/** Bookmarks. These mirror the savedBusinessIds / savedOfferIds on each user. */
export function buildSeedSaved(now: Date): {
  savedBusinesses: SavedBusiness[]
  savedOffers: SavedOffer[]
} {
  return {
    savedBusinesses: [
      { userId: 'u_lucas', businessId: 'b_caffeine', savedAt: isoFrom(now, { days: -12 }), tags: ['study'] },
      { userId: 'u_lucas', businessId: 'b_sharpline', savedAt: isoFrom(now, { days: -20 }), tags: [] },
      { userId: 'u_lucas', businessId: 'b_riddleroom', savedAt: isoFrom(now, { days: -6 }), tags: ['weekend'] },
      { userId: 'u_maya', businessId: 'b_lumiere', savedAt: isoFrom(now, { days: -9 }), tags: [] },
      { userId: 'u_maya', businessId: 'b_pulsegym', savedAt: isoFrom(now, { days: -15 }), tags: [] },
      { userId: 'u_ethan', businessId: 'b_fixhub', savedAt: isoFrom(now, { days: -25 }), tags: [] },
    ],
    savedOffers: [
      { userId: 'u_lucas', offerId: 'o_page_blinddate', savedAt: isoFrom(now, { days: -10 }) },
      { userId: 'u_lucas', offerId: 'o_pulse_trial', savedAt: isoFrom(now, { days: -4 }) },
      { userId: 'u_maya', offerId: 'o_quick_studentprint', savedAt: isoFrom(now, { days: -7 }) },
    ],
  }
}
