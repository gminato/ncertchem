'use client'

import { ReactionScheme } from '@/components/organic'
import {
  ACID_ROUTE_ROW_GAP,
  ACID_ROUTE_SCALES,
  ACID_ROUTE_SCHEME_WIDTH,
  ACID_ROUTE_STEPS,
  ACID_ROUTE_VIEW_HEIGHT,
  ACID_ROUTE_VIEW_WIDTH,
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
 * The six routes to a carboxylic acid, one reaction per Step. Each Step is drawn with the shared
 * ReactionScheme, so structures, reagents and carbon tags look the same as in the rest of the Unit.
 */
export function AcidRoutesScrolly({ step }: AcidRoutesScrollyProps) {
  const index = Math.min(Math.max(step, 0), ACID_ROUTE_STEPS.length - 1)
  const current = ACID_ROUTE_STEPS[index]
  const paths = current.rows.map(toSchemePath)
  const heights = paths.map((path) => rowHeight(path))
  const contentHeight = heights.reduce((sum, h) => sum + h, 0) + ACID_ROUTE_ROW_GAP * (heights.length - 1)
  const firstTop = (ACID_ROUTE_VIEW_HEIGHT - contentHeight) / 2
  const tops = heights.map((_, i) => firstTop + heights.slice(0, i).reduce((sum, h) => sum + h + ACID_ROUTE_ROW_GAP, 0))

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
      <title>{current.label}</title>
    </svg>
  )
}
