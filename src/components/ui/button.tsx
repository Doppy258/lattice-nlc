import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold outline-none transition-[transform,background-color,box-shadow,border-color,color] duration-200 ease-[var(--ease-out-expo)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-[18px] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_10px_24px_-12px_rgba(15,95,204,0.6)] hover:bg-[var(--accent-focus)] hover:shadow-[0_16px_30px_-12px_rgba(15,95,204,0.55)] hover:-translate-y-px",
        secondary:
          "border border-[color-mix(in_oklab,var(--primary)_22%,transparent)] bg-card text-primary hover:bg-brand-tint hover:-translate-y-px",
        outline:
          "border border-border bg-card text-foreground hover:bg-muted hover:-translate-y-px",
        ghost: "text-primary hover:bg-brand-tint",
        destructive:
          "border border-[color-mix(in_oklab,var(--destructive)_24%,transparent)] bg-card text-destructive hover:bg-[color-mix(in_oklab,var(--destructive)_10%,var(--card))]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 text-sm",
        sm: "h-9 gap-1.5 px-3.5 text-[13px]",
        lg: "h-[52px] px-7 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
