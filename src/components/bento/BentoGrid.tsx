import type { ReactNode } from "react";
import { motion } from "motion/react";
import { bentoContainer } from "@/components/motion/variants";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
};

/**
 * The bento canvas: a 6-column grid (2 on mobile, 4 on tablet) with uniform
 * min row height. Tiles take varied col/row spans for an asymmetric composition.
 * Children should be <BentoTile>s; they spring/stagger in on mount.
 */
export function BentoGrid({ children, className }: Props) {
  return (
    <motion.div
      variants={bentoContainer}
      initial="hidden"
      animate="show"
      className={cn(
        "grid grid-cols-2 gap-[var(--tile-gap)] [grid-auto-rows:minmax(136px,auto)] sm:grid-cols-4 lg:grid-cols-6",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
