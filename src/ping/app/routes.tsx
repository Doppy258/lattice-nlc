import { lazy } from 'react'
import { createHashRouter } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'

import { HomePage } from '@/pages/HomePage'
import { CreatePingPage } from '@/pages/CreatePingPage'
import { MatchesPage } from '@/pages/MatchesPage'
import { ExplorePage } from '@/pages/ExplorePage'
import { BusinessProfilePage } from '@/pages/BusinessProfilePage'
import { SavedPage } from '@/pages/SavedPage'
import { ClaimsPage } from '@/pages/ClaimsPage'
import { RankingsPage } from '@/pages/RankingsPage'
import { HelpPage } from '@/pages/HelpPage'
import { CreateOfferPage } from '@/pages/CreateOfferPage'
import { ManageOffersPage } from '@/pages/ManageOffersPage'
import { RedeemClaimPage } from '@/pages/RedeemClaimPage'
import { BusinessReviewsPage } from '@/pages/BusinessReviewsPage'
import { DemoControlsPage } from '@/pages/DemoControlsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

// Chart-heavy pages (Recharts) are code-split so they don't bloat the initial bundle.
const UserReportsPage = lazy(() =>
  import('@/pages/UserReportsPage').then((m) => ({ default: m.UserReportsPage })),
)
const BusinessDashboardPage = lazy(() =>
  import('@/pages/BusinessDashboardPage').then((m) => ({ default: m.BusinessDashboardPage })),
)
const BusinessAnalyticsPage = lazy(() =>
  import('@/pages/BusinessAnalyticsPage').then((m) => ({ default: m.BusinessAnalyticsPage })),
)

/**
 * HashRouter keeps the app fully standalone: the production build works from a
 * static folder or file host with no server-side route rewrites — important
 * for an offline, demo-safe submission.
 */
export const router = createHashRouter([
  {
    element: <AppLayout />,
    children: [
      // Customer
      { index: true, element: <HomePage /> },
      { path: 'create', element: <CreatePingPage /> },
      { path: 'matches', element: <MatchesPage /> },
      { path: 'explore', element: <ExplorePage /> },
      { path: 'business/:id', element: <BusinessProfilePage /> },
      { path: 'saved', element: <SavedPage /> },
      { path: 'claims', element: <ClaimsPage /> },
      { path: 'rankings', element: <RankingsPage /> },
      { path: 'reports', element: <UserReportsPage /> },
      { path: 'help', element: <HelpPage /> },
      // Business
      { path: 'biz', element: <BusinessDashboardPage /> },
      { path: 'biz/create-offer', element: <CreateOfferPage /> },
      { path: 'biz/offers', element: <ManageOffersPage /> },
      { path: 'biz/redeem', element: <RedeemClaimPage /> },
      { path: 'biz/reviews', element: <BusinessReviewsPage /> },
      { path: 'biz/analytics', element: <BusinessAnalyticsPage /> },
      // Admin / demo
      { path: 'demo', element: <DemoControlsPage /> },
      // Fallback
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
