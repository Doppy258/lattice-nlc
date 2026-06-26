import type { Claim } from "../models";
import { MS_PER_DAY } from "../utils/dateTime";

type ClaimSpec = {
  id: string;
  userId: string;
  offerId: string;
  businessId: string;
  code: string;
  /** Offset (days from now) for createdAt. */
  createdDaysAgo: number;
  status: "pending" | "redeemed" | "expired";
};

// 5 pending, 5 redeemed, 3 expired (section 17).
const SPECS: ClaimSpec[] = [
  { id: "claim_a1", userId: "user_lucas", offerId: "offer_freshbowl_bowl", businessId: "biz_freshbowl", code: "842100", createdDaysAgo: 0, status: "pending" },
  { id: "claim_a2", userId: "user_lucas", offerId: "offer_harbour_latte", businessId: "biz_harbourroast", code: "319000", createdDaysAgo: 1, status: "pending" },
  { id: "claim_a3", userId: "user_maya", offerId: "offer_rosas_taco", businessId: "biz_rosas", code: "556700", createdDaysAgo: 0, status: "pending" },
  { id: "claim_a4", userId: "user_maya", offerId: "offer_sharp_student", businessId: "biz_sharpfade", code: "704200", createdDaysAgo: 2, status: "pending" },
  { id: "claim_a5", userId: "user_ethan", offerId: "offer_pulse_trial", businessId: "biz_pulse", code: "288500", createdDaysAgo: 1, status: "pending" },

  { id: "claim_r1", userId: "user_lucas", offerId: "offer_print_student", businessId: "biz_printpoint", code: "112000", createdDaysAgo: 8, status: "redeemed" },
  { id: "claim_r2", userId: "user_lucas", offerId: "offer_scholar_day", businessId: "biz_scholarspace", code: "663400", createdDaysAgo: 12, status: "redeemed" },
  { id: "claim_r3", userId: "user_maya", offerId: "offer_sugarpine_slice", businessId: "biz_sugarpine", code: "440800", createdDaysAgo: 15, status: "redeemed" },
  { id: "claim_r4", userId: "user_ethan", offerId: "offer_fixly_protector", businessId: "biz_fixly", code: "907100", createdDaysAgo: 20, status: "redeemed" },
  { id: "claim_r5", userId: "user_maya", offerId: "offer_escape_group", businessId: "biz_escapelab", code: "335700", createdDaysAgo: 26, status: "redeemed" },

  { id: "claim_e1", userId: "user_lucas", offerId: "offer_rosas_group", businessId: "biz_rosas", code: "551200", createdDaysAgo: 18, status: "expired" },
  { id: "claim_e2", userId: "user_ethan", offerId: "offer_cycle_tune", businessId: "biz_cyclewerks", code: "883000", createdDaysAgo: 22, status: "expired" },
  { id: "claim_e3", userId: "user_maya", offerId: "offer_pixel_night", businessId: "biz_pixelarcade", code: "204600", createdDaysAgo: 30, status: "expired" },
];

/** Builds seeded claims relative to `now` so statuses are time-consistent. */
export function buildSeedClaims(now: Date = new Date()): Claim[] {
  return SPECS.map((s) => {
    const createdAt = new Date(now.getTime() - s.createdDaysAgo * MS_PER_DAY);
    const base: Claim = {
      id: s.id,
      userId: s.userId,
      offerId: s.offerId,
      businessId: s.businessId,
      claimCode: s.code,
      token: `token_${s.id}`,
      backupCode: s.code,
      status: s.status,
      createdAt: createdAt.toISOString(),
      expiresAt: new Date(createdAt.getTime() + 2 * MS_PER_DAY).toISOString(),
    };
    if (s.status === "pending") {
      // Keep pending passes comfortably in the future.
      base.expiresAt = new Date(now.getTime() + 1.5 * MS_PER_DAY).toISOString();
    } else if (s.status === "redeemed") {
      base.redeemedAt = new Date(createdAt.getTime() + 6 * 60 * 60 * 1000).toISOString();
    }
    return base;
  });
}
