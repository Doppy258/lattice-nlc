import type { GeoPoint } from './Business'

/**
 * A named origin point used as the "you are here" for distance math. Seeded
 * locally (e.g. White Oaks Secondary School, Downtown Oakville) so the app
 * needs no real geolocation.
 */
export type Location = {
  id: string
  label: string
  point: GeoPoint
}
