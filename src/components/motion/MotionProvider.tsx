import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { TRANSITION } from "./tokens";

/**
 * App-wide motion defaults. `reducedMotion="user"` makes every `motion`
 * component honor the OS "reduce motion" setting automatically.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={TRANSITION}>
      {children}
    </MotionConfig>
  );
}
