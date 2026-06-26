import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Button as UIButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "brand";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
};

const variantMap = {
  primary: "default",
  secondary: "secondary",
  ghost: "ghost",
  danger: "destructive",
  brand: "brand",
} as const;

const sizeMap = { sm: "sm", md: "default", lg: "lg" } as const;

/**
 * Button — semantic shortcut over shadcn's <Button>.
 * Maps app-level variant/size names to the shadcn props so call sites
 * are decoupled from the underlying UI library. Supports left/right icons.
 */
export function Button({
  variant = "primary",
  size = "md",
  block = false,
  iconLeft,
  iconRight,
  className,
  children,
  ...rest
}: Props) {
  return (
    <UIButton
      variant={variantMap[variant]}
      size={sizeMap[size]}
      className={cn(block && "w-full", className)}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </UIButton>
  );
}
