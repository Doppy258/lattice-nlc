/**
 * Saved/bookmarked items are tracked as their own collections (separate from
 * the boolean id lists on UserPreferences) so the Saved page can sort by
 * "recently saved" and attach personal tags.
 */
export type SavedBusiness = {
  userId: string;
  businessId: string;
  savedAt: string;
  tags: string[];
};

export type SavedOffer = {
  userId: string;
  offerId: string;
  savedAt: string;
};
