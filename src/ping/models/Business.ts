/** The seven top-level categories the whole product is organised around. */
export type BusinessCategory =
  | 'food'
  | 'retail'
  | 'services'
  | 'fitness'
  | 'education'
  | 'repair'
  | 'entertainment'

/** A latitude / longitude pair. Seeded locally — no live geolocation. */
export type GeoPoint = {
  lat: number
  lng: number
}

/**
 * Opening hours for a single day of the week.
 * `dayOfWeek`: 0 = Sunday … 6 = Saturday. Times are 24h "HH:MM" strings so
 * the time-availability score can compare them without timezone parsing.
 */
export type BusinessHours = {
  dayOfWeek: number
  openTime: string
  closeTime: string
}

export type Business = {
  id: string
  name: string
  category: BusinessCategory
  description: string
  address: string
  location: GeoPoint
  hours: BusinessHours[]
  ratingAverage: number
  reviewCount: number
  verified: boolean
  /** Rough price tier shown as $–$$$$. */
  priceLevel: 1 | 2 | 3 | 4
  tags: string[]
  accessibilityFeatures: string[]
  ownerUserId: string
  createdAt: string
}
