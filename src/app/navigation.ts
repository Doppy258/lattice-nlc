import { useEffect, useState } from "react";

/** Hash paths that should render the marketing landing page. */
export const LANDING_PATHS = ["", "/", "/landing"];

/** Marketing-site CTA hashes mapped onto canonical app routes. */
const ALIASES: Record<string, string> = {};

export type ParsedRoute = { path: string; query: URLSearchParams };

export function parseHash(hash: string): ParsedRoute {
  const raw = hash.replace(/^#/, "");
  const [pathPart, queryPart = ""] = raw.split("?");
  let path = pathPart || "/";
  if (!path.startsWith("/")) path = `/${path}`;
  if (ALIASES[path]) path = ALIASES[path];
  return { path, query: new URLSearchParams(queryPart) };
}

export function isLanding(path: string): boolean {
  return LANDING_PATHS.includes(path);
}

/** Programmatic navigation via the hash (works from inside the landing iframe too). */
export function navigate(path: string): void {
  const target = path.startsWith("#") ? path : `#${path}`;
  window.location.hash = target;
}

/** Subscribes to hash changes and returns the current parsed route. */
export function useHashRoute(): ParsedRoute {
  const [route, setRoute] = useState<ParsedRoute>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}
