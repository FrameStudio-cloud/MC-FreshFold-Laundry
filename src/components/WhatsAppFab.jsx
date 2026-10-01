import { business } from '../data/business.js'
import { whatsappLink } from '../utils/whatsapp.js'
import { WhatsAppIcon } from './BrandIcons.jsx'

/**
 * Floating WhatsApp button.
 *
 * Sits above the mobile order bar rather than on top of it — on a phone the two
 * are both bottom-right, and overlapping them would hide whichever is smaller.
 * z-index puts the FAB above, and the bar's bottom padding keeps it clear.
 *
 * The pulse is a single expanding ring (CSS, aria-hidden). It stops under
 * prefers-reduced-motion and never covers the icon for long enough to be a
 * tap target problem.
 *
 * `enabled` comes from the shop's own feature_toggles. The comparison is
 * `!== false` rather than `=== true` on purpose: a shop that has never opened the
 * Keel website tab has no toggle stored at all, and defaulting that to "hidden"
 * would mean the button disappears for everyone who has not visited the settings
 * page. Opt-out, not opt-in.
 *
 * The number comes from business.whatsapp, which useShopSettings overlays from
 * the API, so the owner changes it in Keel rather than in code. whatsappLink()
 * returns null when no number parses, and a link to a wrong number is worse than
 * no button, so the whole thing hides in that case.
 */
export function WhatsAppFab({ enabled = true }) {
  const href = enabled ? whatsappLink() : null
  if (!href) return null

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={business.order.fabLabel}
      className="press fab-pulse fixed bottom-[5.5rem] right-4 z-50 grid h-14 w-14 place-items-center rounded-full bg-whatsapp text-white shadow-float hover:bg-whatsapp-hover md:bottom-6 md:right-6 md:h-16 md:w-16"
    >
      <span className="sr-only">{business.order.fabLabel}</span>
      <WhatsAppIcon size={28} className="relative" />
    </a>
  )
}
