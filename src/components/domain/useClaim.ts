import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "@/app/providers";
import { createRedemptionPass } from "@/services/redemptionService";
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
    const res = createRedemptionPass(activeUser.id, offer, data.claims);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    const claim = res.pass;
    const business = data.businesses.find((b) => b.id === offer.businessId);
    setData((prev) => ({
      ...prev,
      claims: [...prev.claims, claim],
      requests: requestId
        ? prev.requests.map((r) => (r.id === requestId ? { ...r, status: "matched" } : r))
        : prev.requests,
    }));
    if (business) setResult({ claim, offer, business });
    toast.success("Pass created", { description: `Your backup code is ${claim.backupCode}` });
  }

  return { claim, result, clearResult: () => setResult(null) };
}
