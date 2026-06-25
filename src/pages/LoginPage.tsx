import { useState, type FormEvent } from "react";
import { useApp } from "../app/providers";
import { navigate } from "../app/navigation";
import { Icon } from "../components/common/Icon";
import { Button } from "../components/common/Button";

export function LoginPage() {
  const { signIn, authState } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }
    setSubmitting(true);
    const err = await signIn(email.trim(), password);
    setSubmitting(false);
    if (err) setError(err);
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
          <p className="auth-card__subtitle">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-card__form">
          {error && (
            <div className="auth-error">
              <Icon name="alert" size={15} />
              <span>{error}</span>
            </div>
          )}

          <div className="field">
            <label className="field__label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="text-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="text-input"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" block size="lg" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="auth-card__switch">
          No account?{" "}
          <button className="auth-link" onClick={() => navigate("/signup")}>
            Create one
          </button>
        </p>
      </div>
    </div>
  );
}
