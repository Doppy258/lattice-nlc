/**
 * Bridges the browser geolocation hook (`useGeolocation`) to the active user's
 * stored location, which is what every distance calculation is anchored to via
 * `getOriginPoint`.
 *
 * Every fresh GPS reading is written through to the active user, *overwriting*
 * any previously stored value. This is the important behaviour: it replaces the
 * old per-page `if (geolocation.location && !activeUser.location)` guard, which
 * only ever captured the *first* reading and then froze it forever. With that
 * guard, a stale or wrong position (e.g. one captured in another city, then
 * persisted to localStorage) could never be corrected — clicking "Share
 * location" again was a silent no-op, so distances stayed wrong no matter what.
 *
 * The write runs in an effect (not during render) so it doesn't update the app
 * provider while a page is rendering, and it skips redundant writes when the
 * reading hasn't actually moved, avoiding render loops.
 */

import { useEffect } from "react";
import { useApp } from "@/app/providers";
import { useGeolocation } from "./useGeolocation";

export function useUserLocation() {
  const { activeUser, setData } = useApp();
  const geo = useGeolocation();
  const fresh = geo.location;

  useEffect(() => {
    if (!fresh || !activeUser.id) return;
    const current = activeUser.location;
    // Skip if the stored location already matches this reading.
    if (current && current.lat === fresh.lat && current.lng === fresh.lng) return;
    setData((d) => ({
      ...d,
      users: d.users.map((u) =>
        u.id === activeUser.id ? { ...u, location: fresh } : u,
      ),
    }));
  }, [fresh, activeUser.id, activeUser.location, setData]);

  return geo;
}
