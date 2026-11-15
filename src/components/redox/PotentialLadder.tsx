import React, { forwardRef, useId, useMemo } from 'react'
import {
  clamp01,
  potentialLadderY,
  formatTrueMinus,
  spontaneousBracketGeometry,
  resolveBadgePositions,
} from './geometry'

export const POTENTIAL_LADDER_SIZE = { width: 480, height: 440 } as const

export interface RedoxCouple {
  id: string
  label: React.ReactNode
  /** Standard reduction potential in Volts. */
  e0: number
}

export interface PotentialLadderProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  couples: readonly RedoxCouple[]
  /** Pair of couple IDs [cathodeCouple, anodeCouple] to highlight. */
  highlight?: readonly [string, string]
  /** Potential axis window [eMin, eMax]. Defaults to auto-range from couples. */
  range?: [number, number]
  title?: string
  x?: number
  y?: number
}

export const PotentialLadder = forwardRef<SVGGElement, PotentialLadderProps>(function PotentialLadder(
  {
    couples,
    highlight,
    range,
    title,
    x = 0,
    y = 0,
    className,
    ...rest
  },
  ref
) {
  const idPrefix = useId().replace(/[^a-zA-Z0-9]/g, '')
  const redArrowId = `pl-red-arr-${idPrefix}`
  const oxArrowId = `pl-ox-arr-${idPrefix}`

  const top = 54
  const bottom = 384
  const axisX = 60
  const rungRightX = 310

  // Compute scale extent
  const { eMin, eMax } = useMemo(() => {
    if (range) return { eMin: range[0], eMax: range[1] }
    const vals = couples.map((c) => c.e0)
    const minVal = vals.length ? Math.min(...vals) : -1
    const maxVal = vals.length ? Math.max(...vals) : 1
    const pad = Math.max(0.15, (maxVal - minVal) * 0.1)
    return {
      eMin: +(minVal - pad).toFixed(1),
      eMax: +(maxVal + pad).toFixed(1),
    }
  }, [range, couples])

  // Filter couples within range
  const visibleCouples = useMemo(() => {
    return couples.filter((c) => c.e0 >= eMin - 0.05 && c.e0 <= eMax + 0.05)
  }, [couples, eMin, eMax])

  // Position layout for couple labels with collision avoidance
  const laidOutCouples = useMemo(() => {
    const rawItems = visibleCouples.map((c) => ({
      id: c.id,
      targetX: potentialLadderY(c.e0, { top, bottom, eMin, eMax }),
      width: 24,
      couple: c,
    }))

    const resolved = resolveBadgePositions(rawItems, 6)
    const map = new Map<string | number, number>()
    for (const r of resolved) {
      map.set(r.id, r.x)
    }

    return visibleCouples.map((c) => {
      const naturalY = potentialLadderY(c.e0, { top, bottom, eMin, eMax })
      const resolvedY = map.get(c.id) ?? naturalY
      return {
        ...c,
        naturalY,
        resolvedY,
      }
    })
  }, [visibleCouples, top, bottom, eMin, eMax])

  // Tick marks on axis
  const ticks = useMemo(() => {
    const span = eMax - eMin
    const step = span > 4 ? 1.0 : span > 1.8 ? 0.5 : 0.2
    const start = Math.ceil(eMin / step) * step
    const list: number[] = []
    for (let v = start; v <= eMax + 0.01; v += step) {
      list.push(+v.toFixed(2))
    }
    return list
  }, [eMin, eMax])

  // Highlight analysis
  const highlightInfo = useMemo(() => {
    if (!highlight || highlight.length !== 2) return null
    const [cId1, cId2] = highlight
    const couple1 = visibleCouples.find((c) => c.id === cId1)
    const couple2 = visibleCouples.find((c) => c.id === cId2)
    if (!couple1 || !couple2) return null

    // Higher E° is reduced (cathode), lower E° is oxidised (anode)
    const [cathode, anode] =
      couple1.e0 >= couple2.e0 ? [couple1, couple2] : [couple2, couple1]

    const catY = potentialLadderY(cathode.e0, { top, bottom, eMin, eMax })
    const anY = potentialLadderY(anode.e0, { top, bottom, eMin, eMax })
    const eCell = +(cathode.e0 - anode.e0).toFixed(2)

    const bracket = spontaneousBracketGeometry(catY, anY, rungRightX + 16, 16)

    return {
      cathode,
      anode,
      catY,
      anY,
      eCell,
      bracket,
    }
  }, [highlight, visibleCouples, top, bottom, eMin, eMax])

  return (
    <g
      ref={ref}
      transform={`translate(${x}, ${y})`}
      className={className}
      aria-label={title ?? 'Standard reduction potentials ladder'}
      {...rest}
    >
      <defs>
        <marker
          id={redArrowId}
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 Z" fill="var(--red)" />
        </marker>
        <marker
          id={oxArrowId}
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 Z" fill="var(--ox)" />
        </marker>
      </defs>

      {/* Axis title */}
      <text
        x={axisX - 8}
        y={top - 20}
        textAnchor="end"
        dominantBaseline="central"
        fontSize={13}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill="var(--fg-muted)"
        style={{ userSelect: 'none' }}
      >
        <tspan className="sym">E</tspan>° / <tspan className="sym">V</tspan>
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
        const ty = potentialLadderY(val, { top, bottom, eMin, eMax })
        const isZero = Math.abs(val) < 0.01
        const signStr = val > 0 ? `+${val.toFixed(1)}` : val < 0 ? `−${Math.abs(val).toFixed(1)}` : '0.0'

        return (
          <g key={val}>
            <line
              x1={axisX - 5}
              y1={ty}
              x2={axisX + (isZero ? 10 : 5)}
              y2={ty}
              stroke={isZero ? 'var(--fg-muted)' : 'var(--border)'}
              strokeWidth={isZero ? 1.4 : 1}
              opacity={isZero ? 0.7 : 0.4}
            />
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
              {signStr}
            </text>
          </g>
        )
      })}

      {/* Couple Rungs and Labels */}
      {laidOutCouples.map((c) => {
        const isCathode = highlightInfo?.cathode.id === c.id
        const isAnode = highlightInfo?.anode.id === c.id
        const isHighlighted = isCathode || isAnode

        const rungColor = isCathode
          ? 'var(--red)'
          : isAnode
            ? 'var(--ox)'
            : 'var(--border)'

        const signVal = c.e0 > 0 ? `+${c.e0.toFixed(2)}` : c.e0 < 0 ? `−${Math.abs(c.e0).toFixed(2)}` : '0.00'

        return (
          <g key={c.id}>
            {/* Axis level tick */}
            <line
              x1={axisX}
              y1={c.naturalY}
              x2={axisX + (isHighlighted ? 10 : 6)}
              y2={c.naturalY}
              stroke={rungColor}
              strokeWidth={isHighlighted ? 2.2 : 1.2}
              opacity={isHighlighted ? 1 : 0.7}
            />

            {/* Subtle dotted leader line between equation and potential value */}
            <line
              x1={axisX + 185}
              y1={c.resolvedY}
              x2={rungRightX - 60}
              y2={c.resolvedY}
              stroke="var(--border)"
              strokeWidth={1}
              strokeDasharray="2 3"
              opacity={0.4}
            />

            {/* Couple label box */}
            <g transform={`translate(${axisX + 14}, ${c.resolvedY})`}>
              <text
                x={0}
                y={0}
                dominantBaseline="central"
                fontSize={13}
                fontFamily="var(--font-sans)"
                fontWeight={isHighlighted ? 700 : 500}
                fill={isHighlighted ? (isCathode ? 'var(--red)' : 'var(--ox)') : 'var(--fg)'}
                style={{ userSelect: 'none' }}
              >
                {c.label}
              </text>
            </g>

            {/* Potential value badge near rung end */}
            <g transform={`translate(${rungRightX - 4}, ${c.resolvedY})`}>
              <text
                x={0}
                y={0}
                textAnchor="end"
                dominantBaseline="central"
                fontSize={13}
                fontFamily="var(--font-sans)"
                fontWeight={isHighlighted ? 700 : 500}
                fill={isHighlighted ? 'var(--fg)' : 'var(--fg-muted)'}
                style={{ userSelect: 'none' }}
              >
                {signVal} <tspan className="sym">V</tspan>
              </text>
            </g>

            {/* Spontaneous direction indicator arrow connecting to bracket */}
            {isCathode && (
              <line
                x1={rungRightX + 2}
                y1={c.naturalY}
                x2={rungRightX + 16}
                y2={c.naturalY}
                stroke="var(--red)"
                strokeWidth={2}
                markerEnd={`url(#${redArrowId})`}
              />
            )}
            {isAnode && (
              <line
                x1={rungRightX + 16}
                y1={c.naturalY}
                x2={rungRightX + 2}
                y2={c.naturalY}
                stroke="var(--ox)"
                strokeWidth={2}
                markerEnd={`url(#${oxArrowId})`}
              />
            )}
          </g>
        )
      })}

      {/* Spontaneous Cell Voltage Bracket */}
      {highlightInfo && (
        <g>
          {/* Bracket line */}
          <path
            d={highlightInfo.bracket.bracketPath}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={1.8}
            strokeLinejoin="round"
          />

          {/* E°cell Callout Pill */}
          <g transform={`translate(${highlightInfo.bracket.labelX + 24}, ${highlightInfo.bracket.labelY})`}>
            <rect
              x={-54}
              y={-14}
              width={108}
              height={28}
              rx={5}
              fill="var(--surface-raised)"
              stroke="var(--accent)"
              strokeWidth={1.4}
            />
            <text
              x={0}
              y={0.5}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={13}
              fontWeight={600}
              fontFamily="var(--font-sans)"
              fill="var(--fg)"
              style={{ userSelect: 'none' }}
            >
              <tspan className="sym">E</tspan>°<tspan dy="0.25em" fontSize="0.75em">cell</tspan>
              <tspan dy="-0.25em"> = </tspan>
              +{highlightInfo.eCell.toFixed(2)} <tspan className="sym">V</tspan>
            </text>
          </g>
        </g>
      )}

      {/* Qualitative Tendency Indicators */}
      <g transform={`translate(${axisX + 10}, ${top - 24})`}>
        <text
          x={0}
          y={0}
          fontSize={13}
          fontFamily="var(--font-sans)"
          fill="var(--fg-muted)"
          style={{ userSelect: 'none' }}
        >
          ↑ Stronger oxidising agent
        </text>
      </g>
      <g transform={`translate(${axisX + 10}, ${bottom + 24})`}>
        <text
          x={0}
          y={0}
          fontSize={13}
          fontFamily="var(--font-sans)"
          fill="var(--fg-muted)"
          style={{ userSelect: 'none' }}
        >
          ↓ Stronger reducing agent
        </text>
      </g>
    </g>
  )
})
