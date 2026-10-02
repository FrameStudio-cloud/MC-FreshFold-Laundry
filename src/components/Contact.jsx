import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { business } from '../data/business.js'
import { useRemoteLocation } from '../hooks/useRemoteLocation.js'
import { fillTokens } from '../utils/format.js'
import { formatHoursRow, openNowLabel } from '../utils/hours.js'
import { whatsappLink } from '../utils/whatsapp.js'
import { Reveal } from './Reveal.jsx'
import { InstagramIcon, WhatsAppIcon } from './BrandIcons.jsx'

/**
 * Location, hours and contact.
 *
 * The map is optional by design: with no embed URL the site shows a designed
 * placeholder in brand colours rather than a grey box with "Map unavailable", and
 * "Open in Google Maps" still works. That is now true twice over, because the
 * owner can paste an embed URL in Keel -> Website, and useRemoteLocation only
 * accepts one that is recognisably a Google embed. Anything else falls back to
 * the placeholder, so a paste that would not have worked is visible as such
 * rather than as a blank frame.
 *
 * The open/closed badge is computed from the same hours array the table below
 * renders and the schema is generated from, so it cannot say "Open now" on a
 * Tuesday at 6am.
 */
export function Contact() {
  const status = openNowLabel()
  const location = useRemoteLocation()
  const tokens = { name: business.name, area: business.area, city: business.city }

  const rows = [
    {
      icon: MapPin,
      label: 'Address',
      // addressLine only: the database stores one combined "Kariani, Muranga"
      // string, so appending area and city would print the town twice.
      // From the same source as the map card below, so the two cannot disagree.
      value: location.addressLine,
      href: location.mapLinkUrl,
    },
    {
      icon: Phone,
      label: 'Phone',
      value: business.phoneDisplay,
      href: `tel:${business.phoneDial}`,
    },
    {
      icon: InstagramIcon,
      label: 'Instagram',
      value: `@${business.instagram}`,
      href: business.instagramUrl,
    },
  ]

  if (business.email) {
    rows.push({ icon: Mail, label: 'Email', value: business.email, href: `mailto:${business.email}` })
  }

  return (
    <section id="contact" className="section bg-canvas-deep/50">
      <div className="container-x">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">
            <span className="inline-block h-2 w-2 rounded-full bg-primary-400" aria-hidden="true" />
            {business.contact.eyebrow}
          </p>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-[2.75rem]">{business.contact.title}</h2>
          {business.contact.intro ? <p className="mt-4 text-lg text-ink-body">{business.contact.intro}</p> : null}
        </Reveal>

        {/* min-w-0 on both columns is load-bearing: a grid item's default
            min-width is `auto`, so the map image's intrinsic width would
            otherwise stretch this column past a 360px viewport. */}
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Reveal className="flex min-w-0 flex-col gap-4">
            <div className="rounded-4xl border border-primary-100 bg-surface p-7 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="flex items-center gap-2.5 text-lg font-extrabold">
                  <Clock size={20} className="text-primary-600" aria-hidden="true" />
                  Opening hours
                </h3>
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold ${
                    status.open ? 'bg-primary-100 text-primary-800' : 'bg-accent-100 text-accent-700'
                  }`}
                >
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${status.open ? 'bg-primary-500' : 'bg-accent-400'}`}
                    aria-hidden="true"
                  />
                  {status.text}
                </span>
              </div>

              <dl className="mt-5 flex flex-col divide-y divide-primary-100/80">
                {business.hours.map((row) => {
                  const { label, value } = formatHoursRow(row)
                  return (
                    <div key={label} className="flex items-baseline justify-between gap-4 py-3.5">
                      <dt className="text-[0.9375rem] text-ink-body">{label}</dt>
                      <dd className="shrink-0 font-display text-[0.9375rem] font-bold tabular-nums text-ink">
                        {value}
                      </dd>
                    </div>
                  )
                })}
              </dl>

              {business.directionsNote ? (
                <p className="mt-4 rounded-2xl bg-primary-50 px-4 py-3 text-sm text-primary-800">
                  {business.directionsNote}
                </p>
              ) : null}
            </div>

            <div className="rounded-4xl border border-primary-100 bg-surface p-7 shadow-soft">
              <h3 className="text-lg font-extrabold">Get in touch</h3>
              <ul className="mt-5 flex flex-col gap-1">
                {rows.map(({ icon: Icon, label, value, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target={href.startsWith('http') ? '_blank' : undefined}
                      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="press group flex items-center gap-4 rounded-2xl px-3 py-3.5 hover:bg-primary-50"
                    >
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-100 text-primary-700 transition-colors group-hover:bg-primary-600 group-hover:text-white">
                        <Icon size={19} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 leading-tight">
                        <span className="block text-xs font-medium uppercase tracking-wide text-ink-muted">
                          {label}
                        </span>
                        <span className="block truncate font-display text-[0.9375rem] font-bold text-ink">{value}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>

              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="press mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-whatsapp px-6 py-4 text-base font-semibold text-white shadow-soft hover:bg-whatsapp-hover"
              >
                <WhatsAppIcon size={20} />
                WhatsApp {business.phoneDisplay}
              </a>
            </div>
          </Reveal>

          <Reveal delay={80} className="flex min-w-0 flex-col gap-4">
            <div className="relative min-w-0 flex-1 overflow-hidden rounded-4xl border border-primary-100 bg-surface shadow-soft">
              {location.mapEmbedUrl ? (
                <iframe
                  src={location.mapEmbedUrl}
                  title={`Map showing ${business.name} in ${business.area}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-full min-h-80 w-full border-0"
                />
              ) : (
                <>
                  <img
                    src={business.mapPlaceholder}
                    alt={`Map placeholder for ${business.name}, ${business.area}, ${business.city}`}
                    width="800"
                    height="600"
                    loading="lazy"
                    decoding="async"
                    className="h-full min-h-80 w-full min-w-0 object-cover"
                  />
                  <div className="absolute inset-x-4 bottom-4 rounded-3xl bg-surface/95 p-5 shadow-lift backdrop-blur">
                    <p className="font-display text-lg font-extrabold text-ink">{business.shortName}</p>
                    <p className="mt-1 text-sm text-ink-body">{location.addressLine}</p>
                    <a
                      href={location.mapLinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="press mt-4 inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
                    >
                      <MapPin size={16} aria-hidden="true" />
                      Open in Google Maps
                    </a>
                  </div>
                </>
              )}
            </div>

            {/* Outside the map card on purpose. It used to sit inside the
                placeholder overlay, which meant it disappeared the moment a real
                embed was saved - and "look for the blue gate" is most useful
                precisely when there is a live map to be lost in. */}
            {location.landmarkNote ? (
              <Reveal
                delay={40}
                className="flex items-start gap-3 rounded-4xl border border-primary-100 bg-surface p-5 shadow-soft"
              >
                <MapPin size={18} className="mt-0.5 shrink-0 text-primary-500" aria-hidden="true" />
                <p className="text-[0.9375rem] leading-relaxed text-ink-body">
                  {location.landmarkNote}
                </p>
              </Reveal>
            ) : null}

            {business.delivery.available && business.delivery.areas?.length ? (
              <div className="rounded-4xl border border-primary-100 bg-surface p-7 shadow-soft">
                <h3 className="text-lg font-extrabold">
                  {business.delivery.free ? 'Free pickup & delivery' : 'Pickup & delivery'}
                </h3>
                <p className="mt-2 text-[0.9375rem] text-ink-body">
                  {fillTokens(business.delivery.feeNote, tokens)}
                </p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {business.delivery.areas.map((area) => (
                    <li
                      key={area}
                      className="rounded-full bg-primary-100 px-4 py-2 text-sm font-semibold text-primary-800"
                    >
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Reveal>
        </div>
      </div>
    </section>
  )
}