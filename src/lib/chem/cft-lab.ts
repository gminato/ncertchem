import {
  NCERT_SPECTROCHEMICAL_SERIES,
  fieldType,
  octahedralConfig,
  octahedralLevelEnergies,
  tetrahedralConfig,
  tetrahedralLevelEnergies,
  tetrahedralSplitting,
  type SpectrochemicalLigand,
} from './ncert-c12-unit5-s6-tables'

/**
 * Pure model for the Crystal Field Splitting Lab simulation.
 * Ligand ordering comes strictly from NCERT_SPECTROCHEMICAL_SERIES (Class 12, Part I, Unit 5, p. 132).
 * Numeric Δo values are an illustrative monotonic scale (kJ/mol), NOT printed NCERT values.
 */

export type CftGeometry = 'octahedral' | 'tetrahedral'

export interface LabLigand extends SpectrochemicalLigand {
  /** Illustrative octahedral splitting Δo in kJ/mol (monotonically increasing along the series). */
  readonly illustrativeDeltaO: number
}

/** Monotonic illustrative Δo values (kJ/mol) aligned 1:1 with the 15 NCERT spectrochemical ligands. */
const ILLUSTRATIVE_DELTA_O: readonly number[] = [
  85,  // I⁻
  98,  // Br⁻
  112, // SCN⁻
  125, // Cl⁻
  138, // S²⁻
  152, // F⁻
  166, // OH⁻
  180, // C₂O₄²⁻
  196, // H₂O
  214, // NCS⁻
  232, // edta⁴⁻
  252, // NH₃
  278, // en
  320, // CN⁻
  356, // CO
]

export const LAB_LIGANDS: readonly LabLigand[] = NCERT_SPECTROCHEMICAL_SERIES.map((lig, i) => ({
  ...lig,
  illustrativeDeltaO: ILLUSTRATIVE_DELTA_O[i],
}))

export const DEFAULT_D_COUNT = 4
export const DEFAULT_LIGAND_INDEX = 8 // H₂O (middle of series)
export const DEFAULT_PAIRING_ENERGY = 210 // illustrative kJ/mol
export const MIN_PAIRING_ENERGY = 120
export const MAX_PAIRING_ENERGY = 320
export const MAX_ENERGY_SCALE = 380

export interface CftLabSnapshot {
  readonly d: number
  readonly geometry: CftGeometry
  readonly ligand: LabLigand
  readonly pairingEnergy: number
  readonly deltaO: number
  readonly deltaActive: number
  readonly lowerLabel: 't₂g' | 'e'
  readonly upperLabel: 'eg' | 't₂'
  readonly lowerSlots: number
  readonly upperSlots: number
  readonly lowerElectrons: number
  readonly upperElectrons: number
  readonly lowerShiftFraction: number
  readonly upperShiftFraction: number
  readonly unpaired: number
  readonly hasSpinChoice: boolean
  readonly field: 'weak' | 'strong'
  readonly spinSummary: string
  readonly cheaperRoute: 'gap' | 'pairing'
}

export function computeCftLabSnapshot(
  dCount: number,
  geometry: CftGeometry,
  ligandIndex: number,
  pairingEnergy: number
): CftLabSnapshot {
  const d = Math.min(10, Math.max(1, Math.trunc(dCount)))
  const idx = Math.min(LAB_LIGANDS.length - 1, Math.max(0, Math.trunc(ligandIndex)))
  const ligand = LAB_LIGANDS[idx]
  const deltaO = ligand.illustrativeDeltaO
  const p = Math.min(MAX_PAIRING_ENERGY, Math.max(MIN_PAIRING_ENERGY, Math.round(pairingEnergy)))

  if (geometry === 'octahedral') {
    const field = fieldType(deltaO, p)
    const cfg = octahedralConfig(d, field === 'strong')
    const levels = octahedralLevelEnergies()
    const hasSpinChoice = d >= 4 && d <= 7
    const spinSummary = !hasSpinChoice
      ? 'No choice for this d count'
      : field === 'weak'
        ? 'Weak field · High spin'
        : 'Strong field · Low spin'
    return {
      d,
      geometry,
      ligand,
      pairingEnergy: p,
      deltaO,
      deltaActive: deltaO,
      lowerLabel: 't₂g',
      upperLabel: 'eg',
      lowerSlots: 3,
      upperSlots: 2,
      lowerElectrons: cfg.t2g,
      upperElectrons: cfg.eg,
      lowerShiftFraction: levels.t2g,
      upperShiftFraction: levels.eg,
      unpaired: cfg.unpaired,
      hasSpinChoice,
      field,
      spinSummary,
      cheaperRoute: deltaO < p ? 'gap' : 'pairing',
    }
  }

  const deltaT = Math.round(tetrahedralSplitting(deltaO))
  const cfg = tetrahedralConfig(d)
  const levels = tetrahedralLevelEnergies()
  const field = fieldType(deltaT, p)
  return {
    d,
    geometry,
    ligand,
    pairingEnergy: p,
    deltaO,
    deltaActive: deltaT,
    lowerLabel: 'e',
    upperLabel: 't₂',
    lowerSlots: 2,
    upperSlots: 3,
    lowerElectrons: cfg.e,
    upperElectrons: cfg.t2,
    lowerShiftFraction: levels.e,
    upperShiftFraction: levels.t2,
    unpaired: cfg.unpaired,
    hasSpinChoice: false,
    field,
    spinSummary: 'High spin (low spin rarely observed)',
    cheaperRoute: deltaT < p ? 'gap' : 'pairing',
  }
}
