/**
 * Great-circle (haversine) distance calculations used throughout the ranking
 * engine and the "within X km" filter. All geo inputs are expected as
 * {lat, lng} in decimal degrees.
 */

import type { GeoPoint } from "../models";

const EARTH_RADIUS_KM = 6371;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Great-circle distance in kilometers between two coordinates (haversine).
 * Used for distance scoring and "within X km" checks against seeded origins.
 */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Rounds a distance to one decimal for display (e.g. "1.8 km"). */
export function roundKm(km: number): number {
  return Math.round(km * 10) / 10;
}
