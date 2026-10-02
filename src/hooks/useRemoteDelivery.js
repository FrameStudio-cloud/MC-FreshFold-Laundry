import { useEffect, useState } from 'react'
import { fetchPageSection, hasToken } from '../api/keelClient.js'
import { deliveryPatches, savedAreas } from '../utils/shopSettings.js'
import { applyDeliverySchema } from '../utils/seo.js'

/**
 * Delivery areas and the pickup promise, edited by the owner in
 * Keel -> Website -> "Delivery & pickup".
 *
 * A sibling of useRemoteFaq rather than a generalisation of it: two callers,
 * two different shapes, and the FAQ hook is already covered by tests. The piece
 * they genuinely share is fetchPageSection, and that is now in the client.
 *
 * Config is the fallback, and that is safe here in a way it is not for prices.
 * A stale area list is a minor inconvenience; a stale price is a claim the shop
 * takes money against. So this block gets a default, and the catalogue does not.
 *
 * On success it also refreshes `areaServed` in the JSON-LD, because the
 * build-time node deliberately does not carry it: it cannot know the areas
 * before this request answers, and shipping the config's place names as
 * structured data for every shop would be publishing a placeholder as fact.
 */
export function useRemoteDelivery() {
  const [state, setState] = useState(() =>
    hasToken
      ? { ready: false, applied: false, error: null }
      : { ready: true, applied: false, error: new Error('no site token configured') },
  )

  useEffect(() => {
    if (!hasToken) return undefined

    const controller = new AbortController()

    fetchPageSection('delivery', 'details', { signal: controller.signal, resource: 'delivery' })
      .then((rows) => {
        for (const patch of deliveryPatches(rows)) patch()
        // Only the owner's own areas are published. Reading business here would
        // publish the config's unconfirmed placeholders as structured data
        // whenever the fetch happened to succeed.
        applyDeliverySchema(savedAreas(rows))
        setState({ ready: true, applied: true, error: null })
      })
      .catch((error) => {
        // Silent to the visitor: the config copy is already on screen. Reported
        // as page_content health by the transport layer.
        setState({ ready: true, applied: false, error })
      })

    return () => controller.abort()
  }, [])

  return state
}
