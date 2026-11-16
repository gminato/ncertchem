'use client'

import { PolymerChain, SkeletalFormula, drawingFrame } from '@/components/organic'
import { ReagentTest } from '@/components/organic/lab'
import { Label, VocabDefs } from '@/components/vocab'
import { useStepTween } from '@/components/animations/unit4/vbt/useStepTween'
import {
  CLEAVAGE_STEP_COUNT,
  CUT_PRODUCT,
  CYCLOHEXENE,
  DIOL,
  METHYLCYCLOHEXENE,
  REVERSE_IN,
  REVERSE_OUT,
  carbonDoubleBond,
  cleavageStep,
  type CleavageTarget,
} from './ozonolysis-steps'

export interface AlkeneCleavageProps {
  step: number
  reducedMotion: boolean
}

/** Pixels per bond length. The alkenes are drawn large; the chains are a little smaller so that they fit. */
const ALKENE_SCALE = 66
const CHAIN_SCALE = 52
const DIOL_SCALE = 60
const VIEW = { width: 900, height: 400 } as const
/** Centres of the two stations: the reactant on the left, the product on the right. */
const LEFT = { x: 330, y: 190 }
const RIGHT = { x: 775, y: 190 }
/** The arrow between the stations, and the centre of the caption above it. */
const ARROW = { x1: 455, x2: 605, y: 190 }
const ARROW_MID = (ARROW.x1 + ARROW.x2) / 2

/** A straight arrow from x1 to x2 at height y, with its head at x2. */
function Arrow({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  return (
    <g>
      <line x1={x1} y1={y} x2={x2 - 12} y2={y} stroke="var(--fg-muted)" strokeWidth={2.5} />
      <path d={`M ${x2 - 14} ${y - 7} L ${x2} ${y} L ${x2 - 14} ${y + 7} Z`} fill="var(--fg-muted)" />
    </g>
  )
}

/**
 * The dashed cut across the C=C of 1-methylcyclohexene, perpendicular to the bond, with its label on the
 * side away from the ring. Positions are in the viewBox.
 */
function cutAcross(): { x1: number; y1: number; x2: number; y2: number; lx: number; ly: number } | null {
  const bond = METHYLCYCLOHEXENE.bonds[carbonDoubleBond(METHYLCYCLOHEXENE)]
  if (!bond) return null
  const frame = drawingFrame(METHYLCYCLOHEXENE, ALKENE_SCALE)
  const p = frame.points[bond.a]
  const q = frame.points[bond.b]
  const mid = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }
  const len = Math.hypot(q.x - p.x, q.y - p.y) || 1
  let nx = -(q.y - p.y) / len
  let ny = (q.x - p.x) / len
  const ring = frame.points
  const cx = ring.reduce((s, pt) => s + pt.x, 0) / ring.length
  const cy = ring.reduce((s, pt) => s + pt.y, 0) / ring.length
  if ((mid.x - cx) * nx + (mid.y - cy) * ny < 0) {
    nx = -nx
    ny = -ny
  }
  const half = 0.75 * ALKENE_SCALE
  const out = half + 22
  return {
    x1: LEFT.x + mid.x - nx * half,
    y1: LEFT.y + mid.y - ny * half,
    x2: LEFT.x + mid.x + nx * half,
    y2: LEFT.y + mid.y + ny * half,
    lx: LEFT.x + mid.x + nx * out,
    ly: LEFT.y + mid.y + ny * out + 6,
  }
}

const CUT = cutAcross()

/**
 * The alkene-cleavage Scrolly. Baeyer's test (the tube decolourises and the diol forms), the C=C of
 * 1-methylcyclohexene cut by ozone, the carbonyl products, the reverse join, and the polymer. Each Step
 * sets opacities and progress values that tween from the last Step; the molecules, names and equations
 * come from the lib through ozonolysis-steps.ts.
 */
export function AlkeneCleavage({ step, reducedMotion }: AlkeneCleavageProps) {
  const index = Math.min(CLEAVAGE_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const current = cleavageStep(index)
  const t = useStepTween<CleavageTarget>(current.target, reducedMotion)

  return (
    <svg
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
      role="img"
      aria-label={`Alkene cleavage, step ${index + 1} of ${CLEAVAGE_STEP_COUNT}. ${current.caption}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-step={index}
      data-testid="cleavage-visual"
    >
      <VocabDefs />

      {/* Steps 0 and 1: Baeyer's test tube */}
      <g opacity={t.tube} data-testid="cleavage-tube">
        <g transform="translate(14 34) scale(1.08)">
          <ReagentTest reagent="baeyer" progress={t.reagent} label="Baeyer's reagent" x={0} y={0} />
        </g>
      </g>

      {/* Steps 0 and 1: cyclohexene and its diol */}
      <g opacity={t.alkeneA} data-testid="cleavage-alkene-a">
        <SkeletalFormula graph={CYCLOHEXENE} scale={ALKENE_SCALE} x={LEFT.x} y={LEFT.y} highlightBonds={current.alkeneBonds} />
      </g>
      <g opacity={t.diolA} data-testid="cleavage-diol">
        <SkeletalFormula graph={DIOL} scale={DIOL_SCALE} x={RIGHT.x} y={RIGHT.y} highlightAtoms={current.diolAtoms} />
      </g>
      <g opacity={t.arrowA}>
        <Arrow {...ARROW} />
        <Label x={ARROW_MID} y={ARROW.y - 22} fontSize={17} fill="var(--fg)" textAnchor="middle">
          cold dilute KMnO₄
        </Label>
        <Label x={ARROW_MID} y={ARROW.y + 30} fontSize={15} fill="var(--fg-muted)" textAnchor="middle">
          273 K
        </Label>
      </g>

      {/* Steps 2 and 3: 1-methylcyclohexene cut by ozone */}
      <g opacity={t.alkeneB} data-testid="cleavage-alkene-b">
        <SkeletalFormula graph={METHYLCYCLOHEXENE} scale={ALKENE_SCALE} x={LEFT.x} y={LEFT.y} highlightBonds={current.alkeneBonds} />
      </g>
      {CUT && (
        <g opacity={t.cut} data-testid="cleavage-cut">
          <line x1={CUT.x1} y1={CUT.y1} x2={CUT.x2} y2={CUT.y2} stroke="var(--fg)" strokeWidth={2.5} strokeDasharray="7 6" />
          <Label x={CUT.lx} y={CUT.ly} fontSize={18} fill="var(--fg)" textAnchor="middle">
            O₃
          </Label>
        </g>
      )}
      <g opacity={t.arrowB}>
        <Arrow {...ARROW} />
        <Label x={ARROW_MID} y={ARROW.y - 22} fontSize={17} fill="var(--fg)" textAnchor="middle">
          O₃, then Zn/H₂O
        </Label>
      </g>
      <g opacity={t.productB} data-testid="cleavage-product">
        <SkeletalFormula graph={CUT_PRODUCT} scale={CHAIN_SCALE} x={RIGHT.x} y={RIGHT.y} highlightAtoms={current.productAtoms} />
      </g>

      {/* Step 4: the reverse puzzle, carbonyls joined back into the alkene */}
      <g opacity={t.revIn} data-testid="cleavage-reverse-in">
        <SkeletalFormula graph={REVERSE_IN[0]} scale={CHAIN_SCALE} x={250} y={LEFT.y} highlightAtoms={current.revInAtoms} />
      </g>
      <g opacity={t.arrowR}>
        <Arrow x1={395} x2={545} y={ARROW.y} />
        <Label x={470} y={ARROW.y - 22} fontSize={17} fill="var(--fg)" textAnchor="middle">
          join the C=O carbons
        </Label>
      </g>
      <g opacity={t.revOut} data-testid="cleavage-reverse-out">
        <SkeletalFormula graph={REVERSE_OUT.graph} scale={ALKENE_SCALE} x={720} y={LEFT.y} highlightBonds={current.revOutBonds} />
      </g>

      {/* Step 5: ethene units joining into polythene */}
      <g opacity={t.polymer} data-testid="cleavage-polymer">
        <g transform="translate(0, 10)">
          <PolymerChain monomer="ethene" progress={t.polymerProgress} />
        </g>
      </g>

      <Label x={450} y={384} fontSize={19} fill="var(--fg)" textAnchor="middle" data-testid="cleavage-caption">
        {current.caption}
      </Label>
    </svg>
  )
}
