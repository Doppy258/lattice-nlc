import { AnimatedNumber } from "@/components/motion/AnimatedNumber";

type Props = {
  label: string;
  value: number | string;
  hint?: string;
  animate?: boolean;
  prefix?: string;
  suffix?: string;
};

/** Compact KPI tile with a count-up value. Public API unchanged. */
export function MetricTile({
  label,
  value,
  hint,
  animate = true,
  prefix = "",
  suffix = "",
}: Props) {
  const numeric = typeof value === "number";
  return (
    <div className="flex min-h-[104px] flex-col gap-1.5 rounded-2xl border border-border bg-card p-4 shadow-soft transition-shadow duration-300 hover:shadow-card">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <span className="mono text-[28px] leading-none font-bold tracking-tight text-foreground">
        {prefix}
        {numeric && animate ? (
          <AnimatedNumber value={value as number} />
        ) : (
          value
        )}
        {suffix}
      </span>
      {hint && <span className="text-[13px] text-muted-foreground">{hint}</span>}
    </div>
  );
}
