/**
 * LatticeMap — Leaflet map that pins the user's location and nearby
 * businesses. Renders a radius circle when `radiusKm` is provided.
 * Markers re-render on location/business changes; the map instance is
 * initialised once and reused via ref. Cleanup on unmount.
 */
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GeoPoint } from "@/models";

type MapBusiness = {
  id: string;
  name: string;
  location: GeoPoint;
  /** 1-based position in the matches list, shown on the pin and its hover label. */
  rank?: number;
};

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ESCAPES[c]);

const USER_ICON = L.divIcon({
  className: "lattice-pin lattice-pin--user",
  html: `<div class="lattice-pin__inner lattice-pin__inner--user"></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

/** A numbered business pin; styling + hover animation live in globals.css. */
const bizIcon = (rank: number) =>
  L.divIcon({
    className: "lattice-pin",
    html: `<div class="lattice-pin__inner">${rank}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

export function LatticeMap({
  userLocation,
  businesses,
  radiusKm,
  onBusinessClick,
  highlightedId,
  onHoverBusiness,
}: {
  userLocation: GeoPoint | null;
  businesses: MapBusiness[];
  radiusKm?: number;
  onBusinessClick?: (businessId: string) => void;
  /** Business id to render in the active/highlighted state (driven by card hover). */
  highlightedId?: string | null;
  /** Fires with a business id while a pin is hovered, and null when it leaves. */
  onHoverBusiness?: (businessId: string | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup>(L.layerGroup());
  const markerByIdRef = useRef<Map<string, L.Marker>>(new Map());
  const circleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center = userLocation ?? businesses[0]?.location ?? { lat: 29.4241, lng: -98.4936 };

    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom: 14,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>",
      maxZoom: 19,
    }).addTo(map);

    markersRef.current.addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const group = markersRef.current;
    group.clearLayers();
    markerByIdRef.current.clear();

    if (userLocation) {
      L.marker([userLocation.lat, userLocation.lng], { icon: USER_ICON, zIndexOffset: 1000 })
        .addTo(group)
        .bindTooltip("You are here", {
          direction: "top",
          offset: [0, -10],
          className: "lattice-tip",
          opacity: 1,
        });
    }

    businesses.forEach((b, i) => {
      const rank = b.rank ?? i + 1;
      const marker = L.marker([b.location.lat, b.location.lng], { icon: bizIcon(rank) })
        .addTo(group)
        .bindTooltip(
          `<span class="lattice-tip__rank">#${rank}</span>${escapeHtml(b.name)}`,
          { direction: "top", offset: [0, -8], className: "lattice-tip", opacity: 1 },
        );
      marker.on("mouseover", () => onHoverBusiness?.(b.id));
      marker.on("mouseout", () => onHoverBusiness?.(null));
      if (onBusinessClick) {
        marker.on("click", () => onBusinessClick(b.id));
      }
      markerByIdRef.current.set(b.id, marker);
    });

    const map = mapRef.current;
    if (!map) return;

    if (circleRef.current) {
      map.removeLayer(circleRef.current);
      circleRef.current = null;
    }

    if (userLocation && radiusKm) {
      circleRef.current = L.circle([userLocation.lat, userLocation.lng], {
        radius: radiusKm * 1000,
<<<<<<< HEAD
        color: "#2563eb",
        fillColor: "#2563eb",
=======
        color: "#2352de",
        fillColor: "#2352de",
>>>>>>> de7766ac840f51fe3477c146fca301d5b923dbc9
        fillOpacity: 0.08,
        weight: 2,
        opacity: 0.3,
      }).addTo(map);
    }

    const allPoints = [
      ...(userLocation ? [userLocation] : []),
      ...businesses.map((b) => b.location),
    ];

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [userLocation, businesses, radiusKm]);

  // Reflect the externally-driven highlight (an offer card being hovered) onto
  // the matching pin: add the active class and surface its name tooltip.
  useEffect(() => {
    markerByIdRef.current.forEach((marker, id) => {
      const el = marker.getElement();
      const active = id === highlightedId;
      if (el) el.classList.toggle("lattice-pin--active", active);
      if (active) marker.openTooltip();
      else marker.closeTooltip();
    });
  }, [highlightedId, businesses]);

  return (
    <div
      ref={containerRef}
      className="h-[350px] w-full overflow-hidden rounded-2xl border border-border"
      style={{ zIndex: 0, position: "relative" }}
    />
  );
}
