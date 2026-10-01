import { useMemo, useState } from 'react'
import { business } from '../data/business.js'
import { fillTokens, formatKES } from '../utils/format.js'
import { groupServices } from '../utils/serviceNormalise.js'
import { unitNoun } from '../utils/whatsapp.js'
import { Reveal } from './Reveal.jsx'

/**
 * Item-by-item price list.
 *
 * DERIVED from the same /api/services response the catalogue cards use, grouped
 * by the same config groups. That is the point: the page quotes one price per
 * service in two places, and because both come from the same array they cannot
 * disagree. An earlier version had a hand-written table here, which meant two
 * sources of price truth and no way to tell which one was stale.
 *
 * Deliberately not a <table>. A real table needs hard borders and square cells to
 * read as a price list, which this design forbids. The digits still line up
 * down the column because the prices use tabular figures, which is the only
 * thing the table was actually buying.
 */
export function PriceList({ services, status }) {
  const groups = useMemo(() => groupServices(services), [services])
  const [active, setActive] = useState(null)

  const group = groups.find((g) => g.id === active) ?? groups[0]
  const tokens = { name: business.name, area: business.area, city: business.city }

  return (
    <section id="pricing" className="section">
      <div className="container-x">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow justify-center">
            <span className="inline-block h-2 w-2 rounded-full bg-accent-400" aria-hidden="true" />
            {business.priceList.eyebrow}
          </p>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-[2.75rem]">{business.priceList.title}</h2>
          <p className="mt-4 text-lg text-ink-body">{fillTokens(business.priceList.intro, tokens)}</p>
        </Reveal>

        {status === 'loading' ? (
          <div aria-hidden="true" className="mx-auto mt-10 h-72 max-w-3xl animate-pulse rounded-4xl border border-primary-100 bg-surface-quiet" />
        ) : !group ? (
          <Reveal className="mt-10">
            <p className="mx-auto max-w-xl rounded-full border border-primary-100 bg-surface px-6 py-5 text-center text-[0.9375rem] text-ink-body">
              {fillTokens(business.priceList.intro, tokens)}
            </p>
          </Reveal>
        ) : (
          <>
            {groups.length > 1 ? (
              <Reveal delay={80} className="mt-10 flex justify-center">
                <div
                  role="tablist"
                  aria-label="Price list categories"
                  className="no-scrollbar flex max-w-full gap-2 overflow-x-auto rounded-full border border-primary-100 bg-surface p-2 shadow-soft"
                >
                  {groups.map((item) => {
                    const selected = item.id === group.id
                    return (
                      <button
                        key={item.id}
                        role="tab"
                        type="button"
                        id={`price-tab-${item.id}`}
                        aria-selected={selected}
                        aria-controls="price-panel"
                        tabIndex={selected ? 0 : -1}
                        onClick={() => setActive(item.id)}
                        onKeyDown={(event) => onPriceKeyDown(event, groups, item.id, setActive)}
                        className={`press shrink-0 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold ${
                          selected
                            ? 'bg-primary-600 text-white shadow-soft'
                            : 'text-ink-body hover:bg-primary-50 hover:text-primary-700'
                        }`}
                      >
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </Reveal>
            ) : null}

            <div
              id="price-panel"
              role="tabpanel"
              aria-labelledby={`price-tab-${group.id}`}
              tabIndex={-1}
              className={groups.length > 1 ? 'mt-8' : 'mt-10'}
            >
              <Reveal className="mx-auto max-w-3xl overflow-hidden rounded-4xl border border-primary-100 bg-surface shadow-soft">
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-primary-100 bg-primary-50/60 px-6 py-5 sm:px-8">
                  <h3 className="text-xl">{group.label}</h3>
                  <p className="text-sm text-ink-muted">
                    {group.items.length} {group.items.length === 1 ? 'service' : 'services'}
                  </p>
                </div>

                <ul className="divide-y divide-primary-100/70">
                  {group.items.map((service) => (
                    <li
                      key={service.id}
                      className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-primary-50/40 sm:px-8"
                    >
                      <span className="min-w-0 text-[1.0625rem] text-ink">{service.name}</span>
                      <span className="flex shrink-0 items-center gap-3">
                        {service.unit ? (
                          <span className="hidden text-sm text-ink-muted sm:inline">
                            per {unitNoun(service.unit, true)}
                          </span>
                        ) : null}
                        <span className="h-px w-6 bg-primary-200" aria-hidden="true" />
                        <span className="font-display text-lg font-extrabold tabular-nums text-primary-700">
                          {formatKES(service.price, business.currency)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>

                <p className="border-t border-primary-100 bg-surface-quiet px-6 py-4 text-sm text-ink-muted sm:px-8">
                  {fillTokens(business.priceList.note, tokens)}
                </p>
              </Reveal>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

/** Arrow-key roving focus, as in ServiceGrid. Without it the roving tabindex
 *  would leave every unselected price group keyboard-unreachable. */
function onPriceKeyDown(event, groups, currentId, setActive) {
  const index = groups.findIndex((g) => g.id === currentId)
  const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
  let next = null
  if (event.key in keys) next = (index + keys[event.key] + groups.length) % groups.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = groups.length - 1
  if (next === null) return
  event.preventDefault()
  setActive(groups[next].id)
  document.getElementById(`price-tab-${groups[next].id}`)?.focus()
}
