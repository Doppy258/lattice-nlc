import type { CSSProperties } from "react";

/**
 * Dependency-free line-icon set (consistent 1.6 stroke, currentColor).
 * Keeps the bundle lean and the visual language uniform across the shell.
 */
export type IconName =
  | "home"
  | "ping"
  | "matches"
  | "explore"
  | "saved"
  | "claims"
  | "rankings"
  | "reports"
  | "help"
  | "store"
  | "createOffer"
  | "offers"
  | "redeem"
  | "reviews"
  | "analytics"
  | "demo"
  | "location"
  | "chevron"
  | "close"
  | "check"
  | "alert"
  | "arrow"
  | "star"
  | "search"
  | "clock"
  | "plus"
  | "minus"
  | "ticket"
  | "food"
  | "retail"
  | "services"
  | "fitness"
  | "education"
  | "repair"
  | "entertainment";

const PATHS: Record<IconName, JSX.Element> = {
  home: <path d="M4 11l8-7 8 7M6 9.5V20h12V9.5" />,
  ping: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
  matches: <path d="M12 3l2.2 5.5L20 9.6l-4.3 3.7L17 19l-5-3-5 3 1.3-5.7L4 9.6l5.8-1.1z" />,
  explore: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </>
  ),
  saved: <path d="M6 4h12v16l-6-4-6 4z" />,
  claims: (
    <>
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" />
      <path d="M13 6v12" strokeDasharray="2 2" />
    </>
  ),
  rankings: (
    <>
      <path d="M5 20h4v-7H5zM10 20h4V6h-4zM15 20h4v-10h-4z" />
    </>
  ),
  reports: (
    <>
      <path d="M4 19V5M4 19h16" />
      <path d="M8 15l3-4 3 2 4-6" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7M12 17h.01" />
    </>
  ),
  store: <path d="M4 9l1-4h14l1 4M4 9v10h16V9M4 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0M9 19v-5h6v5" />,
  createOffer: (
    <>
      <path d="M3 12l9-9 9 9-9 9z" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  offers: <path d="M4 6h16M4 12h16M4 18h10" />,
  redeem: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </>
  ),
  reviews: <path d="M12 4l2 5 5 .4-3.8 3.3 1.2 5L12 15l-4.6 2.7 1.2-5L4.8 9.4 10 9z" />,
  analytics: (
    <>
      <path d="M4 20V4" />
      <path d="M8 20v-6M12 20V8M16 20v-9M20 20V6" />
    </>
  ),
  demo: (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" />
      <circle cx="9" cy="7" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="15" cy="17" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  location: (
    <>
      <path d="M12 21c4.5-4.8 6.8-8.3 6.8-11.2A6.8 6.8 0 0 0 5.2 9.8C5.2 12.7 7.5 16.2 12 21Z" />
      <circle cx="12" cy="9.4" r="2.2" />
    </>
  ),
  chevron: <path d="M6 9l6 6 6-6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 12.5l4 4 10-11" />,
  alert: (
    <>
      <path d="M12 3l9 16H3z" />
      <path d="M12 10v4M12 17h.01" />
    </>
  ),
  arrow: <path d="M4 12h15M13 6l6 6-6 6" />,
  star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  ticket: (
    <>
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" />
      <path d="M14 6v12" strokeDasharray="2 2" />
    </>
  ),
  food: <path d="M6 3v8a2 2 0 0 0 4 0V3M8 11v10M16 3c-1.5 0-2.5 2-2.5 5s1 4 2.5 4 2.5-1 2.5-4-1-5-2.5-5ZM16 16v5" />,
  retail: <path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2" />,
  services: <path d="M14.5 6.5a3.5 3.5 0 0 0-5 0l-1 1 3 3M14.5 6.5l3 3-7.5 7.5-4 1 1-4z" />,
  fitness: <path d="M3 9v6M21 9v6M6 7v10M18 7v10M6 12h12" />,
  education: <path d="M3 8l9-4 9 4-9 4zM7 11v5c0 1 2 2 5 2s5-1 5-2v-5" />,
  repair: <path d="M14.5 6.5a3.5 3.5 0 0 0-5 0l-1 1 3 3M14.5 6.5l3 3-7.5 7.5-4 1 1-4z" />,
  entertainment: <path d="M5 8h14l-1 12H6zM9 4l3 4 3-4" />,
};

type Props = {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
};

export function Icon({ name, size = 18, className, style }: Props) {
  return (
    <svg
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
