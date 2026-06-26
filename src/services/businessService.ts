import type { Business, BusinessCategory, BusinessHours, GeoPoint, Offer } from "../models";
import { distanceKm } from "../utils/distance";
import { byNumber, byString } from "../utils/sorting";
import { createId } from "../utils/ids";
import { DEMO_ORIGINS } from "../data/catalog";

/** Fields a new owner supplies at onboarding; the rest get sensible defaults. */
export type BusinessInput = {
  name: string;
  category: BusinessCategory;
  address: string;
  description: string;
};

/** Default storefront hours — Mon–Sat, 9am–6pm — editable later on the Profile page. */
const DEFAULT_HOURS: BusinessHours[] = [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
  dayOfWeek,
  openTime: "09:00",
  closeTime: "18:00",
}));

/** Builds a new Business record from onboarding input. Does not persist. */
export function createBusiness(input: BusinessInput, ownerUserId: string, now = new Date()): Business {
  return {
    id: createId("biz"),
    name: input.name.trim(),
    category: input.category,
    description: input.description.trim(),
    address: input.address.trim(),
    location: DEMO_ORIGINS[0].location,
    hours: DEFAULT_HOURS,
    ratingAverage: 0,
    reviewCount: 0,
    verified: false,
    priceLevel: 2,
    tags: [],
    accessibilityFeatures: [],
    ownerUserId,
    createdAt: now.toISOString(),
  };
}

export type BusinessSort =
  | "category"
  | "highestRating"
  | "mostReviews"
  | "closest"
  | "activeDeals"
  | "alphabetical";

export type BusinessFilters = {
  query?: string;
  category?: BusinessCategory;
  minRating?: number;
  maxDistanceKm?: number;
  hasDeals?: boolean;
};

export function getBusinessById(id: string, businesses: Business[]): Business | undefined {
  return businesses.find((b) => b.id === id);
}

export function getActiveOffersForBusiness(
  businessId: string,
  offers: Offer[],
  now = new Date()
): Offer[] {
  return offers.filter(
    (o) => o.businessId === businessId && o.active && Date.parse(o.validUntil) >= now.getTime()
  );
}

export function activeDealCount(businessId: string, offers: Offer[], now = new Date()): number {
  return getActiveOffersForBusiness(businessId, offers, now).length;
}

export function distanceForBusiness(business: Business, origin: GeoPoint): number {
  return distanceKm(origin, business.location);
}

/** Applies search + category + rating + distance + deal filters. */
export function filterBusinesses(
  businesses: Business[],
  filters: BusinessFilters,
  offers: Offer[],
  origin: GeoPoint
): Business[] {
  const q = filters.query?.trim().toLowerCase();
  return businesses.filter((b) => {
    if (q && !`${b.name} ${b.description} ${b.tags.join(" ")}`.toLowerCase().includes(q)) {
      return false;
    }
    if (filters.category && b.category !== filters.category) return false;
    if (filters.minRating !== undefined && b.ratingAverage < filters.minRating) return false;
    if (
      filters.maxDistanceKm !== undefined &&
      distanceForBusiness(b, origin) > filters.maxDistanceKm
    ) {
      return false;
    }
    if (filters.hasDeals && activeDealCount(b.id, offers) === 0) return false;
    return true;
  });
}

/** Sorts a list of businesses by the chosen key. */
export function sortBusinesses(
  businesses: Business[],
  sort: BusinessSort,
  offers: Offer[],
  origin: GeoPoint,
  savedBusinessIds: string[] = []
): Business[] {
  const list = businesses.slice();
  switch (sort) {
    case "highestRating":
      return list.sort(byNumber((b) => b.ratingAverage, "desc"));
    case "mostReviews":
      return list.sort(byNumber((b) => b.reviewCount, "desc"));
    case "closest":
      return list.sort(byNumber((b) => distanceForBusiness(b, origin), "asc"));
    case "activeDeals":
      return list.sort(byNumber((b) => activeDealCount(b.id, offers), "desc"));
    case "category":
      return list.sort(byString((b) => b.category));
    case "alphabetical":
      return list.sort(byString((b) => b.name));
    default:
      void savedBusinessIds;
      return list;
  }
}
