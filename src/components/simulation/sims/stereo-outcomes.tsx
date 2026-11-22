'use client'

import { useState, type ReactNode } from 'react'
import { Segmented, Toggle } from '@/components/controls'
import { SkeletalFormula } from '@/components/organic'
import { HALOGEN_TONE, StereoCentre, type Halogen, type StereoGroup } from '@/components/vocab/organic6'
import {
  STEREO_MOLECULES,
  outcomeFor,
  stereoModel,
  superpositionVerdict,
  type StereoMechanism,
  type StereoMolecule,
} from '@/lib/chem/stereo-outcomes'
import styles from './stereo-outcomes.module.css'

const ZOOM = 1.18

const MOLECULE_OPTIONS = STEREO_MOLECULES.map((m) => ({ value: m.id, label: m.label }))

const MECHANISM_OPTIONS = [
  { value: 'SN2', label: <>S<span className={styles.sub}>N</span>2</> },
  { value: 'SN1', label: <>S<span className={styles.sub}>N</span>1</> },
] as const

/** Enlarges one stereocentre drawing (560 units wide, fixed by the component) so it fills the panel. */
function Enlarged({ y = 0, children }: { y?: number; children: ReactNode }) {
  const cy = 170 + y
  return <g transform={`translate(280 ${cy}) scale(${ZOOM}) translate(-280 ${-cy})`}>{children}</g>
}

function armGroups(molecule: StereoMolecule): [StereoGroup, StereoGroup, StereoGroup] {
  const [a, b, c] = molecule.arms
  return [{ label: a }, { label: b }, { label: c }]
}

export function StereoOutcomes() {
  const [id, setId] = useState<StereoMolecule['id']>('chloropentane')
  const [mechanism, setMechanism] = useState<StereoMechanism>('SN2')
  const [mirror, setMirror] = useState(false)

  const model = stereoModel(id)
  const { molecule } = model
  const halogen: Halogen = molecule.halogen
  const offered = molecule.mechanisms
  const active: StereoMechanism | null = model.chiral ? (offered.includes(mechanism) ? mechanism : offered[0]) : null

  const arms = armGroups(molecule)
  const reactantGroup: StereoGroup = { label: halogen, tone: HALOGEN_TONE[halogen] }

  const outcome = active ? outcomeFor(id, active) : null
  const verdict = superpositionVerdict(id)

  const summary = !model.chiral
    ? `${molecule.label} (${model.formulaUnicode}) has no stereocentre, so there is no mechanism to compare.`
    : active === 'SN2'
      ? `${molecule.label} (${model.formulaUnicode}), SN2 with hydroxide: one product, ${model.product.name} (${model.product.formulaUnicode}), with the OH on the side opposite the halogen. Polarimeter: ${outcome?.polarimeter}.`
      : active === 'SN1'
        ? `${molecule.label} (${model.formulaUnicode}), SN1 with hydroxide: a planar carbocation is attacked from both faces, giving ${model.product.name} as a 50 : 50 mixture of two mirror images. Polarimeter: zero.`
        : ''

  return (
    <div className={styles.sim}>
      <div className={styles.controls}>
        <Segmented label="Molecule" options={MOLECULE_OPTIONS} value={id} onChange={(v) => { setId(v); setMirror(false) }} />
        <div className={styles.choices}>
          {active && offered.length > 1 ? (
            <Segmented label="Mechanism" options={MECHANISM_OPTIONS} value={active} onChange={setMechanism} />
          ) : null}
          <Toggle label="Show the mirror image" checked={mirror} onChange={setMirror} />
        </div>
        {active && offered.length === 1 ? (
          <p className={styles.note}>Only SN1 is shown for this halide: the carbocation is benzylic, so it is planar and stabilised by the ring.</p>
        ) : null}
      </div>

      <div className={styles.stage}>
        <svg className={styles.scene} viewBox="0 0 560 220" role="img" aria-label={`Skeletal formula of ${molecule.label}`}>
          <SkeletalFormula graph={model.graph} x={280} y={110} scale={44} highlightAtoms={model.stereoAtoms} />
        </svg>

        <svg className={styles.scene} viewBox="0 0 560 340" role="img" aria-label={`Stereocentre of ${molecule.label}${mirror ? ', mirror image' : ''}`}>
          <Enlarged>
            <StereoCentre umbrella={arms} leaving={reactantGroup} mirror={mirror} />
          </Enlarged>
        </svg>

        {outcome && active === 'SN2' ? (
          <svg className={styles.scene} viewBox="0 0 560 340" role="img" aria-label={`SN2 product of ${molecule.label}: the OH sits on the side opposite the halogen`}>
            <Enlarged>
              <StereoCentre umbrella={arms} incoming={{ label: 'OH' }} invert={1} />
            </Enlarged>
          </svg>
        ) : null}

        {outcome && active === 'SN1' ? (
          <svg className={styles.scene} viewBox="0 0 560 680" role="img" aria-label={`SN1 on ${molecule.label}: the two mirror-image products in equal amounts`}>
            <Enlarged>
              <StereoCentre umbrella={arms} incoming={{ label: 'OH' }} />
            </Enlarged>
            <Enlarged y={340}>
              <StereoCentre y={340} umbrella={arms} incoming={{ label: 'OH' }} mirror />
            </Enlarged>
          </svg>
        ) : null}
      </div>

      <div className={styles.readout}>
        <p className={styles.verdict}>{verdict}</p>
        <p className={styles.summary} aria-live="polite">{summary}</p>
      </div>
    </div>
  )
}

