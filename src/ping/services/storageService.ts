import type { Database, CollectionName, Session } from '@/models'
import { buildSeedDatabase, DB_VERSION } from '@/data/seedDatabase'

/**
 * storageService — the single gateway to persisted state.
 *
 * The whole Database lives as one JSON blob in localStorage. Everything else
 * in the app reads through `loadData()` / `getCollection()` and writes through
 * `saveData()` / `updateCollection()`. A tiny pub/sub lets React components
 * re-render when the data changes (see useDatabase).
 *
 * The session (which mock profile is "logged in") is stored under a separate
 * key so that resetting demo data does not log you out.
 */

const DATA_KEY = 'ping.db.v1'
const SESSION_KEY = 'ping.session.v1'

/** In-memory cache so reads are cheap and getSnapshot stays referentially stable. */
let cache: Database | null = null

const listeners = new Set<() => void>()

function isBrowser(): boolean {
  return typeof window !== 'undefined' && !!window.localStorage
}

function emit(): void {
  listeners.forEach((fn) => fn())
}

function persist(db: Database): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(DATA_KEY, JSON.stringify(db))
  } catch (err) {
    // Quota or privacy mode — the app still works from the in-memory cache.
    console.warn('Ping: could not persist data to localStorage.', err)
  }
}

/** Load the database, seeding (and persisting) it on first run. */
export function loadData(): Database {
  if (cache) return cache

  if (isBrowser()) {
    try {
      const raw = window.localStorage.getItem(DATA_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Database
        // Discard stale shapes after a schema change.
        if (parsed && parsed.version === DB_VERSION) {
          cache = parsed
          return cache
        }
      }
    } catch (err) {
      console.warn('Ping: stored data was unreadable, re-seeding.', err)
    }
  }

  cache = buildSeedDatabase()
  persist(cache)
  return cache
}

/** Replace the entire database and notify subscribers. */
export function saveData(db: Database): void {
  cache = db
  persist(db)
  emit()
}

/** Wipe persisted state and rebuild fresh seed data (Demo Controls). */
export function resetDemoData(): Database {
  const fresh = buildSeedDatabase()
  saveData(fresh)
  return fresh
}

/** Read one collection (typed by name). */
export function getCollection<K extends CollectionName>(name: K): Database[K] {
  return loadData()[name]
}

/** Replace one collection and persist the result. */
export function updateCollection<K extends CollectionName>(
  name: K,
  next: Database[K],
): Database {
  const db = loadData()
  const updated = { ...db, [name]: next } as Database
  saveData(updated)
  return updated
}

/** Subscribe to data changes; returns an unsubscribe fn (used by useDatabase). */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/* ───────────────────────────── Session ──────────────────────────────── */

const DEFAULT_SESSION: Session = {
  userId: 'u_lucas',
  mode: 'customer',
  verifiedHuman: false,
}

export function loadSession(): Session {
  if (!isBrowser()) return DEFAULT_SESSION
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    if (raw) return { ...DEFAULT_SESSION, ...(JSON.parse(raw) as Partial<Session>) }
  } catch (err) {
    console.warn('Ping: stored session was unreadable.', err)
  }
  return DEFAULT_SESSION
}

export function saveSession(session: Session): void {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch (err) {
    console.warn('Ping: could not persist session.', err)
  }
}
