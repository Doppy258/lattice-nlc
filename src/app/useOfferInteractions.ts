import { useState } from "react";
import type { Business, Claim, Offer } from "../models";
import { useApp } from "./providers";
import { createClaim } from "../services/claimService";
import { toggleSavedBusiness, toggleSavedOffer } from "../services/userService";

/** Result surfaced to the claim-confirmation modal after a claim attempt. */
export type ClaimOutcome =
  | { ok: true; claim: Claim; offer: Offer; business: Business }
  | { ok: false; error: string };

export type OfferClaimState = "claimable" | "claimed" | "full" | "expired";

/**
 * Centralizes the user-side offer actions (save/bookmark + claim) so the
 * Matches, Explore, and Business Profile screens share one implementation and
 * keep all persistence flowing through the services. Returns the latest claim
 * outcome for rendering a shared confirmation modal.
 */
export function useOfferInteractions() {
  const { data, setData, activeUser } = useApp();
  const [claimOutcome, setClaimOutcome] = useState<ClaimOutcome | null>(null);

  const isOfferSaved = (offerId: string): boolean =>
    activeUser.preferences.savedOfferIds.includes(offerId);

  const isBusinessSaved = (businessId: string): boolean =>
    activeUser.preferences.savedBusinessIds.includes(businessId);

  const toggleSaveOffer = (offerId: string): void =>
    setData((prev) => toggleSavedOffer(prev, activeUser.id, offerId));

  const toggleSaveBusiness = (businessId: string): void =>
    setData((prev) => toggleSavedBusiness(prev, activeUser.id, businessId));

  /** Returns whether the active user can still claim `offer`, and why not. */
  const claimStateFor = (offer: Offer): OfferClaimState => {
    const mine = data.claims.filter(
      (c) => c.userId === activeUser.id && c.offerId === offer.id
    );
    if (mine.some((c) => c.status === "active" || c.status === "redeemed")) {
      return "claimed";
    }
    if (!offer.active || Date.parse(offer.validUntil) < Date.now()) return "expired";
    if (offer.currentClaims >= offer.maxClaims) return "full";
    return "claimable";
  };

  const claim = (offer: Offer): void => {
    const business = data.businesses.find((b) => b.id === offer.businessId);
    const result = createClaim(activeUser.id, offer, data.claims);
    if (!result.ok) {
      setClaimOutcome({ ok: false, error: result.error });
      return;
    }
    setData((prev) => ({
      ...prev,
      claims: [...prev.claims, result.claim],
      offers: prev.offers.map((o) =>
        o.id === offer.id ? { ...o, currentClaims: o.currentClaims + 1 } : o
      ),
    }));
    setClaimOutcome({ ok: true, claim: result.claim, offer, business: business! });
  };

  const dismissClaim = (): void => setClaimOutcome(null);

  return {
    activeUser,
    isOfferSaved,
    isBusinessSaved,
    toggleSaveOffer,
    toggleSaveBusiness,
    claimStateFor,
    claim,
    claimOutcome,
    dismissClaim,
  };
}
