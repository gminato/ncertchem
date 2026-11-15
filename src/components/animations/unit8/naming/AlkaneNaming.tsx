'use client'

import { SkeletalFormula, drawingFrame, type SkeletalMark } from '@/components/organic'
import { Label, VocabDefs } from '@/components/vocab'
import { useReveal } from '@/components/animations/unit4/vbt/useStepTween'
import {
  NAMING_GRAPH,
  NAMING_NUMBERING,
  NAMING_STEP_COUNT,
  namingStep,
  type NamingCallout,
} from './alkane-naming-steps'

export interface AlkaneNamingProps {
  step: number
  reducedMotion: boolean
}

/** Pixels per bond: large enough that the bonds are 40 units or more and the labels read at 13 px. */
const SCALE = 72
const CENTRE = { x: 290, y: 200 }

/**
 * The naming Scrolly: a branched alkane drawn large. The steps highlight the tempting short path,
 * then the longest chain, number it from the end that gives the lower locants, label each side
 * chain, and show the assembled name. Every name, locant and count comes from the lib.
 */
export function AlkaneNaming({ step, reducedMotion }: AlkaneNamingProps) {
  const index = Math.min(NAMING_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const current = namingStep(index)
  const reveal = useReveal(index, reducedMotion)
  const frame = drawingFrame(NAMING_GRAPH, SCALE)

  const locants: SkeletalMark[] = current.showNumbers
    ? NAMING_NUMBERING.order.map((atom, k) => ({ atom, label: String(k + 1) }))
    : []

  const centroid = {
    x: NAMING_NUMBERING.order.reduce((s, a) => s + frame.points[a].x, 0) / NAMING_NUMBERING.order.length,
    y: NAMING_NUMBERING.order.reduce((s, a) => s + frame.points[a].y, 0) / NAMING_NUMBERING.order.length,
  }

  /** A callout sits beyond the side chain's first carbon, pushed away from the chain carbon it hangs from. */
  const calloutPlace = (callout: NamingCallout) => {
    const a = frame.points[callout.attach]
    const b = frame.points[callout.anchor]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy) || 1
    const x = b.x + (dx / len) * 0.75 * SCALE
    const y = b.y + (dy / len) * 0.75 * SCALE
    const anchor: 'start' | 'middle' | 'end' = Math.abs(dx) < 0.2 * len ? 'middle' : dx > 0 ? 'start' : 'end'
    return { x: CENTRE.x + x, y: CENTRE.y + y, anchor }
  }

  return (
    <svg
      viewBox="0 0 580 440"
      role="img"
      aria-label={`Branched alkane, named step by step. ${current.caption}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-step={index}
      data-testid="naming-visual"
    >
      <VocabDefs />
      <SkeletalFormula
        graph={NAMING_GRAPH}
        scale={SCALE}
        x={CENTRE.x}
        y={CENTRE.y}
        highlightAtoms={current.highlightAtoms}
        highlightBonds={current.highlightBonds}
        locants={locants}
      />
      <g opacity={reveal} data-testid="naming-callouts">
        {current.callouts.map((c) => {
          const p = calloutPlace(c)
          return (
            <Label key={`${c.attach}-${c.text}`} x={p.x} y={p.y} textAnchor={p.anchor} fontSize={20} fill="var(--locant)" data-testid="naming-callout">
              {c.text}
            </Label>
          )
        })}
      </g>
      <Label x={290} y={392} fontSize={20} fill="var(--fg)" data-testid="naming-caption">
        {current.caption}
      </Label>
    </svg>
  )
}
