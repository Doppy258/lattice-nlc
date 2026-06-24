import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

type Props = {
  label: string;
  value: number | string;
  hint?: string;
  animate?: boolean;
  prefix?: string;
  suffix?: string;
};

function MetricTileMotion({ value, animate, prefix = "", suffix = "" }: Pick<Props, "value" | "animate" | "prefix" | "suffix">) {
  const reduced = useReducedMotion();
  const numeric = typeof value === "number";
  const [display, setDisplay] = useState(numeric ? 0 : value);

  useEffect(() => {
    if (!numeric || !animate || reduced) {
      setDisplay(value);
      return;
    }
    const target = value as number;
    const duration = 800;
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, animate, numeric, reduced]);

  return (
    <motion.span
      className="metric-tile__value"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      {prefix}
      {display}
      {suffix}
    </motion.span>
  );
}

export function MetricTile({ label, value, hint, animate = true, prefix, suffix }: Props) {
  return (
    <div className="metric-tile rounded-[22px] border border-blue-100 bg-white/85 p-4">
      <span className="metric-tile__label">
        <span className="metric-tile__dot" aria-hidden /> {label}
      </span>
      <MetricTileMotion value={value} animate={animate} prefix={prefix} suffix={suffix} />
      {hint && <span className="metric-tile__hint">{hint}</span>}
    </div>
  );
}
