'use client'

import React, { useId } from 'react'
import { onLadderY, transitionLabelPosition, type Point } from '@/components/redox/geometry'
import type { LadderArrow, LadderMarker, LadderModel } from './ladder-model'

export interface LaneLadderProps {
  model: LadderModel
  /** ViewBox width; the SVG scales to its container. */
  width?: number
  /** ViewBox height of the ladder area. */
  height?: number
  ariaLabel: string
}

const LABEL_SIZE = 14
const BOX_HEIGHT = 30
const AXIS_X = 46
const LANE_LEFT = 104
const RIGHT_MARGIN = 12
const TOP = 30
const PAD_BOTTOM = 26
const LABEL_LINE = 17

/** Approximate advance width of a 14 px semibold label, in SVG units. */
export function estimateLabelWidth(text: string, fontSize = LABEL_SIZE): number {
  let w = 0
  for (const ch of text) {
    if (ch === ' ') w += fontSize * 0.3
    else if (/[A-Z]/.test(ch)) w += fontSize * (ch === 'M' || ch === 'W' ? 0.9 : 0.7)
    else if (/[a-z]/.test(ch)) w += fontSize * (ch === 'm' || ch === 'w' ? 0.85 : ch === 'i' || ch === 'l' || ch === 't' || ch === 'r' ? 0.38 : 0.56)
    else if (/[0-9]/.test(ch) || /[₀-₉⁰-⁹]/.test(ch)) w += fontSize * 0.6
    else w += fontSize * 0.6
  }
  return w
}

export function markerBoxWidth(label: string): number {
  return Math.max(70, Math.ceil(estimateLabelWidth(label)) + 22)
}

/**
 * Vertical bounds in O.N. units. Diagonal arrows need a unit of headroom above and
 * below for their labels, so the scale gives them room.
 */
export function ladderBounds(model: LadderModel): [number, number] {
  const [rawLo, rawHi] = model.range
  const diagonal = model.arrows.some((a) => {
    const from = model.markers.find((m) => m.id === a.fromId)
    const to = model.markers.find((m) => m.id === a.toId)
    return from !== undefined && to !== undefined && from.lane !== to.lane
  })
  const lo = diagonal ? rawLo - 1 : rawLo
  const hi = diagonal ? rawHi + 1 : rawHi
  return [lo, hi]
}

interface PlacedMarker extends LadderMarker {
  x: number
  y: number
  halfWidth: number
}

/**
 * Oxidation-number ladder with one lane per element. Markers sit in their lane,
 * same-lane arrows run vertically beside the lane's own axis, and cross-lane
 * arrows are labelled by the placement helper so no label sits on a stroke.
 */
export function LaneLadder({ model, width = 570, height = 330, ariaLabel }: LaneLadderProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const oxMarker = `lane-ox-${uid}`
  const redMarker = `lane-red-${uid}`
  const [lo, hi] = ladderBounds(model)
  const top = TOP
  const bottom = height - PAD_BOTTOM

  const laneRight = width - RIGHT_MARGIN
  const laneWidth = (laneRight - LANE_LEFT) / model.laneCount
  const laneX = (lane: number) => LANE_LEFT + (lane + 0.5) * laneWidth
  const yOf = (on: number) => onLadderY(on, { top, bottom, onMin: lo, onMax: hi })

  const placed = new Map<string, PlacedMarker>()
  for (const m of model.markers) {
    const halfWidth = markerBoxWidth(m.label) / 2
    placed.set(m.id, { ...m, x: laneX(m.lane), y: yOf(m.on), halfWidth })
  }

  const ticks: number[] = []
  for (let n = lo; n <= hi; n++) ticks.push(n)

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel}
      style={{ display: 'block', width: '100%', height: 'auto', overflow: 'visible' }}
      data-testid="lane-ladder"
    >
      <defs>
        <marker id={oxMarker} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8 5 L 0 8.5 Z" fill="var(--ox)" />
        </marker>
        <marker id={redMarker} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 1.5 L 8 5 L 0 8.5 Z" fill="var(--red)" />
        </marker>
      </defs>

      {/* Axis */}
      <text x={AXIS_X} y={10} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        O.N.
      </text>
      <line x1={AXIS_X} y1={top - 12} x2={AXIS_X} y2={bottom + 12} stroke="var(--border)" strokeWidth={1.8} />
      {ticks.map((n) => (
        <g key={n}>
          <line x1={AXIS_X - 5} y1={yOf(n)} x2={AXIS_X} y2={yOf(n)} stroke="var(--border)" strokeWidth={1.4} />
          <text
            x={AXIS_X - 9}
            y={yOf(n)}
            textAnchor="end"
            dominantBaseline="central"
            fontSize={14}
            fontFamily="var(--font-sans)"
            fontWeight={n === 0 ? 700 : 500}
            fill={n === 0 ? 'var(--fg)' : 'var(--fg-muted)'}
          >
            {n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0'}
          </text>
        </g>
      ))}

      {/* Arrows and their labels */}
      {model.arrows.map((arrow) => (
        <ArrowWithLabel
          key={arrow.id}
          arrow={arrow}
          from={placed.get(arrow.fromId)}
          to={placed.get(arrow.toId)}
          oxMarker={oxMarker}
          redMarker={redMarker}
        />
      ))}

      {/* Markers last so they sit above arrow tails */}
      {[...placed.values()].map((m) => (
        <g key={m.id} data-testid="ladder-marker">
          <rect
            x={m.x - m.halfWidth}
            y={m.y - BOX_HEIGHT / 2}
            width={m.halfWidth * 2}
            height={BOX_HEIGHT}
            rx={6}
            fill="var(--surface)"
            stroke="var(--border)"
            strokeWidth={1.5}
          />
          <text
            x={m.x}
            y={m.y + 0.5}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={LABEL_SIZE}
            fontWeight={600}
            fontFamily="var(--font-sans)"
            fill="var(--fg)"
          >
            {m.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

interface ArrowWithLabelProps {
  arrow: LadderArrow
  from: PlacedMarker | undefined
  to: PlacedMarker | undefined
  oxMarker: string
  redMarker: string
}

function ArrowWithLabel({ arrow, from, to, oxMarker, redMarker }: ArrowWithLabelProps) {
  if (!from || !to) return null
  const color = arrow.tone === 'ox' ? 'var(--ox)' : 'var(--red)'
  const marker = `url(#${arrow.tone === 'ox' ? oxMarker : redMarker})`
  const isOx = arrow.tone === 'ox'

  if (from.lane === to.lane) {
    // Same element: a vertical arrow in its own lane, label to its right.
    const dir = to.y < from.y ? -1 : 1
    const y1 = from.y + dir * (BOX_HEIGHT / 2 + 3)
    const y2 = to.y - dir * (BOX_HEIGHT / 2 + 4)
    const mid = (y1 + y2) / 2
    const x = from.x
    return (
      <g data-testid="ladder-arrow">
        <line x1={x} y1={y1} x2={x} y2={y2} stroke={color} strokeWidth={2.4} markerEnd={marker} />
        <text x={x + 12} y={mid - 8} dominantBaseline="central" fontSize={LABEL_SIZE} fontWeight={700} fontFamily="var(--font-sans)" fill={color}>
          {arrow.title}
        </text>
        <text x={x + 12} y={mid + 9} dominantBaseline="central" fontSize={LABEL_SIZE} fontWeight={500} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
          {arrow.detail}
        </text>
      </g>
    )
  }

  // Cross-lane arrow: straight from the edge of one marker to the edge of the other.
  const dir = to.x > from.x ? 1 : -1
  const start: Point = { x: from.x + dir * (from.halfWidth + 3), y: from.y }
  const end: Point = { x: to.x - dir * (to.halfWidth + 4), y: to.y }
  const pillLines = [arrow.title, arrow.detail]
  const pillWidth = Math.max(...pillLines.map((l) => estimateLabelWidth(l))) + 16
  const pillHeight = LABEL_LINE * 2 + 8
  const center = transitionLabelPosition(start, end, isOx, pillWidth, pillHeight, 8)

  return (
    <g data-testid="ladder-arrow">
      <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={color} strokeWidth={2.4} markerEnd={marker} />
      <rect
        x={center.x - pillWidth / 2}
        y={center.y - pillHeight / 2}
        width={pillWidth}
        height={pillHeight}
        rx={6}
        fill="var(--surface-raised)"
        stroke={color}
        strokeWidth={1.2}
      />
      <text x={center.x} y={center.y - LABEL_LINE / 2 + 1} textAnchor="middle" dominantBaseline="central" fontSize={LABEL_SIZE} fontWeight={700} fontFamily="var(--font-sans)" fill={color}>
        {arrow.title}
      </text>
      <text x={center.x} y={center.y + LABEL_LINE / 2 + 1} textAnchor="middle" dominantBaseline="central" fontSize={LABEL_SIZE} fontWeight={500} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        {arrow.detail}
      </text>
    </g>
  )
}
