import React, { forwardRef } from 'react'
import { needleAngle, type Point } from './geometry'

export interface MeterProps extends React.SVGAttributes<SVGGElement> {
  /** Centre of the meter body, in the parent's coordinates. */
  x?: number
  y?: number
  width?: number
  height?: number
  value: number
  /** Scale range. For a galvanometer use a symmetric range such as [-R, R]. */
  range?: readonly [number, number]
  /** Full sweep of the needle in degrees. */
  span?: number
  /** Unit shown on the readout and the top scale label. */
  unit?: string
  /** Show a digital readout under the dial. */
  digital?: boolean
  decimals?: number
  /** Show the + and − terminals under the body. */
  terminals?: boolean
  /** Scale labels at the minimum, middle and maximum of the range. */
  scaleLabels?: readonly string[]
  /** Dial caption above the scale, e.g. "Voltmeter" or "Galvanometer". Pass it already formatted. */
  caption?: string
}

/** Positions of the + and − terminals for a meter centred on (x, y). */
export function meterTerminals(x: number, y: number, height: number): { plus: Point; minus: Point } {
  const yy = y + height / 2 + 22
  return { plus: { x: x - 34, y: yy }, minus: { x: x + 34, y: yy } }
}

/**
 * A dial meter. The needle angle is `needleAngle(value, range, span)`, and the
 * needle group carries it in `data-needle-angle`. The galvanometer is this same
 * component with a zero-centred range.
 */
export const Meter = forwardRef<SVGGElement, MeterProps>(function Meter(
  {
    x = 0,
    y = 0,
    width = 200,
    height = 140,
    value,
    range = [0, 3],
    span = 240,
    unit = 'V',
    digital = true,
    decimals = 2,
    terminals = true,
    scaleLabels,
    caption,
    className,
    ...rest
  },
  ref
) {
  const angle = needleAngle(value, range, span)
  const cx = x
  const cy = y + height * 0.04
  const radius = Math.min(width, height) * 0.36
  const toXY = (deg: number, r: number) => ({
    x: cx + r * Math.sin((deg * Math.PI) / 180),
    y: cy - r * Math.cos((deg * Math.PI) / 180),
  })
  const majors = 4
  const ticks = Array.from({ length: majors + 1 }, (_, i) => -span / 2 + (i / majors) * span)
  const labels = scaleLabels ?? [String(range[0]), String(range[1])]
  const t = terminals ? meterTerminals(x, y, height) : null
  const shown = Number.isFinite(value) ? value.toFixed(decimals) : '—'
  const arc = (a0: number, a1: number, r: number) => {
    const p0 = toXY(a0, r)
    const p1 = toXY(a1, r)
    const large = a1 - a0 > 180 ? 1 : 0
    return `M${p0.x} ${p0.y} A${r} ${r} 0 ${large} 1 ${p1.x} ${p1.y}`
  }
  const tip = toXY(angle, radius * 0.86)
  const tail = toXY(angle + 180, radius * 0.18)

  return (
    <g ref={ref} className={className} aria-hidden="true" {...rest}>
      {t && (
        <g>
          <line x1={t.plus.x} x2={t.plus.x} y1={y + height / 2} y2={t.plus.y - 7} stroke="var(--glass-wall)" strokeWidth={3} />
          <line x1={t.minus.x} x2={t.minus.x} y1={y + height / 2} y2={t.minus.y - 7} stroke="var(--glass-wall)" strokeWidth={3} />
          <circle cx={t.plus.x} cy={t.plus.y} r={7} fill="var(--proton)" stroke="var(--glass-wall)" strokeWidth={1.2} />
          <circle cx={t.minus.x} cy={t.minus.y} r={7} fill="var(--fg)" stroke="var(--glass-wall)" strokeWidth={1.2} />
          <text x={t.plus.x} y={t.plus.y + 5} textAnchor="middle" fontSize={14} fontWeight={700} fill="var(--surface)">+</text>
          <text x={t.minus.x} y={t.minus.y + 5} textAnchor="middle" fontSize={15} fontWeight={700} fill="var(--surface)">{'−'}</text>
        </g>
      )}
      <rect
        x={x - width / 2}
        y={y - height / 2}
        width={width}
        height={height}
        rx={14}
        fill="var(--surface-raised)"
        stroke="var(--glass-wall)"
        strokeWidth={1.6}
      />
      <path d={arc(-span / 2, span / 2, radius)} fill="none" stroke="var(--fg-subtle)" strokeWidth={1.6} />
      {ticks.map((deg, i) => {
        const a = toXY(deg, radius)
        const b = toXY(deg, radius - 7)
        return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--fg-muted)" strokeWidth={1.4} />
      })}
      {labels.map((text, i) => {
        const deg = -span / 2 + (i / (labels.length - 1)) * span
        const p = toXY(deg, radius + 14)
        return (
          <text key={i} x={p.x} y={p.y + 5} textAnchor="middle" fontSize={14} fill="var(--fg-muted)">
            {text}
          </text>
        )
      })}
      {caption && (
        <text x={cx} y={y - height / 2 - 12} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--fg)">
          {caption}
        </text>
      )}
      <g data-needle-angle={angle.toFixed(2)}>
        <line x1={tail.x} y1={tail.y} x2={tip.x} y2={tip.y} stroke="var(--proton)" strokeWidth={2.4} strokeLinecap="round" />
      </g>
      <circle cx={cx} cy={cy} r={5} fill="var(--fg)" />
      {digital && (
        <g>
          <rect x={x - 62} y={y + height * 0.26} width={124} height={30} rx={6} fill="var(--surface)" stroke="var(--glass-wall)" strokeWidth={1} />
          <text x={x} y={y + height * 0.26 + 21} textAnchor="middle" fontSize={17} fontWeight={600} fill="var(--fg)" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {shown} {unit}
          </text>
        </g>
      )}
    </g>
  )
})

/** A voltmeter: a dial over a 0 to max range, with + and − terminals. */
export const Voltmeter = forwardRef<SVGGElement, MeterProps>(function Voltmeter(props, ref) {
  return <Meter caption="Voltmeter" range={[0, 3]} {...props} ref={ref} />
})

/** A zero-centred galvanometer: the needle swings either way from zero. */
export const Galvanometer = forwardRef<SVGGElement, MeterProps>(function Galvanometer(props, ref) {
  const range: readonly [number, number] = props.range ?? [-1, 1]
  return (
    <Meter
      span={110}
      unit="A"
      decimals={3}
      caption="Galvanometer"
      scaleLabels={[String(range[0]), '0', String(range[1])]}
      {...props}
      range={range}
      ref={ref}
    />
  )
})
