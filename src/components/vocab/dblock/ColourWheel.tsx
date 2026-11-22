import React, { forwardRef, useId } from 'react'
import { SPECTRAL_KEYS, SPECTRAL_TOKEN, type SpectralKey } from './tones'

export interface ColourWheelProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** Centre of the wheel, in the parent's coordinates. */
  cx?: number
  cy?: number
  radius?: number
  /** The sector of light the solution absorbs. */
  absorbed?: SpectralKey
  /** The sector the eye sees: the complementary colour, which is opposite on the wheel. */
  seen?: SpectralKey
}

/** Centre angle of sector i in SVG degrees: red at upper right, going clockwise. Opposite sectors (i and i + 3) are complementary. */
export function sectorAngle(index: number): number {
  return -60 + 60 * index
}

/** The complementary sector of a key: the one opposite it on the wheel. */
export function oppositeSector(key: SpectralKey): SpectralKey {
  const i = SPECTRAL_KEYS.indexOf(key)
  return SPECTRAL_KEYS[(i + 3) % 6]
}

const rad = (deg: number) => (deg * Math.PI) / 180

/** Six-sector colour wheel with an arrow from the absorbed light across the centre to the colour seen. */
export const ColourWheel = forwardRef<SVGGElement, ColourWheelProps>(function ColourWheel(
  { cx = 0, cy = 0, radius = 96, absorbed, seen, ...rest },
  ref
) {
  const markerId = `cw-arrow-${useId().replace(/:/g, '')}`
  const labelR = radius + 22

  return (
    <g ref={ref} transform={`translate(${cx}, ${cy})`} aria-hidden="true" {...rest}>
      <defs>
        <marker id={markerId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 Z" style={{ fill: 'var(--fg)' }} />
        </marker>
      </defs>
      {SPECTRAL_KEYS.map((key, i) => {
        const a0 = rad(-90 + 60 * i)
        const a1 = rad(-90 + 60 * (i + 1))
        const x0 = radius * Math.cos(a0)
        const y0 = radius * Math.sin(a0)
        const x1 = radius * Math.cos(a1)
        const y1 = radius * Math.sin(a1)
        const d = `M0 0 L${x0.toFixed(2)} ${y0.toFixed(2)} A${radius} ${radius} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`
        return (
          <path
            key={key}
            d={d}
            data-sector={key}
            style={{ fill: SPECTRAL_TOKEN[key], fillOpacity: absorbed === key ? 0.45 : 0.9, stroke: 'var(--surface)', strokeWidth: 2 }}
          />
        )
      })}
      {SPECTRAL_KEYS.map((key, i) => {
        const ang = sectorAngle(i)
        const c = Math.cos(rad(ang))
        const s = Math.sin(rad(ang))
        const tag = absorbed === key ? ' absorbed' : seen === key ? ' seen' : ''
        const anchor = Math.abs(c) < 0.2 ? 'middle' : c > 0 ? 'start' : 'end'
        return (
          <text
            key={`lab-${key}`}
            x={labelR * c}
            y={labelR * s + (s > 0.5 ? 16 : s < -0.5 ? -4 : 5)}
            textAnchor={anchor}
            fontSize={14}
            style={{ fill: absorbed === key || seen === key ? 'var(--fg)' : 'var(--fg-muted)', fontWeight: tag ? 600 : 400, fontFamily: 'var(--font-sans)' }}
          >
            {key}
            {tag}
          </text>
        )
      })}
      {absorbed && seen && (
        <line
          x1={0.62 * radius * Math.cos(rad(sectorAngle(SPECTRAL_KEYS.indexOf(absorbed))))}
          y1={0.62 * radius * Math.sin(rad(sectorAngle(SPECTRAL_KEYS.indexOf(absorbed))))}
          x2={0.62 * radius * Math.cos(rad(sectorAngle(SPECTRAL_KEYS.indexOf(seen))))}
          y2={0.62 * radius * Math.sin(rad(sectorAngle(SPECTRAL_KEYS.indexOf(seen))))}
          markerEnd={`url(#${markerId})`}
          style={{ stroke: 'var(--fg)', strokeWidth: 2.4, strokeLinecap: 'round' }}
          data-testid="wheel-arrow"
        />
      )}
    </g>
  )
})
