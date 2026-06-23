import { Suspense } from 'react'
import { Outlet, ScrollRestoration } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { MobileNav } from './MobileNav'
import { RadarMark } from '@/components/common/RadarMark'

/**
 * The persistent app frame: sidebar (desktop) + top bar + routed content +
 * bottom nav (mobile), with a skip link and the paper-grain overlay.
 */
export function AppLayout() {
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Sidebar />
      <div className="app-main">
        <TopBar />
        <main id="main" className="app-content">
          <Suspense
            fallback={
              <div style={{ display: 'grid', placeItems: 'center', padding: 'var(--sp-9)', opacity: 0.6 }}>
                <RadarMark size={52} />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
      <MobileNav />
      <ScrollRestoration />
      <div className="grain" aria-hidden="true" />
    </div>
  )
}
