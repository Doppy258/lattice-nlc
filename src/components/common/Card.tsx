import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "surface" | "glass" | "inset" | "bento" | "ghost";

type Props = HTMLAttributes<HTMLDivElement> & {
  pad?: boolean;
  interactive?: boolean;
  variant?: Variant;
  children: ReactNode;
};

const VARIANTS: Record<Variant, string> = {
  surface: "rounded-3xl border border-border bg-card shadow-card",
  glass:
    "rounded-3xl border border-white/60 bg-[var(--surface-glass)] shadow-card backdrop-blur-xl",
  inset: "rounded-2xl border border-border bg-[#f4f8fd]",
  bento: "rounded-[28px] border border-border bg-card shadow-card",
  ghost: "bg-transparent",
};

/** App surface container. Public API unchanged; restyled for Airy Premium. */
export function Card({
  pad = true,
  interactive = false,
  variant = "surface",
  className,
  children,
  ...rest
}: Props) {
  return (
    <div
      className={cn(
        "relative",
        VARIANTS[variant],
        pad && variant !== "inset" && variant !== "ghost" && "p-5 sm:p-6",
        pad && variant === "inset" && "p-4",
        interactive &&
          "cursor-pointer transition-[transform,box-shadow,border-color] duration-300 ease-[var(--ease-out-expo)] will-change-transform hover:-translate-y-1 hover:border-[color-mix(in_oklab,var(--primary)_28%,var(--border))] hover:shadow-lift",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
