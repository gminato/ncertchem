import { NCERT_S7_FACTS, NCERT_TABLE_5_3, photonEnergyJ } from '@/lib/chem/ncert-c12-unit5-s7-tables'

/** Number of Steps in the cft-d-d-colour Scrolly (matches MDX). */
export const CFT_DD_COLOUR_STEP_COUNT = 5

/** Clamp a Scrolly step index into 0..CFT_DD_COLOUR_STEP_COUNT-1. NaN maps to 0. */
export function clampCftDdStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(CFT_DD_COLOUR_STEP_COUNT - 1, Math.max(0, Math.trunc(step)))
}

export interface SpectralBand {
  readonly id: string
  readonly label: string
  readonly colour: string
  readonly wavelengthNm: number
}

/** Seven spectral bands ordered from red on the left to violet on the right, matching the MDX prose. */
export const SEVEN_SPECTRAL_BANDS: readonly SpectralBand[] = [
  { id: 'red', label: 'Red', colour: 'var(--spec-red)', wavelengthNm: 660 },
  { id: 'orange', label: 'Orange', colour: 'var(--spec-orange)', wavelengthNm: 605 },
  { id: 'yellow', label: 'Yellow', colour: 'var(--spec-yellow)', wavelengthNm: 575 },
  { id: 'green', label: 'Green', colour: 'var(--spec-green)', wavelengthNm: 535 },
  { id: 'blue-green', label: 'Blue-green', colour: 'var(--db-ln)', wavelengthNm: 498 },
  { id: 'blue', label: 'Blue', colour: 'var(--spec-blue)', wavelengthNm: 455 },
  { id: 'violet', label: 'Violet', colour: 'var(--spec-violet)', wavelengthNm: 415 },
] as const

export interface CftDdStepState {
  readonly step: number
  readonly title: string
  readonly showEnergyDiagram: boolean
  readonly showPhoton: boolean
  readonly electronPromoted: boolean
  readonly absorbedBandId: string | null
  readonly showExitBeam: boolean
  readonly showWheel: boolean
  readonly ligandsPresent: boolean
  readonly beakerTint: string
  readonly beakerLabel: string
  readonly wavelengthNm: number
  readonly photonEnergy1e19J: number
  readonly ariaLabel: string
}

const TI_ROW = NCERT_TABLE_5_3.find((r) => r.id === 'ti-h2o-6')!

export function cftDdStepState(step: number): CftDdStepState {
  const s = clampCftDdStep(step)
  const wavelengthNm = TI_ROW.wavelengthNm
  const energy = photonEnergyJ(wavelengthNm) / 1e-19

  switch (s) {
    case 0:
      return {
        step: 0,
        title: 'White light enters',
        showEnergyDiagram: false,
        showPhoton: false,
        electronPromoted: false,
        absorbedBandId: null,
        showExitBeam: false,
        showWheel: false,
        ligandsPresent: true,
        beakerTint: 'var(--ion-ti3)',
        beakerLabel: '[Ti(H₂O)₆]³⁺(aq)',
        wavelengthNm,
        photonEnergy1e19J: energy,
        ariaLabel: 'White light fan of seven spectral colours travelling from a lamp toward a beaker of [Ti(H2O)6]3+ solution above a 400 nm to 700 nm wavelength axis.',
      }
    case 1:
      return {
        step: 1,
        title: 'The d levels of the complex',
        showEnergyDiagram: true,
        showPhoton: false,
        electronPromoted: false,
        absorbedBandId: null,
        showExitBeam: false,
        showWheel: false,
        ligandsPresent: true,
        beakerTint: 'var(--ion-ti3)',
        beakerLabel: '[Ti(H₂O)₆]³⁺(aq)',
        wavelengthNm,
        photonEnergy1e19J: energy,
        ariaLabel: 'Energy diagram for Ti3+ showing the lower t2g level holding one d electron, the empty upper eg level, and the crystal field splitting gap Delta_o.',
      }
    case 2:
      return {
        step: 2,
        title: 'One photon is absorbed',
        showEnergyDiagram: true,
        showPhoton: true,
        electronPromoted: true,
        absorbedBandId: 'blue-green',
        showExitBeam: false,
        showWheel: false,
        ligandsPresent: true,
        beakerTint: 'var(--ion-ti3)',
        beakerLabel: '[Ti(H₂O)₆]³⁺(aq)',
        wavelengthNm,
        photonEnergy1e19J: energy,
        ariaLabel: `A ${wavelengthNm} nm blue-green photon excites the single d electron from t2g1 eg0 to t2g0 eg1, dimming the blue-green band in the beam.`,
      }
    case 3:
      return {
        step: 3,
        title: 'What the eye sees',
        showEnergyDiagram: false,
        showPhoton: false,
        electronPromoted: true,
        absorbedBandId: 'blue-green',
        showExitBeam: true,
        showWheel: true,
        ligandsPresent: true,
        beakerTint: 'var(--ion-ti3)',
        beakerLabel: '[Ti(H₂O)₆]³⁺(aq)',
        wavelengthNm,
        photonEnergy1e19J: energy,
        ariaLabel: `Transmitted beam missing blue-green light with a colour wheel linking absorbed ${NCERT_S7_FACTS.tiComplex.absorbed} to complementary ${NCERT_S7_FACTS.tiComplex.colour} seen in the beaker.`,
      }
    default:
      return {
        step: 4,
        title: 'Take the ligand away',
        showEnergyDiagram: true,
        showPhoton: false,
        electronPromoted: false,
        absorbedBandId: null,
        showExitBeam: true,
        showWheel: false,
        ligandsPresent: false,
        beakerTint: 'var(--ion-colourless)',
        beakerLabel: 'Ti³⁺ (no water ligands)',
        wavelengthNm,
        photonEnergy1e19J: energy,
        ariaLabel: 'Water ligands slide away, the d orbitals collapse back into five degenerate levels with zero gap, all wavelengths pass through, and the sample turns colourless.',
      }
  }
}
