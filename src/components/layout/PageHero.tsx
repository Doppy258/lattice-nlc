import type { ReactNode } from "react";

type Variant = "split" | "command" | "compact";

type Props = {
  variant?: Variant;
  kicker?: string;
  title: ReactNode;
  subtitle?: string;
  aside?: ReactNode;
  actions?: ReactNode;
};

export function PageHero({
  variant = "split",
  kicker,
  title,
  subtitle,
  aside,
  actions,
}: Props) {
  if (variant === "compact") {
    return (
      <header className="page-hero page-hero--compact">
        <div>
          {kicker && <span className="kicker">{kicker}</span>}
          <h1 className="page-hero__title" style={{ fontSize: "var(--text-2xl)", marginTop: kicker ? "var(--space-2)" : 0 }}>
            {title}
          </h1>
          {subtitle && <p className="page-hero__subtitle" style={{ fontSize: "var(--text-sm)", marginTop: "var(--space-1)" }}>{subtitle}</p>}
        </div>
        {actions && <div className="row">{actions}</div>}
      </header>
    );
  }

  return (
    <header className={`page-hero page-hero--${variant}`}>
      <div>
        {kicker && <span className="kicker">{kicker}</span>}
        <h1 className="page-hero__title">{title}</h1>
        {subtitle && <p className="page-hero__subtitle">{subtitle}</p>}
        {actions && <div className="row" style={{ marginTop: "var(--space-4)" }}>{actions}</div>}
      </div>
      {aside && <div className="page-hero__aside">{aside}</div>}
    </header>
  );
}

/** @deprecated Use PageHero instead */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <PageHero
      variant="split"
      kicker={eyebrow}
      title={title}
      subtitle={subtitle}
      actions={actions}
    />
  );
}
