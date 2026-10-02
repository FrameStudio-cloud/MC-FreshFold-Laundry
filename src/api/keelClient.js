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

import { reportFailure, reportOk } from '../lib/dataHealth.js'

/**
 * Data-health lives HERE, not in the hooks that call these functions.
 *
 * This is kikoi's structure: report success and failure in the layer that knows
 * whether the call worked, so a read cannot be added without reporting. An
 * earlier version reported from the React hooks, one level up, which meant a new
 * fetch in this file would have gone silently unreported — the exact class of bug
 * this module exists to catch.
 *
 * `resource` is this site's own health vocabulary, and it is NOT free-form in
 * practice: the collector refuses any name the site has not declared for itself,
 * so adding a signal means declaring it rather than only typing it here. This site
 * declares settings, services, delivery and faq.
 *
 * The four used to be three, with FAQ and delivery sharing `page_content`. They
 * were the same upstream so that was defensible, but they are not the same thing
 * to an owner: a delivery-area outage reported as "Page copy broken" is the least
 * actionable label available for the failure that matters most on a laundry site,
 * and the two could not be seen failing independently. `resource` is therefore a
 * required argument on fetchPageSection rather than a default, so a new page read
 * has to say what it is and cannot quietly fall back into someone else's lamp.
 *
 * Note the import direction: this file -> dataHealth -> analytics -> sdk. It is
 * deliberately one-way. analytics.js does not import this file; page views reach
 * it through lib/pageViews.js, which is what stops that closing into a cycle.
 */

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

async function get(path, { signal, resource } = {}) {
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
      const data = await res.json()
      if (resource) reportOk(resource)
      return data
    } catch (err) {
      lastError = err
      // A caller-initiated abort is a decision, not a failure to retry.
      if (signal?.aborted) throw err
      // A 401 will not become a 200 on the second attempt, and retrying it
      // burns the budget to arrive at the same answer.
      if (err instanceof Error && /->\s*40[13]/.test(err.message)) {
        // Still reported: a rejected token is a real fault and the operator
        // needs to see it, not an absence of traffic. kikoi reports its
        // equivalent (`noSupabase`, `noShopId`) for the same reason.
        if (resource) reportFailure(resource, err)
        throw err
      }
    } finally {
      clearTimeout(timeout)
      signal?.removeEventListener('abort', onAbort)
    }
  }

  // Reached only once the budget is spent, so a retry that recovers reports
  // nothing. Reporting per attempt would make one cold start emit a
  // health_fail and a health_ok, which is the noise this avoids.
  if (resource) reportFailure(resource, lastError)
  throw lastError
}

/**
 * Record one page view.
 *
 * A POST, so this needs a token with WRITE scope. There is one token, and
 * keel-api keys the budget off its scope rather than the method
 * (auth.js: "const budget = identity.canWrite ? write : read"), so a write token
 * also serves every read this file does. Verified: a read token is rejected
 * with 403, the write token returns 201.
 *
 * Deliberately NOT the SDK's page_view. Copying kikoi's decision, which was
 * itself a considered one: `page_views` answers "did people visit, and what did
 * they look at?" for the shop owner, and `site_events` answers "is anything
 * broken, and since when?" for us. Two audiences, two tables, one closed
 * vocabulary of event names, and neither able to break the other. So the SDK
 * runs with autoPageView off and this owns page views.
 *
 * Analytics must never break the site or surface anything to a visitor, so
 * failures are swallowed. Page views are best-effort by nature.
 */
export async function trackPageView({ page, productName } = {}) {
  if (!hasToken) return null
  if (!page) return null

  const body = JSON.stringify({
    page,
    product_name: productName ?? null,
    referrer: typeof document !== 'undefined' ? document.referrer || null : null,
  })

  const res = await fetch(`${API_BASE}/api/page-views`, {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body,
    // Survives the visitor leaving mid-flight. keepalive rather than
    // sendBeacon, because sendBeacon cannot set the token header and would be
    // silently unauthenticated.
    keepalive: true,
  })

  if (!res.ok) throw new Error(`page-views -> ${res.status}`)
  return res.json().catch(() => null)
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
  const rows = await get('/api/services', { signal, resource: 'services' })
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
  return get('/api/settings', { signal, resource: 'settings' })
}

/**
 * One section of a page the site declares in public/keel-manifest.json.
 *
 * page/section must match `pages.<page>.sections[].key` exactly, because those
 * strings ARE the storage keys in the page_content table. Change one and you
 * silently read an empty array.
 *
 * One request per declared page, and `?page=X` returns every section of that
 * page in one response — so several fields in a single section cost the same as
 * one field. That is why delivery keeps note, same_day and areas in one
 * `details` section rather than three sections.
 *
 * `resource` is required and identifies which signal this read reports as. It is
 * not defaulted on purpose: a default would let a new page read join another
 * lamp silently, which is exactly how FAQ and delivery came to share one.
 *
 * There is deliberately no way to fetch everything: the route returns an empty
 * array when neither parameter is given, because "all rows the caller cannot
 * address" is not a useful answer.
 */
export async function fetchPageSection(page, section, { signal, resource } = {}) {
  if (!hasToken) return []
  if (!resource) {
    // Loud in development, harmless in production: a read with no signal still
    // works and still renders, it just does not report. The alternative - throwing
    // - would take a price list down over a reporting concern.
    if (import.meta.env.DEV) {
      console.warn(`[keelClient] fetchPageSection('${page}') has no health resource`)
    }
  }
  const query = new URLSearchParams({ page })
  if (section) query.set('section', section)
  const rows = await get(`/api/page-content?${query.toString()}`, { signal, resource })
  return Array.isArray(rows) ? rows : []
}

/**
 * The FAQ a shop owner edited in Keel -> Website.
 *
 * Returns [] rather than throwing when there is nothing published, so a brand
 * new shop with no saved FAQ is an ordinary empty result and not a failure.
 */
export async function fetchFaq({ signal } = {}) {
  return fetchPageSection('faq', 'items', { signal, resource: 'faq' })
}

/**
 * The address and map the owner edited in Keel -> Website.
 *
 * Returns [] when nothing is saved, which is the ordinary state for a shop that
 * has not filled the page in yet: the site then renders the designed placeholder
 * from config rather than a broken map.
 */
export async function fetchLocation({ signal } = {}) {
  return fetchPageSection('location', 'details', { signal, resource: 'location' })
}

/**
 * Customer reviews the owner edited in Keel -> Website.
 *
 * Same contract as fetchFaq: [] is an ordinary empty result, not a failure, and
 * the reviews section falls back to the config placeholder quotes until this
 * returns something.
 */
export async function fetchTestimonials({ signal } = {}) {
  return fetchPageSection('testimonials', 'items', { signal, resource: 'testimonials' })
}