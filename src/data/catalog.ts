import type { BusinessCategory, GeoPoint, NeedType, OfferType } from "../models";

/** Seeded distance origins (no live geolocation). Oakville, ON coordinates. */
export type DemoOrigin = { id: string; name: string; location: GeoPoint };

export const DEMO_ORIGINS: DemoOrigin[] = [
  {
    id: "origin_school",
    name: "White Oaks Secondary School",
    location: { lat: 43.4459, lng: -79.6877 },
  },
  {
    id: "origin_downtown",
    name: "Downtown Oakville",
    location: { lat: 43.4452, lng: -79.667 },
  },
];

export type CategoryMeta = {
  label: string;
  description: string;
  /** Key consumed by the icon component to render a line icon. */
  icon: string;
};

export const CATEGORY_META: Record<BusinessCategory, CategoryMeta> = {
  food: { label: "Food", description: "Meals, cafes, and treats nearby", icon: "food" },
  retail: { label: "Retail", description: "Gifts, books, clothing, and more", icon: "retail" },
  services: { label: "Services", description: "Haircuts, printing, tutoring", icon: "services" },
  fitness: { label: "Fitness", description: "Gyms, classes, and training", icon: "fitness" },
  education: { label: "Education", description: "Tutoring, prep, and study space", icon: "education" },
  repair: { label: "Repair", description: "Phones, laptops, bikes, clothing", icon: "repair" },
  entertainment: { label: "Entertainment", description: "Activities, events, hangouts", icon: "entertainment" },
};

export const ALL_CATEGORIES = Object.keys(CATEGORY_META) as BusinessCategory[];

/** Human-readable labels for each offer type (business offer builder). */
export const OFFER_TYPE_LABELS: Record<OfferType, string> = {
  discount: "Discount",
  limitedTime: "Limited-time deal",
  studentOffer: "Student offer",
  groupOffer: "Group offer",
  appointmentSlot: "Appointment slot",
  event: "Event",
  freeTrial: "Free trial",
  bundle: "Bundle",
};

export const ALL_OFFER_TYPES = Object.keys(OFFER_TYPE_LABELS) as OfferType[];

export const NEED_TYPE_LABELS: Record<NeedType, string> = {
  lunch: "Lunch",
  cafeStudySpot: "Cafe / study spot",
  dessert: "Dessert",
  dinner: "Dinner",
  groupMeal: "Group meal",
  quickSnack: "Quick snack",
  gift: "Gift",
  clothing: "Clothing",
  books: "Books",
  thrift: "Thrift item",
  schoolSupplies: "School supplies",
  homeItem: "Home item",
  haircut: "Haircut",
  salonService: "Salon service",
  printing: "Printing",
  alterations: "Alterations",
  tutoring: "Tutoring",
  cleaning: "Cleaning",
  gymTrial: "Gym trial",
  dropInClass: "Drop-in class",
  sportsFacility: "Sports facility",
  personalTraining: "Personal training",
  testPrep: "Test prep",
  workshop: "Workshop",
  studySpace: "Study space",
  phoneRepair: "Phone repair",
  laptopRepair: "Laptop repair",
  bikeRepair: "Bike repair",
  clothingRepair: "Clothing repair",
  escapeRoom: "Escape room",
  arcade: "Arcade",
  movieActivity: "Movie / activity",
  localEvent: "Local event",
  groupHangout: "Group hangout",
};

export const NEED_TYPES_BY_CATEGORY: Record<BusinessCategory, NeedType[]> = {
  food: ["lunch", "cafeStudySpot", "dessert", "dinner", "groupMeal", "quickSnack"],
  retail: ["gift", "clothing", "books", "thrift", "schoolSupplies", "homeItem"],
  services: ["haircut", "salonService", "printing", "alterations", "tutoring", "cleaning"],
  fitness: ["gymTrial", "dropInClass", "sportsFacility", "personalTraining"],
  education: ["tutoring", "testPrep", "workshop", "studySpace"],
  repair: ["phoneRepair", "laptopRepair", "bikeRepair", "clothingRepair"],
  entertainment: ["escapeRoom", "arcade", "movieActivity", "localEvent", "groupHangout"],
};

export const DISTANCE_OPTIONS_KM = [1, 3, 5, 10] as const;

export type TimeWindowPreset = {
  id: "now" | "afterSchool" | "tonight" | "tomorrow" | "thisWeekend" | "custom";
  label: string;
};

export const TIME_WINDOW_PRESETS: TimeWindowPreset[] = [
  { id: "now", label: "Now" },
  { id: "afterSchool", label: "After school" },
  { id: "tonight", label: "Tonight" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "thisWeekend", label: "This weekend" },
  { id: "custom", label: "Custom" },
];

export type PreferenceOption = {
  id: string;
  label: string;
  /** If omitted, the preference applies to every category. */
  categories?: BusinessCategory[];
};

export const PREFERENCE_OPTIONS: PreferenceOption[] = [
  { id: "studentDiscount", label: "Student discount" },
  { id: "openNow", label: "Open now" },
  { id: "highlyRated", label: "Highly rated only" },
  { id: "verifiedOnly", label: "Verified businesses only" },
  { id: "groupFriendly", label: "Group-friendly" },
  { id: "wheelchairAccessible", label: "Wheelchair accessible" },
  { id: "quiet", label: "Quiet environment", categories: ["food", "education", "services"] },
  { id: "vegetarian", label: "Vegetarian options", categories: ["food"] },
  { id: "fastService", label: "Fast service", categories: ["food", "services", "repair"] },
  { id: "under30", label: "Under 30 minutes", categories: ["food", "services", "repair"] },
];

/** Budget chip presets per need type, with a sensible per-category fallback. */
export function budgetPresetsFor(needType: NeedType): Array<{ label: string; min?: number; max?: number }> {
  const map: Partial<Record<NeedType, Array<{ label: string; min?: number; max?: number }>>> = {
    lunch: [
      { label: "Under $10", max: 10 },
      { label: "Under $15", max: 15 },
      { label: "Under $20", max: 20 },
      { label: "No budget" },
    ],
    haircut: [
      { label: "$20 to $30", min: 20, max: 30 },
      { label: "$30 to $45", min: 30, max: 45 },
      { label: "$45+", min: 45 },
    ],
    phoneRepair: [
      { label: "Under $50", max: 50 },
      { label: "$50 to $100", min: 50, max: 100 },
      { label: "$100+", min: 100 },
    ],
    gift: [
      { label: "Under $15", max: 15 },
      { label: "Under $25", max: 25 },
      { label: "Under $50", max: 50 },
    ],
  };
  return (
    map[needType] ?? [
      { label: "Under $15", max: 15 },
      { label: "Under $25", max: 25 },
      { label: "Under $50", max: 50 },
      { label: "No budget" },
    ]
  );
}
