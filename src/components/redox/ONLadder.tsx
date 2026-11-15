import React, { forwardRef, useId } from 'react'
import {
  clamp01,
  onLadderY,
  formatSignedNumber,
  formatTrueMinus,
  curvedArrowPath,
  transitionLabelPosition,
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
        x={axisX - 10}
        y={top - 18}
        textAnchor="end"
        dominantBaseline="central"
        fontSize={15}
        fontWeight={700}
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
        strokeWidth={1.8}
      />

      {/* Axis ticks and labels (enlarged to ≥ 14 units) */}
      {ticks.map((val) => {
        const ty = onLadderY(val, { top, bottom, onMin, onMax })
        const isZero = val === 0
        return (
          <g key={val}>
            {/* Horizontal guideline */}
            <line
              x1={axisX - 6}
              y1={ty}
              x2={axisX + (isZero ? 260 : 6)}
              y2={ty}
              stroke="var(--border)"
              strokeWidth={isZero ? 1.6 : 1}
              strokeDasharray={isZero ? '3 3' : undefined}
              opacity={isZero ? 0.8 : 0.45}
            />

            {/* Tick label (≥ 14 units) */}
            <text
              x={axisX - 12}
              y={ty}
              textAnchor="end"
              dominantBaseline="central"
              fontSize={14}
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

        // Pill dimensions
        const pillWidth = 98
        const pillHeight = 24

        // Placement helper positions label cleanly beside the arrow (above up arrow, below down arrow)
        // with no stroke passing through any label
        const labelPos = transitionLabelPosition(
          startPt,
          endPt,
          isOx,
          pillWidth,
          pillHeight,
          14
        )

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
              strokeWidth={2.4}
              markerEnd={p > 0.1 ? marker : undefined}
              strokeDasharray={approxLength}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.25s ease' }}
            />

            {/* Arrow label pill positioned cleanly beside arrow without stroke collision */}
            {p > 0.4 && (
              <g transform={`translate(${labelPos.x}, ${labelPos.y})`} opacity={p}>
                <rect
                  x={-pillWidth / 2}
                  y={-pillHeight / 2}
                  width={pillWidth}
                  height={pillHeight}
                  rx={5}
                  fill="var(--surface-raised)"
                  stroke={color}
                  strokeWidth={1.4}
                />
                <text
                  x={0}
                  y={0.5}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={14}
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
              x={-30}
              y={-15}
              width={60}
              height={30}
              rx={6}
              fill="var(--surface)"
              stroke="var(--border)"
              strokeWidth={1.5}
            />

            {/* Species label (≥ 14 units) */}
            <text
              x={0}
              y={0.5}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={15}
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
