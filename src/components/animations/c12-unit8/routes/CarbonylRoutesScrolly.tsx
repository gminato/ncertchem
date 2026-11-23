'use client'

import { ReactionScheme, reactionSchemeSize } from '@/components/organic'
import { ROUTE_STEPS, routeScheme } from './carbonyl-routes-steps'

export interface CarbonylRoutesScrollyProps {
  /** 0-based Step index from Scrolly. */
  step: number
  /** Each Step is a fixed picture: the change between Steps is a cut, so there is no tween to skip. */
  reducedMotion: boolean
}

/** One viewBox for every Step, so the panel keeps the same size as the reader scrolls. */
const W = 580
const H = 560
const LABEL_H = 26
const GAP = 26
const INK = 'var(--fg-muted)'

export function CarbonylRoutesScrolly({ step }: CarbonylRoutesScrollyProps) {
  const index = Math.min(ROUTE_STEPS.length - 1, Math.max(0, Math.round(step)))
  const columnWidth = W / ROUTE_STEPS[index].columns.length
  const maxWidth = columnWidth - 20

  const columns = ROUTE_STEPS[index].columns.map((blocks) => {
    const placed = blocks.map((block) => {
      const scheme = routeScheme(block.sequence)
      return { label: block.label, scheme, height: reactionSchemeSize(scheme, maxWidth).height }
    })
    const total = placed.reduce((sum, p) => sum + LABEL_H + p.height, 0) + GAP * (placed.length - 1)
    return { placed, top: (H - total) / 2 }
  })

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Preparation of aldehydes and ketones, Step ${index + 1} of ${ROUTE_STEPS.length}`}
      data-step={index}
      style={{ display: 'block', width: '100%', height: 'auto' }}
    >
      {columns.map((column, c) => {
        const x = c * columnWidth + 10
        let y = column.top
        return column.placed.map((p, i) => {
          const top = y
          y += LABEL_H + p.height + GAP
          return (
            <g key={`${c}-${i}`}>
              <text x={x} y={top + 16} fontSize={15} fill={INK}>
                {p.label}
              </text>
              <ReactionScheme sequence={p.scheme} maxWidth={maxWidth} x={x} y={top + LABEL_H} />
            </g>
          )
        })
      })}
    </svg>
  )
}
