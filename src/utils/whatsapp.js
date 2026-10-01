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

/** Strips everything that is not a digit, then drops a leading 00 or 0. */
export function normaliseNumber(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '')
  if (digits.startsWith('00')) return digits.slice(2)
  if (digits.startsWith('0') && digits.length > 9) return digits.slice(1)
  return digits
}

function toWaLink(number, text) {
  const trimmed =
    text.length > MAX_MESSAGE_LENGTH
      ? `${text.slice(0, MAX_MESSAGE_LENGTH)}\n\n(Message too long — see website)`
      : text
  return `https://wa.me/${normaliseNumber(number)}?text=${encodeURIComponent(trimmed)}`
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

/** "kg" stays "kg"; "item" becomes "items" once the count is not one. */
export function unitNoun(unit, singular = false) {
  switch (unit) {
    case 'kg':
      return 'kg'
    case 'item':
      return singular ? 'item' : 'items'
    case 'job':
      return singular ? 'job' : 'jobs'
    default:
      return unit ?? ''
  }
}

/** Label for the +/- stepper, e.g. { singular: 'kg', plural: 'kg' }. */
export function unitLabel(unit) {
  if (!unit) return null
  if (unit === 'item') return { singular: 'item', plural: 'items' }
  if (unit === 'job') return { singular: 'job', plural: 'jobs' }
  return { singular: unit, plural: unit }
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