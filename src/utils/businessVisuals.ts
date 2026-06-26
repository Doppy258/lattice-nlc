/**
 * businessVisuals - deterministic visual helpers for business display.
 * Purpose: Generates consistent images (picsum), letter grades based on
 * rating, pseudo-random social-proof numbers (saved-by count, friend
 * avatars) that are stable per business ID — no external state needed.
 * Key exports: businessImageUrl, businessGrade, savedByCount, friendAvatarUrl
 */
import type { Business, BusinessCategory } from "../models";

const CATEGORY_SEEDS: Record<BusinessCategory, string> = {
  food: "street-food-market",
  retail: "boutique-shelf",
  services: "studio-counter",
  fitness: "bright-gym",
  education: "study-desk",
  repair: "workbench-tools",
  entertainment: "local-night",
};

const CATEGORY_GRADES: Record<BusinessCategory, string> = {
  food: "A",
  retail: "B",
  services: "A",
  fitness: "A",
  education: "SS",
  repair: "B",
  entertainment: "S",
};

export function businessImageUrl(business: Business): string {
  const seed = `${CATEGORY_SEEDS[business.category]}-${business.id}`;
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/900/520`;
}

export function businessGrade(business: Business): string {
  if (business.ratingAverage >= 4.8) return "SS+";
  if (business.ratingAverage >= 4.6) return "S";
  return CATEGORY_GRADES[business.category];
}

export function savedByCount(id: string): number {
  const total = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return (total % 4) + 1;
}

export function friendAvatarUrl(id: string, index: number): string {
  return `https://i.pravatar.cc/64?u=${encodeURIComponent(`${id}-${index}`)}`;
}
