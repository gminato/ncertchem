'use client'

import type { ReactNode } from 'react'
import { type SchemePath, ReactionScheme } from '@/components/organic'
import { CARBONYL_PREPARATIONS } from '@/lib/chem/ncert-c12-unit8-data'
import { ACETOPHENONE_NAME, AROMPREP_STEPS, aromprepStepBlocks, ROUTE_WIDTH, SCHEME_WIDTH } from './aromprep-steps'

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
/** Step 6 rows: 12-unit side margins (the widest row is ROUTE_WIDTH) and a clear gap between routes. */
const ROUTE_X = (W - ROUTE_WIDTH) / 2
const ROUTE_GAP = 28
const ROUTE_TOP = 28
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
  const gap = isRouteStep ? ROUTE_GAP : BLOCK_GAP
  const x = isRouteStep ? ROUTE_X : SCHEME_X
  const totalHeight = blocks.reduce((sum, b) => sum + b.height + (b.label ? LABEL_LINE : 0), 0) + gap * (blocks.length - 1)
  // Single schemes are centred in the space above the caption; the three route rows start near the top.
  let y = isRouteStep ? ROUTE_TOP : (CAPTION_Y - 40 - totalHeight) / 2
  const lines: ReactNode[] = []
  blocks.forEach((block, i) => {
    if (block.label) {
      lines.push(
        <text key={`label-${i}`} x={x} y={y + LABEL_SIZE} fontSize={LABEL_SIZE} fill={INK}>
          {block.label}
        </text>,
      )
      y += LABEL_LINE
    }
    lines.push(
      <g key={`scheme-${i}`} transform={`translate(${x} ${y})`}>
        <ReactionScheme sequence={block.path} maxWidth={block.width} scales={block.scales} x={0} y={0} />
      </g>,
    )
    y += block.height + gap
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
