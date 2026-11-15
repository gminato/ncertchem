import React, { forwardRef, useId, useMemo } from 'react'
import { Thermometer } from '../vocab/Thermometer'
import {
  clamp01,
  pistonGasFraction,
  spacedScatter,
  temperatureLevel,
  type Point,
} from './geometry'

export interface PistonCylinderProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** Position of the piston from 0 (fully pushed in) to 1 (fully out). Clamped. */
  volume?: number
  /** External pressure in atm. Drawn as one stacked weight per atm, up to six. */
  externalPressure?: number
  /** Gas particles in the cylinder. Their density follows the volume. */
  particles?: number
  /** Gas temperature in K. Tints the gas from cold (teal) to hot (orange). */
  temperature?: number
  /** Draws a thermometer beside the cylinder that reads the same temperature. */
  showThermometer?: boolean
  /** Heat applied from below: a flame or a hot plate. */
  heatSource?: 'none' | 'flame' | 'hot-plate'
  /** Adiabatic jacket: a hatched insulating wall around the cylinder. */
  insulated?: boolean
  /** Inner width of the cylinder in SVG units. */
  width?: number
  /** Travel of the piston at full volume, in SVG units. */
  height?: number
  /** Seed for the particle positions. */
  seed?: number
  x?: number
  y?: number
  defsPrefix?: string
}

const WALL_T = 3
const PISTON_H = 10
const MAX_PLATES = 6
const PLATE_H = 7
const PARTICLE_R = 4

/** A nominal gas temperature range used for the tint and the thermometer. */
const T_MIN = 250
const T_MAX = 600

/**
 * A gas in a cylinder closed by a frictionless piston. The cylinder's bottom
 * centre is the origin, so the cylinder rises upwards (negative y). The piston
 * position, the weights, the particles and the tint are all driven by props, so
 * tweening `volume` moves the piston and the particles together.
 */
export const PistonCylinder = forwardRef<SVGGElement, PistonCylinderProps>(function PistonCylinder(
  {
    volume = 0.5,
    externalPressure = 0,
    particles = 14,
    temperature = 300,
    showThermometer = false,
    heatSource = 'none',
    insulated = false,
    width = 90,
    height = 170,
    seed = 5,
    x = 0,
    y = 0,
    className,
    ...rest
  },
  ref
) {
  const idBase = useId().replace(/[^a-zA-Z0-9]/g, '')
  const hatchId = `piston-hatch-${idBase}`
  const half = width / 2
  const travel = height - PISTON_H - 2
  const gasHeight = pistonGasFraction(volume) * travel
  const pistonBottom = -gasHeight
  const pistonTop = pistonBottom - PISTON_H
  const plates = Math.min(MAX_PLATES, Math.max(0, Math.round(externalPressure)))
  const tempLevel = temperatureLevel(temperature, T_MIN, T_MAX)
  const t = clamp01(tempLevel)

  // Unit-square positions are fixed per seed; they are mapped into the gas each render.
  const unit: Point[] = useMemo(
    () => (particles > 0 ? spacedScatter(particles, { x0: 0, y0: 0, x1: 1, y1: 1 }, seed, 0.17) : []),
    [particles, seed]
  )
  const gasX0 = -half + WALL_T + 7
  const gasX1 = half - WALL_T - 7
  const gasY0 = pistonBottom + 8
  const gasY1 = -8

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} {...rest}>
      {/* Insulating jacket, drawn behind the cylinder */}
      {insulated && (
        <g>
          <defs>
            <pattern id={hatchId} patternUnits="userSpaceOnUse" width={5} height={5} patternTransform="rotate(45)">
              <line x1={0} y1={0} x2={0} y2={5} style={{ stroke: 'var(--glass-wall)' }} strokeWidth={1} />
            </pattern>
          </defs>
          <rect
            x={-half - 9}
            y={-height - 9}
            width={width + 18}
            height={height + 9}
            rx={6}
            fill={`url(#${hatchId})`}
            style={{ stroke: 'var(--fg-muted)' }}
            strokeWidth={1.4}
          />
        </g>
      )}

      {/* Heat from below */}
      {heatSource === 'flame' && (
        <g>
          {[-18, 0, 18].map((dx, i) => {
            const tip = i === 1 ? 28 : 22
            return (
              <path
                key={`flame-${i}`}
                d={`M ${dx - 6} 4 C ${dx - 11} 14 ${dx} 16 ${dx} ${tip} C ${dx} 16 ${dx + 11} 14 ${dx + 6} 4 Z`}
                style={{ fill: 'var(--heat)' }}
                opacity={0.5 + 0.2 * (i === 1 ? 1 : 0)}
              />
            )
          })}
        </g>
      )}
      {heatSource === 'hot-plate' && (
        <g>
          <rect x={-half - 12} y={6} width={width + 24} height={8} rx={3} style={{ fill: 'var(--neutron)' }} />
          <line x1={-half - 6} y1={4} x2={half + 6} y2={4} strokeWidth={2} strokeLinecap="round" style={{ stroke: 'var(--heat)' }} />
        </g>
      )}

      {/* Cylinder glass: open at the top */}
      <rect
        x={-half}
        y={-height}
        width={width}
        height={height}
        rx={4}
        style={{ fill: 'var(--glass-fill)' }}
      />

      {/* Gas: a tint that runs from cold (teal) to hot (orange) */}
      <rect
        x={gasX0 - 7}
        y={pistonBottom}
        width={gasX1 - gasX0 + 14}
        height={gasHeight}
        style={{ fill: 'var(--work)' }}
        opacity={(1 - t) * 0.22}
      />
      <rect
        x={gasX0 - 7}
        y={pistonBottom}
        width={gasX1 - gasX0 + 14}
        height={gasHeight}
        style={{ fill: 'var(--heat)' }}
        opacity={t * 0.26}
      />

      {/* Gas particles, mapped into the current gas column */}
      {unit.map((u, i) => (
        <circle
          key={`gp-${i}`}
          cx={gasX0 + u.x * (gasX1 - gasX0)}
          cy={gasY0 + u.y * (gasY1 - gasY0)}
          r={PARTICLE_R}
          style={{ fill: 'var(--el-other)', stroke: 'var(--surface)' }}
          strokeWidth={1}
        />
      ))}

      {/* Weights on the piston */}
      {Array.from({ length: plates }, (_, k) => (
        <rect
          key={`plate-${k}`}
          x={-half + WALL_T + 4}
          y={pistonTop - (k + 1) * (PLATE_H + 2)}
          width={width - 2 * (WALL_T + 4)}
          height={PLATE_H}
          rx={2}
          style={{ fill: 'var(--surface-raised)', stroke: 'var(--fg-subtle)' }}
          strokeWidth={1}
        />
      ))}

      {/* Piston */}
      <rect
        x={-half + WALL_T}
        y={pistonTop}
        width={width - 2 * WALL_T}
        height={PISTON_H}
        rx={2}
        style={{ fill: 'var(--neutron)', stroke: 'var(--fg-subtle)' }}
        strokeWidth={1}
      />

      {/* Glass wall, drawn last so it sits over the gas and the piston edges */}
      <rect
        x={-half}
        y={-height}
        width={width}
        height={height}
        rx={4}
        fill="none"
        style={{ stroke: 'var(--glass-wall)' }}
        strokeWidth={1.8}
      />

      {showThermometer && (
        <Thermometer x={half + 34} y={-10} level={tempLevel} height={height - 26} bulbRadius={11} stemWidth={9} />
      )}
    </g>
  )
})
