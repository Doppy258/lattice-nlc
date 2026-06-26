/**
 * A "Lattice Pass" — a two-sided verified redemption. A customer claiming an
 * offer creates a `pending` pass (carrying a one-time QR token + 6-digit backup
 * code) that is only marked `redeemed` once the business approves it at the
 * counter. The model keeps the `Claim` name/table for continuity.
 */
export type ClaimStatus = "pending" | "redeemed" | "expired" | "cancelled";

export type Claim = {
  id: string;
  userId: string;
  offerId: string;
  businessId: string;
  /**
   * The 6-digit backup code shown to the customer and typed by the business.
   * (Historically a `PING-####` code; now mirrors `backupCode`.)
   */
  claimCode: string;
  /** Opaque one-time token encoded in the pass QR code. */
  token: string;
  /** Human-typeable 6-digit redemption code (matches `claimCode`). */
  backupCode: string;
  status: ClaimStatus;
  createdAt: string;
  /** When the pass window closes (createdAt + offer.redemptionWindowMinutes). */
  expiresAt: string;
  redeemedAt?: string;
  /** The business-owner user id who approved the redemption. */
  approvedByBusinessUserId?: string;
};
