import { useState, useRef, useEffect, type FormEvent } from "react";
import { useApp } from "../app/providers";
import { navigate } from "../app/navigation";
import { Button } from "@/components/common/Button";
import { FormField } from "@/components/common/FormField";
import { Icon } from "@/components/common/Icon";
import { Input } from "@/components/ui/input";
import { BrandLockup } from "@/components/layout/LatticeMark";
import { BotCheckModal } from "@/components/domain/BotCheckModal";
import { AuthError, AuthShell } from "./authShared";
import { cn } from "@/lib/utils";

type AccountType = "customer" | "business";

const ACCOUNT_TYPES: { id: AccountType; label: string; description: string; icon: "home" | "store" }[] = [
  { id: "customer", label: "Personal", description: "Find & save local offers", icon: "home" },
  { id: "business", label: "Business", description: "List offers & redeem passes", icon: "store" },
];

declare global {
  interface Window {
    grecaptcha: {
      render: (container: string | HTMLElement, params: { sitekey: string; callback: (token: string) => void }) => number;
      getResponse: (id?: number) => string;
      reset: (id?: number) => void;
    };
    onRecaptchaLoad?: () => void;
  }
}

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";

export function SignupPage() {
  const { signUp } = useApp();
  const [accountType, setAccountType] = useState<AccountType>("customer");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [, setRecaptchaReady] = useState(false);
  // Offline fallback used when no reCAPTCHA key is configured (e.g. the demo):
  // a self-contained human check still gates account creation against bots.
  const [humanVerified, setHumanVerified] = useState(false);
  const [botCheckOpen, setBotCheckOpen] = useState(false);

  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY || !recaptchaRef.current) return;

    const timer = setInterval(() => {
      if (!window.grecaptcha?.render) return;
      clearInterval(timer);
      if (recaptchaRef.current && !recaptchaRef.current.querySelector("iframe")) {
        window.grecaptcha.render(recaptchaRef.current, {
          sitekey: RECAPTCHA_SITE_KEY,
          callback: (token: string) => setRecaptchaToken(token),
        });
      }
      setRecaptchaReady(true);
    }, 200);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!displayName.trim()) {
      setError("Please enter your display name.");
      return;
    }
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (RECAPTCHA_SITE_KEY && !recaptchaToken) {
      setError("Please complete the reCAPTCHA verification.");
      return;
    }
    if (!RECAPTCHA_SITE_KEY && !humanVerified) {
      setError("Please complete the human verification.");
      return;
    }

    setSubmitting(true);
    const role = accountType === "business" ? "businessOwner" : "customer";
    const err = await signUp(email.trim(), password, displayName.trim(), recaptchaToken, role);
    setSubmitting(false);

    if (err) {
      setError(err);
      setRecaptchaToken("");
      window.grecaptcha?.reset();
    }
  };

  return (
    <AuthShell>
      <div className="flex flex-col items-center text-center">
        <BrandLockup size={42} />
        <h1 className="mt-6 font-display text-[27px] font-semibold tracking-[-0.035em]">
          Create your <span className="font-accent font-normal text-primary">account</span>
        </h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">
          {accountType === "business"
            ? "List your storefront and redeem customer passes."
            : "Join Lattice and get matched with local offers."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        {error && <AuthError message={error} />}

        <FormField label="I'm signing up as a">
          <div className="grid grid-cols-2 gap-2.5">
            {ACCOUNT_TYPES.map((opt) => {
              const selected = accountType === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAccountType(opt.id)}
                  aria-pressed={selected}
                  className={cn(
                    "flex cursor-pointer flex-col items-start gap-1.5 rounded-2xl border p-3.5 text-left transition-colors",
                    selected
                      ? "border-primary/40 bg-[var(--tint-blue)] ring-1 ring-inset ring-primary/20"
                      : "border-border bg-card hover:border-[var(--input)]",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-xl",
                      selected ? "bg-primary text-white" : "bg-accent text-primary",
                    )}
                  >
                    <Icon name={opt.icon} size={18} />
                  </span>
                  <span className="text-[14px] font-semibold tracking-[-0.01em]">{opt.label}</span>
                  <span className="text-[11px] leading-snug text-muted-foreground">{opt.description}</span>
                </button>
              );
            })}
          </div>
        </FormField>

        <FormField label={accountType === "business" ? "Your name" : "Display name"} htmlFor="signup-name">
          <Input
            id="signup-name"
            type="text"
            placeholder="Your name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="name"
            autoFocus
          />
        </FormField>
        <FormField label="Email" htmlFor="signup-email">
          <Input
            id="signup-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Password" htmlFor="signup-password">
            <Input
              id="signup-password"
              type="password"
              placeholder="6+ characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </FormField>
          <FormField label="Confirm" htmlFor="signup-confirm">
            <Input
              id="signup-confirm"
              type="password"
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </FormField>
        </div>

        {RECAPTCHA_SITE_KEY ? (
          <div ref={recaptchaRef} className="recaptcha-wrapper" />
        ) : humanVerified ? (
          <div className="flex items-center gap-2.5 rounded-2xl border border-[var(--success)]/30 bg-[var(--success)]/10 p-3.5 text-sm font-medium text-foreground">
            <Icon name="check" size={18} className="text-[var(--success)]" />
            Verified — you're human.
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setBotCheckOpen(true)}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-2xl border border-border bg-card p-3.5 text-left text-sm font-medium text-foreground transition-colors hover:border-[var(--input)]"
          >
            <Icon name="shield" size={18} className="text-primary" />
            Verify you're human
            <Icon name="arrow" size={16} className="ml-auto text-muted-foreground" />
          </button>
        )}

        <Button type="submit" variant="brand" block size="lg" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <BotCheckModal
        open={botCheckOpen}
        onOpenChange={setBotCheckOpen}
        onVerified={() => setHumanVerified(true)}
        title="Verify you're human"
        description="A quick check to keep bots from creating fake accounts."
      />

      <p className="mt-6 text-center text-[14px] text-muted-foreground">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="cursor-pointer font-semibold text-primary transition-colors hover:text-[var(--primary-strong)]"
        >
          Sign in
        </button>
      </p>
    </AuthShell>
  );
}
