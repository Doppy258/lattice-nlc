import { cn } from "@/lib/utils";

/** The Lattice node-diamond glyph — four rounded cells in a lattice. */
export function LatticeGlyph({ className, size = 22 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <rect x="9.4" y="2.2" width="5.2" height="5.2" rx="1.7" />
      <rect x="2.2" y="9.4" width="5.2" height="5.2" rx="1.7" />
      <rect x="16.6" y="9.4" width="5.2" height="5.2" rx="1.7" />
      <rect x="9.4" y="16.6" width="5.2" height="5.2" rx="1.7" />
    </svg>
  );
}

/** Solid-blue brand tile with the lattice glyph. */
export function LatticeMark({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn(
        "grid place-items-center rounded-[13px] bg-primary text-white shadow-[var(--shadow-cta)]",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <LatticeGlyph size={size * 0.52} />
    </span>
  );
}

/** Mark + wordmark lockup for headers. The "tice" is set in the serif accent. */
export function BrandLockup({ size = 36 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <LatticeMark size={size} />
      <span className="text-[19px] font-semibold tracking-[-0.03em] text-foreground">
        Lat<span className="font-accent text-[21px] text-primary">tice</span>
      </span>
    </span>
  );
}
