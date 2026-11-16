import React, { forwardRef } from 'react'
import { NEWMAN, NEWMAN_HALF, newmanRendered, type Seg } from './hydrocarbon-geometry'
import { NewmanGlyph, drawSegment } from './conformation-glyphs'

/** Size of a Newman projection, for a parent viewBox centred on the drawing. */
export const NEWMAN_SIZE = { width: NEWMAN_HALF * 2, height: NEWMAN_HALF * 2 } as const

export interface NewmanProjectionProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** Dihedral angle in degrees: 0 eclipsed, 60 staggered. Tweens smoothly. */
  dihedral?: number
  /** Labels at the three front bond ends (the near carbon). */
  front?: readonly [string, string, string]
  /** Labels at the three back bond ends (the far carbon). */
  back?: readonly [string, string, string]
  x?: number
  y?: number
}

/**
 * Newman projection looking down a C–C bond. The front carbon is the centre point with three
 * bonds; the back carbon is the circle, with its three bonds leaving the rim. Bonds are cut back
 * so that no bond comes within the label clearance of any label, at any dihedral.
 */
export const NewmanProjection = forwardRef<SVGGElement, NewmanProjectionProps>(function NewmanProjection(
  { dihedral = 0, front = ['H', 'H', 'H'], back = ['H', 'H', 'H'], x = 0, y = 0, ...rest },
  ref
) {
  const r = newmanRendered(dihedral)
  const labelsFront = r.labels.slice(0, 3)
  const labelsBack = r.labels.slice(3)
  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
      <circle r={NEWMAN.rim} fill="none" stroke="var(--fg-subtle)" strokeWidth={2} />
      {r.back.map((s: Seg, i) => drawSegment(s, `bb-${i}`, 'var(--h-back)', 3))}
      {labelsBack.map((p, i) => (
        <NewmanGlyph key={`bl-${i}`} x={p.x} y={p.y} fill="var(--fg-muted)">
          {back[i]}
        </NewmanGlyph>
      ))}
      {r.front.map((s: Seg, i) => drawSegment(s, `fb-${i}`, 'var(--h-front)', 3.4))}
      {labelsFront.map((p, i) => (
        <NewmanGlyph key={`fl-${i}`} x={p.x} y={p.y} fill="var(--fg)">
          {front[i]}
        </NewmanGlyph>
      ))}
      <circle r={4} fill="var(--fg)" />
    </g>
  )
})
