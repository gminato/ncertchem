'use client'

import { along, stereoPath } from '@/components/organic'

export interface WedgeLabelledProps {
  /** Labels of the four bonds of a tetrahedral carbon: two in the plane, one wedge, one dash. */
  left: string
  right: string
  /** Bond drawn as a solid wedge: towards the viewer. */
  wedge: string
  /** Bond drawn as a dashed wedge: away from the viewer. */
  dash: string
  x: number
  y: number
}

const ARM = 104
const START = 24
const HALF = 13

/**
 * A tetrahedral carbon in wedge-and-dash form with the labels of its four bonds. The drawing is
 * the page convention of Section 8.3: the wedge comes towards the reader, the dash goes away.
 */
export function WedgeLabelled({ left, right, wedge, dash, x, y }: WedgeLabelledProps) {
  const arms = [
    { key: 'left', dx: -1, dy: 0, kind: 'plain' as const, label: left },
    { key: 'right', dx: 1, dy: 0, kind: 'plain' as const, label: right },
    { key: 'up', dx: 0, dy: -1, kind: 'wedge' as const, label: wedge },
    { key: 'down', dx: 0, dy: 1, kind: 'dash' as const, label: dash },
  ]
  const C = { x: 0, y: 0 }
  return (
    <g transform={`translate(${x}, ${y})`} data-testid="wedge-labelled">
      {arms.map((arm) => {
        const start = { x: C.x + arm.dx * START, y: C.y + arm.dy * START }
        const end = { x: C.x + arm.dx * ARM, y: C.y + arm.dy * ARM }
        const labelAt = { x: C.x + arm.dx * (ARM + 22), y: C.y + arm.dy * (ARM + 22) }
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
      <text x={18} y={-(ARM + 22)} dominantBaseline="central" fontSize={15} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
        towards you
      </text>
      <text x={18} y={ARM + 22} dominantBaseline="central" fontSize={15} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
        away from you
      </text>
    </g>
  )
}
