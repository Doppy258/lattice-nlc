import { AppProvider, useApp } from "./app/providers";
import { useHashRoute, isLanding, navigate } from "./app/navigation";
import { getRouteElement } from "./app/routes";
import { AppLayout } from "./components/layout/AppLayout";
import { isSupabaseConfigured } from "./services/supabaseClient";
import { LoginPage } from "./pages/LoginPage";
import { OnboardingPage } from "./pages/OnboardingPage";

const AUTH_PATHS = ["/login", "/signup", "/onboarding"];

function isAuthPath(path: string): boolean {
  return AUTH_PATHS.includes(path);
}

function Shell() {
  const { path } = useHashRoute();
  const { authState, activeUser } = useApp();
  const needsOnboarding =
    authState === "authenticated" &&
    !activeUser?.onboardingComplete &&
    isSupabaseConfigured;

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

  if (authState === "unauthenticated") {
    return <LoginPage />;
  }

  // Authenticated below this point.

  if (needsOnboarding) {
    // Allow staying on /onboarding; redirect anything else to it.
    if (path !== "/onboarding") navigate("/onboarding");
    return <OnboardingPage />;
  }

  if (isAuthPath(path)) {
    // Authenticated user on /login or /signup — send to home.
    navigate("/home");
    return null;
  }

  return <AppLayout currentPath={path}>{getRouteElement(path)}</AppLayout>;
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
