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
import type { AppData, Business, User, UserRole } from "../models";
import {
  loadDataAsync,
  loadDataFromSupabase,
} from "../services/storageService";
import {
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut,
  listenAuth,
  userFromSession,
  saveOnboardingMetadata,
} from "../services/authService";
import { expireOldClaims } from "../services/claimService";
import { getUserById } from "../services/userService";
import { isSupabaseConfigured } from "../services/supabaseClient";
import {
  upsertClaims,
  insertReview,
  upsertBusiness,
  upsertOffer,
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
  signUp: (email: string, password: string, displayName: string, recaptchaToken: string, role?: UserRole) => Promise<string | null>;
  signOut: () => Promise<void>;
  completeOnboarding: (updates: Partial<User>) => Promise<string | null>;
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
  const [data, setDataState] = useState<AppData>(EMPTY_DATA);
  const [activeUserId, setActiveUserIdState] = useState<string>("");
  const [activeBusinessId, setActiveBusinessIdState] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [dataLoaded, setDataLoaded] = useState(false);

  const dataRef = useRef<AppData>(EMPTY_DATA);
  const locallyOnboardedUserIdsRef = useRef(new Set<string>());
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
      loadDataFromSupabase().then((dbData) => {
        const sessionUser = userFromSession(s);
        const existingUser = getUserById(sessionUser.id, dataRef.current.users);
        const hasLocalOnboarding = locallyOnboardedUserIdsRef.current.has(sessionUser.id);
        const shouldPreserveOnboarding =
          sessionUser.onboarded || existingUser?.onboarded || hasLocalOnboarding;
        const user = shouldPreserveOnboarding
          ? {
              ...sessionUser,
              ...existingUser,
              preferences: {
                ...sessionUser.preferences,
                ...(existingUser?.preferences ?? {}),
              },
              onboarded: true,
            }
          : sessionUser;
        const baseData = dbData ?? dataRef.current;
        const merged = { ...baseData, users: [user] };
        dataRef.current = merged;
        setDataState(merged);
        setActiveUserIdState(user.id);
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

  const signUp = useCallback(async (email: string, password: string, displayName: string, recaptchaToken: string, role: UserRole = "customer"): Promise<string | null> => {
    const { session: s, error } = await authSignUp(email, password, displayName, recaptchaToken, role);
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

  const completeOnboarding = useCallback(async (updates: Partial<User>): Promise<string | null> => {
    const previousUser = activeUser;
    const targetUserId = activeUserId || activeUser.id;
    locallyOnboardedUserIdsRef.current.add(targetUserId);
    const nextUser: User = {
      ...activeUser,
      ...updates,
      preferences: { ...activeUser.preferences, ...(updates.preferences ?? {}) },
      onboarded: true,
    };

    setDataState((prev) => {
      const hasUser = prev.users.some((u) => u.id === targetUserId);
      const updatedUsers = hasUser
        ? prev.users.map((u) => (u.id === targetUserId ? nextUser : u))
        : [nextUser, ...prev.users];
      const next = { ...prev, users: updatedUsers };
      dataRef.current = next;
      return next;
    });
    setActiveUserIdState(targetUserId);

    const { session: refreshedSession, error } = await saveOnboardingMetadata(updates);
    if (error) {
      locallyOnboardedUserIdsRef.current.delete(targetUserId);
      setDataState((prev) => {
        const revertedUsers = prev.users.map((u) => (u.id === targetUserId ? previousUser : u));
        const next = { ...prev, users: revertedUsers };
        dataRef.current = next;
        return next;
      });
      return error.message;
    }

    if (refreshedSession) {
      handleSessionRef.current(refreshedSession);
    }

    return null;
  }, [activeUser, activeUserId]);

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

    const ownedBusinessIds = new Set(
      data.businesses.filter((b) => b.ownerUserId === uid).map((b) => b.id),
    );

    // Claims/pass approvals owned by the user or by one of their businesses.
    const canSyncClaim = (c: AppData["claims"][number]) =>
      c.userId === uid || ownedBusinessIds.has(c.businessId);
    const prevClaims = prev.claims.filter(canSyncClaim);
    const curClaims = data.claims.filter(canSyncClaim);
    if (JSON.stringify(prevClaims) !== JSON.stringify(curClaims) && curClaims.length > 0) {
      upsertClaims(curClaims);
    }

    // Offers owned by the user's businesses, including redemption counts.
    const canSyncOffer = (o: AppData["offers"][number]) => ownedBusinessIds.has(o.businessId);
    const prevOffers = prev.offers.filter(canSyncOffer);
    const curOffers = data.offers.filter(canSyncOffer);
    if (JSON.stringify(prevOffers) !== JSON.stringify(curOffers)) {
      for (const offer of curOffers) {
        const before = prevOffers.find((p) => p.id === offer.id);
        if (!before || JSON.stringify(before) !== JSON.stringify(offer)) {
          upsertOffer(offer);
        }
      }
    }

    // Businesses owned by the user (profile edits, new storefronts, logo/banner).
    const prevOwnedBiz = prev.businesses.filter((b) => b.ownerUserId === uid);
    const curOwnedBiz = data.businesses.filter((b) => b.ownerUserId === uid);
    if (JSON.stringify(prevOwnedBiz) !== JSON.stringify(curOwnedBiz)) {
      for (const business of curOwnedBiz) {
        const before = prevOwnedBiz.find((b) => b.id === business.id);
        if (!before || JSON.stringify(before) !== JSON.stringify(business)) {
          upsertBusiness(business);
        }
      }
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

    // Persist derived rating fields after verified review submission.
    if (prev.businesses.length > 0) {
      for (const business of data.businesses) {
        const before = prev.businesses.find((b) => b.id === business.id);
        if (
          before &&
          (before.ratingAverage !== business.ratingAverage || before.reviewCount !== business.reviewCount)
        ) {
          upsertBusiness(business);
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
