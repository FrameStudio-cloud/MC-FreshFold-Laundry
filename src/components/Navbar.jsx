import { useEffect, useRef, useState } from 'react'
import { Menu, ShoppingBag, X } from 'lucide-react'
import { business } from '../data/business.js'
import { whatsappLink } from '../utils/whatsapp.js'
import { fillTokens } from '../utils/format.js'
import { WhatsAppIcon, ShopLogo } from './BrandIcons.jsx'

/**
 * Sticky header.
 *
 * Three pieces of real behaviour here rather than decoration:
 *   - the mobile menu traps Tab, closes on Escape, and returns focus to the
 *     button that opened it. Without that it is unusable by keyboard, which is
 *     the most common failure in a nav like this.
 *   - scroll-spy marks the section you are reading with aria-current, so the
 *     state is exposed to assistive tech and not only to sighted users.
 *   - the order button is in the header, not only in the mobile menu. It used to
 *     live solely inside the `lg:hidden` panel, and the floating OrderBar is
 *     `md:hidden`, so from `md` upwards there was no way to open the order
 *     drawer at all. Worse than a missing button: the quantity steppers on each
 *     service card still incremented, so a desktop visitor could build an order
 *     that was never shown to them anywhere. This button covers exactly the range
 *     OrderBar does not, so the two never overlap and never leave a gap.
 *
 * @param {function} [onOpenOrder] Open the order drawer
 * @param {number}   [orderCount]  Items in the order, for the badge
 */
export function Navbar({ onOpenOrder, orderCount = 0 }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('')

  const toggleRef = useRef(null)
  const panelRef = useRef(null)
  const waHref = whatsappLink()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the panel whenever the viewport grows past the mobile breakpoint,
  // otherwise it stays mounted behind the desktop layout.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const sync = () => mq.matches && setOpen(false)
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!open) return

    const onKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = panelRef.current?.querySelectorAll('a[href], button:not([disabled])')
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Highlight the section occupying the upper third of the viewport.
  useEffect(() => {
    const sections = business.nav
      .map((link) => document.getElementById(link.href.slice(1)))
      .filter(Boolean)
    if (!sections.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-20% 0px -65% 0px', threshold: 0 },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  const tokens = { area: business.area, city: business.city, name: business.name }

  return (
    <header
      className={`sticky top-0 z-50 transition-[background-color,box-shadow,border-color] duration-300 ${
        scrolled || open
          ? 'border-b border-primary-100/80 bg-canvas/90 shadow-soft backdrop-blur-xl'
          : 'border-b border-transparent bg-canvas/60 backdrop-blur-sm'
      }`}
    >
      <div className="container-x flex h-20 items-center justify-between gap-4">
        <a href="#top" className="press group flex items-center gap-3 rounded-full" aria-label={`${business.name} home`}>
          <ShopLogo src={business.logo} alt={`${business.name} logo`} />
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg font-extrabold tracking-tight text-ink">{business.name}</span>
            {/* Hidden on the narrowest phones: at 360px the tagline wraps to two
                lines and makes the sticky header noticeably taller. */}
            <span className="mt-1 hidden text-[0.6875rem] font-medium tracking-wide text-ink-muted sm:block">
              {fillTokens(business.tagline.split('.')[0], tokens)}
            </span>
          </span>
        </a>

        <nav aria-label="Sections" className="hidden lg:block">
          {/* Tighter at lg, comfortable from xl. Six links plus a button do not
              fit at 1024px with roomy padding, and the links were wrapping to
              two lines — which reads as a broken layout, not a tight one.
              whitespace-nowrap is the guard; the padding is the relief. */}
          <ul className="flex items-center gap-0.5 xl:gap-1">
            {business.nav.map((link) => {
              const id = link.href.slice(1)
              const isActive = active === id
              return (
                <li key={link.href}>
                  <a
                    href={link.href}
                    aria-current={isActive ? 'true' : undefined}
                    className={`press relative block whitespace-nowrap rounded-full px-3 py-2.5 text-[0.9375rem] font-medium transition-colors xl:px-4 ${
                      isActive ? 'bg-primary-100 text-primary-800' : 'text-ink-body hover:bg-primary-50 hover:text-primary-700'
                    }`}
                  >
                    {link.label}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="press hidden items-center gap-2 whitespace-nowrap rounded-full bg-whatsapp px-5 py-3 text-[0.9375rem] font-semibold text-white shadow-soft hover:bg-whatsapp-hover sm:inline-flex"
          >
            <WhatsAppIcon size={18} />
            {business.navOrderLabel ?? 'Order now'}
          </a>

          <button
            type="button"
            onClick={() => onOpenOrder?.()}
            aria-label={
              orderCount
                ? `Open order summary, ${orderCount} item${orderCount === 1 ? '' : 's'}`
                : business.order.drawerOpenLabel
            }
            // Appears exactly where the floating OrderBar stops, so there is
            // always a cart within reach and never two competing ones.
            className="press hidden h-12 items-center gap-2.5 rounded-full bg-primary-600 px-5 text-[0.9375rem] font-semibold text-white shadow-soft hover:bg-primary-700 md:inline-flex"
          >
            <ShoppingBag size={18} aria-hidden="true" />
            {/* Decorative: the accessible name comes from the aria-label above, so
                this is hidden from assistive tech rather than announced twice.
                One span, not two - a hidden copy plus an sr-only copy meant the
                label text was present in the DOM at every width, which shadowed
                the visible order button in text-based selectors. */}
            <span className="hidden xl:inline" aria-hidden="true">
              {business.order.title}
            </span>
            {orderCount > 0 ? (
              <span
                aria-hidden="true"
                className="grid h-7 min-w-7 place-items-center rounded-full bg-white/25 px-2 text-sm font-bold tabular-nums"
              >
                {orderCount}
              </span>
            ) : null}
          </button>

          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="press inline-flex h-12 w-12 items-center justify-center rounded-full border border-primary-200 bg-surface text-ink shadow-soft hover:bg-primary-50 lg:hidden"
          >
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile panel. Rendered, not conditionally mounted, so the open/close
          transition can play. */}
      <div
        id="mobile-menu"
        ref={panelRef}
        hidden={!open}
        className="border-t border-primary-100 bg-canvas/95 backdrop-blur-xl lg:hidden"
      >
        <nav aria-label="Sections" className="container-x py-5">
          <ul className="flex flex-col gap-1.5">
            {business.nav.map((link) => {
              const id = link.href.slice(1)
              const isActive = active === id
              return (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive ? 'true' : undefined}
                    className={`press flex items-center justify-between rounded-2xl px-5 py-3.5 text-base font-semibold ${
                      isActive ? 'bg-primary-100 text-primary-800' : 'bg-surface text-ink shadow-soft'
                    }`}
                  >
                    {link.label}
                  </a>
                </li>
              )
            })}
          </ul>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="press mt-4 flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-whatsapp px-6 py-4 text-base font-semibold text-white shadow-soft"
          >
            <WhatsAppIcon size={20} />
            {business.navOrderLabel ?? 'Order now'}
          </a>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onOpenOrder?.()
            }}
            className="press mt-2.5 flex w-full items-center justify-center gap-2 rounded-full border border-primary-200 bg-surface px-6 py-4 text-base font-semibold text-ink"
          >
            {business.order.drawerOpenLabel}
          </button>
        </nav>
      </div>
    </header>
  )
}
