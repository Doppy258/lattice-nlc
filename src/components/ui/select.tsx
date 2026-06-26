/**
 * shadcn/ui Select primitive — styled native `<select>` wrapped in a
 * relative container with a custom chevron. Deliberately uses the
 * platform control (not Radix) to stay dependency-light and fully
 * keyboard-accessible.
 */
import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Styled native <select>. We use the platform control (rather than a Radix
 * popover) to stay dependency-light and fully accessible/keyboard-native.
 */
function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(
          "h-11 w-full appearance-none rounded-[13px] border border-input bg-card pl-3.5 pr-9 text-sm font-medium text-foreground shadow-[var(--shadow-soft)] outline-none transition-[color,box-shadow,border-color] duration-200",
          "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}

export { Select };
