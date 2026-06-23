import type { ReactNode, SVGProps } from 'react'

/**
 * A small, dependency-free icon set drawn as inline SVG so the app ships no
 * icon font and works fully offline. All icons are 24×24, stroked with
 * currentColor, so they inherit text colour and size cleanly.
 */
export type IconName =
  | 'home'
  | 'ping'
  | 'target'
  | 'compass'
  | 'bookmark'
  | 'ticket'
  | 'trophy'
  | 'chart'
  | 'help'
  | 'grid'
  | 'tag'
  | 'tagPlus'
  | 'scan'
  | 'star'
  | 'sliders'
  | 'location'
  | 'chevronDown'
  | 'chevronRight'
  | 'plus'
  | 'check'
  | 'arrowRight'
  | 'sparkle'
  | 'x'
  | 'menu'
  | 'clock'
  | 'shield'
  | 'search'
  | 'filter'
  | 'heart'
  | 'food'
  | 'retail'
  | 'services'
  | 'fitness'
  | 'education'
  | 'repair'
  | 'entertainment'

const PATHS: Record<IconName, ReactNode> = {
  home: (
    <>
      <path d="M3 10.8 12 3.5l9 7.3" />
      <path d="M5.5 9.4V20h13V9.4" />
      <path d="M10 20v-5.2h4V20" />
    </>
  ),
  ping: (
    <>
      <circle cx="12" cy="12" r="2.1" fill="currentColor" stroke="none" />
      <path d="M7.6 16.4a6.2 6.2 0 0 1 0-8.8" />
      <path d="M16.4 7.6a6.2 6.2 0 0 1 0 8.8" />
      <path d="M4.8 19.2a10.2 10.2 0 0 1 0-14.4" />
      <path d="M19.2 4.8a10.2 10.2 0 0 1 0 14.4" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.3" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M14.8 9.2l-1.9 5.6-4.7 1.9 1.9-5.6z" fill="currentColor" stroke="none" />
    </>
  ),
  bookmark: <path d="M6.5 4h11v16.5l-5.5-3.8-5.5 3.8z" />,
  ticket: (
    <>
      <path d="M4.5 7.5h15v3.1a1.9 1.9 0 0 0 0 3.8v3.1h-15v-3.1a1.9 1.9 0 0 0 0-3.8z" />
      <path d="M12 7.5v10" strokeDasharray="2 2.4" />
    </>
  ),
  trophy: (
    <>
      <path d="M7.5 4.5h9v3.2a4.5 4.5 0 0 1-9 0z" />
      <path d="M7.5 5.5h-2a2 2 0 0 0 2 2M16.5 5.5h2a2 2 0 0 1-2 2" />
      <path d="M12 12.2v3.3M9 19.5h6M10 15.5h4" />
    </>
  ),
  chart: (
    <>
      <path d="M3.5 20.5h17" />
      <path d="M6.5 20.5v-7M11 20.5V6M15.5 20.5v-4.5M20 20.5V9.5" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M9.6 9.4a2.5 2.5 0 1 1 3.6 2.4c-.9.5-1.2 1-1.2 1.9" />
      <path d="M12 16.6h.01" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" rx="1.4" />
      <rect x="13" y="4" width="7" height="7" rx="1.4" />
      <rect x="4" y="13" width="7" height="7" rx="1.4" />
      <rect x="13" y="13" width="7" height="7" rx="1.4" />
    </>
  ),
  tag: (
    <>
      <path d="M4 12.5 12 4.5h7.5V12l-8 8z" />
      <circle cx="15.6" cy="8.4" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  tagPlus: (
    <>
      <path d="M4 11 11 4h6.5v6.5l-7 7z" />
      <circle cx="14.2" cy="7.3" r="1.1" fill="currentColor" stroke="none" />
      <path d="M16 17.5h4M18 15.5v4" />
    </>
  ),
  scan: (
    <>
      <path d="M4 8.5V5.5a1.5 1.5 0 0 1 1.5-1.5h3" />
      <path d="M15.5 4h3A1.5 1.5 0 0 1 20 5.5v3" />
      <path d="M20 15.5v3a1.5 1.5 0 0 1-1.5 1.5h-3" />
      <path d="M8.5 20h-3A1.5 1.5 0 0 1 4 18.5v-3" />
      <path d="M4 12h16" />
    </>
  ),
  star: (
    <path d="M12 3.6l2.6 5.3 5.8.9-4.2 4.1 1 5.8L12 17l-5.2 2.7 1-5.8L3.6 9.8l5.8-.9z" />
  ),
  sliders: (
    <>
      <path d="M4 8h9M17 8h3M4 16h3M11 16h9" />
      <circle cx="15" cy="8" r="2.1" fill="var(--paper-raised)" />
      <circle cx="9" cy="16" r="2.1" fill="var(--paper-raised)" />
    </>
  ),
  location: (
    <>
      <path d="M12 21s-6-5.4-6-10.2A6 6 0 0 1 18 10.8C18 15.6 12 21 12 21z" />
      <circle cx="12" cy="10.6" r="2.1" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.5l7 2.6v5.1c0 4.4-3 7.6-7 9.3-4-1.7-7-4.9-7-9.3V6.1z" />
      <path d="M9 12l2.2 2.2L15.5 10" />
    </>
  ),
  chevronDown: <path d="M6 9.5l6 6 6-6" />,
  chevronRight: <path d="M9.5 6l6 6-6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="M5 12.5l4.2 4.2L19 7" />,
  arrowRight: <path d="M4.5 12h15M13 5.5l6.5 6.5-6.5 6.5" />,
  sparkle: (
    <>
      <path d="M12 4l1.7 4.6L18 10l-4.3 1.4L12 16l-1.7-4.6L6 10l4.3-1.4z" />
      <path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
    </>
  ),
  x: <path d="M6 6l12 12M18 6L6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </>
  ),
  filter: <path d="M4 6h16M7 12h10M10 18h4" />,
  heart: (
    <path d="M12 20s-7-4.4-7-9.5A3.8 3.8 0 0 1 12 7.6 3.8 3.8 0 0 1 19 10.5C19 15.6 12 20 12 20z" />
  ),
  food: (
    <>
      <path d="M3.5 11.5h17a8.5 8.5 0 0 1-17 0z" />
      <path d="M9 4.5c0 1-1 1.2-1 2.2s1 1.2 1 2.2M13 4.5c0 1-1 1.2-1 2.2s1 1.2 1 2.2" />
    </>
  ),
  retail: (
    <>
      <path d="M6 8h12l-1 11.5H7z" />
      <path d="M9 8V6.2a3 3 0 0 1 6 0V8" />
    </>
  ),
  services: (
    <>
      <circle cx="6" cy="6.5" r="2.3" />
      <circle cx="6" cy="17.5" r="2.3" />
      <path d="M8 7.6 19 18M8 16.4 19 6" />
    </>
  ),
  fitness: <path d="M3.5 9.5v5M6.5 7.5v9M17.5 7.5v9M20.5 9.5v5M6.5 12h11" />,
  education: (
    <>
      <path d="M3 8.5l9-3.8 9 3.8-9 3.8z" />
      <path d="M7.5 10.6V15c0 1 2.4 2.2 4.5 2.2s4.5-1.2 4.5-2.2v-4.4" />
    </>
  ),
  repair: (
    <path d="M20 6.5a3.6 3.6 0 0 1-4.7 4.4L7 19.2a2 2 0 0 1-2.8-2.8L12.5 8a3.6 3.6 0 0 1 4.4-4.7l-2.3 2.3 1.4 2.4 2.4 1.4z" />
  ),
  entertainment: (
    <>
      <path d="M7.5 9h9a3 3 0 0 1 2.9 2.3l1 4.2a2 2 0 0 1-3.6 1.6L15.5 15h-7l-1.4 2.1a2 2 0 0 1-3.6-1.6l1-4.2A3 3 0 0 1 7.5 9z" />
      <path d="M7 12v2M6 13h2" />
      <circle cx="16" cy="12.5" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
}

type IconProps = {
  name: IconName
  size?: number
  strokeWidth?: number
} & Omit<SVGProps<SVGSVGElement>, 'name' | 'width' | 'height'>

export function Icon({ name, size = 20, strokeWidth = 1.7, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  )
}
