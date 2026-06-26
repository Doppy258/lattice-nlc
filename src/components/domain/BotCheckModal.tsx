/**
 * BotCheckModal - self-contained, offline bot-prevention check. Unlike a
 * network reCAPTCHA, this always works in the demo: the user ticks "I'm not a
 * robot" and re-types a randomised, distorted canvas-drawn code with a bounded
 * number of attempts. Gates offer claims and serves as a signup fallback.
 * Props: open, onOpenChange, onVerified, title?, description?
 * Role in architecture: Domain — ensures only humans can mass-claim limited
 * offers or create accounts, replacing a third-party CAPTCHA with a zero-
 * dependency, always-available alternative.
 */
import { useEffect, useRef, useState } from "react";
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
 * Paints the challenge onto a <canvas> as a genuinely distorted image — each
 * glyph gets its own rotation, skew, offset and colour over a noisy background,
 * so the text is human-readable but can't be copied or scraped from the DOM.
 * A fresh drawing is produced whenever `text` changes.
 */
function CaptchaImage({ text }: { text: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const rand = (min: number, max: number) => min + Math.random() * (max - min);
    const W = 260;
    const H = 88;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    // Tinted background.
    ctx.fillStyle = "#eef3fb";
    ctx.fillRect(0, 0, W, H);

    // Faint diagonal hatching for texture.
    ctx.strokeStyle = "rgba(24,73,139,0.06)";
    ctx.lineWidth = 1;
    for (let x = -H; x < W; x += 9) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + H, H);
      ctx.stroke();
    }

    // Wavy lines drawn across the glyphs to defeat simple OCR.
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = `rgba(24,73,139,${rand(0.14, 0.26)})`;
      ctx.lineWidth = rand(1, 2);
      ctx.beginPath();
      ctx.moveTo(0, rand(12, H - 12));
      for (let x = 0; x <= W; x += 14) ctx.lineTo(x, rand(8, H - 8));
      ctx.stroke();
    }

    // Each character: own size, rotation, skew, vertical offset and blue shade.
    const blues = ["#13386b", "#18498b", "#1f5fb0", "#2b6fc4"];
    const slot = W / (text.length + 1);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let i = 0; i < text.length; i++) {
      ctx.save();
      ctx.translate(slot * (i + 1) + rand(-4, 4), H / 2 + rand(-7, 7));
      ctx.rotate(rand(-0.42, 0.42));
      ctx.transform(1, rand(-0.12, 0.12), rand(-0.28, 0.28), 1, 0, 0);
      ctx.font = `700 ${rand(34, 44)}px ui-monospace, "SFMono-Regular", Menlo, monospace`;
      ctx.fillStyle = blues[Math.floor(Math.random() * blues.length)];
      ctx.shadowColor = "rgba(0,0,0,0.12)";
      ctx.shadowBlur = 1.5;
      ctx.shadowOffsetY = 1;
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }

    // Speckle noise.
    for (let i = 0; i < 42; i++) {
      ctx.fillStyle = `rgba(24,73,139,${rand(0.05, 0.18)})`;
      ctx.beginPath();
      ctx.arc(rand(0, W), rand(0, H), rand(0.5, 1.6), 0, Math.PI * 2);
      ctx.fill();
    }
  }, [text]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="Distorted verification code image"
      className="h-[64px] w-full select-none rounded-2xl border border-border"
    />
  );
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

        {/* Distorted CAPTCHA image — randomized glyphs, not selectable text. */}
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <CaptchaImage text={challenge} />
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
