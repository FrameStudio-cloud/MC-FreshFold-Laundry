/**
 * Text helpers. Currency in particular.
 *
 * Prices are stored as plain numbers in business.js so the order maths never has
 * to parse a string. Formatting happens once, here, at render time.
 */

import { business } from '../data/business.js'

const NUMBER = new Intl.NumberFormat('en-KE', {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
})

/**
 * 1050 -> "KSh 1,050"
 *
 * The currency defaults to the shop's own symbol rather than a literal, because
 * a hardcoded default is how the same page ends up printing "KES 200/kg" in the
 * order lines and "KSh 1,800" in the total: every call site has to remember to
 * pass the currency, and the one that forgets is invisible until an order is
 * actually sent.
 */
export function formatKES(amount, currency = business.currency) {
  return `${currency} ${NUMBER.format(Math.round(Number(amount) || 0))}`
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