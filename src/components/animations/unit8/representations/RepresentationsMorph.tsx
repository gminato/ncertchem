'use client'

import type { ReactNode } from 'react'
import { Label } from '@/components/vocab'
import {
  COMPLETE_SCALE,
  DEFAULT_SCALE,
  SkeletalFormula,
  StructuralFormula,
  completeGrid,
  ease,
  skeletalBounds,
  subscriptDigits,
  type Bounds,
} from '@/components/organic'
import { Molecule3D, Molecule3DFallback, cameraForMolecule, type Molecule3DData } from '@/components/molecule'
import { Stage3DLazy } from '@/components/stage3d'
import { iupacName } from '@/lib/chem/iupac-organic'
import { molecularFormula } from '@/lib/chem/molecule-parse'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { useTweenedNumber } from '../../unit5/gibbs/useTweenedNumber'
import { WedgeLabelled } from './WedgeLabelled'
import {
  condensedFade,
  morphTarget,
  representationSteps,
  stepGraph,
  tetrahedralModel,
  type RepresentationStep,
} from './representations-steps'
import styles from './RepresentationsMorph.module.css'

export interface RepresentationsMorphProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 580
const VIEW_HEIGHT = 440
/** The drawing area: the main drawing is fitted to 72% of the width and to this height. */
const AREA = { cx: VIEW_WIDTH / 2, cy: 210, width: 0.72 * VIEW_WIDTH, height: 330 }
const MAX_FIT = 3
const STEPS = representationSteps()

const sub = (formula: string) => formula.replace(/\d+/g, (d) => subscriptDigits(Number(d)))

/** How a drawing is fitted: its scale, and the point of its own frame that sits at the centre of the area. */
interface Fit {
  k: number
  cx: number
  cy: number
}

/** The fit that makes a drawing's bounds fill the drawing area. */
function fitOf(b: Bounds): Fit {
  return {
    k: Math.min(MAX_FIT, AREA.width / b.width, AREA.height / b.height),
    cx: b.x + b.width / 2,
    cy: b.y + b.height / 2,
  }
}

const lerpFit = (a: Fit, b: Fit, t: number): Fit => ({
  k: a.k + (b.k - a.k) * t,
  cx: a.cx + (b.cx - a.cx) * t,
  cy: a.cy + (b.cy - a.cy) * t,
})

function fitTransform(f: Fit): string {
  const tx = AREA.cx - f.k * f.cx
  const ty = AREA.cy - f.k * f.cy
  return `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${f.k.toFixed(4)})`
}

/** The complete formula's bounds, centred on the origin as StructuralFormula centres it. */
function completeBounds(g: MolGraph): Bounds {
  const grid = completeGrid(g)
  const all = [...grid.heavy, ...grid.hydrogens.map((h) => h.pos)]
  const w = (Math.max(...all.map((p) => p.x)) - Math.min(...all.map((p) => p.x))) * COMPLETE_SCALE + 1.2 * COMPLETE_SCALE
  const h = (Math.max(...all.map((p) => p.y)) - Math.min(...all.map((p) => p.y))) * COMPLETE_SCALE + 1.2 * COMPLETE_SCALE
  return { x: -w / 2, y: -h / 2, width: w, height: h }
}

/** The title above the drawing says which written form is shown. */
const KIND_TITLE: Record<RepresentationStep['kind'], string> = {
  complete: 'Complete structural formula',
  condensed: 'Condensed structural formula',
  'bond-line': 'Bond-line formula',
  ring: 'Bond-line: a ring',
  arene: 'Bond-line: a benzene ring with a substituent',
  tetrahedral: 'Wedge and dash for a tetrahedral carbon',
}

/** Caption under the drawing: the lib's name and formula for the molecule. */
function caption(graph: MolGraph): string {
  let name: string
  try {
    name = iupacName(graph)
  } catch {
    name = 'this molecule'
  }
  return `${name}, ${sub(molecularFormula(graph))}`
}

/** The shared fade-in class, dropped under reduced motion so the Step is shown at once. */
const enter = (reducedMotion: boolean) => (reducedMotion ? undefined : styles.enter)

/**
 * The structure-morph Scrolly visual (Section 8.3). Steps 1 to 3 show one molecule as its complete
 * formula, its condensed line and its bond-line drawing; the complete formula morphs into the
 * bond-line drawing. Steps 4 and 5 draw a ring and a substituted benzene in bond-line form. Step 6
 * shows wedge and dash for a tetrahedral carbon, with a turnable 3D model.
 */
export function RepresentationsMorph({ step, reducedMotion }: RepresentationsMorphProps) {
  const index = Math.min(STEPS.length - 1, Math.max(0, Math.round(step)))
  const active = STEPS[index]
  const morph = useTweenedNumber(morphTarget(active), reducedMotion, 1.2)
  const fade = useTweenedNumber(condensedFade(active), reducedMotion, 0.8)

  if (active.kind === 'tetrahedral') {
    return <TetrahedralPanel index={index} reducedMotion={reducedMotion} />
  }

  const graph = stepGraph(active.smiles)
  const title = KIND_TITLE[active.kind]

  let drawing: ReactNode
  if (active.kind === 'complete' || active.kind === 'condensed' || active.kind === 'bond-line') {
    // The fit follows the morph: the complete formula's fit at 0, the bond-line drawing's at 1.
    const fit = lerpFit(fitOf(completeBounds(graph)), fitOf(skeletalBounds(graph, DEFAULT_SCALE)), ease(morph))
    drawing = (
      <>
        <g opacity={1 - fade} transform={fitTransform(fit)} data-testid="morph-formula">
          <StructuralFormula graph={graph} morph={morph} scale={DEFAULT_SCALE} completeScale={COMPLETE_SCALE} />
        </g>
        {fade > 0.01 ? (
          <g opacity={fade} transform={`translate(${AREA.cx} ${AREA.cy})`} data-testid="morph-condensed">
            <StructuralFormula graph={graph} mode="condensed" />
          </g>
        ) : null}
      </>
    )
  } else {
    const fit = fitTransform(fitOf(skeletalBounds(graph, DEFAULT_SCALE)))
    drawing = (
      <g key={`skeletal-${index}`} className={enter(reducedMotion)} transform={fit} data-testid="morph-skeletal">
        <SkeletalFormula graph={graph} scale={DEFAULT_SCALE} />
      </g>
    )
  }

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={`${title}. ${caption(graph)}.`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-testid="structure-morph"
      data-step={index}
      data-kind={active.kind}
    >
      <Label x={VIEW_WIDTH / 2} y={30} fontSize={20} fill="var(--fg)" fontWeight={600} textAnchor="middle">
        {title}
      </Label>
      {drawing}
      <Label x={VIEW_WIDTH / 2} y={VIEW_HEIGHT - 18} fontSize={18} fill="var(--fg-muted)" textAnchor="middle">
        {caption(graph)}
      </Label>
    </svg>
  )
}

/** Step 6: a wedge-and-dash sketch of a tetrahedral carbon, beside its 3D model. */
function TetrahedralPanel({ index, reducedMotion }: { index: number; reducedMotion: boolean }) {
  const step = STEPS[index]
  const graph = stepGraph(step.smiles)
  // Atom 1 is the carbon of FC(Cl)Br (F is first in the written SMILES).
  const carbon = graph.atoms.findIndex((a) => a.element === 'C')
  const data: Molecule3DData = tetrahedralModel(graph, carbon)
  const camera = cameraForMolecule(data, 1.25)
  const elementOf = (atomIndex: number) => graph.atoms[atomIndex].element
  const heavy = graph.bonds.flatMap((b) => (b.a === carbon ? [b.b] : b.b === carbon ? [b.a] : []))
  const [left, right, up] = heavy.map(elementOf)
  // The sketch: Cl and F in the plane of the page, Br on the wedge, H on the dash.
  const wedgeLabel = up
  const dashLabel = 'H'
  return (
    <div className={`${styles.panel} ${enter(reducedMotion) ?? ''}`} data-testid="structure-morph" data-step={index} data-kind="tetrahedral">
      <p className={styles.title}>{KIND_TITLE.tetrahedral}</p>
      <svg
        viewBox="0 0 360 300"
        role="img"
        aria-label={`Wedge and dash sketch of the carbon in ${caption(graph)}: ${left} and ${right} in the plane, ${wedgeLabel} on a wedge, ${dashLabel} on a dash.`}
        className={styles.sketch}
      >
        <WedgeLabelled left={left} right={right} wedge={wedgeLabel} dash={dashLabel} x={180} y={150} />
      </svg>
      <div className={styles.model}>
        <Stage3DLazy
          label={`${caption(graph)} in 3D, drag to turn it`}
          fallback={<Molecule3DFallback {...data} />}
          cameraPosition={camera}
          hint="Drag to turn"
        >
          <Molecule3D {...data} />
        </Stage3DLazy>
      </div>
      <p className={styles.caption}>
        {caption(graph)}. The sketch uses the page convention, so the two bonds in the plane look flat. In the model every bond
        makes an angle of 109.5° with the other three.
      </p>
    </div>
  )
}
