# FreshFold Laundry — Mini Catalogue

A single-page, static mini-catalogue website for a laundry business. Every
piece of copy, price, image, link and opening hour lives in one file:
**`src/data/business.js`**.

No backend, no API keys, no database, no `.env`. Orders are taken on WhatsApp.

---

## Setup and run

```bash
npm install      # install dependencies
npm run dev      # dev server at http://localhost:5173
npm run build    # production build into dist/
npm run preview  # serve the built site locally
npm run lint     # eslint
```

### Optional browser checks

These verify the design rules and the order flow in a real browser (they need
Playwright, which is in `devDependencies`):

```bash
npm run audit:design   # asserts: no black backgrounds/text, no sharp corners,
                       # no horizontal overflow at 360 / 768 / 1280
npm run test:ui        # filters, keyboard access, focus trap, WhatsApp message
```

`audit:design` expects the built site, so run `npm run build` first.

### Deploy

Static output in `dist/`. Works as-is on Vercel, Netlify or any static host.

**Vercel** — import the repo, framework preset *Vite*, build `npm run build`,
output `dist`.

**Netlify** — build `npm run build`, publish `dist`.

---

## File tree

```
.
├── index.html                  # shell only; SEO tags injected at build time
├── vite.config.js              # React + Tailwind v4 + the SEO-injection plugin
├── eslint.config.js
├── package.json
├── audit.mjs                   # design-rule checks (black / sharp / overflow)
├── test-interactions.mjs       # filters, keyboard, focus trap
├── test-order-flow.mjs         # prints the WhatsApp message for review
├── public/
│   ├── favicon.svg             # swap for the client's own mark
│   ├── robots.txt
│   └── images/
│       ├── hero-laundry.svg    # hero illustration
│       └── map-placeholder.svg # shown when no map embed URL is set
└── src/
    ├── main.jsx
    ├── App.jsx                 # section order + sheet open/close state
    ├── index.css               # DESIGN TOKENS (@theme) + base rules
    ├── data/
    │   └── business.js         # ← THE ONLY FILE YOU NEED TO EDIT
    ├── hooks/
    │   ├── useOrder.js         # basket state + totals
    │   ├── useReveal.js        # scroll reveal, reduced-motion aware
    │   └── useScrollLock.js    # freezes background scroll behind overlays
    ├── utils/
    │   ├── whatsapp.js         # wa.me links + order message
    │   ├── format.js           # KES formatting, {token} filling
    │   ├── hours.js            # hours table + open/closed badge
    │   ├── icons.js            # icon NAME -> lucide component
    │   └── seo.js              # title, OG tags, LocalBusiness JSON-LD
    └── components/
        ├── Navbar.jsx          # sticky bar, scroll-spy, mobile menu
        ├── Hero.jsx
        ├── ServiceGrid.jsx     # category filter tabs
        ├── ServiceCard.jsx     # price + unit-aware quantity stepper
        ├── PriceList.jsx
        ├── Steps.jsx
        ├── Benefits.jsx
        ├── Testimonials.jsx
        ├── Faq.jsx             # accordion
        ├── Contact.jsx         # hours, contact, map
        ├── FinalCta.jsx
        ├── Footer.jsx
        ├── OrderDrawer.jsx     # bottom sheet / side panel + mobile order bar
        ├── WhatsAppFab.jsx
        ├── BrandIcons.jsx      # WhatsApp / Instagram / hanger
        └── Reveal.jsx
```

---

## How to customise for a new client

Open **`src/data/business.js`** and search for `[REPLACE]`. Work top to bottom.

| Step | Field | Notes |
|---|---|---|
| 1 | `siteUrl` | The live domain. Drives the canonical link, OG tags and JSON-LD. |
| 2 | `business.name`, `shortName`, `tagline`, `description` | `shortName` is used where space is tight and as the giant watermark behind the closing banner. `{area}` and `{city}` tokens are filled at runtime. |
| 3 | `currency` | Prefix used by the price formatter. |
| 4 | `whatsapp` | **Digits only** — no `+`, spaces or dashes. `wa.me` needs this exact form. `phoneDisplay` is what humans read; `phoneDial` is the `tel:` value. |
| 5 | `email` | Blank string removes the row entirely. |
| 6 | `instagram`, `instagramUrl` | Handle and full URL. |
| 7 | `area`, `city`, `addressLine`, `directionsNote` | Address block. |
| 8 | `mapEmbedUrl` | Google Maps → Share → *Embed a map* → copy only the `src` URL. Left empty, the designed placeholder SVG is shown instead. |
| 9 | `mapLinkUrl` | Used by the "Open in Google Maps" button. |
| 10 | `hours` | One array. `days` must be full English day names or schema.org rejects them. Delete a row to close that day. **This one array drives the hours table, the "Open now" badge and the JSON-LD**, so they cannot disagree. |
| 11 | `delivery` | `available: false` hides every "free pickup" line and the delivery area list. `sameDayCutoff` is the express note under *How it works*. |
| 12 | `nav`, `navOrderLabel` | Header links. Each `href` must match a section `id`. |
| 13 | `hero` | Headline, subtext, both button labels, the trust row, the image path and the floating badge. Set `badge: null` to hide the badge. |
| 14 | `hero.image` | Any path or URL. Drop a `.jpg`/`.webp` into `public/images/` and point at it. Keep `imageAlt` accurate — it is the accessible description and the OG image alt. |
| 15 | `servicesSection` | Eyebrow and intro for the catalogue. |
| 16 | `categories` | The filter pills. Each `id` must match a service's `category`. The "All" pill is automatic. |
| 17 | `services` | The catalogue. See the field notes below — `unit` is the important one. |
| 18 | `priceList` | `groups` become the pill tabs and the rounded rows. Add/rename/delete freely. |
| 19 | `steps`, `benefits` | Numbered step badges come from list order, so inserting a step renumbers itself. |
| 20 | `reviews` | Replace the quotes **and set `placeholder: false`**. While it is `true` the page prints a visible "these are placeholders" notice — deliberately, because published fake reviews are a real risk for a small business. |
| 21 | `faq` | Question/answer pairs. |
| 22 | `contact`, `finalCta`, `footer` | Section copy, closing banner and footer, including the `creditLabel` / `creditUrl`. |
| 23 | `order` | Drawer and order-bar labels. |
| 24 | `orderMessage`, `quickMessage` | The exact WhatsApp copy. `{name}` is filled at runtime. |

### The `services` fields that actually matter

```js
{
  id: 'wash-fold',        // unique; used as the basket key
  category: 'wash',       // must match a categories[].id
  name: 'Wash & fold',
  icon: 'washing',        // a name from src/utils/icons.js
  description: '…',
  price: 150,             // a NUMBER in KES — the order maths uses this
  pricePrefix: 'From',    // renders as "From KES 150". Must not include "KES".
  unit: 'kg',             // 'kg' | 'item' | 'job' | null  ← read this
  priceNote: 'per kg. Minimum 3 kg.',
  turnaround: '24–48 hours',
  popular: true,          // adds a "Most booked" badge
  accent: true,           // paints the card with the warm accent
}
```

**`unit` decides what the +/− buttons count**, and it is the difference between
a believable site and a confusing one:

- `'kg'` → stepper reads "kg". Right for wash & fold and curtains.
- `'item'` → stepper reads "items". Right for dry cleaning, ironing, shoes.
- `'job'` → stepper reads "jobs".
- `null` → **no stepper**; the card shows a plain "Order" button that opens
  WhatsApp for that one service. Use for flat-priced work, because four times
  next to "KES 300" implies four separate jobs.

Prices must be stored as numbers. All formatting happens at render time, so
`price: 1500` renders as `KES 1,500` everywhere — cards, drawer, totals, the
WhatsApp message and the JSON-LD — from one value.

### Changing the colours or fonts

Everything is a token in `src/index.css` under `@theme inline`. No component
contains a raw hex value. To rebrand:

- **Primary (aqua)** — the `--color-primary-50 … 900` ramp.
- **Accent (coral)** — the `--color-accent-50 … 700` ramp.
- **Text** — `--color-ink`, `--color-ink-body`, `--color-ink-muted`.
- **Page/canvas** — `--color-canvas`, `--color-canvas-deep`, `--color-surface`.

Two constraints worth preserving:

1. `--color-primary-600` is the only step allowed to carry white text (4.9:1).
   `primary-500` is not legible with white on it.
2. White text is never used on `--color-accent-500`; the accent carries text at
   `accent-600`/`accent-700` on tinted backgrounds.

Fonts are `@fontsource` packages (self-hosted Google Fonts, so no external
request). To swap them, change the two `@import` lines at the top of
`index.css` and update `--font-display` / `--font-body`.

### Swapping the artwork

- `public/images/hero-laundry.svg` — replace with the client's photo. Use a
  portrait-ish or square image; it is cropped with `object-cover`. Update
  `hero.imageAlt`.
- `public/images/map-placeholder.svg` — only shown when `mapEmbedUrl` is empty.
- `public/favicon.svg` — the stacked-folders mark.

All images are `loading="lazy"` except the hero, which is `loading="eager"` so
it does not delay the first paint.

---

## Design rules this build enforces

These are not conventions you have to remember — they are checked.

- **No black anywhere.** Text is deep slate-teal (`#14333b`), never `#000`.
  Backgrounds run from near-white to pale aqua. `audit.mjs` fails the build if
  any element resolves to a background or text colour whose brightest channel
  is under 40.
- **No sharp corners.** `img`, `button` and form controls get rounded radii in
  the base layer as a safety net, on top of explicit per-component rounding.
  `audit.mjs` fails on `rounded-none` / `rounded-sm` / `rounded-md`.
- **Nothing overflows horizontally** at 360, 768 or 1280. Verified by
  `audit.mjs`. Note that `min-w-0` on grid children is load-bearing: a grid
  item's default `min-width: auto` lets an image's intrinsic width push the
  column past the viewport.
- **Motion is subtle and optional.** Scroll reveals, card lifts and button
  presses are all transform/opacity only, and every one is disabled under
  `prefers-reduced-motion`.
- **The "Open now" badge cannot lie** — it is computed from the same `hours`
  array as the table and the structured data.

## Accessibility notes

- One `<h1>` (in the hero), `<h2>` per section, `<h3>` per card.
- Both filter tablists use a roving tabindex **with arrow-key handling**. Roving
  tabindex on its own would make unselected tabs keyboard-unreachable.
- The order sheet is a real `role="dialog"` with `aria-modal`, a focus trap,
  Escape-to-close, and focus returned to whatever opened it. When closed it is
  `inert`, not merely `aria-hidden` — `aria-hidden` alone would leave its
  buttons in the tab order.
- Stepper buttons say what they do ("Add one kg of Wash & fold"), not "+".
- The running total is an `aria-live` region.
- Focus rings are visible and rounded everywhere.
- Decorative SVGs are `aria-hidden`.

## SEO

`index.html` is a bare shell. `vite.config.js` injects the `<title>`, meta
description, canonical link, Open Graph/Twitter tags and `LocalBusiness`
JSON-LD **at build time** from `business.js`, so the shipped HTML is complete
without running JavaScript. The schema uses `DryCleaningOrLaundry`, the actual
schema.org type for this business (there is no `LaundryService` type).