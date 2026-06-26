/** The seven top-level business categories used across matching and browsing. */
export type BusinessCategory =
  | "food"
  | "retail"
  | "services"
  | "fitness"
  | "education"
  | "repair"
  | "entertainment";

/** A simple lat/lng pair. Coordinates are seeded; no live geolocation is used. */
export type GeoPoint = {
  lat: number;
  lng: number;
};

/**
 * Opening hours for a single day of the week.
 * `dayOfWeek` is 0 (Sunday) through 6 (Saturday) to match `Date.getDay()`.
 * Times are 24h "HH:MM" strings so they sort and compare lexicographically.
 */
export type BusinessHours = {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
};

export type Business = {
  id: string;
  name: string;
  category: BusinessCategory;
  description: string;
  address: string;
  location: GeoPoint;
  hours: BusinessHours[];
  ratingAverage: number;
  reviewCount: number;
  verified: boolean;
  /** 1 ($) to 4 ($$$$). */
  priceLevel: 1 | 2 | 3 | 4;
  tags: string[];
  accessibilityFeatures: string[];
  /** Square logo / profile picture (Supabase Storage public URL). */
  imageUrl?: string;
  /** Wide storefront banner (Supabase Storage public URL). */
  bannerUrl?: string;
  ownerUserId: string;
  createdAt: string;
};
