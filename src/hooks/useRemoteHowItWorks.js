import { useEffect } from 'react'
import { fetchHowItWorks, hasToken } from '../api/keelClient.js'
import { howItWorksPatches } from '../utils/shopSettings.js'

/**
 * "How it works" copy, preferring what the owner saved in Keel.
 *
 * Sibling of useRemoteHero: same shape, same reason. Steps.jsx reads
 * `business.steps.*` and the numbering is derived from the array length, so an
 * owner adding or removing a step needs no code change and the numbers renumber
 * themselves.
 */
export function useRemoteHowItWorks() {
  useEffect(() => {
    if (!hasToken) return undefined

    const controller = new AbortController()

    fetchHowItWorks({ signal: controller.signal })
      .then((rows) => {
        for (const patch of howItWorksPatches(rows)) patch()
      })
      .catch(() => {
        // Silent to the visitor; reported as `how_it_works` health.
      })

    return () => controller.abort()
  }, [])
}