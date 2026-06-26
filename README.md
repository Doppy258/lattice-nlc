# Lattice NLC

<p align="center">
  <b>Smart local discovery</b>
</p>
<p align="center">
  Matching students and customers with nearby deals using structured requests and ranked matching (OfferRank).
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
| **OfferRank** | Weighted multi-factor scoring (category, budget, distance, rating, time, verification, preferences). |
| **Interactive Map** | Leaflet map with business markers and a radius overlay for match visualization. |
| **Address Autocomplete** | Nominatim-powered search for business address entry. |
| **Storefront Management** | Edit hours, banner, description, price level, and tags from a dedicated profile editor. |
| **Offer Management** | Create/edit offers with image upload, discount types, student-only toggles, and redemption limits. |
| **Claim & Redemption** | Human-verification gate, time-limited passes with QR codes, and in-store redemption. |
| **Pairwise Ranking** | Binary-insertion comparison for building personal business rankings. |
| **Geolocation** | Browser GPS (user-initiated) for distance-aware matching. |
| **Role-based Accounts** | Customer and business owner roles with separate views. |

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
| **Services** | `src/services/` | `offerMatchingService` (OfferRank algorithm), `offerService` (CRUD), `requestValidationService`, `claimService`, `businessService`, `userService`, `dbService` (Supabase sync), `imageService` (upload) |
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

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
| `npm run test` | Run tests (vitest) |
| `npm run test:watch` | Run tests in watch mode |

## Acknowledgments

- Built with [React](https://react.dev), [TypeScript](https://www.typescriptlang.org), [Vite](https://vite.dev), and [Tailwind CSS v4](https://tailwindcss.com)
- Map rendering by [Leaflet](https://leafletjs.com)
- Geocoding via [Nominatim](https://nominatim.org) (OpenStreetMap)
- Backend & auth by [Supabase](https://supabase.com)
- Animation by [motion](https://motion.dev)
- Icons from [Lucide](https://lucide.dev)
- Fonts: Geist, Space Grotesk, and Instrument Serif via [Fontsource](https://fontsource.org)
