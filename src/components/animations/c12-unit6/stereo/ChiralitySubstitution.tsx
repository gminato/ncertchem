'use client'

import {
  HALOGEN_TONE,
  PlanarCation,
  Polarimeter,
  ROLE_TONE,
  StereoCentre,
} from '@/components/vocab/organic6'
import { SkeletalFormula } from '@/components/organic'
import { Sup } from '@/components/animations/c12-unit1/ChemSvg'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import { stereocentres } from '@/lib/chem/haloalkanes'
import {
  BROMOOCTANE,
  CHLOROPENTANE,
  METHYLBUTANOL,
  METHYLBUTYL_CHLORIDE,
  OCTANOL,
  PHENYLETHANOL,
  clampStep,
  stereoName,
} from './stereo-steps'

export interface ChiralitySubstitutionProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion?: boolean
}

const CAPTION = {
  fontSize: 15,
  fontFamily: 'var(--font-sans)',
  fill: 'var(--fg-muted, var(--fg))',
} as const

const SKELETAL_SCALE = 42
const RETENTION_Y = 150

/** Steps 1-6 draw their own panel; each keeps its viewBox fixed so labels stay in scale. */
export function ChiralitySubstitution({ step }: ChiralitySubstitutionProps) {
  const s = clampStep(step)
  if (s === 0) return <PolarimeterStep />
  if (s === 1) return <PairStep />
  if (s === 2) return <RacemicStep />
  if (s === 3) return <RetentionStep />
  if (s === 4) return <InversionStep />
  return <RacemisationStep />
}

/** Step 1: an achiral liquid leaves the plane of polarised light where it was. */
function PolarimeterStep() {
  return (
    <svg viewBox="0 0 560 300" role="img" aria-label="Polarimeter: light passes an achiral sample and the analyser blocks it unchanged">
      <Polarimeter angle={0} fillTone="liquid" sampleLabel="achiral liquid" />
    </svg>
  )
}

/** Step 2: a stereocentre with four different arms and its mirror image. */
function PairStep() {
  const arms = {
    umbrella: [
      { label: 'H' },
      { label: 'CH₃', tone: ROLE_TONE.sp3 },
      { label: 'C₃H₇', tone: ROLE_TONE.base },
    ] as const,
    axial: { label: 'Cl', tone: HALOGEN_TONE.Cl },
  }
  return (
    <svg viewBox="0 0 560 720" role="img" aria-label="2-chloropentane with four different arms, beside its non-superimposable mirror image">
      <StereoCentre umbrella={arms.umbrella} axial={arms.axial} />
      <StereoCentre y={352} umbrella={arms.umbrella} axial={arms.axial} mirror />
      <text x={280} y={712} textAnchor="middle" {...CAPTION}>
        top: {stereoName(CHLOROPENTANE)} · bottom: its mirror image
      </text>
    </svg>
  )
}

/** Step 3: equal and opposite rotations cancel, so the analyser reads zero. */
function RacemicStep() {
  return (
    <svg viewBox="0 0 560 345" role="img" aria-label="A racemic mixture: equal amounts of both enantiomers, analyser reads zero">
      <Polarimeter angle={0} fillTone="liquid" sampleLabel="(±) mixture" />
      <text x={280} y={332} textAnchor="middle" {...CAPTION}>
        equal (+) and (−) amounts: the rotations cancel
      </text>
    </svg>
  )
}

/** Step 4: retention. The stereocentre's four arms are untouched. */
function RetentionStep() {
  const reactant = parseSmiles(METHYLBUTANOL)
  const product = parseSmiles(METHYLBUTYL_CHLORIDE)
  const stereo = stereocentres(reactant)
  const leftX = 150
  const rightX = 410
  return (
    <svg viewBox={`0 0 560 ${RETENTION_Y + 150}`} role="img" aria-label="2-methylbutan-1-ol gives 1-chloro-2-methylbutane with the stereocentre unchanged">
      <SkeletalFormula
        graph={reactant}
        scale={SKELETAL_SCALE}
        x={leftX}
        y={RETENTION_Y}
        highlightAtoms={[...stereo, 4]}
      />
      <SkeletalFormula
        graph={product}
        scale={SKELETAL_SCALE}
        x={rightX}
        y={RETENTION_Y}
        highlightAtoms={[...stereo, 4]}
      />
      <text x={280} y={RETENTION_Y} textAnchor="middle" fontSize={30} fontFamily="var(--font-sans)" fill="var(--fg)">
        →
      </text>
      <text x={leftX} y={RETENTION_Y + 84} textAnchor="middle" {...CAPTION} fill="var(--fg)">
        {stereoName(METHYLBUTANOL)}
      </text>
      <text x={rightX} y={RETENTION_Y + 84} textAnchor="middle" {...CAPTION} fill="var(--fg)">
        {stereoName(METHYLBUTYL_CHLORIDE)}
      </text>
      <text x={280} y={RETENTION_Y + 128} textAnchor="middle" {...CAPTION}>
        Cl arrives and OH leaves at the CH₂ carbon
      </text>
    </svg>
  )
}

/** Step 5: SN2. Hydroxide attacks from the back; the three arms flip like an umbrella. */
function InversionStep() {
  return (
    <svg viewBox="0 0 560 400" role="img" aria-label="SN2 of 2-bromooctane: hydroxide attacks from the back and the product octan-2-ol is inverted">
      <StereoCentre
        umbrella={[{ label: 'H' }, { label: 'CH₃', tone: ROLE_TONE.sp3 }, { label: 'C₆H₁₃', tone: ROLE_TONE.base }]}
        incoming={{
          label: (
            <>
              HO<Sup>δ−</Sup>
            </>
          ),
          tone: ROLE_TONE.nucleophile,
          bondOrder: 0.5,
        }}
        leaving={{
          label: (
            <>
              Br<Sup>δ−</Sup>
            </>
          ),
          tone: HALOGEN_TONE.Br,
          bondOrder: 0.5,
        }}
        invert={0.5}
        bracketTS
      />
      <text x={280} y={362} textAnchor="middle" {...CAPTION} fill="var(--fg)">
        {stereoName(BROMOOCTANE)} → {stereoName(OCTANOL)}
      </text>
      <text x={280} y={388} textAnchor="middle" {...CAPTION}>
        ‡ transition state, shown in square brackets
      </text>
    </svg>
  )
}

/** Step 6: SN1. Water attacks the flat carbocation from both faces. */
function RacemisationStep() {
  return (
    <svg viewBox="0 0 560 410" role="img" aria-label="SN1 of 1-bromo-1-phenylethane: water attacks the planar carbocation from both faces">
      <PlanarCation
        groups={['CH₃', 'H', 'C₆H₅']}
        attackTop
        attackBottom
        nucleophile="H₂O"
      />
      <text x={280} y={390} textAnchor="middle" {...CAPTION} fill="var(--fg)">
        both faces give {stereoName(PHENYLETHANOL)}, in equal amounts
      </text>
    </svg>
  )
}
