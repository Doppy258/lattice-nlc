import { useState } from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { FormError } from "../common/FormError";
import { VERIFICATION_CODE, VERIFICATION_MAX_ATTEMPTS } from "../../utils/constants";

type Props = {
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
};

/**
 * Section 10.3 mock human-verification gate. The user must agree to the terms
 * and enter the demo code (2468) within a limited number of attempts. This
 * satisfies the prompt's bot-prevention requirement without any live service.
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
          : "Too many attempts. Close this and try again."
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
      <p className="verify__lead">
        A quick check keeps offers fair for local businesses.
      </p>

      <label className="verify__check">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
        />
        <span>I agree to only claim offers I intend to use.</span>
      </label>

      <label className="field verify__code">
        <span className="field__label">
          Enter verification code <span className="mono verify__hint">{VERIFICATION_CODE}</span>
        </span>
        <input
          type="text"
          inputMode="numeric"
          className="text-input"
          value={code}
          placeholder="••••"
          maxLength={4}
          disabled={lockedOut}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          aria-label="Verification code"
        />
      </label>

      <FormError message={error} />
    </Modal>
  );
}
