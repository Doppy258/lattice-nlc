export type ClaimStatus = "active" | "redeemed" | "expired" | "cancelled";

export type Claim = {
  id: string;
  userId: string;
  offerId: string;
  businessId: string;
  /** Format: PING-#### (see claimService.generateClaimCode). */
  claimCode: string;
  status: ClaimStatus;
  createdAt: string;
  expiresAt: string;
  redeemedAt?: string;
};
