'use client'

import { ReactionScheme, SkeletalFormula, reactionSchemeSize } from '@/components/organic'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import { unit8Name } from '@/lib/chem/ncert-c12-unit8-data'
import { ROUTE_STEPS, routeScheme, type RouteArrow, type RouteBlock, type RouteSpecies } from './carbonyl-routes-steps'

export interface CarbonylRoutesScrollyProps {
  /** 0-based Step index from Scrolly. */
  step: number
  /** Each Step is a fixed picture: the change between Steps is a cut, so there is no tween to skip. */
  reducedMotion: boolean
}

/** One viewBox for every Step, so the panel keeps the same size as the reader scrolls. */
const W = 580
const H = 680
/** Nothing is drawn closer than EDGE to the viewBox edge. */
const EDGE = 12
/** Inset of each column's content from its slot, so a scheme never runs into the next column. */
const PAD = 12
const LABEL_H = 26
const GAP = 26
const INK = 'var(--fg-muted)'
/** Step 1 stacks each alcohol above its product, so the down arrow reads top to bottom. */
const STACK_SCALE = 52

/** Columns share the width; each column's content sits PAD inside its slot. */
function slotsFor(count: number) {
  const slotWidth = (W - 2 * EDGE) / count
  return Array.from({ length: count }, (_, c) => ({ x: EDGE + c * slotWidth + PAD, width: slotWidth - 2 * PAD }))
}

/** One alcohol, a DOWN arrow with its reagent, and the product, centred on `cx` from `top`. */
function StackedBlock({ block, cx, top }: { block: RouteBlock; cx: number; top: number }) {
  // Step 1 blocks are always one alcohol, one arrow, one product: a list, an arrow, a list.
  const [reactants, arrow, products] = block.sequence as readonly [readonly RouteSpecies[], RouteArrow, readonly RouteSpecies[]]
  const from = reactants[0]
  const to = products[0]
  const [head, tail] = block.label.split(' gives ')
  const yFrom = top + LABEL_H + 56
  const yArrowTop = yFrom + 76
  const yArrowTip = yArrowTop + 64
  const yTo = yArrowTip + 56
  return (
    <g>
      <text x={cx} y={top + 16} fontSize={15} fill={INK} textAnchor="middle">
        {head}
      </text>
      {tail ? (
        <text x={cx} y={top + 16 + 20} fontSize={15} fill={INK} textAnchor="middle">
          {`gives ${tail}`}
        </text>
      ) : null}
      <SkeletalFormula graph={parseSmiles(from.smiles ?? '')} scale={STACK_SCALE} x={cx} y={yFrom} />
      <text x={cx} y={yFrom + 58} fontSize={15} fill={INK} textAnchor="middle">
        {unit8Name(from.smiles ?? '')}
      </text>
      <line x1={cx} y1={yArrowTop} x2={cx} y2={yArrowTip - 6} stroke={INK} strokeWidth={2} />
      <polygon points={`${cx - 6},${yArrowTip - 10} ${cx + 6},${yArrowTip - 10} ${cx},${yArrowTip}`} fill={INK} />
      <text x={cx + 14} y={(yArrowTop + yArrowTip) / 2 + 5} fontSize={16} fill={INK}>
        {arrow.reagents}
      </text>
      <SkeletalFormula graph={parseSmiles(to.smiles ?? '')} scale={STACK_SCALE} x={cx} y={yTo} />
      <text x={cx} y={yTo + 58} fontSize={15} fill={INK} textAnchor="middle">
        {unit8Name(to.smiles ?? '')}
      </text>
    </g>
  )
}

const STACK_HEIGHT = 56 + 76 + 64 + 56 + 58 + 24

export function CarbonylRoutesScrolly({ step }: CarbonylRoutesScrollyProps) {
  const index = Math.min(ROUTE_STEPS.length - 1, Math.max(0, Math.round(step)))
  const stepData = ROUTE_STEPS[index]
  const slots = slotsFor(stepData.columns.length)

  const stacked = index === 0

  const columns = stepData.columns.map((blocks, c) => {
    const slot = slots[c]
    const placed = blocks.map((block) => {
      const scheme = routeScheme(block.sequence)
      const height = stacked ? STACK_HEIGHT : reactionSchemeSize(scheme, slot.width).height
      return { block, scheme, height }
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
        const slot = slots[c]
        let y = column.top
        return column.placed.map((p, i) => {
          const top = y
          y += LABEL_H + p.height + GAP
          if (stacked) {
            return <StackedBlock key={`${c}-${i}`} block={p.block} cx={slot.x + slot.width / 2} top={top} />
          }
          return (
            <g key={`${c}-${i}`}>
              <text x={slot.x} y={top + 16} fontSize={15} fill={INK}>
                {p.block.label}
              </text>
              <ReactionScheme sequence={p.scheme} maxWidth={slot.width} x={slot.x} y={top + LABEL_H} />
            </g>
          )
        })
      })}
    </svg>
  )
}
