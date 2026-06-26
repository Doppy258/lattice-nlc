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
import type { AppData, Business, User } from "../models";
import { DEFAULT_USER_ID } from "../data/seed";
import {
  loadActiveBusinessId,
  loadActiveUserId,
  loadData,
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
  findOrCreateLocalUser,
} from "../services/authService";
import { expireOldClaims } from "../services/claimService";
import { getUserById } from "../services/userService";
import { isSupabaseConfigured } from "../services/supabaseClient";

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
  setData: (updater: DataUpdater) => void;
  resetDemo: () => void;
  ownedBusinesses: Business[];
  activeBusinessId: string | null;
  activeBusiness: Business | null;
  setActiveBusinessId: (id: string) => void;
  authState: AuthState;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, displayName: string, recaptchaToken: string, role?: UserRole) => Promise<string | null>;
  signOut: () => Promise<void>;
  completeOnboarding: (updates: Partial<User>) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

const EMPTY_DATA: AppData = { users: [], businesses: [], offers: [], requests: [], claims: [], reviews: [], rankings: [], savedBusinesses: [], savedOffers: [] };

const FALLBACK_USER: User = {
  id: "",
  name: "",
  email: "",
  role: "customer",
  homeLocationId: "origin_school",
  verified: false,
  createdAt: "",
  preferences: {
    preferredCategories: [],
    maxDefaultDistanceKm: 5,
    studentDiscountPreferred: false,
    accessibilityNeeds: [],
    savedBusinessIds: [],
    savedOfferIds: [],
  },
  onboarded: false,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<AppData>(() => {
    const loaded = loadData();
    return { ...loaded, claims: expireOldClaims(loaded.claims) };
  });
  const [activeUserId, setActiveUserIdState] = useState<string>(
    () => loadActiveUserId() ?? DEFAULT_USER_ID
  );
  const [activeBusinessId, setActiveBusinessIdState] = useState<string | null>(
    () => loadActiveBusinessId()
  );
  const [session, setSession] = useState<Session | null>(null);
  const [authState, setAuthState] = useState<AuthState>("loading");

  useEffect(() => {
    saveData(data);
  }, [data]);

  useEffect(() => {
    saveActiveUserId(activeUserId);
  }, [activeUserId]);

  useEffect(() => {
    saveActiveBusinessId(activeBusinessId);
  }, [activeBusinessId]);

  const handleSession = useCallback((s: Session | null) => {
    setSession(s);
    if (s?.user) {
      const { users, userId } = findOrCreateLocalUser(
        loadData(),
        s.user.id,
        s.user.email ?? "",
        s.user.user_metadata?.name ?? s.user.email?.split("@")[0] ?? "User"
      );
      setDataState((prev) => ({ ...prev, users }));
      setActiveUserIdState(userId);
      setAuthState("authenticated");
    } else if (s === null && isSupabaseConfigured) {
      setAuthState("unauthenticated");
    } else {
      setAuthState("authenticated");
    }
  }, []);

  // Auth: only after data loaded
  useEffect(() => {
    if (!dataLoaded) return;

    if (!isSupabaseConfigured) {
      setAuthState("authenticated");
      return;
    }

    const unsub = listenAuth((s) => handleSessionRef.current(s));
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoaded]);

  // setData: update React state only. Supabase persistence
  // is handled by the sync effect below.
  const setData = useCallback((updater: DataUpdater) => {
    setDataState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      return next;
    });
  }, []);

  const setActiveUserId = useCallback((id: string) => setActiveUserIdState(id), []);
  const setActiveBusinessId = useCallback((id: string) => setActiveBusinessIdState(id), []);

  const activeUser = useMemo(
    () => getUserById(activeUserId, data.users) ?? data.users[0],
    [activeUserId, data.users]
  );
  const ownedBusinesses = useMemo(
    () => data.businesses.filter((b) => b.ownerUserId === activeUser.id),
    [data.businesses, activeUser.id]
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
    if (s) handleSession(s);
    return null;
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string, recaptchaToken: string, role: UserRole = "customer"): Promise<string | null> => {
    const { session: s, error } = await authSignUp(email, password, displayName, recaptchaToken, role);
    if (error) return error.message;
    if (s) handleSession(s);
    return null;
  }, []);

  const signOutAction = useCallback(async () => {
    await authSignOut();
    setSession(null);
    setActiveUserIdState("");
    setDataState(EMPTY_DATA);
    setAuthState("unauthenticated");
    setActiveUserIdState(DEFAULT_USER_ID);
  }, []);

  const completeOnboarding = useCallback((updates: Partial<User>) => {
    setDataState((prev) => {
      const updatedUsers = prev.users.map((u) =>
        u.id === activeUserId
          ? {
              ...u,
              ...updates,
              preferences: { ...u.preferences, ...(updates.preferences ?? {}) },
              onboardingComplete: true,
            }
          : u
      );
      saveData({ ...prev, users: updatedUsers });
      return { ...prev, users: updatedUsers };
    });
  }, [activeUserId]);

  const value = useMemo(
    () => ({
      data,
      activeUserId,
      activeUser,
      setActiveUserId,
      setData,
      resetDemo,
      ownedBusinesses,
      activeBusinessId,
      activeBusiness,
      setActiveBusinessId,
      authState,
      session,
      signIn,
      signUp: signUp,
      signOut: signOutAction,
      completeOnboarding,
    }),
    [
      data,
      activeUserId,
      activeUser,
      setActiveUserId,
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
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
}
