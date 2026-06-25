import { useState, useRef, useEffect, type FormEvent } from "react";
import { useApp } from "../app/providers";
import { navigate } from "../app/navigation";
import { Icon } from "../components/common/Icon";
import { Button } from "../components/common/Button";

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
  const [recaptchaReady, setRecaptchaReady] = useState(false);

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
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__brand">
          <div className="auth-card__logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <rect x="2" y="2" width="24" height="24" rx="8" fill="#0066cc" />
              <path d="M8 14h12M14 8v12" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="auth-card__title">Lattice</h1>
          <p className="auth-card__subtitle">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-card__form">
          {error && (
            <div className="auth-error">
              <Icon name="alert" size={15} />
              <span>{error}</span>
            </div>
          )}

          <div className="field">
            <label className="field__label" htmlFor="signup-name">Display name</label>
            <input
              id="signup-name"
              className="text-input"
              type="text"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
              autoFocus
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              className="text-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              className="text-input"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="signup-confirm">Confirm password</label>
            <input
              id="signup-confirm"
              className="text-input"
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {RECAPTCHA_SITE_KEY && (
            <div className="field">
              <div ref={recaptchaRef} className="recaptcha-wrapper" />
            </div>
          )}

          <Button type="submit" block size="lg" disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="auth-card__switch">
          Already have an account?{" "}
          <button className="auth-link" onClick={() => navigate("/login")}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
