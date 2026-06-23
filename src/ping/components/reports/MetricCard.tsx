import { Icon, type IconName } from '@/components/common/Icon'
import { HelpTooltip } from '@/components/common/HelpTooltip'
import styles from './reports.module.css'

export function MetricCard({
  label,
  value,
  sub,
  icon,
  tone = 'neutral',
  tooltip,
}: {
  label: string
  value: string | number
  sub?: string
  icon?: IconName
  tone?: 'neutral' | 'signal' | 'emerald'
  tooltip?: string
}) {
  return (
    <div className={styles.metric}>
      <div className={styles.metricTop}>
        {icon && (
          <span className={styles.metricIcon} data-tone={tone}>
            <Icon name={icon} size={18} />
          </span>
        )}
        <span className={styles.metricLabel}>{label}</span>
        {tooltip && <HelpTooltip label={tooltip} />}
      </div>
      <span className={styles.metricValue}>{value}</span>
      {sub && <span className={styles.metricSub}>{sub}</span>}
    </div>
  )
}
