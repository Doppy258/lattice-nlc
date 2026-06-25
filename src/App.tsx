import { AppProvider } from "./app/providers";
import { useHashRoute, isLanding } from "./app/navigation";
import { getRouteElement } from "./app/routes";
import { AppLayout } from "./components/layout/AppLayout";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { Toaster } from "@/components/ui/sonner";

/**
 * Root shell. The marketing landing page (an iframe over the prebuilt static
 * site) renders at the root hash; any app route renders inside the layout.
 * The landing CTAs set the parent hash (e.g. #/onboarding → /create-ping),
 * which flips this between the two views.
 */
function Shell() {
  const { path } = useHashRoute();

  if (isLanding(path)) {
    return <iframe src="./lumio/index.html" title="Lattice landing page" className="landing-frame" />;
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
