/**
 * keel-api client.
 *
 * Transport only: base URL, the site token, and a retry budget. It knows nothing
 * about FAQs or services, so the next thing that needs the API adds a function
 * here rather than growing this file.
 *
 * The retry budget is copied from olfatta's client with its reasoning intact,
 * because the number is the whole point:
 *
 *   "These were 3 attempts at a 10s timeout with 1s and 2s backoff, so a slow
 *   (not refused) API cost roughly 33 seconds of skeleton before the visitor
 *   saw anything. The API host is on a free Render plan, which sleeps and
 *   cold-starts in 10-30s... At 4s x 2 with 500ms backoff the worst case is
 *   about 8.5s."
 *
 * Do not raise the timeout. A laundry owner opening a price list will not wait
 * 33 seconds for it.
 *
 * No token is not an error. Without one every call would 401, and the site must
 * still render from src/data/business.js — that is what keeps this deployable as
 * a plain static site with no secrets in it.
 */

const API_BASE = (import.meta.env.VITE_KEEL_API_BASE || 'https://keel-api-37rh.onrender.com').replace(/\/$/, '')

/**
 * The per-shop site token, injected by the build. Never log this value; the
 * header name is safe to print, the token is not.
 */
const SITE_TOKEN = import.meta.env.VITE_KEEL_SITE_TOKEN || ''

const TIMEOUT_MS = 4000
const ATTEMPTS = 2
const BACKOFF_MS = 500

export const hasToken = Boolean(SITE_TOKEN)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function headers() {
  const h = { Accept: 'application/json' }
  if (SITE_TOKEN) h['x-keel-site-token'] = SITE_TOKEN
  return h
}

async function get(path, { signal } = {}) {
  let lastError

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    if (attempt > 0) await sleep(BACKOFF_MS)
    const timer = new AbortController()
    const timeout = setTimeout(() => timer.abort(), TIMEOUT_MS)
    const onAbort = () => timer.abort()
    signal?.addEventListener('abort', onAbort, { once: true })

    try {
      const res = await fetch(`${API_BASE}${path}`, {
        headers: headers(),
        signal: timer.signal,
      })
      if (!res.ok) throw new Error(`${path} -> ${res.status}`)
      return await res.json()
    } catch (err) {
      lastError = err
      // A caller-initiated abort is a decision, not a failure to retry.
      if (signal?.aborted) throw err
      // A 401 will not become a 200 on the second attempt, and retrying it
      // burns the budget to arrive at the same answer.
      if (err instanceof Error && /->\s*40[13]/.test(err.message)) throw err
    } finally {
      clearTimeout(timeout)
      signal?.removeEventListener('abort', onAbort)
    }
  }

  throw lastError
}

/**
 * The shop's published services.
 *
 * The route already filters `visible = true` (a soft delete: hiding a row
 * unpublishes it without removing history, because past orders copied the
 * service name and price onto their lines). It also returns only nine named
 * columns — shop_id, visible and created_at are withheld.
 *
 * There is no fallback list in business.js. That is a deliberate decision:
 * a hardcoded copy of the prices would be a SECOND source of price truth, and
 * prices are precisely the data that must not quietly disagree with what the
 * shop actually charges. If this fails the catalogue shows a message pointing at
 * WhatsApp, which is where orders are taken anyway.
 */
export async function fetchServices({ signal } = {}) {
  if (!hasToken) return null
  const rows = await get('/api/services', { signal })
  return Array.isArray(rows) ? rows : []
}

/**
 * The shop's own settings row: name, contacts, address, currency, hours.
 *
 * This is the only source of shop identity. The 19 returned columns are named
 * explicitly on the server (keel-api/src/routes/settings.js) precisely so a new
 * column is a decision rather than something published by accident.
 *
 * Returns null when there is no token so the caller can treat "not configured"
 * and "nothing saved" as the same thing and keep the config copy.
 */
export async function fetchShopSettings({ signal } = {}) {
  if (!hasToken) return null
  return get('/api/settings', { signal })
}

/**
 * The FAQ a shop owner edited in Keel -> Website.
 *
 * page_key/section_key must match what public/keel-manifest.json declares
 * (`pages.faq.sections[].key`), because those strings ARE the storage keys in
 * the page_content table. Change one and you silently read an empty array.
 *
 * Returns [] rather than throwing when there is nothing published, so a brand
 * new shop with no saved FAQ is an ordinary empty result and not a failure.
 */
export async function fetchFaq({ signal } = {}) {
  if (!hasToken) return []
  const rows = await get('/api/page-content?page=faq&section=items', { signal })
  if (!Array.isArray(rows)) return []
  return rows
}