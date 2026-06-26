import { useEffect, useMemo, useState } from "react";
import { ScanLine } from "lucide-react";
import { useApp } from "@/app/providers";
import { useHashRoute, navigate } from "@/app/navigation";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Icon } from "@/components/common/Icon";
import { EmptyState } from "@/components/common/EmptyState";
import { InsightSummary } from "@/components/common/InsightSummary";
import { PageHeader } from "@/components/common/PageHeader";
import { FormField } from "@/components/common/FormField";
import { Input } from "@/components/ui/input";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { QrScanModal } from "@/components/domain/QrScanModal";
import { getBusinessClaims } from "@/services/claimService";
import { fetchClaimByCode, upsertClaim } from "@/services/dbService";
import {
  approveRedemption,
  findPass,
  getLivePendingForBusiness,
  validateBackupCode,
  validateForApproval,
} from "@/services/redemptionService";
import { getUserById } from "@/services/userService";
import { formatCurrency, initials, relativeTime } from "@/utils/formatting";
import { getOfferPricing, offerSavingsPerRedemption } from "@/utils/offerPricing";
import type { Claim, Offer } from "@/models";
import { toast } from "sonner";

type Candidate = { pass: Claim; offer: Offer | undefined; customerName: string };
type Success = { offerTitle: string; customerName: string; savings: number | null; code: string };

export function RedeemPage() {
  const { data, activeBusiness, activeUser, setData } = useApp();
  const { query } = useHashRoute();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [success, setSuccess] = useState<Success | null>(null);
  const [scanOpen, setScanOpen] = useState(false);

  const businessClaims = activeBusiness ? getBusinessClaims(activeBusiness.id, data.claims) : [];
  const livePending = useMemo(
    () => (activeBusiness ? getLivePendingForBusiness(activeBusiness.id, data.claims) : []),
    [activeBusiness, data.claims],
  );
  const redeemed = businessClaims.filter((c) => c.status === "redeemed");

  /** Look up a code/token and, if valid, stage it for approval. */
  async function verify(value: string) {
    if (!activeBusiness) return;
    // Try local state first, then fall back to Supabase (the customer may have
    // created the pass after this business loaded its data).
    let pass = findPass(value, data.claims);
    let claimsForCheck = data.claims;
    if (!pass) {
      const fetched = await fetchClaimByCode(value);
      if (fetched) {
        pass = fetched;
        claimsForCheck = data.claims.some((c) => c.id === fetched.id)
          ? data.claims
          : [...data.claims, fetched];
        setData((d) =>
          d.claims.some((c) => c.id === fetched.id) ? d : { ...d, claims: [...d.claims, fetched] },
        );
      }
    }
    const offer = pass ? data.offers.find((o) => o.id === pass!.offerId) : undefined;
    const check = validateForApproval(pass, offer, activeBusiness.id, claimsForCheck);
    if (!check.ok || !pass) {
      setCandidate(null);
      const message = check.ok ? "No pass found for that code." : check.error;
      setError(message);
      toast.error(message);
      return;
    }
    setError(null);
    setSuccess(null);
    setCandidate({ pass, offer, customerName: getUserById(pass.userId, data.users)?.name ?? "Customer" });
  }

  // Auto-verify a token arriving via a scanned QR deep-link (#/redeem?token=…).
  const tokenParam = query.get("token");
  useEffect(() => {
    if (tokenParam) verify(tokenParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenParam]);

  if (!activeBusiness) {
    return (
      <EmptyState
        icon="store"
        title="No business selected"
        body="Sign in with a business account to verify and approve customer passes at your counter."
        action={
          <Button variant="brand" iconLeft={<Icon name="explore" size={17} />} onClick={() => navigate("/home")}>
            Back to Home
          </Button>
        }
      />
    );
  }

  function onChangeCode(value: string) {
    setCode(value.replace(/\D/g, "").slice(0, 6));
    if (error) setError(null);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    verify(code);
  }

  function onScanResult(value: string) {
    const isCode = /^\d{6}$/.test(value);
    if (isCode) setCode(value);
    verify(value);
  }

  function approve() {
    if (!candidate || !activeBusiness) return;
    // Re-validate at approval time (window may have lapsed while previewing).
    const check = validateForApproval(candidate.pass, candidate.offer, activeBusiness.id, data.claims);
    if (!check.ok) {
      setCandidate(null);
      setError(check.error);
      toast.error(check.error);
      return;
    }
    const redeemedPass = approveRedemption(candidate.pass, activeUser.id);
    setData((d) => ({
      ...d,
      claims: d.claims.map((c) => (c.id === redeemedPass.id ? redeemedPass : c)),
      offers: d.offers.map((o) =>
        o.id === redeemedPass.offerId ? { ...o, currentClaims: o.currentClaims + 1 } : o,
      ),
    }));
    // Persist the redeemed status so the customer's pass updates on their device.
    void upsertClaim(redeemedPass);
    const offer = candidate.offer;
    const saved = offer ? offerSavingsPerRedemption(offer) : 0;
    const savings = saved > 0 ? saved : null;
    setSuccess({
      offerTitle: offer?.title ?? "Offer",
      customerName: candidate.customerName,
      savings,
      code: redeemedPass.backupCode,
    });
    setCandidate(null);
    setCode("");
    setError(null);
    toast.success("Redemption approved");
  }

  const codeValid = validateBackupCode(code);

  return (
    <div className="space-y-7">
      <PageHeader
        title="Redeem a"
        accent="Lattice Pass"
        subtitle="Enter the customer's 6-digit backup code (or scan their QR code), verify the pass, then approve the redemption."
      />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Reveal>
          <Card variant="glassBlue" className="p-6 sm:p-8">
            <div className="mx-auto max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-card/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary shadow-[var(--shadow-soft)]">
                <Icon name="redeem" size={13} /> Redemption console
              </div>
              <form onSubmit={onSubmit} className="mt-4 space-y-3">
                <FormField
                  label="Pass code"
                  htmlFor="claim-code"
                  error={error ?? undefined}
                  hint="Ask the customer for the 6-digit code on their Lattice Pass."
                >
                  <Input
                    id="claim-code"
                    value={code}
                    onChange={(e) => onChangeCode(e.target.value)}
                    placeholder="123456"
                    inputMode="numeric"
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={6}
                    aria-invalid={!!error}
                    className="mono h-14 text-center text-2xl font-semibold tracking-[0.3em] text-[var(--primary-strong)]"
                  />
                </FormField>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    type="submit"
                    variant="brand"
                    size="lg"
                    block
                    disabled={!codeValid}
                    iconLeft={<Icon name="check" size={18} />}
                  >
                    Verify pass
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    block
                    onClick={() => setScanOpen(true)}
                    iconLeft={<ScanLine size={18} />}
                  >
                    Scan QR code
                  </Button>
                </div>
              </form>

              {/* Confirmation card — verify before approving. */}
              {candidate && (
                <Reveal y={8} className="mt-5 rounded-[var(--tile-radius)] border border-[var(--tint-blue-border)] bg-card/80 p-5">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                    <Icon name="check" size={14} /> Pass verified — confirm to redeem
                  </div>
                  <div className="mt-3 space-y-1.5 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Customer</span>
                      <span className="font-semibold text-foreground">{candidate.customerName}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Offer</span>
                      <span className="font-semibold text-foreground">{candidate.offer?.title ?? "Offer"}</span>
                    </div>
                    {(() => {
                      const pricing = candidate.offer ? getOfferPricing(candidate.offer) : null;
                      return (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground">
                            {pricing?.kind === "fixedPrice" ? "Price" : "Discount"}
                          </span>
                          <span className="font-semibold text-foreground">
                            {pricing ? pricing.headline : "—"}
                            {pricing?.kind === "fixedPrice" && pricing.savings > 0 && (
                              <span className="ml-1.5 text-[13px] font-normal text-muted-foreground line-through">
                                {formatCurrency(pricing.originalPrice!)}
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })()}
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Pass expires</span>
                      <span className="font-medium text-foreground">{relativeTime(candidate.pass.expiresAt)}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="brand" className="min-w-0 flex-1" iconLeft={<Icon name="check" size={17} />} onClick={approve}>
                      Approve redemption
                    </Button>
                    <Button variant="ghost" className="shrink-0" onClick={() => setCandidate(null)}>
                      Cancel
                    </Button>
                  </div>
                </Reveal>
              )}

              {success && !candidate && (
                <Reveal y={8} className="mt-5 rounded-[var(--tile-radius)] bg-[var(--success-tint)] p-5 text-[var(--success)]">
                  <div className="flex items-start gap-3.5">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--success)] text-white shadow-[var(--shadow-soft)]">
                      <Icon name="check" size={22} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-semibold">Redeemed — {success.offerTitle}</div>
                      <p className="mt-1 text-[13px] font-medium">
                        for {success.customerName}
                        <span className="mono"> · {success.code}</span>
                      </p>
                      {success.savings != null && (
                        <p className="mt-1 text-[13px] font-medium">
                          Customer saved {formatCurrency(success.savings)} on this visit.
                        </p>
                      )}
                    </div>
                  </div>
                </Reveal>
              )}
            </div>
          </Card>
        </Reveal>

        <InsightSummary
          title="Redemption queue"
          columns="one"
          className="self-start lg:sticky lg:top-24"
          items={[
            { label: "Awaiting approval", value: livePending.length, detail: "Live passes for this storefront" },
            { label: "Redeemed", value: redeemed.length, detail: "Approved to date" },
          ]}
        />
      </div>

      {/* Live pending queue — watch passes arrive and verify with one tap. */}
      <Card variant="solid" className="p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold tracking-[-0.02em]">Pending passes</h2>
        {livePending.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No pending passes right now — they appear here the moment a customer claims one of your offers.
          </p>
        ) : (
          <Stagger className="mt-4 space-y-2.5">
            {livePending.map((c) => {
              const customer = getUserById(c.userId, data.users);
              const offer = data.offers.find((o) => o.id === c.offerId);
              return (
                <StaggerItem key={c.id}>
                  <div className="flex items-center gap-3 rounded-[var(--tile-radius)] border border-border bg-card px-4 py-3 shadow-[var(--shadow-soft)]">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-[13px] font-semibold text-[var(--primary-strong)]">
                      {initials(customer?.name ?? "Customer")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{customer?.name ?? "Customer"}</div>
                      <div className="truncate text-[13px] text-muted-foreground">{offer?.title ?? "Offer"}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[12px] text-muted-foreground">Expires {relativeTime(c.expiresAt)}</div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      iconLeft={<Icon name="check" size={15} />}
                      onClick={() => {
                        setCode(c.backupCode);
                        verify(c.backupCode);
                      }}
                    >
                      Verify
                    </Button>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        )}
      </Card>

      {redeemed.length > 0 && (
        <Card variant="solid" className="p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold tracking-[-0.02em]">Recent redemptions</h2>
          <Stagger className="mt-4 space-y-2.5">
            {[...redeemed]
              .sort((a, b) => (b.redeemedAt ?? "").localeCompare(a.redeemedAt ?? ""))
              .slice(0, 6)
              .map((c) => {
                const customer = getUserById(c.userId, data.users);
                const offer = data.offers.find((o) => o.id === c.offerId);
                return (
                  <StaggerItem key={c.id}>
                    <div className="flex items-center gap-3 rounded-[var(--tile-radius)] border border-border bg-card px-4 py-3 shadow-[var(--shadow-soft)]">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-[13px] font-semibold text-[var(--primary-strong)]">
                        {initials(customer?.name ?? "Customer")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{customer?.name ?? "Customer"}</div>
                        <div className="truncate text-[13px] text-muted-foreground">{offer?.title ?? "Offer"}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="mono text-[13px] font-semibold text-[var(--primary-strong)]">{c.backupCode}</div>
                        <div className="text-[12px] text-muted-foreground">
                          {c.redeemedAt ? relativeTime(c.redeemedAt) : "—"}
                        </div>
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
          </Stagger>
        </Card>
      )}

      <QrScanModal open={scanOpen} onClose={() => setScanOpen(false)} onResult={onScanResult} />
    </div>
  );
}
