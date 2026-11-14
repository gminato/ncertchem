import React from 'react'
import { linearScale, niceTicks, placeCallouts, trendPathSegments } from './trend'
import type { TrendPoint } from './trend'
import styles from './TrendChart.module.css'

export interface TrendHighlight {
  /** Index into `points`. */
  index: number
  text: string
}

export interface TrendChartProps {
  points: readonly TrendPoint[]
  /** Axis title for the x-axis, for example "Atomic number, Z". */
  xLabel?: string
  /** Axis title for the y-axis, with its unit, for example "First ionisation energy (eV)". */
  yLabel: string
  /** Fixed y bounds. Defaults to nice bounds around the data. */
  yDomain?: readonly [number, number]
  /** Approximate number of y gridlines. */
  ticks?: number
  /** 0 to 1. Draws the line in. Undefined means fully drawn. */
  progress?: number
  highlight?: readonly TrendHighlight[]
  variant?: 'line' | 'bar'
  width?: number
  height?: number
  /** Accessible name for the chart. */
  title: string
  className?: string
}

const MARGIN = { left: 64, right: 24, top: 28, bottom: 58 }

function decimalsFor(step: number): number {
  if (step >= 1) return 0
  return Math.min(4, Math.ceil(-Math.log10(step)))
}

/**
 * A line or bar chart of a property against atomic number or position, with
 * element symbols on the x-axis, gridlines, and optional callouts for
 * anomalies. Colours come from the existing tokens.
 */
export function TrendChart({
  points,
  xLabel,
  yLabel,
  yDomain,
  ticks: tickCount = 5,
  progress,
  highlight = [],
  variant = 'line',
  width = 640,
  height = 320,
  title,
  className,
}: TrendChartProps) {
  const plotW = width - MARGIN.left - MARGIN.right
  const plotH = height - MARGIN.top - MARGIN.bottom

  const values = points.map((p) => p.y).filter((v): v is number => v !== null)
  const dataMin = values.length ? Math.min(...values) : 0
  const dataMax = values.length ? Math.max(...values) : 1
  const axis = yDomain
    ? { ticks: niceTicks(yDomain[0], yDomain[1], tickCount).ticks, lo: yDomain[0], hi: yDomain[1] }
    : niceTicks(dataMin, dataMax, tickCount)
  const yLo = axis.lo
  const yHi = axis.hi
  const step = axis.ticks.length > 1 ? axis.ticks[1] - axis.ticks[0] : 1
  const decimals = decimalsFor(step)

  const xs = points.map((p) => p.x)
  const xMin = xs.length ? Math.min(...xs) : 0
  const xMax = xs.length ? Math.max(...xs) : 1
  const xScale = linearScale(
    xMin === xMax ? [xMin - 1, xMax + 1] : [xMin, xMax],
    [MARGIN.left, MARGIN.left + plotW]
  )
  const yScale = linearScale([yLo, yHi], [MARGIN.top + plotH, MARGIN.top])

  const clamped = progress === undefined ? 1 : Math.min(1, Math.max(0, progress))
  const segments = trendPathSegments(points, xScale, yScale)
  const barWidth = points.length > 0 ? Math.max(4, (plotW / points.length) * 0.6) : 0
  const baselineY = yScale(Math.max(yLo, Math.min(0, yHi)))

  const calloutInputs = highlight
    .map((h) => {
      const point = points[h.index]
      if (!point || point.y === null) return null
      return { x: xScale(point.x), y: yScale(point.y), text: h.text }
    })
    .filter((c): c is { x: number; y: number; text: string } => c !== null)
  const callouts = placeCallouts(calloutInputs)
  const highlightedIndexes = new Set(highlight.map((h) => h.index))

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={`${styles.chart} ${className ?? ''}`}
      role="img"
      aria-label={title}
      data-variant={variant}
    >
      {axis.ticks.map((t) => {
        const y = yScale(t)
        return (
          <g key={`t${t}`}>
            <line
              x1={MARGIN.left}
              x2={MARGIN.left + plotW}
              y1={y}
              y2={y}
              className={styles.grid}
            />
            <text x={MARGIN.left - 10} y={y + 4} textAnchor="end" className={styles.tick}>
              {t.toFixed(decimals)}
            </text>
          </g>
        )
      })}

      <line
        x1={MARGIN.left}
        x2={MARGIN.left + plotW}
        y1={MARGIN.top + plotH}
        y2={MARGIN.top + plotH}
        className={styles.axis}
      />

      <text
        transform={`translate(16 ${MARGIN.top + plotH / 2}) rotate(-90)`}
        textAnchor="middle"
        className={styles.axisLabel}
      >
        {yLabel}
      </text>
      {xLabel && (
        <text x={MARGIN.left + plotW / 2} y={height - 8} textAnchor="middle" className={styles.axisLabel}>
          {xLabel}
        </text>
      )}

      {variant === 'bar'
        ? points.map((p, i) => {
            if (p.y === null) return null
            const cx = xScale(p.x)
            const top = yScale(p.y)
            const h = Math.abs(baselineY - top) * clamped
            return (
              <rect
                key={`b${p.label}`}
                x={cx - barWidth / 2}
                y={p.y >= 0 ? baselineY - h : baselineY}
                width={barWidth}
                height={h}
                rx={3}
                className={highlightedIndexes.has(i) ? styles.barHighlight : styles.bar}
              />
            )
          })
        : segments.map((seg, i) => (
            <polyline
              key={`s${i}`}
              points={seg.map((pt) => `${pt.x.toFixed(2)},${pt.y.toFixed(2)}`).join(' ')}
              className={styles.line}
              pathLength={1}
              strokeDasharray="1 1"
              strokeDashoffset={1 - clamped}
            />
          ))}

      {variant === 'line' &&
        points.map((p, i) => {
          if (p.y === null) return null
          const isHighlight = highlightedIndexes.has(i)
          return (
            <circle
              key={`pt${p.label}`}
              cx={xScale(p.x)}
              cy={yScale(p.y)}
              r={isHighlight ? 5.5 : 3.5}
              className={isHighlight ? styles.pointHighlight : styles.point}
              style={{ opacity: clamped }}
            />
          )
        })}

      {points.map((p) => (
        <text
          key={`x${p.label}`}
          x={xScale(p.x)}
          y={MARGIN.top + plotH + 18}
          textAnchor="middle"
          className={styles.symbol}
        >
          {p.label}
        </text>
      ))}

      {callouts.map((c) => (
        <g key={`c${c.text}`}>
          <line x1={c.x} x2={c.labelX} y1={c.y - 6} y2={c.labelY + 4} className={styles.leader} />
          <text x={c.labelX} y={c.labelY} textAnchor="middle" className={styles.callout}>
            {c.text}
          </text>
        </g>
      ))}
    </svg>
  )
}
