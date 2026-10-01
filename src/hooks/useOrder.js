import { useCallback, useMemo, useState } from 'react'
import { business } from '../data/business.js'

/**
 * The basket.
 *
 * A laundry service is not a product, so the basket stores { serviceId, qty }
 * against the config's service list rather than copying service objects. That
 * way editing a price in business.js updates the maths everywhere at once, and
 * there is no stale duplicate of the catalogue in state.
 *
 * Quantity means whatever the service's `unit` says — kilograms for wash &
 * fold, items for dry cleaning. Not everything gets a stepper.
 */

const MAX_QTY = 99

export function useOrder() {
  const [lines, setLines] = useState(() => new Map())

  const commit = useCallback((serviceId, next) => {
    setLines((prev) => {
      const copy = new Map(prev)
      const safe = Math.max(0, Math.min(MAX_QTY, Math.round(Number(next) || 0)))
      if (safe === 0) copy.delete(serviceId)
      else copy.set(serviceId, safe)
      // Bail out when nothing actually changed, so a redundant +/- click does
      // not re-render the whole page.
      if (copy.size === prev.size && [...copy].every(([k, v]) => prev.get(k) === v)) return prev
      return copy
    })
  }, [])

  const step = useCallback((serviceId, delta) => {
    setLines((prev) => {
      const next = Math.max(0, Math.min(MAX_QTY, (prev.get(serviceId) ?? 0) + delta))
      const copy = new Map(prev)
      if (next === 0) copy.delete(serviceId)
      else copy.set(serviceId, next)
      if (copy.size === prev.size && [...copy].every(([k, v]) => prev.get(k) === v)) return prev
      return copy
    })
  }, [])

  const clear = useCallback(() => setLines(new Map()), [])

  /** Basket as an array of { service, qty }, kept in catalogue order so the
   *  drawer does not reshuffle when a quantity changes. */
  const items = useMemo(() => {
    const out = []
    for (const service of business.services) {
      const qty = lines.get(service.id)
      if (qty) out.push({ service, qty })
    }
    return out
  }, [lines])

  const total = useMemo(
    () => items.reduce((sum, { service, qty }) => sum + service.price * qty, 0),
    [items],
  )

  const qtyOf = useCallback((serviceId) => lines.get(serviceId) ?? 0, [lines])

  return {
    items,
    total,
    count: lines.size,
    qtyOf,
    setQty: commit,
    step,
    clear,
  }
}