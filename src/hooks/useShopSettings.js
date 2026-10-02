import { useEffect, useState } from 'react'
import { fetchShopSettings, hasToken } from '../api/keelClient.js'
import { shopFeatureToggles, shopSettingsPatches } from '../utils/shopSettings.js'

/**
 * Shop identity, overlaid from keel-api onto the config in place.
 *
 * Why mutation rather than context: this site has ~250 references to
 * `business.x` spread across 21 files, and business.js is read at BUILD time by
 * vite.config.js for the SEO tags. Threading a context through all of it would
 * not fix the build-time half, which is immune to React by definition. Writing
 * into the config object and letting the `ready` state change drive the re-render
 * is the same pattern kikoi uses, and it means every component picks this up for
 * free.
 *
 * The first paint always shows the config, so this never delays content — it
 * corrects it. The config is kept in step with the database (see business.js), so
 * a visitor sees the right name on first paint and the right name after the fetch
 * resolves, with no flash of a stale value.
 */
export function useShopSettings() {
  // Resolved in the initialiser rather than corrected inside the effect. Whether
  // a token exists is a module constant known on the first render, and setting
  // state synchronously in an effect body is a cascading render — which is
  // exactly what React's compiler lint rule is there to catch.
  const [state, setState] = useState(() => ({
    ready: !hasToken,
    applied: false,
    toggles: {},
  }))

  useEffect(() => {
    if (!hasToken) return undefined

    const controller = new AbortController()

    fetchShopSettings({ signal: controller.signal })
      .then((raw) => {
        if (!raw) {
          setState({ ready: true, applied: false, toggles: {} })
          return
        }
        for (const patch of shopSettingsPatches(raw)) patch()
        setState({ ready: true, applied: true, toggles: shopFeatureToggles(raw) })
      })
      .catch(() => {
        // Silent to the visitor: the config copy is already on screen and is
        // accurate, so an API failure must not read as a crash. It is NOT
        // silent to us — the transport layer reports settings health, which is
        // what stops a dead API producing a complete-looking site.
        setState({ ready: true, applied: false, toggles: {} })
      })

    return () => controller.abort()
  }, [])

  return state
}
