import React, { forwardRef } from 'react'
import { clipCurve, concentrationAt, curvePath, settleTime, type TimePoint } from './geometry'

/** Drawing size in SVG units. Parents use it as the viewBox. */
export const EQUILIBRIUM_CURVES_SIZE = { width: 640, height: 300 } as const

const GAP = 16
const PLOT = { left: 56, right: 46, top: 74, bottom: 246 }

export interface CurveSeries {
  id: string
  /** Label drawn at the end of the curve. Use <span className="sym"> for symbols. */
  label: React.ReactNode
  color: string
  /** [time, concentration] pairs in time order. */
  points: readonly TimePoint[]
  /** SVG dash pattern, e.g. "7 5", so a curve that lies on top of another stays visible. */
  dash?: string
}

export interface CurvePanel {
  /** Heading for the panel, such as "From reactants". */
  title: React.ReactNode
  series: readonly CurveSeries[]
}

export interface EquilibriumCurvesProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** One or two panels. Two panels sit side by side on the same axes. */
  panels: readonly CurvePanel[]
  /** Time at the right edge of the axes. */
  timeMax: number
  /** Concentration at the top edge of the axes. */
  concMax: number
  /** Draw progress from 0 (nothing) to 1 (full curves). */
  progress?: number
  /** Time at which the curves have flattened. Defaults to the settling time of the data. */
  equilibriumAt?: number
  /** Time of an added species (a perturbation), drawn as a dashed line. */
  perturbAt?: number
  /** Label for the perturbation line. */
  perturbLabel?: React.ReactNode
  xLabel?: React.ReactNode
  yLabel?: React.ReactNode
  title?: string
  x?: number
  y?: number
}

/** Spreads end labels vertically so none overlap, keeping each as close to its target as possible. */
function spreadLabels(targets: number[], minGap: number): number[] {
  const order = targets.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v)
  const pos = order.map((o) => o.v)
  for (let pass = 0; pass < 60; pass++) {
    let moved = false
    for (let k = 1; k < pos.length; k++) {
      const d = pos[k] - pos[k - 1]
      if (d < minGap) {
        const push = (minGap - d) / 2
        pos[k - 1] -= push
        pos[k] += push
        moved = true
      }
    }
    if (!moved) break
  }
  const out = new Array<number>(targets.length)
  order.forEach((o, k) => {
    out[o.i] = pos[k]
  })
  return out
}

/** Nice tick values from 0 to max, four intervals. */
function ticks(max: number): number[] {
  return [0, 0.25, 0.5, 0.75, 1].map((f) => f * max)
}

/**
 * Concentration against time for two to four species, drawn from given data. Curves draw
 * in with `progress`. Once they flatten, an "equilibrium reached" band opens. A dashed line
 * marks a perturbation, such as adding a species, where the curves re-settle.
 */
export const EquilibriumCurves = forwardRef<SVGGElement, EquilibriumCurvesProps>(function EquilibriumCurves(
  {
    panels,
    timeMax,
    concMax,
    progress = 1,
    equilibriumAt,
    perturbAt,
    perturbLabel,
    xLabel = <tspan className="sym">t</tspan>,
    yLabel = 'concentration',
    title,
    x = 0,
    y = 0,
    className,
    ...rest
  },
  ref
) {
  const p = Math.min(1, Math.max(0, progress))
  const n = Math.max(1, panels.length)
  const W = EQUILIBRIUM_CURVES_SIZE.width
  const H = EQUILIBRIUM_CURVES_SIZE.height
  const pw = (W - GAP * (n - 1)) / n

  // Settling time shared by all series: the latest time any curve is still moving.
  const allSeries = panels.flatMap((pn) => pn.series)
  const settle = allSeries.length
    ? Math.max(...allSeries.map((s) => settleTime(s.points, concMax * 0.01)))
    : 0
  const bandStart = equilibriumAt ?? settle
  const drawnTime = p * timeMax

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} role="img" aria-label={title ?? 'Concentration against time'} {...rest}>
      {panels.map((panel, pi) => {
        const ox = pi * (pw + GAP)
        const left = ox + PLOT.left
        const right = ox + pw - PLOT.right
        const top = PLOT.top
        const bottom = PLOT.bottom
        const xOf = (t: number) => left + (t / timeMax) * (right - left)
        const yOf = (c: number) => bottom - (c / concMax) * (bottom - top)

        const endTargets = panel.series.map((s) => yOf(concentrationAt(s.points, timeMax)))
        const endYs = spreadLabels(endTargets, 17)

        return (
          <g key={pi}>
            {/* Panel heading */}
            <text x={left} y={24} fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)" dominantBaseline="central" style={{ userSelect: 'none' }}>
              {panel.title}
            </text>

            {/* Equilibrium band */}
            {drawnTime > bandStart && (
              <g>
                <rect x={xOf(bandStart)} y={top} width={Math.max(0, right - xOf(bandStart))} height={bottom - top} fill="var(--fwd)" opacity={0.09} />
                <text x={xOf(bandStart) + 8} y={top + 14} fontSize={13} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fwd)" dominantBaseline="central" style={{ userSelect: 'none' }}>
                  equilibrium reached
                </text>
              </g>
            )}

            {/* Axes */}
            <line x1={left} y1={top} x2={left} y2={bottom} stroke="var(--fg-muted)" strokeWidth={1.4} />
            <line x1={left} y1={bottom} x2={right} y2={bottom} stroke="var(--fg-muted)" strokeWidth={1.4} />

            {ticks(concMax).map((c, k) => (
              <g key={`yt-${k}`}>
                <line x1={left - 4} x2={left} y1={yOf(c)} y2={yOf(c)} stroke="var(--fg-muted)" strokeWidth={1} />
                <text x={left - 8} y={yOf(c)} textAnchor="end" dominantBaseline="central" fontSize={13} fontFamily="var(--font-sans)" fill="var(--fg-muted)" style={{ fontVariantNumeric: 'tabular-nums', userSelect: 'none' }}>
                  {Number(c.toFixed(2))}
                </text>
              </g>
            ))}
            {ticks(timeMax).map((t, k) => (
              <g key={`xt-${k}`}>
                <line x1={xOf(t)} x2={xOf(t)} y1={bottom} y2={bottom + 4} stroke="var(--fg-muted)" strokeWidth={1} />
                <text x={xOf(t)} y={bottom + 18} textAnchor="middle" dominantBaseline="central" fontSize={13} fontFamily="var(--font-sans)" fill="var(--fg-muted)" style={{ userSelect: 'none' }}>
                  {Number(t.toFixed(1))}
                </text>
              </g>
            ))}
            <text x={(left + right) / 2} y={bottom + 38} textAnchor="middle" dominantBaseline="central" fontSize={14} fontFamily="var(--font-sans)" fill="var(--fg-muted)" style={{ userSelect: 'none' }}>
              {xLabel}
            </text>
            <text x={ox + 14} y={(top + bottom) / 2} textAnchor="middle" dominantBaseline="central" transform={`rotate(-90 ${ox + 14} ${(top + bottom) / 2})`} fontSize={14} fontFamily="var(--font-sans)" fill="var(--fg-muted)" style={{ userSelect: 'none' }}>
              {yLabel}
            </text>

            {/* Perturbation marker */}
            {perturbAt !== undefined && (
              <g>
                <line x1={xOf(perturbAt)} x2={xOf(perturbAt)} y1={top} y2={bottom} stroke="var(--fg)" strokeWidth={1.4} strokeDasharray="5 4" opacity={p > 0 ? 0.8 : 0} />
                {perturbLabel && (
                  <text x={xOf(perturbAt) + 6} y={bottom - 12} fontSize={13} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)" dominantBaseline="central" opacity={p > 0 ? 1 : 0} style={{ userSelect: 'none' }}>
                    {perturbLabel}
                  </text>
                )}
              </g>
            )}

            {/* Curves */}
            {panel.series.map((s) => {
              const clipped = clipCurve(s.points, drawnTime)
              const d = curvePath(clipped, xOf, yOf)
              const end = clipped[clipped.length - 1]
              return (
                <g key={s.id}>
                  <path d={d} fill="none" stroke={s.color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={s.dash} />
                  {end && p > 0 && <circle cx={xOf(end[0])} cy={yOf(end[1])} r={4} fill={s.color} stroke="var(--surface)" strokeWidth={1.5} />}
                </g>
              )
            })}

            {/* End labels, spread so none collide */}
            {panel.series.map((s, k) => {
              const endLabelY = endYs[k]
              return (
                <text
                  key={`lab-${s.id}`}
                  x={right + 8}
                  y={endLabelY}
                  dominantBaseline="central"
                  fontSize={14}
                  fontWeight={600}
                  fontFamily="var(--font-sans)"
                  fill={s.color}
                  opacity={p >= 0.95 ? 1 : 0}
                  style={{ userSelect: 'none', transition: 'opacity 0.3s ease' }}
                >
                  {s.label}
                </text>
              )
            })}
          </g>
        )
      })}
    </g>
  )
})
