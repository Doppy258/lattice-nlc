// Seeds "claimed restaurant" history for a single customer account so demos that
// rely on past claims have data — notably the /rankings binary-insertion tier
// list and /reports impact page, which only show businesses the user has claimed.
//
// It signs in as the target user (to resolve their Supabase Auth uuid — claims
// are keyed by that uuid, and there is no profiles table to look it up in),
// then upserts one redeemed Lattice Pass per real San Antonio food business.
// Idempotent: claim ids are deterministic (`seedclaim_<uid8>_<slug>`), so
// re-running updates the same rows instead of duplicating.
//
// Usage (anon key + the account's own password is enough — claims RLS allows it):
//   SEED_EMAIL=zhaoleng@lattice.test SEED_PASSWORD='...' node scripts/seed-user-claims.mjs
//
// Optional env:
//   SEED_STATUS=redeemed|pending   (default redeemed — realistic past visits)
//   SEED_COUNT=14                  (how many food businesses to claim; default all 14)
//   SUPABASE_URL / SUPABASE_ANON_KEY  (override the values read from .env)

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function readEnvFile() {
  const env = {};
  try {
    for (const line of readFileSync(resolve(root, ".env"), "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) env[m[1]] = m[2].trim();
    }
  } catch {
    /* no .env — rely on process.env */
  }
  return env;
}

const fileEnv = readEnvFile();
const SUPABASE_URL = process.env.SUPABASE_URL || fileEnv.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || fileEnv.VITE_SUPABASE_ANON_KEY;
const EMAIL = process.env.SEED_EMAIL || "zhaoleng@lattice.test";
const PASSWORD = process.env.SEED_PASSWORD;
const STATUS = (process.env.SEED_STATUS || "redeemed").toLowerCase();
const COUNT = Number(process.env.SEED_COUNT || 14);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing Supabase config. Set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env (or SUPABASE_URL / SUPABASE_ANON_KEY).");
  process.exit(1);
}
if (!PASSWORD) {
  console.error("Missing SEED_PASSWORD. Run: SEED_EMAIL=" + EMAIL + " SEED_PASSWORD='...' node scripts/seed-user-claims.mjs");
  process.exit(1);
}
if (STATUS !== "redeemed" && STATUS !== "pending") {
  console.error(`SEED_STATUS must be "redeemed" or "pending" (got "${STATUS}").`);
  process.exit(1);
}

// The real San Antonio food businesses from the seed catalog (curated so we skip
// junk/test rows like "asd"). Ordered for a varied tier list when ranked.
const FOOD_BUSINESSES = [
  "biz_mitierra", "biz_lapanaderia", "biz_rosarios", "biz_bakerylorraine",
  "biz_guenther", "biz_schilos", "biz_commonwealth", "biz_rays",
  "biz_lick", "biz_southerleigh", "biz_halcyon", "biz_smokeshack",
  "biz_kimura", "biz_dough",
];

const DAY_MS = 24 * 60 * 60 * 1000;
const randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

async function main() {
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });

  // 1. Resolve the user's uuid by signing in (no profiles table to query).
  const { data: auth, error: authErr } = await sb.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  if (authErr || !auth?.user) {
    console.error(`Sign-in failed for ${EMAIL}: ${authErr?.message ?? "no user returned"}`);
    process.exit(1);
  }
  const userId = auth.user.id;
  console.log(`Signed in as ${EMAIL} -> ${userId}`);

  const targets = FOOD_BUSINESSES.slice(0, Math.max(1, COUNT));

  // 2. Pull the businesses (for owner ids) and their offers.
  const { data: bizRows, error: bizErr } = await sb
    .from("businesses").select("id,name,owner_user_id").in("id", targets);
  if (bizErr) { console.error("Failed to read businesses:", bizErr.message); process.exit(1); }
  const bizById = new Map((bizRows ?? []).map((b) => [b.id, b]));

  const { data: offerRows, error: offerErr } = await sb
    .from("offers").select("id,business_id,active").in("business_id", targets);
  if (offerErr) { console.error("Failed to read offers:", offerErr.message); process.exit(1); }
  const offerByBiz = new Map();
  for (const o of offerRows ?? []) {
    const cur = offerByBiz.get(o.business_id);
    if (!cur || (o.active && !cur.active)) offerByBiz.set(o.business_id, o); // prefer an active offer
  }

  // 3. Build one claim per business. Deterministic id => idempotent re-runs.
  const usedCodes = new Set();
  const uniqueCode = () => { let c; do { c = String(randInt(100000, 999999)); } while (usedCodes.has(c)); usedCodes.add(c); return c; };
  const uid8 = userId.replace(/-/g, "").slice(0, 8);

  const rows = [];
  const skipped = [];
  targets.forEach((bizId, i) => {
    const biz = bizById.get(bizId);
    const offer = offerByBiz.get(bizId);
    if (!biz || !offer) { skipped.push(`${bizId} (${!biz ? "no business" : "no offer"})`); return; }

    // Spread visits across the last ~3 months so the impact savings-by-month chart fills in.
    const createdAt = new Date(Date.now() - (i * 6 + randInt(2, 5)) * DAY_MS);
    const expiresAt = new Date(createdAt.getTime() + 5 * 60 * 1000); // 5-min window
    const code = uniqueCode();
    const slug = bizId.replace(/^biz_/, "");

    const row = {
      id: `seedclaim_${uid8}_${slug}`,
      user_id: userId,
      offer_id: offer.id,
      business_id: bizId,
      claim_code: code,
      token: `seedpass_${uid8}_${slug}_${randInt(100000, 999999)}`,
      backup_code: code,
      status: STATUS,
      created_at: createdAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      redeemed_at: STATUS === "redeemed" ? new Date(createdAt.getTime() + randInt(1, 4) * 60 * 1000).toISOString() : null,
      approved_by_business_user_id: STATUS === "redeemed" ? (biz.owner_user_id ?? null) : null,
    };
    rows.push(row);
  });

  if (rows.length === 0) {
    console.error("Nothing to seed (no matching businesses/offers found).");
    process.exit(1);
  }

  // 4. Upsert.
  const { error: upErr } = await sb.from("claims").upsert(rows, { onConflict: "id" });
  if (upErr) { console.error("Upsert failed:", upErr.message); process.exit(1); }

  console.log(`\nUpserted ${rows.length} ${STATUS} claim(s) for ${EMAIL}:`);
  for (const r of rows) console.log(`   ${r.business_id.padEnd(20)} offer=${r.offer_id}  code=${r.backup_code}`);
  if (skipped.length) console.log(`\nSkipped: ${skipped.join(", ")}`);

  // 5. Verify what the app will now see for this user in the food category.
  const { data: check } = await sb.from("claims").select("business_id").eq("user_id", userId);
  const distinct = new Set((check ?? []).map((c) => c.business_id));
  console.log(`\n${EMAIL} now has claims on ${distinct.size} distinct businesses total.`);
  console.log("Reload the app (signed in as this user) and open /rankings — the food tab will be ready to rank.");
}

main().catch((e) => { console.error(e); process.exit(1); });
