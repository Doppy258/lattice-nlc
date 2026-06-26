import { useEffect, useState } from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { Icon } from "@/components/common/Icon";
import { FormField } from "@/components/common/FormField";
import { Input } from "@/components/ui/input";
import { VERIFICATION_MAX_ATTEMPTS } from "@/utils/constants";

/** Unambiguous character set for the challenge (no O/0, I/1, etc.). */
const CHALLENGE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Generates a fresh random challenge code. */
function newChallenge(length = 5): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CHALLENGE_CHARS[Math.floor(Math.random() * CHALLENGE_CHARS.length)];
  }
  return out;
}

/**
 * Self-contained, offline bot-prevention check. Unlike a network reCAPTCHA, this
 * always works in the demo: the user must tick "I'm not a robot" and re-type a
 * randomized, distorted code. Used to gate offer claims (and as a signup fallback)
 * so bots can't mass-claim limited offers or spam new accounts.
 */
export function BotCheckModal({
  open,
  onOpenChange,
  onVerified,
  title = "Quick human check",
  description = "Confirm you're human to continue.",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
  title?: string;
  description?: string;
}) {
  const [challenge, setChallenge] = useState(() => newChallenge());
  const [agreed, setAgreed] = useState(false);
  const [entry, setEntry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const locked = attempts >= VERIFICATION_MAX_ATTEMPTS;

  // Issue a fresh challenge each time the modal opens.
  useEffect(() => {
    if (open) {
      setChallenge(newChallenge());
      setAgreed(false);
      setEntry("");
      setError(null);
      setAttempts(0);
    }
  }, [open]);

  function refresh() {
    setChallenge(newChallenge());
    setEntry("");
    setError(null);
  }

  function close() {
    onOpenChange(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (locked) return;
    if (!agreed) {
      setError("Please confirm you're not a robot.");
      return;
    }
    if (entry.trim().toUpperCase() !== challenge) {
      const next = attempts + 1;
      setAttempts(next);
      const left = VERIFICATION_MAX_ATTEMPTS - next;
      setError(
        left <= 0
          ? "Too many attempts. Close this and try again."
          : `That code doesn't match. ${left} attempt${left === 1 ? "" : "s"} left.`,
      );
      refresh();
      return;
    }
    onVerified();
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={(o) => (o ? onOpenChange(o) : close())}
      title={title}
      description={description}
    >
      <form onSubmit={submit} className="space-y-4">
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-card p-3.5">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 size-[18px] shrink-0 cursor-pointer rounded accent-[var(--primary)]"
          />
          <span className="flex items-center gap-2 text-sm leading-relaxed text-foreground">
            <Icon name="shield" size={16} className="text-primary" />
            I'm not a robot.
          </span>
        </label>

        {/* Distorted CAPTCHA-style code (not plain selectable text). */}
        <div className="flex items-center gap-3">
          <div
            aria-hidden
            className="relative flex-1 select-none overflow-hidden rounded-2xl border border-border bg-[var(--brand-tint)] px-4 py-3 text-center"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent, transparent 7px, rgba(24,73,139,0.08) 7px, rgba(24,73,139,0.08) 8px)",
            }}
          >
            <span className="mono inline-flex gap-1.5 text-[26px] font-bold tracking-[0.25em] text-[var(--primary-strong)]">
              {challenge.split("").map((ch, i) => (
                <span
                  key={i}
                  className="inline-block"
                  style={{
                    transform: `rotate(${(i % 2 === 0 ? -1 : 1) * (6 + i * 2)}deg) translateY(${i % 2 === 0 ? -1 : 2}px)`,
                  }}
                >
                  {ch}
                </span>
              ))}
            </span>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={refresh}
            aria-label="Get a new code"
            iconLeft={<Icon name="refresh" size={16} />}
          >
            New
          </Button>
        </div>

        <FormField
          label="Type the code above"
          htmlFor="bot-check-code"
          error={error ?? undefined}
          hint="Letters and numbers, not case-sensitive."
        >
          <Input
            id="bot-check-code"
            autoComplete="off"
            autoCapitalize="characters"
            maxLength={challenge.length}
            value={entry}
            disabled={locked}
            onChange={(e) => setEntry(e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase())}
            placeholder="•••••"
            className="mono text-center text-lg tracking-[0.4em]"
            aria-invalid={!!error}
          />
        </FormField>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" variant="brand" disabled={locked}>
            Verify
          </Button>
        </div>
      </form>
    </Modal>
  );
}
