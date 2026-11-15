import React, { forwardRef } from 'react'
import { Label } from '../vocab/Label'
import { isothermPoints, pathWork, workAreaPolygon, type PVPoint } from './geometry'

/** Drawing size in SVG units. Parents use it as the viewBox. */
export const PV_SIZE = { width: 380, height: 262 } as const

const PLOT = { left: 60, right: 360, top: 26, bottom: 214 }
const TICK = 13

export type PVTone = 'heat' | 'work' | 'accent' | 'fg'

export interface PVSeries {
  id: string
  /** Corner points of the path, in order. */
  points: readonly PVPoint[]
  /** `straight` joins the points with lines (steps); `smooth` curves through them. */
  style?: 'straight' | 'smooth'
  tone?: PVTone
  /** Legend text for the series. Omit it and the series is not listed. */
  label?: React.ReactNode
}

export interface PVDiagramProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** The paths to draw, for example one-step, many-step and reversible. */
  series: readonly PVSeries[]
  /** Draws the isotherm p = nRT / V as a faint dashed curve across the plot. nRT in L atm. */
  nRT?: number
  /** Id of the series whose work area is shaded. Expansion uses `--work`, compression `--heat`. */
  shade?: string
  /** 0 to 1: draws the paths in. Undefined means fully drawn. */
  progress?: number
  /** Upper bounds of the axes. */
  vMax?: number
  pMax?: number
  /** Gridline and tick positions. */
  vTicks?: readonly number[]
  pTicks?: readonly number[]
  /** Accessible name for the diagram. */
  title?: string
}

const TONE_VAR: Record<PVTone, string> = {
  heat: 'var(--heat)',
  work: 'var(--work)',
  accent: 'var(--accent)',
  fg: 'var(--fg)',
}

/** SVG points of a closed polygon in data units, for a given plot mapping. */
function toPoints(pts: readonly PVPoint[], px: (v: number) => number, py: (p: number) => number): string {
  return pts.map((pt) => `${px(pt.v).toFixed(2)},${py(pt.p).toFixed(2)}`).join(' ')
}

/** Path data for a series. Straight segments, or a smooth curve through quadratic midpoints. */
function seriesPath(
  pts: readonly PVPoint[],
  style: 'straight' | 'smooth',
  px: (v: number) => number,
  py: (p: number) => number
): string {
  if (pts.length === 0) return ''
  const P = (pt: PVPoint) => `${px(pt.v).toFixed(2)},${py(pt.p).toFixed(2)}`
  if (style === 'straight' || pts.length < 3) {
    return pts.map((pt, i) => `${i === 0 ? 'M' : 'L'}${P(pt)}`).join(' ')
  }
  const mid = (a: PVPoint, b: PVPoint): PVPoint => ({ v: (a.v + b.v) / 2, p: (a.p + b.p) / 2 })
  let d = `M${P(pts[0])} L${P(mid(pts[0], pts[1]))}`
  for (let i = 1; i < pts.length - 1; i++) {
    d += ` Q${P(pts[i])} ${P(mid(pts[i], pts[i + 1]))}`
  }
  d += ` L${P(pts[pts.length - 1])}`
  return d
}

/**
 * A p–V diagram: axes with unit titles, an optional isotherm, any number of paths,
 * and the work area under one chosen path, shaded by its sign. Work is signed as
 * the IUPAC convention: expansion gives negative work, compression positive.
 */
export const PVDiagram = forwardRef<SVGGElement, PVDiagramProps>(function PVDiagram(
  {
    series,
    nRT,
    shade,
    progress,
    vMax = 12,
    pMax = 14,
    vTicks = [2, 4, 6, 8, 10, 12],
    pTicks = [4, 8, 12],
    title,
    className,
    ...rest
  },
  ref
) {
  const px = (v: number) => PLOT.left + (v / vMax) * (PLOT.right - PLOT.left)
  const py = (p: number) => PLOT.bottom - (p / pMax) * (PLOT.bottom - PLOT.top)
  const drawn = progress === undefined ? 1 : Math.min(1, Math.max(0, progress))

  // Start where the isotherm reaches the top of the plot, so the curve stays inside it.
  const isotherm =
    nRT === undefined
      ? ''
      : toPoints(isothermPoints(nRT, Math.max(0.05, nRT / pMax), vMax, 120), px, py)

  return (
    <g ref={ref} className={className} {...rest}>
      {title && <title>{title}</title>}

      {/* Gridlines */}
      {vTicks.filter((v) => v <= vMax).map((v) => (
        <line key={`gv-${v}`} x1={px(v)} y1={PLOT.top} x2={px(v)} y2={PLOT.bottom} strokeWidth={1} style={{ stroke: 'var(--border)' }} />
      ))}
      {pTicks.filter((p) => p <= pMax).map((p) => (
        <line key={`gp-${p}`} x1={PLOT.left} y1={py(p)} x2={PLOT.right} y2={py(p)} strokeWidth={1} style={{ stroke: 'var(--border)' }} />
      ))}

      {/* Axes */}
      <line x1={PLOT.left} y1={PLOT.bottom} x2={PLOT.right} y2={PLOT.bottom} strokeWidth={1} style={{ stroke: 'var(--fg-subtle)' }} />
      <line x1={PLOT.left} y1={PLOT.top} x2={PLOT.left} y2={PLOT.bottom} strokeWidth={1} style={{ stroke: 'var(--fg-subtle)' }} />

      {vTicks.filter((v) => v <= vMax).map((v) => (
        <Label key={`tv-${v}`} x={px(v)} y={PLOT.bottom + 16} fontSize={TICK} fill="var(--fg-muted)">
          {v}
        </Label>
      ))}
      {pTicks.filter((p) => p <= pMax).map((p) => (
        <Label key={`tp-${p}`} x={PLOT.left - 8} y={py(p)} textAnchor="end" fontSize={TICK} fill="var(--fg-muted)">
          {p}
        </Label>
      ))}

      <Label x={PLOT.right} y={PLOT.bottom + 36} textAnchor="end" fontSize={TICK + 1} fill="var(--fg)">
        <tspan className="sym">V</tspan> / L
      </Label>
      <Label x={PLOT.left - 8} y={PLOT.top - 12} textAnchor="end" fontSize={TICK + 1} fill="var(--fg)">
        <tspan className="sym">p</tspan> / atm
      </Label>

      {/* Isotherm: the locus of the reversible path at this temperature */}
      {nRT !== undefined && (
        <polyline points={isotherm} fill="none" strokeWidth={1.2} strokeDasharray="4 4" style={{ stroke: 'var(--fg-subtle)' }} />
      )}

      {/* Work area under the shaded path */}
      {series
        .filter((s) => s.id === shade)
        .map((s) => {
          const w = pathWork(s.points)
          const fill = w < 0 ? 'var(--work)' : 'var(--heat)'
          return (
            <polygon
              key={`area-${s.id}`}
              points={toPoints(workAreaPolygon(s.points), px, py)}
              style={{ fill }}
              opacity={0.2 * drawn}
              data-testid="pv-work-area"
            />
          )
        })}

      {/* Paths, drawn in by `progress` */}
      {series.map((s) => (
        <path
          key={`path-${s.id}`}
          d={seriesPath(s.points, s.style ?? 'straight', px, py)}
          fill="none"
          strokeWidth={s.tone === 'fg' ? 2.2 : 2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ stroke: TONE_VAR[s.tone ?? 'accent'] }}
          pathLength={progress === undefined ? undefined : 1}
          strokeDasharray={progress === undefined ? undefined : '1 1'}
          strokeDashoffset={progress === undefined ? undefined : 1 - drawn}
          data-testid={`pv-path-${s.id}`}
        />
      ))}

      {/* Legend, in the empty top-right corner of the plot */}
      {series
        .filter((s) => s.label !== undefined)
        .map((s, i) => {
          const rowY = PLOT.top + 14 + i * 17
          return (
            <g key={`legend-${s.id}`}>
              <line x1={PLOT.right - 36} y1={rowY} x2={PLOT.right - 14} y2={rowY} strokeWidth={2.4} strokeLinecap="round" style={{ stroke: TONE_VAR[s.tone ?? 'accent'] }} />
              <Label x={PLOT.right - 44} y={rowY} textAnchor="end" fontSize={TICK} fill="var(--fg)">
                {s.label}
              </Label>
            </g>
          )
        })}
    </g>
  )
})
