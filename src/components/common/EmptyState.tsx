import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/common/Icon";
import { cn } from "@/lib/utils";

/** Friendly empty/zero state with an optional primary action. */
export function EmptyState({
  icon = "matches",
  title,
  body,
  action,
  className,
}: {
  icon?: IconName;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center", className)}>
      <span className="grid size-14 place-items-center rounded-2xl bg-accent text-primary">
        <Icon name={icon} size={26} />
      </span>
      <div className="space-y-1.5">
        <h3 className="font-display text-xl font-semibold tracking-[-0.02em]">{title}</h3>
        {body && <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center justify-center gap-2.5">{action}</div>}
    </div>
  );
}
