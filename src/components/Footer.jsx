import { Mail, MapPin, Phone } from 'lucide-react'
import { business } from '../data/business.js'
import { fillTokens } from '../utils/format.js'
import { formatHoursRow } from '../utils/hours.js'
import { Reveal } from './Reveal.jsx'
import { InstagramIcon, ShopLogo, WhatsAppIcon } from './BrandIcons.jsx'

/**
 * Footer.
 *
 * LIGHT, by rule and by taste: a soft aqua-tinted wash that echoes the header,
 * deep teal text, no dark band anywhere. A dark footer is the single most
 * common way a page like this loses its identity, and it also breaks the
 * illusion of an all-light page.
 *
 * <nav> wraps the links because they are navigation; the contact block is a
 * plain list because an address is not a menu.
 */
export function Footer() {
  const tokens = { name: business.name, area: business.area, city: business.city }
  const year = new Date().getFullYear()

  const contact = [
    {
      icon: Phone,
      label: business.phoneDisplay,
      href: `tel:${business.phoneDial}`,
      show: Boolean(business.phoneDisplay),
    },
    {
      icon: InstagramIcon,
      label: `@${business.instagram}`,
      href: business.instagramUrl,
      show: Boolean(business.instagram),
    },
    {
      icon: MapPin,
      label: `${business.area}, ${business.city}`,
      href: business.mapLinkUrl,
      show: Boolean(business.mapLinkUrl),
    },
  ]

  if (business.email) {
    contact.push({ icon: Mail, label: business.email, href: `mailto:${business.email}`, show: true })
  }

  return (
    <footer className="border-t border-primary-100 bg-gradient-to-b from-primary-50 to-canvas">
      {/* Extra bottom padding is deliberate: the floating WhatsApp button and, on
          mobile, the sticky order bar are fixed to the bottom of the viewport,
          so without this the credit line sits underneath them at the very
          bottom of the page. */}
      <div className="container-x pb-32 pt-16 md:pb-28">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="min-w-0 lg:col-span-4">
            <a href="#top" className="press inline-flex items-center gap-3 rounded-full">
              <ShopLogo src={business.logo} alt={`${business.name} logo`} />
              <span className="font-display text-lg font-extrabold tracking-tight text-ink">{business.name}</span>
            </a>
            <p className="mt-5 max-w-sm text-[0.9375rem] leading-relaxed text-ink-body">
              {fillTokens(business.footer.blurb, tokens)}
            </p>
          </div>

          <nav aria-label="Footer" className="min-w-0 lg:col-span-3">
            <h2 className="font-display text-sm font-extrabold uppercase tracking-widest text-primary-800">
              {business.footer.quickLinksTitle}
            </h2>
            <ul className="mt-5 flex flex-col gap-3">
              {business.nav.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="press inline-block rounded-full text-[0.9375rem] text-ink-body hover:text-primary-700"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 lg:col-span-3">
            <h2 className="font-display text-sm font-extrabold uppercase tracking-widest text-primary-800">
              {business.footer.contactTitle}
            </h2>
            <ul className="mt-5 flex flex-col gap-3.5">
              {contact
                .filter((item) => item.show)
                .map(({ icon: Icon, label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target={href.startsWith('http') ? '_blank' : undefined}
                      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="press group inline-flex items-center gap-3 rounded-full text-[0.9375rem] text-ink-body hover:text-primary-700"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface text-primary-700 shadow-soft transition-colors group-hover:bg-primary-600 group-hover:text-white">
                        <Icon size={17} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 truncate">{label}</span>
                    </a>
                  </li>
                ))}
            </ul>
          </div>

          <div className="min-w-0 lg:col-span-2">
            <h2 className="font-display text-sm font-extrabold uppercase tracking-widest text-primary-800">
              {business.footer.hoursTitle}
            </h2>
            <dl className="mt-5 flex flex-col gap-3.5">
              {business.hours.map((row) => {
                const { label, value } = formatHoursRow(row)
                return (
                  <div key={label} className="leading-tight">
                    <dt className="text-[0.9375rem] font-semibold text-ink">{label}</dt>
                    <dd className="text-sm tabular-nums text-ink-muted">{value}</dd>
                  </div>
                )
              })}
            </dl>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-primary-200/70 pt-8 text-center sm:flex-row sm:text-left">
          <p className="text-sm text-ink-muted">
            &copy; {year} {business.footer.copyright || business.name}. All rights reserved.
          </p>
          <a
            href={business.footer.creditUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="press inline-flex items-center gap-2 rounded-full border border-primary-200 bg-surface px-4 py-2 text-sm font-semibold text-ink-body shadow-soft hover:border-primary-300 hover:text-primary-700"
          >
            <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-accent-400" />
            {business.footer.creditLabel}
          </a>
        </div>
      </div>
    </footer>
  )
}