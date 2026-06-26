import { AppProvider, useApp } from "./app/providers";
import { useHashRoute, isLanding, navigate } from "./app/navigation";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import { RouteView } from "@/components/layout/routes";
import { Toaster } from "@/components/ui/sonner";
import { isSupabaseConfigured } from "./services/supabaseClient";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { OnboardingPage } from "./pages/OnboardingPage";

const PUBLIC_AUTH_PATHS = ["/login", "/signup"];

/** Seeded demo identities are pre-onboarded, so switching to them in demo mode
 *  must not bounce through the onboarding flow. */
const SEEDED_USER_PREFIXES = ["user_", "owner_", "admin_"];
function isSeededUser(id: string | undefined): boolean {
  return !!id && SEEDED_USER_PREFIXES.some((p) => id.startsWith(p));
}

function Shell() {
  const { path } = useHashRoute();
  const { authState, activeUser } = useApp();

  const needsOnboarding =
    authState === "authenticated" &&
    isSupabaseConfigured &&
    !activeUser?.onboardingComplete &&
    !isSeededUser(activeUser?.id);

  if (authState === "loading") {
    return (
      <div className="auth-page">
        <div className="auth-loading">
          <div className="auth-loading__spinner" />
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  if (isLanding(path)) {
    return <iframe src="./lumio/index.html" title="Lattice landing page" className="landing-frame" />;
  }

  // Authenticated users on login/signup get sent to the right place.
  if (authState === "authenticated" && PUBLIC_AUTH_PATHS.includes(path)) {
    navigate(needsOnboarding ? "/onboarding" : "/home");
    return null;
  }

  // Login/signup pages — accessible without auth.
  if (PUBLIC_AUTH_PATHS.includes(path)) {
    return path === "/signup" ? <SignupPage /> : <LoginPage />;
  }

  if (authState === "unauthenticated") {
    return <LoginPage />;
  }

  // Authenticated below this point.

  if (needsOnboarding) {
    if (path !== "/onboarding") navigate("/onboarding");
    return <OnboardingPage />;
  }

  // Authenticated and onboarded — render the app shell + routed page.
  return (
    <AppLayout>
      <RouteView />
    </AppLayout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MotionProvider>
        <Shell />
        <Toaster />
      </MotionProvider>
    </AppProvider>
  );
}
