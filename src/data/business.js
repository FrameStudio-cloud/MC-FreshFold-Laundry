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

export const siteUrl = 'https://freshfold.co.ke' // [REPLACE]

export const business = {
  // ---------------------------------------------------------------- identity
  name: 'FreshFold Laundry', // [REPLACE]
  shortName: 'FreshFold', // [REPLACE] Used where space is tight
  tagline: 'Laundry done properly, right in {area}', // [REPLACE] {area} is replaced at runtime
  description:
    'Wash & fold, dry cleaning, ironing, duvets and shoe cleaning in {area}. Free pickup and delivery, with same-day express service. Order on WhatsApp.', // [REPLACE]

  currency: 'KES',

  // ---------------------------------------------------------------- contact
  // Digits only, no +, no spaces. This is what wa.me needs.
  whatsapp: '254700000000', // [REPLACE]
  phoneDisplay: '+254 700 000 000', // [REPLACE]
  phoneDial: '+254700000000', // [REPLACE]
  email: 'hello@freshfold.co.ke', // [OPTIONAL] blank hides the row
  instagram: 'freshfold.laundry', // [REPLACE]
  instagramUrl: 'https://instagram.com/freshfold.laundry', // [REPLACE]

  // ---------------------------------------------------------------- location
  area: 'Riverside', // [REPLACE]
  city: 'Nairobi',
  country: 'Kenya',
  addressLine: 'Riverside Drive, off Ngong Road', // [REPLACE]
  directionsNote: 'Free parking behind the building. Ring the blue bell.', // [OPTIONAL]

  // A real embed URL from Google Maps (Share > Embed a map > copy the `src`
  // value only) gives you a live map. Left as '' the site shows the designed
  // placeholder in public/images/map-placeholder.svg instead.
  mapEmbedUrl: '', // [REPLACE]
  mapLinkUrl: 'https://maps.google.com/?q=Riverside+Nairobi', // [REPLACE]
  mapPlaceholder: '/images/map-placeholder.svg', // [OPTIONAL]

  /**
   * Opening hours. This ONE array drives three things: the rendered hours
   * table, the "Open now / Closed now" badge, and openingHoursSpecification in
   * the JSON-LD schema. They cannot drift apart because there is only one
   * source.
   *
   * `days` must use full English day names for schema.org to accept them.
   */
  hours: [
    { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '07:00', closes: '19:00' },
    { days: ['Saturday'], opens: '08:00', closes: '18:00' },
    { days: ['Sunday'], opens: '09:00', closes: '15:00' }, // [REPLACE] delete the line for closed Sundays
  ],

  // ---------------------------------------------------------------- delivery
  delivery: {
    available: true, // [REPLACE] false hides every "free pickup" mention and the delivery step
    free: true, // [REPLACE]
    feeNote: 'Free pickup and delivery within {area}. Outside {area} we collect at a small fee — we will confirm on WhatsApp.', // [REPLACE]
    areas: ['Riverside', 'Lavington', 'Kilimani', 'Parklands', 'Ngong Road', 'Westlands'], // [REPLACE]
    sameDayCutoff: 'Order before 10:00 AM for same-day express delivery.', // [REPLACE]
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
   * Category ids must match an id in `categories` below. The "All" pill is
   * generated automatically — do not add it here.
   */
  categories: [
    { id: 'wash', label: 'Wash & fold' },
    { id: 'dry-clean', label: 'Dry clean' },
    { id: 'ironing', label: 'Ironing' },
    { id: 'home', label: 'Home items' },
    { id: 'shoes', label: 'Shoes' },
    { id: 'express', label: 'Express' },
  ],

  /**
   * `unit` is the thing the +/- buttons count. This is the single most
   * important field on a laundry site: a shirt is counted as an item, a
   * duvet load is counted in kg, dry cleaning is counted per piece.
   *   'kg'    -> stepper label reads "kg"
   *   'item'  -> stepper label reads "items"
   *   'job'   -> whole jobs; stepper label reads "jobs"
   *   null    -> stepper is hidden and the card shows "Add" only (flat pricing)
   *
   * `price` is a NUMBER in KES. The "From KES ..." wording comes from the
   * `pricePrefix` field, so the unit and the wording never disagree.
   */
  services: [
    {
      id: 'wash-fold',
      category: 'wash',
      name: 'Wash & fold',
      icon: 'washing',
      description:
        'Your everyday load, washed at 30°C, dried and folded. Sorted by colour so nothing bleeds onto anything else.',
      price: 150,
      pricePrefix: 'From',
      unit: 'kg',
      priceNote: 'per kg. Minimum 3 kg.',
      turnaround: '24–48 hours',
      popular: true,
    },
    {
      id: 'dry-clean',
      category: 'dry-clean',
      name: 'Dry cleaning',
      icon: 'sparkles',
      description:
        'Real solvent cleaning for suits, gowns and lined clothing. Garment comes back pressed, with the shape intact.',
      price: 900,
      pricePrefix: 'From',
      unit: 'item',
      priceNote: 'per item. Suits quoted per piece.',
      turnaround: '3–5 days',
    },
    {
      id: 'ironing-only',
      category: 'ironing',
      name: 'Ironing only',
      icon: 'flame',
      description:
        'Already clean, just creased. We press it properly — collars, cuffs and plackets included, not just the flat bits.',
      price: 100,
      pricePrefix: 'From',
      unit: 'item',
      priceNote: 'per item. Minimum 5 items.',
      turnaround: 'Same day',
    },
    {
      id: 'duvets',
      category: 'home',
      name: 'Duvets & beddings',
      icon: 'bed',
      description:
        'Pillows and duvets washed, dried and fluffed. We check for tears first and tell you before we start.',
      price: 1200,
      pricePrefix: 'From',
      unit: 'item',
      priceNote: 'per duvet or pillow set.',
      turnaround: '2–3 days',
    },
    {
      id: 'shoes',
      category: 'shoes',
      name: 'Shoe cleaning',
      icon: 'shoe',
      description:
        'Sneakers, boots and leather cleaned inside and out, laces washed, dried in a controlled cabinet — never in direct sun.',
      price: 800,
      pricePrefix: 'From',
      priceNote: 'per pair. Boots quoted individually.',
      unit: 'item',
      turnaround: '2 days',
    },
    {
      id: 'curtains',
      category: 'home',
      name: 'Curtains & linens',
      icon: 'curtain',
      description:
        'Curtains, tablecloths and bed linens. Heavy fabrics are washed in a larger drum so they come out evenly clean.',
      price: 350,
      pricePrefix: 'From',
      unit: 'kg',
      priceNote: 'per kg. Minimum 4 kg.',
      turnaround: '2–3 days',
    },
    {
      id: 'express',
      category: 'express',
      name: 'Same-day express',
      icon: 'bolt',
      description:
        'Priority queue for wash & fold and ironing. Order before 10:00 AM and it comes back the same evening.',
      price: 300,
      pricePrefix: 'From',
      unit: 'kg',
      priceNote: 'per kg. Includes express handling.',
      turnaround: 'Same day',
      accent: true, // paints the card with the warm accent — use sparingly
    },
  ],

  // ---------------------------------------------------------------- price list
  priceList: {
    eyebrow: 'Straightforward pricing',
    title: 'What it costs, item by item',
    intro:
      'Prices below are for wash & fold unless the row says otherwise. We confirm the final price on WhatsApp before we start — no surprises at collection.',
    note: 'Prices are [REPLACE as of Oct 2026] and include VAT.', // [REPLACE]
    /**
     * Groups become rounded tab targets, and each group becomes a card of
     * rounded rows. Add, rename or delete groups freely.
     */
    groups: [
      {
        id: 'everyday',
        label: 'Everyday clothing',
        note: 'Wash & fold, 30°C, folded',
        items: [
          { name: 'Shirt', price: 120 },
          { name: 'Trouser', price: 150 },
          { name: 'T-shirt', price: 100 },
          { name: 'Dress', price: 220 },
          { name: 'Skirt', price: 160 },
          { name: 'School uniform (set)', price: 600 },
        ],
      },
      {
        id: 'special',
        label: 'Specialist care',
        note: 'Dry cleaned, comes back pressed',
        items: [
          { name: 'Suit jacket', price: 1200 },
          { name: 'Suit trouser', price: 800 },
          { name: 'Gown / cocktail dress', price: 1500 },
          { name: 'Wool coat', price: 1800 },
          { name: 'Leather jacket', price: 2500 },
        ],
      },
      {
        id: 'home',
        label: 'Home items',
        note: 'Bulky items, washed separately',
        items: [
          { name: 'Duvet (single)', price: 1200 },
          { name: 'Duvet (double)', price: 1600 },
          { name: 'Pillow pair', price: 700 },
          { name: 'Curtains (per kg)', price: 350 },
          { name: 'Tablecloth', price: 500 },
          { name: 'Bath towel (each)', price: 250 },
        ],
      },
      {
        id: 'shoes',
        label: 'Shoes',
        note: 'Cleaned inside and out, air dried',
        items: [
          { name: 'Sneakers (pair)', price: 800 },
          { name: 'Leather shoes (pair)', price: 1200 },
          { name: 'Boots (pair)', price: 1400 },
          { name: 'Slides / sandals (pair)', price: 400 },
        ],
      },
    ],
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
  faq: {
    eyebrow: 'Questions',
    title: 'Before you order',
    intro: '', // [OPTIONAL]
    items: [
      {
        q: 'How much does laundry cost?',
        a: 'Wash & fold starts at KES 150 per kg. Dry cleaning starts at KES 900 per item. The full item-by-item list is in the Pricing section above, and we confirm the exact price on WhatsApp before we start.',
      },
      {
        q: 'How long does it take?',
        a: 'Wash & fold is normally 24–48 hours, dry cleaning 3–5 days. Same-day express is available for wash & fold and ironing if you order before 10:00 AM.',
      },
      {
        q: 'Can you remove a stain that has already set?',
        a: 'Usually, yes — but not always. Send us a photo of the stain with the fabric type when you message us and we will tell you honestly whether it will lift before you pay for the treatment.',
      },
      {
        q: 'Which areas do you collect from?',
        a: 'We collect free of charge in {area}, Lavington, Kilimani, Parklands, Ngong Road and Westlands. If you are just outside that, message us — we will usually still be able to help.',
      },
      {
        q: 'How do I pay?',
        a: 'M-Pesa to the number we send you on WhatsApp, or cash at handover. We confirm the amount before collection and send a receipt once your order is back.',
      },
      {
        q: 'Do you wash delicate or expensive items?',
        a: 'Yes. Silks, linens, wool and anything labelled hand-wash are done separately at low temperature. Tell us in your message if a piece is special — we never put it in with the regular load.',
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