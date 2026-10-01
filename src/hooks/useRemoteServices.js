import { useEffect, useState } from 'react'
import { fetchServices, hasToken } from '../api/keelClient.js'
import { normaliseServices } from '../utils/serviceNormalise.js'
import { applyServiceSchema } from '../utils/seo.js'

/**
 * The catalogue.
 *
 * Structurally different from useShopSettings and useRemoteFaq, and the
 * difference is the point. Those two OVERLAY values onto an object that already
 * has the right shape, so writing into the config in place is correct. The
 * catalogue is the opposite: the API owns the list, its length is unknown ahead
 * of time, and useOrder memoises over it. Replacing business.services after that
 * memo has run would leave the basket holding a stale snapshot and quantities
 * would silently disappear from the drawer.
 *
 * So the list lives in React state and is threaded through as a prop, rather
 * than mutated. `useOrder(services)` includes it in its own memo deps.
 *
 * `status` is 'loading' | 'ready' | 'error' and the caller decides what an error
 * looks like. There is no fallback list by design - see fetchServices.
 */
export function useRemoteServices() {
  // Resolved in the initialiser, not corrected inside the effect: whether a
  // token exists is a module constant known on the first render, and setting
  // state synchronously in an effect body is a cascading render.
  const [state, setState] = useState(() =>
    hasToken
      ? { status: 'loading', services: [], error: null }
      : { status: 'error', services: [], error: new Error('no site token configured') },
  )

  useEffect(() => {
    if (!hasToken) return undefined

    const controller = new AbortController()

    fetchServices({ signal: controller.signal })
      .then((rows) => {
        const services = normaliseServices(rows)
        // An empty array from the server is a real answer (nothing published
        // yet) and must not be treated as a failure.
        applyServiceSchema(services)
        setState({ status: 'ready', services, error: null })
      })
      .catch((error) => {
        setState({ status: 'error', services: [], error })
      })

    return () => controller.abort()
  }, [])

  return state
}
