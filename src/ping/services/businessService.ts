import type { Business, BusinessCategory, Offer, OfferType } from '@/models'
import { getCollection, updateCollection } from './storageService'
import { makeId } from '@/utils/ids'
import { nowIso } from '@/utils/dateTime'
import type { FieldError, ValidationResult } from './requestValidationService'

/**
 * businessService — business/offer reads plus offer authoring (create, edit,
 * activate). Offer validation is a pure function reused by the form and tests.
 */

export const OFFER_TITLE_MAX = 80
export const OFFER_DESC_MAX = 250

/* ── Reads ────────────────────────────────────────────────────────────── */

export function getBusinessById(id: string): Business | undefined {
  return getCollection('businesses').find((b) => b.id === id)
}

export function getBusinessesByOwner(ownerUserId: string): Business[] {
  return getCollection('businesses').filter((b) => b.ownerUserId === ownerUserId)
}

export function getOffersForBusiness(businessId: string): Offer[] {
  return getCollection('offers').filter((o) => o.businessId === businessId)
}

/** Offers that are active and currently inside their validity window. */
export function getActiveOffersForBusiness(businessId: string, now: Date = new Date()): Offer[] {
  return getOffersForBusiness(businessId).filter((o) => getOfferStatus(o, now) === 'active')
}

/** Other businesses in the same category, highest-rated first. */
export function getSimilarBusinesses(businessId: string, limit = 3): Business[] {
  const target = getBusinessById(businessId)
  if (!target) return []
  return getCollection('businesses')
    .filter((b) => b.id !== businessId && b.category === target.category)
    .sort((a, b) => b.ratingAverage - a.ratingAverage)
    .slice(0, limit)
}

/** Lifecycle bucket for the Manage Offers tabs. */
export function getOfferStatus(offer: Offer, now: Date = new Date()): 'active' | 'scheduled' | 'expired' {
  const t = now.getTime()
  if (!offer.active || new Date(offer.validUntil).getTime() < t) return 'expired'
  if (new Date(offer.validFrom).getTime() > t) return 'scheduled'
  return 'active'
}

/* ── Offer authoring ──────────────────────────────────────────────────── */

export type OfferDraft = {
  title: string
  category: BusinessCategory
  offerType: OfferType
  description: string
  price: number
  originalPrice?: number
  validFrom: string
  validUntil: string
  maxClaims: number
  tags: string[]
  studentOnly: boolean
  verificationRequired: boolean
}

export function validateOffer(draft: OfferDraft): ValidationResult {
  const errors: FieldError[] = []
  const title = draft.title?.trim() ?? ''

  if (!title) errors.push({ field: 'title', message: 'Give your offer a title.' })
  else if (title.length > OFFER_TITLE_MAX) {
    errors.push({ field: 'title', message: `Keep the title under ${OFFER_TITLE_MAX} characters.` })
  }
  if (draft.description.length > OFFER_DESC_MAX) {
    errors.push({ field: 'description', message: `Keep the description under ${OFFER_DESC_MAX} characters.` })
  }
  if (Number.isNaN(draft.price) || draft.price < 0) {
    errors.push({ field: 'price', message: 'Price must be $0 or more.' })
  }
  if (draft.originalPrice !== undefined && draft.originalPrice <= draft.price) {
    errors.push({ field: 'originalPrice', message: 'Original price must be greater than the offer price.' })
  }
  const start = new Date(draft.validFrom).getTime()
  const end = new Date(draft.validUntil).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) {
    errors.push({ field: 'dates', message: 'Add a valid start and end time.' })
  } else if (end <= start) {
    errors.push({ field: 'dates', message: 'End time must be after start time.' })
  }
  if (!Number.isFinite(draft.maxClaims) || draft.maxClaims < 1) {
    errors.push({ field: 'maxClaims', message: 'Max claims must be at least 1.' })
  }

  return { valid: errors.length === 0, errors }
}

export function createOffer(businessId: string, draft: OfferDraft): Offer {
  const offer: Offer = {
    id: makeId('offer'),
    businessId,
    title: draft.title.trim(),
    description: draft.description.trim(),
    category: draft.category,
    offerType: draft.offerType,
    price: draft.price,
    originalPrice: draft.originalPrice,
    validFrom: draft.validFrom,
    validUntil: draft.validUntil,
    maxClaims: draft.maxClaims,
    currentClaims: 0,
    views: 0,
    tags: draft.tags,
    studentOnly: draft.studentOnly,
    verificationRequired: draft.verificationRequired,
    active: true,
    createdAt: nowIso(),
  }
  updateCollection('offers', [...getCollection('offers'), offer])
  return offer
}

export function updateOffer(offerId: string, draft: OfferDraft): Offer | null {
  const offers = getCollection('offers')
  const existing = offers.find((o) => o.id === offerId)
  if (!existing) return null
  const updated: Offer = {
    ...existing,
    title: draft.title.trim(),
    description: draft.description.trim(),
    category: draft.category,
    offerType: draft.offerType,
    price: draft.price,
    originalPrice: draft.originalPrice,
    validFrom: draft.validFrom,
    validUntil: draft.validUntil,
    maxClaims: draft.maxClaims,
    tags: draft.tags,
    studentOnly: draft.studentOnly,
    verificationRequired: draft.verificationRequired,
  }
  updateCollection('offers', offers.map((o) => (o.id === offerId ? updated : o)))
  return updated
}

export function setOfferActive(offerId: string, active: boolean): void {
  updateCollection('offers', getCollection('offers').map((o) => (o.id === offerId ? { ...o, active } : o)))
}
