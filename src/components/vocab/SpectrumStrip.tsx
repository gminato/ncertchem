import React, { forwardRef, useId } from 'react'
import { wavelengthToCss } from '@/lib/chem/wavelength-color'
import { Label } from './Label'

export type SpectrumMode = 'emission' | 'absorption' | 'continuous'

export interface SpectrumLine {
  /** Wavelength in nanometres. */
  nm: number
  /** Brightness from 0 to 1. Only used by the emission mode. Defaults to 1. */
  intensity?: number
}

export interface SpectrumStripProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  x?: number
  y?: number
  width?: number
  height?: number
  /** Visible range in nanometres, [min, max]. */
  rangeNm?: readonly [number, number]
  /** Spectral lines to draw on the strip. */
  lines?: readonly SpectrumLine[]
  /**
   * emission: a dim rainbow track with bright lines.
   * absorption: a bright rainbow with dark lines.
   * continuous: a full-strength rainbow with no lines.
   */
  mode?: SpectrumMode
  /** Wavelengths that get a tick and a label. Pass an empty array for none. */
  ticks?: readonly number[]
  tickFontSize?: number
  /** Prefix for the gradient id. Defaults to a stable id from useId. */
  idPrefix?: string
}

const DEFAULT_RANGE: readonly [number, number] = [380, 750]
const DEFAULT_TICKS = [400, 500, 600, 700]
/** Gradient stops are sampled every 10 nm, as in the earlier Bohr strip. */
const STOP_STEP_NM = 10
/** Emission lines overhang the track so they read as lines, not as tints. */
const EMISSION_OVERHANG = 8

/**
 * The x coordinate (in the strip's own units) of a wavelength. The strip spans
 * `rangeNm` from left to right, so `width` is the full track length.
 */
export function spectrumX(
  nm: number,
  width: number,
  rangeNm: readonly [number, number] = DEFAULT_RANGE
): number {
  const [min, max] = rangeNm
  return ((nm - min) / (max - min)) * width
}

/** Gradient stops for the visible range, as offsets from 0% to 100%. */
export function spectrumStops(
  rangeNm: readonly [number, number] = DEFAULT_RANGE
): { offset: string; color: string }[] {
  const [min, max] = rangeNm
  const stops: { offset: string; color: string }[] = []
  for (let nm = min; nm <= max; nm += STOP_STEP_NM) {
    stops.push({
      offset: `${(((nm - min) / (max - min)) * 100).toFixed(2)}%`,
      color: wavelengthToCss(nm),
    })
  }
  stops.push({ offset: '100%', color: wavelengthToCss(max) })
  return stops
}

/**
 * A visible-spectrum strip with optional spectral lines and wavelength ticks.
 * It draws no titles or captions: the caller labels it.
 */
export const SpectrumStrip = forwardRef<SVGGElement, SpectrumStripProps>(function SpectrumStrip(
  {
    x = 0,
    y = 0,
    width = 560,
    height = 14,
    rangeNm = DEFAULT_RANGE,
    lines = [],
    mode = 'emission',
    ticks = DEFAULT_TICKS,
    tickFontSize = 16,
    idPrefix,
    className,
    style,
    ...rest
  },
  ref
) {
  const generatedId = useId().replace(/[^a-zA-Z0-9]/g, '')
  const gradientId = `${idPrefix ?? 'spectrum'}-${generatedId}-gradient`
  const [rangeMin, rangeMax] = rangeNm
  const stops = spectrumStops(rangeNm)
  const radius = height / 2
  const visibleTicks = ticks.filter((nm) => nm >= rangeMin && nm <= rangeMax)
  const trackOpacity = mode === 'emission' ? 'var(--spectrum-track-opacity)' : undefined

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} style={style} {...rest}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          {stops.map((stop) => (
            <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
          ))}
        </linearGradient>
      </defs>

      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        rx={radius}
        fill={`url(#${gradientId})`}
        style={trackOpacity ? { opacity: trackOpacity } : undefined}
      />
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        rx={radius}
        fill="none"
        strokeWidth={0.8}
        style={{ stroke: 'var(--border)' }}
      />

      {visibleTicks.map((nm) => {
        const tx = spectrumX(nm, width, rangeNm)
        return (
          <g key={`tick-${nm}`}>
            <line
              x1={tx}
              x2={tx}
              y1={height}
              y2={height + 6}
              strokeWidth={1.2}
              style={{ stroke: 'var(--fg-subtle)' }}
            />
            <Label x={tx} y={height + 26} fontSize={tickFontSize} fill="var(--fg-subtle)">
              {nm} nm
            </Label>
          </g>
        )
      })}

      {mode === 'emission' &&
        lines.map((line) => {
          const lx = spectrumX(line.nm, width, rangeNm)
          const css = wavelengthToCss(line.nm)
          return (
            <line
              key={`line-${line.nm}`}
              x1={lx}
              x2={lx}
              y1={-EMISSION_OVERHANG}
              y2={height + EMISSION_OVERHANG}
              strokeWidth={3}
              strokeLinecap="round"
              data-testid="spectral-line"
              style={{
                stroke: css,
                opacity: line.intensity ?? 1,
                filter: `drop-shadow(0 0 calc(4px * var(--glow-strength)) ${css})`,
              }}
            />
          )
        })}

      {mode === 'absorption' &&
        lines.map((line) => {
          const lx = spectrumX(line.nm, width, rangeNm)
          return (
            <line
              key={`line-${line.nm}`}
              x1={lx}
              x2={lx}
              y1={-1}
              y2={height + 1}
              strokeWidth={2.2}
              strokeLinecap="butt"
              data-testid="spectral-line"
              style={{ stroke: 'var(--spectrum-track)', opacity: line.intensity ?? 1 }}
            />
          )
        })}
    </g>
  )
})
