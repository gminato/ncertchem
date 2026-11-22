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

/** Stacked drawings are scaled so the 560-wide box keeps them legible (labels stay ≥ 13 px rendered). */
const STACK_SCALE = 0.75
const STACK_X = (560 - 560 * STACK_SCALE) / 2
const POLARIMETER_STEP_Y = 270
const POLARIMETER_CAPTION_DY = 236

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

/** One polarimeter, scaled into the panel, with its own caption under it. */
function PolarimeterBlock({ y, angle, sampleLabel, caption }: { y: number; angle: number; sampleLabel: string; caption: string }) {
  return (
    <g>
      <g transform={`translate(${STACK_X} ${y}) scale(${STACK_SCALE})`}>
        <Polarimeter angle={angle} fillTone="liquid" sampleLabel={sampleLabel} />
      </g>
      <text x={280} y={y + POLARIMETER_CAPTION_DY} textAnchor="middle" {...CAPTION} fill="var(--fg)">
        {caption}
      </text>
    </g>
  )
}

/** Step 1: an achiral liquid leaves the plane where it was; a chiral (+) sample turns the analyser clockwise. */
function PolarimeterStep() {
  return (
    <svg viewBox={`0 0 560 ${POLARIMETER_STEP_Y + POLARIMETER_CAPTION_DY + 14}`} role="img" aria-label="Two polarimeters: an achiral liquid leaves the plane unchanged, a chiral (+) sample needs the analyser turned clockwise">
      <PolarimeterBlock y={0} angle={0} sampleLabel="achiral liquid" caption="achiral liquid: α = 0°, the analyser blocks the light as it is" />
      <PolarimeterBlock y={POLARIMETER_STEP_Y} angle={25} sampleLabel="chiral (+)" caption="chiral (+) sample: clockwise (+), the analyser turns to the right" />
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

/** Step 3: equal and opposite rotations cancel, so the racemic mixture reads zero. */
function RacemicStep() {
  return (
    <svg viewBox={`0 0 560 ${2 * POLARIMETER_STEP_Y + POLARIMETER_CAPTION_DY + 54}`} role="img" aria-label="Equal (+) and (−) enantiomers tilt the plane by the same angle in opposite directions; the racemic mixture reads zero">
      <PolarimeterBlock y={0} angle={25} sampleLabel="(+) enantiomer" caption="(+): clockwise, the plane tilts to the right" />
      <PolarimeterBlock y={POLARIMETER_STEP_Y} angle={-25} sampleLabel="(−) enantiomer" caption="(−): anticlockwise, the plane tilts to the left" />
      <PolarimeterBlock y={2 * POLARIMETER_STEP_Y} angle={0} sampleLabel="(±) mixture" caption="equal (+) and (−): the rotations cancel, α = 0°" />
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

/** Step 5: SN2. Hydroxide attacks from the back; the transition state, then the inverted product. */
function InversionStep() {
  const umbrella = [{ label: 'H' }, { label: 'CH₃', tone: ROLE_TONE.sp3 }, { label: 'C₆H₁₃', tone: ROLE_TONE.base }] as const
  const productY = 300
  return (
    <svg viewBox="0 0 560 600" role="img" aria-label="SN2 of 2-bromooctane: hydroxide attacks from the back through a transition state, and the product octan-2-ol is inverted">
      <g transform={`translate(${STACK_X} 0) scale(${STACK_SCALE})`}>
        <StereoCentre
          umbrella={umbrella}
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
      </g>
      <text x={280} y={272} textAnchor="middle" {...CAPTION} fill="var(--fg)">
        {stereoName(BROMOOCTANE)} → ‡ transition state, in square brackets
      </text>
      <g transform={`translate(${STACK_X} ${productY}) scale(${STACK_SCALE})`}>
        <StereoCentre
          umbrella={umbrella}
          incoming={{ label: 'OH', tone: ROLE_TONE.nucleophile }}
          invert={1}
        />
      </g>
      <text x={280} y={productY + 272} textAnchor="middle" {...CAPTION} fill="var(--fg)">
        {stereoName(OCTANOL)}: OH on the far side of where Br was
      </text>
    </svg>
  )
}

/** Step 6: SN1. Water attacks the flat carbocation from both faces; the two products are a racemic pair. */
function RacemisationStep() {
  const umbrella = [{ label: 'H' }, { label: 'CH₃', tone: ROLE_TONE.sp3 }, { label: 'C₆H₅', tone: ROLE_TONE.base }] as const
  const productY = 290
  const mirrorY = 560
  return (
    <svg viewBox="0 0 560 830" role="img" aria-label="SN1 of 1-bromo-1-phenylethane: water attacks the planar carbocation from both faces, giving a 50 to 50 racemic pair of 1-phenylethanol">
      <g transform={`translate(${STACK_X} 0) scale(${STACK_SCALE})`}>
        <PlanarCation
          groups={['CH₃', 'H', 'C₆H₅']}
          attackTop
          attackBottom
          nucleophile="H₂O"
        />
      </g>
      <g transform={`translate(${STACK_X} ${productY}) scale(${STACK_SCALE})`}>
        <StereoCentre umbrella={umbrella} axial={{ label: 'OH', tone: ROLE_TONE.nucleophile }} />
      </g>
      <g transform={`translate(${STACK_X} ${mirrorY}) scale(${STACK_SCALE})`}>
        {/* Swapping two arms on the same carbon gives the other enantiomer. */}
        <StereoCentre umbrella={[umbrella[0], umbrella[2], umbrella[1]]} axial={{ label: 'OH', tone: ROLE_TONE.nucleophile }} />
      </g>
      <text x={280} y={814} textAnchor="middle" {...CAPTION} fill="var(--fg)">
        {stereoName(PHENYLETHANOL)}: 50 : 50, racemic
      </text>
    </svg>
  )
}
