/**
 * ============================================================================
 *  ONE FILE TO EDIT FOR A NEW CLIENT.
 * ============================================================================
 *
 *  Every piece of copy, price, image, link, icon name and opening hour on this
 *  site is read from here. No component contains hardcoded business text.
 *
 *  Search this file for these markers to find things fast:
 *    [REPLACE]  something you must change before going live
 *    [OPTIONAL] safe to leave as-is
 *
 *  ICONS are referenced by NAME (a string), not imported. src/utils/icons.js
 *  maps each name to a lucide-react component. If you use a name that is not
 *  in that map, the site renders a neutral fallback dot rather than crashing.
 * ============================================================================
 */

export const siteUrl = 'https://mc-fresh-fold-laundry.vercel.app' // [REPLACE] the real deployed origin

export const business = {
  // ---------------------------------------------------------------- identity
  // Values here mirror the shop's own store_settings row in keel, so the
  // build-time SEO in src/utils/seo.js and the offline fallback are both
  // correct. useShopSettings overlays the live row on top, so an owner editing
  // their details in Keel updates the page without a rebuild.
  name: 'OLFATTA', // [REPLACE]
  shortName: 'OLFATTA', // [REPLACE] Used where space is tight
  tagline: 'Laundry collected from your door in {area}', // [REPLACE] {area} is replaced at runtime
  description:
    'Wash & fold, dry cleaning, pressing and duvet cleaning in {area}, {city}. Order on WhatsApp and we collect from your door.', // [REPLACE]

  currency: 'KSh',

  // ---------------------------------------------------------------- contact
  // Canonical international form, digits only. utils/whatsapp.js also accepts
  // the local form the owner types in Keel ("0793302518") and normalises it.
  whatsapp: '254793302518', // [REPLACE]
  phoneDisplay: '+254 793 302 518', // [REPLACE]
  phoneDial: '+254793302518', // [REPLACE]
  email: '', // [OPTIONAL] blank hides the row
  instagram: '', // [OPTIONAL] blank hides the row
  instagramUrl: '', // [OPTIONAL]

  // The shop's own mark. Rendered only if it loads; the inline SVG wordmark is
  // the fallback so a dead storage URL cannot leave a broken image in the
  // header. Remove to keep the SVG.
  logo: 'https://hmcowpwfefeeossztuem.supabase.co/storage/v1/object/public/product-images/086468f9-a675-490b-8c97-249bacf8b8a6/1784675514621-vec9bu.png', // [REPLACE]

  // ---------------------------------------------------------------- location
  area: 'Kariani', // [REPLACE]
  city: 'Muranga', // [REPLACE]
  country: 'Kenya',
  // Rendered on its own — components do not append area/city to it, because the
  // database stores a single combined "Kariani, Muranga" string.
  addressLine: 'Kariani, Muranga', // [REPLACE]
  directionsNote: '', // [OPTIONAL] blank hides the note

  // A real embed URL from Google Maps (Share > Embed a map > copy the `src`
  // value only) gives you a live map. Left as '' the site shows the designed
  // placeholder in public/images/map-placeholder.svg instead.
  mapEmbedUrl: '', // [REPLACE]
  mapLinkUrl: 'https://maps.google.com/?q=Kariani+Muranga', // [REPLACE]
  mapPlaceholder: '/images/map-placeholder.svg', // [OPTIONAL]

  /**
   * Opening hours. This ONE array drives three things: the rendered hours
   * table, the "Open now / Closed now" badge, and openingHoursSpecification in
   * the JSON-LD schema. They cannot drift apart because there is only one
   * source.
   *
   * `days` must use full English day names for schema.org to accept them.
   * Mirrors store_settings.business_hours for this shop.
   */
  hours: [{ days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], opens: '08:00', closes: '17:00' }],

  // ---------------------------------------------------------------- delivery
  // [REPLACE] CONFIRM WITH THE OWNER. The database has no delivery settings, so
  // the areas below are placeholders and the copy makes no promise about fees
  // until it is confirmed.
  delivery: {
    available: true, // [REPLACE] false hides every "free pickup" mention and the delivery step
    free: true, // [REPLACE]
    feeNote: 'We collect from your door in {area} and around Muranga. Message us to confirm your area and the collection time.', // [REPLACE]
    areas: ['Kariani', 'Muranga Town', 'Kangema'], // [REPLACE]
    sameDayCutoff: 'Order early and we will prioritise your wash for same-day collection.', // [REPLACE]
  },

  // ---------------------------------------------------------------- nav
  /** Label for the sticky header's WhatsApp button. */
  navOrderLabel: 'Order now', // [REPLACE]
  nav: [
    { label: 'Services', href: '#services' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Reviews', href: '#reviews' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Find us', href: '#contact' },
  ],

  // ---------------------------------------------------------------- hero
  hero: {
    eyebrow: 'Laundry in {area} since 2016', // [REPLACE]
    headline: 'Your laundry, folded and fresh',
    headlineAccent: 'back before dinner.',
    subtext:
      'Wash & fold, dry cleaning and ironing collected from your door in {area}. Same-day express available — you only ever order by WhatsApp.',
    primaryCta: 'Order on WhatsApp', // [REPLACE]
    secondaryCta: 'See our prices',
    trust: [
      { icon: 'truck', label: 'Free pickup & delivery' },
      { icon: 'bolt', label: 'Same-day express' },
      { icon: 'leaf', label: 'Fragrance-free option' },
      { icon: 'shield', label: 'Carefully hand-sorted' },
    ],
    image: '/images/hero-laundry.svg', // [REPLACE] any /path, remote URL, or drop-in .jpg
    imageAlt: 'Illustration of a neat stack of freshly folded laundry with soap bubbles', // [REPLACE]
    // Small floating card pinned to the hero image. Set to null to hide.
    badge: {
      icon: 'clock',
      title: 'Back in 24 hours',
      note: 'or same-day if you order early', // [REPLACE]
    },
  },

  // ---------------------------------------------------------------- catalogue
  servicesSection: {
    eyebrow: 'Our services', // [REPLACE]
    intro:
      'Pick a service, set how much you have, and send the whole thing to us on WhatsApp in one tap.', // [REPLACE]
  },
  /**
   * Filter groups, in the order the pills appear.
   *
   * These are groups of the shop's services, NOT the `category` column in the
   * database. That column is free text with no constraint, and every service in
   * this shop sits in a single value ("laundry"), so it cannot drive a filter
   * without seventeen manual edits and no way to stop someone typing "Laundry"
   * next to "laundry". Grouping lives here instead; the database owns the facts
   * (name, price, unit) and this owns the presentation.
   *
   * A group with no services is not rendered, so leaving a group here while
   * the shop does not offer it is harmless.
   */
  categories: [
    { id: 'wash', label: 'Wash & fold' },
    { id: 'ironing', label: 'Ironing' },
    { id: 'dry-clean', label: 'Dry clean' },
    { id: 'home', label: 'Home items' },
    { id: 'shoes', label: 'Shoes' },
    { id: 'express', label: 'Express' },
  ],

  /**
   * Display order for the whole catalogue.
   *
   * /api/services orders by `category, name`, which is alphabetical — that
   * puts "Blanket Wash" first and "Wash & Fold" in the middle. The route takes
   * no ?order= parameter, so the order has to live here.
   *
   * Names must match the shop's service names EXACTLY, including the em dash in
   * "Dry Clean — Shirt". A name that does not match is not dropped: it falls
   * back to a default icon, its category's group, and the end of the list. So a
   * typo costs a default icon, never a missing service.
   *
   * Anything missing from this list is still rendered, appended in the order the
   * API returned it. Adding a service in Keel makes it appear without a deploy;
   * this list only decides where it sits.
   */
  serviceOrder: [
    'Wash & Fold',
    'Wash & Iron',
    'Pressing Only',
    'Stain Removal',
    'Express Service',
    'Delicates Hand Wash',
    'Blanket Wash',
    'Dry Clean — Shirt',
    'Dry Clean — Jacket',
    'Dry Clean — Dress',
    'Dry Clean — Suit',
    'Leather Care',
    'Wedding Dress Cleaning',
    'Duvet Cleaning',
    'Curtain Cleaning',
    'Rug Cleaning',
    'Shoe Cleaning',
  ],

  /**
   * Per-service presentation, keyed by the service name.
   *
   *   icon     a name from src/utils/icons.js
   *   group    a `categories[].id` above
   *   popular  adds a "Most booked" badge
   *   accent   paints the card with the warm accent — use on at most one
   *   note     small line under the price, e.g. a minimum order
   *
   * Everything not listed here still renders: default icon per group, no badge.
   * Only the fields above can be set per service; name, description, price and
   * the unit come from the database and must NOT be repeated here, or the page
   * would show two different prices for the same thing.
   */
  servicePresentation: {
    'Wash & Fold': { icon: 'washing', group: 'wash', popular: true },
    'Wash & Iron': { icon: 'wind', group: 'wash' },
    'Delicates Hand Wash': { icon: 'water', group: 'wash' },
    'Blanket Wash': { icon: 'package', group: 'wash' },
    'Pressing Only': { icon: 'flame', group: 'ironing' },
    'Stain Removal': { icon: 'droplet', group: 'ironing' },
    'Dry Clean — Shirt': { icon: 'shirt', group: 'dry-clean' },
    'Dry Clean — Jacket': { icon: 'sun', group: 'dry-clean' },
    'Dry Clean — Dress': { icon: 'sparkles', group: 'dry-clean' },
    'Dry Clean — Suit': { icon: 'hanger', group: 'dry-clean' },
    'Leather Care': { icon: 'shield', group: 'dry-clean' },
    'Wedding Dress Cleaning': { icon: 'gem', group: 'dry-clean' },
    'Duvet Cleaning': { icon: 'bed', group: 'home' },
    'Curtain Cleaning': { icon: 'curtain', group: 'home' },
    'Rug Cleaning': { icon: 'grid', group: 'home' },
    'Shoe Cleaning': { icon: 'shoe', group: 'shoes' },
    'Express Service': { icon: 'bolt', group: 'express', accent: true },
  },


  // ---------------------------------------------------------------- price list
  /**
   * Copy only. The rows are DERIVED from the same /api/services response the
   * service cards use, grouped by `categories`, so the page quotes one price
   * per service in two places and they cannot disagree.
   */
  priceList: {
    eyebrow: 'Straightforward pricing',
    title: 'What it costs, item by item',
    intro:
      'This is the same list we order from, updated whenever the shop changes a price. We confirm your total on WhatsApp before we start.',
    note: 'Prices in the shop\'s own currency. Minimum orders, where they apply, are shown on the service card.', // [REPLACE]
  },

  // ---------------------------------------------------------------- how it works
  steps: {
    eyebrow: 'How it works',
    title: 'Four steps, no errands',
    intro: 'You never need to visit the shop. Everything happens over WhatsApp.', // [OPTIONAL]
    steps: [
      { icon: 'message', title: 'Message us', body: 'Send your list on WhatsApp, or build it on this page and send it in one tap.' },
      { icon: 'truck', title: 'We pick up', body: 'Free collection in {area} at a time that suits you, usually next morning.' },
      { icon: 'washing', title: 'We clean', body: 'Sorted by fabric and colour, washed at the right temperature, never overfilled.' },
      { icon: 'hanger', title: 'We deliver', body: 'Folded, packed and brought back to your door. Express orders return the same day.' },
    ],
  },

  // ---------------------------------------------------------------- benefits
  benefits: {
    eyebrow: 'Why {name}',
    title: 'The things people actually notice',
    intro: '', // [OPTIONAL] blank hides the paragraph
    items: [
      {
        icon: 'droplet',
        title: 'Nothing comes out smelling of the shop',
        body: 'We use a light, clean fragrance — and we will do it fragrance-free if you ask.',
      },
      {
        icon: 'shield',
        title: 'Colours stay separate',
        body: 'Every load is sorted into lights, darks and reds before a machine is switched on.',
      },
      {
        icon: 'clock',
        title: 'We tell you the real turnaround',
        body: 'The time on this page is the time it normally takes. If yours is different, we say so.',
      },
      {
        icon: 'search',
        title: 'Stains looked at properly',
        body: 'We check each stubborn mark by hand and tell you honestly what will and will not lift.',
      },
    ],
  },

  // ---------------------------------------------------------------- testimonials
  reviews: {
    eyebrow: 'Reviews',
    title: 'What {area} says', // {area} is replaced at runtime
    // [REPLACE] These are written placeholders so the layout is reviewable.
    // Swap in real quotes before launch, and set placeholder: false.
    placeholder: true,
    items: [
      {
        name: 'Placeholder Name',
        area: 'Riverside', // [REPLACE]
        quote:
          'Placeholder review. Replace this with a real customer quote about turnaround, folding or stain removal.',
        rating: 5,
        service: 'Wash & fold',
      },
      {
        name: 'Placeholder Name',
        area: 'Lavington', // [REPLACE]
        quote:
          'Placeholder review. Keep it to one thing the customer said — a specific detail is more convincing than a compliment.',
        rating: 5,
        service: 'Express same-day',
      },
      {
        name: 'Placeholder Name',
        area: 'Kilimani', // [REPLACE]
        quote:
          'Placeholder review. Mention the service they used so a visitor can picture themselves ordering the same thing.',
        rating: 4,
        service: 'Dry cleaning',
      },
    ],
  },

  // ---------------------------------------------------------------- faq
  /**
   * Fallback copy only.
   *
   * When VITE_KEEL_SITE_TOKEN is set, these are replaced at runtime by whatever
   * the owner has saved in Keel -> Website (see hooks/useRemoteFaq.js). They
   * exist so the section still renders with no token, or if the API is down.
   *
   * That makes them a correctness risk rather than a spare: a stale price here
   * is a stale price a visitor sees whenever keel-api is unreachable. Keep them
   * aligned with the services list above.
   */
  faq: {
    eyebrow: 'Questions',
    title: 'Before you order',
    intro: '', // [OPTIONAL]
    items: [
      {
        q: 'How much does laundry cost?',
        a: 'Wash & fold is KSh 200 per kg and wash & iron is KSh 300 per kg. Pressing only is KSh 150 per garment. Dry cleaning starts at KSh 350 for a shirt.',
      },
      {
        q: 'How long will my laundry take?',
        a: 'Wash & fold and pressing usually come back within 24 to 48 hours. Dry cleaning takes longer because each piece is cleaned and pressed individually. We will tell you the turnaround when you send your list.',
      },
      {
        q: 'Can you handle delicate fabrics?',
        a: 'Yes. Silks, lace and other delicates are hand washed separately and never go in with the regular load. Tell us in your message which pieces are special.',
      },
      {
        q: 'Do you clean shoes and curtains?',
        a: 'Yes. Shoe cleaning is KSh 250 per pair, cleaned inside and out and air dried. Curtain cleaning is KSh 500 per kg, washed and pressed.',
      },
      {
        q: 'Do you offer same-day service?',
        a: 'Yes. Express service is a flat KSh 500 surcharge for same-day collection. Send your list early in the morning so it can be prioritised.',
      },
      {
        q: 'How do I pay?',
        a: 'M-Pesa to the number we confirm on WhatsApp, or cash at handover. We agree the total before we start and send a receipt when your order is back.',
      },
    ],
  },

  // ---------------------------------------------------------------- contact
  contact: {
    eyebrow: 'Find us',
    title: 'Come in, or we come to you',
    intro: 'Drop off during opening hours, or book a free pickup and never leave the house.', // [OPTIONAL]
  },

  // ---------------------------------------------------------------- closing cta
  finalCta: {
    eyebrow: 'Ready when you are',
    title: 'Send us your laundry list',
    body: 'Photograph it, type it, or build it on this page. Either way you are one message away from clean, folded clothes.',
    button: 'Start my order', // [REPLACE]
    note: 'No app. No account. Just WhatsApp.', // [OPTIONAL] blank hides it
  },

  // ---------------------------------------------------------------- footer
  footer: {
    blurb: 'Wash & fold, dry cleaning and home laundry collected from your door in {area}.', // [REPLACE]
    quickLinksTitle: 'Quick links', // [REPLACE]
    contactTitle: 'Get in touch', // [REPLACE]
    hoursTitle: 'Opening hours', // [REPLACE]
    copyright: 'FreshFold Laundry', // [REPLACE] falls back to business.name
    creditLabel: 'Built by FrameStudio', // [REPLACE]
    creditUrl: 'https://framestudio.co.ke', // [REPLACE]
  },

  // ---------------------------------------------------------------- order drawer
  order: {
    title: 'Your order', // [REPLACE]
    emptyTitle: 'Nothing added yet',
    emptyBody: 'Add items from the services list and they will collect here.', // [REPLACE]
    estimatedLabel: 'Estimated total', // [REPLACE]
    estimateNote:
      'This is an estimate. We confirm the final price on WhatsApp before we start.', // [REPLACE]
    pickupPrompt: 'Pickup address', // [REPLACE]
    cta: 'Send order on WhatsApp', // [REPLACE]
    clear: 'Clear', // [REPLACE]
    removeLabel: 'Remove', // [REPLACE] used as the visually hidden button label
    fabLabel: 'Chat with us on WhatsApp', // [REPLACE]
    drawerOpenLabel: 'Open order summary', // [REPLACE] header button + services-section button
  },
}

/**
 * Copy for the WhatsApp message. Separated so a client can adjust the wording
 * without touching any logic. {tokens} are filled in by src/utils/whatsapp.js.
 */
export const orderMessage = {
  greeting: 'Hi {name}!', // [REPLACE]
  intro: "I'd like to order a laundry service.", // [REPLACE]
  itemsHeader: 'My order:', // [REPLACE]
  totalLabel: 'Estimated total', // [REPLACE]
  addressPrompt: 'Pickup address', // [REPLACE]
  timePrompt: 'Preferred pickup time', // [OPTIONAL]
  thanks: 'Please confirm the total and a pickup time. Thank you!', // [REPLACE]
}

/** Generic one-tap message, used by the nav button, hero, FAB and final CTA. */
export const quickMessage = {
  text: 'Hi {name}! I would like to book a laundry service. Could we arrange a pickup?', // [REPLACE]
}