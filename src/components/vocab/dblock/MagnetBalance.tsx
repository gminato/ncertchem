import React, { forwardRef } from 'react'
import { TestTube } from '../../organic/lab/TestTube'
import { SERIES_TONE } from './tones'

/** How far (SVG units) a full pull of ±1 moves the sample. */
export const BALANCE_FULL_PULL = 40

/** Vertical displacement of the sample for a pull from −1 (pushed out) to +1 (pulled in). Clamped. Pure. */
export function balanceDisplacement(pull: number): number {
  const p = Math.max(-1, Math.min(1, Number.isFinite(pull) ? pull : 0))
  return p * BALANCE_FULL_PULL
}

export interface MagnetBalanceProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** −1 to +1. Positive: the sample is pulled into the field (paramagnetic). Negative: pushed out (diamagnetic). */
  pull: number
  x?: number
  y?: number
  /** Adds a note that the drawing is schematic, not to scale. */
  schematic?: boolean
}

const CX = 140
const TUBE_TOP = 64
const TUBE_SCALE = 0.72

/** A sample tube hanging from a balance arm between two magnet poles, shown displaced by its pull. */
export const MagnetBalance = forwardRef<SVGGElement, MagnetBalanceProps>(function MagnetBalance(
  { pull, x = 0, y = 0, schematic = false, ...rest },
  ref
) {
  const dy = balanceDisplacement(pull)
  const p = Math.max(-1, Math.min(1, Number.isFinite(pull) ? pull : 0))
  const restBottom = TUBE_TOP + 150 * TUBE_SCALE
  const tubeY = TUBE_TOP + dy
  const note = p > 0 ? 'Pulled into the field' : p < 0 ? 'Pushed out of the field' : 'No net pull'
  const armY = 28
  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} aria-hidden="true" data-magnet-pull={p} {...rest}>
      {/* balance arm and its support */}
      <line x1={CX - 96} x2={CX + 96} y1={armY} y2={armY} style={{ stroke: 'var(--fg)', strokeWidth: 3, strokeLinecap: 'round' }} />
      <path d={`M${CX - 12} ${armY + 40} L${CX} ${armY} L${CX + 12} ${armY + 40} Z`} style={{ fill: 'var(--fg-muted)' }} />
      <line x1={CX - 96} x2={CX - 96} y1={armY} y2={armY + 10} style={{ stroke: 'var(--fg-muted)', strokeWidth: 2 }} />
      <line x1={CX + 96} x2={CX + 96} y1={armY} y2={armY + 10} style={{ stroke: 'var(--fg-muted)', strokeWidth: 2 }} />
      {/* thread from the arm to the sample */}
      <line x1={CX} x2={CX} y1={armY} y2={tubeY} style={{ stroke: 'var(--fg-muted)', strokeWidth: 1.5, strokeDasharray: '2 3' }} />
      {/* rest line the sample is measured against */}
      <line x1={CX - 60} x2={CX + 60} y1={restBottom} y2={restBottom} style={{ stroke: 'var(--fg-subtle)', strokeWidth: 1, strokeDasharray: '3 4' }} />
      {/* magnet poles: N on the left, S on the right */}
      <rect x={CX - 118} y={92} width={44} height={128} rx={6} style={{ fill: 'var(--spec-red)' }} />
      <rect x={CX + 74} y={92} width={44} height={128} rx={6} style={{ fill: 'var(--spec-blue)' }} />
      <text x={CX - 96} y={160} textAnchor="middle" fontSize={18} style={{ fill: 'var(--surface)', fontFamily: 'var(--font-sans)', fontWeight: 700 }}>
        N
      </text>
      <text x={CX + 96} y={160} textAnchor="middle" fontSize={18} style={{ fill: 'var(--surface)', fontFamily: 'var(--font-sans)', fontWeight: 700 }}>
        S
      </text>
      {/* the sample: a tube of powder, displaced */}
      <g transform={`translate(${CX}, ${tubeY}) scale(${TUBE_SCALE})`}>
        <TestTube liquidLevel={0} precipitate={{ color: SERIES_TONE['3d'], amount: 0.8, outline: true }} progress={1} />
      </g>
      {/* arrow showing the displacement against the rest line */}
      {Math.abs(dy) >= 1 && (
        <g>
          <line
            x1={CX + 34}
            x2={CX + 34}
            y1={restBottom}
            y2={restBottom + dy}
            style={{ stroke: dy > 0 ? 'var(--spec-red)' : 'var(--spec-blue)', strokeWidth: 3, strokeLinecap: 'round' }}
          />
          <path
            d={
              dy > 0
                ? `M${CX + 29} ${restBottom + dy - 7} L${CX + 34} ${restBottom + dy} L${CX + 39} ${restBottom + dy - 7}`
                : `M${CX + 29} ${restBottom + dy + 7} L${CX + 34} ${restBottom + dy} L${CX + 39} ${restBottom + dy + 7}`
            }
            style={{ fill: 'none', stroke: dy > 0 ? 'var(--spec-red)' : 'var(--spec-blue)', strokeWidth: 3, strokeLinejoin: 'round' }}
          />
        </g>
      )}
      <text x={CX} y={236} textAnchor="middle" fontSize={16} style={{ fill: 'var(--fg)', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
        {note}
      </text>
      {schematic && (
        <text x={CX} y={260} textAnchor="middle" fontSize={14} style={{ fill: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }}>
          Schematic, not to scale
        </text>
      )}
    </g>
  )
})
