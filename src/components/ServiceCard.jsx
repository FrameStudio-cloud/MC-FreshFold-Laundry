
/* eslint-disable react-hooks/static-components --
   getIcon() returns a reference from a module-level map in src/utils/icons.js,
   so the resolved component's identity is identical on every render and it
   holds no state. The rule cannot see through the lookup. The same pattern in
   Hero/Steps/Benefits is inside a .map() callback and is not flagged. */
import { Minus, Plus } from 'lucide-react'
import { business } from '../data/business.js'
import { formatKES } from '../utils/format.js'
import { getIcon } from '../utils/icons.js'
import { priceHead, priceLine, unitLabel, unitNoun } from '../utils/whatsapp.js'

/**
 * One service card.
 *
 * The stepper counts the service's `unit`, not a generic "quantity". A laundry
 * owner reading "Wash & fold â€” 4 kg" understands immediately; "Ã—4" does not.
 * Services with no unit (flat-priced jobs) show no stepper, because a +/- next
 * to "Express, KES 300" implies four express jobs were being bought, which is
 * a different thing.
 *
 * The "Order" button is always live: it opens WhatsApp for that service on its
 * own, so a visitor who wants one thing never has to find the drawer.
 */
export function ServiceCard({ service, qty, onStep, popular }) {
  const Icon = getIcon(service.icon)
  const label = unitLabel(service.unit)
  const isAccent = Boolean(service.accent)

  return (
    <article
      className={`lift group relative flex h-full flex-col overflow-hidden rounded-4xl border p-6 shadow-soft sm:p-7 ${
        isAccent
          ? 'border-accent-200 bg-gradient-to-b from-accent-50 to-surface'
          : 'border-primary-100 bg-surface'
      }`}
    >
      {popular ? (
        <span className="absolute right-5 top-5 rounded-full bg-primary-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-soft">
          Most booked
        </span>
      ) : null}
      {service.accent ? (
        <span className="absolute right-5 top-5 rounded-full bg-accent-100 px-3.5 py-1.5 text-xs font-bold text-accent-700">
          Fastest
        </span>
      ) : null}

      <span
        className={`grid h-14 w-14 place-items-center rounded-2xl transition-transform duration-300 group-hover:-rotate-6 ${
          isAccent ? 'bg-accent-100 text-accent-700' : 'bg-primary-100 text-primary-700'
        }`}
      >
        <Icon size={26} strokeWidth={1.9} aria-hidden="true" />
      </span>

      <h3 className="mt-5 text-xl font-extrabold">{service.name}</h3>

      <p className="mt-2.5 flex-1 text-[0.9375rem] leading-relaxed text-ink-body">{service.description}</p>

      <div className="mt-5">
        {/* Price and its unit are separate elements on purpose: joining them
            makes one long line that wraps and destroys the price as a
            scannable anchor. The unit comes from the database's unit_label, so
            it cannot disagree with what the stepper counts. */}
        <p
          className={`font-display text-2xl font-extrabold leading-tight ${
            isAccent ? 'text-accent-700' : 'text-primary-700'
          }`}
        >
          {priceHead(service)}
        </p>
        {service.unit ? (
          <p className="mt-1 text-sm text-ink-muted">per {unitNoun(service.unit, true)}</p>
        ) : null}
        {service.note ? <p className="mt-1 text-sm text-ink-muted">{service.note}</p> : null}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {service.unit ? (
<Stepper
            label={label}
            value={qty}
            name={service.name}
            unit={service.unit}
            lineTotal={service.price * qty}
            onStep={onStep}
            accent={isAccent}
          />
        ) : (
          <a
            href={singleServiceHref(service)}
            target="_blank"
            rel="noopener noreferrer"
            className={`press inline-flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[0.9375rem] font-semibold text-white shadow-soft hover:brightness-[1.04] ${
              isAccent ? 'bg-accent-600' : 'bg-primary-600'
            }`}
          >
            Order
          </a>
        )}
      </div>
    </article>
  )
}

/**
 * Rounded +/- control. The value is exposed as a group with a live region so a
 * screen reader hears the new quantity when it changes, and the buttons carry
 * their own labels ("Add one kg") instead of a bare "+".
 */
function Stepper({ label, value, name, unit, lineTotal, onStep, accent }) {
  // Both buttons describe a single click, so they always take the SINGULAR
  // form. Deriving this from the running total produced "Remove one items"
  // whenever the count was 0 or above 1, which is both wrong and confusing.
  const one = label.singular

  return (
    <div className="flex flex-1 items-center gap-3">
      <div
        className="flex items-center gap-1 rounded-full border border-primary-100 bg-surface-quiet p-1.5"
        role="group"
        aria-label={`How many ${unit === 'kg' ? 'kilograms' : label.plural} of ${name}?`}
      >
        <button
          type="button"
          onClick={() => onStep(-1)}
          disabled={value === 0}
          className="press grid h-10 w-10 place-items-center rounded-full bg-surface text-ink shadow-soft hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          <Minus size={18} aria-hidden="true" />
          <span className="sr-only">Remove one {one} of {name}</span>
        </button>

        <span
          aria-live="polite"
          className="min-w-14 text-center font-display text-sm font-bold tabular-nums text-ink"
        >
{value}
          {/* This one DOES follow the running total, unlike the buttons: it
              describes how much is selected, so 1 reads "1 item". */}
          <span className="ml-1 font-sans text-xs font-medium text-ink-muted">
            {value === 1 ? label.singular : label.plural}
          </span>
        </span>

        <button
          type="button"
          onClick={() => onStep(1)}
          className={`press grid h-10 w-10 place-items-center rounded-full text-white shadow-soft hover:brightness-105 ${
            accent ? 'bg-accent-600' : 'bg-primary-600'
          }`}
        >
          <Plus size={18} aria-hidden="true" />
          <span className="sr-only">Add one {one} of {name}</span>
        </button>
      </div>

{/* The running cost of THIS line — price x quantity. Formatting the
          quantity itself here printed "KES 1" next to a KES 150 service. */}
      {value > 0 ? (
        <span className="font-display text-sm font-bold tabular-nums text-ink">
          {formatKES(lineTotal, business.currency)}
        </span>
      ) : null}
    </div>
  )
}

/** Direct WhatsApp order for a single service, used by flat-priced cards. */
function singleServiceHref(service) {
  const number = String(business.whatsapp).replace(/\D/g, '')
  const text = [
    `Hi ${business.shortName || business.name}!`,
    `I'd like to order: ${service.name}.`,
    `Price on your site: ${priceLine(service)}.`,
    '',
    'Pickup address:',
  ].join('\n')
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`
}