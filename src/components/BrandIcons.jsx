import { useState } from 'react'

/**
 * Brand marks that lucide-react no longer ships, plus the site's own logo.
 *
 * Lucide v1 dropped the social/brand glyphs (Instagram, Facebook, WhatsApp) and
 * a few pictorial ones. They are trademarks rather than generic UI icons, so
 * drawing them here is the correct call anyway — an icon set should not be the
 * source of a brand's logo.
 *
 * All of them inherit `currentColor` and size from props, like any lucide icon.
 */

/**
 * The shop's own logo, with the built-in mark as the fallback.
 *
 * The image is a remote URL in Supabase storage, so it can 404 or be slow or be
 * blocked, and the header is the one place a broken image is most visible. A
 * failed load therefore swaps to the SVG rather than leaving a torn image or a
 * layout jump. `rounded-2xl` keeps it inside the site's no-sharp-corners rule.
 */
export function ShopLogo({ src, alt, className = 'h-11 w-11' }) {
  const [failed, setFailed] = useState(!src)

  if (failed) return <StackedFoldMark className={className} />

  return (
    <img
      src={src}
      alt={alt}
      width="44"
      height="44"
      decoding="async"
      onError={() => setFailed(true)}
      className={`${className} shrink-0 rounded-2xl border border-primary-100 bg-surface object-contain`}
    />
  )
}

/**
 * The default mark: a stack of three folded layers in the brand aqua. Specific
 * to a laundry rather than a generic circle-and-text logo.
 */
export function StackedFoldMark({ className = 'h-11 w-11' }) {
  return (
    <span
      aria-hidden="true"
      className={`grid ${className} shrink-0 place-items-center rounded-2xl bg-primary-600 shadow-soft transition-transform duration-300 group-hover:rotate-6`}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="12.5" width="16" height="4.5" rx="2.25" fill="#ecfaf8" />
        <rect x="5.5" y="8" width="13" height="4" rx="2" fill="#a5e5df" />
        <rect x="7" y="3.5" width="10" height="4" rx="2" fill="#fb6540" />
        <circle cx="18.5" cy="4.5" r="1.6" fill="#ffe5dc" />
        <circle cx="3.4" cy="7" r="1.1" fill="#ffe5dc" />
      </svg>
    </span>
  )
}

export function WhatsAppIcon({ size = 24, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 6.988 2.896 9.83 9.83 0 0 1 2.893 6.994c-.003 5.45-4.437 9.886-9.885 9.886m8.413-18.297A11.8 11.8 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.549 4.142 1.595 5.945L0 24l6.305-1.654a11.9 11.9 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413" />
    </svg>
  )
}

export function InstagramIcon({ size = 24, strokeWidth = 2, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5.5" ry="5.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Clothes hanger. Lucide's Shirt reads as a garment on a body; this reads as
 *  the thing you actually hang a finished order on, which suits the steps row. */
export function HangerIcon({ size = 24, strokeWidth = 2, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M12 8.4V6.6A2.6 2.6 0 1 1 14.6 4" />
      <path d="M12 8.4 3.5 14.9a1.1 1.1 0 0 0 .66 1.95h15.68a1.1 1.1 0 0 0 .66-1.95L12 8.4Z" />
    </svg>
  )
}