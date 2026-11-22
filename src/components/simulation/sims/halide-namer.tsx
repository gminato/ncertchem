'use client'

import { useState } from 'react'
import { Segmented, Slider, Toggle } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import { SkeletalFormula, drawingFrame } from '@/components/organic'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { formulaUnicode, type HalogenElement } from '@/lib/chem/haloalkanes'
import type { NameStep } from '@/lib/chem/iupac-organic'
import {
  DEFAULT_HALIDE_DESIGN,
  commonName,
  designFormula,
  designName,
  designNameSteps,
  designSmiles,
  type HalideDesign,
  type HalideShape,
  type RingPattern,
} from '@/lib/chem/halide-design'
import styles from './halide-namer.module.css'

const SHAPE_OPTIONS: { value: HalideShape; label: string }[] = [
  { value: 'chain', label: 'Chain' },
  { value: 'ring', label: 'Benzene ring' },
]

const HALOGEN_OPTIONS: { value: HalogenElement; label: string }[] = [
  { value: 'F', label: 'F' },
  { value: 'Cl', label: 'Cl' },
  { value: 'Br', label: 'Br' },
  { value: 'I', label: 'I' },
]

const RING_OPTIONS: { value: RingPattern; label: string }[] = [
  { value: 'mono', label: 'None' },
  { value: 'ortho', label: 'Ortho' },
  { value: 'meta', label: 'Meta' },
  { value: 'para', label: 'Para' },
]

const STEP_LABEL: Record<NameStep['kind'], string> = {
  parent: 'Parent',
  numbering: 'Chain',
  substituent: 'Substituent',
  name: 'Name',
}

/** Scale that fits the drawing in the stage: bonds up to 70 units, and the molecule within the frame. */
function fitScale(graph: MolGraph): number {
  const f = drawingFrame(graph, 1)
  return Math.min(70, 500 / f.bounds.width, 290 / f.bounds.height)
}

/** Index of the halogen atom in the parsed graph, to wash behind it. */
function halogenAtom(graph: MolGraph, halogen: HalogenElement): number[] {
  const i = graph.atoms.findIndex((a) => a.element === halogen)
  return i >= 0 ? [i] : []
}

/** Words for the summary and the steps: "at position 2" for a locant, nothing for a parent or name step. */
function stepText(s: NameStep): string {
  return s.locant === undefined ? s.text : `${s.text} at position ${s.locant}`
}

/**
 * The Halide Namer. Build a chain of 1 to 6 carbons, or a benzene ring, with one halogen (or two on
 * the ring) and an optional methyl branch. The drawing, the IUPAC name and its steps come from the
 * namer; the common name comes from the alkyl-group convention; the formula from the parsed SMILES.
 */
export function HalideNamer() {
  const [design, setDesign] = useState<HalideDesign>(DEFAULT_HALIDE_DESIGN)
  const isChain = design.shape === 'chain'

  const smiles = designSmiles(design)
  const graph = parseSmiles(smiles)
  const name = designName(design)
  const common = commonName(design)
  const steps = designNameSteps(design)
  const formula = designFormula(design)

  const setShape = (shape: HalideShape) => setDesign((d) => ({ ...d, shape }))
  const setHalogen = (halogen: HalogenElement) => setDesign((d) => ({ ...d, halogen }))
  const setRing = (ringPattern: RingPattern) => setDesign((d) => ({ ...d, ringPattern }))

  /** Changing the chain keeps the halogen and the methyl on carbons that still exist. */
  const setChain = (chain: number) =>
    setDesign((d) => ({
      ...d,
      chain,
      halogenCarbon: Math.min(d.halogenCarbon, chain),
      methylCarbon: d.methylCarbon !== null && d.methylCarbon <= chain - 1 && chain >= 3 ? d.methylCarbon : null,
    }))
  const setHalogenCarbon = (halogenCarbon: number) => setDesign((d) => ({ ...d, halogenCarbon }))
  const setMethyl = (on: boolean) =>
    setDesign((d) => ({ ...d, methylCarbon: on ? d.chain - 1 : null }))
  const setMethylCarbon = (methylCarbon: number) => setDesign((d) => ({ ...d, methylCarbon }))

  const summary = [
    name ? `Name: ${name}.` : 'Not named.',
    `Formula ${formula}.`,
    common ? `Common name: ${common}.` : 'No common name.',
  ].join(' ')

  return (
    <div className={styles.namer}>
      <SimulationControls>
        <div className={styles.controls}>
          <Segmented label="Shape" options={SHAPE_OPTIONS} value={design.shape} onChange={setShape} />
          <Segmented label="Halogen" options={HALOGEN_OPTIONS} value={design.halogen} onChange={setHalogen} />
          {isChain ? (
            <>
              <Slider label="Carbons in the chain" value={design.chain} min={1} max={6} step={1} onChange={setChain} />
              <Slider
                label="Halogen on carbon"
                value={design.halogenCarbon}
                min={1}
                max={design.chain}
                step={1}
                disabled={design.chain === 1}
                onChange={setHalogenCarbon}
              />
              <Toggle
                label="Methyl branch"
                checked={design.methylCarbon !== null}
                disabled={design.chain < 3}
                onChange={setMethyl}
              />
              {design.methylCarbon !== null && (
                <Slider
                  label="Methyl on carbon"
                  value={design.methylCarbon}
                  min={2}
                  max={design.chain - 1}
                  step={1}
                  onChange={setMethylCarbon}
                />
              )}
            </>
          ) : (
            <Segmented label="Second halogen" options={RING_OPTIONS} value={design.ringPattern} onChange={setRing} />
          )}
        </div>
      </SimulationControls>

      <div className={styles.layout}>
        <figure className={styles.stage}>
          <svg
            viewBox="0 0 560 340"
            role="img"
            aria-label={`Structure: ${name ?? 'not named'}`}
            className={styles.drawing}
            data-testid="halide-drawing"
          >
            <SkeletalFormula
              graph={graph}
              scale={fitScale(graph)}
              x={280}
              y={170}
              highlightAtoms={halogenAtom(graph, design.halogen)}
            />
          </svg>
          <figcaption className={styles.caption}>The halogen is shaded. The drawing is the molecule the controls build.</figcaption>
        </figure>

        <section className={styles.panel} aria-label="The name">
          <p className={styles.label}>IUPAC name</p>
          <p className={styles.name} data-testid="halide-name">{name ?? 'not named by the namer'}</p>
          <p className={styles.formula}>
            Formula <span className={styles.mono}>{formulaUnicode(formula)}</span>
          </p>
          <p className={styles.common}>
            {common ? (
              <>
                Common name: <span className={styles.name2}>{common}</span>
              </>
            ) : (
              'No common name: the molecule has a branch or a shape NCERT’s alkyl-group rule does not name.'
            )}
          </p>
          <p className={styles.label}>How the namer builds it</p>
          <ol className={styles.steps} data-testid="halide-steps">
            {steps.map((s, i) => (
              <li key={`${s.kind}-${i}`}>
                <span className={styles.stepKind}>{STEP_LABEL[s.kind]}</span> {stepText(s)}
              </li>
            ))}
          </ol>
        </section>
      </div>

      <p className={styles.srOnly} aria-live="polite" data-testid="halide-live">{summary}</p>
    </div>
  )
}
