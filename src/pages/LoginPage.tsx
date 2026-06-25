import { useState, type FormEvent } from "react";
import { useApp } from "../app/providers";
import { navigate } from "../app/navigation";
import { Icon } from "../components/common/Icon";
import { Button } from "../components/common/Button";
import { EntryShell } from "../components/entry/EntryShell";

export function LoginPage() {
  const { signIn } = useApp();
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
    <EntryShell>
      <div className="entry__panelhead">
        <span className="entry__eyebrow">Welcome back</span>
        <h2 className="entry__title">Sign in to Lattice</h2>
        <p className="entry__subtitle">Pick up your matches, claims, and saved offers.</p>
      </div>

      <form onSubmit={handleSubmit} className="entry__form">
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

        <Button type="submit" block size="lg" className="entry__cta" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="entry__switch">
        No account?{" "}
        <button className="entry__link" onClick={() => navigate("/signup")}>
          Create one
        </button>
      </p>
    </EntryShell>
  );
}
