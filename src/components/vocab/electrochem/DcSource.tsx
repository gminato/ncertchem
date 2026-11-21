import React, { forwardRef } from 'react'
import type { Point } from './geometry'

export interface DcSourceProps extends React.SVGAttributes<SVGGElement> {
  /** Top-left corner of the supply box. */
  x?: number
  y?: number
  width?: number
  height?: number
  /** Set voltage in volts. */
  voltage?: number
  /** Overrides the readout text, e.g. "2.0 V" as formatted by the caller. */
  display?: string
  /** Caption under the readout, e.g. "DC supply". Pass it already formatted. */
  label?: string
}

/** Terminal posts on the top edge of a DC supply box, for wiring. */
export function dcTerminals(x: number, y: number, width: number): { plus: Point; minus: Point } {
  return { plus: { x: x + width * 0.25, y: y - 16 }, minus: { x: x + width * 0.75, y: y - 16 } }
}

/** A DC supply box with a voltage readout and + and − terminals on top. */
export const DcSource = forwardRef<SVGGElement, DcSourceProps>(function DcSource(
  { x = 0, y = 0, width = 150, height = 84, voltage = 6, display, label, className, ...rest },
  ref
) {
  const t = dcTerminals(x, y, width)
  const shown = display ?? `${voltage.toFixed(1).replace('-', '\u2212')} V`
  return (
    <g ref={ref} className={className} aria-hidden="true" {...rest}>
      {[t.plus, t.minus].map((p, i) => (
        <g key={i}>
          <line x1={p.x} x2={p.x} y1={p.y} y2={y} stroke="var(--glass-wall)" strokeWidth={3} />
          <circle cx={p.x} cy={p.y} r={6.5} fill={i === 0 ? 'var(--proton)' : 'var(--fg)'} stroke="var(--glass-wall)" strokeWidth={1.2} />
        </g>
      ))}
      <rect x={x} y={y} width={width} height={height} rx={10} fill="var(--surface-raised)" stroke="var(--glass-wall)" strokeWidth={1.8} />
      <rect x={x + 14} y={y + 12} width={width - 28} height={30} rx={5} fill="var(--surface)" stroke="var(--glass-wall)" strokeWidth={1} />
      <text x={x + width / 2} y={y + 33} textAnchor="middle" fontSize={17} fontWeight={600} fill="var(--fg)" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {shown}
      </text>
      {label && (
        <text x={x + width / 2} y={y + height - 14} textAnchor="middle" fontSize={14} fill="var(--fg-muted)">
          {label}
        </text>
      )}
    </g>
  )
})
