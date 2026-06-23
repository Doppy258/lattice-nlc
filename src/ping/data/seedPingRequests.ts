import type { PingRequest } from '@/models'
import { atTime, isoFrom, shift } from '@/utils/dateTime'

/**
 * One historical request for the demo customer so reports and duplicate-request
 * detection have something to work with on first load. It mirrors the canonical
 * example: "lunch under $15, within 3 km, after school".
 */
export function buildSeedPingRequests(now: Date): PingRequest[] {
  const twoDaysAgo = shift(now, { days: -2 })
  return [
    {
      id: 'ping_seed_lunch',
      userId: 'u_lucas',
      category: 'food',
      needType: 'lunch',
      budgetMin: 0,
      budgetMax: 15,
      distanceKm: 3,
      timeStart: atTime(twoDaysAgo, 15, 30).toISOString(),
      timeEnd: atTime(twoDaysAgo, 17, 0).toISOString(),
      preferences: ['studentDiscount', 'openNow'],
      optionalNote: 'Somewhere quiet to eat and start homework.',
      verifiedHuman: true,
      status: 'matched',
      createdAt: isoFrom(now, { days: -2 }),
    },
  ]
}
