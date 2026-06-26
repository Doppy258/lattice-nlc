import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppData, BusinessCategory, NeedType } from "@/models";
import { supabase as defaultClient } from "@/services/supabaseClient";
import * as M from "./mappers";
import { throwIfError } from "./errors";

type C = SupabaseClient;

const client = (c?: C): C => {
  const x = c ?? defaultClient;
  if (!x) throw new Error("Supabase is not configured.");
  return x as C;
};

const one = <T,>(data: unknown): T => (Array.isArray(data) ? (data[0] as T) : (data as T));

export async function hydrateAppData(c: C, selfUserId: string): Promise<AppData> {
  const cl = client(c);
  const [profilesSelf, pub, biz, off, claims, reviews, requests] = await Promise.all([
    cl.from("profiles").select("*"),
    cl.from("public_profiles").select("*"),
    cl.from("businesses").select("*"),
    cl.from("offers").select("*"),
    cl.from("claims").select("*"),
    cl.from("reviews").select("*"),
    cl.from("requests").select("*"),
  ]);
  for (const r of [profilesSelf, pub, biz, off, claims, reviews, requests]) throwIfError(r.error);

  const selfUsers = (profilesSelf.data ?? []).map((r) => M.rowToProfile(r as M.ProfileRow));
  const selfIds = new Set(selfUsers.map((u) => u.id));
  const others = (pub.data ?? [])
    .filter((p) => !selfIds.has((p as M.PublicProfileRow).id))
    .map((r) => M.publicRowToUser(r as M.PublicProfileRow));

  void selfUserId; // self rows already come from the profiles select (RLS scopes it to the caller)
  return {
    users: [...selfUsers, ...others],
    businesses: (biz.data ?? []).map((r) => M.rowToBusiness(r as M.BusinessRow)),
    offers: (off.data ?? []).map((r) => M.rowToOffer(r as M.OfferRow)),
    claims: (claims.data ?? []).map((r) => M.rowToClaim(r as M.ClaimRow)),
    reviews: (reviews.data ?? []).map((r) => M.rowToReview(r as M.ReviewRow)),
    requests: (requests.data ?? []).map((r) => M.rowToRequest(r as M.RequestRow)),
    rankings: [],
    savedBusinesses: [],
    savedOffers: [],
  };
}

export const claimRepo = {
  async create(offerId: string, c?: C) {
    const { data, error } = await client(c).rpc("create_claim", { p_offer_id: offerId });
    throwIfError(error);
    return M.rowToClaim(one<M.ClaimRow>(data));
  },
  async redeem(code: string, c?: C) {
    const { data, error } = await client(c).rpc("redeem_claim", { p_code: code });
    throwIfError(error);
    return M.rowToClaim(one<M.ClaimRow>(data));
  },
};

export type RequestSubmitInput = {
  category: BusinessCategory; needType: NeedType; distanceKm: number; timeStart: string; timeEnd: string;
  budgetMin?: number; budgetMax?: number; preferences: string[]; optionalNote?: string; verifiedHuman: boolean;
};

export const requestRepo = {
  async submit(input: RequestSubmitInput, c?: C) {
    const { data, error } = await client(c).rpc("submit_request", {
      p_category: input.category, p_need_type: input.needType, p_distance_km: input.distanceKm,
      p_time_start: input.timeStart, p_time_end: input.timeEnd, p_budget_min: input.budgetMin ?? null,
      p_budget_max: input.budgetMax ?? null, p_preferences: input.preferences ?? [],
      p_optional_note: input.optionalNote ?? null, p_verified_human: input.verifiedHuman ?? false,
    });
    throwIfError(error);
    return M.rowToRequest(one<M.RequestRow>(data));
  },
};

export const reviewRepo = {
  async create(claimId: string, rating: number, text: string, tags: string[] = [], c?: C) {
    const { data, error } = await client(c).rpc("create_review", {
      p_claim_id: claimId, p_rating: rating, p_text: text, p_tags: tags,
    });
    throwIfError(error);
    return M.rowToReview(one<M.ReviewRow>(data));
  },
};

export const profileRepo = {
  async updateSelf(userId: string, patch: Partial<M.ProfileRow>, c?: C) {
    const { data, error } = await client(c).from("profiles").update(patch).eq("id", userId).select().single();
    throwIfError(error);
    return M.rowToProfile(data as M.ProfileRow);
  },
};
