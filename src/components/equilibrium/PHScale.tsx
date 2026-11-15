import React, { forwardRef, useId } from 'react'
import { resolveBadgePositions } from '../redox/geometry'
import { formatSci, ionConcentrations, phGradientStops, powerOfTen } from './geometry'

/** Drawing size in SVG units. Parents use it as the viewBox. */
export const PH_SCALE_SIZE = { width: 640, height: 214 } as const

const BAR = { x0: 40, x1: 600, top: 66, bottom: 88 }

export interface PHMarker {
  /** pH of the substance. */
  ph: number
  /** Short name with its typical pH, e.g. "Lemon juice". */
  label: string
}

export interface PHScaleProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** The pH to point at, 0 to 14. */
  pH: number
  /** Common substances placed along the scale. */
  markers?: readonly PHMarker[]
  title?: string
  x?: number
  y?: number
}

const xOfPh = (ph: number) => BAR.x0 + (Math.min(14, Math.max(0, ph)) / 14) * (BAR.x1 - BAR.x0)

/** [H⁺] on a log axis that spans 10⁰ (x0) to 10⁻¹⁴ (x1). It is the same geometry as pH. */
const xOfExponent = (e: number) => BAR.x0 + (-e / 14) * (BAR.x1 - BAR.x0)

/**
 * A 0 to 14 pH scale on the universal-indicator gradient, with a pointer, common substances
 * as markers, and a second log axis that reads [H⁺] from 10⁰ down to 10⁻¹⁴.
 */
export const PHScale = forwardRef<SVGGElement, PHScaleProps>(function PHScale(
  { pH, markers = [], title, x = 0, y = 0, className, ...rest },
  ref
) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const gradId = `ph-grad-${uid}`
  const p = Math.min(14, Math.max(0, pH))
  const { hPlus, oh } = ionConcentrations(p)
  const px = xOfPh(p)

  // Markers: resolved along x, then alternated between two tiers above the bar.
  const placed = resolveBadgePositions(
    markers.map((m, i) => ({ id: i, targetX: xOfPh(m.ph), width: 18 + 7.4 * m.label.length })),
    6
  )
  const TIER_Y = [20, 42]

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} role="img" aria-label={title ?? `pH scale with pointer at ${p}`} {...rest}>
      <defs>
        <linearGradient id={gradId} x1="0" x2="1" y1="0" y2="0">
          {phGradientStops().map((s) => (
            <stop key={s.offset} offset={s.offset} style={{ stopColor: s.token }} />
          ))}
        </linearGradient>
      </defs>

      {/* Marker pills above the bar, with leader lines */}
      {markers.map((m, i) => {
        const pos = placed[i]
        const tier = i % 2
        const cy = TIER_Y[tier]
        const width = 18 + 7.4 * m.label.length
        return (
          <g key={`m-${i}`}>
            <line x1={xOfPh(m.ph)} x2={xOfPh(m.ph)} y1={cy + 10} y2={BAR.top} stroke="var(--fg-subtle)" strokeWidth={1} />
            <rect x={pos.x - width / 2} y={cy - 11} width={width} height={22} rx={11} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.2} />
            <text x={pos.x} y={cy + 0.5} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)" style={{ userSelect: 'none' }}>
              {m.label}
            </text>
          </g>
        )
      })}

      {/* The bar */}
      <rect x={BAR.x0} y={BAR.top} width={BAR.x1 - BAR.x0} height={BAR.bottom - BAR.top} rx={11} fill={`url(#${gradId})`} stroke="var(--border)" strokeWidth={1} />

      {/* pH ticks */}
      {Array.from({ length: 15 }, (_, n) => (
        <g key={`t-${n}`}>
          <line x1={xOfPh(n)} x2={xOfPh(n)} y1={BAR.bottom} y2={BAR.bottom + 4} stroke="var(--fg-muted)" strokeWidth={1} />
          <text x={xOfPh(n)} y={BAR.bottom + 17} textAnchor="middle" dominantBaseline="central" fontSize={13} fontFamily="var(--font-sans)" fill="var(--fg-muted)" style={{ fontVariantNumeric: 'tabular-nums', userSelect: 'none' }}>
            {n}
          </text>
        </g>
      ))}

      {/* Zone labels */}
      <text x={xOfPh(3)} y={134} textAnchor="middle" fontSize={14} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--acid)" dominantBaseline="central" style={{ userSelect: 'none' }}>
        acidic
      </text>
      <text x={xOfPh(7)} y={134} textAnchor="middle" fontSize={14} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg-muted)" dominantBaseline="central" style={{ userSelect: 'none' }}>
        neutral
      </text>
      <text x={xOfPh(11)} y={134} textAnchor="middle" fontSize={14} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--base)" dominantBaseline="central" style={{ userSelect: 'none' }}>
        basic
      </text>

      {/* Second log axis: [H⁺] */}
      <line x1={BAR.x0} x2={BAR.x1} y1={156} y2={156} stroke="var(--fg-subtle)" strokeWidth={1.2} />
      {[0, -2, -4, -6, -8, -10, -12, -14].map((e) => (
        <g key={`h-${e}`}>
          <line x1={xOfExponent(e)} x2={xOfExponent(e)} y1={156} y2={160} stroke="var(--fg-subtle)" strokeWidth={1} />
          <text x={xOfExponent(e)} y={172} textAnchor="middle" dominantBaseline="central" fontSize={13} fontFamily="var(--font-sans)" fill="var(--fg-muted)" style={{ userSelect: 'none' }}>
            {powerOfTen(e)}
          </text>
        </g>
      ))}

      {/* Pointer (under the bar) */}
      <line x1={px} x2={px} y1={BAR.top - 2} y2={BAR.bottom + 2} stroke="var(--fg)" strokeWidth={2.2} />
      <polygon points={`${px},${BAR.top - 2} ${px - 7},${BAR.top - 12} ${px + 7},${BAR.top - 12}`} fill="var(--fg)" />

      {/* Readouts */}
      <text x={320} y={196} textAnchor="middle" dominantBaseline="central" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg)" style={{ fontVariantNumeric: 'tabular-nums', userSelect: 'none' }}>
        <tspan fontWeight={700}>pH {p.toFixed(2)}</tspan>
        <tspan fill="var(--fg-muted)">{'   ·   '}</tspan>
        <tspan>
          <tspan className="sym">[H</tspan>⁺<tspan className="sym">]</tspan> = {formatSci(hPlus)}
        </tspan>
        <tspan fill="var(--fg-muted)">{'   ·   '}</tspan>
        <tspan>
          <tspan className="sym">[OH</tspan>⁻<tspan className="sym">]</tspan> = {formatSci(oh)}
        </tspan>
      </text>
    </g>
  )
})
