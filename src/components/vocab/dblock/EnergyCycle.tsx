import React, { forwardRef } from 'react'

export interface EnergyStep {
  /** Short name of the step, e.g. the enthalpy symbol. Pass a ReactNode with Sub or Sup for real subscripts. */
  name: React.ReactNode
  /** Energy change in kJ mol⁻¹: positive is endothermic (arrow up), negative exothermic (arrow down). */
  value: number
  /** The value as the caller formats it for display, e.g. "+130" or "−2050". */
  text: string
}

/** Energy of each level from the start: [0, v0, v0 + v1, …]. Pure. */
export function cycleLevels(values: number[]): number[] {
  const out = [0]
  for (const v of values) out.push(out[out.length - 1] + v)
  return out
}

/** A shared vertical scale [min, max] that fits every cycle passed, with a small margin. */
export function energyDomain(...cycles: number[][]): [number, number] {
  const all = cycles.flatMap((c) => cycleLevels(c))
  const lo = Math.min(0, ...all)
  const hi = Math.max(0, ...all)
  const pad = (hi - lo) * 0.06
  return [lo - pad, hi + pad]
}

export interface EnergyCycleProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  x?: number
  y?: number
  width?: number
  height?: number
  /** Species at each level: one more than there are steps, e.g. M(s), M(g), M²⁺(g), M²⁺(aq). */
  species: React.ReactNode[]
  steps: EnergyStep[]
  /** Shared scale in kJ mol⁻¹ from energyDomain(); defaults to this cycle alone. */
  domain?: [number, number]
  /** Overall change, drawn as a bold arrow on the right from the first level to the last. */
  net?: { value: number; text: string; name: React.ReactNode }
}

const LEFT = 6
const LINE_W = 48
/** Distance between the left ends of successive levels. Three steps fit a 296-unit cycle with the last species label. */
const STRIDE = 73
const TOP = 40
const BOTTOM = 44

/**
 * A Born–Haber style energy cycle. Levels are horizontal lines drawn to scale above a key row;
 * each step is a vertical arrow from one level to the next (up if endothermic, down if exothermic),
 * labelled in the key row under its arrow so small steps stay readable.
 */
export const EnergyCycle = forwardRef<SVGGElement, EnergyCycleProps>(function EnergyCycle(
  { x = 0, y = 0, width = 296, height = 240, species, steps, domain, net, ...rest },
  ref
) {
  const values = steps.map((s) => s.value)
  const levels = cycleLevels(values)
  const [lo, hi] = domain ?? energyDomain(values)
  const plotH = height - TOP - BOTTOM
  const yOf = (e: number) => TOP + ((hi - e) / (hi - lo)) * plotH
  const n = steps.length
  const startX = (i: number) => LEFT + i * STRIDE
  const arrowX = (i: number) => startX(i) + LINE_W + (STRIDE - LINE_W) / 2
  const labelStyle = { fill: 'var(--fg)', fontFamily: 'var(--font-sans)' }
  const keyTop = height - BOTTOM + 18

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} aria-hidden="true" data-energy-cycle {...rest}>
      {levels.map((e, i) => (
        <g key={`lv${i}`}>
          <line x1={startX(i)} x2={startX(i) + LINE_W} y1={yOf(e)} y2={yOf(e)} style={{ stroke: 'var(--fg)', strokeWidth: 2, strokeLinecap: 'round' }} />
          <text x={startX(i)} y={i === n ? yOf(e) + 18 : yOf(e) - 8} fontSize={14} style={labelStyle}>
            {species[i]}
          </text>
        </g>
      ))}
      {steps.map((s, i) => {
        const ax = arrowX(i)
        const up = s.value >= 0
        const from = yOf(levels[i])
        const to = yOf(levels[i + 1])
        return (
          <g key={`st${i}`}>
            <line x1={ax} x2={ax} y1={from} y2={to} style={{ stroke: 'var(--fg-muted)', strokeWidth: 2 }} />
            <path
              d={up ? `M${ax - 5} ${to + 8} L${ax} ${to} L${ax + 5} ${to + 8}` : `M${ax - 5} ${to - 8} L${ax} ${to} L${ax + 5} ${to - 8}`}
              style={{ fill: 'none', stroke: 'var(--fg-muted)', strokeWidth: 2, strokeLinejoin: 'round' }}
            />
            <text x={ax} y={keyTop} textAnchor="middle" fontSize={14} style={labelStyle}>
              {s.name}
            </text>
            <text x={ax} y={keyTop + 24} textAnchor="middle" fontSize={14} style={{ ...labelStyle, fontWeight: 600 }}>
              {s.text}
            </text>
          </g>
        )
      })}
      {net && (
        <g>
          <line x1={width - 5} x2={width - 5} y1={yOf(0)} y2={yOf(levels[n])} style={{ stroke: 'var(--accent)', strokeWidth: 3 }} />
          <path
            d={
              levels[n] >= 0
                ? `M${width - 10} ${yOf(levels[n]) + 9} L${width - 5} ${yOf(levels[n])} L${width} ${yOf(levels[n]) + 9}`
                : `M${width - 10} ${yOf(levels[n]) - 9} L${width - 5} ${yOf(levels[n])} L${width} ${yOf(levels[n]) - 9}`
            }
            style={{ fill: 'none', stroke: 'var(--accent)', strokeWidth: 3, strokeLinejoin: 'round' }}
          />
          <text x={width - 4} y={14} textAnchor="end" fontSize={14} style={{ ...labelStyle, fill: 'var(--accent)', fontWeight: 600 }}>
            {net.name}
          </text>
          <text x={width - 4} y={30} textAnchor="end" fontSize={14} style={{ ...labelStyle, fill: 'var(--accent)', fontWeight: 600 }}>
            {net.text}
          </text>
        </g>
      )}
    </g>
  )
})
