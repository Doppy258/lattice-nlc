/**
 * LatticePass - customer-facing pass view: QR code, 6-digit backup code, and
 * a live countdown. Polls the claim row every 3s while pending so that
 * business-side approval flips the UI to "Redeemed successfully" in real time.
 * The offer is never redeemed until that approval happens.
 * Props: claim (Claim), offer (Offer), business (Business), className?
 * Role in architecture: Domain — the primary artefact of the claim flow,
 * displayed both inline (ClaimCodeCard) and inside a modal (ClaimResultModal).
 */
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import type { Business, Claim, Offer } from "@/models";
import { useApp } from "@/app/providers";
import { Icon } from "@/components/common/Icon";
import { PassCode } from "@/components/common/PassCode";
import { fetchClaimById } from "@/services/dbService";
import { cn } from "@/lib/utils";

/** Builds the URL encoded into the pass QR — opens the business redeem console pre-filled. */
function redemptionUrl(token: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";
  return `${origin}#/redeem?token=${encodeURIComponent(token)}`;
}

function mmss(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * The customer-facing "Lattice Pass": a QR code + 6-digit backup code + live
 * countdown. The pass starts `pending` ("waiting for business approval") and
 * flips to "Redeemed successfully" the moment the business approves it — picked
 * up by polling the row while the pass is open. The offer is never redeemed
 * until that approval happens.
 */
export function LatticePass({
  claim,
  offer,
  business,
  className,
}: {
  claim: Claim;
  offer: Offer;
  business: Business;
  className?: string;
}) {
  const { setData } = useApp();
  const [pass, setPass] = useState<Claim>(claim);
  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);

  // 1s countdown ticker.
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  // Poll the pass status while it's pending so approval shows up live.
  useEffect(() => {
    if (pass.status !== "pending") return;
    let cancelled = false;
    const t = window.setInterval(async () => {
      const fresh = await fetchClaimById(pass.id);
      if (cancelled || !fresh || fresh.status === pass.status) return;
      setPass(fresh);
      setData((d) => ({ ...d, claims: d.claims.map((c) => (c.id === fresh.id ? fresh : c)) }));
    }, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [pass.id, pass.status, setData]);

  const msLeft = Date.parse(pass.expiresAt) - now;
  const redeemed = pass.status === "redeemed";
  const expired = pass.status === "expired" || pass.status === "cancelled" || (!redeemed && msLeft <= 0);
  const live = !redeemed && !expired;

  async function copyCode() {
    try {
      await navigator.clipboard?.writeText(pass.backupCode);
    } catch {
      /* clipboard may be unavailable; the code is still on screen */
    }
    setCopied(true);
    toast.success("Backup code copied");
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--tile-radius)] border border-[var(--tint-blue-border)] bg-[var(--tint-blue)] p-5 text-center",
        className,
      )}
    >
      {/* Status banner */}
      {redeemed ? (
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--success)] px-3.5 py-1.5 text-[13px] font-semibold text-white shadow-[var(--shadow-soft)]">
          <Icon name="check" size={15} /> Redeemed successfully
        </div>
      ) : expired ? (
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-card/80 px-3.5 py-1.5 text-[13px] font-semibold text-muted-foreground shadow-[var(--shadow-soft)]">
          <Icon name="clock" size={15} /> Pass expired
        </div>
      ) : (
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-card/80 px-3.5 py-1.5 text-[13px] font-semibold text-[var(--primary-strong)] shadow-[var(--shadow-soft)]">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          Waiting for business approval
        </div>
      )}

      <div className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">{offer.title}</div>
      <div className="text-[13px] text-muted-foreground">{business.name}</div>

      {/* QR code */}
      <div className="relative mx-auto mt-4 w-fit">
        <div
          className={cn(
            "rounded-2xl bg-white p-3 shadow-[var(--shadow-soft)] transition-opacity",
            !live && "opacity-30",
          )}
        >
          <QRCodeSVG value={redemptionUrl(pass.token)} size={148} level="M" />
        </div>
        {redeemed && (
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-14 place-items-center rounded-full bg-[var(--success)] text-white shadow-[var(--shadow-card)]">
              <Icon name="check" size={28} />
            </span>
          </span>
        )}
      </div>

      {/* Backup code */}
      <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Backup code
      </div>
      <button
        type="button"
        onClick={copyCode}
        className="mx-auto mt-1.5 inline-flex cursor-pointer items-center gap-2.5 rounded-2xl bg-card/70 px-4 py-2.5 shadow-[var(--shadow-soft)] transition-transform active:scale-[0.98]"
        aria-label={`Copy backup code ${pass.backupCode}`}
      >
        <PassCode code={pass.backupCode} size="display" />
        <span className="text-muted-foreground">
          {copied ? <Check size={18} className="text-[var(--success)]" /> : <Copy size={18} />}
        </span>
      </button>

      {/* Countdown / footer — separated from the code so it reads as its own row */}
      <div className="mt-5 border-t border-[var(--tint-blue-border)] pt-4">
        <p className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
          {redeemed ? (
            <>Enjoy your offer at {business.name}.</>
          ) : expired ? (
            <>This pass timed out — claim the offer again to get a fresh pass.</>
          ) : (
            <>
              <Icon name="clock" size={13} /> Expires in{" "}
              <span className="mono font-semibold text-[var(--primary-strong)]">{mmss(msLeft)}</span>
            </>
          )}
        </p>
        {live && (
          <p className="mt-1 text-[12px] text-muted-foreground">
            Show the QR code or read out the backup code at {business.name} to redeem.
          </p>
        )}
      </div>
    </div>
  );
}
