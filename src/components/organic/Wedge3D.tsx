import React, { forwardRef } from 'react'
import { along, stereoPath } from './frame'

/** Drawing size in SVG units. Parents use it as the viewBox. */
export const WEDGE_SIZE = { width: 320, height: 300 } as const

const ARM = 96
const HALF = 13

interface Arm {
  id: string
  dx: number
  dy: number
  kind: 'plain' | 'wedge' | 'dash'
  label: string
}

/** Tetrahedral carbon in wedge-dash form: two bonds in the plane, one wedge (towards you), one dash (away). */
const ARMS: readonly Arm[] = [
  { id: 'left', dx: -1, dy: 0, kind: 'plain', label: 'H' },
  { id: 'right', dx: 1, dy: 0, kind: 'plain', label: 'H' },
  { id: 'up', dx: 0, dy: -1, kind: 'wedge', label: 'H' },
  { id: 'down', dx: 0, dy: 1, kind: 'dash', label: 'H' },
]

export interface Wedge3DProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** Show the words "towards you" and "away from you" beside the wedge and the dash. */
  captions?: boolean
  x?: number
  y?: number
}

/** A tetrahedral carbon in wedge-dash form. The same molecule in 3D is Molecule3D (see the vocab page). */
export const Wedge3D = forwardRef<SVGGElement, Wedge3DProps>(function Wedge3D(
  { captions = true, x = 0, y = 0, ...rest },
  ref
) {
  const C = { x: 0, y: 0 }
  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
      {ARMS.map((arm) => {
        const end = { x: C.x + arm.dx * ARM, y: C.y + arm.dy * ARM }
        const labelAt = { x: C.x + arm.dx * (ARM + 16), y: C.y + arm.dy * (ARM + 16) }
        const start = { x: C.x + arm.dx * 16, y: C.y + arm.dy * 16 }
        const stop = along(start, end, 0.9)
        return (
          <g key={arm.id}>
            {arm.kind === 'plain' ? (
              <line x1={start.x} y1={start.y} x2={stop.x} y2={stop.y} stroke="var(--fg)" strokeWidth={2.6} strokeLinecap="round" />
            ) : (
              <path
                d={stereoPath(start, stop, arm.kind, HALF)}
                fill={arm.kind === 'wedge' ? 'var(--fg)' : 'none'}
                stroke="var(--fg)"
                strokeWidth={arm.kind === 'wedge' ? 0.8 : 2}
                strokeLinejoin="round"
              />
            )}
            <text
              x={labelAt.x}
              y={labelAt.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={22}
              fontWeight={600}
              fontFamily="var(--font-sans)"
              fill="var(--fg)"
            >
              {arm.label}
            </text>
          </g>
        )
      })}
      <text
        x={C.x}
        y={C.y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={24}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill="var(--fg)"
        style={{ userSelect: 'none' }}
      >
        C
      </text>
      {captions && (
        <g fontFamily="var(--font-sans)" fontSize={14} fill="var(--fg-muted)">
          <text x={-150} y={-136} textAnchor="start">Wedge: towards you</text>
          <text x={-150} y={140} textAnchor="start">Dash: away from you</text>
        </g>
      )}
    </g>
  )
})
