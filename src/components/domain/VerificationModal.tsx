import { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { FormField } from "@/components/common/FormField";
import { Input } from "@/components/ui/input";
import { VERIFICATION_CODE, VERIFICATION_MAX_ATTEMPTS } from "@/utils/constants";

/**
 * Mock human-verification step (PRD §10.3) shown before matching. The user must
 * agree to the terms and type the demo code, with a capped number of attempts.
 */
export function VerificationModal({
  open,
  onOpenChange,
  onVerified,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
}) {
  const [agreed, setAgreed] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const locked = attempts >= VERIFICATION_MAX_ATTEMPTS;

  function reset() {
    setAgreed(false);
    setCode("");
    setError(null);
    setAttempts(0);
  }

  function close() {
    reset();
    onOpenChange(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (locked) return;
    if (!agreed) {
      setError("Please confirm you'll only claim offers you intend to use.");
      return;
    }
    if (code.trim() !== VERIFICATION_CODE) {
      const next = attempts + 1;
      setAttempts(next);
      const left = VERIFICATION_MAX_ATTEMPTS - next;
      setError(
        left <= 0
          ? "Too many attempts. Close this and try again."
          : `That code isn't right. ${left} attempt${left === 1 ? "" : "s"} left.`,
      );
      return;
    }
    onVerified();
    reset();
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={(o) => (o ? onOpenChange(o) : close())}
      title="Quick verification"
      description="A quick human check keeps offers fair before we match your Lattice."
    >
      <form onSubmit={submit} className="space-y-4">
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-card p-3.5">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 size-[18px] shrink-0 cursor-pointer rounded accent-[var(--primary)]"
          />
          <span className="text-sm leading-relaxed text-foreground">
            I agree to only claim offers I intend to use.
          </span>
        </label>

        <FormField
          label="Verification code"
          htmlFor="verification-code"
          error={error ?? undefined}
          hint={
            <>
              Type <span className="mono font-semibold text-foreground">{VERIFICATION_CODE}</span> to
              confirm you're human.
            </>
          }
        >
          <Input
            id="verification-code"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            value={code}
            disabled={locked}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="••••"
            className="mono text-center text-lg tracking-[0.5em]"
            aria-invalid={!!error}
          />
        </FormField>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" variant="brand" disabled={locked}>
            Verify &amp; match
          </Button>
        </div>
      </form>
    </Modal>
  );
}
