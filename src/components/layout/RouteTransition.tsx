import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { EASE_OUT_EXPO } from "@/components/motion/tokens";

type Props = {
  routeKey: string;
  children: ReactNode;
};

/** Graceful fade + rise between routes (collapses to instant under reduced motion). */
export function RouteTransition({ routeKey, children }: Props) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={routeKey}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.32, ease: EASE_OUT_EXPO }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
