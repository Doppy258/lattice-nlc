/**
 * A diagonal light sheen that sweeps across a tile on hover. Drop inside any
 * element marked `group` + `relative` + `overflow-hidden`. Pure CSS transform
 * transition, so it collapses to nothing under `prefers-reduced-motion`
 * (the global reduced-motion rule zeroes transition durations).
 */
export function Sheen() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
    >
      <span className="absolute inset-y-0 -left-full w-2/3 -skew-x-12 bg-[image:var(--grad-sheen)] transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:translate-x-[260%]" />
    </span>
  );
}
