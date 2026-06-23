import type { AppData, CollectionName } from "../models";
import { buildSeedData } from "../data/seed";

const STORAGE_KEY = "lattice.appData.v1";
const ACTIVE_USER_KEY = "lattice.activeUserId.v1";
const ACTIVE_BUSINESS_KEY = "lattice.activeBusinessId.v1";

/** Empty/typed default in case any collection is missing after a bad load. */
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

function hasStorage(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

/**
 * Loads persisted app data. On first run (or after a reset) the seeded dataset
 * is generated relative to "now" and saved so subsequent loads are stable.
 */
export function loadData(): AppData {
  if (!hasStorage()) return buildSeedData();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = buildSeedData();
    saveData(seeded);
    return seeded;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<AppData>;
    // Merge over an empty shape so a newly-added collection never reads as undefined.
    return { ...emptyData(), ...parsed };
  } catch {
    const seeded = buildSeedData();
    saveData(seeded);
    return seeded;
  }
}

export function saveData(data: AppData): void {
  if (!hasStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** Wipes persisted state and re-seeds. Returns the fresh dataset. */
export function resetDemoData(): AppData {
  const seeded = buildSeedData();
  saveData(seeded);
  return seeded;
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

export function loadActiveUserId(): string | null {
  if (!hasStorage()) return null;
  return window.localStorage.getItem(ACTIVE_USER_KEY);
}

export function saveActiveUserId(userId: string): void {
  if (!hasStorage()) return;
  window.localStorage.setItem(ACTIVE_USER_KEY, userId);
}

/** The business an owner is currently managing (Phase 4). */
export function loadActiveBusinessId(): string | null {
  if (!hasStorage()) return null;
  return window.localStorage.getItem(ACTIVE_BUSINESS_KEY);
}

export function saveActiveBusinessId(businessId: string | null): void {
  if (!hasStorage()) return;
  if (businessId) window.localStorage.setItem(ACTIVE_BUSINESS_KEY, businessId);
  else window.localStorage.removeItem(ACTIVE_BUSINESS_KEY);
}
