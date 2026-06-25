import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: ReactNode;
  action?: ReactNode;
  className?: string;
};

/** Shared header row for list/visual tiles: title on the left, optional action. */
export function TileHeader({ title, action, className }: Props) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3", className)}>
      <h2 className="text-[17px] font-semibold tracking-tight text-foreground">{title}</h2>
      {action}
    </div>
  );
}
