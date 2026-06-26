import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "@/app/providers";
import { createRedemptionPass } from "@/services/redemptionService";
import { upsertClaim } from "@/services/dbService";
import type { Business, Claim, Offer } from "@/models";

export type ClaimResult = { claim: Claim; offer: Offer; business: Business };

type PendingClaim = { offer: Offer; requestId?: string };

/**
 * useClaim — shared claim orchestration used across screens (Home, Matches,
 * Saved, Business profile). Two-phase flow:
 * 1. `claim()` stages the request and opens a bot-check modal.
 * 2. `confirmClaim()` mints the Lattice Pass, persists via upsertClaim,
 *    appends to local state, increments the offer's claim count, and
 *    (if claiming from a request) marks that request as matched.
 * `cancelClaim()` aborts a staged claim. `result` exposes the minted pass
 * so callers can show a success sheet.
 */
export function useClaim() {
  const { data, setData, activeUser } = useApp();
  const [result, setResult] = useState<ClaimResult | null>(null);
  const [pendingClaim, setPendingClaim] = useState<PendingClaim | null>(null);

  /** Stage a claim and open the bot-check; the pass is only minted after verification. */
  function claim(offer: Offer, requestId?: string) {
    setPendingClaim({ offer, requestId });
  }

  /** Cancel a staged claim (user dismissed the human check). */
  function cancelClaim() {
    setPendingClaim(null);
  }

  /** Run the real claim after the human check passes. */
  function confirmClaim() {
    if (!pendingClaim) return;
    const { offer, requestId } = pendingClaim;
    setPendingClaim(null);

    const res = createRedemptionPass(activeUser.id, offer, data.claims);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    const pass = res.pass;
    const business = data.businesses.find((b) => b.id === offer.businessId);
    setData((prev) => ({
      ...prev,
      claims: [...prev.claims, pass],
      offers: prev.offers.map((o) =>
        o.id === offer.id ? { ...o, currentClaims: o.currentClaims + 1 } : o,
      ),
      requests: requestId
        ? prev.requests.map((r) => (r.id === requestId ? { ...r, status: "matched" } : r))
        : prev.requests,
    }));
    // Persist to the shared backend so the business can scan/approve it from any
    // device or browser (the redeem console looks passes up via Supabase).
    void upsertClaim(pass);
    if (business) setResult({ claim: pass, offer, business });
    toast.success("Lattice Pass created", { description: `Backup code ${pass.backupCode}` });
  }

  return {
    claim,
    pendingClaim,
    confirmClaim,
    cancelClaim,
    result,
    clearResult: () => setResult(null),
  };
}
