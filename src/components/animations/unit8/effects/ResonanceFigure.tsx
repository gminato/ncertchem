'use client'

import React from 'react'
import { SkeletalFormula, drawingFrame, type Bounds } from '@/components/organic'
import { hybridOf, resonanceSpecies, speciesForms, type PushArrow } from '@/lib/chem/resonance-species'
import { PushArrowOverlay } from './PushArrows'

/**
 * A resonance figure in rows of at most two drawings. The first form may carry the curved arrows
 * that give the next form. A third form starts a second row with the hybrid beside it, so no row
 * is crowded and every ↔ has room for its charges.
 */
export interface ResonanceFigureProps {
  speciesId: string
  /** How many forms to draw, from the first. */
  count: number
  scale: number
  /** Gap between two forms in a row, for the ↔ arrow. */
  gap: number
  /** Gap between rows. */
  rowGap?: number
  /** Curved arrows drawn on the first form. */
  arrows?: readonly PushArrow[]
  /** Draw the hybrid (below the forms, or beside the third form). */
  showHybrid: boolean
  /** Vertical centre of the figure in the parent's coordinates. */
  centreY: number
  centreX?: number
}

type Item = { kind: 'form'; index: number } | { kind: 'hybrid' }

/** A horizontal double-headed resonance arrow of length `len`, centred on (x, y). */
function ResonanceArrow({ x, y, len }: { x: number; y: number; len: number }) {
  const h = len / 2
  return (
    <g fill="var(--fg-muted)" stroke="var(--fg-muted)" strokeWidth={2}>
      <line x1={x - h + 10} y1={y} x2={x + h - 10} y2={y} />
      <polygon points={`${x - h},${y} ${x - h + 11},${y - 6} ${x - h + 11},${y + 6}`} />
      <polygon points={`${x + h},${y} ${x + h - 11},${y - 6} ${x + h - 11},${y + 6}`} />
    </g>
  )
}

/** The rows of a figure: at most two drawings each; a third form starts a second row with the hybrid. */
function figureRows(speciesId: string, count: number, showHybrid: boolean): Item[][] {
  const s = resonanceSpecies(speciesId)
  const shown = Math.min(count, speciesForms(s).length)
  if (shown <= 2) {
    const rows: Item[][] = [Array.from({ length: shown }, (_, i) => ({ kind: 'form' as const, index: i }))]
    if (showHybrid) rows.push([{ kind: 'hybrid' }])
    return rows
  }
  const second: Item[] = [{ kind: 'form', index: 2 }]
  if (showHybrid) second.push({ kind: 'hybrid' })
  return [[0, 1].map((i) => ({ kind: 'form' as const, index: i })), second]
}

/** Width and height of a figure, for a parent viewBox. */
export function figureSize(
  speciesId: string,
  count: number,
  scale: number,
  gap: number,
  showHybrid: boolean,
  rowGap = 26
): { width: number; height: number } {
  const s = resonanceSpecies(speciesId)
  const graphs = speciesForms(s)
  const hybrid = hybridOf(s)
  const bw = (it: Item) => (it.kind === 'form' ? drawingFrame(graphs[it.index], scale).bounds : drawingFrame(hybrid.graph, scale).bounds)
  const rows = figureRows(speciesId, count, showHybrid)
  const width = Math.max(...rows.map((row) => row.reduce((t, it) => t + bw(it).width, 0) + gap * (row.length - 1)))
  const height = rows.reduce((t, row) => t + Math.max(...row.map((it) => bw(it).height)), 0) + rowGap * (rows.length - 1)
  return { width, height }
}

export function ResonanceFigure({
  speciesId,
  count,
  scale,
  gap,
  rowGap = 26,
  arrows,
  showHybrid,
  centreY,
  centreX = 290,
}: ResonanceFigureProps) {
  const s = resonanceSpecies(speciesId)
  const graphs = speciesForms(s)
  const hybrid = hybridOf(s)
  const shown = Math.min(count, graphs.length)
  const withHybrid = showHybrid

  const rows = figureRows(speciesId, shown, withHybrid)

  const boundsOf = (item: Item): Bounds =>
    item.kind === 'form' ? drawingFrame(graphs[item.index], scale).bounds : drawingFrame(hybrid.graph, scale).bounds
  const rowWidth = (row: Item[]) =>
    row.reduce((t, it) => t + boundsOf(it).width, 0) + gap * (row.length - 1)
  const rowHeight = (row: Item[]) => Math.max(...row.map((it) => boundsOf(it).height))
  const heights = rows.map(rowHeight)
  const total = heights.reduce((t, h) => t + h, 0) + rowGap * (rows.length - 1)

  let top = centreY - total / 2
  const out: React.ReactNode[] = []
  rows.forEach((row, r) => {
    const h = heights[r]
    const cy = top + h / 2
    top += h + rowGap
    let cursor = centreX - rowWidth(row) / 2
    row.forEach((item, k) => {
      const b = boundsOf(item)
      const cx = cursor + b.width / 2
      cursor += b.width
      if (k < row.length - 1) {
        const next = row[k + 1]
        const betweenForms = item.kind === 'form' && next.kind === 'form'
        if (betweenForms) out.push(<ResonanceArrow key={`ra-${r}-${k}`} x={cursor + gap / 2} y={cy} len={gap - 16} />)
        cursor += gap
      }
      if (item.kind === 'form') {
        const g = graphs[item.index]
        const overlay = item.index === 0 && arrows && arrows.length > 0 ? <PushArrowOverlay graph={g} scale={scale} arrows={arrows} /> : undefined
        out.push(
          <SkeletalFormula key={`f-${item.index}`} graph={g} scale={scale} x={cx} y={cy} showLonePairs overlay={overlay} />
        )
      } else {
        out.push(
          <SkeletalFormula
            key="hybrid"
            graph={hybrid.graph}
            scale={scale}
            x={cx}
            y={cy}
            innerCircles={s.innerCircles}
            partialBonds={hybrid.partialBonds}
            partialCharges={hybrid.charges.map((c) => ({ atom: c.atom, label: c.label }))}
          />
        )
      }
    })
  })
  return <g data-testid="resonance-figure">{out}</g>
}
