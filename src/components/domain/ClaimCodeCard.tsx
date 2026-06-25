import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import type { Business, Claim, Offer } from "@/models";
import { Icon } from "@/components/common/Icon";
import { relativeTime } from "@/utils/formatting";
import { cn } from "@/lib/utils";

/** Confirmation card showing a generated PING-#### claim code + how to redeem it. */
export function ClaimCodeCard({
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
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard?.writeText(claim.claimCode);
    } catch {
      /* clipboard may be unavailable; the code is still visible on screen */
    }
    setCopied(true);
    toast.success("Claim code copied");
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div
      className={cn(
        "beam-host overflow-hidden rounded-[var(--tile-radius)] border border-[var(--tint-blue-border)] bg-[var(--tint-blue)] p-5 text-center",
        className,
      )}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        Your claim code
      </div>
      <button
        type="button"
        onClick={copy}
        className="mx-auto mt-2.5 inline-flex cursor-pointer items-center gap-2.5 rounded-2xl bg-card/70 px-4 py-2.5 shadow-[var(--shadow-soft)] transition-transform active:scale-[0.98]"
        aria-label={`Copy claim code ${claim.claimCode}`}
      >
        <span className="mono text-3xl font-semibold tracking-[0.12em] text-[var(--primary-strong)]">
          {claim.claimCode}
        </span>
        <span className="text-muted-foreground">
          {copied ? <Check size={18} className="text-[var(--success)]" /> : <Copy size={18} />}
        </span>
      </button>
      <p className="mx-auto mt-3.5 max-w-xs text-sm leading-relaxed text-foreground">
        Show this code at <span className="font-semibold">{business.name}</span> to redeem{" "}
        <span className="font-semibold">{offer.title}</span>.
      </p>
      <p className="mt-1.5 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
        <Icon name="clock" size={13} /> Expires {relativeTime(claim.expiresAt)}
      </p>
    </div>
  );
}
