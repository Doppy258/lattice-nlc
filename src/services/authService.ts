import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import type { User } from "../models";

export type AuthError = { message: string };

const DEFAULT_METADATA = {
  role: "customer",
  homeLocationId: "origin_school",
  onboarded: false,
  preferredCategories: [] as string[],
  maxDefaultDistanceKm: 3,
  studentDiscountPreferred: false,
  accessibilityNeeds: [] as string[],
  savedBusinessIds: [] as string[],
  savedOfferIds: [] as string[],
};

/** Build a User from a Supabase Auth session's metadata (no public users table needed). */
export function userFromSession(s: Session): User {
  const m = s.user.user_metadata ?? {};
  const onboarded =
    m.onboarded === true ||
    m.onboarded === "true" ||
    m.onboarded === 1 ||
    m.onboarding_complete === true ||
    m.onboarding_complete === "true" ||
    m.onboarding_complete === 1;
  return {
    id: s.user.id,
    name: m.name ?? s.user.email?.split("@")[0] ?? "User",
    email: s.user.email ?? "",
    role: m.role ?? "customer",
    homeLocationId: m.homeLocationId ?? "origin_school",
    verified: false,
    createdAt: s.user.created_at ?? new Date().toISOString(),
    preferences: {
      preferredCategories: m.preferredCategories ?? [],
      maxDefaultDistanceKm: m.maxDefaultDistanceKm ?? 3,
      studentDiscountPreferred: m.studentDiscountPreferred ?? false,
      accessibilityNeeds: m.accessibilityNeeds ?? [],
      savedBusinessIds: m.savedBusinessIds ?? [],
      savedOfferIds: m.savedOfferIds ?? [],
    },
    onboarded,
  };
}

export async function signUp(
  email: string,
  password: string,
  displayName: string,
  recaptchaToken: string
): Promise<{ user: SupabaseUser | null; session: Session | null; error: AuthError | null }> {
  if (!supabase) {
    return { user: null, session: null, error: { message: "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env." } };
  }

  const options: Record<string, unknown> = {
    data: { name: displayName, ...DEFAULT_METADATA },
  };
  if (recaptchaToken) options.captchaToken = recaptchaToken;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options,
  });

  if (error) {
    console.error("Supabase signup error:", error);
    return { user: null, session: null, error: { message: error.message } };
  }

  if (data.session) {
    return { user: data.user, session: data.session, error: null };
  }

  // No session returned (email confirmation likely enabled). Try signing in
  // immediately so the user lands in the app without requiring email verification.
  const signInResult = await signIn(email, password);
  if (signInResult.session) return signInResult;

  return {
    user: data.user,
    session: null,
    error: { message: "Account created! Check your email for a confirmation link before signing in." },
  };
}

export async function signIn(
  email: string,
  password: string
): Promise<{ user: SupabaseUser | null; session: Session | null; error: AuthError | null }> {
  if (!supabase) {
    return { user: null, session: null, error: { message: "Supabase is not configured." } };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error("Supabase signin error:", error);
    return { user: null, session: null, error: { message: error.message } };
  }
  return { user: data.user, session: data.session, error: null };
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function listenAuth(callback: (session: Session | null) => void): () => void {
  if (!supabase) {
    callback(null);
    return () => {};
  }
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => subscription.unsubscribe();
}

/** Save onboarding preferences to Supabase Auth metadata so they survive page reload. */
export async function saveOnboardingMetadata(
  updates: Partial<User>
): Promise<{ session: Session | null; error: AuthError | null }> {
  if (!supabase) return { session: null, error: null };

  const metadata = {
    onboarded: true,
    ...(updates.role ? { role: updates.role } : {}),
    ...(updates.homeLocationId ? { homeLocationId: updates.homeLocationId } : {}),
    ...(updates.preferences ?? {}),
  };

  const { data, error } = await supabase.auth.updateUser({
    data: {
      ...metadata,
    },
  });

  if (error) {
    console.error("Supabase onboarding metadata error:", error);
    return { session: null, error: { message: error.message } };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session && data.user
    ? { ...sessionData.session, user: data.user }
    : sessionData.session;

  return { session, error: null };
}
