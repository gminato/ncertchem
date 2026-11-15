/**
 * Deterministic step targets and stoichiometric model for the Scrolly animation:
 * Permanganate–Fe2+ redox titration (NCERT Section 7.3.3).
 *
 * All numerical values (equivalence volume, delivered moles, remaining analyte)
 * are calculated directly from `src/lib/chem/redox-titration.ts`.
 */

import { equivalenceVolume, REDOX_TITRATIONS } from '@/lib/chem/redox-titration'

export interface TitrationStepTarget {
  /** Step index (0 through 4). */
  readonly stepIndex: number
  /** Titrant volume delivered from burette in mL. */
  readonly addedMl: number
  /** Titration completion percentage (0% to 100%). */
  readonly progressPct: number
  /** Millimoles of unreacted Fe2+ analyte remaining in flask. */
  readonly feRemainingMmol: number
  /** Millimoles of KMnO4 titrant delivered into flask. */
  readonly mno4DeliveredMmol: number
  /** Whether droplets are actively falling from burette stopcock. */
  readonly dropping: boolean
  /** Whether the stoichiometric end point has been reached and signalled. */
  readonly endPoint: boolean
  /** Short descriptive caption shown below the white tile in the rig. */
  readonly subLabel: string
  /** Header label for the stage. */
  readonly stageLabel: string
  /** Visual indicator color of the solution in the flask. */
  readonly flaskAppearance: 'Colourless' | 'First Lasting Pink'
  /** Prose explanation for the step. */
  readonly explanation: string
}

/** Standard demonstration parameters: 20.0 mL of 0.0500 M Fe2+ titrated against 0.0100 M KMnO4. */
export const SCROLLY_TITRATION_CONFIG = {
  titrantMolarity: 0.01,
  analyteMolarity: 0.05,
  analyteVolumeMl: 20.0,
  titrationType: 'permanganate-fe' as const,
  maxBuretteMl: 25.0,
} as const

/** Stoichiometric equivalence volume in mL (computed via lib). */
export const SCROLLY_EQUIVALENCE_VOLUME_ML = equivalenceVolume(
  SCROLLY_TITRATION_CONFIG.titrantMolarity,
  SCROLLY_TITRATION_CONFIG.analyteMolarity,
  SCROLLY_TITRATION_CONFIG.analyteVolumeMl,
  SCROLLY_TITRATION_CONFIG.titrationType
)

/** Initial moles of Fe2+ in millimoles: (0.0500 M * 20.0 mL) = 1.00 mmol. */
export const SCROLLY_INITIAL_FE_MMOL =
  SCROLLY_TITRATION_CONFIG.analyteMolarity * SCROLLY_TITRATION_CONFIG.analyteVolumeMl

/** Moles of KMnO4 required for 100% equivalence: 1.00 mmol * (1/5) = 0.200 mmol. */
export const SCROLLY_EQUIV_MNO4_MMOL =
  SCROLLY_INITIAL_FE_MMOL * REDOX_TITRATIONS['permanganate-fe'].titrantPerAnalyteRatio

/** Total number of Scrolly steps. */
export const TITRATION_STEP_COUNT = 5

/** The 5 deterministic steps of the Scrolly animation. */
export const TITRATION_STEPS: readonly TitrationStepTarget[] = [
  {
    stepIndex: 0,
    addedMl: 0.0,
    progressPct: 0,
    feRemainingMmol: SCROLLY_INITIAL_FE_MMOL,
    mno4DeliveredMmol: 0.0,
    dropping: false,
    endPoint: false,
    subLabel: '0.0 mL: Clear Fe²⁺ analyte',
    stageLabel: 'Initial Setup (0%)',
    flaskAppearance: 'Colourless',
    explanation:
      'The burette is filled to the 0.0 mL mark with deep purple KMnO4 solution. The conical flask contains 20.0 mL of acidified Fe2+ solution, which appears completely colourless over the white tile.',
  },
  {
    stepIndex: 1,
    addedMl: 5.0,
    progressPct: 25,
    feRemainingMmol: 0.75,
    mno4DeliveredMmol: 0.05,
    dropping: true,
    endPoint: false,
    subLabel: '5.0 mL: Rapid decolourisation',
    stageLabel: 'Early Titration (25%)',
    flaskAppearance: 'Colourless',
    explanation:
      'As KMnO4 drops into the flask, MnO4− is instantly reduced by excess Fe2+ to virtually colourless Mn2+. The purple colour bleaches immediately on entering the liquid.',
  },
  {
    stepIndex: 2,
    addedMl: 15.0,
    progressPct: 75,
    feRemainingMmol: 0.25,
    mno4DeliveredMmol: 0.15,
    dropping: true,
    endPoint: false,
    subLabel: '15.0 mL: 75% consumed',
    stageLabel: 'Midway (75%)',
    flaskAppearance: 'Colourless',
    explanation:
      'Three quarters of the Fe2+ has been oxidised to Fe3+. The swirling solution still quickly turns clear after each drop, though the localised purple plume persists for a brief fraction of a second.',
  },
  {
    stepIndex: 3,
    addedMl: 19.8,
    progressPct: 99,
    feRemainingMmol: 0.01,
    mno4DeliveredMmol: 0.198,
    dropping: true,
    endPoint: false,
    subLabel: '19.8 mL: Near equivalence',
    stageLabel: 'Near Equivalence (99%)',
    flaskAppearance: 'Colourless',
    explanation:
      'Only 0.01 mmol of unreacted Fe2+ remains. The stopcock is adjusted to deliver single drops. Each drop takes longer to decolourise as analyte ions become scarce, but swirling clears the solution.',
  },
  {
    stepIndex: 4,
    addedMl: 20.0,
    progressPct: 100,
    feRemainingMmol: 0.0,
    mno4DeliveredMmol: SCROLLY_EQUIV_MNO4_MMOL,
    dropping: false,
    endPoint: true,
    subLabel: '20.0 mL: Permanent faint pink',
    stageLabel: 'End Point Reached',
    flaskAppearance: 'First Lasting Pink',
    explanation:
      'The final drop oxidises the last trace of Fe2+. A minute excess of unreduced MnO4− (detectable at 10⁻⁶ mol L⁻¹) imparts a permanent faint pink tinge that signals the end point at exactly 20.0 mL.',
  },
] as const

/** Safely retrieves the target state for a given step index (clamped between 0 and 4). */
export function titrationStep(stepIndex: number): TitrationStepTarget {
  const index = Math.min(TITRATION_STEP_COUNT - 1, Math.max(0, Math.round(stepIndex)))
  return TITRATION_STEPS[index]
}
