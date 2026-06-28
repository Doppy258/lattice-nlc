# Lattice NLC

<p align="center">
  <b>Smart local discovery</b>
</p>
<p align="center">
  Matching students and customers with nearby deals using structured requests and ranked matching.
</p>

<div align="center">

  <img src="https://img.shields.io/badge/Status-In%20Development-orange?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/Stack-React%20%7C%20TypeScript%20%7C%20Vite-blue?style=for-the-badge" alt="Stack" />
  <img src="https://img.shields.io/badge/Backend-Supabase-green?style=for-the-badge" alt="Backend" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />

</div>

<br>

## Features

| Feature | Description |
|---|---|
| **Create a Lattice** | Structured mad-libs form to specify category, need, budget, distance, time, and preferences. |
| **Smart matching** | Weighted multi-factor scoring (category, budget, distance, rating, time, verification, preferences). |
| **Interactive Map** | Leaflet map with business markers and a radius overlay for match visualization. |
| **Address Autocomplete** | Nominatim-powered search for business address entry. |
| **Storefront Management** | Edit hours, banner, description, price level, and tags from a dedicated profile editor. |
| **Offer Management** | Create/edit offers with image upload, discount types, student-only toggles, and redemption limits. |
| **Claim & Redemption** | Human-verification gate, time-limited passes with QR codes, and in-store redemption. |
| **Pairwise Ranking** | Binary-insertion comparison for building personal business rankings. |
| **Ask Lattice (interactive Q&A)** | Offline conversational assistant that answers free-text questions via a synonym-aware retrieval ranker over the help knowledge base, with one-tap deep links. |
| **Reports & analytics** | Customer impact report and business performance dashboard — both filterable (date range, category, status) with CSV and print/PDF export. |
| **Geolocation** | Browser GPS (user-initiated) for distance-aware matching. |
| **Role-based Accounts** | Customer and business owner roles with separate views. |

## How Lattice meets the "Byte-Sized Business Boost" prompt

The 2025–2026 topic asks for a tool that helps people **discover and support small, local businesses**. Every required capability is implemented and demonstrable — here's exactly where each lives:

| Prompt requirement | Where it lives | How it works |
|---|---|---|
| **Sort businesses by category** (food, retail, services, …) | `ExplorePage.tsx`, `businessService.filterBusinesses` | Category chips filter the live business list across 7 categories. |
| **Leave reviews / ratings** | `ReviewModal.tsx`, `reviewService.ts` | 1–5 star rating + text + tags; **verified** because a review unlocks only after you redeem a pass at that business. |
| **Sort businesses by reviews / ratings** | `ExplorePage.tsx`, `utils/sorting.ts` | "Highest rating" and "Most reviews" sort options operate on real aggregates. |
| **Save / bookmark favorites** | `SavedPage.tsx`, `BusinessCard`, `OfferCard` | Bookmark businesses *and* offers; revisit them on the Saved page. |
| **Display special deals / coupons** | `OfferCard.tsx`, `BusinessProfilePage.tsx`, `offerService.ts` | Eight offer types (discount, student, bundle, limited-time, …) with live pricing. |
| **Verification step to prevent bots** | `BotCheckModal.tsx`, `SignupPage.tsx` | reCAPTCHA when configured, plus a self-contained **canvas CAPTCHA** (distorted code + checkbox + attempt limit) that needs no network. |

**Beyond the minimum**, the program adds the rubric's "intelligent feature," validation, and analysis expectations:

- **Intelligent feature — interactive Q&A:** the *Ask Lattice* assistant (`Assistant.tsx`, `assistantService.ts`) answers questions in plain English, plus a **weighted match-scoring** recommendation engine (`offerMatchingService.ts`) that ranks offers across seven weighted signals with a transparent per-match explanation.
- **Input validation (syntactic + semantic):** format checks *and* meaning checks — e.g. budget minimums per need type, time-window ordering, link/spam detection, email format, and discount-range sanity (`requestValidationService.ts`, `offerService.ts`, `utils/validation.ts`).
- **Customizable, analyzable reports:** the impact report and analytics dashboard filter by date range, category, and status, render charts, and export to **CSV / print-to-PDF** (`ReportsPage.tsx`, `AnalyticsPage.tsx`, `reportService.ts`, `utils/export.ts`).
- **Accessibility:** keyboard navigation, ARIA roles/labels, focus-visible styling, a skip-to-content link, alt text, and full `prefers-reduced-motion` support.

> **Standalone demo:** `npm run dev:demo` runs the entire app on seeded local data with auth bypassed and the offline CAPTCHA fallback — no internet, accounts, or QR scanning required (judges never need to scan a code or click a link).

## Why this stack

| Choice | Rationale |
|---|---|
| **TypeScript** | Static typing across ~16k lines catches errors at compile time and documents intent; discriminated unions (e.g. `CreateOfferResult`) force callers to handle failure paths. |
| **React 18 + Vite** | Component model keeps the UI modular and declarative; Vite gives instant HMR in dev and a fast, tree-shaken production build. |
| **Tailwind CSS v4 + design tokens** | Utility-first styling with a single token source (`styles/tokens.css`) keeps the visual language consistent and theme-able. |
| **In-house services/utils, few dependencies** | Core logic (the match-scoring engine, validation, reports, CSV export, the Q&A ranker, charts, CAPTCHA) is written from scratch — no heavy frameworks — so the program runs standalone and the algorithms are inspectable. |
| **Supabase (optional)** | Provides shared Postgres/Auth/Storage when online; the app degrades gracefully to seeded data offline. |

## Project Structure

```
src/
├── models/         # TypeScript interfaces (Business, Offer, PingRequest, Claim, etc.)
├── services/       # Business logic (offer matching, ranking, validation, claims, reports)
├── utils/          # Pure helpers (formatting, distance, time windows, IDs, geocoding)
├── components/     # Reusable UI (common, domain, ui, layout, motion, charts)
├── pages/          # Route-level page components
├── hooks/          # Shared React hooks (useGeolocation)
├── data/           # Static catalog (categories, need types, presets, help topics)
└── app/            # App shell (providers, navigation, routing)
```

### Key Modules

| Module | Path | Purpose |
|---|---|---|
| **Models** | `src/models/` | All domain types: `Business`, `Offer`, `User`, `PingRequest`, `Claim`, `Review`, `Ranking`, `Saved`, `Report` |
| **Services** | `src/services/` | `offerMatchingService` (match-scoring algorithm), `offerService` (CRUD), `requestValidationService`, `claimService`, `businessService`, `userService`, `dbService` (Supabase sync), `imageService` (upload) |
| **Components** | `src/components/` | `common/` (Button, Card, Badge, Icon, Input, etc.), `domain/` (OfferCard, BusinessCard, LatticeMap, AddressAutocomplete, BusinessHoursEditor), `layout/` (AppLayout, Sidebar, MobileNav), `motion/` (Reveal, Stagger, tokens) |
| **Pages** | `src/pages/` | Route-level views: Home, Explore, Matches, CreateLattice, BusinessProfile, Profile, CreateOffer, Dashboard, Settings, Rankings, Help, Login, Onboarding |
| **Utils** | `src/utils/` | `formatting`, `distance` (haversine), `dateTime`, `timeWindows`, `geocode` (Nominatim), `ids`, `validation`, `offerPricing`, `constants` |
| **Data** | `src/data/` | `catalog.ts` (central taxonomy: categories, need types, budget presets, time presets, offer types), `businessImages` (seed photo URLs), `helpTopics` (FAQ content) |

## Tech Stack

| Component | Technology |
|---|---|
| **Frontend** | React, TypeScript, Vite, Tailwind CSS |
| **Animation** | motion (framer-motion) |
| **Maps** | Leaflet |
| **Geocoding** | Nominatim (OpenStreetMap) |
| **Backend** | Supabase (Postgres, Storage, Auth) |
| **Icons** | Lucide |
| **Fonts** | Geist, Space Grotesk, Instrument Serif |

## Getting Started

```bash
npm install
npm run dev
```

The app runs locally at `http://localhost:5173`. No public deployment is available.

For an offline/competition demo that always uses seeded local data and bypasses Supabase auth:

```bash
npm run dev:demo
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run dev:demo` | Start the app in standalone seeded-data mode |
| `npm run build` | Build for production |
| `npm run build:demo` | Build the standalone seeded-data version |
| `npm run preview` | Preview the production build |
| `npm run test` | Run tests (vitest) |
| `npm run test:watch` | Run tests in watch mode |

## Acknowledgments & licenses

> **Full credits, licenses, and copyright documentation:** see **[docs/ATTRIBUTIONS.md](docs/ATTRIBUTIONS.md)** — every library (with license), font, icon set, image source, data provider, and template, plus the real‑business‑name disclaimer.

- Built with [React](https://react.dev), [TypeScript](https://www.typescriptlang.org), [Vite](https://vite.dev), and [Tailwind CSS v4](https://tailwindcss.com)
- Map tiles © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors (ODbL), rendered with [Leaflet](https://leafletjs.com)
- Geocoding via [Nominatim](https://nominatim.org) (OpenStreetMap)
- Backend & auth by [Supabase](https://supabase.com)
- Animation by [motion](https://motion.dev)
- Icons from [Lucide](https://lucide.dev) and [Google Material Symbols](https://fonts.google.com/icons) (Apache‑2.0)
- Storefront photos from [Unsplash](https://unsplash.com/license) (representative stock — not the actual businesses; no business logos used)
- Fonts: Geist, Space Grotesk, and Instrument Serif via [Fontsource](https://fontsource.org) (SIL OFL 1.1)
- Real business names are used for educational/demo purposes only; all trademarks belong to their owners (see [ATTRIBUTIONS](docs/ATTRIBUTIONS.md) §6)
