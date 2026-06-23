import type { User } from '@/models'
import { isoFrom } from '@/utils/dateTime'

/**
 * Seed accounts — the "mock profile selector" the PRD calls for:
 * 3 customers, 2 business owners, 1 admin/demo user. Lucas Chen is the
 * primary demo customer (his saves, claims, and rankings are pre-populated).
 */
export function buildSeedUsers(now: Date): User[] {
  const createdAt = isoFrom(now, { days: -150 })

  return [
    {
      id: 'u_lucas',
      name: 'Lucas Chen',
      email: 'lucas.chen@student.hdsb.ca',
      role: 'customer',
      homeLocationId: 'loc_lucas_home',
      verified: true,
      createdAt,
      preferences: {
        preferredCategories: ['food', 'education', 'entertainment'],
        maxDefaultDistanceKm: 3,
        studentDiscountPreferred: true,
        accessibilityNeeds: ['quiet environment'],
        savedBusinessIds: ['b_caffeine', 'b_sharpline', 'b_riddleroom'],
        savedOfferIds: ['o_page_blinddate', 'o_pulse_trial'],
      },
    },
    {
      id: 'u_maya',
      name: 'Maya Patel',
      email: 'maya.patel@gmail.com',
      role: 'customer',
      homeLocationId: 'loc_maya_home',
      verified: true,
      createdAt,
      preferences: {
        preferredCategories: ['food', 'services', 'fitness'],
        maxDefaultDistanceKm: 5,
        studentDiscountPreferred: true,
        accessibilityNeeds: [],
        savedBusinessIds: ['b_lumiere', 'b_pulsegym'],
        savedOfferIds: ['o_quick_studentprint'],
      },
    },
    {
      id: 'u_ethan',
      name: 'Ethan Wong',
      email: 'ethan.wong@gmail.com',
      role: 'customer',
      homeLocationId: 'loc_ethan_home',
      verified: true,
      createdAt,
      preferences: {
        preferredCategories: ['repair', 'entertainment', 'retail'],
        maxDefaultDistanceKm: 5,
        studentDiscountPreferred: false,
        accessibilityNeeds: [],
        savedBusinessIds: ['b_fixhub'],
        savedOfferIds: [],
      },
    },
    {
      id: 'u_sam',
      name: 'Sam Rivera',
      email: 'sam@sharplinebarbers.ca',
      role: 'businessOwner',
      homeLocationId: 'loc_school',
      verified: true,
      createdAt: isoFrom(now, { days: -240 }),
      preferences: {
        preferredCategories: [],
        maxDefaultDistanceKm: 5,
        studentDiscountPreferred: false,
        accessibilityNeeds: [],
        savedBusinessIds: [],
        savedOfferIds: [],
      },
    },
    {
      id: 'u_nina',
      name: 'Nina Brooks',
      email: 'nina@caffeinetheory.ca',
      role: 'businessOwner',
      homeLocationId: 'loc_downtown',
      verified: true,
      createdAt: isoFrom(now, { days: -260 }),
      preferences: {
        preferredCategories: [],
        maxDefaultDistanceKm: 5,
        studentDiscountPreferred: false,
        accessibilityNeeds: [],
        savedBusinessIds: [],
        savedOfferIds: [],
      },
    },
    {
      id: 'u_admin',
      name: 'Demo Admin',
      email: 'admin@ping.demo',
      role: 'admin',
      homeLocationId: 'loc_school',
      verified: true,
      createdAt: isoFrom(now, { days: -300 }),
      preferences: {
        preferredCategories: [],
        maxDefaultDistanceKm: 10,
        studentDiscountPreferred: false,
        accessibilityNeeds: [],
        savedBusinessIds: [],
        savedOfferIds: [],
      },
    },
  ]
}
