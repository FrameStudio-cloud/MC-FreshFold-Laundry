import { business } from '../data/business.js'
import { whatsappLink } from '../utils/whatsapp.js'
import { fillTokens } from '../utils/format.js'
import { Reveal } from './Reveal.jsx'
import { WhatsAppIcon } from './BrandIcons.jsx'

/**
 * Closing banner.
 *
 * Soft aqua panel with a coral dot and an oversized outlined word behind it —
 * the one piece of visual punctuation on the page. It is a container, not a
 * section, so it deliberately breaks the vertical rhythm to close the page
 * rather than blend into everything above it.
 */
export function FinalCta() {
  const tokens = { name: business.name, area: business.area, city: business.city }

  return (
    <section className="pb-20 pt-4 md:pb-28">
      <div className="container-x">
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-5xl bg-gradient-to-br from-primary-600 via-primary-600 to-primary-700 px-7 py-14 text-center shadow-float sm:px-14 sm:py-16">
            {/* Decorative wash + outlined word. Both aria-hidden. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-24 -z-10 h-80 w-80 rounded-full bg-primary-400/40 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-32 -left-20 -z-10 h-80 w-80 rounded-full bg-accent-400/25 blur-3xl"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 select-none text-center font-display text-[7rem] font-extrabold leading-none text-white/10 sm:text-[9rem] lg:text-[11rem]"
            >
              {business.shortName}
            </span>

            <p className="inline-flex items-center gap-2.5 rounded-full bg-white/15 px-5 py-2.5 text-sm font-bold text-primary-50 backdrop-blur">
              <span className="inline-block h-2 w-2 rounded-full bg-accent-300" aria-hidden="true" />
              {fillTokens(business.finalCta.eyebrow, tokens)}
            </p>

            <h2 className="mx-auto mt-6 max-w-2xl text-3xl text-primary-50 sm:text-4xl lg:text-[2.75rem]">
              {fillTokens(business.finalCta.title, tokens)}
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-lg text-primary-100">{business.finalCta.body}</p>

            <div className="mt-9 flex flex-col items-center gap-3">
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="press inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-white px-8 py-4.5 text-base font-bold text-primary-700 shadow-lift hover:bg-primary-50 sm:w-auto"
              >
                <WhatsAppIcon size={20} className="text-whatsapp" />
                {business.finalCta.button}
              </a>
              {business.finalCta.note ? (
                <p className="text-sm text-primary-100">{business.finalCta.note}</p>
              ) : null}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}