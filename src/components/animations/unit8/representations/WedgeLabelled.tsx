'use client'

import { along, stereoPath } from '@/components/organic'

export interface WedgeLabelledProps {
  /** Label of the in-plane bond that points down and to the left. */
  lowerLeft: string
  /** Label of the in-plane bond that points down and to the right. */
  lowerRight: string
  /** Label of the solid wedge (towards the reader), drawn up and to the left. */
  wedge: string
  /** Label of the dashed wedge (away from the reader), drawn up and to the right. */
  dash: string
  x: number
  y: number
}

/** Half-angle of the two V's: each bond sits 55 degrees from the vertical, so the bonds within a pair are 110 degrees apart. */
const COS55 = Math.cos((55 * Math.PI) / 180)
const SIN55 = Math.sin((55 * Math.PI) / 180)
const ARM = 104
const START = 24
const HALF = 13
const LABEL_OFFSET = 26

/**
 * A tetrahedral carbon in the textbook projection (NCERT Fig. 8.1): the two bonds in the plane form
 * a V of about 110 degrees, and the wedge and the dash point to the other side, also about 110
 * degrees apart. The wedge is towards the reader, the dash away from it.
 */
export function WedgeLabelled({ lowerLeft, lowerRight, wedge, dash, x, y }: WedgeLabelledProps) {
  const arms = [
    { key: 'lower-left', dx: -SIN55, dy: COS55, kind: 'plain' as const, label: lowerLeft },
    { key: 'lower-right', dx: SIN55, dy: COS55, kind: 'plain' as const, label: lowerRight },
    { key: 'wedge', dx: -SIN55, dy: -COS55, kind: 'wedge' as const, label: wedge },
    { key: 'dash', dx: SIN55, dy: -COS55, kind: 'dash' as const, label: dash },
  ]
  const C = { x: 0, y: 0 }
  const wedgeLabel = { x: -SIN55 * (ARM + LABEL_OFFSET), y: -COS55 * (ARM + LABEL_OFFSET) }
  const dashLabel = { x: SIN55 * (ARM + LABEL_OFFSET), y: -COS55 * (ARM + LABEL_OFFSET) }
  return (
    <g transform={`translate(${x}, ${y})`} data-testid="wedge-labelled">
      {arms.map((arm) => {
        const start = { x: C.x + arm.dx * START, y: C.y + arm.dy * START }
        const end = { x: C.x + arm.dx * ARM, y: C.y + arm.dy * ARM }
        const labelAt = { x: C.x + arm.dx * (ARM + LABEL_OFFSET), y: C.y + arm.dy * (ARM + LABEL_OFFSET) }
        const stop = along(start, end, 0.94)
        return (
          <g key={arm.key}>
            {arm.kind === 'plain' ? (
              <line x1={start.x} y1={start.y} x2={stop.x} y2={stop.y} stroke="var(--fg)" strokeWidth={3} strokeLinecap="round" />
            ) : (
              <path
                d={stereoPath(start, stop, arm.kind, HALF)}
                fill={arm.kind === 'wedge' ? 'var(--fg)' : 'none'}
                stroke="var(--fg)"
                strokeWidth={arm.kind === 'wedge' ? 0.8 : 2.4}
                strokeLinejoin="round"
              />
            )}
            <text
              x={labelAt.x}
              y={labelAt.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={26}
              fontWeight={600}
              fontFamily="var(--font-sans)"
              fill="var(--fg)"
              style={{ userSelect: 'none' }}
            >
              {arm.label}
            </text>
          </g>
        )
      })}
      <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontSize={26} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)" style={{ userSelect: 'none' }}>
        C
      </text>
      <text x={wedgeLabel.x} y={wedgeLabel.y - 24} textAnchor="middle" dominantBaseline="central" fontSize={15} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
        towards you
      </text>
      <text x={dashLabel.x} y={dashLabel.y - 24} textAnchor="middle" dominantBaseline="central" fontSize={15} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
        away from you
      </text>
    </g>
  )
}
