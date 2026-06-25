import type { CSSProperties, ReactNode } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { bentoTile } from "@/components/motion/variants";
import { useTilt } from "@/components/motion/useTilt";
import { Sheen } from "@/components/motion/Sheen";
import { cn } from "@/lib/utils";

export type TileColSpan = 1 | 2 | 3 | 4 | 6;
export type TileRowSpan = 1 | 2;
export type TileVariant = "surface" | "brand" | "gradient" | "visual" | "outline" | "ghost";

/** Static span class strings (Tailwind JIT can't see interpolated names). */
const COL: Record<TileColSpan, string> = {
  1: "col-span-1",
  2: "col-span-1 sm:col-span-2 lg:col-span-2",
  3: "col-span-2 sm:col-span-2 lg:col-span-3",
  4: "col-span-2 sm:col-span-4 lg:col-span-4",
  6: "col-span-2 sm:col-span-4 lg:col-span-6",
};

const ROW: Record<TileRowSpan, string> = {
  1: "",
  2: "sm:row-span-2",
};

function variantStyle(variant: TileVariant): CSSProperties {
  switch (variant) {
    case "brand":
      return { background: "var(--grad-brand)", boxShadow: "var(--tile-shadow-lift)" };
    case "gradient":
      return { background: "var(--grad-brand-soft)", boxShadow: "var(--tile-ring)" };
    case "outline":
      return { background: "var(--card)", boxShadow: "var(--tile-ring-brand)" };
    case "ghost":
      return {};
    case "visual":
    case "surface":
    default:
      return { background: "var(--card)", boxShadow: "var(--tile-shadow), var(--tile-ring)" };
  }
}

type Props = Omit<HTMLMotionProps<"div">, "ref"> & {
  colSpan?: TileColSpan;
  rowSpan?: TileRowSpan;
  variant?: TileVariant;
  interactive?: boolean;
  /** Apply default inner padding (off for full-bleed visual tiles). */
  pad?: boolean;
  as?: "div" | "button" | "a";
  children?: ReactNode;
};

/**
 * A single bento tile. Varied span + variant compose the asymmetric grid;
 * `interactive` adds a pointer tilt, hover lift, and a light sheen sweep.
 */
export function BentoTile({
  colSpan = 2,
  rowSpan = 1,
  variant = "surface",
  interactive = false,
  pad = true,
  as = "div",
  className,
  children,
  style,
  ...rest
}: Props) {
  const tilt = useTilt(4);
  const Tag = (as === "button" ? motion.button : as === "a" ? motion.a : motion.div) as typeof motion.div;

  const interactiveProps = interactive
    ? { ...tilt.handlers, whileHover: { y: -4 }, whileTap: { scale: 0.985 } }
    : {};

  return (
    <Tag
      variants={bentoTile}
      className={cn(
        "relative isolate flex flex-col rounded-[var(--tile-radius)] text-left",
        COL[colSpan],
        ROW[rowSpan],
        pad && "p-5 sm:p-6",
        variant === "brand" ? "text-white" : "text-foreground",
        (interactive || variant === "visual") && "overflow-hidden",
        interactive && "group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
      style={{ ...variantStyle(variant), ...(interactive ? tilt.style : null), ...style }}
      {...interactiveProps}
      {...rest}
    >
      {interactive && <Sheen />}
      {children}
    </Tag>
  );
}
