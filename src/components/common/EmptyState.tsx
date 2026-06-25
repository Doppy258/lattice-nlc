import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import { Button } from "./Button";

type Variant = "default" | "radar" | "map" | "ticket";

type Props = {
  icon?: IconName;
  variant?: Variant;
  title: string;
  body?: string;
  actions?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon = "ping",
  variant = "default",
  title,
  body,
  actions,
  actionLabel,
  onAction,
}: Props) {
  const shownIcon: IconName =
    variant === "map"
      ? "location"
      : variant === "ticket"
        ? "ticket"
        : variant === "radar"
          ? "ping"
          : icon;

  return (
    <div className="flex flex-col items-start gap-4 rounded-3xl border border-dashed border-border bg-card/50 p-7 sm:p-9">
      <span className="grid size-14 place-items-center rounded-2xl bg-brand-tint text-primary shadow-soft">
        <Icon name={shownIcon} size={24} />
      </span>
      <div>
        <h3 className="font-display text-xl font-medium text-foreground">
          {title}
        </h3>
        {body && (
          <p className="mt-1.5 max-w-prose text-[15px] leading-relaxed text-muted-foreground">
            {body}
          </p>
        )}
      </div>
      {(actions || (actionLabel && onAction)) && (
        <div className="flex flex-wrap gap-2.5">
          {actions}
          {actionLabel && onAction && (
            <Button onClick={onAction}>{actionLabel}</Button>
          )}
        </div>
      )}
    </div>
  );
}
