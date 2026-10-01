import { useEffect, useRef, useState } from 'react'

/**
 * Reveal-on-scroll, via IntersectionObserver.
 *
 * Returns a ref to attach and a boolean. Deliberately observer-based rather
 * than a scroll listener: the browser batches observer callbacks off the main
 * thread, and one observer per element is fine at this page's scale.
 *
 * Honours prefers-reduced-motion by reporting `true` immediately, so callers
 * render the final state rather than an element stuck at opacity 0.
 */
export function useReveal({ threshold = 0.15, rootMargin = '0px 0px -60px 0px' } = {}) {
  const ref = useRef(null)
  // Resolved once, at first render, rather than corrected inside the effect:
  // if motion is unwelcome or the browser has no IntersectionObserver, the
  // content is visible from the first paint and no observer is needed at all.
  // Setting state synchronously in an effect body causes a cascading re-render
  // and is exactly what React's compiler lint rule is there to catch.
  const [shown, setShown] = useState(() => prefersReducedMotion() || !canObserve())

  useEffect(() => {
    if (shown) return
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          observer.disconnect()
        }
      },
      { threshold, rootMargin },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [shown, threshold, rootMargin])

  return [ref, shown]
}

const canObserve = () => typeof IntersectionObserver !== 'undefined'

export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}