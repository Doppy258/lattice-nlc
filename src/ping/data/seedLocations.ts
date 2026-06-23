import type { GeoPoint, Location } from '@/models'
import { offsetPoint } from '@/utils/distance'

/**
 * Demo origins. The whole map is centred on White Oaks Secondary School in
 * Oakville, ON — the PRD's reference origin. Business coordinates are derived
 * as offsets from this point so every distance is intentional and verifiable.
 */
export const SCHOOL_ORIGIN: GeoPoint = { lat: 43.4501, lng: -79.6876 }
export const DOWNTOWN_ORIGIN: GeoPoint = { lat: 43.4456, lng: -79.6676 }

export function buildSeedLocations(): Location[] {
  return [
    { id: 'loc_school', label: 'White Oaks Secondary School', point: SCHOOL_ORIGIN },
    { id: 'loc_downtown', label: 'Downtown Oakville', point: DOWNTOWN_ORIGIN },
    { id: 'loc_lucas_home', label: "Lucas’ home", point: offsetPoint(SCHOOL_ORIGIN, 0.15, -0.1) },
    { id: 'loc_maya_home', label: "Maya’s home", point: offsetPoint(DOWNTOWN_ORIGIN, 0.3, 0.4) },
    { id: 'loc_ethan_home', label: "Ethan’s home", point: offsetPoint(SCHOOL_ORIGIN, 3.4, -1.6) },
  ]
}
