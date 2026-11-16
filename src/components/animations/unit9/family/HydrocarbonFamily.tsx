'use client'

import { SkeletalFormula } from '@/components/organic'
import { ringGraph } from '@/components/organic'
import { VocabDefs, Label, LabelSub, LabelSup } from '@/components/vocab'
import { useReveal } from '@/components/animations/unit4/vbt/useStepTween'
import { Formula, fitScale, formulaPieces, type FormulaPiece } from './formula'
import { ExplicitDrawing, hasExplicit } from './explicit'
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

/** Bond length in pixels for each Step: the small molecules are drawn large, and benzene fits its box. */
function bondLength(view: FamilyView): number {
  if (view.formula === 'CH4') return 96
  if (hasExplicit(view.smiles)) return 110
  return fitScale(view.graph, 150, 360, 200)
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
 * The hydrocarbon-family Scrolly: one carbon grows into the four families. Methane, ethane, ethene and ethyne are
 * drawn with every hydrogen; benzene is drawn as one ring with its inscribed circle (no separate Kekulé bonds).
 * Every name, formula, angle and π count is read from the lib (family-steps.ts).
 */
export function HydrocarbonFamily({ step, reducedMotion }: HydrocarbonFamilyProps) {
  const index = Math.min(FAMILY_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const view = familyView(index)
  const reveal = useReveal(index, reducedMotion)
  const scale = bondLength(view)
  const general = GENERAL[view.family]
  const isMethane = view.formula === 'CH4'
  const cy = isMethane ? 186 : CENTRE.y
  const explicit = hasExplicit(view.smiles)

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
        <Label x={CENTRE.x} y={44} fontSize={24} fill="var(--fg)" data-testid="family-title">
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

        {explicit ? (
          <ExplicitDrawing smiles={view.smiles} cx={CENTRE.x} cy={cy} scale={scale} />
        ) : (
          <SkeletalFormula
            graph={view.family === 'Arene' ? ringGraph([1, 1, 1, 1, 1, 1]) : view.graph}
            scale={scale}
            x={CENTRE.x}
            y={CENTRE.y}
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
