import {
  PHASE_LABELS,
  filterBySolventPhase,
  type PhysicalPhase,
  type SolutionCategory,
  type SolutionTypeEntry,
} from '@/lib/chem/solution-types'

export const TYPES_STEP_COUNT = 4

export type TypesStepId = 'homogeneous' | 'gaseous' | 'liquid' | 'solid'

export interface TypesCardItem {
  readonly id: string
  readonly solutePhase: PhysicalPhase
  readonly solventPhase: PhysicalPhase
  readonly phasePairLabel: string
  readonly shortTitle: string
  readonly soluteTag: string
  readonly solventTag: string
}

export interface TypesStepSpec {
  readonly index: number
  readonly id: TypesStepId
  readonly title: string
  readonly subtitle: string
  readonly takeaway: string
  readonly activeCategory: SolutionCategory | 'Overview'
  readonly solventPhase: PhysicalPhase | null
  readonly ariaLabel: string
  readonly cards: readonly TypesCardItem[]
}

const PHASE_ABBR: Record<PhysicalPhase, string> = {
  gas: 'g',
  liquid: 'l',
  solid: 's',
}

const SHORT_TITLES: Record<string, string> = {
  'gas-gas': 'O₂ in N₂ (Air)',
  'liquid-gas': 'CHCl₃ in N₂',
  'solid-gas': 'Camphor in N₂',
  'gas-liquid': 'O₂ in Water',
  'liquid-liquid': 'Ethanol in Water',
  'solid-liquid': 'Glucose in Water',
  'gas-solid': 'H₂ in Palladium',
  'liquid-solid': 'Hg in Sodium',
  'solid-solid': 'Cu in Gold',
}

function toCardItem(entry: SolutionTypeEntry): TypesCardItem {
  return {
    id: entry.id,
    solutePhase: entry.solutePhase,
    solventPhase: entry.solventPhase,
    phasePairLabel: `${PHASE_LABELS[entry.solutePhase]} in ${PHASE_LABELS[entry.solventPhase]}`,
    shortTitle: SHORT_TITLES[entry.id] ?? entry.example,
    soluteTag: `Solute: ${entry.soluteName} (${PHASE_ABBR[entry.solutePhase]})`,
    solventTag: `Solvent: ${entry.solventName} (${PHASE_ABBR[entry.solventPhase]})`,
  }
}

export const TYPES_STEPS: readonly TypesStepSpec[] = [
  {
    index: 0,
    id: 'homogeneous',
    title: 'What Makes a Binary Solution?',
    subtitle: 'One solvent sets the physical state; one solute disperses uniformly',
    takeaway: '3 solute states × 3 solvent states = 9 binary solution types',
    activeCategory: 'Overview',
    solventPhase: null,
    ariaLabel:
      'Step 1 of 4: Diagram showing a majority solvent and minority solute mixing at the particle scale into a single uniform homogeneous binary solution.',
    cards: [],
  },
  {
    index: 1,
    id: 'gaseous',
    title: 'Gaseous Solutions (Gas Solvent)',
    subtitle: 'Nitrogen gas hosts gaseous, vapourised liquid, or sublimed solid solutes',
    takeaway: 'Solvent is a gas (N₂) → all three mixtures exist as gaseous solutions.',
    activeCategory: 'Gaseous',
    solventPhase: 'gas',
    ariaLabel:
      'Step 2 of 4: Three gaseous solutions with nitrogen gas as solvent: oxygen gas in nitrogen, chloroform vapour in nitrogen, and camphor in nitrogen.',
    cards: filterBySolventPhase('gas').map(toCardItem),
  },
  {
    index: 2,
    id: 'liquid',
    title: 'Liquid Solutions (Liquid Solvent)',
    subtitle: 'Liquid water dissolves gases, miscible liquids, and crystalline solids',
    takeaway: 'Solvent is a liquid (water) → all three mixtures exist as liquid solutions.',
    activeCategory: 'Liquid',
    solventPhase: 'liquid',
    ariaLabel:
      'Step 3 of 4: Three liquid solutions with water as solvent: dissolved oxygen in water, ethanol in water, and glucose in water.',
    cards: filterBySolventPhase('liquid').map(toCardItem),
  },
  {
    index: 3,
    id: 'solid',
    title: 'Solid Solutions (Solid Solvent)',
    subtitle: 'Metal crystal lattices host gases, liquid metals, or foreign metal atoms',
    takeaway: 'Solvent is a solid metal → all three mixtures remain solid solutions.',
    activeCategory: 'Solid',
    solventPhase: 'solid',
    ariaLabel:
      'Step 4 of 4: Three solid solutions with solid metal solvents: hydrogen in palladium, mercury amalgam in sodium, and copper dissolved in gold.',
    cards: filterBySolventPhase('solid').map(toCardItem),
  },
] as const

/** Clamp any numeric step input into the valid range [0, TYPES_STEP_COUNT - 1]. */
export function clampTypesStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  const rounded = Math.round(step)
  if (rounded < 0) return 0
  if (rounded >= TYPES_STEP_COUNT) return TYPES_STEP_COUNT - 1
  return rounded
}

/** Resolve the full visual specification for a given animation step index. */
export function getTypesStepSpec(step: number): TypesStepSpec {
  return TYPES_STEPS[clampTypesStep(step)]
}
