import React, { forwardRef, useId } from 'react'
import { bandY, collectedFraction } from './geometry'
import { Caption, Dot } from './primitives'

/** Drawing size in SVG units. Parents use it as the viewBox. */
export const CHROMATOGRAPHY_COLUMN_SIZE = { width: 340, height: 344 } as const

export interface ColumnBand {
  id: string
  /** Spot colour of the component, a CSS colour. */
  color: string
  /**
   * Progress at which this component reaches the bottom of the column. A strongly adsorbed
   * component has a larger value (it moves slowly), a weakly adsorbed one a smaller value.
   */
  arrival: number
}

export interface ChromatographyColumnProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** Components of the mixture, up to three. Each one is a band that travels down at its own speed. */
  bands: readonly ColumnBand[]
  /** 0 to 1. Elution progress, with eluent dripping in from the top throughout. */
  progress?: number
  /** Eluent colour in the reservoir and the drops. */
  eluent?: string
  title?: string
  x?: number
  y?: number
}

const COLUMN = { x0: 140, x1: 200, top: 56, bottom: 250 }
const BAND_H = 14

/**
 * A chromatography column packed with adsorbent. Bands of the mixture move down at speeds set
 * by how strongly each component is adsorbed, and the fractions are collected in tubes below.
 */
export const ChromatographyColumn = forwardRef<SVGGElement, ChromatographyColumnProps>(function ChromatographyColumn(
  { bands, progress = 0, eluent = 'var(--liquid-edge)', title, x = 0, y = 0, className, ...rest },
  ref
) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const grain = `cc-grain-${uid}`
  const p = Math.min(1, Math.max(0, progress))
  const shown = bands.slice(0, 3)
  const tubeX = (i: number) => 170 + (i - (shown.length - 1) / 2) * 46

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} role="img" aria-label={title ?? 'Chromatography column with bands moving down'} {...rest}>
      <defs>
        <pattern id={grain} width={6} height={6} patternUnits="userSpaceOnUse">
          <circle cx={2} cy={2} r={1} fill="var(--fg-subtle)" opacity={0.45} />
          <circle cx={5} cy={4.5} r={0.8} fill="var(--fg-subtle)" opacity={0.35} />
        </pattern>
      </defs>

      {/* Eluent reservoir with drops falling into the column */}
      <path d="M112,12 H228 L200,46 H140 Z" fill="var(--glass-fill)" stroke="var(--glass)" strokeWidth={2} strokeLinejoin="round" />
      <path d="M124,20 H216 L200,40 H140 Z" fill={eluent} opacity={0.45} />
      <Caption x={236} y={22} anchor="start">
        eluent
      </Caption>
      {p > 0 &&
        [0, 1].map((i) => {
          const t = (p * 3 + i / 2) % 1
          return <Dot key={`el-${i}`} x={170} y={52 + t * (COLUMN.top - 52)} r={2.4} fill={eluent} />
        })}

      {/* Column with packed adsorbent */}
      <rect x={COLUMN.x0} y={COLUMN.top} width={COLUMN.x1 - COLUMN.x0} height={COLUMN.bottom - COLUMN.top} rx={4} fill="var(--glass-fill)" />
      <rect x={COLUMN.x0 + 4} y={COLUMN.top + 4} width={COLUMN.x1 - COLUMN.x0 - 8} height={COLUMN.bottom - COLUMN.top - 8} fill="var(--precipitate)" opacity={0.4} />
      <rect x={COLUMN.x0 + 4} y={COLUMN.top + 4} width={COLUMN.x1 - COLUMN.x0 - 8} height={COLUMN.bottom - COLUMN.top - 8} fill={`url(#${grain})`} />
      <rect x={COLUMN.x0} y={COLUMN.top} width={COLUMN.x1 - COLUMN.x0} height={COLUMN.bottom - COLUMN.top} rx={4} fill="none" stroke="var(--glass)" strokeWidth={2} />
      <Caption x={236} y={150} anchor="start">
        adsorbent
      </Caption>

      {/* Bands of the mixture, each at its own speed */}
      {shown.map((band) => {
        // A band that has reached the bottom has been eluted into its tube, so it leaves the column.
        if (p >= band.arrival) return null
        const cy = bandY(COLUMN.top + 10, COLUMN.bottom - 12, band.arrival, p)
        return (
          <g key={band.id}>
            <title>{band.id}</title>
            <rect x={COLUMN.x0 + 4} y={cy - BAND_H / 2} width={COLUMN.x1 - COLUMN.x0 - 8} height={BAND_H} rx={4} fill={band.color} opacity={0.9} />
            <Caption x={COLUMN.x0 - 10} y={cy} anchor="end" size={15} fill="var(--fg)">
              {band.id}
            </Caption>
            <line x1={COLUMN.x0 - 6} x2={COLUMN.x0 + 4} y1={cy} y2={cy} stroke="var(--fg-subtle)" strokeWidth={1} opacity={0.6} />
          </g>
        )
      })}

      {/* Stopcock and drip */}
      <rect x={COLUMN.x0 + 20} y={COLUMN.bottom} width={20} height={10} rx={3} fill="var(--surface-raised)" stroke="var(--glass)" strokeWidth={1.4} />
      <line x1={170} x2={170} y1={COLUMN.bottom + 10} y2={274} stroke="var(--glass)" strokeWidth={3} />

      {/* Fraction tubes, filled as each band arrives */}
      {shown.map((band, i) => {
        const cx = tubeX(i)
        const fill = collectedFraction(band.arrival, p)
        const top = 280
        const bottom = 320
        const liquidTop = bottom - fill * (bottom - top)
        return (
          <g key={`tube-${band.id}`}>
            <path d={`M${cx - 10},${top} V${bottom - 10} A10,10 0 0 0 ${cx + 10},${bottom - 10} V${top} Z`} fill="var(--glass-fill)" />
            {fill > 0 && <rect x={cx - 9} y={liquidTop} width={18} height={bottom - liquidTop} fill={band.color} opacity={0.85} />}
            <path d={`M${cx - 10},${top} V${bottom - 10} A10,10 0 0 0 ${cx + 10},${bottom - 10} V${top}`} fill="none" stroke="var(--glass)" strokeWidth={1.6} />
            <Caption x={cx} y={336} size={14}>
              {`F${i + 1}`}
            </Caption>
          </g>
        )
      })}
    </g>
  )
})
