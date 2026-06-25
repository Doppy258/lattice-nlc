import type { ComponentProps, ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/** A pill toggle (preferences, budget presets, tags). Tactile press built in. */
export function ToggleChip({
  active = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: Omit<ComponentProps<typeof motion.button>, "ref" | "children"> & {
  active?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.95 }}
      aria-pressed={active}
      disabled={disabled}
      className={cn(
        "inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors duration-200",
        active
          ? "border-primary/40 bg-secondary text-secondary-foreground ring-1 ring-inset ring-primary/15"
          : "border-border bg-card text-foreground hover:border-[var(--input)] hover:bg-muted",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </motion.button>
  );
}

/** Wrap-flow container for a set of chips. */
export function ChipGroup({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-wrap gap-2", className)} {...props} />;
}
