/**
 * statusMeta — single source of truth for how claim and offer statuses are
 * presented (badge tone + human label). Keeping this in one place means the
 * same status reads identically on every screen (e.g. a `pending` claim is
 * always "Active", never raw lowercase "pending").
 */
import type { ClaimStatus } from "@/models";
import type { OfferStatus } from "@/services/offerService";
import type { BadgeTone } from "@/components/common/Badge";

export type StatusMeta = { tone: BadgeTone; label: string };

/** Customer-facing presentation for a claim's lifecycle status. */
export function claimStatusMeta(status: ClaimStatus): StatusMeta {
  switch (status) {
    case "pending":
      return { tone: "brand", label: "Active" };
    case "redeemed":
      return { tone: "success", label: "Redeemed" };
    case "expired":
      return { tone: "neutral", label: "Expired" };
    case "cancelled":
      return { tone: "neutral", label: "Cancelled" };
    default:
      // Defensive: any unexpected/legacy status renders as a quiet neutral badge
      // rather than throwing.
      return { tone: "neutral", label: String(status) };
  }
}

/** Business-facing presentation for an offer's classified status. */
export function offerStatusMeta(status: OfferStatus): StatusMeta {
  switch (status) {
    case "active":
      return { tone: "success", label: "Active" };
    case "paused":
      return { tone: "warning", label: "Paused" };
    case "expired":
      return { tone: "neutral", label: "Expired" };
    case "full":
      return { tone: "violet", label: "Full" };
    default:
      return { tone: "neutral", label: String(status) };
  }
}
