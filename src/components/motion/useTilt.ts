import { useCallback, type PointerEvent } from "react";
import {
  useMotionValue,
  useReducedMotion,
  useSpring,
  type MotionStyle,
} from "motion/react";

type Tilt = {
  /** Spread onto a motion.* element's `style`. Empty when reduced motion is on. */
  style: MotionStyle;
  /** Spread onto the same element to wire pointer tracking. */
  handlers: {
    onPointerMove?: (e: PointerEvent<HTMLElement>) => void;
    onPointerLeave?: () => void;
  };
};

/**
 * Pointer-driven 3D tilt for interactive bento tiles. Maps the cursor's position
 * over the element to a small rotateX/rotateY (±`max`°), spring-smoothed.
 * A no-op (flat, no handlers) under `prefers-reduced-motion`.
 */
export function useTilt(max = 4): Tilt {
  const reduce = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 220, damping: 18, mass: 0.6 });
  const rotateY = useSpring(ry, { stiffness: 220, damping: 18, mass: 0.6 });

  const onPointerMove = useCallback(
    (e: PointerEvent<HTMLElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width; // 0..1
      const py = (e.clientY - r.top) / r.height; // 0..1
      ry.set((px - 0.5) * 2 * max);
      rx.set(-(py - 0.5) * 2 * max);
    },
    [max, rx, ry],
  );

  const onPointerLeave = useCallback(() => {
    rx.set(0);
    ry.set(0);
  }, [rx, ry]);

  if (reduce) return { style: {}, handlers: {} };

  return {
    style: {
      rotateX,
      rotateY,
      transformPerspective: 900,
      transformStyle: "preserve-3d",
    },
    handlers: { onPointerMove, onPointerLeave },
  };
}
