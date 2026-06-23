import { useSession } from './SessionContext'
import { useDatabase } from './useDatabase'
import type { Business } from '@/models'

/**
 * Resolves the business an owner is currently managing. Owners hold several
 * businesses, so the active one comes from the session (with a sensible
 * fallback) and `setBusinessId` switches it.
 */
export function useBusinessContext(): {
  owned: Business[]
  current: Business | undefined
  setBusinessId: (id?: string) => void
} {
  const { user, session, setBusinessId } = useSession()
  const db = useDatabase()
  const owned = db.businesses.filter((b) => b.ownerUserId === user.id)
  const current = owned.find((b) => b.id === session.businessId) ?? owned[0]
  return { owned, current, setBusinessId }
}
