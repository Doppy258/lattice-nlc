import type { Claim, ClaimStatus } from '@/models'
import { isoFrom } from '@/utils/dateTime'

/** Day offsets are relative to "now"; fractions are allowed (0.25 = 6 hours). */
type ClaimSpec = {
  id: string
  userId: string
  offerId: string
  businessId: string
  code: string
  status: ClaimStatus
  createdDays: number
  expiresDays: number
  redeemedDays?: number
}

const SPECS: ClaimSpec[] = [
  /* ── Active (5) ───────────────────────────────────────────────────── */
  // The PRD's worked example: PING-8421 at FreshBowl Cafe.
  { id: 'claim_freshbowl', userId: 'u_lucas', offerId: 'o_freshbowl_lunch', businessId: 'b_freshbowl', code: 'PING-8421', status: 'active', createdDays: -0.4, expiresDays: 0.25 },
  { id: 'claim_caffeine', userId: 'u_lucas', offerId: 'o_caffeine_latte', businessId: 'b_caffeine', code: 'PING-3092', status: 'active', createdDays: -1, expiresDays: 2 },
  { id: 'claim_sharp', userId: 'u_lucas', offerId: 'o_sharp_studentcut', businessId: 'b_sharpline', code: 'PING-5567', status: 'active', createdDays: -2, expiresDays: 5 },
  { id: 'claim_pulse', userId: 'u_maya', offerId: 'o_pulse_trial', businessId: 'b_pulsegym', code: 'PING-7741', status: 'active', createdDays: -1, expiresDays: 6 },
  { id: 'claim_riddle', userId: 'u_ethan', offerId: 'o_riddle_group', businessId: 'b_riddleroom', code: 'PING-2210', status: 'active', createdDays: -3, expiresDays: 4 },

  /* ── Redeemed (5) ─────────────────────────────────────────────────── */
  // Intentionally has NO review yet — used to demo "leave a verified review".
  { id: 'claim_bright', userId: 'u_lucas', offerId: 'o_bright_intro', businessId: 'b_brightpath', code: 'PING-1180', status: 'redeemed', createdDays: -12, expiresDays: -5, redeemedDays: -10 },
  { id: 'claim_bowlco', userId: 'u_lucas', offerId: 'o_bowlco_build', businessId: 'b_bowlco', code: 'PING-9032', status: 'redeemed', createdDays: -22, expiresDays: -18, redeemedDays: -20 },
  { id: 'claim_page', userId: 'u_lucas', offerId: 'o_page_blinddate', businessId: 'b_pageturner', code: 'PING-4419', status: 'redeemed', createdDays: -37, expiresDays: -33, redeemedDays: -35 },
  { id: 'claim_quick', userId: 'u_maya', offerId: 'o_quick_studentprint', businessId: 'b_quickprint', code: 'PING-6654', status: 'redeemed', createdDays: -16, expiresDays: -13, redeemedDays: -15 },
  { id: 'claim_fix', userId: 'u_ethan', offerId: 'o_fix_protector', businessId: 'b_fixhub', code: 'PING-8890', status: 'redeemed', createdDays: -26, expiresDays: -23, redeemedDays: -25 },

  /* ── Expired (3) ──────────────────────────────────────────────────── */
  { id: 'claim_maple', userId: 'u_lucas', offerId: 'o_maple_lunchplate', businessId: 'b_maplemain', code: 'PING-7003', status: 'expired', createdDays: -7, expiresDays: -5 },
  { id: 'claim_sugar', userId: 'u_lucas', offerId: 'o_sugar_sundae', businessId: 'b_sugarlab', code: 'PING-1247', status: 'expired', createdDays: -9, expiresDays: -8 },
  { id: 'claim_lumiere', userId: 'u_maya', offerId: 'o_lumiere_studenttrim', businessId: 'b_lumiere', code: 'PING-5521', status: 'expired', createdDays: -13, expiresDays: -12 },
]

export function buildSeedClaims(now: Date): Claim[] {
  return SPECS.map((s) => ({
    id: s.id,
    userId: s.userId,
    offerId: s.offerId,
    businessId: s.businessId,
    claimCode: s.code,
    status: s.status,
    createdAt: isoFrom(now, { days: s.createdDays }),
    expiresAt: isoFrom(now, { days: s.expiresDays }),
    redeemedAt: s.redeemedDays !== undefined ? isoFrom(now, { days: s.redeemedDays }) : undefined,
  }))
}
