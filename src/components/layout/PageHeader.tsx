import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, subtitle, actions }: Props) {
  return (
    <header className="page-header">
      <div className="page-header__row">
        <div>
          {eyebrow && (
            <span className="eyebrow">
              <span className="eyebrow__dot" />
              {eyebrow}
            </span>
          )}
          <h1 className="page-header__title">{title}</h1>
        </div>
        {actions && <div className="row">{actions}</div>}
      </div>
      {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
    </header>
  );
}
