'use client'

import { SkeletalFormula, stereoPath } from '@/components/organic'
import { VocabDefs, Label, LabelSub, LabelSup } from '@/components/vocab'
import { useReveal } from '@/components/animations/unit4/vbt/useStepTween'
import { Formula, fitScale, formulaPieces, type FormulaPiece } from './formula'
import { FAMILY_STEP_COUNT, familyView, type FamilyView } from './family-steps'

export interface HydrocarbonFamilyProps {
  step: number
  reducedMotion: boolean
}

const CENTRE = { x: 290, y: 196 }

/** The general formula of an acyclic family, or null for the ring. */
const GENERAL: Partial<Record<FamilyView['family'], FormulaPiece[]>> = {
  Alkane: ['C', { sub: 'n' }, 'H', { sub: '2n+2' }],
  Alkene: ['C', { sub: 'n' }, 'H', { sub: '2n' }],
  Alkyne: ['C', { sub: 'n' }, 'H', { sub: '2n−2' }],
}

/** The hybridisation as a label: sp with a superscript, e.g. sp³ or sp². */
function HybridText({ view }: { view: FamilyView }) {
  const n = view.hybrid.replace('sp', '')
  const sup = n === '3' ? '3' : n === '2' ? '2' : ''
  return (
    <Label x={CENTRE.x} y={390} fontSize={19} fill="var(--fg-muted)">
      every carbon sp
      <LabelSup>{sup}</LabelSup>
      {` · bond angle ${view.angle}°`}
    </Label>
  )
}

/**
 * The hydrocarbon-family Scrolly: one carbon grows into the four families. Each Step draws the
 * molecule large, names the family with its general formula and labels the hybridisation. Every
 * name, formula, angle and π count is read from the lib (family-steps.ts).
 */
export function HydrocarbonFamily({ step, reducedMotion }: HydrocarbonFamilyProps) {
  const index = Math.min(FAMILY_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const view = familyView(index)
  const reveal = useReveal(index, reducedMotion)
  const isMethane = view.formula === 'CH4'
  const scale = isMethane ? 96 : fitScale(view.graph, 150, 360, 200)
  const general = GENERAL[view.family]
  const h = scale * 0.92

  return (
    <svg
      viewBox="0 0 580 440"
      role="img"
      aria-label={`${view.family} family, step ${index + 1} of ${FAMILY_STEP_COUNT}: ${view.name}, ${view.formula}. ${view.note}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-step={index}
      data-testid="family-visual"
    >
      <VocabDefs />
      <g opacity={reveal}>
        <Label x={CENTRE.x} y={46} fontSize={24} fill="var(--fg)" data-testid="family-title">
          {view.family}
          {general ? (
            <>
              {'  ·  '}
              {general.map((p, i) => (typeof p === 'string' ? <tspan key={i}>{p}</tspan> : 'sub' in p ? <LabelSub key={i}>{p.sub}</LabelSub> : <LabelSup key={i}>{p.sup}</LabelSup>))}
            </>
          ) : (
            '  ·  aromatic ring, six sp² carbons'
          )}
        </Label>

        {isMethane ? (
          <g data-testid="methane-tetrahedral">
            <path d={stereoPath({ x: CENTRE.x, y: CENTRE.y }, { x: CENTRE.x, y: CENTRE.y - h }, 'wedge', 0.09 * scale)} fill="var(--sigma-bond)" />
            <path d={stereoPath({ x: CENTRE.x, y: CENTRE.y }, { x: CENTRE.x, y: CENTRE.y + h }, 'dash', 0.09 * scale)} stroke="var(--sigma-bond)" fill="none" />
            <line x1={CENTRE.x - 0.85 * h} y1={CENTRE.y + 0.3 * h} x2={CENTRE.x} y2={CENTRE.y} stroke="var(--sigma-bond)" strokeWidth={3} />
            <line x1={CENTRE.x + 0.85 * h} y1={CENTRE.y + 0.3 * h} x2={CENTRE.x} y2={CENTRE.y} stroke="var(--sigma-bond)" strokeWidth={3} />
            <Label x={CENTRE.x} y={CENTRE.y + 2} fontSize={30} fill="var(--fg)">C</Label>
            <Label x={CENTRE.x} y={CENTRE.y - h - 16} fontSize={24} fill="var(--fg)">H</Label>
            <Label x={CENTRE.x} y={CENTRE.y + h + 22} fontSize={24} fill="var(--fg)">H</Label>
            <Label x={CENTRE.x - 0.85 * h - 22} y={CENTRE.y + 0.3 * h + 8} fontSize={24} fill="var(--fg)">H</Label>
            <Label x={CENTRE.x + 0.85 * h + 22} y={CENTRE.y + 0.3 * h + 8} fontSize={24} fill="var(--fg)">H</Label>
          </g>
        ) : (
          <SkeletalFormula
            graph={view.graph}
            scale={scale}
            x={CENTRE.x}
            y={CENTRE.y}
            highlightBonds={view.family === 'Arene' ? [] : view.multipleBonds}
            innerCircles={view.family === 'Arene'}
            data-testid="family-drawing"
          />
        )}

        <Formula pieces={formulaPieces(view.formula)} x={CENTRE.x} y={334} fontSize={26} />
        <Label x={CENTRE.x} y={362} fontSize={19} fill="var(--fg-muted)" data-testid="family-name">
          {view.name}
        </Label>
        <HybridText view={view} />
        <Label x={CENTRE.x} y={420} fontSize={17} fill="var(--fg-muted)">
          {view.note}
        </Label>
      </g>
    </svg>
  )
}
