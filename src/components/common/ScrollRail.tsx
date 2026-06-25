import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
};

/** Horizontal snap rail with hidden scrollbar. */
export function ScrollRail({ children, className }: Props) {
  return (
    <div
      className={cn(
        "-mx-1 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-1 pt-1 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}
