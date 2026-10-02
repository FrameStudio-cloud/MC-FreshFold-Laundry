import { useEffect } from 'react'
import { ensureAnalytics, pageTrackingEnabled } from '../lib/analytics.js'
import { reportPageView } from '../lib/pageViews.js'

/**
 * Reports page views to Keel so the owner sees real traffic in
 * Keel -> Website -> Analytics.
 *
 * Renders nothing.
 *
 * The interesting part is the ordering. The owner's `page_tracking` toggle
 * arrives with the rest of the shop's settings, so it is not known on the first
 * render: nothing is reported until the settings land. That is why the first
 * view appears a few hundred milliseconds after load rather than instantly.
 *
 * Two gates, in order, and they are deliberately different:
 *
 *   ensureAnalytics()          the site token exists — arms the SDK
 *   pageTrackingEnabled(...)   the owner opted in — permits one page view
 *
 * Arming is NOT behind the toggle. See the note in lib/analytics.js: the toggle
 * itself arrives with /api/settings, so gating arming on it means a settings
 * outage can never be reported.
 *
 * Reporting is separate from the SDK's own autoPageView, which is off — see
 * src/lib/analytics.js for why page_views and site_events are two tables rather
 * than one.
 */
export function PageTracker({ toggles }) {
  useEffect(() => {
    if (!ensureAnalytics()) return
    if (!pageTrackingEnabled(toggles)) return
    reportPageView()
  }, [toggles])

  return null
}
