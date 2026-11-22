'use client'

import React, { forwardRef, type ReactNode, type SVGAttributes } from 'react'
import { linear, smoothThrough, type Point } from './geometry'

export interface EnergyProfileProps extends Omit<SVGAttributes<SVGGElement>, 'children'> {
  /** Pixel box of the drawing area. Leave about 60 units on the left and 40 below for the axis titles. */
  x?: number
  y?: number
  width?: number
  height?: number
  /** Energy of the reactants and of the products. Used when `profile` is not given. */
  reactant: number
  product: number
  /** Height of the single activated complex, when the reaction has one step. */
  peak?: number
  /**
   * Stationary energies from the reactants to the products: reactants, activated
   * complex, intermediate, activated complex, ..., products. Odd indices are peaks,
   * even indices are valleys. Overrides `reactant`, `product` and `peak`.
   */
  profile?: number[]
  /** A catalysed path with the same length as `profile`, lower peaks, and the same end levels. */
  catalysed?: number[]
  /** Labels, already formatted. Each is optional. */
  reactantsLabel?: ReactNode
  productsLabel?: ReactNode
  peakLabel?: ReactNode
  intermediateLabel?: ReactNode
  catalysedLabel?: ReactNode
  /** Eₐ: the arrow from the reactant level up to the first peak. */
  eaLabel?: ReactNode
  /** ΔrH: the arrow from the reactant level to the product level. */
  dhLabel?: ReactNode
  xTitle?: ReactNode
  yTitle?: ReactNode
}

const LEFT_PAD = 0.02
const RIGHT_PAD = 0.86
const STATION_FROM = 0.14
const STATION_TO = 0.7
const EA_OFFSET = 0.06
const DH_FRACTION = 0.94

/** Draws a vertical double-headed arrow between two pixel heights. */
function VArrow({ x, y1, y2, tone }: { x: number; y1: number; y2: number; tone: string }) {
  const top = Math.min(y1, y2)
  const bottom = Math.max(y1, y2)
  const head = 6
  return (
    <g stroke={tone} fill={tone} strokeWidth={2}>
      <line x1={x} x2={x} y1={top} y2={bottom} strokeLinecap="round" />
      <path d={`M${x - head * 0.7} ${top + head} L${x} ${top} L${x + head * 0.7} ${top + head} Z`} stroke="none" />
      <path d={`M${x - head * 0.7} ${bottom - head} L${x} ${bottom} L${x + head * 0.7} ${bottom - head} Z`} stroke="none" />
    </g>
  )
}

/** Potential energy against reaction coordinate: one hump or several, with optional catalysed path, Eₐ and ΔrH. */
export const EnergyProfile = forwardRef<SVGGElement, EnergyProfileProps>(function EnergyProfile(
  {
    x = 0,
    y = 0,
    width = 560,
    height = 300,
    reactant,
    product,
    peak,
    profile,
    catalysed,
    reactantsLabel,
    productsLabel,
    peakLabel,
    intermediateLabel,
    catalysedLabel,
    eaLabel,
    dhLabel,
    xTitle,
    yTitle,
    ...rest
  },
  ref
) {
  const levels = profile ?? [reactant, peak ?? Math.max(reactant, product) + 0.6 * Math.max(1, Math.abs(product - reactant)), product]
  const catLevels = catalysed
  const all = [...levels, ...(catLevels ?? [])]
  const lo = Math.min(...all)
  const hi = Math.max(...all)
  const span = hi - lo || 1
  const eMin = lo - 0.08 * span
  const eMax = hi + 0.16 * span
  const bottom = y + height
  const toY = linear([eMin, eMax], [bottom, y]).to
  const toX = (f: number) => x + f * width

  const n = levels.length
  const fractions = Array.from({ length: n }, (_, i) => (n === 1 ? 0.5 : STATION_FROM + ((STATION_TO - STATION_FROM) * i) / (n - 1)))
  const stationary = (vals: number[]): Point[] => vals.map((e, i) => ({ x: toX(fractions[i]), y: toY(e) }))
  const curve = (vals: number[]): Point[] => [
    { x: toX(LEFT_PAD), y: toY(vals[0]) },
    ...stationary(vals),
    { x: toX(RIGHT_PAD), y: toY(vals[vals.length - 1]) },
  ]

  const main = curve(levels)
  const cat = catLevels ? curve(catLevels) : null
  const reactantY = toY(levels[0])
  const productY = toY(levels[levels.length - 1])
  const peaks = levels.map((e, i) => ({ e, i })).filter((p) => p.i % 2 === 1)
  const valleys = levels.map((e, i) => ({ e, i })).filter((p) => p.i % 2 === 0 && p.i !== 0 && p.i !== n - 1)
  const firstPeak = peaks[0]
  // The Eₐ arrow sits just after the reactant plateau, where the curve has not yet risen.
  const eaArrowX = toX(fractions[0] + EA_OFFSET)
  const dhX = toX(DH_FRACTION)
  const titleX = x - 44
  const xStart = x - 2

  return (
    <g ref={ref} aria-hidden="true" {...rest}>
      {/* Axes: energy up the left edge, reaction coordinate along the bottom */}
      <line x1={x} x2={x} y1={y} y2={bottom} stroke="var(--kin-axis)" strokeWidth={1.6} />
      <path d={`M${x - 4} ${y + 8} L${x} ${y} L${x + 4} ${y + 8}`} fill="none" stroke="var(--kin-axis)" strokeWidth={1.6} strokeLinejoin="round" />
      <line x1={x} x2={x + width} y1={bottom} y2={bottom} stroke="var(--kin-axis)" strokeWidth={1.6} />
      <path d={`M${x + width - 8} ${bottom - 4} L${x + width} ${bottom} L${x + width - 8} ${bottom + 4}`} fill="none" stroke="var(--kin-axis)" strokeWidth={1.6} strokeLinejoin="round" />
      {yTitle && (
        <text transform={`translate(${titleX} ${y + height / 2}) rotate(-90)`} textAnchor="middle" fontSize={15} fill="var(--fg)">
          {yTitle}
        </text>
      )}
      {xTitle && (
        <text x={x + width / 2} y={bottom + 34} textAnchor="middle" fontSize={15} fill="var(--fg)">
          {xTitle}
        </text>
      )}

      {/* Level lines for the reactants and products */}
      <line x1={toX(LEFT_PAD)} x2={toX(STATION_FROM - 0.04)} y1={reactantY} y2={reactantY} stroke="var(--kin-axis)" strokeWidth={1} strokeDasharray="3 4" />
      <line x1={toX(RIGHT_PAD - 0.02)} x2={dhX + 4} y1={productY} y2={productY} stroke="var(--kin-axis)" strokeWidth={1} strokeDasharray="3 4" />

      {cat && (
        <path d={smoothThrough(cat)} fill="none" stroke="var(--kin-catalyst)" strokeWidth={2.6} strokeDasharray="8 6" strokeLinecap="round" />
      )}
      <path d={smoothThrough(main)} fill="none" stroke="var(--accent)" strokeWidth={3.2} strokeLinecap="round" />

      {/* Eₐ: reactant level to the first activated complex */}
      {firstPeak && eaLabel !== undefined && (
        <>
          <VArrow x={eaArrowX} y1={reactantY} y2={toY(firstPeak.e)} tone="var(--fg)" />
          <text x={eaArrowX - 9} y={(reactantY + toY(firstPeak.e)) / 2 + 5} textAnchor="end" fontSize={15} fill="var(--fg)" stroke="var(--surface)" strokeWidth={4} paintOrder="stroke">
            {eaLabel}
          </text>
        </>
      )}

      {/* ΔrH: reactant level to product level */}
      {dhLabel !== undefined && (
        <>
          <VArrow x={dhX} y1={reactantY} y2={productY} tone="var(--fg)" />
          <text x={dhX - 9} y={(reactantY + productY) / 2 + 5} textAnchor="end" fontSize={15} fill="var(--fg)" stroke="var(--surface)" strokeWidth={4} paintOrder="stroke">
            {dhLabel}
          </text>
        </>
      )}

      {reactantsLabel !== undefined && (
        <text x={xStart + 6} y={reactantY - 10} textAnchor="start" fontSize={15} fill="var(--fg)" stroke="var(--surface)" strokeWidth={4} paintOrder="stroke">
          {reactantsLabel}
        </text>
      )}
      {productsLabel !== undefined && (
        <text x={toX(RIGHT_PAD - 0.02)} y={productY + 22} textAnchor="end" fontSize={15} fill="var(--fg)" stroke="var(--surface)" strokeWidth={4} paintOrder="stroke">
          {productsLabel}
        </text>
      )}
      {peakLabel !== undefined && peaks.length > 0 && (
        <text x={stationary(levels)[peaks[0].i].x} y={toY(peaks[0].e) - 12} textAnchor="middle" fontSize={15} fill="var(--fg)" stroke="var(--surface)" strokeWidth={4} paintOrder="stroke">
          {peakLabel}
        </text>
      )}
      {intermediateLabel !== undefined &&
        valleys.map((v) => (
          <text key={v.i} x={stationary(levels)[v.i].x} y={toY(v.e) + 24} textAnchor="middle" fontSize={15} fill="var(--fg)" stroke="var(--surface)" strokeWidth={4} paintOrder="stroke">
            {intermediateLabel}
          </text>
        ))}
      {cat && catalysedLabel !== undefined && catLevels && (
        <text x={stationary(catLevels)[1].x} y={toY(catLevels[1]) - 12} textAnchor="middle" fontSize={15} fill="var(--kin-catalyst)" stroke="var(--surface)" strokeWidth={4} paintOrder="stroke">
          {catalysedLabel}
        </text>
      )}
    </g>
  )
})
