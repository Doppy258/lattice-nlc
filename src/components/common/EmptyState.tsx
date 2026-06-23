import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

type Props = {
  icon?: IconName;
  title: string;
  body?: string;
  actions?: ReactNode;
};

export function EmptyState({ icon = "ping", title, body, actions }: Props) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">
        <Icon name={icon} size={22} />
      </span>
      <h3 className="empty-state__title">{title}</h3>
      {body && <p className="empty-state__body">{body}</p>}
      {actions && <div className="empty-state__actions">{actions}</div>}
    </div>
  );
}
