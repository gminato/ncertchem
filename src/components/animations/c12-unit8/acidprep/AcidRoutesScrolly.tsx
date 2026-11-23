'use client'

import { ReactionScheme, SkeletalFormula } from '@/components/organic'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import {
  ACID_ROUTE_MOLECULES,
  ACID_ROUTE_ROW_GAP,
  ACID_ROUTE_SCALES,
  ACID_ROUTE_SCHEME_WIDTH,
  ACID_ROUTE_STEPS,
  ACID_ROUTE_VIEW_HEIGHT,
  ACID_ROUTE_VIEW_WIDTH,
  placeColumn,
  rowHeight,
  toSchemePath,
} from './acid-routes-steps'

export interface AcidRoutesScrollyProps {
  /** 0-based Step index from Scrolly. */
  step: number
  /** Accepted for the Scrolly contract. Steps are cuts, so there is no tween to suppress. */
  reducedMotion?: boolean
}

/**
 * The six routes to a carboxylic acid, one reaction per Step. Steps with rows are drawn with the
 * shared ReactionScheme; Step 3 is a vertical column of skeletal molecules joined by down-arrows.
 */
export function AcidRoutesScrolly({ step }: AcidRoutesScrollyProps) {
  const index = Math.min(Math.max(step, 0), ACID_ROUTE_STEPS.length - 1)
  const current = ACID_ROUTE_STEPS[index]
  const cx = ACID_ROUTE_VIEW_WIDTH / 2

  const paths = current.rows.map(toSchemePath)
  const heights = paths.map((path) => rowHeight(path))
  const contentHeight = heights.reduce((sum, h) => sum + h, 0) + ACID_ROUTE_ROW_GAP * (heights.length - 1)
  const firstTop = (ACID_ROUTE_VIEW_HEIGHT - contentHeight) / 2
  const tops = heights.map((_, i) => firstTop + heights.slice(0, i).reduce((sum, h) => sum + h + ACID_ROUTE_ROW_GAP, 0))
  const column = current.column ? placeColumn(current.column) : []

  return (
    <svg
      viewBox={`0 0 ${ACID_ROUTE_VIEW_WIDTH} ${ACID_ROUTE_VIEW_HEIGHT}`}
      role="img"
      aria-label={current.label}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {paths.map((path, i) => (
        <ReactionScheme
          key={`${current.label}-${i}`}
          sequence={path}
          maxWidth={ACID_ROUTE_SCHEME_WIDTH}
          scales={ACID_ROUTE_SCALES}
          progress={1}
          x={(ACID_ROUTE_VIEW_WIDTH - ACID_ROUTE_SCHEME_WIDTH) / 2}
          y={tops[i]}
        />
      ))}
      {column.map(({ piece, top, height }, i) => {
        if ('arrow' in piece) {
          const y1 = top
          const y2 = top + height
          const mid = (y1 + y2) / 2
          return (
            <g key={`arrow-${i}`}>
              <line x1={cx} x2={cx} y1={y1} y2={y2 - 9} stroke="var(--fg-muted)" strokeWidth={2} strokeLinecap="round" />
              <path d={`M ${cx - 6} ${y2 - 9} L ${cx} ${y2} L ${cx + 6} ${y2 - 9}`} fill="none" stroke="var(--fg-muted)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              <text x={cx + 14} y={mid} dominantBaseline="central" fontSize={14} fontFamily="var(--font-sans)" fill="var(--fg)">
                {piece.arrow}
              </text>
              {piece.note && (
                <text x={cx + 14} y={mid + 18} dominantBaseline="central" fontSize={14} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
                  {piece.note}
                </text>
              )}
            </g>
          )
        }
        return (
          <SkeletalFormula
            key={`mol-${i}`}
            graph={parseSmiles(ACID_ROUTE_MOLECULES[piece.mol].smiles)}
            scale={ACID_ROUTE_SCALES[0]}
            x={cx}
            y={top + height / 2}
            highlightAtoms={piece.highlight}
          />
        )
      })}
      <title>{current.label}</title>
    </svg>
  )
}
