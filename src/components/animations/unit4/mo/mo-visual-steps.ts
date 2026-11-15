/**
 * Deterministic targets for the two MO diagram Scrollies: the homonuclear ladder (Sections 4.7.4
 * and 4.8) and the O₂ filling (Section 4.8, paramagnetism). Each Step is one species or one
 * electron count, and the diagram is computed from src/lib/chem only.
 */

import { fillMOs, MO_ORDER_WITH_MIXING, MO_ORDER_WITHOUT_MIXING, type MOOccupancy } from '@/lib/chem/molecular-orbitals'
import { highestOccupiedLevel } from '@/lib/chem/mo-builder'

export function clampMoStep(step: number, count: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(count - 1, Math.max(0, Math.round(step)))
}

/** One Step of the homonuclear ladder: a species and what the Learner should notice. */
export interface LadderStep {
  formula: string
  /** Element symbol drawn over each atomic column. */
  element: string
  electrons: number
  mixing: boolean
  note: string
}

export const LADDER_STEPS: readonly LadderStep[] = [
  {
    formula: 'H₂', element: 'H', electrons: 2, mixing: true,
    note: 'Both electrons sit in σ1s. The bond order is (2 − 0) / 2 = 1, a single bond, and both electrons are paired.',
  },
  {
    formula: 'He₂', element: 'He', electrons: 4, mixing: true,
    note: 'σ1s and σ*1s are both full. The bonding and antibonding electrons cancel, so the bond order is 0 and He₂ does not exist.',
  },
  {
    formula: 'Li₂', element: 'Li', electrons: 6, mixing: true,
    note: 'Four electrons are bonding and two are antibonding. The bond order is 1, and with every electron paired Li₂ is diamagnetic.',
  },
  {
    formula: 'C₂', element: 'C', electrons: 12, mixing: true,
    note: 'With the mixed order, the two π2p orbitals fill before σ2p. The bond order is 2, and both bonds are π bonds, since the π2p pair is full.',
  },
  {
    formula: 'N₂', element: 'N', electrons: 14, mixing: true,
    note: 'Fourteen electrons give a bond order of 3, a triple bond. Still in the mixed order, σ2p lies above π2p, and N₂ is diamagnetic.',
  },
  {
    formula: 'O₂', element: 'O', electrons: 16, mixing: false,
    note: 'For O₂ the order changes: σ2p now lies below π2p. The bond order is 2, and two electrons sit alone in the π*2p orbitals, so O₂ is paramagnetic.',
  },
]

export const LADDER_STEP_COUNT = LADDER_STEPS.length

export function ladderTargetForStep(step: number): LadderStep {
  return LADDER_STEPS[clampMoStep(step, LADDER_STEP_COUNT)]
}

/** Levels filled for a ladder Step, with the highest occupied level (the HOMO) picked out. */
export function ladderLevels(step: LadderStep): { levels: MOOccupancy[]; homo: string | null } {
  const order = step.mixing ? MO_ORDER_WITH_MIXING : MO_ORDER_WITHOUT_MIXING
  const levels = fillMOs(step.electrons, order)
  return { levels, homo: highestOccupiedLevel(levels) }
}

/** One Step of the O₂ filling: how many electrons are placed and what to look for. */
export interface O2FillStep {
  placed: number
  note: string
}

export const O2_FILL_STEPS: readonly O2FillStep[] = [
  {
    placed: 8,
    note: 'The first eight electrons fill σ1s, σ*1s, σ2s and σ*2s. Each bonding pair is cancelled by an antibonding pair, so these do not bond the atoms.',
  },
  {
    placed: 12,
    note: 'Four more electrons are bonding. Two go into σ2p, and one goes into each π2p orbital, so the bond order rises.',
  },
  {
    placed: 14,
    note: 'Two more fill the π2p pair completely. Every bonding orbital is now full.',
  },
  {
    placed: 16,
    note: 'The last two electrons enter the two π*2p orbitals separately, with parallel spins, as Hund’s rule requires. They are unpaired.',
  },
  {
    placed: 16,
    note: 'A Lewis structure draws O₂ with every electron paired, which predicts diamagnetism. The MO diagram shows two unpaired electrons, and the measured O₂ is paramagnetic.',
  },
]

export const O2_FILL_STEP_COUNT = O2_FILL_STEPS.length

export function o2TargetForStep(step: number): O2FillStep {
  return O2_FILL_STEPS[clampMoStep(step, O2_FILL_STEP_COUNT)]
}

/** Levels for the O₂ filling Step, in the unmixed order. */
export function o2Levels(step: number): MOOccupancy[] {
  return fillMOs(o2TargetForStep(step).placed, MO_ORDER_WITHOUT_MIXING)
}
