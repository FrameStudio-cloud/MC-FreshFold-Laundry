import { useReveal } from '../hooks/useReveal.js'

/**
 * Fades and lifts its children into view once. The animation itself lives in
 * index.css keyed off data-reveal, so a reduced-motion visitor gets the final
 * state from CSS alone even before JS runs.
 *
 * `as` lets it render a semantic element rather than a div — headings still
 * need to be headings for the outline to make sense.
 */
export function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const [ref, shown] = useReveal()

  return (
    <Tag
      ref={ref}
      data-reveal={shown ? 'shown' : 'hidden'}
      className={className}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  )
}