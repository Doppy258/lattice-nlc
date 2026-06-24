import type { HTMLAttributes, ReactNode } from "react";

type Variant = "surface" | "glass" | "inset" | "bento" | "ghost";

type Props = HTMLAttributes<HTMLDivElement> & {
  pad?: boolean;
  interactive?: boolean;
  variant?: Variant;
  children: ReactNode;
};

export function Card({
  pad = true,
  interactive = false,
  variant = "surface",
  className = "",
  children,
  ...rest
}: Props) {
  const base = "card relative";
  const variants: Record<Variant, string> = {
    surface: "card--surface rounded-[28px] border border-blue-100 bg-white",
    glass: "card--glass rounded-[28px] border border-white/70 bg-white/75 backdrop-blur-xl",
    inset: "card--inset rounded-[22px] border border-blue-100 bg-[#f8fbff]",
    bento: "card--bento rounded-[28px] border border-blue-100 bg-white",
    ghost: "card--ghost bg-transparent",
  };
  const classes = [
    base,
    variants[variant],
    pad && variant !== "inset" && variant !== "ghost" ? "card--pad p-5 sm:p-6" : "",
    interactive ? "card--interactive transition will-change-transform" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
