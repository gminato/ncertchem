'use client'

import React from 'react'
import {
  SAWHORSE_BOND,
  newmanLayout,
  sawhorseLayout,
  sawhorseViewBox,
  NEWMAN_UNITS,
  type Glyph,
} from './conformation-layout'

const FONT = 'var(--font-sans)'

/** An H or C label with a surface halo, so a bond behind it never reads as part of the letter. */
function Label({ g, fill, size = 18 }: { g: Glyph; fill: string; size?: number }) {
  return (
    <text
      x={g.x}
      y={g.y}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={size}
      fontWeight={600}
      fontFamily={FONT}
      fill={fill}
      stroke="var(--surface)"
      strokeWidth={5}
      strokeLinejoin="round"
      paintOrder="stroke"
    >
      {g.text}
    </text>
  )
}

/**
 * Newman projection of ethane, looking down the C–C bond: the front carbon is the dot with three front bonds, and
 * the rear carbon is the circle with three bonds from its rim. Drawn in units of the Newman layout (rim radius 70),
 * so the circle is 140 units across. Labels and bonds are cut so no label touches a bond or another label.
 */
export function NewmanDrawing({ dihedral, front, back }: { dihedral: number; front?: readonly [string, string, string]; back?: readonly [string, string, string] }) {
  const layout = newmanLayout(dihedral, front, back)
  return (
    <g>
      <circle r={NEWMAN_UNITS.rim} fill="none" stroke="var(--fg-subtle)" strokeWidth={2} />
      {layout.bonds.map((b, i) => (
        <line
          key={`b-${i}`}
          x1={b.seg.a.x}
          y1={b.seg.a.y}
          x2={b.seg.b.x}
          y2={b.seg.b.y}
          stroke={b.kind === 'front' ? 'var(--h-front)' : 'var(--h-back)'}
          strokeWidth={b.kind === 'front' ? 3.4 : 3}
          strokeLinecap="round"
        />
      ))}
      {layout.labels.map((g, i) => (
        <Label key={`l-${i}`} g={g} fill={i < 3 ? 'var(--fg)' : 'var(--fg-muted)'} />
      ))}
      <circle r={4} fill="var(--fg)" />
    </g>
  )
}

/** The sawhorse's viewBox at its bond length, and the offset that centres it on a point. */
export const SAWHORSE_VIEW = sawhorseViewBox(SAWHORSE_BOND)

/**
 * Sawhorse projection of ethane: the C–C bond as a slanted line, the front carbon at the bottom and the back carbon
 * at the top, with three bonds on each. The C labels sit beside their carbons at the clearest spot.
 */
export function SawhorseDrawing({ dihedral }: { dihedral: number }) {
  const layout = sawhorseLayout(dihedral, SAWHORSE_BOND)
  return (
    <g>
      {layout.bonds.map((b, i) => (
        <line
          key={`s-${i}`}
          x1={b.seg.a.x}
          y1={b.seg.a.y}
          x2={b.seg.b.x}
          y2={b.seg.b.y}
          stroke={b.kind === 'axis' ? 'var(--sigma-bond)' : b.kind === 'front' ? 'var(--h-front)' : 'var(--h-back)'}
          strokeWidth={b.kind === 'axis' ? 4.4 : b.kind === 'front' ? 3.4 : 3}
          strokeLinecap="round"
        />
      ))}
      {layout.labels.slice(0, 6).map((g, i) => (
        <Label key={`h-${i}`} g={g} fill={i < 3 ? 'var(--fg)' : 'var(--fg-muted)'} />
      ))}
      {layout.labels.slice(6).map((g, i) => (
        <Label key={`c-${i}`} g={g} fill="var(--fg)" size={20} />
      ))}
    </g>
  )
}

/** The transform that centres the sawhorse's viewBox on (x, y) at a scale. */
export function sawhorseTransform(x: number, y: number, scale: number): string {
  const cx = SAWHORSE_VIEW.x + SAWHORSE_VIEW.width / 2
  const cy = SAWHORSE_VIEW.y + SAWHORSE_VIEW.height / 2
  return `translate(${x} ${y}) scale(${scale}) translate(${-cx} ${-cy})`
}

