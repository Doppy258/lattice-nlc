import type { GeoPoint } from "../models";

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
};

export async function geocodeAddress(address: string): Promise<GeoPoint | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "LatticeNLC/1.0" },
    });
    if (!res.ok) return null;
    const data: NominatimResult[] = await res.json();
    if (data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}
