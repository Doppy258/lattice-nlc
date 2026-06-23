import type { ReactNode } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Icon, type IconName } from '@/components/common/Icon'
import styles from './reports.module.css'

export type ChartDatum = { label: string; value: number }

const INK_3 = '#79746a'
const LINE = '#e4ddcd'
const SIGNAL = '#ef4a23'

const axisProps = {
  tick: { fill: INK_3, fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: LINE },
} as const

const tooltipStyle = {
  background: '#16150e',
  border: 'none',
  borderRadius: 10,
  color: '#efeadb',
  fontSize: 12,
  boxShadow: '0 10px 24px -8px #2a241540',
} as const

export function ChartCard({ title, icon, children }: { title: string; icon?: IconName; children: ReactNode }) {
  return (
    <div className={styles.chartCard}>
      <div className={styles.chartTitle}>
        {icon && <Icon name={icon} size={16} />}
        {title}
      </div>
      {children}
    </div>
  )
}

/** Area trend over time / sequence. */
export function TrendChart({ data, color = SIGNAL }: { data: ChartDatum[]; color?: string }) {
  if (data.length === 0) return <div className={styles.empty}>No data yet</div>
  return (
    <div className={styles.chartBox}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.32} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={LINE} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis allowDecimals={false} width={34} {...axisProps} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: LINE }} />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill="url(#trendFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Categorical bars (e.g. redemptions by offer, claims by category). */
export function CategoryBars({ data, color = SIGNAL }: { data: ChartDatum[]; color?: string }) {
  if (data.length === 0) return <div className={styles.empty}>No data yet</div>
  return (
    <div className={styles.chartBox}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke={LINE} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" {...axisProps} interval={0} />
          <YAxis allowDecimals={false} width={34} {...axisProps} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#18160f0a' }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
            {data.map((_, i) => (
              <Cell key={i} fill={color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
