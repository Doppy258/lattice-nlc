/**
 * supabaseClient - Supabase client initialisation.
 * Purpose: Conditionally creates the Supabase client from environment
 * variables (with a hardcoded fallback URL). Exports the client instance
 * (null when not configured) and a helper to check connectivity.
 * Key exports: supabase, isSupabaseConfigured, requireSupabase, checkSupabaseConnection
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const FALLBACK_SUPABASE_URL = "https://nzasnhmpcyxsgwpdxwni.supabase.co";
const forceDemoMode = import.meta.env.VITE_FORCE_DEMO_MODE === "true";

const supabaseUrl =
  forceDemoMode
    ? ""
    : import.meta.env.VITE_SUPABASE_URL ||
      import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
      FALLBACK_SUPABASE_URL;

const supabaseAnonKey =
  forceDemoMode
    ? ""
    : import.meta.env.VITE_SUPABASE_ANON_KEY ||
      import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env."
    );
  }
  return supabase;
}

export async function checkSupabaseConnection(): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.auth.getSession();
  return !error;
}
