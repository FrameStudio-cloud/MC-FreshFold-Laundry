import { useMemo, useState } from 'react'
import { business } from '../data/business.js'
import { fillTokens } from '../utils/format.js'
import { Reveal } from './Reveal.jsx'
import { ServiceCard } from './ServiceCard.jsx'

const ALL = 'all'

/**
 * The catalogue with pill filters.
 *
 * Filtering is client-side state, not navigation: no reload, no lost scroll
 * position, and the URL stays clean. The tab row is a proper ARIA tablist with
 * arrow-key roving focus, so it is operable without a mouse — a row of pill
 * buttons that only respond to clicks would fail the accessibility brief.
 */
export function ServiceGrid({ order, onOpenOrder }) {
  const [active, setActive] = useState(ALL)
  const tokens = { area: business.area, city: business.city, name: business.name }

  const visible = useMemo(
    () => (active === ALL ? business.services : business.services.filter((s) => s.category === active)),
    [active],
  )

  const counts = useMemo(() => {
    const map = { [ALL]: business.services.length }
    for (const service of business.services) {
      map[service.category] = (map[service.category] ?? 0) + 1
    }
    return map
  }, [])

  const tabs = [{ id: ALL, label: 'All' }, ...business.categories]

  function onTabKeyDown(event) {
    const index = tabs.findIndex((tab) => tab.id === active)
    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
    if (event.key in keys) {
      event.preventDefault()
      const next = (index + keys[event.key] + tabs.length) % tabs.length
      setActive(tabs[next].id)
      document.getElementById(`cat-${tabs[next].id}`)?.focus()
    }
    if (event.key === 'Home') {
      event.preventDefault()
      setActive(tabs[0].id)
      document.getElementById(`cat-${tabs[0].id}`)?.focus()
    }
    if (event.key === 'End') {
      event.preventDefault()
      const last = tabs.length - 1
      setActive(tabs[last].id)
      document.getElementById(`cat-${tabs[last]}`)?.focus()
    }
  }

  return (
    <section id="services" className="section bg-canvas-deep/50">
      <div className="container-x">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <Reveal className="max-w-2xl">
            <p className="eyebrow">
              <span className="inline-block h-2 w-2 rounded-full bg-primary-400" aria-hidden="true" />
              {business.servicesSection.eyebrow}
            </p>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-[2.75rem]">What we clean</h2>
            <p className="mt-4 text-lg text-ink-body">
              {fillTokens(business.servicesSection.intro, tokens)}
              {business.delivery.available ? ` ${fillTokens(business.delivery.feeNote, tokens)}` : ''}
            </p>
          </Reveal>

          <Reveal delay={80} className="shrink-0">
            <button
              type="button"
              onClick={onOpenOrder}
              className="press inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary-200 bg-surface px-6 py-3.5 text-[0.9375rem] font-semibold text-ink shadow-soft hover:border-primary-300 hover:bg-primary-50 md:w-auto"
            >
              {business.order.drawerOpenLabel}
            </button>
          </Reveal>
        </div>

        <Reveal delay={120} className="mt-10">
          <div
            role="tablist"
            aria-label="Filter services by category"
            onKeyDown={onTabKeyDown}
            className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-2 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
          >
            {tabs.map((tab) => {
              const selected = active === tab.id
              return (
                <button
                  key={tab.id}
                  id={`cat-${tab.id}`}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  aria-controls="service-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActive(tab.id)}
                  className={`press inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-3 text-[0.9375rem] font-semibold ${
                    selected
                      ? 'bg-primary-600 text-white shadow-soft'
                      : 'border border-primary-100 bg-surface text-ink-body hover:border-primary-200 hover:text-primary-700'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs font-bold ${
                      selected ? 'bg-white/20 text-white' : 'bg-primary-100 text-primary-700'
                    }`}
                  >
                    {counts[tab.id] ?? 0}
                  </span>
                </button>
              )
            })}
          </div>
        </Reveal>

        <div
          id="service-panel"
          role="tabpanel"
          aria-label="Services"
          tabIndex={-1}
          className="mt-8 focus-visible:outline-none"
        >
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((service, index) => (
              <Reveal as="li" key={service.id} delay={Math.min(index * 60, 240)} className="h-full min-w-0">
                <ServiceCard
                  service={service}
                  popular={service.popular}
                  qty={order.qtyOf(service.id)}
                  onStep={(delta) => order.step(service.id, delta)}
                />
              </Reveal>
            ))}
          </ul>

          <p aria-live="polite" className="sr-only">
            {visible.length} services shown in the {active === ALL ? 'all' : active} category.
          </p>
        </div>
      </div>
    </section>
  )
}