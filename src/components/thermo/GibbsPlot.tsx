import React, { forwardRef } from 'react'
import { Label } from '../vocab/Label'
import { crossoverTemperature, gibbsEnergy, spontaneousIntervals } from './geometry'

/** Drawing size in SVG units. Parents use it as the viewBox. */
export const GIBBS_SIZE = { width: 300, height: 226 } as const

const PLOT = { left: 60, right: 272, top: 34, bottom: 176 }
const TICK = 13

export interface GibbsPlotProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** Enthalpy change in kJ mol⁻¹. */
  dH: number
  /** Entropy change in J K⁻¹ mol⁻¹. */
  dS: number
  /** Temperature range of the plot in K. */
  tMin?: number
  tMax?: number
  /** Movable temperature marker, in K. Omit it to hide the marker. */
  temperature?: number
  /** Accessible name for the plot. */
  title?: string
}

/** A round step size for `range` split into about `target` intervals (1, 2, 2.5 or 5 times a power of ten). */
function niceStep(range: number, target: number): number {
  const raw = range / target
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const f = raw / mag
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10
  return nice * mag
}

/** The parts of [tMin, tMax] that are not covered by the given intervals. */
function complement(intervals: Array<[number, number]>, tMin: number, tMax: number): Array<[number, number]> {
  const out: Array<[number, number]> = []
  let cursor = tMin
  for (const [a, b] of intervals) {
    if (a > cursor) out.push([cursor, a])
    cursor = Math.max(cursor, b)
  }
  if (cursor < tMax) out.push([cursor, tMax])
  return out
}

/**
 * ΔG against temperature for ΔG = ΔH − TΔS. The line crosses zero at the crossover
 * temperature. Spontaneous (ΔG < 0) and non-spontaneous (ΔG > 0) regions are
 * shaded, and an optional marker moves along the line. Works for all four sign
 * cases, because the line is linear in T.
 */
export const GibbsPlot = forwardRef<SVGGElement, GibbsPlotProps>(function GibbsPlot(
  { dH, dS, tMin = 200, tMax = 1200, temperature, title, className, ...rest },
  ref
) {
  const gAt = (t: number) => gibbsEnergy(dH, dS, t)
  const gLo = Math.min(0, gAt(tMin), gAt(tMax))
  const gHi = Math.max(0, gAt(tMin), gAt(tMax))
  const pad = Math.max(1, (gHi - gLo) * 0.12)
  const step = niceStep(gHi - gLo + 2 * pad, 3)
  const yLo = Math.floor((gLo - pad) / step) * step
  const yHi = Math.ceil((gHi + pad) / step) * step
  const yTicks: number[] = []
  for (let v = yLo; v <= yHi + step / 2; v += step) yTicks.push(Math.round(v / step) * step)

  const px = (t: number) => PLOT.left + ((t - tMin) / (tMax - tMin)) * (PLOT.right - PLOT.left)
  const py = (g: number) => PLOT.bottom - ((g - yLo) / (yHi - yLo)) * (PLOT.bottom - PLOT.top)
  const zeroY = py(0)

  const spontaneous = spontaneousIntervals(dH, dS, tMin, tMax)
  const nonSpontaneous = complement(spontaneous, tMin, tMax)
  const crossover = crossoverTemperature(dH, dS)
  const crossoverInRange = crossover !== null && crossover > tMin && crossover < tMax

  // A shaded band between the line and the zero axis over [a, b].
  const band = (a: number, b: number) =>
    `${px(a)},${zeroY} ${px(a)},${py(gAt(a))} ${px(b)},${py(gAt(b))} ${px(b)},${zeroY}`

  const lineD = `M${px(tMin)},${py(gAt(tMin))} L${px(tMax)},${py(gAt(tMax))}`
  // Ticks every 200 K inside the range, so the end labels never crowd the frame.
  const tTicks: number[] = []
  for (let t = Math.ceil(tMin / 200) * 200; t <= tMax; t += 200) tTicks.push(t)

  return (
    <g ref={ref} className={className} {...rest}>
      {title && <title>{title}</title>}

      {/* Gridlines and y ticks */}
      {yTicks.map((g) => (
        <g key={`gy-${g}`}>
          <line x1={PLOT.left} y1={py(g)} x2={PLOT.right} y2={py(g)} strokeWidth={1} style={{ stroke: 'var(--border)' }} />
          <Label x={PLOT.left - 8} y={py(g)} textAnchor="end" fontSize={TICK} fill="var(--fg-muted)">
            {g > 0 ? `+${g}` : g < 0 ? `−${Math.abs(g)}` : '0'}
          </Label>
        </g>
      ))}

      {/* Shaded regions: spontaneous (ΔG < 0) and non-spontaneous (ΔG > 0) */}
      {nonSpontaneous.map(([a, b], i) => (
        <polygon key={`ns-${i}`} points={band(a, b)} style={{ fill: 'var(--heat)' }} opacity={0.12} />
      ))}
      {spontaneous.map(([a, b], i) => (
        <polygon key={`sp-${i}`} points={band(a, b)} style={{ fill: 'var(--work)' }} opacity={0.24} />
      ))}

      {/* Axes */}
      <line x1={PLOT.left} y1={PLOT.bottom} x2={PLOT.right} y2={PLOT.bottom} strokeWidth={1} style={{ stroke: 'var(--fg-subtle)' }} />
      <line x1={PLOT.left} y1={PLOT.top} x2={PLOT.left} y2={PLOT.bottom} strokeWidth={1} style={{ stroke: 'var(--fg-subtle)' }} />
      {tTicks.map((t) => (
        <Label key={`tt-${t}`} x={px(t)} y={PLOT.bottom + 16} fontSize={TICK} fill="var(--fg-muted)">
          {t}
        </Label>
      ))}
      <Label x={PLOT.right} y={PLOT.bottom + 36} textAnchor="end" fontSize={TICK + 1} fill="var(--fg)">
        <tspan className="sym">T</tspan> / K
      </Label>
      <Label x={4} y={PLOT.top - 16} textAnchor="start" fontSize={TICK + 1} fill="var(--fg)">
        <tspan className="sym">ΔG</tspan> / kJ mol⁻¹
      </Label>

      {/* ΔG = 0 */}
      <line x1={PLOT.left} y1={zeroY} x2={PLOT.right} y2={zeroY} strokeWidth={1} strokeDasharray="3 3" style={{ stroke: 'var(--fg-muted)' }} />

      {/* Crossover temperature */}
      {crossoverInRange && (
        <g data-testid="gibbs-crossover">
          <line x1={px(crossover)} y1={PLOT.top} x2={px(crossover)} y2={PLOT.bottom} strokeWidth={1} strokeDasharray="2 3" style={{ stroke: 'var(--fg-muted)' }} />
          <Label
            x={crossover > (tMin + tMax) / 2 ? px(crossover) - 5 : px(crossover) + 5}
            y={PLOT.top + 10}
            textAnchor={crossover > (tMin + tMax) / 2 ? 'end' : 'start'}
            fontSize={TICK}
            fill="var(--fg)"
          >
            <tspan className="sym">T</tspan>
            <Label.Sub>c</Label.Sub>
            {` ≈ ${Math.round(crossover)} K`}
          </Label>
        </g>
      )}

      {/* The line ΔG = ΔH − TΔS */}
      <path d={lineD} fill="none" strokeWidth={2.2} strokeLinecap="round" style={{ stroke: 'var(--accent)' }} />

      {/* Movable temperature marker */}
      {temperature !== undefined && temperature >= tMin && temperature <= tMax && (
        <g data-testid="gibbs-marker">
          <line x1={px(temperature)} y1={py(gAt(temperature))} x2={px(temperature)} y2={PLOT.bottom} strokeWidth={0.9} style={{ stroke: 'var(--fg-subtle)' }} />
          <circle cx={px(temperature)} cy={py(gAt(temperature))} r={5} style={{ fill: 'var(--fg)', stroke: 'var(--surface)' }} strokeWidth={1.5} />
        </g>
      )}
    </g>
  )
})
