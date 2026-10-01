import { useEffect } from 'react'

/**
 * Freezes background scroll while an overlay is open, without the page
 * shifting sideways when the scrollbar disappears.
 *
 * The padding compensation matters more than it looks: without it the whole
 * layout jumps right by the scrollbar width the moment the drawer opens, which
 * is very visible on a desktop hero.
 */
export function useScrollLock(locked) {
  useEffect(() => {
    if (!locked) return

    const { body } = document
    const previousOverflow = body.style.overflow
    const previousPadding = body.style.paddingRight
    const scrollbar = window.innerWidth - document.documentElement.clientWidth

    body.style.overflow = 'hidden'
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`

    return () => {
      body.style.overflow = previousOverflow
      body.style.paddingRight = previousPadding
    }
  }, [locked])
}