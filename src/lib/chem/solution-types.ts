import {
  NCERT_SOLUTION_TYPES,
  type PhysicalPhase,
  type SolutionTypeEntry,
} from './ncert-c12-unit1-tables'

export { NCERT_SOLUTION_TYPES, type PhysicalPhase, type SolutionTypeEntry }

export type SolutionCategory = SolutionTypeEntry['category']

export const PHYSICAL_PHASES: readonly PhysicalPhase[] = [
  'gas',
  'liquid',
  'solid',
] as const

export const PHASE_LABELS: Record<PhysicalPhase, string> = {
  gas: 'Gas',
  liquid: 'Liquid',
  solid: 'Solid',
}

export const SOLVENT_PHASE_TO_CATEGORY: Record<PhysicalPhase, SolutionCategory> = {
  gas: 'Gaseous',
  liquid: 'Liquid',
  solid: 'Solid',
}

/** Look up one of the nine NCERT Table 1.1 solution types by its id (e.g. 'solid-liquid'). */
export function getSolutionTypeById(id: string): SolutionTypeEntry | undefined {
  return NCERT_SOLUTION_TYPES.find((entry) => entry.id === id)
}

/**
 * Classify a binary mixture given the physical states of its solute and solvent.
 * The solvent determines the final physical state (category) of the solution.
 */
export function classifyBinarySolution(
  solutePhase: PhysicalPhase,
  solventPhase: PhysicalPhase,
): SolutionTypeEntry {
  const match = NCERT_SOLUTION_TYPES.find(
    (entry) =>
      entry.solutePhase === solutePhase && entry.solventPhase === solventPhase,
  )
  if (!match) {
    throw new Error(
      `Unsupported binary solution phase pair: solute=${solutePhase}, solvent=${solventPhase}`,
    )
  }
  return match
}

/** Return the three binary solution types sharing a given solvent phase. */
export function filterBySolventPhase(
  solventPhase: PhysicalPhase,
): readonly SolutionTypeEntry[] {
  return NCERT_SOLUTION_TYPES.filter(
    (entry) => entry.solventPhase === solventPhase,
  )
}

/** Return the three binary solution types sharing a given solute phase. */
export function filterBySolutePhase(
  solutePhase: PhysicalPhase,
): readonly SolutionTypeEntry[] {
  return NCERT_SOLUTION_TYPES.filter(
    (entry) => entry.solutePhase === solutePhase,
  )
}

/** Return the three binary solution types belonging to a given solution category. */
export function filterByCategory(
  category: SolutionCategory,
): readonly SolutionTypeEntry[] {
  return NCERT_SOLUTION_TYPES.filter((entry) => entry.category === category)
}

const HOMOGENEITY_NOTES: Record<string, string> = {
  'gas-gas':
    'Oxygen and nitrogen molecules move freely and mix at the molecular scale in every proportion, yielding a single uniform gaseous phase.',
  'liquid-gas':
    'Vapourised chloroform molecules disperse evenly among abundant nitrogen molecules, leaving no liquid droplets and forming one gaseous phase.',
  'solid-gas':
    'Camphor sublimes directly into individual molecules that spread uniformly through nitrogen gas, creating a single homogeneous gaseous phase.',
  'gas-liquid':
    'Oxygen molecules occupy intermolecular spaces throughout liquid water, producing a uniform aqueous phase vital for aquatic organisms.',
  'liquid-liquid':
    'Ethanol and water molecules hydrogen-bond and intermix completely without forming layers, giving one clear liquid phase.',
  'solid-liquid':
    'Solid glucose crystals break down into individual solvated molecules evenly distributed throughout water, yielding a uniform liquid phase.',
  'gas-solid':
    'Hydrogen molecules dissociate and settle uniformly into interstitial voids of the solid palladium lattice without altering its solid state.',
  'liquid-solid':
    'Liquid mercury integrates evenly into the solid sodium metallic matrix to form a single uniform solid amalgam phase.',
  'solid-solid':
    'Copper atoms replace gold atoms at random sites across the crystal lattice, producing a uniform solid substitutional alloy.',
}

/** Return a concise explanation of why a given solute/solvent phase pair forms a single homogeneous phase. */
export function getHomogeneityNote(
  solutePhase: PhysicalPhase,
  solventPhase: PhysicalPhase,
): string {
  const entry = classifyBinarySolution(solutePhase, solventPhase)
  return (
    HOMOGENEITY_NOTES[entry.id] ??
    `${entry.soluteName} disperses uniformly at the particle scale throughout ${entry.solventName}, forming a single ${entry.category.toLowerCase()} phase.`
  )
}

export interface EverydayAlloy {
  readonly id: string
  readonly name: string
  readonly components: readonly string[]
  readonly symbols: readonly string[]
  readonly isBinary: boolean
  readonly note: string
}

/** Everyday metallic solid solutions highlighted in NCERT Class 12 Unit 1 introduction. */
export const EVERYDAY_ALLOYS: readonly EverydayAlloy[] = [
  {
    id: 'brass',
    name: 'Brass',
    components: ['Copper', 'Zinc'],
    symbols: ['Cu', 'Zn'],
    isBinary: true,
    note: 'A binary solid-in-solid solution valued for acoustic resonance and corrosion resistance.',
  },
  {
    id: 'bronze',
    name: 'Bronze',
    components: ['Copper', 'Tin'],
    symbols: ['Cu', 'Sn'],
    isBinary: true,
    note: 'A harder binary solid solution of copper and tin used in bearings, bells, and statues.',
  },
  {
    id: 'german-silver',
    name: 'German silver',
    components: ['Copper', 'Zinc', 'Nickel'],
    symbols: ['Cu', 'Zn', 'Ni'],
    isBinary: false,
    note: 'A ternary (three-component) solid solution with a silvery lustre despite containing no silver.',
  },
] as const

export type FluorideHealthBand = 'low' | 'preventive' | 'mottling' | 'toxic'

/** Fluoride ion (F⁻) concentration thresholds in drinking water (ppm). */
export const FLUORIDE_THRESHOLDS_PPM = {
  preventiveTarget: 1.0,
  mottlingOnset: 1.5,
  toxicOnset: 10.0,
} as const

/** Classify an aqueous fluoride concentration (in ppm) into its biological effect band. */
export function classifyFluorideLevel(ppm: number): FluorideHealthBand {
  if (!Number.isFinite(ppm) || ppm < 0) {
    throw new RangeError(`Fluoride concentration must be a non-negative finite number; received ${ppm}`)
  }
  if (ppm < 0.5) return 'low'
  if (ppm < FLUORIDE_THRESHOLDS_PPM.mottlingOnset) return 'preventive'
  if (ppm < FLUORIDE_THRESHOLDS_PPM.toxicOnset) return 'mottling'
  return 'toxic'
}

/** Context summary for intravenous salt solutions matching blood plasma. */
export const INTRAVENOUS_FLUID_CONTEXT = {
  solvent: 'Water',
  solutes: ['Dissolved physiological salts (e.g. NaCl)'],
  requirement:
    'Ionic concentration must match blood plasma so cells neither swell nor shrink during infusion.',
} as const
