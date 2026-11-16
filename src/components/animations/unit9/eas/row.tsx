import React from 'react'

/**
 * A row of structures, formulas and arrows, centred on (cx, cy) and scaled as one piece so that it fills a
 * target width. Each item has a width in drawing units; `node` items are drawn centred on their own origin.
 */
export type RowItem =
  | { kind: 'node'; width: number; render: () => React.ReactNode }
  | { kind: 'text'; text: string; size: number; weight?: number; fill?: string }
  | { kind: 'arrow'; width: number; equilibrium?: boolean }

/** Gap on each side of an item, in drawing units. */
export const ROW_GAP = 12

/** Estimated width of a text item: sans-serif capitals and subscripts average about 0.6 em per character. */
export function textWidth(text: string, size: number): number {
  return Math.ceil(text.length * size * 0.6)
}

export function itemWidth(item: RowItem): number {
  if (item.kind === 'text') return textWidth(item.text, item.size)
  return item.width
}

/** The scale at which the row fits `targetWidth`, never above `maxScale`. */
export function rowScale(items: readonly RowItem[], targetWidth: number, maxScale = 1.6): number {
  const natural = items.reduce((sum, it) => sum + itemWidth(it) + 2 * ROW_GAP, 0)
  return Math.min(maxScale, targetWidth / natural)
}

export interface RowProps {
  items: RowItem[]
  cx: number
  cy: number
  targetWidth: number
  maxScale?: number
}

/** Lays the items out left to right and draws them scaled about (cx, cy). */
export function Row({ items, cx, cy, targetWidth, maxScale = 1.6 }: RowProps) {
  const s = rowScale(items, targetWidth, maxScale)
  const natural = items.reduce((sum, it) => sum + itemWidth(it) + 2 * ROW_GAP, 0)
  let left = -natural / 2
  const out: React.ReactNode[] = []
  items.forEach((item, i) => {
    left += ROW_GAP
    const w = itemWidth(item)
    const mid = left + w / 2
    if (item.kind === 'node') {
      out.push(
        <g key={i} transform={`translate(${mid}, 0)`}>
          {item.render()}
        </g>
      )
    } else if (item.kind === 'text') {
      out.push(
        <text
          key={i}
          x={mid}
          y={0}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={item.size}
          fontWeight={item.weight ?? 600}
          fontFamily="var(--font-sans)"
          fill={item.fill ?? 'var(--fg)'}
        >
          {item.text}
        </text>
      )
    } else {
      out.push(<Arrow key={i} x1={left} x2={left + w} equilibrium={item.equilibrium} />)
    }
    left += w + ROW_GAP
  })
  return (
    <g transform={`translate(${cx}, ${cy}) scale(${s})`} data-row-scale={s.toFixed(3)}>
      {out}
    </g>
  )
}

/** A reaction arrow, or a pair of opposed arrows for an equilibrium. */
function Arrow({ x1, x2, equilibrium }: { x1: number; x2: number; equilibrium?: boolean }) {
  const head = (xTip: number, dir: 1 | -1, y: number) => `M${xTip - dir * 12},${y - 7} L${xTip},${y} L${xTip - dir * 12},${y + 7}`
  if (equilibrium) {
    return (
      <g stroke="var(--fg-muted)" strokeWidth={2.4} strokeLinecap="round" fill="none">
        <line x1={x1} x2={x2 - 2} y1={-5} y2={-5} />
        <path d={head(x2, 1, -5)} />
        <line x1={x2} x2={x1 + 2} y1={5} y2={5} />
        <path d={head(x1, -1, 5)} />
      </g>
    )
  }
  return (
    <g stroke="var(--fg-muted)" strokeWidth={2.4} strokeLinecap="round" fill="none">
      <line x1={x1} x2={x2 - 2} y1={0} y2={0} />
      <path d={head(x2, 1, 0)} />
    </g>
  )
}
