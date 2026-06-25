import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import type { AppData, User } from "../models";
import { createId } from "../utils/ids";

export type AuthError = { message: string };

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
    data: { name: displayName },
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

export function createLocalUser(supabaseUserId: string, email: string, name: string): User {
  return {
    id: supabaseUserId,
    name,
    email,
    role: "customer",
    homeLocationId: "origin_school",
    verified: false,
    createdAt: new Date().toISOString(),
    preferences: {
      preferredCategories: [],
      maxDefaultDistanceKm: 3,
      studentDiscountPreferred: false,
      accessibilityNeeds: [],
      savedBusinessIds: [],
      savedOfferIds: [],
    },
    onboardingComplete: false,
  };
}

export function findOrCreateLocalUser(data: AppData, supabaseUserId: string, email: string, name: string): { users: User[]; userId: string } {
  const existing = data.users.find((u) => u.id === supabaseUserId);
  if (existing) return { users: data.users, userId: existing.id };

  const newUser = createLocalUser(supabaseUserId, email, name);
  return { users: [...data.users, newUser], userId: newUser.id };
}
