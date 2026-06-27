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

// 5 pending, 5 redeemed, 3 expired.
const SPECS: ClaimSpec[] = [
  { id: "claim_p1", userId: "user_lucas", offerId: "offer_mitierra_lunch", businessId: "biz_mitierra", code: "842100", createdDaysAgo: 0, status: "pending" },
  { id: "claim_p2", userId: "user_lucas", offerId: "offer_commonwealth_study", businessId: "biz_commonwealth", code: "319000", createdDaysAgo: 1, status: "pending" },
  { id: "claim_p3", userId: "user_maya", offerId: "offer_rosarios_lunch", businessId: "biz_rosarios", code: "556700", createdDaysAgo: 0, status: "pending" },
  { id: "claim_p4", userId: "user_maya", offerId: "offer_downtown_barber_student_cut", businessId: "biz_downtown_barber_shop", code: "704200", createdDaysAgo: 2, status: "pending" },
  { id: "claim_p5", userId: "user_ethan", offerId: "offer_golds_trial", businessId: "biz_goldscrossroads", code: "288500", createdDaysAgo: 1, status: "pending" },
  { id: "claim_r6", userId: "user_lucas", offerId: "offer_fedex_losoya_color", businessId: "biz_fedex_office_losoya", code: "112000", createdDaysAgo: 8, status: "redeemed" },
  { id: "claim_r7", userId: "user_lucas", offerId: "offer_central_library_study_room", businessId: "biz_central_library", code: "663400", createdDaysAgo: 12, status: "redeemed" },
  { id: "claim_r8", userId: "user_maya", offerId: "offer_bakerylorraine_macarons", businessId: "biz_bakerylorraine", code: "440800", createdDaysAgo: 15, status: "redeemed" },
  { id: "claim_r9", userId: "user_ethan", offerId: "offer_ubif_broadway_screen", businessId: "biz_ubreakifix_broadway", code: "907100", createdDaysAgo: 20, status: "redeemed" },
  { id: "claim_r10", userId: "user_maya", offerId: "offer_escapegame_student", businessId: "biz_escapegame", code: "335700", createdDaysAgo: 26, status: "redeemed" },
  { id: "claim_e11", userId: "user_lucas", offerId: "offer_smokeshack_group", businessId: "biz_smokeshack", code: "551200", createdDaysAgo: 18, status: "expired" },
  { id: "claim_e12", userId: "user_ethan", offerId: "offer_bikeworld_ah_tuneup", businessId: "biz_bikeworld_alamoheights", code: "883000", createdDaysAgo: 22, status: "expired" },
  { id: "claim_e13", userId: "user_maya", offerId: "offer_daveandbusters_powercard", businessId: "biz_daveandbusters", code: "204600", createdDaysAgo: 30, status: "expired" },
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
      base.expiresAt = new Date(now.getTime() + 1.5 * MS_PER_DAY).toISOString();
    } else if (s.status === "redeemed") {
      base.redeemedAt = new Date(createdAt.getTime() + 6 * 60 * 60 * 1000).toISOString();
    }
    return base;
  });
}
