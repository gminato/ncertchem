import React, { forwardRef } from 'react'
import { condensedWidth } from './condensed'
import { arrowHeadPoints, curvedArrowGeometry } from './arrows'
import { deltaText } from './delta'

export interface InductiveNode {
  /** Text on the node, e.g. "Cl", "CH₂". */
  label: string
  /** Partial-charge label under the node, e.g. "δδ+". Empty for none. */
  charge?: string
  /** Opacity of the charge label: 1 next to the group, fading with distance. */
  chargeOpacity?: number
}

export interface InductiveChainProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** Atoms in order from the group that withdraws or releases electrons. */
  nodes: readonly InductiveNode[]
  /** Pixels between node centres. */
  spacing?: number
  /** Direction of the sigma-bond arrows: `towards` the first node (-I) or `away` from it (+I). */
  direction?: 'towards' | 'away'
  x?: number
  y?: number
}

const FONT = 22
const ARROW_Y = -30

/**
 * A chain of sigma bonds with arrows along each bond showing the inductive pull of the group
 * at the start (-I: electrons drawn towards it). Charge labels fade with distance.
 */
export const InductiveChain = forwardRef<SVGGElement, InductiveChainProps>(function InductiveChain(
  { nodes, spacing = 96, direction = 'towards', x = 0, y = 0, ...rest },
  ref
) {
  const widths = nodes.map((n) => condensedWidth(n.label) * FONT)
  const total = (nodes.length - 1) * spacing
  const xs = nodes.map((_, i) => -total / 2 + i * spacing)
  const half = (i: number) => widths[i] / 2 + 6

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
      {nodes.slice(0, -1).map((_, i) => {
        const xa = xs[i] + half(i)
        const xb = xs[i + 1] - half(i + 1)
        return (
          <line key={`bond-${i}`} x1={xa} y1={0} x2={xb} y2={0} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />
        )
      })}
      {nodes.slice(0, -1).map((_, i) => {
        const xa = xs[i] + half(i)
        const xb = xs[i + 1] - half(i + 1)
        // The arrow runs above the bond, from the pulled-away end towards the withdrawing group.
        const from = direction === 'towards' ? { x: xb - 4, y: ARROW_Y } : { x: xa + 4, y: ARROW_Y }
        const to = direction === 'towards' ? { x: xa + 4, y: ARROW_Y } : { x: xb - 4, y: ARROW_Y }
        const geo = curvedArrowGeometry(from, to, { bend: 0, gap: 0, headSize: 10 })
        return (
          <g key={`arrow-${i}`}>
            <line x1={geo.start.x} y1={geo.start.y} x2={geo.shaftEnd.x} y2={geo.shaftEnd.y} stroke="var(--e-arrow)" strokeWidth={2.2} strokeLinecap="round" />
            <polygon points={arrowHeadPoints(geo)} fill="var(--e-arrow)" />
          </g>
        )
      })}
      {nodes.map((n, i) => (
        <g key={`node-${i}`}>
          <text
            x={xs[i]}
            y={0}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={FONT}
            fontWeight={600}
            fontFamily="var(--font-sans)"
            fill={n.label.startsWith('Cl') || n.label.startsWith('Br') || n.label.startsWith('F') ? 'var(--atom-hal)' : 'var(--fg)'}
            style={{ userSelect: 'none' }}
          >
            {n.label}
          </text>
          {n.charge && (
            <text
              x={xs[i]}
              y={FONT * 1.7}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={16}
              fontWeight={600}
              fontFamily="var(--font-sans)"
              fill="var(--delta-plus)"
              opacity={n.chargeOpacity ?? 1}
            >
              {deltaText(n.charge)}
            </text>
          )}
        </g>
      ))}
    </g>
  )
})
