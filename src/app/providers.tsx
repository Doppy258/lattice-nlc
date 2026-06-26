import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import type { AppData, Business, User } from "../models";
import {
  loadDataAsync,
  loadDataFromSupabase,
} from "../services/storageService";
import {
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut,
  listenAuth,
  findOrCreateLocalUser,
} from "../services/authService";
import { expireOldClaims } from "../services/claimService";
import { getUserById } from "../services/userService";
import { isSupabaseConfigured } from "../services/supabaseClient";
import {
  upsertUser,
  upsertClaims,
  insertReview,
  upsertRanking,
  insertSavedBusiness,
  deleteSavedBusiness,
  insertSavedOffer,
  deleteSavedOffer,
} from "../services/dbService";

type DataUpdater = AppData | ((prev: AppData) => AppData);

export type AuthState = "loading" | "unauthenticated" | "authenticated";

type AppContextValue = {
  data: AppData;
  activeUserId: string;
  activeUser: User;
  setData: (updater: DataUpdater) => void;
  ownedBusinesses: Business[];
  activeBusinessId: string | null;
  activeBusiness: Business | null;
  setActiveBusinessId: (id: string) => void;
  authState: AuthState;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, displayName: string, recaptchaToken: string) => Promise<string | null>;
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
  onboardingComplete: false,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<AppData>(EMPTY_DATA);
  const [activeUserId, setActiveUserIdState] = useState<string>("");
  const [activeBusinessId, setActiveBusinessIdState] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [dataLoaded, setDataLoaded] = useState(false);

  const dataRef = useRef<AppData>(EMPTY_DATA);
  dataRef.current = data;

  // Load empty data on mount — no Supabase queries until auth
  useEffect(() => {
    loadDataAsync().then((loaded) => {
      const withExpired = { ...loaded, claims: expireOldClaims(loaded.claims) };
      dataRef.current = withExpired;
      setDataState(withExpired);
      setDataLoaded(true);
    });
  }, []);

  // Auth + data loading.
  // Keeps authState "loading" until session is resolved AND data
  // is fetched from Supabase (so no 403s for unauthenticated users).
  const handleSessionRef = useRef<(s: Session | null) => void>(() => {});
  handleSessionRef.current = (s: Session | null) => {
    setSession(s);
    if (s?.user) {
      // Don't set authState yet — load data first
      loadDataFromSupabase().then((dbData) => {
        const baseData = dbData ?? dataRef.current;
        const { users, userId } = findOrCreateLocalUser(
          baseData,
          s.user.id,
          s.user.email ?? "",
          s.user.user_metadata?.name ?? s.user.email?.split("@")[0] ?? "User"
        );
        const merged = { ...baseData, users };
        dataRef.current = merged;
        setDataState(merged);
        setActiveUserIdState(userId);
        setAuthState("authenticated");
      });
    } else if (s === null && isSupabaseConfigured) {
      setAuthState("unauthenticated");
    } else if (!isSupabaseConfigured) {
      setAuthState("authenticated");
    }
  };

  // Auth: only after data loaded
  useEffect(() => {
    if (!dataLoaded) return;

    if (!isSupabaseConfigured) {
      if (dataRef.current.users.length > 0 && !activeUserId) {
        setActiveUserIdState(dataRef.current.users[0].id);
        setAuthState("authenticated");
      }
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

  const setActiveBusinessId = useCallback((id: string) => setActiveBusinessIdState(id), []);

  const activeUser = useMemo(
    () => getUserById(activeUserId, data.users) ?? data.users[0] ?? FALLBACK_USER,
    [activeUserId, data.users]
  );

  const ownedBusinesses = useMemo(
    () => data.businesses.filter((b) => b.ownerUserId === activeUser?.id),
    [data.businesses, activeUser?.id]
  );

  // Set active business to first owned on change
  useEffect(() => {
    const valid = activeBusinessId && ownedBusinesses.some((b) => b.id === activeBusinessId);
    if (!valid) setActiveBusinessIdState(ownedBusinesses[0]?.id ?? null);
  }, [ownedBusinesses, activeBusinessId]);

  const activeBusiness = useMemo(
    () => ownedBusinesses.find((b) => b.id === activeBusinessId) ?? null,
    [ownedBusinesses, activeBusinessId]
  );

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { session: s, error } = await authSignIn(email, password);
    if (error) return error.message;
    if (s) handleSessionRef.current(s);
    return null;
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string, recaptchaToken: string): Promise<string | null> => {
    const { session: s, error } = await authSignUp(email, password, displayName, recaptchaToken);
    if (error) return error.message;
    if (s) handleSessionRef.current(s);
    return null;
  }, []);

  const signOutAction = useCallback(async () => {
    await authSignOut();
    setSession(null);
    setAuthState("unauthenticated");
    setActiveUserIdState("");
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
      return { ...prev, users: updatedUsers };
    });
  }, [activeUserId]);

  // ── Sync current user's data to Supabase ─────────────────────
  const prevDataRef = useRef<AppData>(EMPTY_DATA);

  useEffect(() => {
    if (!dataLoaded) return;
    if (!isSupabaseConfigured || !session?.user) {
      prevDataRef.current = data;
      return;
    }

    const uid = session.user.id;
    const prev = prevDataRef.current;

    // User profile
    const prevUser = prev.users.find((u) => u.id === uid);
    const curUser = data.users.find((u) => u.id === uid);
    if (curUser && JSON.stringify(prevUser) !== JSON.stringify(curUser)) {
      upsertUser(curUser);
    }

    // Claims
    const prevClaims = prev.claims.filter((c) => c.userId === uid);
    const curClaims = data.claims.filter((c) => c.userId === uid);
    if (JSON.stringify(prevClaims) !== JSON.stringify(curClaims) && curClaims.length > 0) {
      upsertClaims(curClaims);
    }

    // Reviews (only insert new ones)
    const prevReviews = prev.reviews.filter((r) => r.userId === uid);
    const curReviews = data.reviews.filter((r) => r.userId === uid);
    if (curReviews.length > 0 && JSON.stringify(prevReviews) !== JSON.stringify(curReviews)) {
      for (const review of curReviews) {
        if (!prevReviews.some((p) => p.id === review.id)) {
          insertReview(review);
        }
      }
    }

    // Rankings
    const prevRankings = prev.rankings.filter((r) => r.userId === uid);
    const curRankings = data.rankings.filter((r) => r.userId === uid);
    if (JSON.stringify(prevRankings) !== JSON.stringify(curRankings)) {
      for (const ranking of curRankings) {
        const prevRank = prevRankings.find(
          (p) => p.category === ranking.category && p.needType === ranking.needType
        );
        if (!prevRank || JSON.stringify(prevRank) !== JSON.stringify(ranking)) {
          upsertRanking(ranking);
        }
      }
    }

    // Saved businesses (detect adds & deletes)
    const prevSavedBiz = prev.savedBusinesses.filter((s) => s.userId === uid);
    const curSavedBiz = data.savedBusinesses.filter((s) => s.userId === uid);
    if (JSON.stringify(prevSavedBiz) !== JSON.stringify(curSavedBiz)) {
      const prevIds = new Set(prevSavedBiz.map((s) => s.businessId));
      const curIds = new Set(curSavedBiz.map((s) => s.businessId));
      for (const saved of prevSavedBiz) {
        if (!curIds.has(saved.businessId)) deleteSavedBusiness(uid, saved.businessId);
      }
      for (const saved of curSavedBiz) {
        if (!prevIds.has(saved.businessId)) insertSavedBusiness(saved);
      }
    }

    // Saved offers (detect adds & deletes)
    const prevSavedOffers = prev.savedOffers.filter((s) => s.userId === uid);
    const curSavedOffers = data.savedOffers.filter((s) => s.userId === uid);
    if (JSON.stringify(prevSavedOffers) !== JSON.stringify(curSavedOffers)) {
      const prevIds = new Set(prevSavedOffers.map((s) => s.offerId));
      const curIds = new Set(curSavedOffers.map((s) => s.offerId));
      for (const saved of prevSavedOffers) {
        if (!curIds.has(saved.offerId)) deleteSavedOffer(uid, saved.offerId);
      }
      for (const saved of curSavedOffers) {
        if (!prevIds.has(saved.offerId)) insertSavedOffer(saved);
      }
    }

    prevDataRef.current = data;
  }, [data, session, dataLoaded]);

  const value = useMemo(
    () => ({
      data,
      activeUserId,
      activeUser,
      setData,
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
