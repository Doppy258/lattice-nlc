import type { ReactNode } from 'react'
import { SessionProvider } from './SessionContext'

/**
 * Composes all app-wide providers in one place. Today that's just the session
 * (mock profile) context; future cross-cutting providers (toasts, theme) slot
 * in here without touching the router.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
