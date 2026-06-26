import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GeoPoint } from "@/models";

type MapBusiness = {
  id: string;
  name: string;
  location: GeoPoint;
};

const USER_ICON = L.divIcon({
  className: "",
  html: `<div style="width:32px;height:32px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:white;">U</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const BIZ_ICON = L.divIcon({
  className: "",
  html: `<div style="width:28px;height:28px;border-radius:50%;background:#059669;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;">B</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export function LatticeMap({
  userLocation,
  businesses,
  radiusKm,
  onBusinessClick,
}: {
  userLocation: GeoPoint | null;
  businesses: MapBusiness[];
  radiusKm?: number;
  onBusinessClick?: (businessId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup>(L.layerGroup());
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

    if (userLocation) {
      L.marker([userLocation.lat, userLocation.lng], { icon: USER_ICON })
        .addTo(group)
        .bindPopup("You are here");
    }

    for (const b of businesses) {
      const marker = L.marker([b.location.lat, b.location.lng], { icon: BIZ_ICON })
        .addTo(group)
        .bindPopup(`<strong>${b.name}</strong><br/><span style="font-size:12px;color:#2563eb;cursor:pointer">View business →</span>`);
      if (onBusinessClick) {
        marker.on("click", () => onBusinessClick(b.id));
      }
    }

    const map = mapRef.current;
    if (!map) return;

    if (circleRef.current) {
      map.removeLayer(circleRef.current);
      circleRef.current = null;
    }

    if (userLocation && radiusKm) {
      circleRef.current = L.circle([userLocation.lat, userLocation.lng], {
        radius: radiusKm * 1000,
        color: "#2563eb",
        fillColor: "#2563eb",
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

  return (
    <div
      ref={containerRef}
      className="h-[350px] w-full overflow-hidden rounded-2xl border border-border"
      style={{ zIndex: 0, position: "relative" }}
    />
  );
}
