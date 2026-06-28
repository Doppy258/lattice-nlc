/**
 * Browser-geolocation hook used by the request flow to auto-fill the user's
 * current location for distance-based ranking. Falls back gracefully when the
 * API is unavailable or the user denies permission.
 *
 * It also tracks the browser's geolocation *permission* (granted / denied /
 * prompt) so the UI can offer an "enable location" button whenever access
 * isn't already granted — even if we previously stored a location but the
 * user has since revoked the browser permission.
 */

import { useState, useEffect, useCallback } from "react";
import type { GeoPoint } from "../models";

export type GeoPermission = "granted" | "denied" | "prompt" | "unknown";

type GeolocationState = {
  location: GeoPoint | null;
  error: string | null;
  loading: boolean;
  permission: GeoPermission;
};

/** Returns the current position (on demand, not on mount) plus loading/error/permission state. */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: false,
    permission: "unknown",
  });

  // Watch the browser permission and keep it in sync — including live updates
  // when the user changes it from the browser's site settings.
  useEffect(() => {
    if (!navigator.permissions?.query) return;
    let active = true;
    let status: PermissionStatus | null = null;
    const sync = () => {
      if (active && status) {
        setState((prev) => ({ ...prev, permission: status!.state as GeoPermission }));
      }
    };
    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((s) => {
        status = s;
        sync();
        s.addEventListener("change", sync);
      })
      .catch(() => {
        /* Permissions API unsupported for geolocation — leave as "unknown". */
      });
    return () => {
      active = false;
      status?.removeEventListener("change", sync);
    };
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        location: null,
        error: "Geolocation not supported by your browser",
        loading: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState((prev) => ({
          ...prev,
          location: { lat: position.coords.latitude, lng: position.coords.longitude },
          error: null,
          loading: false,
          permission: "granted",
        }));
      },
      (err) => {
        setState((prev) => ({
          ...prev,
          error: err.message,
          loading: false,
          permission: err.code === err.PERMISSION_DENIED ? "denied" : prev.permission,
        }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  }, []);

  return { ...state, requestLocation };
}
