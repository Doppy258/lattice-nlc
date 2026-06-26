# Lattice

**Find exactly what you need, nearby.**

Lattice turns what a person needs — "lunch under $12 in the next hour within walking distance" — into a structured request, then matches it against real deals from nearby local businesses. It's a two‑sided marketplace: **customers** discover and claim offers, and **businesses** publish offers and redeem them in person.

Built for the FBLA *Coding & Programming* event as a complete, working web application.

---

## Table of contents

- [What it does](#what-it-does)
- [How it works](#how-it-works)
- [Feature overview](#feature-overview)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Demo accounts](#demo-accounts)
- [Project structure](#project-structure)
- [Input validation & security](#input-validation--security)
- [Accessibility](#accessibility)
- [Libraries & attribution](#libraries--attribution)
- [Scripts reference](#scripts-reference)

---

## What it does

Most deal apps are a static wall of coupons. Lattice is **intent‑first**: instead of scrolling, you describe your need and the app does the matching, ranking offers by how well they actually fit. Every transaction is verified end‑to‑end, so reviews and ratings reflect real visits — not bots.

There are two kinds of users:

- **Customers** create requests ("Lattices"), browse ranked matches, claim offers, redeem them in store, leave verified reviews, and build a personal ranking of the businesses they've used.
- **Business owners** set up a storefront, publish offers, redeem customer passes at the counter, read verified reviews, and analyze performance.

Businesses span seven categories: **Food, Retail, Services, Fitness, Education, Repair, and Entertainment.**

---

## How it works

### The customer loop

1. **Create a Lattice** — pick a category and need type (e.g. *Lunch*, *Haircut*, *Tutoring*), then set a budget, distance, time window, and preferences. Inputs are validated for both format and meaning (see [validation](#input-validation--security)).
2. **Get ranked matches** — the **OfferRank** engine scores every active offer across seven signals and returns the best fits first, each with a plain‑English reason ("Fits your budget", "Open during your requested time", "Highly rated by verified reviews").
3. **Claim an offer** — after a quick human‑verification check, Lattice mints a **Lattice Pass**: a QR code plus a 6‑digit backup code, valid for a short redemption window.
4. **Redeem in person** — the business scans the QR (or types the code) and approves it. Only then is the pass marked *redeemed*.
5. **Review & rank** — once a pass is redeemed, the customer can leave a **verified** review and slot the business into their personal ranking via quick head‑to‑head comparisons.

### The business loop

1. **Set up a storefront** during onboarding (name, category, description, address).
2. **Publish offers** — discounts, limited‑time deals, student offers, bundles, appointment slots, events, and more, each with price, validity window, and a claim limit.
3. **Redeem passes** at the counter using the QR scanner or the 6‑digit code, with live re‑validation so expired or already‑used passes are rejected.
4. **Understand performance** — the Analytics workspace shows the conversion funnel (views → claims → redeemed), pass‑approval rate, repeat customers, revenue influenced, and what customers mention most.

---

## Feature overview

The application covers every required feature for the event topic, plus several enhancements.

| Requirement | How Lattice delivers it |
| --- | --- |
| Sort businesses by category | Category chips across Explore, Matches, Rankings, and Reports |
| Leave reviews & ratings | Verified reviews, unlocked only after a pass is redeemed |
| Sort by reviews / ratings | "Highest rating" and "Most reviews" sorts on Explore & Matches |
| Save / bookmark favorites | One‑tap bookmarking of businesses and offers (Saved page) |
| Display deals / coupons | Offer cards + the live Lattice Pass redemption flow |
| Bot‑prevention verification | reCAPTCHA on signup **plus** a built‑in offline human‑check that also gates offer claims |

**Beyond the brief:**

- **Intelligent matching (OfferRank)** — a 7‑dimension weighted scoring engine (category, budget, distance, rating, time availability, verification, and stated preferences) that ranks offers and explains *why* each one fits.
- **Customizable, exportable reports** — both the customer impact report and the business analytics support date‑range + category/status filtering, **CSV export** (for spreadsheets), and **Print / PDF** of a clean, chrome‑free report.
- **Interactive Help Center** — a searchable, role‑aware help page (`/help`) with expandable topics and "take me there" deep links into the relevant screens.
- **Verified, two‑sided redemption** — the Lattice Pass model prevents fake claims: a pass must be created by the customer and approved by the business, within a time window.

---

## Tech stack

| Area | Choice |
| --- | --- |
| Language | TypeScript 5.6 |
| UI framework | React 18 |
| Build tool | Vite 6 |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui (built on Radix UI primitives) |
| Animation | Motion (Framer Motion's successor) |
| Backend / data | Supabase (Postgres + Auth) |
| QR codes | `qrcode.react` (generate) + `@zxing/browser` (scan) |
| Icons | lucide-react |
| Notifications | sonner |

The design language is a custom **"Liquid Glass"** theme — a blue‑and‑white palette with frosted‑glass surfaces and an *Instrument Serif* accent typeface, using solid fills only (no gradients).

---

## Architecture

Lattice separates **pure logic** from **UI** from **persistence**, which keeps the code testable and easy to follow.

```
UI (pages + components)
        │  calls
        ▼
Services (pure business logic)        ← matching, validation, redemption, reports
        │  reads/writes via
        ▼
App state (AppData, in React context) ← single typed store of arrays
        │  syncs through
        ▼
dbService / repositories → Supabase   ← shared backend (Postgres + Auth)
```

- **`models/`** — the typed data shapes (`User`, `Business`, `Offer`, `Claim`, `Review`, `PingRequest`, `PersonalRanking`, etc.) and the central `AppData` store type.
- **`services/`** — framework‑free business logic. Each concern is isolated: `offerMatchingService` (OfferRank), `redemptionService` (the Lattice Pass lifecycle), `reviewService`, `rankingService`, `reportService`, plus dedicated validators (`offerService`, `requestValidationService`) and primitives in `utils/validation.ts`.
- **`dbService` / `repositories/`** — map the typed models to/from Supabase tables (camelCase ↔ snake_case) and run the queries.
- **`app/providers.tsx`** — holds app state in React context and is the single source of truth at runtime.
- **`pages/` + `components/`** — the screens and reusable UI, navigated by a lightweight hash router with **role‑based information architecture** (customers and business owners see different navigation).

### Data layer

App state is one typed object of arrays (`AppData`), updated immutably. **Supabase is the shared backend**: on load, the app reads live records and overlays them on a local seed snapshot, so data created on one device is visible on another. Every mutation writes through `dbService` *and* updates local state. When Supabase isn't configured, the app falls back to the bundled seed data so it still runs fully offline for a demo.

---

## Getting started

### Prerequisites

- **Node.js 18+** and npm

### 1. Install

```bash
npm install
```

### 2. Configure environment

Copy the example file and fill in your keys:

```bash
cp .env.example .env
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | yes* | Supabase project URL (browser‑safe) |
| `VITE_SUPABASE_ANON_KEY` | yes* | Supabase anon/public key (browser‑safe) |
| `VITE_RECAPTCHA_SITE_KEY` | optional | Enables Google reCAPTCHA on signup; if omitted, the built‑in human‑check is used instead |
| `SUPABASE_SERVICE_ROLE_KEY` | optional | **Server‑only secret**, used solely by the auth‑seeding script — never expose to the browser |

\* If the Supabase variables are absent, the app still runs entirely on bundled seed data (cross‑device sync is disabled in that mode).

### 3. Run

```bash
npm run dev        # start the dev server (http://localhost:5173)
npm run build      # optimized production build into dist/
npm run preview    # preview the production build locally
```

---

## Demo accounts

**With Supabase configured (default):** sign in on the login screen. The seeding script (below) provisions two ready‑to‑use accounts — or sign up to create your own.

| Role | Email | Password |
| --- | --- | --- |
| Customer | `demo.customer@lattice.test` | `Demo1234!` |
| Business owner | `demo.owner@lattice.test` | `Demo1234!` |

To create these in your own Supabase project:

```bash
node scripts/seed-auth-users.mjs   # requires SUPABASE_SERVICE_ROLE_KEY in .env
```

**Without Supabase:** the app auto‑signs‑in against the bundled seed identities (e.g. *Lucas Chen*, a customer) so you can explore immediately.

> **Tip — see the two‑sided flow:** sign in as the business owner in one browser and create a storefront + offer; sign in as a customer in another browser to claim it, then redeem the pass back on the business side.

---

## Project structure

```
src/
├── app/            # React context provider + hash router
├── components/
│   ├── charts/     # dependency-free Donut / BarList / BarColumns
│   ├── common/     # Button, Card, PageHeader, EmptyState, Icon, …
│   ├── domain/     # OfferCard, LatticePass, BotCheckModal, modals, useClaim
│   ├── layout/     # Sidebar, TopBar, MobileNav, nav config, brand mark
│   ├── motion/     # animation tokens + reduced-motion-aware wrappers
│   └── ui/         # shadcn/ui primitives
├── data/           # seed data + category/offer/need catalogs + imagery
├── models/         # typed data shapes + the AppData store type
├── pages/          # one file per screen (customer + business)
├── repositories/   # Supabase row mappers + repository functions
├── services/       # pure business logic (matching, redemption, reports, …)
├── styles/         # Tailwind v4 globals + design tokens
└── utils/          # validation, formatting, dates, ids, CSV export
```

---

## Input validation & security

Validation is **two‑layered** — syntactic (is the format valid?) and semantic (does the value make sense?):

- **Requests** check that a budget is realistic for the chosen need type, that the time window is ordered and not in the past, and that notes contain no links or repeated spam text; they also block duplicate/too‑many active requests.
- **Offers** enforce length bounds, a non‑negative price, an *original price greater than the offer price* (so a "discount" is real), an ordered future validity window, and a sensible claim limit.
- **Reviews** require a 1–5 rating, length bounds, and — most importantly — a matching **redeemed** claim, so only real customers can review.

**Bot prevention** runs at the two abuse‑prone points: account creation (reCAPTCHA, with an offline human‑check fallback) and offer claiming (the human‑check gate). **Verified redemption** (the two‑sided Lattice Pass) prevents fake or replayed claims.

---

## Accessibility

- Semantic, labeled controls (`aria-label`, `aria-current`, `aria-expanded`, `aria-invalid`) throughout navigation, forms, and interactive elements.
- Keyboard‑native controls (native `<select>`, real buttons, focus-visible rings).
- **`prefers-reduced-motion` is honored** — animations are reduced to near‑instant for users who request it.
- The print stylesheet strips app chrome so reports export as clean, high‑contrast documents.

---

## Libraries & attribution

All third‑party libraries are open source under permissive licenses (MIT unless noted). None of the application's logic is copied from external sources.

| Library | Purpose | License |
| --- | --- | --- |
| React / React DOM | UI framework | MIT |
| Vite / @vitejs/plugin-react | Build tooling | MIT |
| TypeScript | Language & type checking | Apache‑2.0 |
| Tailwind CSS (+ @tailwindcss/vite) | Styling | MIT |
| shadcn/ui + Radix UI primitives | Accessible component foundation | MIT |
| Motion | Animations | MIT |
| @supabase/supabase-js | Auth + Postgres client | MIT |
| qrcode.react | Generates the Lattice Pass QR code | ISC |
| @zxing/browser, @zxing/library | Scans QR codes at redemption | MIT / Apache‑2.0 |
| lucide-react | Icon set | ISC |
| sonner | Toast notifications | MIT |
| clsx, tailwind-merge | Class‑name utilities | MIT |
| class-variance-authority | Variant styling utility | Apache‑2.0 |
| tw-animate-css | Animation utilities | MIT |

**Fonts** (all under the SIL Open Font License): *Instrument Serif* (accent), *Geist* & *Geist Mono*, *Space Grotesk*.

**Brand mark:** the Lattice node glyph is an original SVG recreated for this project.

> Each package's exact license text is available in its `node_modules/<pkg>/LICENSE` and on its npm page.

---

## Scripts reference

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server with hot reload |
| `npm run build` | Produce an optimized production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `node scripts/seed-auth-users.mjs` | Create the demo auth accounts in Supabase (needs the service‑role key) |

---

*Lattice — a structured way to find exactly what you need, nearby.*
