// Creates the two demo auth users on ANY environment via the Admin API.
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-auth-users.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const users = [
  { email: "demo.customer@lattice.test", password: "Demo1234!", name: "Demo Customer", role: "customer" },
  { email: "demo.owner@lattice.test", password: "Demo1234!", name: "Demo Owner", role: "businessOwner" },
];

for (const u of users) {
  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
    user_metadata: { name: u.name },
  });
  if (error && !String(error.message).includes("already")) {
    console.error(u.email, error.message);
    continue;
  }
  const id = data?.user?.id;
  if (id && u.role !== "customer") {
    await admin.from("profiles").update({ role: u.role, verified: true }).eq("id", id);
  }
  console.log("ok:", u.email);
}
console.log("Done. Now run the CONTENT portion of supabase/seed.sql against the hosted DB.");
