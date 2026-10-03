import { useEffect } from 'react'
import { fetchHero, hasToken } from '../api/keelClient.js'
import { heroPatches } from '../utils/shopSettings.js'

/**
 * Homepage banner copy, preferring what the owner saved in Keel.
 *
 * Shaped like useRemoteDelivery rather than the three hooks that return
 * overrides, because Hero.jsx reads `business.hero.*` directly and inlining the
 * patch is what lets an owner change the headline without the component knowing
 * anything changed. The same "config is the floor" rule applies: the headline is on
 * screen from the first paint and only replaced when something usable arrives, so
 * a sleeping API cannot leave the top of the page blank.
 */
export function useRemoteHero() {
  useEffect(() => {
    if (!hasToken) return undefined

    const controller = new AbortController()

    fetchHero({ signal: controller.signal })
      .then((rows) => {
        for (const patch of heroPatches(rows)) patch()
      })
      .catch(() => {
        // Silent to the visitor by design: the config copy is already on screen.
        // Reported as `hero` health by the transport layer, so it is not silent
        // to us. An aborted request never reaches here - the transport layer
        // drops that before it becomes a health event.
      })

    return () => controller.abort()
  }, [])
}