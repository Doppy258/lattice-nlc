import { useState } from "react";
import { useApp } from "@/app/providers";
import { navigate } from "@/app/navigation";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Icon } from "@/components/common/Icon";
import { EmptyState } from "@/components/common/EmptyState";
import { StatTile } from "@/components/common/StatTile";
import { PageHeader } from "@/components/common/PageHeader";
import { FormField } from "@/components/common/FormField";
import { Input } from "@/components/ui/input";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import {
  getBusinessClaims,
  redeemClaim,
  validateClaimCode,
} from "@/services/claimService";
import { getUserById } from "@/services/userService";
import { formatCurrency, initials, relativeTime } from "@/utils/formatting";
import { toast } from "sonner";

type Redemption = {
  offerTitle: string;
  customerName: string;
  savings: number | null;
  code: string;
};

export function RedeemPage() {
  const { data, activeBusiness, setData } = useApp();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Redemption | null>(null);

  if (!activeBusiness) {
    return (
      <EmptyState
        icon="store"
        title="No business selected"
        body="Switch to a business-owner account (Sam or Nina) from the account menu in the top bar to manage a storefront."
        action={
          <Button variant="brand" iconLeft={<Icon name="explore" size={17} />} onClick={() => navigate("/home")}>
            Back to Home
          </Button>
        }
      />
    );
  }

  const codeValid = validateClaimCode(code);
  const businessClaims = getBusinessClaims(activeBusiness.id, data.claims);
  const awaiting = businessClaims.filter((c) => c.status === "active");
  const redeemed = businessClaims.filter((c) => c.status === "redeemed");
  const recent = [...redeemed]
    .sort((a, b) => (b.redeemedAt ?? "").localeCompare(a.redeemedAt ?? ""))
    .slice(0, 6);

  function onChangeCode(value: string) {
    setCode(value.toUpperCase().replace(/[^A-Z0-9-]/g, ""));
    if (error) setError(null);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = redeemClaim(code, activeBusiness!.id, data.claims);
    if (res.ok) {
      setData((d) => ({
        ...d,
        claims: d.claims.map((c) => (c.id === res.claim.id ? res.claim : c)),
      }));
      const offer = data.offers.find((o) => o.id === res.claim.offerId);
      const customer = getUserById(res.claim.userId, data.users);
      const savings =
        offer?.originalPrice != null ? offer.originalPrice - offer.price : null;
      setSuccess({
        offerTitle: offer?.title ?? "Offer",
        customerName: customer?.name ?? "Customer",
        savings,
        code: res.claim.claimCode,
      });
      setError(null);
      toast.success("Claim redeemed");
      setCode("");
    } else {
      setSuccess(null);
      setError(res.error);
      toast.error(res.error);
    }
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title="Redeem a"
        accent="claim code"
        subtitle="Enter a customer's PING code to verify and redeem their claim at the counter — instantly, no scanner required."
      />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Reveal>
          <Card variant="glassBlue" className="p-6 sm:p-8">
            <div className="mx-auto max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-card/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary shadow-[var(--shadow-soft)]">
                <Icon name="redeem" size={13} /> Redemption console
              </div>
              <form onSubmit={onSubmit} className="mt-4 space-y-4">
                <FormField
                  label="Claim code"
                  htmlFor="claim-code"
                  error={error ?? undefined}
                  hint="Ask the customer for the PING code on their claim, then verify it here."
                >
                  <Input
                    id="claim-code"
                    value={code}
                    onChange={(e) => onChangeCode(e.target.value)}
                    placeholder="PING-1234"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    maxLength={9}
                    aria-invalid={!!error}
                    className="mono h-14 text-center text-2xl font-semibold tracking-[0.18em] text-[var(--primary-strong)]"
                  />
                </FormField>
                <Button
                  type="submit"
                  variant="brand"
                  size="lg"
                  block
                  disabled={!codeValid}
                  iconLeft={<Icon name="check" size={18} />}
                >
                  Redeem claim
                </Button>
              </form>

              {success && (
                <Reveal
                  y={8}
                  className="mt-5 rounded-[var(--tile-radius)] bg-[var(--success-tint)] p-5 text-[var(--success)]"
                >
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

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
          <StatTile
            tone="blue"
            label="Awaiting redemption"
            value={awaiting.length}
            icon={<Icon name="ticket" size={17} />}
            sub="Active claims for this storefront"
          />
          <StatTile
            tone="mint"
            label="Redeemed all-time"
            value={redeemed.length}
            icon={<Icon name="check" size={17} />}
            sub="Codes cashed in to date"
          />
        </div>
      </div>

      {recent.length === 0 ? (
        <Card variant="solid" className="px-2">
          <EmptyState
            icon="redeem"
            title="No redemptions yet"
            body="As customers cash in their PING codes, each redemption will appear here with who claimed what."
          />
        </Card>
      ) : (
        <Card variant="solid" className="p-5 sm:p-6">
          <h2 className="font-display text-lg font-semibold tracking-[-0.02em]">Recent redemptions</h2>
          <Stagger className="mt-4 space-y-2.5">
            {recent.map((c) => {
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
                      <div className="mono text-[13px] font-semibold text-[var(--primary-strong)]">{c.claimCode}</div>
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
    </div>
  );
}
