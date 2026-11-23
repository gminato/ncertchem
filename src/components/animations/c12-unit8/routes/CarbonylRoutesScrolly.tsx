'use client'

import { ReactionScheme, SkeletalFormula, reactionSchemeSize, skeletalBounds } from '@/components/organic'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import { unit8Name } from '@/lib/chem/ncert-c12-unit8-data'
import {
  CAPTION_GAP,
  CAPTION_H,
  DROP_LEN,
  NAME_BASELINE,
  ROUTE_STEPS,
  ROW_GAP,
  layoutRow,
  routeScheme,
  step6Heights,
  step6Parts,
  step6Scale,
  type RouteArrow,
  type RouteBlock,
  type RouteSpecies,
} from './carbonyl-routes-steps'

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
/** Step 1: the top of each molecule sits this far below the block's top, under its caption. */
const STACK_TOP = 52

/** Columns share the width; each column's content sits PAD inside its slot. */
function slotsFor(count: number) {
  const slotWidth = (W - 2 * EDGE) / count
  return Array.from({ length: count }, (_, c) => ({ x: EDGE + c * slotWidth + PAD, width: slotWidth - 2 * PAD }))
}

/**
 * Step 1 geometry, relative to the block's top. Each molecule's drawing is measured, so its name sits
 * NAME_BASELINE below the molecule's lowest atom label, whatever the molecule.
 */
function stackLayout(block: RouteBlock) {
  const [reactants, , products] = block.sequence as readonly [readonly RouteSpecies[], RouteArrow, readonly RouteSpecies[]]
  const from = skeletalBounds(parseSmiles(reactants[0].smiles ?? ''), STACK_SCALE)
  const to = skeletalBounds(parseSmiles(products[0].smiles ?? ''), STACK_SCALE)
  const yFrom = STACK_TOP - from.y
  const nameFrom = yFrom + from.y + from.height + NAME_BASELINE
  const yArrowTop = nameFrom + 16
  const yArrowTip = yArrowTop + 64
  const yTo = yArrowTip + 12 - to.y
  const nameTo = yTo + to.y + to.height + NAME_BASELINE
  return { yFrom, nameFrom, yArrowTop, yArrowTip, yTo, nameTo, height: nameTo + 4 }
}

/** One alcohol, a DOWN arrow with its reagent, and the product, centred on `cx` from `top`. */
function StackedBlock({ block, cx, top }: { block: RouteBlock; cx: number; top: number }) {
  // Step 1 blocks are always one alcohol, one arrow, one product: a list, an arrow, a list.
  const [reactants, arrow, products] = block.sequence as readonly [readonly RouteSpecies[], RouteArrow, readonly RouteSpecies[]]
  const from = reactants[0]
  const to = products[0]
  const s = stackLayout(block)
  const [head, tail] = block.label.split(' gives ')
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
      <SkeletalFormula graph={parseSmiles(from.smiles ?? '')} scale={STACK_SCALE} x={cx} y={top + s.yFrom} />
      <text x={cx} y={top + s.nameFrom} fontSize={15} fill={INK} textAnchor="middle">
        {unit8Name(from.smiles ?? '')}
      </text>
      <line x1={cx} y1={top + s.yArrowTop} x2={cx} y2={top + s.yArrowTip - 6} stroke={INK} strokeWidth={2} />
      <polygon
        points={`${cx - 6},${top + s.yArrowTip - 10} ${cx + 6},${top + s.yArrowTip - 10} ${cx},${top + s.yArrowTip}`}
        fill={INK}
      />
      <text x={cx + 14} y={top + (s.yArrowTop + s.yArrowTip) / 2 + 5} fontSize={16} fill={INK}>
        {arrow.reagents}
      </text>
      <SkeletalFormula graph={parseSmiles(to.smiles ?? '')} scale={STACK_SCALE} x={cx} y={top + s.yTo} />
      <text x={cx} y={top + s.nameTo} fontSize={15} fill={INK} textAnchor="middle">
        {unit8Name(to.smiles ?? '')}
      </text>
    </g>
  )
}

/** One Step 6 row: each molecule centred on the row's centre line, its name under it; arrows with reagents above and conditions below. */
function RowDrawing({ row, top, scale }: { row: ReturnType<typeof layoutRow>; top: number; scale: number }) {
  const cy = top + row.centre
  return (
    <g>
      {row.items.map((item, i) => {
        const cx = EDGE + item.x + item.width / 2
        if (item.kind === 'arrow') {
          const x1 = EDGE + item.x
          const x2 = x1 + item.width
          return (
            <g key={i}>
              <line x1={x1} y1={cy} x2={x2 - 6} y2={cy} stroke={INK} strokeWidth={2} />
              <polygon points={`${x2 - 10},${cy - 6} ${x2 - 10},${cy + 6} ${x2},${cy}`} fill={INK} />
              {item.reagents ? (
                <text x={cx} y={cy - 14} fontSize={16} fill={INK} textAnchor="middle">
                  {item.reagents}
                </text>
              ) : null}
              {item.conditions ? (
                <text x={cx} y={cy + 22} fontSize={16} fill={INK} textAnchor="middle">
                  {item.conditions}
                </text>
              ) : null}
            </g>
          )
        }
        if (item.kind === 'text') {
          return (
            <text key={i} x={cx} y={cy} dominantBaseline="central" fontSize={22} fill="var(--fg)" textAnchor="middle">
              {item.text}
            </text>
          )
        }
        return (
          <g key={i}>
            <SkeletalFormula graph={parseSmiles(item.smiles ?? '')} scale={scale} x={cx} y={cy - item.by - item.height / 2} />
            {item.tag ? (
              <text x={cx} y={cy + row.hMax / 2 + NAME_BASELINE} fontSize={15} fill={INK} textAnchor="middle">
                {item.tag}
              </text>
            ) : null}
          </g>
        )
      })}
    </g>
  )
}

/**
 * Step 6, top to bottom: the Stephen caption; row A1 (nitrile, SnCl₂ + HCl, imine); row A2, an arrow
 * dropping from under the imine with H₃O⁺ beside it, to pentanal; the DIBAL-H caption; row B.
 * Every structure uses the one scale from step6Scale.
 */
function Step6({ scale }: { scale: number }) {
  const { a1, hydrolysisArrow, product, b } = step6Parts()
  const heights = step6Heights(scale)
  const rowA1Layout = layoutRow(a1, scale)
  const rowBLayout = layoutRow(b, scale)
  const captionA = EDGE
  const rowA1 = captionA + CAPTION_H + CAPTION_GAP
  const rowA2 = rowA1 + heights.a1
  const captionB = rowA2 + heights.hydrolysis + ROW_GAP
  const rowB = captionB + CAPTION_H + CAPTION_GAP

  const imine = rowA1Layout.items[2]
  const cx = EDGE + imine.x + imine.width / 2
  const productGraph = parseSmiles(product.smiles ?? '')
  const bounds = skeletalBounds(productGraph, scale)
  const tip = rowA2 + CAPTION_GAP + DROP_LEN
  const drawTop = tip + 8

  return (
    <g>
      <text x={EDGE} y={captionA + 12} fontSize={15} fill={INK}>
        Route A: Stephen reaction
      </text>
      <RowDrawing row={rowA1Layout} top={rowA1} scale={scale} />
      <line x1={cx} y1={rowA2 + CAPTION_GAP} x2={cx} y2={tip - 6} stroke={INK} strokeWidth={2} />
      <polygon points={`${cx - 6},${tip - 10} ${cx + 6},${tip - 10} ${cx},${tip}`} fill={INK} />
      <text x={cx + 14} y={rowA2 + CAPTION_GAP + DROP_LEN / 2 + 5} fontSize={16} fill={INK}>
        {hydrolysisArrow.reagents}
      </text>
      <SkeletalFormula graph={productGraph} scale={scale} x={cx} y={drawTop - bounds.y} />
      <text x={cx} y={drawTop + bounds.height + NAME_BASELINE} fontSize={15} fill={INK} textAnchor="middle">
        {unit8Name(product.smiles ?? '')}
      </text>
      <text x={EDGE} y={captionB + 12} fontSize={15} fill={INK}>
        Route B: DIBAL-H
      </text>
      <RowDrawing row={rowBLayout} top={rowB} scale={scale} />
    </g>
  )
}

export function CarbonylRoutesScrolly({ step }: CarbonylRoutesScrollyProps) {
  const index = Math.min(ROUTE_STEPS.length - 1, Math.max(0, Math.round(step)))
  const stepData = ROUTE_STEPS[index]
  const slots = slotsFor(stepData.columns.length)

  const stacked = index === 0
  const isStep6 = index === ROUTE_STEPS.length - 1

  const columns = stepData.columns.map((blocks, c) => {
    const slot = slots[c]
    const placed = blocks.map((block) => {
      const scheme = routeScheme(block.sequence)
      const height = stacked ? stackLayout(block).height : LABEL_H + reactionSchemeSize(scheme, slot.width).height
      return { block, scheme, height }
    })
    const total = placed.reduce((sum, p) => sum + p.height, 0) + GAP * (placed.length - 1)
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
      {isStep6 ? (
        <Step6 scale={step6Scale()} />
      ) : (
        columns.map((column, c) => {
          const slot = slots[c]
          let y = column.top
          return column.placed.map((p, i) => {
            const top = y
            y += p.height + GAP
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
        })
      )}
    </svg>
  )
}
