import { cn } from "@/lib/utils";

/**
 * The Lattice node mark — four offset cells scattered like a lattice, one
 * accented in brand blue. Recreated from the brand glyph with SOLID fills only
 * (no gradients); circles use live tokens so it adapts to light/dark and stays
 * crisp at any size. Geometry mirrors the source artwork (576×554 canvas).
 */
export function LatticeGlyph({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={Math.round(size * (554 / 576))}
      viewBox="0 0 576 554"
      fill="none"
      role="img"
      aria-label="Lattice"
      className={className}
    >
      <circle cx="211" cy="208" r="89" fill="var(--foreground)" />
      <circle cx="163" cy="437" r="88" fill="var(--foreground)" />
      <circle cx="378" cy="366" r="86" fill="var(--foreground)" />
      <circle cx="453" cy="157" r="85" fill="var(--primary)" />
    </svg>
  );
}

/** The standalone brand mark (transparent — sits directly on any surface). */
export function LatticeMark({ className, size = 40 }: { className?: string; size?: number }) {
  return <LatticeGlyph className={cn("block", className)} size={size} />;
}

/** Mark + wordmark lockup for headers. */
export function BrandLockup({ size = 34, className }: { size?: number; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LatticeMark size={size} />
      <span className="text-[19px] font-semibold leading-none tracking-[-0.03em] text-foreground">
        Lattice
      </span>
    </span>
  );
}
