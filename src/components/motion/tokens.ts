import type { Transition, Variants } from "motion/react";

/** Animation timing primitives, mirrored from the CSS motion tokens in tokens.css. */
export const DURATION = { fast: 0.14, base: 0.24, slow: 0.42 } as const;

export const EASE_OUT: [number, number, number, number] = [0.22, 0.61, 0.36, 1];
export const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const SPRING: Transition = { type: "spring", stiffness: 230, damping: 26, mass: 0.9 };
export const SPRING_SOFT: Transition = { type: "spring", stiffness: 140, damping: 22 };
export const SPRING_SNAPPY: Transition = { type: "spring", stiffness: 460, damping: 34 };

/** Default transition applied app-wide via <MotionProvider>. */
export const TRANSITION: Transition = { duration: DURATION.base, ease: EASE_OUT_EXPO };

/** Press/hover micro-interaction presets — the tactile "flavor" on tappable UI. */
export const TAP = { scale: 0.97 } as const;
export const TAP_SOFT = { scale: 0.985 } as const;
export const HOVER_LIFT = { y: -2 } as const;

/** Container that staggers its children's reveal (used by <Stagger>). */
export const STAGGER_CONTAINER: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
