import React, { forwardRef } from 'react'
import { NEWMAN, NEWMAN_HALF, newmanGeometry } from './hydrocarbon-geometry'

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

/** A label with a surface-coloured halo, so it reads cleanly where a bond passes behind it. */
function Glyph({ x, y, children, fill, size = 18 }: { x: number; y: number; children: string; fill: string; size?: number }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={size}
      fontWeight={600}
      fontFamily="var(--font-sans)"
      fill={fill}
      stroke="var(--surface)"
      strokeWidth={5}
      strokeLinejoin="round"
      paintOrder="stroke"
    >
      {children}
    </text>
  )
}

/**
 * Newman projection looking down a C–C bond. The front carbon is the centre point with three
 * bonds; the back carbon is the circle, with its three bonds leaving the rim. The back bonds
 * are drawn lighter and nudged at eclipse so they stay visible.
 */
export const NewmanProjection = forwardRef<SVGGElement, NewmanProjectionProps>(function NewmanProjection(
  { dihedral = 0, front = ['H', 'H', 'H'], back = ['H', 'H', 'H'], x = 0, y = 0, ...rest },
  ref
) {
  const geo = newmanGeometry(dihedral)
  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
      <circle r={NEWMAN.rim} fill="none" stroke="var(--fg-subtle)" strokeWidth={2} />
      {geo.back.map((b, i) => (
        <line key={`bb-${i}`} x1={b.from.x} y1={b.from.y} x2={b.to.x} y2={b.to.y} stroke="var(--h-back)" strokeWidth={3} strokeLinecap="round" />
      ))}
      {geo.back.map((b, i) => (
        <Glyph key={`bl-${i}`} x={b.label.x} y={b.label.y} fill="var(--fg-muted)">
          {back[i]}
        </Glyph>
      ))}
      {geo.front.map((b, i) => (
        <line key={`fb-${i}`} x1={b.from.x} y1={b.from.y} x2={b.to.x} y2={b.to.y} stroke="var(--h-front)" strokeWidth={3.4} strokeLinecap="round" />
      ))}
      {geo.front.map((b, i) => (
        <Glyph key={`fl-${i}`} x={b.label.x} y={b.label.y} fill="var(--fg)">
          {front[i]}
        </Glyph>
      ))}
      <circle r={4} fill="var(--fg)" />
    </g>
  )
})
