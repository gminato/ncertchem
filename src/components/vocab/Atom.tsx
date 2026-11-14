import React, { forwardRef } from 'react'
import { atomColor, atomRadius } from './atom'

export interface AtomProps extends Omit<React.SVGAttributes<SVGGElement>, 'style'> {
  /** Element symbol, e.g. "H", "O", "Cl". Unknown symbols use the neutral colour. */
  element: string
  x?: number
  y?: number
  /** Sphere radius in SVG units. Defaults to the element's size. */
  r?: number
  defsPrefix?: string
}

/**
 * One atom as a shaded sphere: the element colour, a top-left highlight and a
 * darker rim from the shared sphere shading. Needs `VocabDefs` in the same SVG.
 */
export const Atom = forwardRef<SVGGElement, AtomProps>(function Atom(
  { element, x = 0, y = 0, r, defsPrefix = 'vocab', className, ...rest },
  ref
) {
  const radius = r ?? atomRadius(element)

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} {...rest}>
      <circle cx={0} cy={0} r={radius} fill={atomColor(element)} />
      <circle
        cx={0}
        cy={0}
        r={radius}
        fill={`url(#${defsPrefix}-sphere-shading)`}
        style={{ pointerEvents: 'none' }}
      />
      <circle
        cx={0}
        cy={0}
        r={radius - 0.4}
        fill="none"
        stroke="var(--atom-rim)"
        strokeWidth={0.8}
        style={{ pointerEvents: 'none' }}
      />
    </g>
  )
})
