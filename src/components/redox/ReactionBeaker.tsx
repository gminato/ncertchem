import React, { forwardRef, useId, useMemo } from 'react'
import { clamp01, formatTrueMinus, type Point } from './geometry'

export const REACTION_BEAKER_SIZE = { width: 320, height: 320 } as const

export interface IonParticle {
  id: string
  label: string
  /** 'solution-to-strip' (depositing) or 'strip-to-solution' (dissolving) */
  direction: 'to-strip' | 'from-strip'
  start: Point
  end: Point
  tone?: 'ox' | 'red' | 'neutral'
}

export interface ReactionBeakerProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** Solution colour variable, default 'var(--sol-cu)'. */
  solutionTint?: string
  /** Solution colour intensity from 0 (faded/clear) to 1 (full strength). */
  tintStrength?: number
  /** The metal of the submerged strip, e.g. 'Zn'. */
  stripMetal?: string
  /** Deposit thickness on the strip from 0 (none) to 1 (thick). */
  coating?: number
  /** The deposited metal, e.g. 'Cu'. */
  coatingMetal?: string
  /** Progress of ion transfer from 0 to 1. */
  progress?: number
  /** Custom ion list, or defaults to Zn²⁺ / Cu²⁺ ions. */
  ions?: readonly IonParticle[]
  title?: string
  x?: number
  y?: number
}

const DEFAULT_IONS: IonParticle[] = [
  // Cu²⁺ ions moving from solution onto the strip
  {
    id: 'cu1',
    label: 'Cu²⁺',
    direction: 'to-strip',
    start: { x: -62, y: 35 },
    end: { x: -22, y: 30 },
    tone: 'red',
  },
  {
    id: 'cu2',
    label: 'Cu²⁺',
    direction: 'to-strip',
    start: { x: 58, y: 55 },
    end: { x: 22, y: 48 },
    tone: 'red',
  },
  // Zn²⁺ ions dissolving from the strip into solution
  {
    id: 'zn1',
    label: 'Zn²⁺',
    direction: 'from-strip',
    start: { x: -18, y: -2 },
    end: { x: -62, y: -8 },
    tone: 'ox',
  },
  {
    id: 'zn2',
    label: 'Zn²⁺',
    direction: 'from-strip',
    start: { x: 18, y: 20 },
    end: { x: 58, y: 46 },
    tone: 'ox',
  },
]

export const ReactionBeaker = forwardRef<SVGGElement, ReactionBeakerProps>(function ReactionBeaker(
  {
    solutionTint = 'var(--sol-cu)',
    tintStrength = 1,
    stripMetal = 'Zn',
    coating = 0,
    coatingMetal = 'Cu',
    progress = 0,
    ions,
    title,
    x = 0,
    y = 0,
    className,
    ...rest
  },
  ref
) {
  const p = clamp01(progress)
  const strength = clamp01(tintStrength)
  const coat = clamp01(coating)
  const clipId = `rb-clip-${useId().replace(/[^a-zA-Z0-9]/g, '')}`

  // Beaker dimensions
  const bw = 170
  const bh = 175
  const bLeft = -bw / 2
  const bRight = bw / 2
  const bTop = -70
  const bBottom = bTop + bh
  const liquidY = -20

  // Metal strip dimensions
  const stripW = 34
  const stripTop = -100
  const stripBottom = 75
  const stripLeft = -stripW / 2
  const stripRight = stripW / 2

  const activeIons = ions ?? DEFAULT_IONS

  // Current ion coordinates and opacities driven by progress
  const renderedIons = useMemo(() => {
    return activeIons.map((ion) => {
      const curX = ion.start.x + (ion.end.x - ion.start.x) * p
      const curY = ion.start.y + (ion.end.y - ion.start.y) * p

      // Cu²⁺ ions fade away as they deposit; Zn²⁺ ions appear as they dissolve
      let opacity = 1
      if (ion.direction === 'to-strip') {
        opacity = Math.max(0, 1 - 1.1 * p)
      } else {
        opacity = Math.min(1, 1.2 * p)
      }

      return { ...ion, curX, curY, opacity }
    })
  }, [activeIons, p])

  // Colors for metals
  const stripColor =
    stripMetal === 'Zn'
      ? 'var(--metal-zn)'
      : stripMetal === 'Cu'
        ? 'var(--metal-cu)'
        : 'var(--metal-ag)'

  const coatColor =
    coatingMetal === 'Cu'
      ? 'var(--metal-cu)'
      : coatingMetal === 'Ag'
        ? 'var(--metal-ag)'
        : 'var(--metal-zn)'

  return (
    <g
      ref={ref}
      transform={`translate(${x}, ${y})`}
      className={className}
      aria-label={title ?? `${stripMetal} strip in ${coatingMetal} solution`}
      {...rest}
    >
      <defs>
        <clipPath id={clipId}>
          <path
            d={`M ${bLeft} ${bTop} L ${bLeft} ${bBottom - 10} Q ${bLeft} ${bBottom} ${bLeft + 10} ${bBottom} L ${bRight - 10} ${bBottom} Q ${bRight} ${bBottom} ${bRight} ${bBottom - 10} L ${bRight} ${bTop} Z`}
          />
        </clipPath>
      </defs>

      {/* Solution liquid inside beaker */}
      <g clipPath={`url(#${clipId})`}>
        {/* Solution fill with variable tint strength */}
        <rect
          x={bLeft - 10}
          y={liquidY}
          width={bw + 20}
          height={bBottom - liquidY + 10}
          fill={solutionTint}
          opacity={0.10 + 0.70 * strength}
        />
        {/* Liquid surface meniscus line */}
        <line
          x1={bLeft}
          y1={liquidY}
          x2={bRight}
          y2={liquidY}
          stroke={solutionTint}
          strokeWidth={2}
          opacity={0.3 + 0.7 * strength}
        />
      </g>

      {/* Metal Strip */}
      <g>
        {/* Base strip */}
        <rect
          x={stripLeft}
          y={stripTop}
          width={stripW}
          height={stripBottom - stripTop}
          rx={3}
          fill={stripColor}
          stroke="var(--fg-muted)"
          strokeWidth={1.2}
        />

        {/* Submerged metal coating deposit growing over time */}
        {coat > 0 && (
          <g>
            <rect
              x={stripLeft - 3 * coat}
              y={liquidY + 4}
              width={stripW + 6 * coat}
              height={stripBottom - liquidY - 4}
              rx={3}
              fill={coatColor}
              stroke="var(--fg-muted)"
              strokeWidth={1}
              opacity={0.85 + 0.15 * coat}
            />
            {coat > 0.3 && (
              <>
                <line
                  x1={stripLeft - 2 * coat}
                  y1={liquidY + 20}
                  x2={stripRight + 2 * coat}
                  y2={liquidY + 24}
                  stroke="var(--sphere-highlight)"
                  strokeWidth={1.2}
                  strokeDasharray="2 3"
                />
                <line
                  x1={stripLeft - 2 * coat}
                  y1={liquidY + 45}
                  x2={stripRight + 2 * coat}
                  y2={liquidY + 48}
                  stroke="var(--sphere-highlight)"
                  strokeWidth={1.2}
                  strokeDasharray="3 4"
                />
              </>
            )}
          </g>
        )}

        {/* Strip label at top */}
        <text
          x={0}
          y={stripTop - 10}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={13}
          fontWeight={600}
          fontFamily="var(--font-sans)"
          fill="var(--fg)"
          style={{ userSelect: 'none' }}
        >
          {stripMetal} strip
        </text>

        {/* Coating label pointer if coating is visible */}
        {coat >= 0.25 && (
          <g transform={`translate(${stripRight + 12}, ${liquidY + 22})`}>
            <line
              x1={-10}
              y1={0}
              x2={6}
              y2={0}
              stroke="var(--fg-muted)"
              strokeWidth={1.2}
            />
            <text
              x={10}
              y={0}
              textAnchor="start"
              dominantBaseline="central"
              fontSize={13}
              fontWeight={600}
              fontFamily="var(--font-sans)"
              fill={coatColor}
              style={{ userSelect: 'none' }}
            >
              {coatingMetal} deposit
            </text>
          </g>
        )}
      </g>

      {/* Ions moving in solution */}
      {renderedIons.map((ion) => {
        if (ion.opacity <= 0.05) return null
        const isOx = ion.tone === 'ox'
        const badgeBorder = isOx ? 'var(--ox)' : 'var(--red)'
        const badgeText = isOx ? 'var(--ox)' : 'var(--red)'

        return (
          <g
            key={ion.id}
            transform={`translate(${ion.curX}, ${ion.curY})`}
            opacity={ion.opacity}
          >
            {/* Ion badge pill (width 36, height 22) */}
            <rect
              x={-18}
              y={-11}
              width={36}
              height={22}
              rx={5}
              fill="var(--surface-raised)"
              stroke={badgeBorder}
              strokeWidth={1.4}
            />
            <text
              x={0}
              y={1}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={13}
              fontWeight={600}
              fontFamily="var(--font-sans)"
              fill={badgeText}
              style={{ userSelect: 'none' }}
            >
              {formatTrueMinus(ion.label)}
            </text>
          </g>
        )
      })}

      {/* Beaker Glass Walls */}
      <path
        d={`M ${bLeft - 4} ${bTop} L ${bLeft} ${bTop + 4} L ${bLeft} ${bBottom - 10} Q ${bLeft} ${bBottom} ${bLeft + 10} ${bBottom} L ${bRight - 10} ${bBottom} Q ${bRight} ${bBottom} ${bRight} ${bBottom - 10} L ${bRight} ${bTop + 4} L ${bRight + 4} ${bTop}`}
        fill="none"
        stroke="var(--glass-wall)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Glass vertical sheen highlight */}
      <line
        x1={bLeft + 10}
        y1={liquidY + 10}
        x2={bLeft + 10}
        y2={bBottom - 18}
        stroke="var(--glass-sheen)"
        strokeWidth={2.4}
        strokeLinecap="round"
        style={{ pointerEvents: 'none' }}
      />
    </g>
  )
})
