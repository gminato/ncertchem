import React, { forwardRef } from 'react'

export interface ThermometerProps extends React.SVGAttributes<SVGGElement> {
  /** Liquid column height from 0 (bulb only) to 1 (top of the stem). Clamped. */
  level?: number
  /** Stem length in SVG units, from the top of the stem to the bulb's centre. */
  height?: number
  /** Radius of the bulb in SVG units. */
  bulbRadius?: number
  /** Width of the stem in SVG units. */
  stemWidth?: number
  /** Graduation marks along the right of the stem, as fractions of the height. */
  ticks?: readonly number[]
  /** Bulb centre in the parent's coordinates (the stem rises upwards from it). */
  x?: number
  y?: number
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/**
 * A liquid-in-glass thermometer: a bulb at the bottom, a stem rising from it,
 * and a liquid column whose top is set by `level`. It has no text; labels
 * belong to the caller. The bulb's centre sits at (x, y).
 */
export const Thermometer = forwardRef<SVGGElement, ThermometerProps>(function Thermometer(
  {
    level = 0.5,
    height = 300,
    bulbRadius = 22,
    stemWidth = 14,
    ticks = [],
    x = 0,
    y = 0,
    className,
    ...rest
  },
  ref
) {
  const fill = clamp01(level)
  const half = stemWidth / 2
  const stemTop = -height
  const columnTop = -fill * height
  const tickInset = 6

  return (
    <g
      ref={ref}
      transform={`translate(${x}, ${y})`}
      className={className}
      {...rest}
    >
      {/* Glass: stem and bulb */}
      <rect
        x={-half}
        y={stemTop}
        width={stemWidth}
        height={height}
        rx={half}
        fill="var(--glass-fill)"
        stroke="var(--glass-wall)"
        strokeWidth={1.8}
      />
      <circle r={bulbRadius} fill="var(--glass-fill)" stroke="var(--glass-wall)" strokeWidth={1.8} />

      {/* Liquid: the bulb is always full; the column rises with `level` */}
      {fill > 0 && (
        <rect x={-half + 3} y={columnTop} width={stemWidth - 6} height={fill * height} fill="var(--electron)" />
      )}
      <circle r={bulbRadius - 4} fill="var(--electron)" />

      {ticks.map((t) => {
        const ty = -clamp01(t) * height
        return (
          <line
            key={t}
            x1={half + 1}
            x2={half + 1 + tickInset}
            y1={ty}
            y2={ty}
            stroke="var(--glass-wall)"
            strokeWidth={1.2}
          />
        )
      })}

      {/* Glass highlight on the left of the stem */}
      <line
        x1={-half + 3.5}
        x2={-half + 3.5}
        y1={stemTop + height * 0.08}
        y2={-height * 0.12}
        stroke="var(--glass-sheen)"
        strokeWidth={2}
        strokeLinecap="round"
        style={{ pointerEvents: 'none' }}
      />
    </g>
  )
})
