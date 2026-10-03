
import { business } from '../data/business.js'
import { useRemoteHowItWorks } from '../hooks/useRemoteHowItWorks.js'
import { fillTokens } from '../utils/format.js'
import { getIcon } from '../utils/icons.js'
import { Reveal } from './Reveal.jsx'
import { HangerIcon } from './BrandIcons.jsx'

/**
 * How it works.
 *
 * Rendered as an ordered list because it IS a sequence â€” the numbered badges
 * then come from the list position rather than a hand-written "1, 2, 3", so
 * inserting a step cannot desynchronise the badges from the order.
 *
 * A dashed connector runs behind the badges on desktop and is hidden on mobile,
 * where four numbered circles in a column with a line between them just reads
 * as clutter.
 */
const ICON_OVERRIDE = { hanger: HangerIcon }

export function Steps() {
  // Overlays the owner's saved steps onto business.steps. The list position below
  // drives the numbering, so an owner adding or removing a step needs no change
  // here and the badges renumber themselves.
  useRemoteHowItWorks()
  const steps = business.steps.steps
  const tokens = { name: business.name, area: business.area, city: business.city }

  return (
    <section id="how-it-works" className="section bg-canvas-deep/50">
      <div className="container-x">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow justify-center">
            <span className="inline-block h-2 w-2 rounded-full bg-primary-400" aria-hidden="true" />
            {business.steps.eyebrow}
          </p>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-[2.75rem]">{business.steps.title}</h2>
          {business.steps.intro ? <p className="mt-4 text-lg text-ink-body">{business.steps.intro}</p> : null}
        </Reveal>

        <ol className="relative mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-7">
          {/* Connector. Decorative, hidden below lg where the grid wraps. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-0 right-0 top-7 hidden border-t-2 border-dashed border-primary-200 lg:block"
          />

          {steps.map((step, index) => {
            const Icon = ICON_OVERRIDE[step.icon] ?? getIcon(step.icon)
            return (
              <Reveal as="li" key={step.title} delay={index * 90} className="relative min-w-0">
                <div className="group h-full rounded-4xl border border-primary-100 bg-surface p-6 text-center shadow-soft transition-shadow duration-300 hover:shadow-lift lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none lg:hover:shadow-none">
                  <span className="relative mx-auto grid h-16 w-16 place-items-center rounded-full border-4 border-canvas-deep bg-primary-600 text-white shadow-soft transition-transform duration-300 group-hover:-translate-y-1">
                    <Icon size={26} strokeWidth={1.9} aria-hidden="true" />
                    {/* Number sits on the badge edge; the list is the source of truth. */}
                    <span className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full bg-accent-400 font-display text-sm font-extrabold text-white shadow-soft">
                      <span className="sr-only">Step </span>
                      {index + 1}
                    </span>
                  </span>

                  <h3 className="mt-5 text-lg font-extrabold">{step.title}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-body">
                    {fillTokens(step.body, tokens)}
                  </p>
                </div>
              </Reveal>
            )
          })}
        </ol>

        {business.delivery.available && business.delivery.sameDayCutoff ? (
          <Reveal delay={120} className="mt-10 flex justify-center">
            <p className="inline-flex items-center gap-2.5 rounded-full border border-accent-200 bg-accent-50 px-6 py-3.5 text-center text-sm font-semibold text-accent-700">
              <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-accent-400" aria-hidden="true" />
              {fillTokens(business.delivery.sameDayCutoff, tokens)}
            </p>
          </Reveal>
        ) : null}
      </div>
    </section>
  )
}