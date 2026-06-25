import { AppProvider, useApp } from "./app/providers";
import { useHashRoute, isLanding, navigate } from "./app/navigation";
import { getRouteElement } from "./app/routes";
import { AppLayout } from "./components/layout/AppLayout";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { Toaster } from "@/components/ui/sonner";
import { isSupabaseConfigured } from "./services/supabaseClient";
import { LoginPage } from "./pages/LoginPage";
import { OnboardingPage } from "./pages/OnboardingPage";

const PUBLIC_AUTH_PATHS = ["/login", "/signup"];

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

  // Authenticated users on login/signup get sent to the right place.
  if (authState === "authenticated" && PUBLIC_AUTH_PATHS.includes(path)) {
    navigate(needsOnboarding ? "/onboarding" : "/home");
    return null;
  }

  // Login/signup pages — accessible without auth.
  if (PUBLIC_AUTH_PATHS.includes(path)) {
    return <>{getRouteElement(path)}</>;
  }

  if (authState === "unauthenticated") {
    return <LoginPage />;
  }

  // Authenticated below this point.

  if (needsOnboarding) {
    if (path !== "/onboarding") navigate("/onboarding");
    return <OnboardingPage />;
  }

  if (path === "/onboarding") {
    navigate("/home");
    return null;
  }

  return <AppLayout currentPath={path}>{getRouteElement(path)}</AppLayout>;
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
