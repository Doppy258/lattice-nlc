import type { BusinessCategory } from "./Business";

/** Need types are category-scoped; the UI only offers those valid for a category. */
export type NeedType =
  | "lunch"
  | "cafeStudySpot"
  | "dessert"
  | "dinner"
  | "groupMeal"
  | "quickSnack"
  | "gift"
  | "clothing"
  | "books"
  | "thrift"
  | "schoolSupplies"
  | "homeItem"
  | "haircut"
  | "salonService"
  | "printing"
  | "alterations"
  | "tutoring"
  | "cleaning"
  | "gymTrial"
  | "dropInClass"
  | "sportsFacility"
  | "personalTraining"
  | "testPrep"
  | "workshop"
  | "studySpace"
  | "phoneRepair"
  | "laptopRepair"
  | "bikeRepair"
  | "clothingRepair"
  | "escapeRoom"
  | "arcade"
  | "movieActivity"
  | "localEvent"
  | "groupHangout";

export type PingRequestStatus = "draft" | "submitted" | "matched" | "expired";

export type PingRequest = {
  id: string;
  userId: string;
  category: BusinessCategory;
  needType: NeedType;
  budgetMin?: number;
  budgetMax?: number;
  distanceKm: number;
  /** ISO datetime strings bounding the desired availability window. */
  timeStart: string;
  timeEnd: string;
  preferences: string[];
  optionalNote?: string;
  verifiedHuman: boolean;
  status: PingRequestStatus;
  createdAt: string;
};
