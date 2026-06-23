import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AppMode, Session, User, UserRole } from '@/models'
import { loadData, loadSession, saveSession } from '@/services/storageService'
import { useDatabase } from './useDatabase'

type SessionContextValue = {
  session: Session
  /** The full user record for the active session (the "logged in" profile). */
  user: User
  mode: AppMode
  /** Switch the mock profile; mode + active business follow from the role. */
  switchUser: (userId: string) => void
  setMode: (mode: AppMode) => void
  setBusinessId: (businessId?: string) => void
  setVerifiedHuman: (verified: boolean) => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

function modeForRole(role: UserRole): AppMode {
  if (role === 'businessOwner') return 'business'
  if (role === 'admin') return 'admin'
  return 'customer'
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const db = useDatabase()
  const [session, setSession] = useState<Session>(() => loadSession())

  // All mutations go through here so state + persistence never drift apart.
  const apply = useCallback((updater: (prev: Session) => Session) => {
    setSession((prev) => {
      const next = updater(prev)
      saveSession(next)
      return next
    })
  }, [])

  const switchUser = useCallback(
    (userId: string) => {
      const data = loadData()
      const target = data.users.find((u) => u.id === userId)
      if (!target) return
      const mode = modeForRole(target.role)
      const ownedBusiness = data.businesses.find((b) => b.ownerUserId === userId)
      apply(() => ({
        userId,
        mode,
        businessId: mode === 'business' ? ownedBusiness?.id : undefined,
        // Re-verify per session: switching profiles clears the mock human check.
        verifiedHuman: false,
      }))
    },
    [apply],
  )

  const setMode = useCallback((mode: AppMode) => apply((p) => ({ ...p, mode })), [apply])
  const setBusinessId = useCallback(
    (businessId?: string) => apply((p) => ({ ...p, businessId })),
    [apply],
  )
  const setVerifiedHuman = useCallback(
    (verified: boolean) => apply((p) => ({ ...p, verifiedHuman: verified })),
    [apply],
  )

  // Fall back to the first user if a persisted session points at a stale id.
  const user = useMemo(
    () => db.users.find((u) => u.id === session.userId) ?? db.users[0],
    [db.users, session.userId],
  )

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      user,
      mode: session.mode,
      switchUser,
      setMode,
      setBusinessId,
      setVerifiedHuman,
    }),
    [session, user, switchUser, setMode, setBusinessId, setVerifiedHuman],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within a SessionProvider')
  return ctx
}
