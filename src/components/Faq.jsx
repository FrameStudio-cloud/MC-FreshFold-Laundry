import { useState } from 'react'
import { Plus } from 'lucide-react'
import { business } from '../data/business.js'
import { fillTokens } from '../utils/format.js'
import { Reveal } from './Reveal.jsx'

/**
 * FAQ accordion.
 *
 * Built on native <button> + aria-expanded + aria-controls rather than the
 * <details> element, for two reasons: the open/close animation needs a
 * measurable height, and the plus icon has to rotate.
 *
 * Keyboard behaviour is the native button's, which is already correct: Tab to
 * reach it, Enter or Space to toggle. One panel is open by default so the
 * section never looks broken or empty, and a visitor can read an answer without
 * a click.
 */
export function Faq() {
  const items = business.faq.items
  const [open, setOpen] = useState(() => (items[0] ? 0 : null))
  const tokens = { name: business.name, area: business.area, city: business.city }

  return (
    <section id="faq" className="section">
      <div className="container-x">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="min-w-0 lg:col-span-5">
            <p className="eyebrow">
              <span className="inline-block h-2 w-2 rounded-full bg-accent-400" aria-hidden="true" />
              {business.faq.eyebrow}
            </p>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-[2.75rem]">{business.faq.title}</h2>
            {business.faq.intro ? <p className="mt-4 text-lg text-ink-body">{business.faq.intro}</p> : null}

            <a
              href="#services"
              className="press mt-8 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-surface px-6 py-3.5 text-[0.9375rem] font-semibold text-ink shadow-soft hover:border-primary-300 hover:bg-primary-50"
            >
              See the services list
            </a>
          </Reveal>

          <Reveal delay={80} className="min-w-0 lg:col-span-7">
            <ul className="flex flex-col gap-3">
              {items.map((item, index) => {
                const isOpen = open === index
                const panelId = `faq-panel-${index}`
                const buttonId = `faq-button-${index}`

                return (
                  <li
                    key={item.q}
                    className={`overflow-hidden rounded-3xl border bg-surface transition-colors duration-300 ${
                      isOpen ? 'border-primary-200 shadow-soft' : 'border-primary-100 shadow-soft'
                    }`}
                  >
                    <h3>
                      <button
                        id={buttonId}
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => setOpen(isOpen ? null : index)}
                        className="press flex w-full items-center justify-between gap-4 rounded-3xl px-6 py-5 text-left"
                      >
                        <span className="font-display text-[1.0625rem] font-bold text-ink">{item.q}</span>
                        <span
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition-all duration-300 ${
                            isOpen ? 'rotate-45 bg-primary-600 text-white' : 'bg-primary-100 text-primary-700'
                          }`}
                          aria-hidden="true"
                        >
                          <Plus size={18} />
                        </span>
                      </button>
                    </h3>

                    {/* Kept mounted and hidden so the region is discoverable by
                        find-in-page and by assistive tech in both states. */}
                    <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!isOpen}>
                      <p className="px-6 pb-6 pt-1 text-[1.0625rem] leading-relaxed text-ink-body">
                        {fillTokens(item.a, tokens)}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  )
}