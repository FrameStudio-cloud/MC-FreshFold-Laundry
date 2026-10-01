import { business, orderMessage, quickMessage } from '../data/business.js'
import { fillTokens, formatKES } from './format.js'

/**
 * WhatsApp deep links.
 *
 * wa.me/<digits>?text=<urlencoded> is the whole mechanism. Two rules that are
 * easy to get wrong:
 *   1. Digits only — no +, spaces or dashes. Business config stores the raw
 *      form and this module is the only place it becomes a URL.
 *   2. WhatsApp truncates around 4096 characters, so a huge basket silently
 *      loses the bottom (including the address prompt). We cap and say so.
 */

const MAX_MESSAGE_LENGTH = 3500 // under the limit, leaving headroom for encoding

/**
 * Normalise a Kenyan phone number to 2547XXXXXXXX / 2541XXXXXXXX, or null.
 *
 * The leading-0 rule is the whole point. A shop types their number the way they
 * say it — "0793302518" — and stripping the zero alone yields 793302518, which
 * is 9 digits with no country code, so wa.me builds a link that opens nothing.
 * Verified against the number in the database for the current shop.
 *
 * Mirrors keel's own helper at keel/src/lib/collections.js (`normalizeKenyanPhone`)
 * rather than inventing a fifth copy of this rule; the same logic already appears
 * in ReceiptModal, CollectPaymentModal and features/credit. The 7/1 check accepts
 * Safaricom and Airtel and rejects anything else, so a typo returns null instead
 * of a plausible-looking but wrong number.
 *
 * null means "unusable" and the caller must fall back to the configured number —
 * never link to a number we guessed at.
 */
export function normaliseNumber(raw) {
  let digits = String(raw ?? '').replace(/\D/g, '')
  // 00254… is a legitimate way to write an international number.
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('0')) digits = `254${digits.slice(1)}`
  if (/^254(7|1)\d{8}$/.test(digits)) return digits
  return null
}

/**
 * Builds the wa.me URL, resolving the number through a fallback chain.
 *
 * `number` is whatever the caller has (possibly a live value overlaid from
 * keel-api). business.whatsapp is the configured fallback. If neither parses as
 * a Kenyan number we return null rather than emit wa.me/null: a link that opens
 * nothing is worse than an anchor with no href, which React renders as inert.
 */
function toWaLink(number, text) {
  const target = normaliseNumber(number) ?? normaliseNumber(business.whatsapp)
  if (!target) {
    if (import.meta.env.DEV) {
      console.warn(
        '[whatsapp] no valid Kenyan number from the API or business.whatsapp — ' +
          'WhatsApp links are disabled. Set business.whatsapp to e.g. "0793302518".',
      )
    }
    return null
  }

  const trimmed =
    text.length > MAX_MESSAGE_LENGTH
      ? `${text.slice(0, MAX_MESSAGE_LENGTH)}\n\n(Message too long — see website)`
      : text
  return `https://wa.me/${target}?text=${encodeURIComponent(trimmed)}`
}

/**
 * The general-purpose message. Used by the nav button, hero, final CTA and the
 * floating WhatsApp button, so a visitor who has not built an order still gets
 * a sensible opening message rather than a blank chat.
 */
export function whatsappLink(overrides = {}) {
  const text = fillTokens(quickMessage.text, {
    name: business.shortName || business.name,
    ...overrides,
  })
  return toWaLink(business.whatsapp, text)
}

/**
 * Builds the order message from the basket.
 *
 * Layout is deliberate: greeting, one line per item with quantity and unit
 * price, the total, then the prompts. The address prompt is last because that
 * is what the business has to reply to first, and keeping it on its own line
 * makes it easy to find in a long chat.
 *
 * @param {{service: object, qty: number}[]} items
 */
export function orderWhatsAppLink(items) {
  const tokens = { name: business.shortName || business.name }

  const lines = items.map(({ service, qty }) => {
    const unit = unitNoun(service.unit)
    const each = service.unit ? ` @ ${formatKES(service.price)}/${unitNoun(service.unit, true)}` : ''
    return `• ${service.name} — ${qty} ${unit}${each}`
  })

  const total = items.reduce((sum, i) => sum + i.service.price * i.qty, 0)

  const message = [
    fillTokens(orderMessage.greeting, tokens),
    fillTokens(orderMessage.intro, tokens),
    '',
    fillTokens(orderMessage.itemsHeader, tokens),
    ...lines,
    '',
    `${fillTokens(orderMessage.totalLabel, tokens)}: ${formatKES(total, business.currency)}`,
    '',
    `${fillTokens(orderMessage.addressPrompt, tokens)}:`,
    `${fillTokens(orderMessage.timePrompt, tokens)}:`,
    '',
    fillTokens(orderMessage.thanks, tokens),
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return toWaLink(business.whatsapp, message)
}

/**
 * "kg" stays "kg"; "item" becomes "items" once the count is not one; and
 * arbitrary unit_labels from the database (pair, hr, tire, room, photo, nail)
 * pluralise by suffix, because a hardcoded switch would print "2 pair".
 *
 * Pass singular=true for a per-unit price ("KSh 250/pair") and for a button that
 * acts on exactly one unit ("Add one item").
 */
export function unitNoun(unit, singular = false) {
  if (!unit) return ''
  if (unit === 'kg') return 'kg'
  if (singular) return unit === 'item' ? 'item' : unit === 'job' ? 'job' : unit
  if (unit === 'item') return 'items'
  if (unit === 'job') return 'jobs'
  // Mass nouns and already-plural labels must not gain an "s".
  if (/s$|^(kg|g|ml|l)$/i.test(unit)) return unit
  return `${unit}s`
}

/** Label for the +/- stepper, e.g. { singular: 'kg', plural: 'kg' }. */
export function unitLabel(unit) {
  if (!unit) return null
  return { singular: unitNoun(unit, true), plural: unitNoun(unit) }
}

/** The price on its own, e.g. "From KES 150" — the headline a card renders. */
export function priceHead(service) {
  const amount = formatKES(service.price, business.currency)
  return service.pricePrefix ? `${service.pricePrefix} ${amount}` : amount
}

/** Full price line including the note, e.g. "From KES 150 per kg. Minimum 3 kg."
 *  Used in outgoing WhatsApp text, where length costs nothing. */
export function priceLine(service) {
  const head = priceHead(service)
  if (service.priceNote) return `${head} ${service.priceNote}`
  if (service.unit) return `${head} per ${unitNoun(service.unit, true)}`
  return head
}