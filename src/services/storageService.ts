/**
 * storageService - client-side data persistence layer.
 * Purpose: Manages AppData snapshots in localStorage with Supabase as an
 * optional remote backend. Handles first-run seeding (buildSeedData),
 * active-user and active-business preferences, and demo-data reset.
 * The async loadDataFromSupabase path is used when a Supabase connection
 * is configured; otherwise everything runs from the in-memory/localStorage
 * snapshot.
 * Key exports: loadData, saveData, resetDemoData, loadDataAsync,
 *   loadDataFromSupabase, loadActiveUserId, saveActiveUserId,
 *   loadActiveBusinessId, saveActiveBusinessId, getCollection, updateCollection
 */
import type { AppData, CollectionName } from "../models";
import { fetchAllData } from "./dbService";
import { isSupabaseConfigured } from "./supabaseClient";
import { buildSeedData } from "../data/seed";

const DATA_KEY = "lattice.data.v1";
const ACTIVE_USER_KEY = "lattice.activeUserId.v1";

function emptyData(): AppData {
  return {
    users: [],
    businesses: [],
    offers: [],
    requests: [],
    claims: [],
    reviews: [],
    rankings: [],
    savedBusinesses: [],
    savedOffers: [],
  };
}
const ACTIVE_BUSINESS_KEY = "lattice.activeBusinessId.v1";

/**
 * Loads app data from Supabase. Returns empty data if unavailable
 * (e.g. first run before seed SQL has been applied).
 */
export async function loadDataAsync(): Promise<AppData> {
  return emptyData();
}

export async function loadDataFromSupabase(): Promise<AppData | null> {
  if (isSupabaseConfigured) {
    try {
      const dbData = await fetchAllData();
      if (dbData) return dbData;
    } catch {
      // Supabase unavailable
    }
  }
  return null;
}

export function getCollection<K extends CollectionName>(
  data: AppData,
  name: K
): AppData[K] {
  return data[name];
}

/** Returns a new AppData with one collection replaced (immutable update). */
export function updateCollection<K extends CollectionName>(
  data: AppData,
  name: K,
  newData: AppData[K]
): AppData {
  return { ...data, [name]: newData };
}
function hasStorage(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

/** The business an owner is currently managing (a local UI preference). */
export function loadActiveBusinessId(): string | null {
  if (!hasStorage()) return null;
  return window.localStorage.getItem(ACTIVE_BUSINESS_KEY);
}

export function saveActiveBusinessId(businessId: string | null): void {
  if (!hasStorage()) return;
  if (businessId) window.localStorage.setItem(ACTIVE_BUSINESS_KEY, businessId);
  else window.localStorage.removeItem(ACTIVE_BUSINESS_KEY);
}

/**
 * Synchronous local snapshot used by the app's data layer. Reads the persisted
 * snapshot from localStorage, falling back to a fresh seed so the demo always
 * has internally-consistent data on first run.
 */
export function loadData(): AppData {
  if (hasStorage()) {
    try {
      const raw = window.localStorage.getItem(DATA_KEY);
      if (raw) return JSON.parse(raw) as AppData;
    } catch {
      // corrupted snapshot — fall through to a fresh seed
    }
  }
  return buildSeedData();
}

/** Persists the current app data snapshot to localStorage. */
export function saveData(data: AppData): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(DATA_KEY, JSON.stringify(data));
  } catch {
    // storage full / unavailable — non-fatal for the demo
  }
}

/** Clears the persisted snapshot and returns a fresh seed (used by "reset demo"). */
export function resetDemoData(): AppData {
  const fresh = buildSeedData();
  saveData(fresh);
  return fresh;
}

/** The user whose session is active locally (a demo/UI preference). */
export function loadActiveUserId(): string | null {
  if (!hasStorage()) return null;
  return window.localStorage.getItem(ACTIVE_USER_KEY);
}

export function saveActiveUserId(userId: string): void {
  if (!hasStorage()) return;
  if (userId) window.localStorage.setItem(ACTIVE_USER_KEY, userId);
  else window.localStorage.removeItem(ACTIVE_USER_KEY);
}
