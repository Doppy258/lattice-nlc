import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  block = false,
  iconLeft,
  iconRight,
  className = "",
  children,
  ...rest
}: Props) {
  const base =
    "btn inline-flex items-center justify-center gap-2 rounded-full border text-sm font-bold transition disabled:pointer-events-none disabled:opacity-45";
  const variants: Record<Variant, string> = {
    primary: "btn--primary border-accent bg-accent text-white",
    secondary: "btn--secondary border-blue-200 bg-white text-accent",
    ghost: "btn--ghost border-transparent bg-transparent text-accent",
    danger: "btn--danger border-red-200 bg-white text-red-600",
  };
  const sizes: Record<Size, string> = {
    sm: "btn--sm min-h-9 px-3 text-[13px]",
    md: "min-h-11 px-5",
    lg: "btn--lg min-h-13 px-6 text-base",
  };
  const classes = [
    base,
    variants[variant],
    sizes[size],
    block ? "btn--block w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button className={classes} {...rest}>
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
