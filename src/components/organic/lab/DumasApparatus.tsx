import React, { forwardRef } from 'react'
import { Burner, Caption, FlameRow, GlassTube } from './primitives'

/** Drawing size in SVG units. Parents use it as the viewBox. */
export const DUMAS_APPARATUS_SIZE = { width: 360, height: 292 } as const

const NITRO = { x0: 277, x1: 307, top: 40, bottom: 226 }
const ROUTE = 'M56,150 V118 H200 H232 V26 H292 V40'

export interface DumasApparatusProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** 0 to 1. Fraction of the graduated tube that nitrogen fills. Gas collects from the top, displacing KOH. */
  volume?: number
  /** Gauge text for the collected volume, e.g. "18.2 mL". */
  volumeLabel?: React.ReactNode
  /** 0 to 1. How far CO₂ has moved along the delivery tube. */
  progress?: number
  /** Draws the burner under the combustion tube. */
  heating?: boolean
  title?: string
  x?: number
  y?: number
}

/**
 * Dumas' method for nitrogen. CO₂ from a generator sweeps the sample over hot CuO, and the
 * nitrogen collects in a nitrometer over KOH solution. The volume read off the tube gives the
 * percentage of nitrogen.
 */
export const DumasApparatus = forwardRef<SVGGElement, DumasApparatusProps>(function DumasApparatus(
  { volume = 0.5, volumeLabel = '18.2 mL', progress = 0, heating = true, title, x = 0, y = 0, className, ...rest },
  ref
) {
  const v = Math.min(1, Math.max(0, volume))
  const p = Math.min(1, Math.max(0, progress))
  const gasBottom = NITRO.top + v * (NITRO.bottom - NITRO.top)
  const ticks = Array.from({ length: 10 }, (_, i) => NITRO.top + 16 + i * 18)

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} role="img" aria-label={title ?? 'Dumas apparatus for nitrogen'} {...rest}>
      {/* CO₂ generator: marble and acid in a flask */}
      <path d="M46,186 V150 H66 V186 A34,34 0 1 1 46,186 Z" fill="var(--glass-fill)" stroke="var(--glass)" strokeWidth={2} />
      <circle cx={56} cy={214} r={5} fill="var(--fg-subtle)" opacity={0.6} />
      <circle cx={48} cy={226} r={4} fill="var(--fg-subtle)" opacity={0.6} />
      <circle cx={64} cy={224} r={4.5} fill="var(--fg-subtle)" opacity={0.6} />
      <Caption x={56} y={266} size={14}>
        CO₂ generator
      </Caption>

      {/* Delivery tube, combustion tube with CuO, and the route of the gas */}
      <GlassTube d="M56,150 V118 H200" width={8} />
      <GlassTube d="M200,118 H232 V26 H292 V40" width={8} />
      <path d={ROUTE} fill="none" stroke="var(--coolant)" strokeWidth={3} pathLength={1} strokeDasharray={`${p} 1`} strokeLinecap="round" opacity={0.8} />

      {heating && (
        <g>
          <Burner x={136} y={138} width={48} height={8} />
          <FlameRow cx={160} y={172} width={36} count={3} />
        </g>
      )}
      <rect x={150} y={112} width={34} height={12} fill="var(--fg-subtle)" opacity={0.55} />
      <Caption x={166} y={96} size={14}>
        CuO
      </Caption>

      {/* Nitrometer: graduated tube inverted over KOH solution */}
      <rect x={NITRO.x0} y={NITRO.top} width={NITRO.x1 - NITRO.x0} height={NITRO.bottom - NITRO.top} rx={4} fill="var(--glass-fill)" stroke="var(--glass)" strokeWidth={1.8} />
      <rect x={NITRO.x0 + 1} y={NITRO.top + 1} width={NITRO.x1 - NITRO.x0 - 2} height={Math.max(0, gasBottom - NITRO.top - 1)} rx={3} fill="var(--vapour)" opacity={0.85} />
      <rect x={NITRO.x0 + 1} y={gasBottom} width={NITRO.x1 - NITRO.x0 - 2} height={Math.max(0, NITRO.bottom - gasBottom - 1)} fill="var(--liquid)" opacity={0.6} />
      {ticks.map((ty) => (
        <line key={ty} x1={NITRO.x1 - 8} x2={NITRO.x1} y1={ty} y2={ty} stroke="var(--glass)" strokeWidth={1.1} />
      ))}

      {/* KOH trough the nitrometer stands in */}
      <rect x={250} y={NITRO.bottom} width={90} height={14} rx={3} fill="var(--liquid)" stroke="var(--liquid-edge)" strokeWidth={1.2} />
      <Caption x={295} y={250} size={14}>
        KOH solution
      </Caption>
      <Caption x={292} y={276} size={15} fill="var(--fg)">
        {volumeLabel}
      </Caption>
      <Caption x={322} y={50} anchor="start" size={15} fill="var(--fg)">
        N₂
      </Caption>
    </g>
  )
})
