import type { PersonalRanking } from '@/models'
import { isoFrom } from '@/utils/dateTime'

/**
 * Pre-built personal rankings for the demo customer (Lucas), one per the five
 * lists the Rankings page shows: lunch spots, cafes, haircuts, study/learning
 * spots, and gift shops. Stored as ordered arrays (index 0 = favourite).
 */
export function buildSeedRankings(now: Date): PersonalRanking[] {
  const updatedAt = isoFrom(now, { days: -5 })
  return [
    { userId: 'u_lucas', category: 'food', needType: 'lunch', rankedBusinessIds: ['b_freshbowl', 'b_bowlco', 'b_maplemain'], updatedAt },
    { userId: 'u_lucas', category: 'food', needType: 'cafeStudySpot', rankedBusinessIds: ['b_caffeine', 'b_freshbowl'], updatedAt },
    { userId: 'u_lucas', category: 'services', needType: 'haircut', rankedBusinessIds: ['b_sharpline', 'b_lumiere'], updatedAt },
    { userId: 'u_lucas', category: 'education', rankedBusinessIds: ['b_brightpath', 'b_testpeak'], updatedAt },
    { userId: 'u_lucas', category: 'retail', needType: 'gift', rankedBusinessIds: ['b_pageturner', 'b_northsidegift'], updatedAt },
  ]
}
