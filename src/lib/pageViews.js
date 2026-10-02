import { trackPageView } from '../api/keelClient.js'
import { isArmed } from './analytics.js'

/**
 * Page views, kept out of analytics.js on purpose.
 *
 * Two reasons, both structural:
 *
 * 1. Page views go to /api/page-views through the transport client, and health
 *    reporting lives in that same transport layer. If analytics.js also imported
 *    the client, the import graph would close into a cycle:
 *    keelClient -> dataHealth -> analytics -> keelClient. Function-level uses
 *    survive a cycle, but it is fragile for no benefit.
 *
 * 2. It matches kikoi, which keeps `lib/tracking.js` (page views, talks to the
 *    client) separate from `lib/analytics.js` (the SDK, talks to nothing).
 *    Copying the shape rather than inventing one.
 *
 * Deliberately NOT the SDK's page_view, per the decision documented in
 * analytics.js: `page_views` answers "did people visit, and what did they look
 * at?" for the shop owner, `site_events` answers "is anything broken, and since
 * when?" for us. Two tables, one closed vocabulary, neither able to break the
 * other.
 */

const reported = new Set()

/**
 * Single entry point for a page view, so it cannot be double counted.
 *
 * React StrictMode double-invokes effects in development, and PageTracker re-runs
 * when the owner's toggle arrives, which can be after the first paint. The guard
 * is keyed on the path, so a genuine return visit to the same page still counts.
 *
 * Failures are swallowed deliberately: analytics must never break the site or
 * show a visitor anything.
 */
export function reportPageView({ page } = {}) {
  if (!isArmed()) return
  const path = page || (typeof window !== 'undefined' ? window.location.pathname : '/')
  if (reported.has(path)) return
  reported.add(path)

  trackPageView({ page: path }).catch(() => {})
}

/** Test seam: forgets which paths were reported. */
export function __resetPageViews() {
  reported.clear()
}