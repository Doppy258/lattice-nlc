# Attributions, Licenses & Credits

Lattice is a student project built for the FBLA *Coding & Programming* event. This
document records every third‑party library, font, icon set, image source, data
provider used, along with its license — and clarifies how real
business names are used. All third‑party material is open‑source or used under a
license that permits this use.

_Last reviewed: 2026‑06‑28._

---

## 1. Open‑source software libraries

Installed via npm. Versions reflect `package.json` / `package-lock.json`.

### Runtime dependencies
| Library | Version | License | Used for |
|---|---|---|---|
| react | 18.3.1 | MIT | UI framework |
| react-dom | 18.3.1 | MIT | React DOM renderer |
| @supabase/supabase-js | 2.108.2 | MIT | Backend (Postgres/Auth/Storage) client |
| leaflet | 1.9.4 | BSD‑2‑Clause | Interactive map rendering |
| @types/leaflet | 1.9.21 | MIT | Leaflet TypeScript types |
| motion | 12.41.0 | MIT | Animations (respects reduced‑motion) |
| lucide-react | 1.21.0 | ISC | In‑app icon set |
| qrcode.react | 4.2.0 | ISC | Lattice Pass QR code generation |
| @zxing/browser | 0.2.0 | MIT | QR code scanning (redemption) |
| @zxing/library | 0.22.0 | Apache‑2.0 | QR/barcode decoding core |
| tailwindcss | 4.3.1 | MIT | Utility‑first CSS |
| @tailwindcss/vite | 4.3.1 | MIT | Tailwind Vite plugin |
| tw-animate-css | 1.4.0 | MIT | Tailwind animation utilities |
| class-variance-authority | 0.7.1 | Apache‑2.0 | Component variant styling |
| clsx | 2.1.1 | MIT | Conditional className helper |
| tailwind-merge | 3.6.0 | MIT | Tailwind class de‑duplication |
| sonner | 2.0.7 | MIT | Toast notifications |
| @radix-ui/react-avatar | 1.2.0 | MIT | Accessible avatar primitive |
| @radix-ui/react-dialog | 1.1.17 | MIT | Accessible dialog/modal primitive |
| @radix-ui/react-dropdown-menu | 2.1.18 | MIT | Accessible dropdown primitive |
| @radix-ui/react-label | 2.1.10 | MIT | Accessible form label primitive |
| @radix-ui/react-progress | 1.1.10 | MIT | Accessible progress primitive |
| @radix-ui/react-scroll-area | 1.2.12 | MIT | Accessible scroll area primitive |
| @radix-ui/react-separator | 1.1.10 | MIT | Accessible separator primitive |
| @radix-ui/react-slider | 1.4.1 | MIT | Accessible slider primitive |
| @radix-ui/react-slot | 1.3.0 | MIT | Slot composition utility |
| @radix-ui/react-tabs | 1.1.15 | MIT | Accessible tabs primitive |
| @radix-ui/react-toggle-group | 1.1.13 | MIT | Accessible toggle‑group primitive |
| @radix-ui/react-tooltip | 1.2.10 | MIT | Accessible tooltip primitive |

The Radix UI primitives are used through **shadcn/ui** patterns. shadcn/ui is an
open‑source component collection (MIT) whose code is copied into the project
(`src/components/ui/`) rather than installed as a dependency.

### Build / development dependencies
| Library | Version | License | Used for |
|---|---|---|---|
| typescript | 5.9.x | Apache‑2.0 | Static typing |
| vite | 6.x | MIT | Build tool / dev server |
| @vitejs/plugin-react | 4.x | MIT | React support for Vite |
| vitest | 2.1.9 | MIT | Unit testing |
| @types/node, @types/react, @types/react-dom | — | MIT | TypeScript type definitions |

---

## 2. Fonts

Self‑hosted via [Fontsource](https://fontsource.org) (Fontsource packaging is MIT;
the fonts themselves are licensed below).

| Font | Designer / Source | License |
|---|---|---|
| Geist & Geist Mono | Vercel | SIL Open Font License 1.1 |
| Space Grotesk | Florian Karsten | SIL Open Font License 1.1 |
| Instrument Serif | Rodrigo Fuenzalida (Instrument) | SIL Open Font License 1.1 |

The SIL OFL permits use, embedding, and redistribution, including in this project.
The marketing landing page additionally loads Geist, Geist Mono, and Instrument
Serif from the **Google Fonts** CDN (`fonts.googleapis.com`) — the same OFL‑1.1
fonts, served by Google.

---

## 3. Icons

| Set | Where | License |
|---|---|---|
| **Lucide** (`lucide-react`) | All in‑app icons | ISC |
| **Google Material Symbols** | Landing page glyphs (`public/lumio/assets/material-symbols-light_*.svg`) | Apache License 2.0 |

---

## 4. Images & video

- **Business storefront photos — Unsplash.** All storefront imagery is hot‑linked
  from the [Unsplash](https://unsplash.com) CDN under the
  [Unsplash License](https://unsplash.com/license) (free to use; attribution
  appreciated). See `src/data/businessImages.ts` for the exact photo IDs.
  **Important:** these are *generic, representative stock photos chosen to suit a
  category* — they are **not** photographs of the real named businesses, and **no
  business logos or trademarked imagery are used**. If a photo fails to load, the
  app falls back to a plain category‑icon tile.
- **Landing page imagery & video** (`public/lumio/assets/`): original assets
  created by the Lattice team for the marketing landing page (see §7).

---

## 5. Maps & location data

| Component | Provider | License / Terms |
|---|---|---|
| Map tiles | © OpenStreetMap contributors | [ODbL](https://www.openstreetmap.org/copyright) — attribution is displayed on the map (`LatticeMap.tsx`) |
| Geocoding / address search | [Nominatim](https://nominatim.org) (OpenStreetMap) | ODbL; used within the Nominatim usage policy (debounced, ≤1 req/s, descriptive User‑Agent) |
| Map renderer | Leaflet | BSD‑2‑Clause (see §1) |
| Device location | Browser **Geolocation API** (W3C standard) | Built into the browser; not a third‑party asset |
| Distance math | First‑party haversine implementation (`src/utils/distance.ts`) | Original work — no external code |

**Optional service — Google reCAPTCHA.** When a reCAPTCHA site key is configured,
signup loads Google reCAPTCHA for bot protection (Google Terms of Service apply).
It is **not** used in the offline demo, which falls back to a first‑party
canvas‑based human‑check (`BotCheckModal.tsx`).

---

## 6. Real business names & trademarks

The seeded sample businesses (e.g., Mi Tierra Café y Panadería, Schilo's
Delicatessen, La Panadería) reference **real San Antonio businesses by name for
educational and demonstration purposes only**.

- Business names and any associated trademarks are the property of their
  respective owners.
- Lattice is a non‑commercial student project and is **not affiliated with,
  endorsed by, or sponsored by** any business named in the app.
- **No business logos, trademarks, or proprietary photographs are used** — sample
  storefront images are generic Unsplash stock (see §4), and descriptions are
  brief, factual, paraphrased summaries.
- Prices, offers, hours, and ratings shown for these businesses are **fictional
  sample data** created for the demo, not real offers from those businesses.

---

## 7. First‑party assets

Created by the Lattice team (no third‑party rights):

- The marketing **landing page** (`public/lumio/`) — its layout, styles,
  animations, and decorative imagery/video — built from scratch by the team.
- The Lattice wordmark / logo mark (`#lattice-mark` SVG, `lattice-logo.png`).
- All application source code in `src/` (the matching engine, validation,
  reporting/CSV export, the Q&A assistant, the canvas bot‑check, the charts, etc.).
- All seed offer/claim/review data values.

---

## How to regenerate the library list

```bash
node -e 'const fs=require("fs");const p=require("./package.json");const a={...p.dependencies,...p.devDependencies};for(const n of Object.keys(a).sort()){let l="?";try{l=require(`./node_modules/${n}/package.json`).license}catch{}console.log(n,a[n],l)}'
```
