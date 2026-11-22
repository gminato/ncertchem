'use client'

import React, { forwardRef, type ReactNode, type SVGAttributes } from 'react'
import { clamp01 } from './geometry'

export interface StopwatchProps extends Omit<SVGAttributes<SVGGElement>, 'children'> {
  x?: number
  y?: number
  /** Diameter of the dial. */
  size?: number
  /** Elapsed time in seconds. The hand makes one turn per minute; the readout shows the value. */
  seconds: number
  /** Decimal places in the readout. */
  digits?: number
}

const TAU = Math.PI * 2

/** A stopwatch dial with a sweeping hand and a digital readout. The hand angle is a pure function of `seconds`. */
export const Stopwatch = forwardRef<SVGGElement, StopwatchProps>(function Stopwatch(
  { x = 0, y = 0, size = 150, seconds, digits = 1, ...rest },
  ref
) {
  const r = size / 2 - 10
  const cx = x + size / 2
  const cy = y + size / 2 + 12
  const s = Math.max(0, seconds)
  const angle = ((s % 60) / 60) * TAU - Math.PI / 2
  const handEnd = { x: cx + Math.cos(angle) * r * 0.82, y: cy + Math.sin(angle) * r * 0.82 }
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const a = (i / 60) * TAU - Math.PI / 2
    const major = i % 5 === 0
    const r1 = r * (major ? 0.8 : 0.9)
    return { x1: cx + Math.cos(a) * r1, y1: cy + Math.sin(a) * r1, x2: cx + Math.cos(a) * r * 0.97, y2: cy + Math.sin(a) * r * 0.97, major }
  })
  return (
    <g ref={ref} aria-hidden="true" {...rest}>
      {/* Crown and push button */}
      <rect x={cx - 7} y={y + 2} width={14} height={10} rx={3} fill="var(--surface-raised)" stroke="var(--kin-axis)" strokeWidth={1.4} />
      <line x1={cx} x2={cx} y1={y + 12} y2={cy - r} stroke="var(--kin-axis)" strokeWidth={2.2} />
      <circle cx={cx} cy={cy} r={r} fill="var(--surface)" stroke="var(--kin-axis)" strokeWidth={2.2} />
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="var(--kin-axis)" strokeWidth={t.major ? 2 : 1} />
      ))}
      <rect x={cx - 26} y={cy + r * 0.34} width={52} height={24} rx={7} fill="var(--surface-raised)" stroke="var(--kin-grid)" />
      <text x={cx} y={cy + r * 0.34 + 17} textAnchor="middle" fontSize={16} fill="var(--fg)" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {`${s.toFixed(digits)} s`}
      </text>
      <line x1={cx} y1={cy} x2={handEnd.x} y2={handEnd.y} stroke="var(--kin-flash)" strokeWidth={2.6} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={4.5} fill="var(--kin-flash)" />
    </g>
  )
})

export interface RateMeterProps extends Omit<SVGAttributes<SVGGElement>, 'children'> {
  x?: number
  y?: number
  width?: number
  /** Bar thickness. */
  height?: number
  /** The value being shown, in the same units as `max`. */
  value: number
  /** The full-scale value. Pass the same scale to every meter you compare. */
  max: number
  /** Name of the quantity, e.g. "Initial rate". */
  label?: ReactNode
  /** Value label; defaults to the number. Pass it formatted with units, e.g. "4.0 × 10⁻⁴ mol L⁻¹ s⁻¹". */
  valueLabel?: ReactNode
  tone?: 'reactant' | 'product' | 'accent' | 'catalyst'
}

const METER_TONE = {
  reactant: 'var(--kin-reactant)',
  product: 'var(--kin-product)',
  accent: 'var(--accent)',
  catalyst: 'var(--kin-catalyst)',
} as const

/** A horizontal bar for one rate on a shared scale, with its label and value. */
export const RateMeter = forwardRef<SVGGElement, RateMeterProps>(function RateMeter(
  { x = 0, y = 0, width = 260, height = 18, value, max, label, valueLabel, tone = 'product', ...rest },
  ref
) {
  const frac = max > 0 ? clamp01(value / max) : 0
  const barY = y + 30
  return (
    <g ref={ref} aria-hidden="true" {...rest}>
      {label !== undefined && (
        <text x={x} y={y + 18} fontSize={15} fill="var(--fg)">
          {label}
        </text>
      )}
      {valueLabel !== undefined && (
        <text x={x + width} y={y + 18} textAnchor="end" fontSize={15} fill="var(--fg)" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {valueLabel}
        </text>
      )}
      <rect x={x} y={barY} width={width} height={height} rx={height / 2} fill="var(--surface-raised)" stroke="var(--kin-grid)" />
      <rect x={x} y={barY} width={Math.max(height, frac * width)} height={height} rx={height / 2} fill={METER_TONE[tone]} fillOpacity={0.9} />
      <text x={x} y={barY + height + 18} fontSize={14} fill="var(--fg-muted)">
        0
      </text>
      <text x={x + width} y={barY + height + 18} textAnchor="end" fontSize={14} fill="var(--fg-muted)">
        {String(max)}
      </text>
    </g>
  )
})

export interface CatalystSurfaceProps extends Omit<SVGAttributes<SVGGElement>, 'children'> {
  x?: number
  y?: number
  width?: number
  /** Height of the metal slab. */
  height?: number
  /** One entry per adsorption site, left to right: true when the site holds a molecule. */
  occupied: boolean[]
  /** Caption under the slab. */
  caption?: ReactNode
}

/** A strip of metal with a fixed row of adsorption sites, filled where a molecule is bound. */
export const CatalystSurface = forwardRef<SVGGElement, CatalystSurfaceProps>(function CatalystSurface(
  { x = 0, y = 0, width = 420, height = 56, occupied, caption, ...rest },
  ref
) {
  const n = Math.max(1, occupied.length)
  const topY = y + height * 0.42
  const slot = width / n
  const r = Math.min(slot * 0.3, 16)
  return (
    <g ref={ref} aria-hidden="true" {...rest}>
      <rect x={x} y={topY} width={width} height={y + height - topY} rx={6} fill="var(--surface-raised)" stroke="var(--bond)" strokeWidth={1.6} />
      <line x1={x} x2={x + width} y1={topY} y2={topY} stroke="var(--glass-sheen)" strokeWidth={2} />
      {occupied.map((on, i) => {
        const cx = x + slot * (i + 0.5)
        return (
          <g key={i}>
            <ellipse cx={cx} cy={topY} rx={r * 0.75} ry={3} fill="var(--kin-axis)" fillOpacity={0.35} />
            {on ? (
              <>
                <circle cx={cx} cy={topY - r - 2} r={r} fill="var(--kin-reactant)" fillOpacity={0.9} />
                <circle cx={cx - r * 0.3} cy={topY - r - 2 - r * 0.3} r={r * 0.3} fill="var(--kin-sheen)" />
              </>
            ) : (
              <circle cx={cx} cy={topY - r - 2} r={r * 0.8} fill="none" stroke="var(--kin-axis)" strokeWidth={1.4} strokeDasharray="3 3" />
            )}
          </g>
        )
      })}
      {caption !== undefined && (
        <text x={x + width / 2} y={y + height + 24} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
          {caption}
        </text>
      )}
    </g>
  )
})
