import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import type { AppData, Business, User, UserPreferences } from "../models";
import { loadActiveBusinessId, saveActiveBusinessId } from "../services/storageService";
import {
  signIn as authSignIn, signUp as authSignUp, signOut as authSignOut, getSession, listenAuth,
} from "../services/authService";
import { expireOldClaims } from "../services/claimService";
import { getUserById } from "../services/userService";
import { isSupabaseConfigured, supabase } from "../services/supabaseClient";
import { hydrateAppData, profileRepo } from "../repositories";

type DataUpdater = AppData | ((prev: AppData) => AppData);
export type AuthState = "loading" | "unauthenticated" | "authenticated";

const DEFAULT_PREFS: UserPreferences = {
  preferredCategories: [], maxDefaultDistanceKm: 3, studentDiscountPreferred: false,
  accessibilityNeeds: [], savedBusinessIds: [], savedOfferIds: [],
};
const EMPTY_DATA: AppData = {
  users: [], businesses: [], offers: [], requests: [], claims: [], reviews: [],
  rankings: [], savedBusinesses: [], savedOffers: [],
};
const GUEST_USER: User = {
  id: "", name: "", email: "", role: "customer", homeLocationId: "origin_school",
  verified: false, createdAt: "", preferences: DEFAULT_PREFS, onboardingComplete: false,
};

type AppContextValue = {
  data: AppData;
  activeUserId: string;
  activeUser: User;
  setActiveUserId: (id: string) => void;
  setData: (updater: DataUpdater) => void;
  refetch: () => Promise<void>;
  ownedBusinesses: Business[];
  activeBusinessId: string | null;
  activeBusiness: Business | null;
  setActiveBusinessId: (id: string) => void;
  authState: AuthState;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, displayName: string, recaptchaToken: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  completeOnboarding: (updates: Partial<User>) => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<AppData>(EMPTY_DATA);
  const [activeUserId, setActiveUserIdState] = useState<string>("");
  const [activeBusinessId, setActiveBusinessIdState] = useState<string | null>(() => loadActiveBusinessId());
  const [session, setSession] = useState<Session | null>(null);
  const [authState, setAuthState] = useState<AuthState>("loading");

  useEffect(() => { saveActiveBusinessId(activeBusinessId); }, [activeBusinessId]);

  const hydrate = useCallback(async (userId: string) => {
    if (!supabase) return;
    const fresh = await hydrateAppData(supabase, userId);
    setDataState({ ...fresh, claims: expireOldClaims(fresh.claims) });
  }, []);

  const handleSession = useCallback(async (s: Session | null) => {
    setSession(s);
    if (s?.user) {
      setActiveUserIdState(s.user.id);
      try {
        await hydrate(s.user.id);
      } catch (e) {
        toast.error("Could not load your data. Please refresh.");
        console.error(e);
      }
      setAuthState("authenticated");
    } else {
      setActiveUserIdState("");
      setDataState(EMPTY_DATA);
      setAuthState("unauthenticated");
    }
  }, [hydrate]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthState("unauthenticated");
      return;
    }
    getSession().then((s) => handleSession(s));
    const unsub = listenAuth((s) => handleSession(s));
    return unsub;
  }, [handleSession]);

  const setData = useCallback((updater: DataUpdater) => {
    setDataState((prev) => (typeof updater === "function" ? updater(prev) : updater));
  }, []);
  const refetch = useCallback(async () => {
    if (activeUserId) await hydrate(activeUserId);
  }, [activeUserId, hydrate]);
  const setActiveUserId = useCallback((id: string) => setActiveUserIdState(id), []);
  const setActiveBusinessId = useCallback((id: string) => setActiveBusinessIdState(id), []);

  const activeUser = useMemo(
    () => getUserById(activeUserId, data.users) ?? data.users[0] ?? GUEST_USER,
    [activeUserId, data.users],
  );
  const ownedBusinesses = useMemo(
    () => data.businesses.filter((b) => b.ownerUserId === activeUser.id),
    [data.businesses, activeUser.id],
  );
  useEffect(() => {
    const valid = activeBusinessId && ownedBusinesses.some((b) => b.id === activeBusinessId);
    if (!valid) setActiveBusinessIdState(ownedBusinesses[0]?.id ?? null);
  }, [ownedBusinesses, activeBusinessId]);
  const activeBusiness = useMemo(
    () => ownedBusinesses.find((b) => b.id === activeBusinessId) ?? null,
    [ownedBusinesses, activeBusinessId],
  );

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { session: s, error } = await authSignIn(email, password);
    if (error) return error.message;
    if (s) await handleSession(s);
    return null;
  }, [handleSession]);

  const signUp = useCallback(async (email: string, password: string, displayName: string, recaptchaToken: string): Promise<string | null> => {
    const { session: s, error } = await authSignUp(email, password, displayName, recaptchaToken);
    if (error) return error.message;
    if (s) await handleSession(s);
    return null;
  }, [handleSession]);

  const signOutAction = useCallback(async () => {
    await authSignOut();
    setSession(null);
    setActiveUserIdState("");
    setDataState(EMPTY_DATA);
    setAuthState("unauthenticated");
  }, []);

  const completeOnboarding = useCallback(async (updates: Partial<User>) => {
    if (!activeUserId) return;
    const mergedPrefs = { ...activeUser.preferences, ...(updates.preferences ?? {}) };
    try {
      const updated = await profileRepo.updateSelf(activeUserId, {
        name: updates.name ?? activeUser.name,
        home_location_id: updates.homeLocationId ?? activeUser.homeLocationId,
        preferences: mergedPrefs,
        onboarding_complete: true,
      });
      setDataState((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u.id === activeUserId ? updated : u)),
      }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save your preferences.");
    }
  }, [activeUserId, activeUser]);

  const value = useMemo<AppContextValue>(() => ({
    data, activeUserId, activeUser, setActiveUserId, setData, refetch,
    ownedBusinesses, activeBusinessId, activeBusiness, setActiveBusinessId,
    authState, session, signIn, signUp, signOut: signOutAction, completeOnboarding,
  }), [
    data, activeUserId, activeUser, setActiveUserId, setData, refetch,
    ownedBusinesses, activeBusinessId, activeBusiness, setActiveBusinessId,
    authState, session, signIn, signUp, signOutAction, completeOnboarding,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
}
