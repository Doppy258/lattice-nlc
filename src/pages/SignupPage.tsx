import { useState, useRef, useEffect, type FormEvent } from "react";
import { useApp } from "../app/providers";
import { navigate } from "../app/navigation";
import { Button } from "@/components/common/Button";
import { FormField } from "@/components/common/FormField";
import { Input } from "@/components/ui/input";
import { BrandLockup } from "@/components/layout/LatticeMark";
import { AuthError, AuthShell } from "./authShared";

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
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [, setRecaptchaReady] = useState(false);

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

    setSubmitting(true);
    const err = await signUp(email.trim(), password, displayName.trim(), recaptchaToken);
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
          Join Lattice and get matched with local offers.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        {error && <AuthError message={error} />}
        <FormField label="Display name" htmlFor="signup-name">
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

        {RECAPTCHA_SITE_KEY && <div ref={recaptchaRef} className="recaptcha-wrapper" />}

        <Button type="submit" variant="brand" block size="lg" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

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
