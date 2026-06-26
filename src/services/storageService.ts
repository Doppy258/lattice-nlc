const ACTIVE_BUSINESS_KEY = "lattice.activeBusinessId.v1";

function hasStorage(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

/** The business an owner is currently managing (a local UI preference). */
export function loadActiveBusinessId(): string | null {
  if (!hasStorage()) return null;
  return window.localStorage.getItem(ACTIVE_BUSINESS_KEY);
}

export function saveActiveBusinessId(businessId: string | null): void {
  if (!hasStorage()) return;
  if (businessId) window.localStorage.setItem(ACTIVE_BUSINESS_KEY, businessId);
  else window.localStorage.removeItem(ACTIVE_BUSINESS_KEY);
}
