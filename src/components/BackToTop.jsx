import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { trackFeature } from '../lib/analytics.js'

/**
 * Back-to-top button, gated on the shop's `back_to_top` feature toggle.
 *
 * Two details that are easy to get wrong and were both got wrong elsewhere:
 *
 * 1. The scroll listener is registered unconditionally, before the early return.
 *    Returning early above a hook makes the hook count depend on the toggle, and
 *    React does not allow that. On a shop that turns the feature off and then on
 *    again across two page loads, a conditional hook throws rather than toggles.
 *
 * 2. It stacks above the WhatsApp float when both are on. Both are fixed to the
 *    bottom-right corner, so without this the smaller one is simply covered.
 *    `chatEnabled` is passed in rather than read here, so this component has no
 *    opinion about where feature state comes from.
 *
 * `prefers-reduced-motion` is handled by scrolling instantly instead of smoothly:
 * the smooth behaviour is the part that actually causes discomfort, so the
 * reduced-motion path changes the scroll rather than just the transition.
 */
export function BackToTop({ enabled = false, chatEnabled = true }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!enabled) return null

  return (
    <button
      type="button"
      onClick={() => {
        const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
        // A feature the owner cannot see anyone clicking is a feature they will
        // eventually switch off. No-op unless the tracking toggle is on.
        trackFeature('back_to_top')
      }}
      aria-label="Back to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`press fixed right-4 z-40 grid h-12 w-12 place-items-center rounded-full border border-primary-100 bg-surface text-ink shadow-lift hover:bg-primary-50 md:right-6 ${
        // Mobile stacks three things bottom-right: the order bar, the WhatsApp
        // float, and this. Desktop drops the order bar, so the stack is only
        // two deep and this can sit lower - where it covers less page content.
        chatEnabled ? 'bottom-[10.5rem] md:bottom-24' : 'bottom-[5.5rem] md:bottom-6'
      } transition-opacity duration-300 ${visible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
    >
      <ArrowUp size={20} aria-hidden="true" />
    </button>
  )
}
