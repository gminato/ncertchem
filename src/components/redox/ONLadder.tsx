import React, { forwardRef, useId } from 'react'
import {
  clamp01,
  onLadderY,
  formatSignedNumber,
  formatTrueMinus,
  curvedArrowPath,
  type Point,
} from './geometry'

export const ON_LADDER_SIZE = { width: 380, height: 380 } as const

export interface ONSpecies {
  id: string
  label: React.ReactNode
  on: number
  /** Horizontal column: 0 (default inner), 1 (outer right), etc. */
  column?: number
}

export interface ONTransition {
  id: string
  fromId: string
  toId: string
  label?: string
  curveDx?: number
  tone?: 'ox' | 'red'
}

export interface ONLadderProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  range?: [number, number]
  species: readonly ONSpecies[]
  transitions?: readonly ONTransition[]
  /** Progress from 0 (arrows hidden) to 1 (arrows fully drawn). */
  progress?: number
  title?: string
  x?: number
  y?: number
}

export const ONLadder = forwardRef<SVGGElement, ONLadderProps>(function ONLadder(
  {
    range = [-3, 3],
    species,
    transitions = [],
    progress = 1,
    title,
    x = 0,
    y = 0,
    className,
    ...rest
  },
  ref
) {
  const p = clamp01(progress)
  const idPrefix = useId().replace(/[^a-zA-Z0-9]/g, '')
  const oxMarkerId = `on-marker-ox-${idPrefix}`
  const redMarkerId = `on-marker-red-${idPrefix}`

  const [onMin, onMax] = range
  const top = 36
  const bottom = 344
  const axisX = 80

  // Species positions
  const speciesMap = new Map<
    string,
    { species: ONSpecies; x: number; y: number }
  >()

  const colBaseX = 110
  const colSpacing = 220

  species.forEach((sp) => {
    const col = sp.column ?? 0
    const spX = colBaseX + col * colSpacing
    const spY = onLadderY(sp.on, { top, bottom, onMin, onMax })
    speciesMap.set(sp.id, { species: sp, x: spX, y: spY })
  })

  // Integer ticks
  const ticks: number[] = []
  for (let n = onMin; n <= onMax; n++) {
    ticks.push(n)
  }

  return (
    <g
      ref={ref}
      transform={`translate(${x}, ${y})`}
      className={className}
      aria-label={title ?? 'Oxidation number ladder'}
      {...rest}
    >
      <defs>
        {/* Oxidation arrowhead (up / amber) */}
        <marker
          id={oxMarkerId}
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 Z" fill="var(--ox)" />
        </marker>

        {/* Reduction arrowhead (down / indigo) */}
        <marker
          id={redMarkerId}
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 Z" fill="var(--red)" />
        </marker>
      </defs>

      {/* Axis title */}
      <text
        x={axisX - 8}
        y={top - 18}
        textAnchor="end"
        dominantBaseline="central"
        fontSize={13}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill="var(--fg-muted)"
        style={{ userSelect: 'none' }}
      >
        O.N.
      </text>

      {/* Axis vertical line */}
      <line
        x1={axisX}
        y1={top - 8}
        x2={axisX}
        y2={bottom + 8}
        stroke="var(--border)"
        strokeWidth={1.6}
      />

      {/* Axis ticks and labels */}
      {ticks.map((val) => {
        const ty = onLadderY(val, { top, bottom, onMin, onMax })
        const isZero = val === 0
        return (
          <g key={val}>
            {/* Horizontal guideline */}
            <line
              x1={axisX - 5}
              y1={ty}
              x2={axisX + (isZero ? 260 : 6)}
              y2={ty}
              stroke="var(--border)"
              strokeWidth={isZero ? 1.4 : 1}
              strokeDasharray={isZero ? '3 3' : undefined}
              opacity={isZero ? 0.7 : 0.4}
            />

            {/* Tick label (minimum 13px) */}
            <text
              x={axisX - 10}
              y={ty}
              textAnchor="end"
              dominantBaseline="central"
              fontSize={13}
              fontFamily="var(--font-sans)"
              fontWeight={isZero ? 700 : 500}
              fill={isZero ? 'var(--fg)' : 'var(--fg-muted)'}
              style={{ userSelect: 'none' }}
            >
              {formatSignedNumber(val)}
            </text>
          </g>
        )
      })}

      {/* Transitions / Reaction Arrows */}
      {transitions.map((tr) => {
        const from = speciesMap.get(tr.fromId)
        const to = speciesMap.get(tr.toId)
        if (!from || !to) return null

        const isOx = to.species.on > from.species.on
        const tone = tr.tone ?? (isOx ? 'ox' : 'red')
        const color = tone === 'ox' ? 'var(--ox)' : 'var(--red)'
        const marker = tone === 'ox' ? `url(#${oxMarkerId})` : `url(#${redMarkerId})`

        const startPt: Point = {
          x: from.x + (from.x < to.x ? 30 : -30),
          y: from.y,
        }
        const endPt: Point = {
          x: to.x + (from.x < to.x ? -32 : 32),
          y: to.y,
        }

        const curve = tr.curveDx ?? (from.x === to.x ? 30 : 0)
        const pathD = curvedArrowPath(startPt, endPt, curve)

        // Midpoint for label pill positioned neatly above (ox) or below (red) arrow
        const midX = (startPt.x + endPt.x) / 2
        const midY = (startPt.y + endPt.y) / 2 + (isOx ? -36 : 36)

        const labelText =
          tr.label ?? (isOx ? 'Oxidation' : 'Reduction')

        // Progressive reveal using dasharray
        const approxLength = Math.hypot(endPt.x - startPt.x, endPt.y - startPt.y) + Math.abs(curve)
        const strokeDashoffset = (1 - p) * approxLength

        return (
          <g key={tr.id}>
            {/* Arrow line */}
            <path
              d={pathD}
              fill="none"
              stroke={color}
              strokeWidth={2}
              markerEnd={p > 0.1 ? marker : undefined}
              strokeDasharray={approxLength}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.25s ease' }}
            />

            {/* Arrow label pill */}
            {p > 0.4 && (
              <g transform={`translate(${midX}, ${midY})`} opacity={p}>
                <rect
                  x={-42}
                  y={-11}
                  width={84}
                  height={22}
                  rx={4}
                  fill="var(--surface-raised)"
                  stroke={color}
                  strokeWidth={1.2}
                />
                <text
                  x={0}
                  y={0.5}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={13}
                  fontWeight={600}
                  fontFamily="var(--font-sans)"
                  fill={color}
                  style={{ userSelect: 'none' }}
                >
                  {formatTrueMinus(labelText)}
                </text>
              </g>
            )}
          </g>
        )
      })}

      {/* Species Markers */}
      {species.map((sp) => {
        const pos = speciesMap.get(sp.id)
        if (!pos) return null

        return (
          <g key={sp.id} transform={`translate(${pos.x}, ${pos.y})`}>
            {/* Connector back to axis */}
            <line
              x1={axisX - pos.x}
              y1={0}
              x2={-30}
              y2={0}
              stroke="var(--border)"
              strokeWidth={1.2}
              strokeDasharray="2 2"
            />

            {/* Species badge */}
            <rect
              x={-28}
              y={-14}
              width={56}
              height={28}
              rx={6}
              fill="var(--surface)"
              stroke="var(--border)"
              strokeWidth={1.5}
            />

            {/* Species label (minimum 13px) */}
            <text
              x={0}
              y={0.5}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={14}
              fontWeight={600}
              fontFamily="var(--font-sans)"
              fill="var(--fg)"
              style={{ userSelect: 'none' }}
            >
              {sp.label}
            </text>
          </g>
        )
      })}
    </g>
  )
})
