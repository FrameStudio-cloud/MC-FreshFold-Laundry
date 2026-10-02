import { useEffect, useState } from 'react'
import { business } from '../data/business.js'
import { fetchFaq, hasToken } from '../api/keelClient.js'

/**
 * FAQ items, preferring whatever the owner has saved in Keel.
 *
 * Two rules this exists to enforce:
 *
 * 1. **Config is the floor, never the absence.** The section always renders
 *    from business.js on the first paint, and a remote payload only replaces it
 *    when it arrives. A cold Render host that takes 8s to wake, a revoked token,
 *    or a flat network can therefore never leave a visitor staring at an empty
 *    accordion.
 *
 * 2. **A malformed row is dropped, not rendered.** The content column is untyped
 *    jsonb addressed by free-text keys, so this normaliser is the only thing
 *    standing between a hand-edited row and a React crash. Anything without a
 *    question and an answer as strings is skipped.
 *
 * The shape mismatch is deliberate on the API's side: the database stores
 * { question, answer } (kikoi's manifest schema), while this site's config uses
 * { q, a }. Normalising here keeps that historical accident in one place instead
 * of leaking into the accordion.
 */
function normalise(rows) {
  const out = []

  for (const row of rows) {
    const items = row?.content?.items
    if (!Array.isArray(items)) continue

    for (const item of items) {
      const q = typeof item?.question === 'string' ? item.question.trim() : ''
      const a = typeof item?.answer === 'string' ? item.answer.trim() : ''
      if (q && a) out.push({ q, a })
    }
  }

  return out
}

export function useRemoteFaq() {
  const fallback = business.faq.items
  const [remote, setRemote] = useState(null)

  useEffect(() => {
    if (!hasToken) return undefined

    const controller = new AbortController()

    fetchFaq({ signal: controller.signal })
      .then((rows) => {
        const items = normalise(rows)
        // Null means "not loaded yet" and null again means "nothing saved", so
        // the two states stay distinguishable in the DOM during testing.
        setRemote(items.length ? items : null)
      })
      .catch(() => {
        // Deliberately silent. The section is already on screen from config, so
        // an API failure is invisible to a visitor by design. The transport
        // layer reports it as `faq` health, so it is not invisible to us.
      })

    return () => controller.abort()
  }, [])

  return {
    items: remote ?? fallback,
    isRemote: Boolean(remote),
    isConfigured: hasToken,
  }
}