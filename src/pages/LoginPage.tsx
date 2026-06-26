import { useState, type FormEvent } from "react";
import { useApp } from "../app/providers";
import { navigate } from "../app/navigation";
import { Icon } from "@/components/common/Icon";
import { Button } from "@/components/common/Button";
import { FormField } from "@/components/common/FormField";
import { Input } from "@/components/ui/input";
import { BrandLockup } from "@/components/layout/LatticeMark";
import { AuthError, AuthShell } from "./authShared";

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
    <AuthShell>
      <div className="flex flex-col items-center text-center">
        <BrandLockup size={42} />
        <h1 className="mt-6 font-display text-[27px] font-semibold tracking-[-0.035em]">
          Welcome <span className="font-accent font-normal text-primary">back</span>
        </h1>
        <p className="mt-1.5 text-[14px] text-muted-foreground">
          Sign in to find verified local offers near you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        {error && <AuthError message={error} />}
        <FormField label="Email" htmlFor="login-email">
          <Input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
          />
        </FormField>
        <FormField label="Password" htmlFor="login-password">
          <Input
            id="login-password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </FormField>
        <Button type="submit" variant="brand" block size="lg" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-[14px] text-muted-foreground">
        No account?{" "}
        <button
          type="button"
          onClick={() => navigate("/signup")}
          className="cursor-pointer font-semibold text-primary transition-colors hover:text-[var(--primary-strong)]"
        >
          Create one
        </button>
      </p>
    </AuthShell>
  );
}
