import { useHashRoute } from "@/app/navigation";
import { HomePage } from "@/pages/HomePage";
import { CreateLatticePage } from "@/pages/CreateLatticePage";
import { MatchesPage } from "@/pages/MatchesPage";
import { ExplorePage } from "@/pages/ExplorePage";
import { BusinessProfilePage } from "@/pages/BusinessProfilePage";
import { SavedPage } from "@/pages/SavedPage";
import { ClaimsPage } from "@/pages/ClaimsPage";
import { RankingsPage } from "@/pages/RankingsPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { CreateOfferPage } from "@/pages/CreateOfferPage";
import { OffersPage } from "@/pages/OffersPage";
import { RedeemPage } from "@/pages/RedeemPage";
import { ReviewsPage } from "@/pages/ReviewsPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { SettingsPage } from "@/pages/SettingsPage";
import { ComingSoon } from "./ComingSoon";

/** Maps the current hash route to a page. Unbuilt routes fall back to ComingSoon. */
export function RouteView() {
  const { path } = useHashRoute();
  switch (path) {
    case "/home":
      return <HomePage />;
    case "/create":
      return <CreateLatticePage />;
    case "/matches":
      return <MatchesPage />;
    case "/explore":
      return <ExplorePage />;
    case "/business":
      return <BusinessProfilePage />;
    case "/saved":
      return <SavedPage />;
    case "/claims":
      return <ClaimsPage />;
    case "/rankings":
      return <RankingsPage />;
    case "/reports":
      return <ReportsPage />;
    case "/dashboard":
      return <DashboardPage />;
    case "/analytics":
      return <AnalyticsPage />;
    case "/create-offer":
      return <CreateOfferPage />;
    case "/offers":
      return <OffersPage />;
    case "/redeem":
      return <RedeemPage />;
    case "/reviews":
      return <ReviewsPage />;
    case "/profile":
      return <ProfilePage />;
    case "/settings":
      return <SettingsPage />;
    default:
      return <ComingSoon path={path} />;
  }
}
