/**
 * Step targets for the Section 8.2 Scrolly: methane (sp³), ethene (sp²), ethyne (sp), then the
 * π bond of ethene and what a twist about the C=C bond does to it. Every angle and length shown
 * is read from the carbon-shapes library, so the drawing and the Prose cannot disagree.
 */

import { carbonCarbonLengthPm, idealBondAngle, sCharacterPercent, type CarbonHybrid } from '@/lib/chem/carbon-shapes'

export type ShapeStepKind = 'methane' | 'ethene' | 'ethyne' | 'pi'

export const SHAPE_STEP_COUNT = 4

/** A degree value as text with a true degree sign, e.g. 109.5° or 120°. */
export function degreeText(value: number): string {
  return Number.isInteger(value) ? `${value}°` : `${value.toFixed(1)}°`
}

/** Label for an sp³, sp² or sp hybrid, in the maths style used by the Prose. */
export function hybridLabel(h: CarbonHybrid): string {
  return h === 'sp3' ? 'sp³' : h === 'sp2' ? 'sp²' : 'sp'
}

export interface ShapeStep {
  kind: ShapeStepKind
  /** The hybrid of the carbon(s) in this Step, for the badge. Null for the π Step. */
  hybrid: CarbonHybrid | null
  title: string
  caption: string
  /** The working line under the drawing: the lib numbers for the bond angle and C–C length. */
  working: string
}

/** The ideal bond angle of a hybrid as text: the number each Step quotes. */
export function firstAngleText(hybrid: CarbonHybrid): string {
  return degreeText(idealBondAngle(hybrid))
}

/** The Steps of the carbon-shapes Scrolly. Index is clamped to the Step range. */
export function shapeStep(index: number): ShapeStep {
  const clamped = Math.min(SHAPE_STEP_COUNT - 1, Math.max(0, Math.round(index)))
  const steps: ShapeStep[] = [
    {
      kind: 'methane',
      hybrid: 'sp3',
      title: 'Methane: sp³',
      caption: 'Each carbon forms four σ bonds, so four hybrid orbitals point to the corners of a tetrahedron.',
      working: `sp³: bond angle ${firstAngleText('sp3')}, s character ${sCharacterPercent('sp3').toFixed(0)}%, four equal C–H bonds`,
    },
    {
      kind: 'ethene',
      hybrid: 'sp2',
      title: 'Ethene: sp²',
      caption: 'Three hybrids lie in one plane and the leftover p orbital stands at right angles to it. The C=C carbons are flat.',
      working: `sp²: bond angle ${firstAngleText('sp2')}, s character ${sCharacterPercent('sp2').toFixed(1)}%, C=C double bond ${carbonCarbonLengthPm(2)} pm`,
    },
    {
      kind: 'ethyne',
      hybrid: 'sp',
      title: 'Ethyne: sp',
      caption: 'Two hybrids point in opposite directions, so the molecule is a straight line, and two p orbitals are left over.',
      working: `sp: bond angle ${firstAngleText('sp')}, s character ${sCharacterPercent('sp').toFixed(0)}%, C≡C triple bond ${carbonCarbonLengthPm(3)} pm`,
    },
    {
      kind: 'pi',
      hybrid: null,
      title: 'The π bond',
      caption: 'The π bond forms from two parallel p orbitals that overlap sideways. Turn one CH₂ about the C=C axis and the overlap is lost.',
      working: 'The π electrons sit above and below the plane, so the C=C bond cannot rotate without breaking it.',
    },
  ]
  return steps[clamped]
}

/** The sideways overlap angle used by the π Step: 0° in the bonded state, 90° when one CH₂ is turned. */
export function piTurnDegrees(index: number): number {
  return Math.min(SHAPE_STEP_COUNT - 1, Math.max(0, Math.round(index))) === 3 ? 90 : 0
}
