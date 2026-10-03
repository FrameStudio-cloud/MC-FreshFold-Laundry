
import { business } from '../data/business.js'
import { useRemoteBenefits } from '../hooks/useRemoteBenefits.js'
import { fillTokens } from '../utils/format.js'
import { getIcon } from '../utils/icons.js'
import { Reveal } from './Reveal.jsx'

/**
 * "Why choose us".
 *
 * One accent tile per card, offset down the row, so the row has rhythm instead
 * of four identical blocks. Purely decorative, so it is aria-hidden.
 */
export function Benefits() {
  // Overlays the owner's saved benefits onto business.benefits. The accent tile
  // cycles with `index % accents.length`, so an owner adding a fifth benefit gets
  // the right tile rather than a blank one.
  useRemoteBenefits()
  const items = business.benefits.items
  const tokens = { name: business.name, area: business.area, city: business.city }
  const accents = ['bg-primary-100 text-primary-700', 'bg-accent-100 text-accent-700', 'bg-primary-100 text-primary-700', 'bg-accent-100 text-accent-700']

  return (
    <section className="section">
      <div className="container-x">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">
            <span className="inline-block h-2 w-2 rounded-full bg-accent-400" aria-hidden="true" />
            {fillTokens(business.benefits.eyebrow, tokens)}
          </p>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-[2.75rem]">{business.benefits.title}</h2>
          {business.benefits.intro ? (
            <p className="mt-4 text-lg text-ink-body">{fillTokens(business.benefits.intro, tokens)}</p>
          ) : null}
        </Reveal>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, index) => {
            const Icon = getIcon(item.icon)
            return (
              <Reveal
                as="li"
                key={item.title}
                delay={index * 80}
                className={index % 2 === 1 ? 'min-w-0 lg:translate-y-6' : 'min-w-0'}
              >
                <div className="lift h-full rounded-4xl border border-primary-100 bg-surface p-7 shadow-soft">
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-2xl ${accents[index % accents.length]}`}
                  >
                    <Icon size={23} strokeWidth={1.9} aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-lg font-extrabold leading-snug">{item.title}</h3>
                  <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-body">{item.body}</p>
                </div>
              </Reveal>
            )
          })}
        </ul>
      </div>
    </section>
  )
}