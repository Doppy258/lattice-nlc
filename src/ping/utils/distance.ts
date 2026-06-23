import type { GeoPoint } from '@/models'

const EARTH_RADIUS_KM = 6371

const toRad = (deg: number): number => (deg * Math.PI) / 180

/**
 * Great-circle distance between two points in kilometres (haversine formula).
 * Used by the distance subscore and every "X km away" label.
 */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

/**
 * Place a point a given number of km north/east of an origin. Used by the seed
 * data so business coordinates correspond to *known, intentional* distances
 * from the demo origin (negative = south / west).
 */
export function offsetPoint(origin: GeoPoint, northKm: number, eastKm: number): GeoPoint {
  const dLat = northKm / 110.574
  const dLng = eastKm / (111.32 * Math.cos(toRad(origin.lat)))
  return { lat: origin.lat + dLat, lng: origin.lng + dLng }
}
