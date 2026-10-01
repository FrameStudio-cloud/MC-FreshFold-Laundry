import { business } from '../data/business.js'
import { isKnownIcon } from './icons.js'

/**
 * Turns a row from GET /api/services into the shape the cards render.
 *
 * The database holds the FACTS and business.js holds the PRESENTATION. This is
 * the seam between them, and it is the only place a `pricing_mode` is
 * interpreted.
 *
 * Why not just spread the row: `pricing_mode` is a constraint the site cannot
 * infer. "flat" means there is nothing to count, so the stepper must be hidden —
 * a "+/-" beside a flat KSh 500 implies four separate jobs, which is a
 * different sale. Everything else is per-unit or per-weight and does get a
 * stepper, counted in whatever `unit_label` the shop typed (kg, item, pair, hr).
 *
 * The `category` column is deliberately NOT used for grouping. It is free text
 * with no constraint, every service in this shop sits in one value, and a shop
 * that typed "Laundry" next to "laundry" would get two identical filter pills.
 * Grouping comes from servicePresentation in business.js.
 */

const DEFAULT_ICON = 'washing'

/** 'per_unit' | 'per_weight' | 'per_hour' -> the shop's unit_label; flat -> null. */
export function unitForRow(row) {
  if (row.pricing_mode === 'flat') return null
  const label = typeof row.unit_label === 'string' ? row.unit_label.trim() : ''
  return label || null
}

/**
 * A service the site cannot render is one with no name or an unusable price.
 * Skipping rather than rendering is deliberate: a card with no title, or one
 * priced NaN, is worse than a service missing from the list, and both are
 * visible bugs rather than silent ones.
 */
function isRenderable(row) {
  if (typeof row.name !== 'string' || !row.name.trim()) return false
  const price = Number(row.price)
  return Number.isFinite(price) && price >= 0
}

export function normaliseService(row, index) {
  const name = row.name.trim()
  const present = business.servicePresentation[name] ?? {}

  // Fall back to the first group's icon when a service is missing from the
  // presentation map, so an unmapped service still looks intentional.
  const icon = isKnownIcon(present.icon) ? present.icon : DEFAULT_ICON
  const group = present.group ?? business.categories[0]?.id ?? 'wash'

  return {
    // The uuid is the basket key, so it must survive. The name is the config key
    // because names are editable and uuids are not.
    id: row.id,
    dbId: row.id,
    name,
    description:
      typeof row.description === 'string' && row.description.trim()
        ? row.description.trim()
        : `${name} — ask us for details on WhatsApp.`,
    price: Math.round(Number(row.price)),
    unit: unitForRow(row),
    icon,
    group,
    popular: present.popular === true,
    accent: present.accent === true,
    note: typeof present.note === 'string' ? present.note : '',
    // Retained for ordering only. `serviceOrder` decides the sort; this is the
    // API's own position, used to append anything the config does not list.
    _apiIndex: index,
  }
}

/**
 * Normalise, drop the unusable, apply serviceOrder, and append the rest.
 *
 * Ordering matters more than it looks: /api/services returns
 * `order by category, name`, so without this the first card is "Blanket Wash"
 * and "Wash & Fold" — the service most people want — sits in the middle.
 */
export function normaliseServices(rows) {
  if (!Array.isArray(rows)) return []

  const list = rows.filter(isRenderable).map(normaliseService)

  const rank = new Map(business.serviceOrder.map((name, i) => [name, i]))
  const known = new Set(rank.keys())

  return list.sort((a, b) => {
    const ra = rank.has(a.name) ? rank.get(a.name) : Number.MAX_SAFE_INTEGER
    const rb = rank.has(b.name) ? rank.get(b.name) : Number.MAX_SAFE_INTEGER
    if (ra !== rb) return ra - rb
    // Unlisted services keep the order the API gave them.
    return a._apiIndex - b._apiIndex
  })
    .map(({ _apiIndex, ...service }, i) => ({ ...service, position: i, listed: known.has(service.name) }))
}

/** Services grouped for the price table, in the order `categories` declares. */
export function groupServices(services) {
  return business.categories
    .map((category) => ({
      ...category,
      items: services.filter((service) => service.group === category.id),
    }))
    .filter((group) => group.items.length > 0)
}
