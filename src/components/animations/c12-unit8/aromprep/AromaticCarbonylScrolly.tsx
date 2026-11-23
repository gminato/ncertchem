'use client'

import type { ReactNode } from 'react'
import { type SchemePath, ReactionScheme } from '@/components/organic'
import { CARBONYL_PREPARATIONS } from '@/lib/chem/ncert-c12-unit8-data'
import { ACETOPHENONE_NAME, AROMPREP_STEPS, aromprepStepBlocks, SCHEME_WIDTH } from './aromprep-steps'

export interface AromaticCarbonylScrollyProps {
  /** 0-based Step index from Scrolly. */
  step: number
  /** Unused: the Steps are static drawings, so reduced motion changes nothing. */
  reducedMotion?: boolean
}

/** One viewBox for every Step, so the panel keeps the same size as the reader scrolls. */
const W = 580
const H = 960
const SCHEME_X = (W - SCHEME_WIDTH) / 2
const CAPTION_Y = H - 34
const LABEL_SIZE = 15
const LABEL_LINE = 22
const BLOCK_GAP = 12
const INK = 'var(--fg)'
const MUTED = 'var(--fg-muted)'

function Caption({ x, y, children, fill = MUTED }: { x: number; y: number; children: ReactNode; fill?: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={LABEL_SIZE} fill={fill}>
      {children}
    </text>
  )
}

export function AromaticCarbonylScrolly({ step }: AromaticCarbonylScrollyProps) {
  const index = Math.min(AROMPREP_STEPS.length - 1, Math.max(0, Math.round(step)))
  const blocks = aromprepStepBlocks(index)
  const isRouteStep = blocks.length > 1
  const totalHeight = blocks.reduce((sum, b) => sum + b.height + (b.label ? LABEL_LINE : 0), 0) + BLOCK_GAP * (blocks.length - 1)
  // Single schemes are centred in the space above the caption; route stacks start near the top.
  let y = isRouteStep ? 28 : (CAPTION_Y - 40 - totalHeight) / 2
  const lines: ReactNode[] = []
  blocks.forEach((block, i) => {
    if (block.label) {
      lines.push(
        <text key={`label-${i}`} x={SCHEME_X} y={y + LABEL_SIZE} fontSize={LABEL_SIZE} fill={INK}>
          {block.label}
        </text>,
      )
      y += LABEL_LINE
    }
    lines.push(
      <g key={`scheme-${i}`} transform={`translate(${SCHEME_X} ${y})`}>
        <ReactionScheme sequence={block.path} maxWidth={SCHEME_WIDTH} x={0} y={0} />
      </g>,
    )
    y += block.height + BLOCK_GAP
  })
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Routes to aromatic aldehydes and ketones, Step ${index + 1} of ${AROMPREP_STEPS.length}`}
      data-step={index}
      style={{ display: 'block', width: '100%', height: 'auto' }}
    >
      {lines}
      {index === 3 && <Caption x={W / 2} y={CAPTION_Y}>{CARBONYL_PREPARATIONS.sideChainChlorination.note}</Caption>}
      {isRouteStep && <Caption x={W / 2} y={CAPTION_Y}>{`All three give ${ACETOPHENONE_NAME}`}</Caption>}
    </svg>
  )
}
