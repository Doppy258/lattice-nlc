import { Icon, type IconName } from "../common/Icon";
import { HelpTooltip } from "../common/HelpTooltip";

type Props = {
  icon: IconName;
  label: string;
  value: string;
  /** Optional secondary line, e.g. "of 248 views". */
  caption?: string;
  /** Optional tooltip explaining how the metric is calculated. */
  hint?: string;
};

/** Compact KPI tile used across the business dashboard and analytics screens. */
export function StatCard({ icon, label, value, caption, hint }: Props) {
  return (
    <div className="stat-card">
      <span className="stat-card__icon">
        <Icon name={icon} size={18} />
      </span>
      <div className="stat-card__body">
        <span className="stat-card__label">
          {label}
          {hint && <HelpTooltip text={hint} label={`How ${label} is calculated`} />}
        </span>
        <span className="stat-card__value">{value}</span>
        {caption && <span className="stat-card__caption">{caption}</span>}
      </div>
    </div>
  );
}
