import type { AppData, CollectionName } from "../models";
import { fetchAllData } from "./dbService";
import { isSupabaseConfigured } from "./supabaseClient";

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
