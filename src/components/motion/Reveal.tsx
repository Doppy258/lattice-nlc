import type { ComponentProps, ElementType, ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { DURATION, EASE_OUT_EXPO, STAGGER_CONTAINER } from "./tokens";

/**
 * Blur + rise reveal, played on mount. The signature landing-page entrance
 * translated to the app. Animating on mount (rather than on scroll) guarantees
 * content is never left hidden below the fold. Under "reduce motion" it renders
 * statically from the resting state.
 */
type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  /** Seconds to delay the animation. */
  delay?: number;
  y?: number;
  blur?: number;
  className?: string;
  style?: ComponentProps<typeof motion.div>["style"];
};

export function Reveal({
  children,
  as = "div",
  delay = 0,
  y = 18,
  blur = 12,
  className,
  style,
}: RevealProps) {
  const reduced = useReducedMotion();
  const Comp = motionTag(as);
  return (
    <Comp
      className={className}
      style={style}
      initial={reduced ? false : { opacity: 0, y, filter: `blur(${blur}px)` }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: DURATION.slow, ease: EASE_OUT_EXPO, delay }}
    >
      {children}
    </Comp>
  );
}

/** Parent that staggers the reveal of its <StaggerItem> children on mount. */
export function Stagger({
  children,
  as = "div",
  className,
  style,
}: Omit<RevealProps, "delay" | "y" | "blur">) {
  const reduced = useReducedMotion();
  const Comp = motionTag(as);
  return (
    <Comp
      className={className}
      style={style}
      variants={STAGGER_CONTAINER}
      initial={reduced ? false : "hidden"}
      animate="show"
    >
      {children}
    </Comp>
  );
}

/** A child of <Stagger>; reveals in sequence with its siblings. */
export function StaggerItem({
  children,
  as = "div",
  y = 16,
  blur = 10,
  className,
  style,
}: Omit<RevealProps, "delay">) {
  const Comp = motionTag(as);
  return (
    <Comp
      className={className}
      style={style}
      variants={{
        hidden: { opacity: 0, y, filter: `blur(${blur}px)` },
        show: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration: DURATION.base, ease: EASE_OUT_EXPO },
        },
      }}
    >
      {children}
    </Comp>
  );
}

/** Resolve a tag name to its `motion.*` component (typed loosely on purpose). */
function motionTag(as: ElementType) {
  return (motion as unknown as Record<string, typeof motion.div>)[as as string] ?? motion.div;
}
