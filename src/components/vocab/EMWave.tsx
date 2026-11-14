import React, { forwardRef, useMemo } from 'react'

export interface EMWaveProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** Where the propagation axis starts, in SVG units. */
  x?: number
  y?: number
  /** Length of the drawn wave along the propagation axis. */
  length?: number
  /** Distance between two crests along the axis, in SVG units. */
  wavelength?: number
  /** Peak height of the electric field. The magnetic field peaks at the same size. */
  amplitude?: number
  /** Starting phase in radians. */
  phase?: number
  /** Draw the arrow that shows the direction of travel. Defaults to true. */
  showAxis?: boolean
}

/** Depth direction of the magnetic field in the oblique, pseudo-3D projection. */
const DEPTH_DX = -0.46
const DEPTH_DY = 0.4
const SAMPLES_PER_UNIT = 1 / 2.5

export interface EMWavePaths {
  electric: string
  magnetic: string
  axis: { x1: number; x2: number; y: number }
}

/**
 * Builds the two field paths and the axis for an EM wave. The electric field
 * (E) swings up and down. The magnetic field (B) is perpendicular to it, and is
 * drawn along the oblique depth direction, so it reads as a 3D vector. Both
 * fields are in phase. The output is deterministic.
 */
export function emWavePaths({
  x = 0,
  y = 0,
  length = 360,
  wavelength = 120,
  amplitude = 40,
  phase = 0,
}: Pick<EMWaveProps, 'x' | 'y' | 'length' | 'wavelength' | 'amplitude' | 'phase'>): EMWavePaths {
  const k = (2 * Math.PI) / wavelength
  const count = Math.max(48, Math.round(length * SAMPLES_PER_UNIT))
  const electric: string[] = []
  const magnetic: string[] = []

  for (let i = 0; i <= count; i++) {
    const s = (i / count) * length
    const wave = Math.sin(k * s + phase)
    const cmd = i === 0 ? 'M' : 'L'
    const ex = x + s
    const ey = y - amplitude * wave
    electric.push(`${cmd}${ex.toFixed(2)},${ey.toFixed(2)}`)

    const depth = amplitude * wave
    const bx = x + s + DEPTH_DX * depth
    const by = y + DEPTH_DY * depth
    magnetic.push(`${cmd}${bx.toFixed(2)},${by.toFixed(2)}`)
  }

  return {
    electric: electric.join(' '),
    magnetic: magnetic.join(' '),
    axis: { x1: x, x2: x + length + 14, y },
  }
}

/**
 * An electromagnetic wave: an electric field (E, in --accent) and a magnetic
 * field (B, in --field-b) that are perpendicular to each other and to the
 * direction of travel. The axis arrow shows that direction.
 */
export const EMWave = forwardRef<SVGGElement, EMWaveProps>(function EMWave(
  {
    x = 0,
    y = 0,
    length = 360,
    wavelength = 120,
    amplitude = 40,
    phase = 0,
    showAxis = true,
    className,
    style,
    ...rest
  },
  ref
) {
  const paths = useMemo(
    () => emWavePaths({ x, y, length, wavelength, amplitude, phase }),
    [x, y, length, wavelength, amplitude, phase]
  )
  const { axis } = paths

  return (
    <g ref={ref} className={className} style={style} {...rest}>
      {showAxis && (
        <g data-testid="em-axis">
          <line
            x1={axis.x1}
            x2={axis.x2 - 8}
            y1={axis.y}
            y2={axis.y}
            strokeWidth={1.4}
            strokeLinecap="round"
            style={{ stroke: 'var(--fg-subtle)' }}
          />
          <path
            d={`M${axis.x2 - 12},${axis.y - 5} L${axis.x2},${axis.y} L${axis.x2 - 12},${axis.y + 5}`}
            fill="none"
            strokeWidth={1.4}
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{ stroke: 'var(--fg-subtle)' }}
          />
        </g>
      )}

      <path
        d={paths.magnetic}
        fill="none"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        data-field="B"
        style={{ stroke: 'var(--field-b)' }}
      />
      <path
        d={paths.electric}
        fill="none"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        data-field="E"
        style={{ stroke: 'var(--accent)' }}
      />
    </g>
  )
})
