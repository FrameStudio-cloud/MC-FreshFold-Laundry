/**
 * Text helpers. Currency in particular.
 *
 * Prices are stored as plain numbers in business.js so the order maths never has
 * to parse a string. Formatting happens once, here, at render time.
 */

const KES = new Intl.NumberFormat('en-KE', {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
})

/** 1050 -> "KES 1,050" */
export function formatKES(amount, currency = 'KES') {
  return `${currency} ${KES.format(Math.round(Number(amount) || 0))}`
}

/** 150 -> "KES 150" — same as formatKES but for unit prices, kept separate so
 *  the currency code is easy to spot at call sites. */
export const formatPrice = formatKES

/**
 * Fills {name} / {area} / {city} / {year} / {today} style tokens.
 *
 * Config strings are written with tokens so a client can copy a line from
 * business.js into another file and have it still make sense. Anything not in
 * `values` is left untouched rather than replaced with "undefined" — a typo in
 * the config should look like a typo, not a crash.
 */
export function fillTokens(template, values = {}) {
  if (typeof template !== 'string') return ''
  const fallback = {
    year: String(new Date().getFullYear()),
    today: new Date().toLocaleDateString('en-KE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }),
  }
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(values, key) && values[key] != null
      ? String(values[key])
      : fallback[key] ?? match,
  )
}

/** "1" -> "1 item", "4" -> "4 items". Unit labels come from the config. */
export function pluralize(count, singular, plural) {
  return count === 1 ? singular : (plural ?? `${singular}s`)
}

/** "24-48 hours" -> "24-48 hours". Collapses whitespace from config edits so a
 *  stray line break in a price cell cannot break the meta row layout. */
export const tidy = (value) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : value)