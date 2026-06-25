import { useId } from "react";

/**
 * The "front door" atmosphere: a fine architectural lattice — the brand made
 * literal. A drifting grid of hairline lines and nodes, with a handful of "lit"
 * nodes that slowly pulse like signals coming in. Pure decoration: aria-hidden,
 * pointer-events none. All motion is CSS and is disabled under
 * prefers-reduced-motion (see globals.css + entry.css).
 */

// Grid-aligned coordinates (cell = 46px) inside the 1200×800 viewBox.
const LIT_NODES: Array<{ x: number; y: number; r: number; delay: number }> = [
  { x: 230, y: 276, r: 2.6, delay: 0 },
  { x: 414, y: 138, r: 2.2, delay: 1.4 },
  { x: 506, y: 414, r: 3, delay: 0.6 },
  { x: 644, y: 552, r: 2.4, delay: 2.1 },
  { x: 828, y: 276, r: 2.8, delay: 0.9 },
  { x: 1012, y: 414, r: 2.2, delay: 1.8 },
  { x: 138, y: 552, r: 2.4, delay: 2.6 },
  { x: 920, y: 690, r: 2.6, delay: 3.2 },
];

export function LatticeField() {
  const gid = useId().replace(/:/g, "");
  const cell = 46;

  return (
    <div className="entry__field" aria-hidden="true">
      <svg
        className="entry__lattice"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <pattern
            id={`grid-${gid}`}
            width={cell}
            height={cell}
            patternUnits="userSpaceOnUse"
          >
            {/* hairline lattice lines */}
            <path
              d={`M ${cell} 0 L 0 0 0 ${cell}`}
              stroke="rgba(35,82,222,0.1)"
              strokeWidth="1"
            />
            {/* node dot at each intersection */}
            <circle cx="0" cy="0" r="1.5" fill="rgba(35,82,222,0.26)" />
          </pattern>
        </defs>

        {/* drifting grid (oversized so the loop is seamless) */}
        <g className="entry__grid">
          <rect x="-46" y="-46" width="1292" height="892" fill={`url(#grid-${gid})`} />
        </g>

        {/* lit signal nodes */}
        <g>
          {LIT_NODES.map((n, i) => (
            <g key={i}>
              <circle
                className="entry__node"
                cx={n.x}
                cy={n.y}
                r={n.r}
                fill="rgba(35,82,222,0.55)"
                style={{ animationDelay: `${n.delay}s` }}
              />
              <circle cx={n.x} cy={n.y} r={n.r * 0.45} fill="#2352de" />
            </g>
          ))}
        </g>
      </svg>

      <div className="entry__grain" />
    </div>
  );
}
