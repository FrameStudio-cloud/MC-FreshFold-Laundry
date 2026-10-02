import * as sdk from '@framestudio/keel-analytics'

/**
 * This site's binding to @framestudio/keel-analytics.
 *
 * The SDK is shop-agnostic. This file is the only place that knows about this
 * site's environment variables and feature toggles, so the wiring is auditable
 * in one read.
 *
 * Three things are deliberately NOT done here:
 *
 * 1. **Page views.** They go to /api/page-views through reportPageView() below,
 *    and the SDK is initialised with autoPageView off. This is kikoi's decision,
 *    inherited rather than reinvented: `page_views` answers "did people visit,
 *    and what did they look at?" for the shop owner, while `site_events` answers
 *    "is anything broken, and since when?" for us. Unifying them was considered
 *    and rejected — the owner's card would carry health fields it has no use for,
 *    or health would read a table shaped for traffic.
 *
 * 2. **Contact details.** The SDK drops keys matching
 *    phone|email|address|message|note|body|contact in the browser and the
 *    collector drops them again. This site has a WhatsApp order flow where the
 *    customer's details end up in a URL, so the habit of never passing them to
 *    track() matters more here than anywhere.
 *
 * 3. **Anything that can throw into the page.** Every call here is wrapped.
 *    A failed analytics call must never break a shop's page mid-order.
 */

const API_BASE = import.meta.env.VITE_KEEL_API_BASE || 'https://keel-api-37rh.onrender.com'

/** The owner's on/off switch, read from store_settings.feature_toggles. */
export const TRACKING_TOGGLE = 'page_tracking'

let armed = false

/**
 * Turn reporting on for this shop. Idempotent — the SDK ignores repeat calls
 * and the component that calls this re-runs on every render.
 *
 * Armed on the TOKEN alone, deliberately, and this is the one place the consent
 * gate does not apply. Gating arming on the `page_tracking` toggle creates a
 * deadlock: that toggle arrives *with* /api/settings, so when settings is down
 * the toggle is never known, the SDK is never armed, and the settings failure
 * can never be reported. The one failure most worth knowing about would be the
 * one that cannot be reported. The gate therefore applies to page views only
 * (see pageTrackingEnabled), which is what the owner's toggle actually means.
 *
 * @returns {boolean} whether reporting is live
 */
export function ensureAnalytics() {
  if (armed) return true

  const token = import.meta.env.VITE_KEEL_SITE_TOKEN
  if (!token) return false

  try {
    sdk.init({
      token,
      apiBase: API_BASE,
      // Page views belong to reportPageView(), see the note above.
      autoPageView: false,
      debug: import.meta.env.DEV,
    })
    armed = true
    return true
  } catch {
    // Never throw into the app. A shop with broken analytics still has a shop.
    return false
  }
}

/**
 * The owner's on/off switch for VISITOR page views, read from
 * store_settings.feature_toggles. Opt-in: a missing toggle means OFF, not on.
 * A shop that has never opened the Keel website tab has no key stored, and
 * defaulting that to "tracked" would record traffic for an owner who never
 * agreed to it.
 */
export function pageTrackingEnabled(toggles) {
  return toggles?.[TRACKING_TOGGLE]?.enabled === true
}

/**
 * Report a named event. The vocabulary is closed: anything outside the SDK's
 * EVENTS list is refused in the browser before a request is made, and the
 * warning only fires in dev — so a typo here is silent in production.
 */
export function track(name, properties = {}) {
  if (!armed) return
  try {
    sdk.track(name, properties)
  } catch {
    /* see above */
  }
}

/**
 * Report that a non-obvious feature was used, e.g. back_to_top. A feature the
 * owner cannot see anyone clicking is a feature they will switch off.
 */
export function trackFeature(feature) {
  track('feature_used', { feature })
}

/**
 * Report a data-health transition. Backs src/lib/dataHealth.js.
 *
 * @param {string} resource settings | catalogue | product | banners | page_content
 * @param {boolean} ok
 * @param {string} [detail]
 */
export function reportHealth(resource, ok, detail) {
  if (!armed) return
  try {
    sdk.health(resource, ok, detail)
  } catch {
    /* never let reporting break the shop */
  }
}

/** True once the SDK is live. Used by reportPageView to gate the page-view path. */
export const isArmed = () => armed


