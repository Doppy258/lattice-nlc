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
  return (
    <div className={`empty-state${variant !== "default" ? ` empty-state--${variant}` : ""}`}>
      {variant === "default" ? (
        <span className="empty-state__icon">
          <Icon name={icon} size={22} />
        </span>
      ) : variant === "radar" ? (
        <span className="empty-state__art" aria-hidden />
      ) : variant === "map" ? (
        <span className="empty-state__art" aria-hidden>
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} />
          ))}
        </span>
      ) : (
        <span className="empty-state__art" aria-hidden />
      )}
      <h3 className="empty-state__title">{title}</h3>
      {body && <p className="empty-state__body">{body}</p>}
      <div className="empty-state__actions">
        {actions}
        {actionLabel && onAction && (
          <Button onClick={onAction}>{actionLabel}</Button>
        )}
      </div>
    </div>
  );
}
