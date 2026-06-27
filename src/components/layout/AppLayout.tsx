/**
 * AppLayout — authenticated app shell wrapping page content.
 * Assembles Sidebar, TopBar, and MobileNav with hash-route keyed transitions.
 */
import type { ReactNode } from "react";
import { motion } from "motion/react";
import { useHashRoute } from "@/app/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DURATION, EASE_OUT_EXPO } from "@/components/motion/tokens";
import { Assistant } from "@/components/domain/Assistant";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileNav } from "./MobileNav";

/**
 * AppLayout — authenticated app shell that wraps page content.
 * Assembles Sidebar (≥900px), TopBar, and MobileNav (<900px) with a
 * fade+rise page transition keyed on the hash route. The layout shifts
 * its left padding when the sidebar is present. <TooltipProvider> is
 * placed here so tooltips work anywhere inside without re-mounting.
 */
export function AppLayout({ children }: { children: ReactNode }) {
  const { path } = useHashRoute();
  return (
    <TooltipProvider delayDuration={250}>
      <div className="relative min-h-screen">
        {/* Keyboard users can jump straight to page content, past the chrome. */}
        <a
          href="#main-content"
          className="sr-only z-[60] rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to main content
        </a>
        <Sidebar />
        <div className="min-[900px]:pl-[var(--sidebar-w)]">
          <TopBar />
          <motion.main
            key={path}
            id="main-content"
            tabIndex={-1}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.base, ease: EASE_OUT_EXPO }}
            className="mx-auto w-full max-w-[var(--content-max)] px-5 pb-28 pt-6 outline-none min-[900px]:px-8 min-[900px]:pb-16 min-[900px]:pt-8"
          >
            {children}
          </motion.main>
        </div>
        <MobileNav />
        <Assistant />
      </div>
    </TooltipProvider>
  );
}
