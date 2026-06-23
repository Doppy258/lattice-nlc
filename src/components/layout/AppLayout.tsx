import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileNav } from "./MobileNav";

type Props = {
  currentPath: string;
  children: ReactNode;
};

/** The persistent app frame: sidebar + top bar + scrollable content + mobile nav. */
export function AppLayout({ currentPath, children }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar currentPath={currentPath} />

      <div className="app-main">
        <TopBar onOpenMenu={() => setDrawerOpen(true)} />
        <main className="app-content">
          <div key={currentPath} className="route-fade">
            {children}
          </div>
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
