import React, { forwardRef, useId } from 'react'
import { Thermometer } from '../vocab/Thermometer'
import { thermometerLevel } from './geometry'

/** Drawing size and origin of a calorimeter, in SVG units. The origin is the centre. */
export const CALORIMETER_SIZE = { width: 260, height: 250 } as const

export interface CalorimeterProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /**
   * `bomb`: a steel bomb in a water bath, with ignition wires and a stirrer.
   * `coffee-cup`: nested insulated cups with a lid, a thermometer and a stirrer.
   */
  variant?: 'bomb' | 'coffee-cup'
  /** Temperature rise in K. Moves the thermometer reading. */
  tempRise?: number
  /** The temperature rise that fills the thermometer scale, in K. */
  scaleMax?: number
  /** Warm glow from the reaction, for example at ignition. */
  glow?: boolean
  x?: number
  y?: number
}

const TICKS = [0.25, 0.5, 0.75] as const

/** The bomb: a steel bomb in a water bath, with ignition wires and a stirrer. */
function BombCalorimeter({ glow, level, glowId }: { glow: boolean; level: number; glowId: string }) {
  return (
    <g>
      {/* Insulated jacket */}
      <rect x={-110} y={-120} width={220} height={230} rx={14} style={{ fill: 'var(--surface-raised)', stroke: 'var(--glass-wall)' }} strokeWidth={1.8} />

      {/* Water bath */}
      <rect x={-96} y={-70} width={192} height={160} rx={8} style={{ fill: 'var(--liquid)' }} />
      <line x1={-96} y1={-70} x2={96} y2={-70} strokeWidth={1.6} style={{ stroke: 'var(--liquid-edge)' }} />

      {/* Glow from the reaction inside the bomb */}
      {glow && <circle cx={0} cy={5} r={64} fill={`url(#${glowId})`} />}

      {/* Steel bomb and its lid */}
      <rect x={-34} y={-40} width={68} height={112} rx={10} style={{ fill: 'var(--neutron)', stroke: 'var(--fg-muted)' }} strokeWidth={1.6} />
      <rect x={-40} y={-52} width={80} height={14} rx={4} style={{ fill: 'var(--fg-subtle)' }} />

      {/* Ignition wires running out of the lid to a short fuse */}
      <path d="M -8 -52 L -8 -92 Q 0 -100 8 -92 L 8 -52" fill="none" strokeWidth={1.4} style={{ stroke: 'var(--fg-muted)' }} />
      <line x1={-8} y1={-92} x2={-18} y2={-108} strokeWidth={1.4} style={{ stroke: 'var(--fg-muted)' }} />
      <line x1={8} y1={-92} x2={18} y2={-108} strokeWidth={1.4} style={{ stroke: 'var(--fg-muted)' }} />

      {/* Stirrer: a rod with a ring at the bottom of the bath */}
      <line x1={-74} y1={-74} x2={-74} y2={74} strokeWidth={2} strokeLinecap="round" style={{ stroke: 'var(--fg-muted)' }} />
      <ellipse cx={-74} cy={80} rx={9} ry={5} fill="none" strokeWidth={1.6} style={{ stroke: 'var(--fg-muted)' }} />

      {/* Thermometer dipping into the water */}
      <Thermometer
        x={72}
        y={48}
        level={level}
        height={116}
        bulbRadius={10}
        stemWidth={8}
        ticks={TICKS}
      />
    </g>
  )
}

/** The coffee-cup calorimeter: two nested cups, a lid, a thermometer and a stirrer. */
function CoffeeCupCalorimeter({ glow, level, glowId }: { glow: boolean; level: number; glowId: string }) {
  // Water surface and the inner cup's half-width at a given y (the cup narrows towards the top).
  const surfaceY = -22
  const innerHalfAt = (yy: number) => 54 + ((80 - yy) * 18) / 172
  const hwSurface = innerHalfAt(surfaceY)

  return (
    <g>
      {/* Outer cup: the insulating cup that holds the inner cup */}
      <path
        d="M -92 -98 L -74 92 L 74 92 L 92 -98 Z"
        style={{ fill: 'var(--surface-raised)', stroke: 'var(--glass-wall)' }}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />

      {/* Inner cup, filled with the solution */}
      <path
        d="M -72 -92 L -54 80 L 54 80 L 72 -92 Z"
        style={{ fill: 'var(--glass-fill)', stroke: 'var(--glass-wall)' }}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <path
        d={`M ${-hwSurface} ${surfaceY} L ${hwSurface} ${surfaceY} L 54 80 L -54 80 Z`}
        style={{ fill: 'var(--liquid)' }}
      />
      <line x1={-hwSurface} y1={surfaceY} x2={hwSurface} y2={surfaceY} strokeWidth={1.6} style={{ stroke: 'var(--liquid-edge)' }} />

      {/* Glow from the reaction in the solution */}
      {glow && <ellipse cx={0} cy={18} rx={58} ry={36} fill={`url(#${glowId})`} />}

      {/* Lid */}
      <rect x={-96} y={-106} width={192} height={10} rx={3} style={{ fill: 'var(--surface)', stroke: 'var(--glass-wall)' }} strokeWidth={1.4} />

      {/* Stirrer: a rod through the lid with a ring in the water */}
      <line x1={36} y1={-122} x2={36} y2={58} strokeWidth={2} strokeLinecap="round" style={{ stroke: 'var(--fg-muted)' }} />
      <ellipse cx={36} cy={64} rx={11} ry={5} fill="none" strokeWidth={1.6} style={{ stroke: 'var(--fg-muted)' }} />

      {/* Thermometer through the lid */}
      <Thermometer x={-34} y={42} level={level} height={150} bulbRadius={10} stemWidth={8} ticks={TICKS} />
    </g>
  )
}

/**
 * A calorimeter for measuring heat at constant volume (bomb) or constant pressure
 * (coffee cup). The thermometer reads `tempRise` on a scale of `scaleMax` K.
 * There is no text; labels belong to the caller.
 */
export const Calorimeter = forwardRef<SVGGElement, CalorimeterProps>(function Calorimeter(
  { variant = 'bomb', tempRise = 0, scaleMax = 10, glow = false, x = 0, y = 0, className, ...rest },
  ref
) {
  const glowId = `calorimeter-glow-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const level = thermometerLevel(tempRise, scaleMax)
  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} {...rest}>
      <defs>
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--heat)" stopOpacity={0.75} />
          <stop offset="60%" stopColor="var(--heat)" stopOpacity={0.25} />
          <stop offset="100%" stopColor="var(--heat)" stopOpacity={0} />
        </radialGradient>
      </defs>
      {variant === 'bomb' ? (
        <BombCalorimeter glow={glow} level={level} glowId={glowId} />
      ) : (
        <CoffeeCupCalorimeter glow={glow} level={level} glowId={glowId} />
      )}
    </g>
  )
})
