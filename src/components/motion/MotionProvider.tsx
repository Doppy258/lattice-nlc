/**
 * MotionProvider - app-wide motion defaults. Wraps children in MotionConfig
 * with `reducedMotion="user"` so every motion component automatically honours
 * the OS "reduce motion" setting, and applies the shared transition tokens.
 * Props: children (ReactNode)
 * Role in architecture: Motion infrastructure — must wrap all animated content
 * (done in App.tsx) so that animation behaviour is consistent and accessible
 * across the entire app without per-component configuration.
 */
import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { TRANSITION } from "./tokens";

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={TRANSITION}>
      {children}
    </MotionConfig>
  );
}
