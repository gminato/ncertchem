'use client'

import { Label } from '@/components/vocab'
import { wavelengthToCss } from '@/lib/chem/wavelength-color'
import { AXIS_TICKS_NM, AXIS_ZONES, VISIBLE_MAX_NM, VISIBLE_MIN_NM, spectrumAxisFraction } from '@/lib/chem/hydrogen-spectrum'
import type { SeriesName } from '@/lib/chem/bohr'
import { seriesToken, stripX, type SeriesBracket } from './hydrogen-spectrum-model'

export interface StripLine {
  key: string
  nm: number
  onAxis: boolean
  series: SeriesName
  /** 0 to 1: how far the line has lit (emission) or darkened (absorption). */
  lit: number
}

export interface HydrogenStripProps {
  x: number
  y: number
  width: number
  height: number
  mode: 'emission' | 'absorption'
  lines: readonly StripLine[]
  brackets: readonly SeriesBracket[]
  showSeries: boolean
  idPrefix: string
  reducedMotion: boolean
}

const TICK_FONT = 14
/** Brackets stack above the strip, one row per series. */
const ROW_GAP = 22
const BRACKET_BASE = 40
const BRACKET_TICK = 6

/** Gradient samples: the visible range every 10 nm, in the visible zone's linear coordinates. */
function gradientStops(uvColour: string, irColour: string) {
  const stops: { offset: number; colour: string }[] = []
  const uvEnd = AXIS_ZONES.ultraviolet
  const visEnd = uvEnd + AXIS_ZONES.visible
  stops.push({ offset: 0, colour: uvColour })
  stops.push({ offset: uvEnd, colour: uvColour })
  for (let nm = VISIBLE_MIN_NM; nm <= VISIBLE_MAX_NM; nm += 10) {
    const offset = uvEnd + (AXIS_ZONES.visible * (nm - VISIBLE_MIN_NM)) / (VISIBLE_MAX_NM - VISIBLE_MIN_NM)
    stops.push({ offset, colour: wavelengthToCss(nm) })
  }
  stops.push({ offset: visEnd, colour: wavelengthToCss(VISIBLE_MAX_NM) })
  stops.push({ offset: visEnd, colour: irColour })
  stops.push({ offset: 1, colour: irColour })
  return stops
}

/**
 * The spectrum strip for hydrogen, from 90 nm to 2000 nm. The ultraviolet and
 * infrared zones are drawn on a log scale, and the visible zone in true
 * colours on a linear one. Lines accumulate as the Learner makes transitions.
 */
export function HydrogenStrip({
  x,
  y,
  width,
  height,
  mode,
  lines,
  brackets,
  showSeries,
  idPrefix,
  reducedMotion,
}: HydrogenStripProps) {
  const gradientId = `${idPrefix}-hs-track`
  const stops = gradientStops(wavelengthToCss(360), wavelengthToCss(900))
  const trackOpacity = mode === 'emission' ? 'var(--spectrum-track-opacity)' : undefined
  const uvEdge = AXIS_ZONES.ultraviolet * width
  const visEdge = (AXIS_ZONES.ultraviolet + AXIS_ZONES.visible) * width

  return (
    <g transform={`translate(${x}, ${y})`} data-testid="hydrogen-strip" data-mode={mode}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          {stops.map((stop, i) => (
            <stop key={i} offset={`${(stop.offset * 100).toFixed(2)}%`} stopColor={stop.colour} />
          ))}
        </linearGradient>
      </defs>

      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        rx={height / 2}
        fill={`url(#${gradientId})`}
        style={trackOpacity ? { opacity: trackOpacity } : undefined}
      />
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        rx={height / 2}
        fill="none"
        strokeWidth={0.8}
        style={{ stroke: 'var(--border)' }}
      />

      {/* Zone boundaries at 380 nm and 750 nm */}
      {[uvEdge, visEdge].map((edge) => (
        <line
          key={`zone-${edge}`}
          x1={edge}
          x2={edge}
          y1={-4}
          y2={height + 4}
          strokeWidth={1}
          strokeDasharray="2 3"
          style={{ stroke: 'var(--fg-subtle)' }}
        />
      ))}

      {AXIS_TICKS_NM.map((nm) => {
        const tx = stripX(nm, width)
        return (
          <g key={`tick-${nm}`}>
            <line
              x1={tx}
              x2={tx}
              y1={height}
              y2={height + 5}
              strokeWidth={1.2}
              style={{ stroke: 'var(--fg-subtle)' }}
            />
            <Label x={tx} y={height + 22} fontSize={TICK_FONT} fill="var(--fg-subtle)">
              {nm} nm
            </Label>
          </g>
        )
      })}

      <Label x={uvEdge / 2} y={-16} fontSize={TICK_FONT} fill="var(--fg-muted)">
        ultraviolet
      </Label>
      <Label x={(uvEdge + visEdge) / 2} y={-16} fontSize={TICK_FONT} fill="var(--fg-muted)">
        visible
      </Label>
      <Label x={(visEdge + width) / 2} y={-16} fontSize={TICK_FONT} fill="var(--fg-muted)">
        infrared (log scale)
      </Label>

      {/* Series brackets, with labels */}
      {showSeries &&
        brackets.map((bracket) => {
          const x1 = stripX(bracket.fromNm, width)
          const x2 = Math.max(x1 + 16, stripX(bracket.toNm, width))
          const by = -BRACKET_BASE - bracket.row * ROW_GAP
          const colour = seriesToken(bracket.series)
          const labelAtEnd = x2 > width - 90
          const labelX = labelAtEnd ? x2 : (x1 + x2) / 2
          const text = bracket.offScale ? `${bracket.series} (part off scale)` : bracket.series
          return (
            <g key={`bracket-${bracket.series}`} data-testid="series-bracket" data-series={bracket.series}>
              <path
                d={`M${x1},${by + BRACKET_TICK} L${x1},${by} L${x2},${by} L${x2},${by + BRACKET_TICK}`}
                fill="none"
                strokeWidth={1.6}
                style={{ stroke: colour }}
              />
              <Label
                x={labelX}
                y={by - 7}
                textAnchor={labelAtEnd ? 'end' : 'middle'}
                fontSize={TICK_FONT}
                halo
                fill={colour}
              >
                {text}
              </Label>
            </g>
          )
        })}

      {/* Spectral lines */}
      {lines.map((line) => {
        const lx = stripX(Math.min(line.nm, 2000), width)
        const colour = showSeries ? seriesToken(line.series) : wavelengthToCss(line.nm)
        if (mode === 'absorption') {
          return (
            <line
              key={`abs-${line.key}`}
              x1={lx}
              x2={lx}
              y1={-1}
              y2={height + 1}
              strokeWidth={2.4}
              strokeLinecap="butt"
              data-testid="spectral-line"
              data-offscale={line.onAxis ? 'false' : 'true'}
              style={{ stroke: 'var(--spectrum-track)', opacity: line.lit }}
            />
          )
        }
        return (
          <line
            key={`em-${line.key}`}
            x1={lx}
            x2={lx}
            y1={-8}
            y2={height + 8}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={line.onAxis ? undefined : '3 3'}
            data-testid="spectral-line"
            data-offscale={line.onAxis ? 'false' : 'true'}
            style={{
              stroke: colour,
              opacity: line.lit,
              filter: reducedMotion ? undefined : `drop-shadow(0 0 calc(4px * var(--glow-strength)) ${colour})`,
            }}
          />
        )
      })}
    </g>
  )
}
