import React, { forwardRef } from 'react'
import { condensedWidth } from './condensed'
import { deltaText } from './delta'

export interface InductiveNode {
  /** Text on the node, e.g. "Cl", "CH₂". */
  label: string
  /** Partial-charge label under the node, e.g. "δ+". Empty for none. */
  charge?: string
  /** Opacity of the charge label, fading with distance from the group. */
  chargeOpacity?: number
}

export interface InductiveChainProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** Atoms in order from the group that withdraws electrons. */
  nodes: readonly InductiveNode[]
  /** Pixels between node centres. */
  spacing?: number
  x?: number
  y?: number
}

const FONT = 24

/**
 * A chain of sigma bonds. Each bond carries an arrowhead on it, pointing towards the group at the
 * start (the -I pull). Charge labels sit under the carbons and fade with distance.
 */
export const InductiveChain = forwardRef<SVGGElement, InductiveChainProps>(function InductiveChain(
  { nodes, spacing = 96, x = 0, y = 0, ...rest },
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
        // Arrow on the bond itself, from the far carbon towards the nearer atom (the head sits on the bond).
        const tip = xa
        const tail = xb
        return (
          <g key={`bond-${i}`}>
            <line x1={xa} y1={0} x2={xb} y2={0} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />
            <line x1={tail} y1={0} x2={tip + 9} y2={0} stroke="var(--e-arrow)" strokeWidth={3} strokeLinecap="round" />
            <polygon points={`${tip},0 ${tip + 11},-6 ${tip + 11},6`} fill="var(--e-arrow)" />
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
            fill={/^(Cl|Br|F|I)/.test(n.label) ? 'var(--atom-hal)' : 'var(--fg)'}
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
              fontSize={18}
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
