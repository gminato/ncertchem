'use client'

import React, { createContext, forwardRef, useContext, useId, type ReactNode, type SVGAttributes } from 'react'
import { clipSegment, makePlotScale, niceTicks, samples, type Box, type Domain, type PlotScale, type Point } from './geometry'

/** Stroke tones. Each one maps to a kinetics token (tokens.css) or a shared site token. */
export type PlotTone = 'reactant' | 'product' | 'neutral' | 'accent' | 'catalyst'

export const TONE_VAR: Readonly<Record<PlotTone, string>> = {
  reactant: 'var(--kin-reactant)',
  product: 'var(--kin-product)',
  neutral: 'var(--fg-muted)',
  accent: 'var(--accent)',
  catalyst: 'var(--kin-catalyst)',
}

const TICK_SIZE = 14
const LABEL_SIZE = 15
/** Text gets a halo the colour of the frame, so labels stay legible where they cross a stroke. */
const HALO = { stroke: 'var(--surface)', strokeWidth: 4, paintOrder: 'stroke' as const, strokeLinejoin: 'round' as const }

const PlotContext = createContext<PlotScale | null>(null)

/** The scale of the nearest PlotFrame. Plot children draw in data coordinates through it. */
export function usePlotScale(): PlotScale {
  const scale = useContext(PlotContext)
  if (!scale) throw new Error('usePlotScale must be used inside a PlotFrame')
  return scale
}

export interface PlotFrameProps extends Omit<SVGAttributes<SVGGElement>, 'children'> {
  /** Pixel box of the data window, in the parent's coordinates. Leave room on the left and below for tick and axis labels. */
  x: number
  y: number
  width: number
  height: number
  domain: Domain
  xTicks?: number[]
  yTicks?: number[]
  xTickFormat?: (v: number) => string
  yTickFormat?: (v: number) => string
  /** Axis titles as nodes, so Sub and Sup work, e.g. "[R] / mol L⁻¹". */
  xTitle?: ReactNode
  yTitle?: ReactNode
  grid?: boolean
  children?: ReactNode
}

const fmt = (v: number) => (Math.abs(v) < 1e-9 ? '0' : String(Number(v.toPrecision(6))).replace('-', '−'))

/**
 * Axes, ticks, optional gridlines and axis titles for a data window. The y axis
 * sits on the left edge (xMin) and the x axis on the bottom edge (yMin), so a
 * negative range draws below zero. Children are clipped to the window.
 */
export const PlotFrame = forwardRef<SVGGElement, PlotFrameProps>(function PlotFrame(
  { x, y, width, height, domain, xTicks, yTicks, xTickFormat = fmt, yTickFormat = fmt, xTitle, yTitle, grid = true, children, ...rest },
  ref
) {
  const clipId = `kin-clip-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const box: Box = { left: x, top: y, width, height }
  const scale = makePlotScale(domain, box)
  const xs = xTicks ?? niceTicks(domain.xMin, domain.xMax, 5)
  const ys = yTicks ?? niceTicks(domain.yMin, domain.yMax, 5)
  const right = x + width
  const bottom = y + height
  return (
    <PlotContext.Provider value={scale}>
      <g ref={ref} aria-hidden="true" {...rest}>
        <defs>
          <clipPath id={clipId}>
            <rect x={x} y={y} width={width} height={height} />
          </clipPath>
        </defs>
        <rect x={x} y={y} width={width} height={height} rx={6} fill="var(--surface)" fillOpacity={0.55} stroke="var(--kin-grid)" strokeWidth={1} />
        {grid &&
          xs.map((v) => (
            <line key={`gx${v}`} x1={scale.x(v)} x2={scale.x(v)} y1={y} y2={bottom} stroke="var(--kin-grid)" strokeWidth={1} />
          ))}
        {grid &&
          ys.map((v) => (
            <line key={`gy${v}`} x1={x} x2={right} y1={scale.y(v)} y2={scale.y(v)} stroke="var(--kin-grid)" strokeWidth={1} />
          ))}
        <g clipPath={`url(#${clipId})`}>{children}</g>
        {/* Axes: y on the left edge, x on the bottom edge */}
        <line x1={x} x2={x} y1={y} y2={bottom} stroke="var(--kin-axis)" strokeWidth={1.6} strokeLinecap="round" />
        <line x1={x} x2={right} y1={bottom} y2={bottom} stroke="var(--kin-axis)" strokeWidth={1.6} strokeLinecap="round" />
        {xs.map((v) => (
          <g key={`tx${v}`}>
            <line x1={scale.x(v)} x2={scale.x(v)} y1={bottom} y2={bottom + 5} stroke="var(--kin-axis)" strokeWidth={1.4} />
            <text x={scale.x(v)} y={bottom + 22} textAnchor="middle" fontSize={TICK_SIZE} fill="var(--fg-muted)">
              {xTickFormat(v)}
            </text>
          </g>
        ))}
        {ys.map((v) => (
          <g key={`ty${v}`}>
            <line x1={x - 5} x2={x} y1={scale.y(v)} y2={scale.y(v)} stroke="var(--kin-axis)" strokeWidth={1.4} />
            <text x={x - 9} y={scale.y(v) + 5} textAnchor="end" fontSize={TICK_SIZE} fill="var(--fg-muted)">
              {yTickFormat(v)}
            </text>
          </g>
        ))}
        {xTitle && (
          <text x={x + width / 2} y={bottom + 48} textAnchor="middle" fontSize={LABEL_SIZE} fill="var(--fg)">
            {xTitle}
          </text>
        )}
        {yTitle && (
          <text
            transform={`translate(${x - 52} ${y + height / 2}) rotate(-90)`}
            textAnchor="middle"
            fontSize={LABEL_SIZE}
            fill="var(--fg)"
          >
            {yTitle}
          </text>
        )}
      </g>
    </PlotContext.Provider>
  )
})

export interface PlotCurveProps extends Omit<SVGAttributes<SVGPathElement>, 'points'> {
  /** Either explicit data points, or a function sampled from `from` to `to`. */
  points?: ReadonlyArray<readonly [number, number]>
  fn?: (x: number) => number
  from?: number
  to?: number
  samples?: number
  tone?: PlotTone
  width?: number
  dashed?: boolean
}

/** A curve in data coordinates. Clipped to the frame by the parent PlotFrame. */
export function PlotCurve({ points, fn, from, to, samples: n = 160, tone = 'reactant', width = 3, dashed, ...rest }: PlotCurveProps) {
  const s = usePlotScale()
  const pts: Array<[number, number]> = points
    ? points.map(([px, py]) => [px, py])
    : fn
      ? samples(from ?? s.domain.xMin, to ?? s.domain.xMax, n).map((v) => [v, fn(v)] as [number, number])
      : []
  const d = pts
    .map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${s.x(px).toFixed(2)} ${s.y(py).toFixed(2)}`)
    .join(' ')
  return (
    <path
      d={d}
      fill="none"
      stroke={TONE_VAR[tone]}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dashed ? '7 6' : undefined}
      {...rest}
    />
  )
}

export interface PlotLineProps extends Omit<SVGAttributes<SVGPathElement>, 'from' | 'to'> {
  /** A line through a point with a slope (a tangent, or a straight ln[R] plot). */
  through?: Point
  slope?: number
  /** A line through two points (a secant). */
  from?: Point
  to?: Point
  /** Two-point lines stop at the points unless extend is set. Slope lines always run across the frame. */
  extend?: boolean
  tone?: PlotTone
  width?: number
  dashed?: boolean
}

/** A straight line in data coordinates, clipped exactly to the frame. */
export function PlotLine({ through, slope, from, to, extend, tone = 'neutral', width = 2.4, dashed, ...rest }: PlotLineProps) {
  const s = usePlotScale()
  let a: Point
  let b: Point
  let ext: boolean
  if (from && to) {
    a = { x: s.x(from.x), y: s.y(from.y) }
    b = { x: s.x(to.x), y: s.y(to.y) }
    ext = extend ?? false
  } else if (through && slope !== undefined) {
    a = { x: s.x(through.x), y: s.y(through.y) }
    // Pixel direction of a unit data step in x: (1, −slope) with the pixel scales applied.
    const dxPx = s.x(through.x + 1) - s.x(through.x)
    const dyPx = s.y(through.y + slope) - s.y(through.y)
    b = { x: a.x + dxPx, y: a.y + dyPx }
    ext = true
  } else {
    return null
  }
  if (ext) {
    const dx = b.x - a.x
    const dy = b.y - a.y
    const far = 1e5
    const len = Math.hypot(dx, dy) || 1
    const ux = (dx / len) * far
    const uy = (dy / len) * far
    a = { x: a.x - ux, y: a.y - uy }
    b = { x: b.x + ux, y: b.y + uy }
  }
  const seg = clipSegment(a, b, s.box)
  if (!seg) return null
  const [p, q] = seg
  return (
    <path
      d={`M${p.x.toFixed(2)} ${p.y.toFixed(2)} L${q.x.toFixed(2)} ${q.y.toFixed(2)}`}
      fill="none"
      stroke={TONE_VAR[tone]}
      strokeWidth={width}
      strokeLinecap="round"
      strokeDasharray={dashed ? '6 6' : undefined}
      {...rest}
    />
  )
}

export type LabelSide = 'above' | 'below' | 'left' | 'right' | 'ne' | 'nw' | 'se' | 'sw'

export interface PlotPointProps {
  at: Point
  tone?: PlotTone
  label?: ReactNode
  /** Where the label sits relative to the marker, off the stroke. */
  side?: LabelSide
}

/** A marker on the data, with an optional label placed off to one side. */
export function PlotPoint({ at, tone = 'reactant', label, side = 'ne' }: PlotPointProps) {
  const s = usePlotScale()
  const px = s.x(at.x)
  const py = s.y(at.y)
  const off = 14
  const pos: Record<LabelSide, { dx: number; dy: number; anchor: 'start' | 'middle' | 'end' }> = {
    above: { dx: 0, dy: -off, anchor: 'middle' },
    below: { dx: 0, dy: off + 10, anchor: 'middle' },
    left: { dx: -off, dy: 5, anchor: 'end' },
    right: { dx: off, dy: 5, anchor: 'start' },
    ne: { dx: off, dy: -off + 2, anchor: 'start' },
    nw: { dx: -off, dy: -off + 2, anchor: 'end' },
    se: { dx: off, dy: off + 10, anchor: 'start' },
    sw: { dx: -off, dy: off + 10, anchor: 'end' },
  }
  const p = pos[side]
  return (
    <g aria-hidden="true">
      <circle cx={px} cy={py} r={6.5} fill="var(--surface)" />
      <circle cx={px} cy={py} r={5} fill={TONE_VAR[tone]} />
      {label !== undefined && (
        <text x={px + p.dx} y={py + p.dy} textAnchor={p.anchor} fontSize={LABEL_SIZE} fill="var(--fg)" {...HALO}>
          {label}
        </text>
      )}
    </g>
  )
}

export interface PlotShadeProps {
  /** The curve whose area is shaded, as points or a function. */
  points?: ReadonlyArray<readonly [number, number]>
  fn?: (x: number) => number
  from: number
  to: number
  /** Area is shaded down to this data y (default: the bottom of the window). */
  baseline?: number
  tone?: PlotTone
  opacity?: number
  samples?: number
}

/** The area between a curve and a baseline, for a range of x. */
export function PlotShade({ points, fn, from, to, baseline, tone = 'reactant', opacity = 0.2, samples: n = 120 }: PlotShadeProps) {
  const s = usePlotScale()
  const base = baseline ?? s.domain.yMin
  const xs = samples(from, to, n)
  const ys = points
    ? xs.map((v) => interpolate(points, v))
    : xs.map((v) => (fn ? fn(v) : 0))
  const top = xs.map((v, i) => `${i === 0 ? 'M' : 'L'}${s.x(v).toFixed(2)} ${s.y(ys[i]).toFixed(2)}`).join(' ')
  const d = `${top} L${s.x(to).toFixed(2)} ${s.y(base).toFixed(2)} L${s.x(from).toFixed(2)} ${s.y(base).toFixed(2)} Z`
  return <path d={d} fill={TONE_VAR[tone]} fillOpacity={opacity} stroke="none" />
}

/** Piecewise-linear lookup over sorted points. Used for shading a sampled curve. */
function interpolate(points: ReadonlyArray<readonly [number, number]>, x: number): number {
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i]
    const [x1, y1] = points[i + 1]
    if (x >= x0 && x <= x1) return x1 === x0 ? y1 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
  }
  return points[points.length - 1]?.[1] ?? 0
}

export interface PlotGuideProps {
  at: Point
  /** Which axes to drop to. Default both. */
  to?: 'x' | 'y' | 'both'
  /** Value labels, already formatted, e.g. "t = 40 s". */
  xLabel?: ReactNode
  yLabel?: ReactNode
  tone?: PlotTone
}

/** Dashed drop-lines from a point to the axes, with value labels at the axes. */
export function PlotGuide({ at, to = 'both', xLabel, yLabel, tone = 'neutral' }: PlotGuideProps) {
  const s = usePlotScale()
  const px = s.x(at.x)
  const py = s.y(at.y)
  const { left, top, height } = s.box
  const bottom = top + height
  const showX = to !== 'y'
  const showY = to !== 'x'
  return (
    <g aria-hidden="true">
      {showX && <line x1={px} x2={px} y1={py} y2={bottom} stroke={TONE_VAR[tone]} strokeWidth={1.6} strokeDasharray="5 5" />}
      {showY && <line x1={left} x2={px} y1={py} y2={py} stroke={TONE_VAR[tone]} strokeWidth={1.6} strokeDasharray="5 5" />}
      {showX && xLabel !== undefined && (
        <text x={px} y={bottom - 8} textAnchor="middle" fontSize={TICK_SIZE} fill="var(--fg)" {...HALO}>
          {xLabel}
        </text>
      )}
      {showY && yLabel !== undefined && (
        <text x={left + 8} y={py - 7} textAnchor="start" fontSize={TICK_SIZE} fill="var(--fg)" {...HALO}>
          {yLabel}
        </text>
      )}
    </g>
  )
}

export interface PlotSlopeTriangleProps {
  /** The corner where the run starts, in data coordinates. */
  at: Point
  /** Run, in data x units. */
  dx: number
  /** Slope of the line, in data y per data x. */
  slope: number
  dxLabel?: ReactNode
  dyLabel?: ReactNode
  tone?: PlotTone
}

/** Δx and Δy legs for the slope of a straight line, with labels. */
export function PlotSlopeTriangle({ at, dx, slope, dxLabel, dyLabel, tone = 'neutral' }: PlotSlopeTriangleProps) {
  const s = usePlotScale()
  const x1 = s.x(at.x)
  const y1 = s.y(at.y)
  const x2 = s.x(at.x + dx)
  const y2 = s.y(at.y + slope * dx)
  const stroke = TONE_VAR[tone]
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2
  // The run leg always sits at the bottom of the triangle, so its label goes below it, away from the line.
  // A falling line puts the rise leg on the left; a rising line puts it on the right. Both labels sit outside.
  const falling = slope < 0
  const d = falling ? `M${x1} ${y1} V${y2} H${x2}` : `M${x1} ${y1} H${x2} V${y2}`
  const runY = Math.max(y1, y2)
  return (
    <g aria-hidden="true">
      <path d={d} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" />
      {dxLabel !== undefined && (
        <text x={midX} y={runY + TICK_SIZE + 6} textAnchor="middle" fontSize={TICK_SIZE + 1} fill="var(--fg)" {...HALO}>
          {dxLabel}
        </text>
      )}
      {dyLabel !== undefined && (
        <text x={falling ? x1 - 8 : x2 + 8} y={midY + 5} textAnchor={falling ? 'end' : 'start'} fontSize={TICK_SIZE + 1} fill="var(--fg)" {...HALO}>
          {dyLabel}
        </text>
      )}
    </g>
  )
}
