import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { Icon, type IconName } from "@/components/common/Icon";
import { cn } from "@/lib/utils";
import { BentoTile, type TileColSpan } from "./BentoTile";
import { Sparkline } from "./Sparkline";

type Delta = { value: number; direction: "up" | "down" | "flat" };

type Props = {
  label: string;
  value: number | string;
  format?: (n: number) => string;
  delta?: Delta;
  /** Inline sparkline series. */
  series?: number[];
  icon?: IconName;
  colSpan?: TileColSpan;
  rowSpan?: 1 | 2;
  /** Brand-gradient stat tile (white text). */
  accent?: boolean;
  onClick?: () => void;
};

function DeltaPill({ delta, accent }: { delta: Delta; accent?: boolean }) {
  const Arrow = delta.direction === "up" ? ArrowUpRight : delta.direction === "down" ? ArrowDownRight : Minus;
  const tone = accent
    ? "bg-white/15 text-white"
    : delta.direction === "up"
      ? "bg-success-tint text-success"
      : delta.direction === "down"
        ? "bg-danger-tint text-danger"
        : "bg-muted text-muted-foreground";
  return (
    <span className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums", tone)}>
      <Arrow className="size-3" strokeWidth={2.4} />
      {Math.abs(delta.value)}%
    </span>
  );
}

/** Big-numeral KPI tile with optional delta pill + inline sparkline. */
export function StatTile({
  label,
  value,
  format,
  delta,
  series,
  icon,
  colSpan = 2,
  rowSpan = 1,
  accent = false,
  onClick,
}: Props) {
  const numeric = typeof value === "number";

  return (
    <BentoTile
      colSpan={colSpan}
      rowSpan={rowSpan}
      variant={accent ? "brand" : "surface"}
      interactive={!!onClick}
      as={onClick ? "button" : "div"}
      onClick={onClick}
      className="justify-between gap-3"
    >
      <div className="flex items-center gap-2">
        {icon && (
          <span
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-xl",
              accent ? "bg-white/15 text-white" : "bg-brand-tint text-primary",
            )}
          >
            <Icon name={icon} size={16} />
          </span>
        )}
        <span className={cn("text-[13px] font-semibold", accent ? "text-white/85" : "text-muted-foreground")}>
          {label}
        </span>
      </div>

      <div className="flex items-end gap-2">
        <span
          className={cn(
            "font-mono text-[2.3rem] leading-none font-bold tracking-tight tabular-nums sm:text-[2.6rem]",
            accent ? "text-white" : "text-foreground",
          )}
        >
          {numeric ? <AnimatedNumber value={value} format={format} /> : value}
        </span>
        {delta && <span className="pb-1.5"><DeltaPill delta={delta} accent={accent} /></span>}
      </div>

      {series && series.length > 1 && (
        <Sparkline
          data={series}
          height={32}
          color={accent ? "rgba(255,255,255,0.9)" : "var(--spark-line)"}
          fill={accent ? "rgba(255,255,255,0.18)" : "var(--spark-fill)"}
        />
      )}
    </BentoTile>
  );
}
