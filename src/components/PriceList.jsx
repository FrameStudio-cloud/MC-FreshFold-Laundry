import { useState } from 'react'
import { business } from '../data/business.js'
import { fillTokens, formatKES } from '../utils/format.js'
import { Reveal } from './Reveal.jsx'

/**
 * Item-by-item price list.
 *
 * Deliberately not a table. A table would need hard borders and square cells to
 * read as a price list, which is exactly what this design forbids. Instead:
 * pill tabs pick a group, and each item is a rounded row with the item name on
 * the left and the price right-aligned in tabular figures so the digits line up
 * down the column — which is the only thing a table was actually buying.
 */
export function PriceList() {
  const groups = business.priceList.groups
  const [active, setActive] = useState(groups[0]?.id)
  const group = groups.find((g) => g.id === active) ?? groups[0]

  // Roving tabindex means only the selected tab is in the tab order, so this
  // arrow-key handler is what makes the others reachable. Without it every
  // unselected price category would be keyboard-inaccessible.
  function onTabKeyDown(event) {
    const index = groups.findIndex((item) => item.id === group.id)
    const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
    let next = null

    if (delta !== undefined) next = (index + delta + groups.length) % groups.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = groups.length - 1
    if (next === null) return

    event.preventDefault()
    setActive(groups[next].id)
    document.getElementById(`price-tab-${groups[next].id}`)?.focus()
  }

  return (
    <section id="pricing" className="section">
      <div className="container-x">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow justify-center">
            <span className="inline-block h-2 w-2 rounded-full bg-accent-400" aria-hidden="true" />
            {business.priceList.eyebrow}
          </p>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-[2.75rem]">{business.priceList.title}</h2>
          <p className="mt-4 text-lg text-ink-body">
            {fillTokens(business.priceList.intro, { name: business.name, area: business.area, city: business.city })}
          </p>
        </Reveal>

        <Reveal delay={80} className="mt-10 flex justify-center">
          <div
            role="tablist"
            aria-label="Price list categories"
            onKeyDown={onTabKeyDown}
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
                  className={`press shrink-0 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-semibold ${
                    selected ? 'bg-primary-600 text-white shadow-soft' : 'text-ink-body hover:bg-primary-50 hover:text-primary-700'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </Reveal>

        <div
          id="price-panel"
          role="tabpanel"
          aria-labelledby={`price-tab-${group.id}`}
          tabIndex={-1}
          className="mt-8 focus-visible:outline-none"
        >
          <Reveal className="mx-auto max-w-3xl overflow-hidden rounded-4xl border border-primary-100 bg-surface shadow-soft">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-primary-100 bg-primary-50/60 px-6 py-5 sm:px-8">
              <h3 className="text-xl">{group.label}</h3>
              {group.note ? <p className="text-sm text-ink-muted">{group.note}</p> : null}
            </div>

            <ul className="divide-y divide-primary-100/70">
              {group.items.map((item) => (
                <li
                  key={item.name}
                  className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-primary-50/40 sm:px-8"
                >
                  <span className="text-[1.0625rem] text-ink">{item.name}</span>
                  <span className="flex shrink-0 items-center gap-3">
                    <span className="h-px w-6 bg-primary-200" aria-hidden="true" />
                    <span className="font-display text-lg font-extrabold tabular-nums text-primary-700">
                      {formatKES(item.price, business.currency)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            <p className="border-t border-primary-100 bg-surface-quiet px-6 py-4 text-sm text-ink-muted sm:px-8">
              {fillTokens(business.priceList.note, { name: business.name, area: business.area, city: business.city })}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}