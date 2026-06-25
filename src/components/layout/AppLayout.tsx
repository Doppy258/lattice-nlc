import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { CommandBar } from "./CommandBar";
import { MobileNav } from "./MobileNav";
import { RouteTransition } from "./RouteTransition";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type Props = {
  currentPath: string;
  children: ReactNode;
};

const COLLAPSE_KEY = "lattice.nav.collapsed.v1";

/** The persistent app frame: collapsible nav + command bar + bento canvas + mobile nav. */
export function AppLayout({ currentPath, children }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <div
      className={cn(
        "relative min-h-dvh bg-background lg:grid",
        collapsed ? "lg:grid-cols-[76px_minmax(0,1fr)]" : "lg:grid-cols-[260px_minmax(0,1fr)]",
      )}
    >
      {/* Command-center mesh wash (decorative). */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{ background: "var(--grad-mesh)" }}
      />

      <aside className="sticky top-0 hidden h-dvh border-r border-border/70 bg-[var(--sidebar)] backdrop-blur-xl lg:block">
        <Sidebar
          currentPath={currentPath}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
        />
      </aside>

      <div className="min-w-0">
        <CommandBar currentPath={currentPath} onOpenMenu={() => setDrawerOpen(true)} />
        <main className="mx-auto w-full max-w-[1560px] px-4 pt-6 pb-28 sm:px-7 lg:px-8 lg:pb-12">
          <RouteTransition routeKey={currentPath}>{children}</RouteTransition>
        </main>
      </div>

      <MobileNav currentPath={currentPath} />

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-[290px] p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar currentPath={currentPath} drawer onNavigate={() => setDrawerOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
