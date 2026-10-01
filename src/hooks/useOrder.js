import { useCallback, useMemo, useState } from 'react'

/**
 * The basket.
 *
 * A laundry service is not a product, so the basket stores { serviceId, qty }
 * against the catalogue rather than copying service objects. That way a price
 * change in the database updates the maths everywhere at once, and there is no
 * stale duplicate of the catalogue in state.
 *
 * Quantity means whatever the service's `unit` says — kilograms for wash & fold,
 * items for dry cleaning, pairs for shoes. Flat-priced services have no unit and
 * no stepper.
 *
 * The catalogue is passed IN rather than read from business.services, and it is
 * in the memo deps. The services list arrives asynchronously from keel-api, so a
 * memo keyed only on `lines` would keep iterating whichever list existed at the
 * time the last quantity changed — and quantities added before the fetch landed
 * would silently vanish from the drawer.
 */
const MAX_QTY = 99

export function useOrder(services = []) {
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
    for (const service of services) {
      const qty = lines.get(service.id)
      if (qty) out.push({ service, qty })
    }
    return out
  }, [lines, services])

  const total = useMemo(
    () => items.reduce((sum, { service, qty }) => sum + service.price * qty, 0),
    [items],
  )

  const qtyOf = useCallback((serviceId) => lines.get(serviceId) ?? 0, [lines])

  return {
    items,
    total,
    // items.length, not lines.size: a line survives in state even if its
    // service disappears from a later refetch, and a badge counting something
    // the drawer cannot show is a small lie.
    count: items.length,
    qtyOf,
    setQty: commit,
    step,
    clear,
  }
}