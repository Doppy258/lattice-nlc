import { useState } from "react";
import { useApp } from "@/app/providers";
import { navigate } from "@/app/navigation";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { Icon } from "@/components/common/Icon";
import { EmptyState } from "@/components/common/EmptyState";
import { InsightSummary } from "@/components/common/InsightSummary";
import { PageHeader } from "@/components/common/PageHeader";
import { FormField } from "@/components/common/FormField";
import { Input } from "@/components/ui/input";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import { getBusinessClaims } from "@/services/claimService";
import {
  approveRedemption,
  findPass,
  validateBackupCode,
  validateForApproval,
} from "@/services/redemptionService";
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
  const { data, activeBusiness, activeUser, setData } = useApp();
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

  const codeValid = validateBackupCode(code);
  const businessClaims = getBusinessClaims(activeBusiness.id, data.claims);
  const awaiting = businessClaims.filter((c) => c.status === "pending");
  const redeemed = businessClaims.filter((c) => c.status === "redeemed");
  const recent = [...redeemed]
    .sort((a, b) => (b.redeemedAt ?? "").localeCompare(a.redeemedAt ?? ""))
    .slice(0, 6);

  function onChangeCode(value: string) {
    setCode(value.replace(/\D/g, "").slice(0, 6));
    if (error) setError(null);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pass = findPass(code, data.claims);
    const offer = pass ? data.offers.find((o) => o.id === pass.offerId) : undefined;
    const check = validateForApproval(pass, offer, activeBusiness!.id, data.claims);
    if (!check.ok || !pass) {
      const message = check.ok ? "No pass found for that code. Double-check the 6 digits." : check.error;
      setSuccess(null);
      setError(message);
      toast.error(message);
      return;
    }

    const redeemedPass = approveRedemption(pass, activeUser.id);
    setData((d) => ({
      ...d,
      claims: d.claims.map((c) => (c.id === redeemedPass.id ? redeemedPass : c)),
      offers: d.offers.map((o) =>
        o.id === redeemedPass.offerId ? { ...o, currentClaims: o.currentClaims + 1 } : o,
      ),
    }));
    const customer = getUserById(redeemedPass.userId, data.users);
    const savings =
      offer?.originalPrice != null ? offer.originalPrice - offer.price : null;
    setSuccess({
      offerTitle: offer?.title ?? "Offer",
      customerName: customer?.name ?? "Customer",
      savings,
      code: redeemedPass.backupCode,
    });
    setError(null);
    toast.success("Pass redeemed");
    setCode("");
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title="Redeem a"
        accent="pass code"
        subtitle="Enter a customer's 6-digit pass code to verify and redeem their claim at the counter."
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
                  label="Pass code"
                  htmlFor="claim-code"
                  error={error ?? undefined}
                  hint="Ask the customer for the 6-digit backup code on their pass, then verify it here."
                >
                  <Input
                    id="claim-code"
                    value={code}
                    onChange={(e) => onChangeCode(e.target.value)}
                    placeholder="123456"
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

        <InsightSummary
          title="Redemption queue"
          columns="one"
          className="self-start lg:sticky lg:top-24"
          items={[
            {
              label: "Awaiting",
              value: awaiting.length,
              detail: "Active claims for this storefront",
            },
            {
              label: "Redeemed",
              value: redeemed.length,
              detail: "Codes cashed in to date",
            },
          ]}
        />
      </div>

      {recent.length === 0 ? (
        <Card variant="solid" className="px-2">
          <EmptyState
            icon="redeem"
            title="No redemptions yet"
            body="As customers redeem pass codes, each redemption will appear here with who claimed what."
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
    </div>
  );
}
