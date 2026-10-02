import { useEffect, useState } from 'react'
import { business } from '../data/business.js'
import { fetchTestimonials, hasToken } from '../api/keelClient.js'

/**
 * Customer reviews, preferring whatever the owner has saved in Keel.
 *
 * Sibling of useRemoteFaq: two callers, two shapes, and one abstraction loose
 * enough to cover both would be worse than two honest ones.
 *
 * The one thing this gets right that a plain FAQ copy would not is the honesty
 * flag. business.reviews.placeholder is true in the shipped config, and the
 * component shows a warning banner because an invented "★★★★★ Verified customer"
 * is the kind of detail that gets a small business into trouble. Saving real
 * reviews in Keel must therefore CLEAR that warning, not sit behind it - the
 * owner's real quotes replace the placeholders, so continuing to say
 * "placeholder reviews" would be its own small lie.
 *
 * Which is also why `isRemote` exists: the caller needs to know whether it is
 * showing owner-supplied reviews or the config's, and that is a different question
 * from "are there any".
 */
const MAX_QUOTE = 600
const MAX_NAME = 80

const str = (v) => (typeof v === 'string' ? v.trim() : '')

/**
 * Rating, defensively.
 *
 * The manifest has no numeric field type - only text, textarea, image and array -
 * so this is a free-text box the owner types into. Anything unreadable, or out of
 * range, falls back to 5 rather than rendering an empty or broken star row.
 */
function rating(value) {
  const n = Number.parseInt(str(value), 10)
  if (!Number.isFinite(n)) return 5
  return Math.min(5, Math.max(1, n))
}

/**
 * Pull the title and the items out of the saved section.
 *
 * Returns null when nothing usable was saved, which is what keeps "not loaded
 * yet" distinguishable from "loaded and empty" — the same signal the FAQ hook
 * uses, and the reason a brand-new shop is not treated as having opinions.
 *
 * title is a section field and items is an array field; they live side by side in
 * the same content column but are edited separately, so neither implies the other.
 */
function normalise(rows) {
  const out = []
  let title = ''

  for (const row of rows) {
    const content = row?.content
    if (!content || typeof content !== 'object') continue

    if (!title) title = str(content.title).slice(0, MAX_NAME)

    const items = content.items
    if (!Array.isArray(items)) continue

    for (const item of items) {
      const quote = str(item?.quote).slice(0, MAX_QUOTE)
      const name = str(item?.name).slice(0, MAX_NAME)
      // A quote with no name is still publishable, but an empty quote is not a
      // review. Both checks are here because the column is free-text jsonb.
      if (!quote) continue
      out.push({
        quote,
        name: name || 'Customer',
        area: str(item?.area).slice(0, MAX_NAME),
        service: str(item?.service).slice(0, MAX_NAME),
        rating: rating(item?.rating),
      })
    }
  }

  return { title, items: out }
}

export function useRemoteTestimonials() {
  const fallback = business.reviews.items
  // { title, items } or null. Null is "nothing usable saved", which is what keeps
  // "not loaded yet" distinguishable from "loaded and empty" — the same signal
  // the FAQ hook uses, and the reason a brand-new shop is not treated as having
  // opinions.
  const [saved, setSaved] = useState(null)

  useEffect(() => {
    if (!hasToken) return undefined

    const controller = new AbortController()

    fetchTestimonials({ signal: controller.signal })
      .then((rows) => {
        const { title, items } = normalise(rows)
        setSaved(items.length ? { title, items } : null)
      })
      .catch(() => {
        // Silent to the visitor - the config quotes are already on screen.
        // Reported as `testimonials` health by the transport layer.
      })

    return () => controller.abort()
  }, [])

  const isRemote = Boolean(saved)

  return {
    items: isRemote ? saved.items : fallback,
    // Falls back to config when the owner cleared the field, so a blank heading
    // cannot leave the section with an empty <h2>.
    title: (isRemote && saved.title) || business.reviews.title,
    // True only while the CONFIG placeholders are what is on screen. The warning
    // banner keys off this, so owner-supplied reviews never sit under a note
    // telling them they are placeholders.
    isPlaceholder: !isRemote && business.reviews.placeholder === true,
    isRemote,
    isConfigured: hasToken,
  }
}