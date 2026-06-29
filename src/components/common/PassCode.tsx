/**
 * PassCode — the backup-code display for a Lattice Pass, in one consistent
 * mono style. `inline` is the compact tinted pill used in list rows;
 * `display` is the large code shown inside a copy button on the pass itself.
 * Centralising this keeps the tracking/size identical wherever a code appears.
 */
import { cn } from "@/lib/utils";

export type PassCodeSize = "inline" | "display";

const SIZES: Record<PassCodeSize, string> = {
  inline: "inline-block rounded-xl bg-[var(--tint-blue)] px-3 py-1.5 text-[15px] tracking-[0.08em]",
  display: "text-3xl tracking-[0.2em]",
};

export function PassCode({
  code,
  size = "inline",
  className,
}: {
  code: string;
  size?: PassCodeSize;
  className?: string;
}) {
  return (
    <span className={cn("mono font-semibold text-[var(--primary-strong)]", SIZES[size], className)}>
      {code}
    </span>
  );
}
