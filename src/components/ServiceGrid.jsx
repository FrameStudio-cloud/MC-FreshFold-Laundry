import { useMemo, useState } from 'react'
import { business } from '../data/business.js'
import { fillTokens } from '../utils/format.js'
import { groupServices } from '../utils/serviceNormalise.js'
import { whatsappLink } from '../utils/whatsapp.js'
import { Reveal } from './Reveal.jsx'
import { ServiceCard } from './ServiceCard.jsx'
import { WhatsAppIcon } from './BrandIcons.jsx'

const ALL = 'all'

/**
 * The catalogue.
 *
 * Filtering is client-side state, not navigation: no reload, no lost scroll
 * position. The tab row is a proper ARIA tablist with arrow-key roving focus, so
 * it is operable without a mouse — a row of pill buttons that only respond to
 * clicks would fail the accessibility brief.
 *
 * Tabs are derived from the groups that actually have services in them, so a
 * group the shop does not offer never appears, and the counts are real rather
 * than written by hand.
 */
export function ServiceGrid({ services, status, error, order, onOpenOrder }) {
  const groups = useMemo(() => groupServices(services), [services])
  const [active, setActive] = useState(ALL)
  const tokens = { area: business.area, city: business.city, name: business.name }

  const visible = useMemo(
    () => (active === ALL ? services : services.filter((s) => s.group === active)),
    [active, services],
  )

  const counts = useMemo(() => {
    const map = { [ALL]: services.length }
    for (const service of services) map[service.group] = (map[service.group] ?? 0) + 1
    return map
  }, [services])

  // If the loaded catalogue no longer has the group that was selected, fall back
  // to showing everything rather than rendering an empty grid.
  const selected = active === ALL || groups.some((g) => g.id === active) ? active : ALL

  const tabs = [{ id: ALL, label: 'All' }, ...groups.map((g) => ({ id: g.id, label: g.label }))]

  function onTabKeyDown(event) {
    const index = tabs.findIndex((tab) => tab.id === selected)
    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
    let next = null
    if (event.key in keys) next = (index + keys[event.key] + tabs.length) % tabs.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = tabs.length - 1
    if (next === null) return
    event.preventDefault()
    setActive(tabs[next].id)
    document.getElementById(`cat-${tabs[next].id}`)?.focus()
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

        {status === 'loading' ? (
          <CatalogueSkeleton />
        ) : status === 'error' || services.length === 0 ? (
          <CatalogueUnavailable error={error} />
        ) : (
          <>
            <Reveal delay={120} className="mt-10">
              {/* Hidden entirely when there is only one group, since an "All"
                  pill over a single filter is noise. */}
              {tabs.length > 2 ? (
                <div
                  role="tablist"
                  aria-label="Filter services by category"
                  onKeyDown={onTabKeyDown}
                  className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-2 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
                >
                  {tabs.map((tab) => {
                    const isSelected = selected === tab.id
                    return (
                      <button
                        key={tab.id}
                        id={`cat-${tab.id}`}
                        role="tab"
                        type="button"
                        aria-selected={isSelected}
                        aria-controls="service-panel"
                        tabIndex={isSelected ? 0 : -1}
                        onClick={() => setActive(tab.id)}
                        className={`press inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-3 text-[0.9375rem] font-semibold ${
                          isSelected
                            ? 'bg-primary-600 text-white shadow-soft'
                            : 'border border-primary-100 bg-surface text-ink-body hover:border-primary-200 hover:text-primary-700'
                        }`}
                      >
                        {tab.label}
                        <span
                          className={`grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-xs font-bold ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-primary-100 text-primary-700'
                          }`}
                        >
                          {counts[tab.id] ?? 0}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : null}
            </Reveal>

            <div
              id="service-panel"
              role="tabpanel"
              aria-label="Services"
              tabIndex={-1}
              className={tabs.length > 2 ? 'mt-8' : 'mt-10'}
            >
              <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((service, index) => (
                  <Reveal as="li" key={service.id} delay={Math.min(index * 50, 240)} className="h-full min-w-0">
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
                {visible.length} services shown in the {selected === ALL ? 'all' : selected} category.
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

/**
 * Shown when /api/services cannot be reached.
 *
 * There is deliberately no hardcoded fallback list. A second copy of the prices
 * is exactly the thing that goes stale and disagrees with what the shop actually
 * charges, and a stale price is worse than no price. Orders are taken on
 * WhatsApp anyway, so the message points there rather than pretending.
 */
function CatalogueUnavailable({ error }) {
  return (
    <Reveal className="mt-10">
      <div className="mx-auto flex max-w-2xl flex-col items-center rounded-4xl border border-primary-100 bg-surface px-7 py-12 text-center shadow-soft">
        <h3 className="font-display text-xl font-extrabold">Our price list didn&apos;t load</h3>
        <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-ink-body">
          We couldn&apos;t reach our service list just now. Prices change fairly often, so we&apos;d rather
          not show you yesterday&apos;s numbers — message us and we&apos;ll quote you properly.
        </p>
        <a
          href={whatsappLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="press mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-whatsapp px-7 py-4 text-base font-semibold text-white shadow-soft hover:bg-whatsapp-hover"
        >
          <WhatsAppIcon size={20} />
          Ask for prices on WhatsApp
        </a>
        {import.meta.env.DEV && error ? (
          <p className="mt-5 font-mono text-xs text-ink-muted">{String(error.message || error)}</p>
        ) : null}
      </div>
    </Reveal>
  )
}

/** Placeholder cards at the right size so the section does not jump when the
 *  list arrives. aria-hidden: it conveys nothing to a screen reader. */
function CatalogueSkeleton() {
  return (
    <div aria-hidden="true" className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-64 animate-pulse rounded-4xl border border-primary-100 bg-surface-quiet" />
      ))}
    </div>
  )
}
