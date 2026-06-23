# Lattice

**Structured local offer matching.** Instead of scrolling endless listings, you create a
structured *Ping* — "I need lunch under $15 within 3 km after school" — and Lattice returns a short,
ranked list of nearby small-business offers, explains *why* each matched, and lets you claim,
redeem, review, and rank them.

Built for the **FBLA Coding & Programming** event. Runs entirely standalone and offline on seeded
local data — no server, no APIs, no accounts.

This repo is one Vite project with **two entry points**:

- **`index.html`** → the **Lattice landing page** (marketing). Its "Get Started" / "Create a Ping"
  CTAs open the app.
- **`app.html`** → the **Lattice app** (everything below). It's hash-routed, so `app.html#/create`,
  `app.html#/matches`, etc. all work from a static host.

---

## Run it

```bash
npm install
npm run dev        # landing at http://localhost:5173/  ·  app at /app.html
```

Other scripts:

```bash
npm run build      # production build of both entries to /dist
npm run preview    # serve the production build
npm run typecheck  # type-check only
npm test           # 48 unit tests over the algorithms
```

> Fonts are bundled via Fontsource and the app uses a hash router, so the production build in
> `/dist` (both `index.html` and `app.html`) also works opened directly from a static folder or a
> sub-path host (e.g. GitHub Pages) — fully offline.

---

## Tech stack

- **React 18 + TypeScript + Vite 6**
- **react-router-dom** (hash router, for zero-config offline hosting)
- **Recharts** (for the Phase 5 analytics charts)
- **CSS custom properties + CSS Modules** — bespoke "Signal & Echo" design system, no UI framework
- **localStorage** persistence via a single typed `storageService`

## Design language — "Signal & Echo"

A *ping* is a signal sent into the local area; offers echo back. The identity leans into radar/sonar:
concentric **distance rings** (which is literally how the app ranks by distance), a sweeping radar
animation, and "blips" for matches. Warm **bone-paper** canvas, near-black warm **ink**, a deep-ink
sidebar that anchors the brand, and a single punchy **signal-orange** accent. Type pairs
*Bricolage Grotesque* (display) + *Hanken Grotesk* (body) + *JetBrains Mono* (codes, scores,
distances). Motion respects `prefers-reduced-motion`.

---

## Project structure

```
index.html         Landing entry  → src/main.tsx (iframes the static landing)
app.html           App entry      → src/ping/main.tsx
public/lumio/      The static Lattice landing page (HTML/CSS/JS + assets)
src/
  App.tsx, main.tsx, styles.css   Landing shell (renders the landing in a frame)
  ping/                           The full app (alias "@" → src/ping):
    app/        App shell, router, providers, session (mock profile) context
    models/     TypeScript types for every domain entity (PRD §12)
    data/       Seed-data builders → a complete, internally-consistent demo DB
    services/   storage, validation, OfferRank matching, claims, reviews, ranking, reports
    utils/      distance (haversine), dateTime, ids/claim-codes, formatting
    components/ common/, layout/, ping/, offers/, businesses/, reviews/, rankings/, reports/
    pages/      One file per route (customer + business + demo screens)
    styles/     tokens.css (design tokens) + globals.css (reset, base, shared classes)
    __tests__/  Vitest suites for the core algorithms
```

## Build status (per PRD §23 build order)

**Phase 1 — Project Setup: complete.**

- ✅ React + TypeScript + Vite app, path aliases, clean `npm run build`
- ✅ Routing for **every** customer / business / admin screen (no broken links)
- ✅ Global layout shell: sidebar, top bar with **mock profile selector**, mobile bottom nav
- ✅ Design tokens + global design system
- ✅ Seed data: 6 users, 5 locations, 20 businesses, 41 offers, 43 reviews, 13 claims, 5 rankings,
  saved items, and a historical request — all dated relative to "now" so the demo always looks fresh
- ✅ `storageService` with persistence, typed collections, pub/sub, and **Reset Demo Data**

Brought forward to make Phase 1 tangible:

- ✅ **Home page** built out (greeting, sample-ping hero, live stats, active claims, saved
  businesses, fresh offers, categories)
- ✅ **Demo Controls** page is functional (live seed-data viewer + working reset)

**Phase 2 — Core Data & Services: complete.**

- ✅ `requestValidationService` — syntactic + semantic validation, per-need minimum budgets,
  duplicate detection, request-quality scoring
- ✅ `offerMatchingService` — **OfferRank**: weighted 7-factor score (0–100) with explainable
  reasons, near-miss results, and live match-count estimation
- ✅ `claimService` — claim rules, PING-#### code generation, redemption, expiry sweep
- ✅ `reviewService` — verified-review gate (redeemed + owned + no duplicate), rating aggregation
- ✅ `rankingService` — pairwise comparison via immutable binary-insertion sessions
- ✅ `reportService` — customer + business analytics (savings, conversion, grouping)
- ✅ `userService` / `businessService` — bookmarks and business/offer lookups
- ✅ **48 unit tests passing** (`npm test`) across all algorithms

> Services are pure where it matters (scoring, validation, ranking math) with thin
> storage-bound orchestrators on top — so the logic is testable and lives outside the UI.

**Phase 3 — User App: complete.**

- ✅ **Create Ping** — guided sentence builder (category cards → need types → budget chips →
  distance → time presets/custom → preferences → note) with a live "Your Ping" preview showing
  estimated matches and request quality, plus inline semantic validation
- ✅ **Verification modal** — mock anti-bot step (agree + code `2468`, 3 attempts)
- ✅ **Matches** — real OfferRank results with score gauges, "why this matched" reasons, sort
  (best/rating/closest/price/ending/claimed), filter chips, and near-miss empty state
- ✅ **Claim flow** — claim → PING-#### confirmation; **Claims** page with active/redeemed/expired
  tabs, countdowns, cancel, and verified **review** flow
- ✅ **Explore** — search + category/rating/distance filters + 7 sort modes over the business grid
- ✅ **Business Profile** — dark header, active offers, details (hours/price/tags/accessibility),
  verified-first reviews with tag filter, similar businesses
- ✅ **Saved** — businesses/offers tabs with per-type sorting; bookmark toggles everywhere

**Phase 4 — Business App: complete.**

- ✅ **Business switcher** — owners manage any of their seeded businesses (session-scoped)
- ✅ **Dashboard** — live metrics (active offers, views, claims, redemptions, conversion, rating),
  claims-over-time + redemptions-by-offer charts (Recharts), most-popular offer
- ✅ **Create / Manage Offers** — reusable `OfferForm` with full validation (8 offer types,
  price/original/dates/max-claims rules); Active/Scheduled/Expired tabs with edit + (de)activate
- ✅ **Redeem Claim** — enter a `PING-####` → verify (format, exists, this business, active,
  not expired) → mark redeemed (which unlocks the customer's verified review). Closes the loop.
- ✅ **Reviews** — verified-first list, verified %, tag filter
- ✅ **Analytics** — views/claims/redemptions/conversion/repeat-customers/revenue-influenced with
  formula tooltips, plus trend, by-offer, and common-tag charts

**Phase 5 — Reports & Rankings: complete.**

- ✅ **User Reports** — customizable report (category / claim-status / date-range filters) with
  narrative cards, metric grid, and three charts (claims by category, savings over time, rating
  distribution); savings match the home dashboard ($28.50)
- ✅ **Pairwise comparison** — fires after a verified review; "better or worse?" prompts feed the
  binary-insertion engine and commit the business into the user's category ranking (≤3 prompts)
- ✅ **Rankings** — personal ranked lists (lunch, cafes, haircuts, learning spots, gift shops) with
  rank, rating, last visit, and save toggle
- ✅ Business analytics charts shipped in Phase 4

**Phase 6 — Polish: complete.**

- ✅ **Help page** — five-step walkthrough, an OfferRank weight breakdown, a binary-insertion
  explainer, and a Q&A accordion
- ✅ **Accessibility** — in-app reduced-motion toggle (persisted, on top of OS `prefers-reduced-motion`)
  alongside the existing focus rings, skip link, ARIA, and text-plus-icon labels
- ✅ **CSV export** of the user impact report (offline Blob download)
- ✅ **Code-splitting** — the Recharts bundle (~400 KB) is now a lazy chunk loaded only on the
  report/analytics pages, with a radar-mark Suspense fallback
- ✅ Empty/error states, demo reset, and seed data finalised

**All six build phases are complete** — the full PRD MVP (and several nice-to-haves) is implemented,
type-checked, unit-tested, and verified in the browser.

## Demo profiles

Use the profile selector (top right) to switch between seeded accounts:

- **Lucas Chen** — primary demo customer (pre-loaded claims, saves, rankings)
- **Maya Patel**, **Ethan Wong** — additional customers
- **Sam Rivera**, **Nina Brooks** — business owners (jump to the business dashboard)
- **Demo Admin** — admin (jumps to Demo Controls)
