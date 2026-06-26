import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import type { AppData, Business, User, UserPreferences, UserRole } from "../models";
import { DEFAULT_USER_ID } from "../data/seed";
import {
  loadActiveBusinessId,
  loadActiveUserId,
  loadData,
  loadDataFromSupabase,
  resetDemoData,
  saveActiveBusinessId,
  saveActiveUserId,
  saveData,
} from "../services/storageService";
import {
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut,
  getSession,
  listenAuth,
  userFromSession,
} from "../services/authService";
import { expireOldClaims } from "../services/claimService";
import { getUserById } from "../services/userService";
import { isSupabaseConfigured } from "../services/supabaseClient";

type DataUpdater = AppData | ((prev: AppData) => AppData);
export type AuthState = "loading" | "unauthenticated" | "authenticated";

const DEFAULT_PREFS: UserPreferences = {
  preferredCategories: [],
  maxDefaultDistanceKm: 3,
  studentDiscountPreferred: false,
  accessibilityNeeds: [],
  savedBusinessIds: [],
  savedOfferIds: [],
};

/** Safety fallback so `activeUser` is always defined, even before seed loads. */
const FALLBACK_USER: User = {
  id: "",
  name: "",
  email: "",
  role: "customer",
  homeLocationId: "origin_school",
  verified: false,
  createdAt: "",
  preferences: DEFAULT_PREFS,
  onboarded: false,
};

type AppContextValue = {
  data: AppData;
  activeUserId: string;
  activeUser: User;
  setData: (updater: DataUpdater) => void;
  resetDemo: () => void;
  ownedBusinesses: Business[];
  activeBusinessId: string | null;
  activeBusiness: Business | null;
  setActiveBusinessId: (id: string) => void;
  authState: AuthState;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    recaptchaToken: string,
    role?: UserRole,
  ) => Promise<string | null>;
  signOut: () => Promise<void>;
  completeOnboarding: (updates: Partial<User>) => Promise<string | null>;
};

function mergeById<T extends { id: string }>(base: T[], live: T[]): T[] {
  const byId = new Map(base.map((x) => [x.id, x]));
  for (const x of live) byId.set(x.id, x);
  return [...byId.values()];
}

function mergeByKey<T>(base: T[], live: T[], key: (x: T) => string): T[] {
  const byKey = new Map(base.map((x) => [key(x), x]));
  for (const x of live) byKey.set(key(x), x);
  return [...byKey.values()];
}

/**
 * Overlays live Supabase records onto the local/seed snapshot so data created by
 * anyone (e.g. a business created in another browser) becomes visible. Live wins
 * on conflicts; seed/local entries with no live counterpart are preserved.
 */
function mergeLiveData(base: AppData, live: AppData): AppData {
  return {
    users: mergeById(base.users, live.users),
    businesses: mergeById(base.businesses, live.businesses),
    offers: mergeById(base.offers, live.offers),
    requests: mergeById(base.requests, live.requests),
    claims: mergeById(base.claims, live.claims),
    reviews: mergeById(base.reviews, live.reviews),
    rankings: mergeByKey(base.rankings, live.rankings, (r) => `${r.userId}:${r.category}:${r.needType ?? ""}`),
    savedBusinesses: mergeByKey(base.savedBusinesses, live.savedBusinesses, (s) => `${s.userId}:${s.businessId}`),
    savedOffers: mergeByKey(base.savedOffers, live.savedOffers, (s) => `${s.userId}:${s.offerId}`),
  };
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<AppData>(() => {
    const loaded = loadData();
    return { ...loaded, claims: expireOldClaims(loaded.claims) };
  });
  const [activeUserId, setActiveUserIdState] = useState<string>(
    () => loadActiveUserId() ?? DEFAULT_USER_ID,
  );
  const [activeBusinessId, setActiveBusinessIdState] = useState<string | null>(
    () => loadActiveBusinessId(),
  );
  const [session, setSession] = useState<Session | null>(null);
  const [authState, setAuthState] = useState<AuthState>(
    isSupabaseConfigured ? "loading" : "authenticated",
  );

  // Persist local snapshot + active selections.
  useEffect(() => {
    saveData(data);
  }, [data]);
  useEffect(() => {
    saveActiveUserId(activeUserId);
  }, [activeUserId]);
  useEffect(() => {
    saveActiveBusinessId(activeBusinessId);
  }, [activeBusinessId]);

  const setData = useCallback((updater: DataUpdater) => {
    setDataState((prev) => (typeof updater === "function" ? updater(prev) : updater));
  }, []);

  const resetDemo = useCallback(() => {
    setDataState(resetDemoData());
    setActiveUserIdState(DEFAULT_USER_ID);
  }, []);

  // When Supabase is configured, reflect its session into the local user list.
  const handleSession = useCallback((s: Session | null) => {
    setSession(s);
    if (s?.user) {
      const user = userFromSession(s);
      setDataState((prev) =>
        prev.users.some((u) => u.id === user.id)
          ? prev
          : { ...prev, users: [...prev.users, user] },
      );
      setActiveUserIdState(user.id);
      setAuthState("authenticated");
    } else if (isSupabaseConfigured) {
      setAuthState("unauthenticated");
    } else {
      setAuthState("authenticated");
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthState("authenticated");
      return;
    }
    getSession().then((s) => handleSession(s));
    const unsub = listenAuth((s) => handleSession(s));
    return unsub;
  }, [handleSession]);

  // Pull shared records from Supabase and overlay them on the local/seed data,
  // so a business (or offer) created in one browser is visible in every other.
  // Re-runs when auth settles so a freshly signed-in customer sees live data.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    loadDataFromSupabase().then((live) => {
      if (cancelled || !live) return;
      setDataState((prev) => {
        const merged = mergeLiveData(prev, live);
        return { ...merged, claims: expireOldClaims(merged.claims) };
      });
    });
    return () => {
      cancelled = true;
    };
  }, [authState]);

  const setActiveBusinessId = useCallback((id: string) => setActiveBusinessIdState(id), []);

  const activeUser = useMemo(
    () => getUserById(activeUserId, data.users) ?? data.users[0] ?? FALLBACK_USER,
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

  const signIn = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      const { session: s, error } = await authSignIn(email, password);
      if (error) return error.message;
      if (s) handleSession(s);
      return null;
    },
    [handleSession],
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
      recaptchaToken: string,
      role: UserRole = "customer",
    ): Promise<string | null> => {
      const { session: s, error } = await authSignUp(email, password, displayName, recaptchaToken, role);
      if (error) return error.message;
      if (s) handleSession(s);
      return null;
    },
    [handleSession],
  );

  const signOutAction = useCallback(async () => {
    await authSignOut();
    setSession(null);
    setActiveUserIdState(DEFAULT_USER_ID);
    setAuthState(isSupabaseConfigured ? "unauthenticated" : "authenticated");
  }, []);

  const completeOnboarding = useCallback(
    async (updates: Partial<User>): Promise<string | null> => {
      setDataState((prev) => {
        const users = prev.users.map((u) =>
          u.id === activeUserId
            ? {
                ...u,
                ...updates,
                preferences: { ...u.preferences, ...(updates.preferences ?? {}) },
                onboarded: true,
              }
            : u,
        );
        return { ...prev, users };
      });
      return null;
    },
    [activeUserId],
  );

  const value = useMemo(
    () => ({
      data,
      activeUserId,
      activeUser,
      setData,
      resetDemo,
      ownedBusinesses,
      activeBusinessId,
      activeBusiness,
      setActiveBusinessId,
      authState,
      session,
      signIn,
      signUp,
      signOut: signOutAction,
      completeOnboarding,
    }),
    [
      data,
      activeUserId,
      activeUser,
      setData,
      resetDemo,
      ownedBusinesses,
      activeBusinessId,
      activeBusiness,
      setActiveBusinessId,
      authState,
      session,
      signIn,
      signUp,
      signOutAction,
      completeOnboarding,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
}
