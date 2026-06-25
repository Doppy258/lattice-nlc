import type { ReactNode } from "react";
import type { IconName } from "../components/common/Icon";
import { HomePage } from "../pages/HomePage";
import { CreatePingPage } from "../pages/CreatePingPage";
import { MatchesPage } from "../pages/MatchesPage";
import { ExplorePage } from "../pages/ExplorePage";
import { SavedPage } from "../pages/SavedPage";
import { ClaimsPage } from "../pages/ClaimsPage";
import { RankingsPage } from "../pages/RankingsPage";
import { UserReportsPage } from "../pages/UserReportsPage";
import { HelpPage } from "../pages/HelpPage";
import { BusinessDashboardPage } from "../pages/BusinessDashboardPage";
import { CreateOfferPage } from "../pages/CreateOfferPage";
import { ManageOffersPage } from "../pages/ManageOffersPage";
import { RedeemClaimPage } from "../pages/RedeemClaimPage";
import { BusinessReviewsPage } from "../pages/BusinessReviewsPage";
import { BusinessAnalyticsPage } from "../pages/BusinessAnalyticsPage";
import { BusinessProfilePage } from "../pages/BusinessProfilePage";
import { DemoControlsPage } from "../pages/DemoControlsPage";
import { LoginPage } from "../pages/LoginPage";
import { SignupPage } from "../pages/SignupPage";
import { OnboardingPage } from "../pages/OnboardingPage";

export type NavItem = { path: string; label: string; icon: IconName };

/** Customer navigation (section 9). */
export const USER_NAV: NavItem[] = [
  { path: "/home", label: "Home", icon: "home" },
  { path: "/create-ping", label: "New Request", icon: "ping" },
  { path: "/matches", label: "Matches", icon: "matches" },
  { path: "/explore", label: "Explore", icon: "explore" },
  { path: "/saved", label: "Saved", icon: "saved" },
  { path: "/claims", label: "Claims", icon: "claims" },
  { path: "/rankings", label: "Rankings", icon: "rankings" },
  { path: "/reports", label: "Reports", icon: "reports" },
  { path: "/help", label: "Help", icon: "help" },
];

/** Business-owner navigation (section 9 / 11). */
export const BUSINESS_NAV: NavItem[] = [
  { path: "/business", label: "Dashboard", icon: "store" },
  { path: "/business/create-offer", label: "Create Offer", icon: "createOffer" },
  { path: "/business/offers", label: "Offers", icon: "offers" },
  { path: "/business/redeem", label: "Redeem Claim", icon: "redeem" },
  { path: "/business/reviews", label: "Reviews", icon: "reviews" },
  { path: "/business/analytics", label: "Analytics", icon: "analytics" },
];

/** Admin/demo navigation (section 9). */
export const DEMO_NAV: NavItem[] = [
  { path: "/demo", label: "Demo Controls", icon: "demo" },
];

/** Compact bottom-bar set for mobile (most-used customer destinations). */
export const MOBILE_NAV: NavItem[] = [
  { path: "/home", label: "Home", icon: "home" },
  { path: "/create-ping", label: "Request", icon: "ping" },
  { path: "/explore", label: "Explore", icon: "explore" },
  { path: "/claims", label: "Claims", icon: "claims" },
  { path: "/reports", label: "Reports", icon: "reports" },
];

const ELEMENTS: Record<string, ReactNode> = {
  "/home": <HomePage />,
  "/create-ping": <CreatePingPage />,
  "/matches": <MatchesPage />,
  "/explore": <ExplorePage />,
  "/saved": <SavedPage />,
  "/claims": <ClaimsPage />,
  "/rankings": <RankingsPage />,
  "/reports": <UserReportsPage />,
  "/help": <HelpPage />,
  "/business": <BusinessDashboardPage />,
  "/business/create-offer": <CreateOfferPage />,
  "/business/offers": <ManageOffersPage />,
  "/business/redeem": <RedeemClaimPage />,
  "/business/reviews": <BusinessReviewsPage />,
  "/business/analytics": <BusinessAnalyticsPage />,
  "/business/profile": <BusinessProfilePage />,
  "/demo": <DemoControlsPage />,
  "/login": <LoginPage />,
  "/signup": <SignupPage />,
  "/onboarding": <OnboardingPage />,
};

/** Resolves a route element, defaulting to Home for unknown paths. */
export function getRouteElement(path: string): ReactNode {
  return ELEMENTS[path] ?? <HomePage />;
}

export function isKnownRoute(path: string): boolean {
  return path in ELEMENTS;
}
