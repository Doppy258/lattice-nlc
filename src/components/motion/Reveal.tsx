import type { ComponentProps } from "react";
import { motion } from "motion/react";
import { fadeUp, staggerContainer, staggerItem } from "./variants";

type DivProps = ComponentProps<typeof motion.div>;

/** Single graceful fade + rise on mount. */
export function FadeIn(props: DivProps) {
  return <motion.div variants={fadeUp} initial="hidden" animate="show" {...props} />;
}

/** Container that staggers the reveal of any <StaggerItem> children. */
export function Stagger(props: DivProps) {
  return <motion.div variants={staggerContainer} initial="hidden" animate="show" {...props} />;
}

export function StaggerItem(props: DivProps) {
  return <motion.div variants={staggerItem} {...props} />;
}
