import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

type Props = {
  routeKey: string;
  children: ReactNode;
};

export function RouteTransition({ routeKey, children }: Props) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div key={routeKey}>{children}</div>;
  }

  return (
    <motion.div
      key={routeKey}
      initial={{ opacity: 1, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
    >
      {children}
    </motion.div>
  );
}
