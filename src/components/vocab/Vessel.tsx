import React, { forwardRef, useId } from 'react'

export type VesselVariant = 'beaker' | 'flask' | 'cylinder'

export interface VesselProps extends Omit<React.SVGAttributes<SVGGElement>, 'style'> {
  variant?: VesselVariant
  /** Liquid level from 0 (empty) to 1 (full). Values outside the range are clamped. */
  level?: number
  /** Draws the liquid fill in `--liquid`. */
  liquid?: boolean
  /** Adds graduation marks along the right-hand wall. */
  graduated?: boolean
  /** Outer width in SVG units. */
  width?: number
  /** Outer height in SVG units. */
  height?: number
  x?: number
  y?: number
  scale?: number
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/**
 * Outline of a vessel centred on (0,0). `closed` adds the top edge, which the
 * glass fill and the liquid clip need. The open version is only the walls.
 */
function outlinePath(variant: VesselVariant, w: number, h: number, closed: boolean): string {
  const top = -h / 2
  const bottom = h / 2
  const left = -w / 2
  const right = w / 2
  const corner = Math.min(10, w / 6)

  if (variant === 'flask') {
    // Erlenmeyer: a narrow neck on a wide conical body.
    const neck = w * 0.3
    const shoulder = top + h * 0.5
    const d = [
      `M ${-neck / 2} ${top}`,
      `L ${-neck / 2} ${shoulder}`,
      `L ${left} ${bottom - corner}`,
      `Q ${left} ${bottom} ${left + corner} ${bottom}`,
      `L ${right - corner} ${bottom}`,
      `Q ${right} ${bottom} ${right} ${bottom - corner}`,
      `L ${neck / 2} ${shoulder}`,
      `L ${neck / 2} ${top}`,
    ]
    return closed ? `${d.join(' ')} Z` : d.join(' ')
  }

  if (variant === 'beaker') {
    // Straight walls with a lip at each top corner for pouring.
    const lip = Math.max(3, w * 0.05)
    const d = [
      `M ${left - lip} ${top}`,
      `L ${left} ${top + lip}`,
      `L ${left} ${bottom - corner}`,
      `Q ${left} ${bottom} ${left + corner} ${bottom}`,
      `L ${right - corner} ${bottom}`,
      `Q ${right} ${bottom} ${right} ${bottom - corner}`,
      `L ${right} ${top + lip}`,
      `L ${right + lip} ${top}`,
    ]
    return closed ? `${d.join(' ')} Z` : d.join(' ')
  }

  // Cylinder: a plain tube with a rounded base.
  const d = [
    `M ${left} ${top}`,
    `L ${left} ${bottom - corner}`,
    `Q ${left} ${bottom} ${left + corner} ${bottom}`,
    `L ${right - corner} ${bottom}`,
    `Q ${right} ${bottom} ${right} ${bottom - corner}`,
    `L ${right} ${top}`,
  ]
  return closed ? `${d.join(' ')} Z` : d.join(' ')
}

/**
 * A beaker, flask or cylinder: a glass outline with an optional liquid fill and
 * graduation marks. It has no text; labels belong to the caller.
 */
export const Vessel = forwardRef<SVGGElement, VesselProps>(function Vessel(
  {
    variant = 'beaker',
    level = 0.5,
    liquid = true,
    graduated = false,
    width = 100,
    height = 120,
    x = 0,
    y = 0,
    scale = 1,
    className,
    ...rest
  },
  ref
) {
  const clipId = `vessel-clip-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const fill = clamp01(level)
  const top = -height / 2
  const bottom = height / 2
  const left = -width / 2
  const right = width / 2
  const surfaceY = bottom - fill * height

  const closed = outlinePath(variant, width, height, true)
  const open = outlinePath(variant, width, height, false)

  // Tick marks sit at quarters of the height, drawn inward from the right wall.
  const ticks = graduated ? [0.2, 0.4, 0.6, 0.8] : []

  return (
    <g
      ref={ref}
      transform={`translate(${x}, ${y})${scale !== 1 ? ` scale(${scale})` : ''}`}
      className={className}
      {...rest}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={closed} />
        </clipPath>
      </defs>

      {/* Glass body */}
      <path d={closed} fill="var(--glass-fill)" />

      {liquid && fill > 0 && (
        <g clipPath={`url(#${clipId})`}>
          <rect
            x={left - 12}
            y={surfaceY}
            width={width + 24}
            height={bottom - surfaceY + 12}
            fill="var(--liquid)"
          />
          <line
            x1={left - 12}
            x2={right + 12}
            y1={surfaceY}
            y2={surfaceY}
            stroke="var(--liquid-edge)"
            strokeWidth={1.6}
          />
        </g>
      )}

      {ticks.map((t) => {
        const ty = bottom - t * height
        return (
          <line
            key={t}
            x1={right - 9}
            x2={right}
            y1={ty}
            y2={ty}
            stroke="var(--glass-wall)"
            strokeWidth={1.2}
          />
        )
      })}

      {/* Glass wall */}
      <path
        d={open}
        fill="none"
        stroke="var(--glass-wall)"
        strokeWidth={1.8}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Vertical highlight on the left wall */}
      <line
        x1={left + width * 0.12}
        x2={left + width * 0.12}
        y1={top + height * 0.16}
        y2={bottom - height * 0.2}
        stroke="var(--glass-sheen)"
        strokeWidth={2.6}
        strokeLinecap="round"
        style={{ pointerEvents: 'none' }}
      />
    </g>
  )
})
