import { useEffect } from 'react'
import { fetchBenefits, hasToken } from '../api/keelClient.js'
import { benefitsPatches } from '../utils/shopSettings.js'

/**
 * "Why choose us" copy, preferring what the owner saved in Keel.
 *
 * Sibling of useRemoteHero: same shape, same reason. Benefits.jsx reads
 * `business.benefits.*` directly.
 *
 * The eyebrow is where this page earns its keep for an owner: it is rendered
 * through fillTokens, so "Why {name}" becomes "Why OLFATTA" with no template
 * knowledge required and nothing baked into this hook.
 */
export function useRemoteBenefits() {
  useEffect(() => {
    if (!hasToken) return undefined

    const controller = new AbortController()

    fetchBenefits({ signal: controller.signal })
      .then((rows) => {
        for (const patch of benefitsPatches(rows)) patch()
      })
      .catch(() => {
        // Silent to the visitor; reported as `benefits` health.
      })

    return () => controller.abort()
  }, [])
}