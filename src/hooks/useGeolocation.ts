import { useState, useCallback } from "react";
import type { GeoPoint } from "../models";

type GeolocationState = {
  location: GeoPoint | null;
  error: string | null;
  loading: boolean;
};

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: false,
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState({ location: null, error: "Geolocation not supported by your browser", loading: false });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          location: { lat: position.coords.latitude, lng: position.coords.longitude },
          error: null,
          loading: false,
        });
      },
      (err) => {
        setState((prev) => ({ ...prev, error: err.message, loading: false }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  }, []);

  return { ...state, requestLocation };
}
