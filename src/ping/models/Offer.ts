import type { BusinessCategory } from './Business'

/** The shape of an offer — drives copy, filters, and matching nuances. */
export type OfferType =
  | 'discount'
  | 'limitedTime'
  | 'studentOffer'
  | 'groupOffer'
  | 'appointmentSlot'
  | 'event'
  | 'freeTrial'
  | 'bundle'

export type Offer = {
  id: string
  businessId: string
  title: string
  description: string
  category: BusinessCategory
  offerType: OfferType
  price: number
  /** When present and greater than `price`, the delta is the user's savings. */
  originalPrice?: number
  validFrom: string
  validUntil: string
  maxClaims: number
  currentClaims: number
  views: number
  tags: string[]
  studentOnly: boolean
  verificationRequired: boolean
  active: boolean
  createdAt: string
}
