import { useState } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VERIFICATION_CODE, VERIFICATION_MAX_ATTEMPTS } from "../../utils/constants";

type Props = {
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
};

/**
 * Mock human-verification gate. The user must agree to the terms and enter the
 * demo code (2468) within a limited number of attempts.
 */
export function VerificationModal({ open, onClose, onVerified }: Props) {
  const [agreed, setAgreed] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);

  const lockedOut = attempts >= VERIFICATION_MAX_ATTEMPTS;

  const reset = () => {
    setAgreed(false);
    setCode("");
    setError("");
    setAttempts(0);
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = () => {
    if (!agreed) {
      setError("Please confirm you'll only claim offers you intend to use.");
      return;
    }
    if (code.trim() !== VERIFICATION_CODE) {
      const used = attempts + 1;
      setAttempts(used);
      const left = VERIFICATION_MAX_ATTEMPTS - used;
      setError(
        left > 0
          ? `That code didn't match. Enter ${VERIFICATION_CODE}. ${left} attempt${left === 1 ? "" : "s"} left.`
          : "Too many attempts. Close this and try again.",
      );
      return;
    }
    reset();
    onVerified();
  };

  return (
    <Modal
      open={open}
      title="Quick verification"
      onClose={close}
      footer={
        <Button block onClick={submit} disabled={lockedOut}>
          Verify & find offers
        </Button>
      }
    >
      <p className="text-[15px] leading-relaxed text-muted-foreground">
        A quick check keeps offers fair for local businesses.
      </p>

      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-card p-3.5 transition-colors hover:bg-muted">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 size-4 accent-[var(--primary)]"
        />
        <span className="text-sm text-foreground">
          I agree to only claim offers I intend to use.
        </span>
      </label>

      <div className="mt-4 flex flex-col gap-2">
        <Label htmlFor="verify-code">
          Enter verification code
          <span className="mono rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {VERIFICATION_CODE}
          </span>
        </Label>
        <Input
          id="verify-code"
          type="text"
          inputMode="numeric"
          value={code}
          placeholder="••••"
          maxLength={4}
          disabled={lockedOut}
          aria-invalid={!!error}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          aria-label="Verification code"
        />
      </div>

      {error && (
        <p className="mt-2 text-sm font-medium text-destructive">{error}</p>
      )}
    </Modal>
  );
}
