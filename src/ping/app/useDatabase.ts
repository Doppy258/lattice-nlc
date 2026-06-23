import { useSyncExternalStore } from 'react'
import type { Database } from '@/models'
import { loadData, subscribe } from '@/services/storageService'

/**
 * Subscribe a component to the persisted database. Any `saveData` /
 * `updateCollection` / `resetDemoData` call re-renders every consumer.
 * The cached snapshot is referentially stable until it actually changes.
 */
export function useDatabase(): Database {
  return useSyncExternalStore(subscribe, loadData, loadData)
}
