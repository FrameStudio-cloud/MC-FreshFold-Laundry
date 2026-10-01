
import { ArrowRight, Clock } from 'lucide-react'
import { business } from '../data/business.js'
import { whatsappLink } from '../utils/whatsapp.js'
import { fillTokens } from '../utils/format.js'
import { getIcon } from '../utils/icons.js'
import { Reveal } from './Reveal.jsx'
import { WhatsAppIcon } from './BrandIcons.jsx'

/**
 * Hero.
 *
 * Composition notes, since this is what stops it reading as a template:
 *  - Asymmetric 7/5 split, text left, illustration right, and the split reverses
 *    at the largest breakpoint so the headline never sits under the image.
 *  - The illustration is a contained rounded block on a tinted panel, not a
 *    full-bleed photo. A laundry's best asset is usually a folded stack, not a
 *    stock shot of a smiling woman.
 *  - A soft aqua wash bleeding off the top-right corner instead of a gradient
 *    blob, plus one coral accent (the badge) â€” a single warm mark in the whole
 *    composition.
 */
export function Hero({ onViewServices }) {
  const tokens = { area: business.area, city: business.city, name: business.name }
  const waHref = whatsappLink()

  return (
    <section id="top" className="relative isolate overflow-hidden">
      {/* Soft corner wash, clipped to the section. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 -z-10 h-[34rem] w-[34rem] rounded-full bg-primary-100/60 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-52 -left-40 -z-10 h-[28rem] w-[28rem] rounded-full bg-accent-50 blur-3xl"
      />

      <div className="container-x grid items-center gap-12 py-16 md:py-20 lg:grid-cols-12 lg:gap-14 lg:py-24">
        <div className="min-w-0 lg:col-span-7">
          <Reveal as="p" className="eyebrow">
            <span className="inline-block h-2 w-2 rounded-full bg-accent-400" aria-hidden="true" />
            {fillTokens(business.hero.eyebrow, tokens)}
          </Reveal>

<Reveal
            as="h1"
            delay={60}
            className="mt-5 text-[2rem] leading-[1.1] sm:text-5xl lg:text-[3.25rem] xl:text-[4rem]"
          >
            {business.hero.headline}
            {/* Block + w-fit, not whitespace-nowrap: the accent sits on its own
                line, wraps internally if a client's copy is longer than this
                one, and the squiggle always spans exactly the widest line. */}
            <span className="relative mt-1 block w-fit max-w-full text-primary-600">
              {business.hero.headlineAccent}
              <svg
                aria-hidden="true"
                viewBox="0 0 300 12"
                preserveAspectRatio="none"
                className="pointer-events-none absolute -bottom-2 left-0 h-3 w-full text-accent-300"
              >
                <path
                  d="M2 8.5C52 3.5 120 2 186 4.5c40 1.6 78 3.4 112 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </Reveal>

          <Reveal as="p" delay={120} className="mt-7 max-w-xl text-lg text-ink-body">
            {fillTokens(business.hero.subtext, tokens)}
          </Reveal>

          <Reveal as="div" delay={180} className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="press inline-flex items-center justify-center gap-2.5 rounded-full bg-whatsapp px-7 py-4 text-base font-semibold text-white shadow-lift hover:bg-whatsapp-hover"
            >
              <WhatsAppIcon size={20} />
              {business.hero.primaryCta}
            </a>
            <a
              href="#services"
              onClick={onViewServices}
              className="press inline-flex items-center justify-center gap-2 rounded-full border border-primary-200 bg-surface px-7 py-4 text-base font-semibold text-ink shadow-soft hover:border-primary-300 hover:bg-primary-50"
            >
              {business.hero.secondaryCta}
              <ArrowRight size={18} aria-hidden="true" />
            </a>
          </Reveal>

          <Reveal as="ul" delay={240} className="mt-10 flex flex-wrap gap-x-7 gap-y-3">
            {business.hero.trust.map((item) => {
              const Icon = getIcon(item.icon)
              return (
                <li key={item.label} className="flex items-center gap-2 text-[0.9375rem] font-medium text-ink-body">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-100 text-primary-700">
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  {item.label}
                </li>
              )
            })}
          </Reveal>
        </div>

        <div className="min-w-0 lg:col-span-5">
          <Reveal delay={140} className="relative mx-auto max-w-md lg:max-w-none">
            <div className="relative overflow-hidden rounded-5xl border border-primary-100 bg-gradient-to-b from-surface to-primary-50 p-5 shadow-float sm:p-7">
              <img
                src={business.hero.image}
                alt={business.hero.imageAlt}
                width="640"
                height="640"
                loading="eager"
                decoding="async"
                className="h-auto w-full rounded-4xl"
              />

              {business.hero.badge ? (
                <div className="absolute bottom-8 left-0 flex items-center gap-3 rounded-full bg-surface px-4 py-3 shadow-lift sm:-left-6">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-100 text-accent-700">
                    <Clock size={18} aria-hidden="true" />
                  </span>
                  <span className="pr-1 leading-tight">
                    <span className="block font-display text-sm font-bold text-ink">
                      {business.hero.badge.title}
                    </span>
                    <span className="block text-xs text-ink-muted">{business.hero.badge.note}</span>
                  </span>
                </div>
              ) : null}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}