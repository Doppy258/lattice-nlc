import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors [&>svg]:size-3.5 [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-brand-tint text-primary",
        secondary: "border-border bg-muted text-muted-foreground",
        success:
          "border-[color-mix(in_oklab,var(--success)_18%,transparent)] bg-success-tint text-success",
        warning:
          "border-[color-mix(in_oklab,var(--warning)_18%,transparent)] bg-warning-tint text-warning",
        destructive:
          "border-[color-mix(in_oklab,var(--destructive)_18%,transparent)] bg-[var(--danger-tint)] text-destructive",
        outline: "border-border bg-transparent text-foreground",
        solid: "border-transparent bg-primary text-primary-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
