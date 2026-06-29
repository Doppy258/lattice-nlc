# Lattice NLC — 4-Minute Demo Script

A **3-act, 2-swap** demo across two laptops (one business, one customer).
Total runtime **~4:05**.

> **Why this order?** Rankings and Reviews only populate from *past*
> claims/redemptions — so they have to come after a claim, and they lean on the
> customer account's seeded history (not the one claim you do live).

---

## ⏱ At a glance

| Time      | Laptop      | Do this                                  |
|-----------|-------------|------------------------------------------|
| 0:00–0:05 | —           | One-line hook                            |
| 0:05–0:35 | 🏢 Business | Create an offer                          |
| 0:35–0:40 | 🔄          | **Swap to customer** (reload it)         |
| 0:40–1:10 | 💻 Customer | Create a Lattice (structured request)    |
| 1:10–1:35 | 💻 Customer | Matches — ranked list + map              |
| 1:35–2:00 | 💻 Customer | Claim → Lattice Pass (read code aloud)   |
| 2:00–2:20 | 💻 Customer | Rankings — tier list                     |
| 2:20–2:40 | 💻 Customer | Impact report                            |
| 2:40–2:45 | 🔄          | **Swap to business**                     |
| 2:45–3:15 | 🏢 Business | Redeem the pass (type the code)          |
| 3:15–3:30 | 🏢 Business | Reviews                                  |
| 3:30–3:50 | 🏢 Business | Dashboard + Analytics                    |

---

## 🎬 ACT 1 — Business sets up  ·  🏢 Business laptop

### B1 · Create an offer — `/create-offer` · **0:30**
- Fill: title, **discount type** (fixed / percent / amount-off), validity window, redemption limit, student-only toggle, image.
- The **live OfferCard preview** updates as you type. Save.
- 🗣 *"This is exactly what a customer will find in a second."*

> ### 🔄 SWAP to the customer laptop — **0:05**
> **Reload the page** so it pulls the new offer from Supabase.

---

## 🎬 ACT 2 — Customer discovers & acts  ·  💻 Customer laptop

### C1 · Create a Lattice — `/create` · **0:30**
- Build the structured request: category → need → budget → distance → time.
- 🗣 *"Not a search box — it's structured, which is what powers the ranking."*

### C2 · Matches — `/matches` · **0:25**
- Ranked results with a **match score %**, plus the **map + radius overlay**.
- Point out the offer the business just created showing up.

### C3 · Claim → Lattice Pass · **0:25**
- Claim → **human-check (CAPTCHA)** → pass mints with a **QR + 6-digit code** (~5-min expiry).
- 🗣 **Read the 6-digit code aloud** — you'll need it in Act 3.

### C4 · Rankings — `/rankings` · **0:20**  *(flex)*
- Pairwise binary-insertion → an **SSS→F tier list**. Drag a tile between tiers.
- 🗣 *"You can only rank businesses you've actually claimed from."*

### C5 · Impact — `/reports` · **0:20**  *(flex)*
- Gamified impact journey: tier, goal rings, badges, savings-by-month chart, CSV/print export.

> ### 🔄 SWAP to the business laptop — **0:05**

---

## 🎬 ACT 3 — Business fulfills & reviews results  ·  🏢 Business laptop

### B2 · Redeem the pass — `/redeem` · **0:30**
- **Type the 6-digit code** → **Verify** (live Supabase fetch) → customer / offer / savings card → **Approve**.
- 🗣 *"That code crossed devices — the two never shared a session."*

### B3 · Reviews — `/reviews` · **0:15**
- Verified-customer rating breakdown + "what customers mention" tags.
- 🗣 *"Reviews unlock only after a real redemption."*

### B4 · Dashboard + Analytics — `/dashboard`, `/analytics` · **0:20**
- The fresh redemption now shows up in the numbers / savings delivered. **Loop closed.**

---

## ✂️ To hold a hard 4:00

- **C4 Rankings** and **C5 Impact** are the flex beats — trim each to ~0:12 (just show the finished screen, skip the live drag/filtering).
- Still behind at the second swap? **Drop C5 Impact** — it's the most cuttable.
- **Never cut** B1 → C3 → B2 (create → claim → redeem). That's the spine and the cross-device moment.

---

## ✅ Staging notes — do this BEFORE you present

1. **`npm run dev` on both laptops — NOT `dev:demo`.**
   The #1 failure mode. Demo mode is local-only, so the two laptops won't share data and the whole handoff silently fails.

2. **The live offer (B1) must match the request (C1)** so it appears in C2:
   - Storefront category must match the request's category (the offer inherits it).
   - Business location must sit inside the request's distance radius.
   - Price under budget; validity window must cover "now."
   - **Reload the customer app on the swap** so it merges the new offer from Supabase.
   - 🛟 **Safety net:** if it doesn't appear, claim any seeded matching offer instead — the rest of the flow is identical. Rehearse C2 once so it's never an empty "No matches" screen.

3. **C4 / C5 / B3 rely on seeded history, not your one live claim.**
   The customer account needs pre-existing claims (so the tier list and Impact aren't empty); the business account needs seeded reviews (so `/reviews` has content). Use accounts that already have this history, or run a few claims/redemptions to seed it beforehand.

4. **In B2, type the code — don't wait for the "Pending passes" queue.**
   That list only refreshes on page load; the typed-code path does the live Supabase lookup.
