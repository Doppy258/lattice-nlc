import type { IconName } from "@/components/common/Icon";
import type { UserRole } from "@/models";

export type NavItem = { path: string; label: string; icon: IconName };

/** Customer-facing information architecture (PRD S9). */
export const CUSTOMER_NAV: NavItem[] = [
  { path: "/home", label: "Home", icon: "home" },
  { path: "/create", label: "Create", icon: "ping" },
  { path: "/matches", label: "Matches", icon: "matches" },
  { path: "/explore", label: "Explore", icon: "explore" },
  { path: "/saved", label: "Saved", icon: "saved" },
  { path: "/claims", label: "Claims", icon: "claims" },
  { path: "/rankings", label: "Rankings", icon: "rankings" },
  { path: "/reports", label: "Reports", icon: "reports" },
  { path: "/settings", label: "Settings", icon: "settings" },
];

/** Business-owner information architecture (PRD S9, S11). */
export const BUSINESS_NAV: NavItem[] = [
  { path: "/dashboard", label: "Dashboard", icon: "store" },
  { path: "/create-offer", label: "New offer", icon: "createOffer" },
  { path: "/offers", label: "Offers", icon: "offers" },
  { path: "/redeem", label: "Redeem", icon: "redeem" },
  { path: "/reviews", label: "Reviews", icon: "reviews" },
  { path: "/analytics", label: "Analytics", icon: "analytics" },
  { path: "/profile", label: "Profile", icon: "store" },
  { path: "/settings", label: "Settings", icon: "settings" },
];

/** Which nav an active user sees. Owners get the business IA; everyone else the customer IA. */
export function navForRole(role: UserRole): NavItem[] {
  return role === "businessOwner" ? BUSINESS_NAV : CUSTOMER_NAV;
}

/** Default landing route after auth/onboarding, by role. */
export function homePathForRole(role: UserRole): string {
  return role === "businessOwner" ? "/dashboard" : "/home";
}

const TITLES: Record<string, string> = Object.fromEntries(
  [...CUSTOMER_NAV, ...BUSINESS_NAV].map((n) => [n.path, n.label]),
);

/** Human title for the top bar, with a couple of route-specific overrides. */
export function titleForPath(path: string): string {
  if (path === "/create") return "Create a Lattice";
  if (path === "/business") return "Business";
  if (path === "/help") return "Help";
  return TITLES[path] ?? "Lattice";
}
