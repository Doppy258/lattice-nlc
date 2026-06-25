import type { ReactNode } from "react";
import { motion } from "motion/react";
import { useHashRoute } from "@/app/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DURATION, EASE_OUT_EXPO } from "@/components/motion/tokens";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileNav } from "./MobileNav";

/**
 * Authenticated app chrome: glass sidebar + glass top bar over the blue-tinted
 * canvas, with a blur-free fade/rise page transition keyed on the route.
 */
export function AppLayout({ children }: { children: ReactNode }) {
  const { path } = useHashRoute();
  return (
    <TooltipProvider delayDuration={250}>
      <div className="relative min-h-screen">
        <Sidebar />
        <div className="min-[900px]:pl-[var(--sidebar-w)]">
          <TopBar />
          <motion.main
            key={path}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.base, ease: EASE_OUT_EXPO }}
            className="mx-auto w-full max-w-[var(--content-max)] px-5 pb-28 pt-6 min-[900px]:px-8 min-[900px]:pb-16 min-[900px]:pt-8"
          >
            {children}
          </motion.main>
        </div>
        <MobileNav />
      </div>
    </TooltipProvider>
  );
}
