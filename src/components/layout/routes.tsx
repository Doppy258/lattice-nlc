import { useHashRoute } from "@/app/navigation";
import { HomePage } from "@/pages/HomePage";
import { CreateLatticePage } from "@/pages/CreateLatticePage";
import { MatchesPage } from "@/pages/MatchesPage";
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
    default:
      return <ComingSoon path={path} />;
  }
}
