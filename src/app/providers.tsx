import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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
import { expireOldClaims } from "../services/claimService";
import { getUserById } from "../services/userService";

type DataUpdater = AppData | ((prev: AppData) => AppData);

type AppContextValue = {
  data: AppData;
  activeUserId: string;
  activeUser: User;
  setActiveUserId: (id: string) => void;
  setData: (updater: DataUpdater) => void;
  resetDemo: () => void;
  /** Businesses owned by the active user (empty for customers). */
  ownedBusinesses: Business[];
  /** The business the owner is currently managing, or null if none. */
  activeBusinessId: string | null;
  activeBusiness: Business | null;
  setActiveBusinessId: (id: string) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

/** Loads persisted state, refreshes claim statuses, and persists on change. */
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

  const setActiveUserId = useCallback((id: string) => setActiveUserIdState(id), []);
  const setActiveBusinessId = useCallback((id: string) => setActiveBusinessIdState(id), []);

  const resetDemo = useCallback(() => {
    const fresh = resetDemoData();
    setDataState(fresh);
    setActiveUserIdState(DEFAULT_USER_ID);
    setActiveBusinessIdState(null);
  }, []);

  const activeUser = useMemo(
    () => getUserById(activeUserId, data.users) ?? data.users[0],
    [activeUserId, data.users]
  );

  const ownedBusinesses = useMemo(
    () => data.businesses.filter((b) => b.ownerUserId === activeUser.id),
    [data.businesses, activeUser.id]
  );

  // Keep the managed business valid for the active owner: default to their first
  // business and recover if a persisted id belongs to a different account.
  useEffect(() => {
    const valid = activeBusinessId && ownedBusinesses.some((b) => b.id === activeBusinessId);
    if (!valid) setActiveBusinessIdState(ownedBusinesses[0]?.id ?? null);
  }, [ownedBusinesses, activeBusinessId]);

  const activeBusiness = useMemo(
    () => ownedBusinesses.find((b) => b.id === activeBusinessId) ?? null,
    [ownedBusinesses, activeBusinessId]
  );

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
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
}
