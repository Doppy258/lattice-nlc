import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "@/app/providers";
import { createClaim } from "@/services/claimService";
import type { Business, Claim, Offer } from "@/models";

export type ClaimResult = { claim: Claim; offer: Offer; business: Business };

/**
 * Shared offer-claim orchestration used by Home and Matches. Runs the service,
 * then in one update appends the claim, increments the offer's claim count, and
 * (when claiming from a request) marks that request matched.
 */
export function useClaim() {
  const { activeUser, data, setData } = useApp();
  const [result, setResult] = useState<ClaimResult | null>(null);

  function claim(offer: Offer, requestId?: string) {
    const res = createClaim(activeUser.id, offer, data.claims);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    const claim = res.claim;
    const business = data.businesses.find((b) => b.id === offer.businessId);
    setData((prev) => ({
      ...prev,
      claims: [...prev.claims, claim],
      offers: prev.offers.map((o) =>
        o.id === offer.id ? { ...o, currentClaims: o.currentClaims + 1 } : o,
      ),
      requests: requestId
        ? prev.requests.map((r) => (r.id === requestId ? { ...r, status: "matched" } : r))
        : prev.requests,
    }));
    if (business) setResult({ claim, offer, business });
    toast.success("Offer claimed!", { description: `Your code is ${claim.claimCode}` });
  }

  return { claim, result, clearResult: () => setResult(null) };
}
