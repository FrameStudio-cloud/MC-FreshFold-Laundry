import { useEffect, useRef } from 'react'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { business } from '../data/business.js'
import { formatKES } from '../utils/format.js'
import { orderWhatsAppLink, unitLabel, unitNoun } from '../utils/whatsapp.js'
import { useScrollLock } from '../hooks/useScrollLock.js'
import { WhatsAppIcon } from './BrandIcons.jsx'

/**
 * The order sheet.
 *
 * Bottom sheet on mobile, right-hand panel from md up — the same component, so
 * there is one focus trap and one Escape handler rather than two divergent
 * implementations.
 *
 * Accessibility work that actually matters here:
 *  - role="dialog" + aria-modal, labelled by the panel heading.
 *  - Tab is trapped inside while open; Escape closes and returns focus to
 *    whatever opened it (the OrderBar below, or the nav button).
 *  - Background scroll is frozen, with scrollbar-width compensation.
 *  - The total is an aria-live region, so adding an item is announced.
 *  - Nothing behind the overlay is tabbable once it is closed, because the
 *    panel unmounts rather than just fading out.
 *
 * It is NOT a checkout. There is no payment step and no fake basket; the one
 * action that matters hands the order to WhatsApp, which is where a laundry
 * actually gets paid and scheduled.
 */
export function OrderDrawer({ open, onClose, order }) {
  const panelRef = useRef(null)
  const closeRef = useRef(null)
  const restoreFocusRef = useRef(null)
  const { items, total, step, clear } = order

  useScrollLock(open)

  useEffect(() => {
    if (!open) return

    restoreFocusRef.current = document.activeElement
    // Wait a frame so the panel is painted before focus moves into it.
    const raf = requestAnimationFrame(() => closeRef.current?.focus())

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const focusables = panelRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusables?.length) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKeyDown)
      restoreFocusRef.current?.focus?.()
    }
  }, [open, onClose])

  return (
    // `inert` is what actually removes this subtree from the tab order. Setting
    // aria-hidden alone would leave the close button, the steppers and the
    // WhatsApp link focusable while the sheet is invisible, so a keyboard user
    // could tab into a panel they cannot see.
    <div
      className={`fixed inset-0 z-[60] ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={!open}
      inert={!open}
    >
      {/* Scrim. Decorative — Escape and the close button are the real controls. */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-ink/25 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-sheet-title"
        className={`absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col overflow-hidden rounded-t-5xl bg-surface shadow-float transition-transform duration-300 ease-out md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[26rem] md:rounded-none md:rounded-l-5xl ${
          open ? 'translate-y-0' : 'translate-y-full md:translate-y-0 md:translate-x-full'
        }`}
      >
        {/* Drag affordance, mobile only. */}
        <span aria-hidden="true" className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-primary-200 md:hidden" />

        <div className="flex shrink-0 items-center justify-between gap-4 px-6 pb-4 pt-5">
          <h2 id="order-sheet-title" className="flex items-center gap-2.5 text-xl font-extrabold">
            <ShoppingBag size={20} className="text-primary-600" aria-hidden="true" />
            {business.order.title}
            {items.length ? (
              <span className="grid h-7 min-w-7 place-items-center rounded-full bg-primary-600 px-2 text-xs font-bold text-white">
                {items.length}
              </span>
            ) : null}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="press grid h-11 w-11 place-items-center rounded-full bg-primary-50 text-ink hover:bg-primary-100"
          >
            <X size={20} aria-hidden="true" />
            <span className="sr-only">Close order summary</span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center rounded-4xl bg-surface-quiet px-6 py-12 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-primary-100 text-primary-600">
                <ShoppingBag size={26} aria-hidden="true" />
              </span>
              <p className="mt-5 font-display text-lg font-extrabold text-ink">{business.order.emptyTitle}</p>
              <p className="mt-2 text-[0.9375rem] text-ink-body">{business.order.emptyBody}</p>
              <button
                type="button"
                onClick={onClose}
                className="press mt-6 inline-flex items-center gap-2 rounded-full bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700"
              >
                Browse services
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-3 pb-2">
              {items.map(({ service, qty }) => {
                const label = unitLabel(service.unit)
                const noun = unitNoun(service.unit, true)
                return (
                  <li
                    key={service.id}
                    className={`rounded-3xl border p-4 ${
                      service.accent ? 'border-accent-200 bg-accent-50' : 'border-primary-100 bg-surface-quiet'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-display text-[1.0625rem] font-bold text-ink">{service.name}</p>
                        <p className="mt-1 text-sm text-ink-muted">
                          {service.unit ? `${formatKES(service.price, business.currency)} / ${noun}` : formatKES(service.price, business.currency)}
                        </p>
                      </div>
                      <p className="shrink-0 font-display text-lg font-extrabold tabular-nums text-primary-700">
                        {formatKES(service.price * qty, business.currency)}
                      </p>
                    </div>

                    <div className="mt-3.5 flex items-center justify-between gap-3">
                      {service.unit ? (
                        <div className="flex items-center gap-1 rounded-full border border-primary-100 bg-surface p-1">
                          <button
                            type="button"
                            onClick={() => step(service.id, -1)}
                            className="press grid h-9 w-9 place-items-center rounded-full bg-surface-quiet text-ink hover:bg-primary-50"
                          >
                            <Minus size={16} aria-hidden="true" />
                            <span className="sr-only">
                              Remove one {unitNoun(service.unit, true)} of {service.name}
                            </span>
                          </button>
                          <span className="min-w-12 text-center text-sm font-bold tabular-nums text-ink">
                            {qty} {label.plural}
                          </span>
                          <button
                            type="button"
                            onClick={() => step(service.id, 1)}
                            className="press grid h-9 w-9 place-items-center rounded-full bg-primary-600 text-white hover:bg-primary-700"
                          >
                            <Plus size={16} aria-hidden="true" />
                            <span className="sr-only">Add one {unitNoun(service.unit, true)} of {service.name}</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-ink-muted">Flat price</span>
                      )}

                      <button
                        type="button"
                        onClick={() => step(service.id, -qty)}
                        className="press inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-ink-muted hover:bg-surface hover:text-accent-700"
                      >
                        <Trash2 size={15} aria-hidden="true" />
                        <span className="sr-only">{business.order.removeLabel} {service.name}</span>
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="shrink-0 border-t border-primary-100 bg-surface-quiet px-6 py-5">
          {items.length > 0 ? (
            <>
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-[0.9375rem] font-medium text-ink-body">{business.order.estimatedLabel}</span>
                <span
                  aria-live="polite"
                  className="font-display text-2xl font-extrabold tabular-nums text-ink"
                >
                  {formatKES(total, business.currency)}
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{business.order.estimateNote}</p>

              <a
                href={orderWhatsAppLink(items)}
                target="_blank"
                rel="noopener noreferrer"
                className="press mt-4 inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-whatsapp px-6 py-4 text-base font-semibold text-white shadow-lift hover:bg-whatsapp-hover"
              >
                <WhatsAppIcon size={20} />
                {business.order.cta}
              </a>

              <button
                type="button"
                onClick={clear}
                className="press mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-ink-muted hover:bg-primary-50 hover:text-ink"
              >
                <Trash2 size={15} aria-hidden="true" />
                {business.order.clear}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/**
 * Sticky mobile order bar.
 *
 * Without this the only way to reach the basket on a phone is the small button
 * near the section heading, which is easy to scroll past. It appears only once
 * something is in the basket and hides itself when the sheet is open so the two
 * never overlap. Lifted above the safe-area inset for iOS.
 */
export function OrderBar({ count, total, onOpen, sheetOpen }) {
  if (!count || sheetOpen) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:hidden">
      <div className="pointer-events-auto mx-auto max-w-md">
        <button
          type="button"
          onClick={onOpen}
          className="press flex w-full items-center justify-between gap-4 rounded-full bg-primary-600 py-3.5 pl-6 pr-4 text-left shadow-float hover:bg-primary-700"
        >
          <span className="flex items-center gap-2.5">
            <span className="grid h-8 min-w-8 place-items-center rounded-full bg-white/20 px-2 text-sm font-bold text-white">
              {count}
            </span>
            <span className="font-display text-[0.9375rem] font-bold text-white">{business.order.title}</span>
          </span>
          <span className="flex items-center gap-3">
            <span className="font-display text-[0.9375rem] font-extrabold tabular-nums text-white">
              {formatKES(total, business.currency)}
            </span>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-primary-700">
              <ShoppingBag size={18} aria-hidden="true" />
            </span>
          </span>
        </button>
      </div>
    </div>
  )
}