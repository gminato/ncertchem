/**
 * Deterministic targets for the two hydrogen-bonding Scrollies (Section 4.9): the contacts drawn
 * in 2D, and the boiling-point anomaly chart. The boiling points are not from NCERT. They come
 * from src/lib/chem/hydrogen-bond.ts, which cites the CRC Handbook.
 */

import { HYDRIDE_BOILING_POINTS, hydrideAnomaly, type HydrideBoilingPoint } from '@/lib/chem/hydrogen-bond'

export function clampHBondStep(step: number, count: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(count - 1, Math.max(0, Math.round(step)))
}

export type ContactId = 'cause' | 'chain' | 'water' | 'intramolecular'

export const CONTACT_STEPS: readonly { id: ContactId; description: string }[] = [
  {
    id: 'cause',
    description: 'One H–F bond. The shared electrons sit closer to F, so H carries a partial positive charge (δ+) and F a partial negative charge (δ−).',
  },
  {
    id: 'chain',
    description: 'The δ+ hydrogen of one HF molecule is attracted to the δ− fluorine of the next. The dotted lines are hydrogen bonds, and they link the molecules into a zig-zag chain.',
  },
  {
    id: 'water',
    description: 'In water, the hydrogen of one molecule is attracted to the oxygen of another. Each dotted line is an intermolecular hydrogen bond between two water molecules.',
  },
  {
    id: 'intramolecular',
    description: 'In o-nitrophenol the hydrogen of the OH group bonds to an oxygen of the nitro group in the same molecule. The contact closes a six-membered ring, so the bond is intramolecular.',
  },
]

export const CONTACT_STEP_COUNT = CONTACT_STEPS.length

export function contactTargetForStep(step: number): { id: ContactId; description: string } {
  return CONTACT_STEPS[clampHBondStep(step, CONTACT_STEP_COUNT)]
}

/** Groups of the boiling-point chart, from the period-2 hydride down to period 5. */
export const BOILING_GROUPS = [14, 15, 16, 17] as const
export type BoilingGroup = (typeof BOILING_GROUPS)[number]

/** Hydrides of one group, in period order, with the period-2 anomaly from the lib. */
export function groupSeries(group: BoilingGroup): { points: HydrideBoilingPoint[]; anomaly: ReturnType<typeof hydrideAnomaly> } {
  const points = HYDRIDE_BOILING_POINTS.filter((h) => h.group === group).sort((a, b) => a.period - b.period)
  return { points, anomaly: hydrideAnomaly(group) }
}

/** Which groups the chart shows at each Step, and what it says. */
export interface BoilingTarget {
  /** Groups whose period-2 point and extrapolated trend are drawn. */
  revealed: readonly BoilingGroup[]
  /** Groups drawn at all: the heavier hydrides always show. */
  description: string
}

export const BOILING_STEPS: readonly BoilingTarget[] = [
  {
    revealed: [],
    description: 'Heavier hydrides first. Within each group the boiling point rises steadily from period 3 down to period 5, as the molecules grow larger and their van der Waals forces grow with them.',
  },
  {
    revealed: [16],
    description: 'Extend the trend of group 16 back to period 2. H₂O should boil far below 373 K, but it boils at 373 K. That gap is the anomaly, and it is where the hydrogen bonds act.',
  },
  {
    revealed: [15, 17],
    description: 'NH₃ and HF are anomalous in the same way, because N and F are also highly electronegative and bond to H in the same manner. CH₄ has no N–H or F–H bond, so it follows its group.',
  },
  {
    revealed: [14, 15, 16, 17],
    description: 'Compared with the straight-line extrapolation, the boiling points of H₂O, HF and NH₃ are far above the trend, while CH₄ sits slightly below it.',
  },
]

export const BOILING_STEP_COUNT = BOILING_STEPS.length

export function boilingTargetForStep(step: number): BoilingTarget {
  return BOILING_STEPS[clampHBondStep(step, BOILING_STEP_COUNT)]
}
