'use client'

import type { ReactNode } from 'react'
import { type SchemePath, ReactionScheme } from '@/components/organic'
import { CARBONYL_PREPARATIONS } from '@/lib/chem/ncert-c12-unit8-data'
import { ACETOPHENONE_NAME, AROMPREP_STEPS, aromprepStepBlocks, blockGap } from './aromprep-steps'

export interface AromaticCarbonylScrollyProps {
  /** 0-based Step index from Scrolly. */
  step: number
  /** Unused: the Steps are static drawings, so reduced motion changes nothing. */
  reducedMotion?: boolean
}

/** One viewBox for every Step, so the panel keeps the same size as the reader scrolls. */
const W = 580
const H = 720
const CAPTION_Y = H - 34
const LABEL_SIZE = 15
const LABEL_LINE = 22
/** Labelled route rows (Steps 6 and 7) start 28 units from the top; other Steps are centred. */
const ROUTE_TOP = 28
const INK = 'var(--fg)'
const MUTED = 'var(--fg-muted)'

/** Bottom caption of a Step, by 0-based index (none for the other Steps). */
function captionFor(index: number): string | undefined {
  if (index === 3) return CARBONYL_PREPARATIONS.sideChainChlorination.note
  if (index === 6) return `All three give ${ACETOPHENONE_NAME}`
  return undefined
}

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
  const gap = blockGap(blocks)
  const anchored = blocks.length > 1 && blocks.some((b) => b.label !== undefined)
  const totalHeight = blocks.reduce((sum, b) => sum + b.height + (b.label ? LABEL_LINE : 0), 0) + gap * (blocks.length - 1)
  // Labelled route rows start near the top; every other Step is centred in the space above the caption.
  let y = anchored ? ROUTE_TOP : (CAPTION_Y - 40 - totalHeight) / 2
  const lines: ReactNode[] = []
  blocks.forEach((block, i) => {
    const x = (W - block.width) / 2
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
  const caption = captionFor(index)
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Routes to aromatic aldehydes and ketones, Step ${index + 1} of ${AROMPREP_STEPS.length}`}
      data-step={index}
      style={{ display: 'block', width: '100%', height: 'auto' }}
    >
      {lines}
      {caption && <Caption x={W / 2} y={CAPTION_Y}>{caption}</Caption>}
    </svg>
  )
}
