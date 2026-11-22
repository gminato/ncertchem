'use client'

import React, { forwardRef, type ReactNode, type SVGAttributes } from 'react'
import { fractionAbove, maxwellBoltzmann, thetaFor } from './geometry'
import { PlotCurve, PlotFrame, PlotLine, PlotShade, TONE_VAR, usePlotScale, type PlotTone } from './Plot'

export interface MaxwellBoltzmannCurveProps extends Omit<SVGAttributes<SVGGElement>, 'children'> {
  x: number
  y: number
  width: number
  height: number
  /** Temperatures in kelvin, the first one is the reference. Each adds a curve. */
  temperatures: number[]
  /** The temperature at which the reference curve has its peak at `thetaRef / 2`. Default: the first temperature. */
  referenceT?: number
  /** Dimensionless θ for the reference temperature. Sets the width of the distribution. Default 2. */
  thetaRef?: number
  /** Activation energy, in the same dimensionless units as the x axis. */
  ea?: number
  /**
   * Schematic width ratio between successive temperatures. When set, curve i uses
   * θ = thetaRef × spread^i instead of the temperature ratio, so a 10 K step can be
   * drawn clearly. Each curve still has unit area. Default: from the temperatures.
   */
  spread?: number
  /** Right end of the energy axis. Default 6. */
  xMax?: number
  /** Stroke tone per temperature. Default neutral, reactant, product. */
  tones?: PlotTone[]
  /** Curve labels, already formatted, e.g. "300 K". Placed at each peak. */
  labels?: ReactNode[]
  eaLabel?: ReactNode
  /** Show the fraction of molecules above Eₐ as a shaded tail for each curve. */
  shadeTails?: boolean
  xTitle?: ReactNode
  yTitle?: ReactNode
}

const DEFAULT_TONES: PlotTone[] = ['neutral', 'reactant', 'product']

/** The dimensionless θ of each curve: from the temperatures, or the schematic spread when one is given. */
function thetasFor(temperatures: number[], Tref: number, thetaRef: number, spread?: number): number[] {
  if (spread !== undefined) return temperatures.map((_, i) => thetaRef * spread ** i)
  return temperatures.map((T) => thetaFor(T, Tref, thetaRef))
}

function EaMarker({ ea, label, ymax }: { ea: number; label?: ReactNode; ymax: number }) {
  const s = usePlotScale()
  return (
    <g aria-hidden="true">
      <PlotLine from={{ x: ea, y: s.domain.yMin }} to={{ x: ea, y: ymax }} tone="accent" dashed width={2} />
      {label !== undefined && (
        <text x={s.x(ea) + 8} y={s.box.top + 22} textAnchor="start" fontSize={15} fill="var(--accent)" stroke="var(--surface)" strokeWidth={4} paintOrder="stroke">
          {label}
        </text>
      )}
    </g>
  )
}

/** Curve names in the top-right corner of the frame, each with its stroke colour. */
function CurveLegend({ labels, tones }: { labels: ReactNode[]; tones: PlotTone[] }) {
  const s = usePlotScale()
  const right = s.box.left + s.box.width - 14
  return (
    <g aria-hidden="true">
      {labels.map((label, i) => {
        if (label === undefined) return null
        const yy = s.box.top + 22 + i * 22
        return (
          <g key={i}>
            <line x1={right - 96} x2={right - 76} y1={yy - 5} y2={yy - 5} stroke={TONE_VAR[tones[i % tones.length]]} strokeWidth={3} strokeLinecap="round" />
            <text x={right - 70} y={yy} textAnchor="start" fontSize={15} fill="var(--fg)" stroke="var(--surface)" strokeWidth={4} paintOrder="stroke">
              {label}
            </text>
          </g>
        )
      })}
    </g>
  )
}

/**
 * Maxwell–Boltzmann distributions at one or more temperatures. θ is proportional
 * to T and each curve has unit area, so a hotter sample is flatter, its peak is
 * further right and lower, and its shaded tail beyond Eₐ is larger.
 */
export const MaxwellBoltzmannCurve = forwardRef<SVGGElement, MaxwellBoltzmannCurveProps>(function MaxwellBoltzmannCurve(
  {
    x,
    y,
    width,
    height,
    temperatures,
    referenceT,
    thetaRef = 2,
    spread,
    ea = 2.2,
    xMax = 6,
    tones = DEFAULT_TONES,
    labels,
    eaLabel,
    shadeTails = true,
    xTitle = 'Kinetic energy, E',
    yTitle = 'Fraction of molecules, f(E)',
    ...rest
  },
  ref
) {
  const Tref = referenceT ?? temperatures[0]
  const thetas = thetasFor(temperatures, Tref, thetaRef, spread)
  // Hotter curves (larger θ) are drawn last, so their semi-transparent tails sit on top.
  const tailOrder = thetas.map((_, i) => i).sort((a, b) => thetas[a] - thetas[b])
  const peakHeights = thetas.map((th) => maxwellBoltzmann(th / 2, th))
  const yMax = Math.max(...peakHeights) * 1.14
  const f = (th: number) => (E: number) => maxwellBoltzmann(E, th)
  return (
    <g ref={ref} {...rest}>
      <PlotFrame
        x={x}
        y={y}
        width={width}
        height={height}
        domain={{ xMin: 0, xMax, yMin: 0, yMax }}
        yTickFormat={(v) => v.toFixed(2)}
        xTickFormat={(v) => String(Math.round(v * 10) / 10)}
        xTitle={xTitle}
        yTitle={yTitle}
      >
        {shadeTails &&
          tailOrder.map((i) => (
            <PlotShade key={`tail${i}`} fn={f(thetas[i])} from={ea} to={xMax} tone={tones[i % tones.length]} opacity={0.32} />
          ))}
        <EaMarker ea={ea} label={eaLabel} ymax={yMax} />
        {thetas.map((th, i) => (
          <PlotCurve key={`curve${i}`} fn={f(th)} from={0} to={xMax} samples={240} tone={tones[i % tones.length]} width={3} />
        ))}
        {labels && <CurveLegend labels={labels} tones={tones} />}
      </PlotFrame>
    </g>
  )
})

/** The fraction of molecules above Eₐ at each temperature, for captions and tests. */
export function tailFractions(temperatures: number[], ea: number, referenceT?: number, thetaRef = 2, spread?: number): number[] {
  const Tref = referenceT ?? temperatures[0]
  return thetasFor(temperatures, Tref, thetaRef, spread).map((th) => fractionAbove(ea, th))
}
