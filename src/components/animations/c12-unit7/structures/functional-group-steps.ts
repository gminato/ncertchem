/**
 * Pure 5-step storyboard state for the Section 7.3 Scrolly animation
 * (`functional-group-structures`), driven by `NCERT_FIG_7_1_STRUCTURES`.
 */

import {
  buildGeometryReadout,
  type GeometryReadout,
  type MoleculeId,
} from '@/lib/chem/c12-u7-s3-geometry'

export const FUNCTIONAL_GROUP_STEP_COUNT = 5

export type FunctionalGroupSceneKind = 'molecule' | 'phenol-zoom'

export interface FunctionalGroupStepState {
  step: number
  scene: FunctionalGroupSceneKind
  moleculeId: MoleculeId
  readout: GeometryReadout
  showLonePairs: boolean
  showTetrahedralRef: boolean
  showOrbitalOverlap: boolean
  showConjugation: boolean
  showStericHalos: boolean
  showMethanolGhost: boolean
  highlightRingCarbon: boolean
  highlightMethylCarbons: boolean
  headline: string
  callout: string
}

/** Clamp an arbitrary scroll step index into [0, FUNCTIONAL_GROUP_STEP_COUNT - 1]. */
export function clampStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(Math.max(Math.trunc(step), 0), FUNCTIONAL_GROUP_STEP_COUNT - 1)
}

/** Resolve the exact visual state for a 0-based Scrolly step (0..4). */
export function getFunctionalGroupStepState(step: number): FunctionalGroupStepState {
  const s = clampStep(step)
  switch (s) {
    case 0:
      return {
        step: 0,
        scene: 'molecule',
        moleculeId: 'methanol',
        readout: buildGeometryReadout('methanol'),
        showLonePairs: true,
        showTetrahedralRef: true,
        showOrbitalOverlap: true,
        showConjugation: false,
        showStericHalos: false,
        showMethanolGhost: false,
        highlightRingCarbon: false,
        highlightMethylCarbons: true,
        headline: 'Methanol (CH₃OH) · sp³–sp³ σ baseline',
        callout: 'Lone-pair repulsion narrows C–O–H to 108.9°',
      }
    case 1:
      return {
        step: 1,
        scene: 'molecule',
        moleculeId: 'phenol',
        readout: buildGeometryReadout('phenol'),
        showLonePairs: true,
        showTetrahedralRef: true,
        showOrbitalOverlap: false,
        showConjugation: false,
        showStericHalos: false,
        showMethanolGhost: true,
        highlightRingCarbon: true,
        highlightMethylCarbons: false,
        headline: 'Phenol (C₆H₅OH) · sp² ring carbon',
        callout: 'C–O contracts by 6 pm (142 pm → 136 pm)',
      }
    case 2:
      return {
        step: 2,
        scene: 'phenol-zoom',
        moleculeId: 'phenol',
        readout: buildGeometryReadout('phenol'),
        showLonePairs: true,
        showTetrahedralRef: false,
        showOrbitalOverlap: false,
        showConjugation: true,
        showStericHalos: false,
        showMethanolGhost: true,
        highlightRingCarbon: true,
        highlightMethylCarbons: false,
        headline: 'Phenol C–O bond · two shortening effects',
        callout: 'Lone-pair π conjugation + sp² C (33.3% s-character)',
      }
    case 3:
      return {
        step: 3,
        scene: 'molecule',
        moleculeId: 'methoxymethane',
        readout: buildGeometryReadout('methoxymethane'),
        showLonePairs: true,
        showTetrahedralRef: true,
        showOrbitalOverlap: false,
        showConjugation: false,
        showStericHalos: false,
        showMethanolGhost: true,
        highlightRingCarbon: false,
        highlightMethylCarbons: true,
        headline: 'Methoxymethane (CH₃OCH₃) · sp³ carbons',
        callout: 'No conjugation: C–O returns to 141 pm (vs 142 pm)',
      }
    default:
      return {
        step: 4,
        scene: 'molecule',
        moleculeId: 'methoxymethane',
        readout: buildGeometryReadout('methoxymethane'),
        showLonePairs: true,
        showTetrahedralRef: true,
        showOrbitalOverlap: false,
        showConjugation: false,
        showStericHalos: true,
        showMethanolGhost: false,
        highlightRingCarbon: false,
        highlightMethylCarbons: false,
        headline: 'Methoxymethane (CH₃OCH₃) · steric widening',
        callout: 'Bulky –CH₃ repulsion opens C–O–C to 111.7°',
      }
  }
}
