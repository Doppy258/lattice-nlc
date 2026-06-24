import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileNav } from "./MobileNav";
import { RouteTransition } from "./RouteTransition";

type Props = {
  currentPath: string;
  children: ReactNode;
};

/** The persistent app frame: sidebar + top bar + scrollable content + mobile nav. */
export function AppLayout({ currentPath, children }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="app-shell">
      <div className="app-shell__ambient" aria-hidden />
      <Sidebar currentPath={currentPath} />

      <div className="app-main">
        <TopBar onOpenMenu={() => setDrawerOpen(true)} />
        <main className="app-content">
          <RouteTransition routeKey={currentPath}>{children}</RouteTransition>
        </main>
      </div>

      <MobileNav currentPath={currentPath} />

      {drawerOpen && (
        <div
          className="mobile-drawer-overlay open"
          role="presentation"
          onClick={() => setDrawerOpen(false)}
        >
          <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <Sidebar currentPath={currentPath} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
