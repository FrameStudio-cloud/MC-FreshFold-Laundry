import { Quote, Star } from 'lucide-react'
import { business } from '../data/business.js'
import { useRemoteTestimonials } from '../hooks/useRemoteTestimonials.js'
import { fillTokens } from '../utils/format.js'
import { Reveal } from './Reveal.jsx'

/**
 * Testimonials.
 *
 * Placeholder honesty: business.reviews.placeholder is true in the shipped config,
 * and this component says so on the page — an "★★★★★ Verified customer" badge on
 * invented quotes is the kind of thing that gets a small business into trouble,
 * and it is exactly the detail a paying client notices.
 *
 * That honesty is the reason the warning is conditional rather than permanent.
 * Once the owner saves real reviews in Keel, what is on screen is theirs, so the
 * banner would be telling them their own reviews are placeholders. It disappears
 * because that statement stopped being true, not to make the page look better.
 */
export function Testimonials() {
  const { items, title, isPlaceholder } = useRemoteTestimonials()
  const tokens = { name: business.name, area: business.area, city: business.city }

  return (
    <section id="reviews" className="section bg-canvas-deep/50">
      <div className="container-x">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow justify-center">
            <span className="inline-block h-2 w-2 rounded-full bg-primary-400" aria-hidden="true" />
            {business.reviews.eyebrow}
          </p>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-[2.75rem]">{fillTokens(title, tokens)}</h2>
        </Reveal>

        {isPlaceholder ? (
          <Reveal delay={60} className="mx-auto mt-6 max-w-2xl">
            <p className="rounded-full border border-accent-200 bg-accent-50 px-6 py-3.5 text-center text-sm font-medium text-accent-700">
              Placeholder reviews for layout preview — replace these with real customer quotes before launch.
            </p>
          </Reveal>
        ) : null}

        <ul className="mt-12 grid gap-5 md:grid-cols-3">
          {items.map((review, index) => (
            <Reveal as="li" key={review.name + index} delay={index * 90} className="h-full min-w-0">
              <figure className="lift flex h-full flex-col rounded-4xl border border-primary-100 bg-surface p-7 shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex gap-0.5" role="img" aria-label={`${review.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }, (_, star) => (
                      <Star
                        key={star}
                        size={17}
                        aria-hidden="true"
                        className={star < review.rating ? 'text-accent-400' : 'text-primary-200'}
                        fill="currentColor"
                        strokeWidth={0}
                      />
                    ))}
                  </div>
                  <Quote size={26} className="shrink-0 text-primary-200" aria-hidden="true" />
                </div>

                <blockquote className="mt-5 flex-1 text-[1.0625rem] leading-relaxed text-ink-body">
                  {review.quote}
                </blockquote>

                <figcaption className="mt-6 flex items-center gap-3 border-t border-primary-100 pt-5">
                  <span
                    aria-hidden="true"
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-100 font-display text-base font-extrabold text-primary-700"
                  >
                    {review.name.charAt(0)}
                  </span>
                  <span className="min-w-0 leading-tight">
                    <span className="block font-display text-[0.9375rem] font-bold text-ink">{review.name}</span>
                    <span className="block truncate text-sm text-ink-muted">
                      {review.area}
                      {review.service ? ` · ${review.service}` : ''}
                    </span>
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}