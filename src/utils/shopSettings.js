import { business } from '../data/business.js'
import { normaliseNumber } from './whatsapp.js'
import { isKnownIcon } from './icons.js'

/**
 * Maps the shop's `store_settings` row onto this site's config shape.
 *
 * Written as a normaliser rather than a direct assignment for one reason:
 * **an empty or null value from the database must never overwrite good config
 * copy.** The live row for this shop has null description, null about, null
 * tagline and empty strings for every social — a naive
 * `business.name = row.store_name` pattern applied the same way would blank the
 * hero subtitle and delete the Instagram link. Every field here is therefore
 * applied only when it carries something usable.
 *
 * That makes this the safe place to grow: a field can be added to the API
 * response and picked up here without any risk of an empty string winning.
 */

/**
 * The database stores addresses in whatever case the owner typed, and this one
 * is "KARIANI, MURANGA" — which reads as shouting in a contact card.
 *
 * Only rewrites a string that is ENTIRELY uppercase, so a genuinely
 * mixed-case name is never mangled: "McCARTY STREET" keeps its internal caps
 * where a blanket title-case would produce "Mccarty Street".
 */
function tidyCase(value) {
  const text = value.trim()
  if (text !== text.toUpperCase()) return text
  return text
    .toLowerCase()
    .replace(/(^|[\s,.'()-])(\p{L})/gu, (_, sep, letter) => sep + letter.toUpperCase())
}

const isText = (value) => typeof value === 'string' && value.trim().length > 0

/** A phone for display: '+254 793 302 518' from any accepted input. */
function toDisplay(phone254) {
  const local = `0${phone254.slice(3)}`
  return `+254 ${local.slice(1, 4)} ${local.slice(4, 7)} ${local.slice(7)}`
}

const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const DAY_NAMES = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}

/**
 * `business_hours` is jsonb with no shape constraint, and this database
 * genuinely contains more than one. All three are handled:
 *
 *   { mon: { open: '08:00', close: '17:00', active: true } }   <- what the app writes
 *   { mon: '8:00-18:00', sun: 'closed' }                        <- what seed.mjs writes
 *   '{"mon":{"open":"08:00"}}'                                  <- it can arrive as a string
 *
 * Consecutive days sharing identical hours are merged into one row so the table
 * reads "Monday – Friday" rather than seven identical lines, and a day marked
 * inactive or 'closed' is dropped rather than rendered as a 00:00-00:00 row.
 *
 * Returns [] when nothing usable is present, and the caller keeps config.
 */
export function parseBusinessHours(raw) {
  let data = raw

  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      return []
    }
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return []

  /** @type {{days: string[], opens: string, closes: string}[]} */
  const byKey = new Map()

  for (const day of DAY_ORDER) {
    const entry = data[day] ?? data[DAY_NAMES[day].toLowerCase()]
    if (entry == null) continue

    let opens = null
    let closes = null

    if (typeof entry === 'string') {
      const closed = /^closed$/i.test(entry.trim())
      const match = entry.trim().match(/^(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})$/)
      if (closed) continue
      if (match) {
        opens = `${match[1].padStart(2, '0')}:${match[2]}`
        closes = `${match[3].padStart(2, '0')}:${match[4]}`
      }
    } else if (typeof entry === 'object') {
      if (entry.active === false) continue
      if (isText(entry.open) && isText(entry.close)) {
        opens = entry.open.trim()
        closes = entry.close.trim()
      }
    }

    if (!opens || !closes) continue
    const key = `${opens}-${closes}`
    if (byKey.has(key)) byKey.get(key).days.push(DAY_NAMES[day])
    else byKey.set(key, { days: [DAY_NAMES[day]], opens, closes })
  }

  return [...byKey.values()]
}

/**
 * Build the list of config patches for a settings row.
 *
 * Returns a plain array of assignments rather than mutating anything itself, so
 * it is trivially inspectable and testable, and so a caller can decide whether
 * to apply it (useShopSettings) or not.
 */
export function shopSettingsPatches(raw) {
  if (!raw || typeof raw !== 'object') return []

  const patches = []

  if (isText(raw.store_name)) {
    patches.push(() => {
      business.name = raw.store_name.trim()
      business.shortName = business.name
    })
  }

  // The number is taken from `whatsapp` and falls back to `store_phone`, because
  // a shop may have filled in one and not the other. normaliseNumber rejects
  // anything that is not a real Kenyan mobile, so a typo cannot become a
  // wa.me link to a stranger.
  const phone = normaliseNumber(raw.whatsapp) ?? normaliseNumber(raw.store_phone)
  if (phone) {
    patches.push(() => {
      business.whatsapp = phone
      business.phoneDisplay = toDisplay(phone)
      business.phoneDial = `+${phone}`
    })
  }

  if (isText(raw.store_address)) {
    patches.push(() => {
      business.addressLine = tidyCase(raw.store_address)
    })
  }

  if (isText(raw.currency_symbol)) {
    patches.push(() => {
      business.currency = raw.currency_symbol.trim()
    })
  }

  if (isText(raw.logo_url)) {
    patches.push(() => {
      business.logo = raw.logo_url.trim()
    })
  }

  // Socials are stored as '' when unset, so isText is the whole guard needed.
  if (isText(raw.instagram)) {
    patches.push(() => {
      business.instagram = raw.instagram.trim().replace(/^@/, '')
      business.instagramUrl = `https://instagram.com/${business.instagram}`
    })
  }

  const hours = parseBusinessHours(raw.business_hours)
  if (hours.length) {
    patches.push(() => {
      business.hours = hours
    })
  }

  return patches
}

/** The shop's own feature switches, once keel-api publishes feature_toggles. */
export function shopFeatureToggles(raw) {
  const toggles = raw?.feature_toggles
  if (!toggles || typeof toggles !== 'object' || Array.isArray(toggles)) return {}
  return toggles
}

/**
 * The area names the OWNER saved, and only those.
 *
 * Kept separate from the patches on purpose. `deliveryPatches` falls back to
 * the config, so reading `business.delivery.areas` afterwards would hand back
 * the placeholder list whether or not anyone saved anything — and publishing
 * those as `areaServed` in the structured data is exactly the thing the
 * runtime merge exists to avoid.
 *
 * Returns [] when nothing usable was saved, which is the signal the caller
 * should treat as "publish no area at all".
 */
export function savedAreas(rows) {
  const content = rows?.[0]?.content
  if (!content || typeof content !== 'object' || !Array.isArray(content.areas)) return []
  return content.areas
    .map((row) => (typeof row?.name === 'string' ? row.name.trim() : ''))
    .filter(Boolean)
}

/**
 * Patches for the delivery block, from a `pages.delivery.sections[].details`
 * row the owner saved in Keel -> Website.
 *
 * Only the three fields declared in the manifest are read. `delivery.free`
 * deliberately is NOT: "is pickup free" is a boolean, and the editor has no
 * boolean type, so it would arrive as the string "yes" and the page would have
 * to guess at it. It stays in business.js where a typo is impossible.
 *
 * Same non-empty-only rule as the rest of this file: an empty textarea is a
 * blank the owner left, not a request to delete the sentence.
 */
export function deliveryPatches(rows) {
  const content = rows?.[0]?.content
  if (!content || typeof content !== 'object') return []

  const patches = []

  if (isText(content.note)) {
    patches.push(() => {
      business.delivery.feeNote = content.note.trim()
    })
  }

  if (isText(content.same_day)) {
    patches.push(() => {
      business.delivery.sameDayCutoff = content.same_day.trim()
    })
  }

  const areas = savedAreas(rows)
  if (areas.length) {
    patches.push(() => {
      business.delivery.areas = areas
    })
  }

  // A note about collection is a promise about the whole town, so the card only
  // earns its place once there is something to show.
  if (patches.length) {
    patches.push(() => {
      business.delivery.available = true
    })
  }

  return patches
}

/* ------------------------------------------------- owner-editable copy blocks */

/**
 * Ceiling on one owner-supplied string. Long enough for any heading or sentence,
 * short enough that a pasted paragraph cannot reflow a whole page.
 */
const MAX_ITEM_TEXT = 400

/**
 * Owner-supplied array items, with icons that cannot silently become a dot.
 *
 * `icons.js` shipped `isKnownIcon` to catch exactly this and nothing called it,
 * which let `clock` sit in the config rendering a neutral dot on the live site.
 * Owners typing icon names has no code review at all, so the check moves here and
 * becomes part of the read path rather than a test that can be skipped.
 *
 * An unrecognised or blank icon falls back to the icon already configured for
 * that position. The honest limitation: that is index-based, so an owner who
 * reorders their items without setting icons can pick up a neighbour's icon.
 * Documented rather than hidden, and still better than every icon silently
 * becoming a dot.
 *
 * Returns null when nothing usable was saved, which is the caller's signal to
 * keep the config array — the same "config is the floor" rule as every other
 * field in this file.
 *
 * @param {unknown} saved    the array the owner saved
 * @param {Array}  fallback  the config array, for icon defaults
 * @param {object} opts      which key holds the item's text, and what else to keep
 */
function ownerItems(saved, fallback, { textKey, keep = [] }) {
  if (!Array.isArray(saved) || !saved.length) return null

  const out = []
  for (const [index, item] of saved.entries()) {
    if (!item || typeof item !== 'object') continue

    const text = typeof item[textKey] === 'string' ? item[textKey].trim() : ''
    if (!text) continue

    const row = { [textKey]: text.slice(0, MAX_ITEM_TEXT) }
    for (const key of keep) {
      if (key === textKey) continue
      const value = typeof item[key] === 'string' ? item[key].trim() : ''
      if (value) row[key] = value.slice(0, MAX_ITEM_TEXT)
    }

    const typed = typeof item.icon === 'string' ? item.icon.trim() : ''
    const configured = fallback?.[index]?.icon
    row.icon = isKnownIcon(typed) ? typed : typeof configured === 'string' ? configured : ''

    out.push(row)
  }

  return out.length ? out : null
}

/** One non-empty string field. Keeps the config copy when blank. */
function textPatch(content, key, apply) {
  if (!isText(content[key])) return null
  const value = content[key].trim()
  return () => apply(value)
}

/**
 * Patches for the homepage banner, from a `pages.hero.sections[].banner` row.
 *
 * The hero image and the floating badge stay in business.js by decision: the
 * image is a designed illustration rather than shop data, and the badge carries a
 * turnaround promise that should be changed deliberately.
 *
 * Manifest keys are snake_case because Keel drops any key containing an uppercase
 * letter: `headlineAccent` and `primaryCta` were both silently removed from the
 * editor for exactly that reason. The mapping to the config's camelCase lives
 * here so the constraint is stated once.
 */
export function heroPatches(rows) {
  const content = rows?.[0]?.content
  if (!content || typeof content !== 'object') return []

  const patches = []
  const add = (key, apply) => {
    const patch = textPatch(content, key, apply)
    if (patch) patches.push(patch)
  }

  add('eyebrow', (v) => { business.hero.eyebrow = v })
  add('headline', (v) => { business.hero.headline = v })
  add('headline_accent', (v) => { business.hero.headlineAccent = v })
  add('subtext', (v) => { business.hero.subtext = v })
  add('primary_cta', (v) => { business.hero.primaryCta = v })
  add('secondary_cta', (v) => { business.hero.secondaryCta = v })

  const trust = ownerItems(content.trust, business.hero.trust, { textKey: 'label' })
  if (trust) patches.push(() => { business.hero.trust = trust })

  return patches
}

/** Patches for the "how it works" steps, from `pages.how_it_works`. */
export function howItWorksPatches(rows) {
  const content = rows?.[0]?.content
  if (!content || typeof content !== 'object') return []

  const patches = []
  const add = (key, apply) => {
    const patch = textPatch(content, key, apply)
    if (patch) patches.push(patch)
  }

  add('eyebrow', (v) => { business.steps.eyebrow = v })
  add('title', (v) => { business.steps.title = v })
  add('intro', (v) => { business.steps.intro = v })

  const steps = ownerItems(content.steps, business.steps.steps, { textKey: 'title', keep: ['body'] })
  if (steps) patches.push(() => { business.steps.steps = steps })

  return patches
}

/** Patches for the "why choose us" benefits, from `pages.benefits`. */
export function benefitsPatches(rows) {
  const content = rows?.[0]?.content
  if (!content || typeof content !== 'object') return []

  const patches = []
  const add = (key, apply) => {
    const patch = textPatch(content, key, apply)
    if (patch) patches.push(patch)
  }

  add('eyebrow', (v) => { business.benefits.eyebrow = v })
  add('title', (v) => { business.benefits.title = v })
  add('intro', (v) => { business.benefits.intro = v })

  const items = ownerItems(content.items, business.benefits.items, { textKey: 'title', keep: ['body'] })
  if (items) patches.push(() => { business.benefits.items = items })

  return patches
}