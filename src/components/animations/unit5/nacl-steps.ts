/**
 * Step targets for the two NaCl scrollies in Section 5.5: the Born–Haber staircase (5.5(d)) and the
 * dissolution of NaCl in water (5.5(e)). Each Step is a pure function of the step index, so the
 * picture for a Step never depends on the path taken to reach it.
 *
 * Units: kJ mol⁻¹ throughout. Signs follow the convention in each diagram: the Born–Haber steps are in
 * the formation direction, and the dissolution steps are in the direction of the arrow.
 */

import type { EnthalpyLevel, EnthalpyStep } from '@/components/thermo/EnthalpyDiagram'
import { bornHaberLevels, enthalpyOfSolution, latticeEnthalpyNaCl, naClHydrationEnthalpy } from '@/lib/chem/enthalpy-types'
import { NCERT_UNIT5_NACL_BORN_HABER } from '@/lib/chem/ncert-unit5-tables'

/** Born–Haber Steps: the elements, then one per cycle step. */
export const BORN_HABER_STEP_COUNT = 6

/** Dissolution Steps: the crystal, the lattice step, the hydration step, and the net. */
export const DISSOLUTION_STEP_COUNT = 4

/** Clamps a Step index to the range of a scrolly with `count` Steps. */
export function clampSteps(step: number, count: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(count - 1, Math.max(0, Math.round(step)))
}

/** Signed value with a true minus sign and one decimal place: +108.4, −348.6, 0.0. */
export function formatSignedKJ(value: number): string {
  const magnitude = Math.abs(value).toFixed(1)
  if (Number(magnitude) === 0) return '0.0'
  return value < 0 ? `−${magnitude}` : `+${magnitude}`
}

/** Level labels of the Born–Haber cycle, in the order of bornHaberLevels(). */
const BORN_HABER_LABELS = [
  'Na(s) + ½Cl₂(g)',
  'Na(g) + ½Cl₂(g)',
  'Na(g) + Cl(g)',
  'Na⁺(g) + Cl(g) + e⁻',
  'Na⁺(g) + Cl⁻(g)',
  'NaCl(s)',
] as const

/** Short names of the five cycle steps, shown beside each arrow (the same order as the cycle). */
export const BORN_HABER_NAMES = ['ΔsubH', '½ΔbondH', 'ΔiH', 'ΔegH', 'ΔlatH'] as const

/** Vertical gap between schematic levels, in SVG units. Wide enough for the three low steps to read. */
export const BORN_HABER_LEVEL_GAP = 56

/**
 * Schematic rank of each cycle level from the bottom (0 is the lowest). The ranks follow the true
 * order of the enthalpies, so the picture keeps the physics, but the spacing is even and not to scale.
 * Levels: elements, Na(g)+½Cl₂, Na(g)+Cl, Na⁺(g)+Cl(g)+e⁻, Na⁺(g)+Cl⁻(g), NaCl(s).
 */
export const BORN_HABER_RANK: readonly number[] = [1, 2, 3, 5, 4, 0]

/** Height of a level in the schematic Born–Haber picture, with the bottom at `baseY`. */
export function schematicLevelY(index: number, baseY: number): number {
  return baseY - BORN_HABER_RANK[index] * BORN_HABER_LEVEL_GAP
}

/** Spoken name of each step, for the readout. */
const BORN_HABER_SPOKEN = [
  'Sublimation of sodium',
  'Dissociation of ½Cl₂ into Cl atoms',
  'Ionisation of sodium',
  'Electron gain by chlorine',
  'Lattice formation of NaCl(s)',
] as const

/** The six levels of the Born–Haber diagram, from the cumulative sums in enthalpy-types.ts. */
export function bornHaberDiagramLevels(): EnthalpyLevel[] {
  const H = bornHaberLevels()
  return BORN_HABER_LABELS.map((label, i) => ({ id: `level-${i}`, label, H: H[i] }))
}

/**
 * The cycle steps shown at a Step, with the latest one marked 'now' and the earlier ones 'done'. The
 * arrows are the NCERT Unit 5 values, read from NCERT_UNIT5_NACL_BORN_HABER.
 */
export function bornHaberDiagramSteps(step: number): EnthalpyStep[] {
  const s = clampSteps(step, BORN_HABER_STEP_COUNT)
  const shown: EnthalpyStep[] = []
  for (let i = 0; i < s; i++) {
    shown.push({
      id: `step-${i}`,
      from: `level-${i}`,
      to: `level-${i + 1}`,
      column: i,
      dH: NCERT_UNIT5_NACL_BORN_HABER[i].enthalpyKJ,
      name: BORN_HABER_NAMES[i],
      route: i === s - 1 ? 'now' : 'done',
    })
  }
  return shown
}

/** Readout under the Born–Haber diagram for a Step. */
export function bornHaberReadout(step: number): string {
  const s = clampSteps(step, BORN_HABER_STEP_COUNT)
  if (s === 0) return 'Start from the elements, Na(s) and ½Cl₂(g), at 0 kJ mol⁻¹.'
  const i = s - 1
  const H = bornHaberLevels()
  const dH = NCERT_UNIT5_NACL_BORN_HABER[i].enthalpyKJ
  const level = `The level is now ${formatSignedKJ(H[s])} kJ mol⁻¹.`
  return `${BORN_HABER_SPOKEN[i]}: ${formatSignedKJ(dH)} kJ mol⁻¹. ${level}`
}

/** Level labels and the arrows of the dissolution diagram. */
export function dissolutionDiagramLevels(): EnthalpyLevel[] {
  const lattice = latticeEnthalpyNaCl()
  const net = enthalpyOfSolution(lattice, naClHydrationEnthalpy())
  return [
    { id: 'solid', label: 'NaCl(s)', H: 0 },
    { id: 'gas', label: 'Na⁺(g) + Cl⁻(g)', H: lattice },
    { id: 'aqueous', label: 'Na⁺(aq) + Cl⁻(aq)', H: net },
  ]
}

/** The arrows shown at a dissolution Step: the lattice step from Step 1, the hydration step from Step 2. */
export function dissolutionDiagramSteps(step: number): EnthalpyStep[] {
  const s = clampSteps(step, DISSOLUTION_STEP_COUNT)
  const steps: EnthalpyStep[] = []
  if (s >= 1) {
    steps.push({
      id: 'lattice',
      from: 'solid',
      to: 'gas',
      column: 0,
      dH: latticeEnthalpyNaCl(),
      name: 'ΔlatH',
      route: s === 1 ? 'now' : 'done',
    })
  }
  if (s >= 2) {
    steps.push({
      id: 'hydration',
      from: 'gas',
      to: 'aqueous',
      column: 1,
      dH: naClHydrationEnthalpy(),
      name: 'ΔhydH',
      route: s === 2 ? 'now' : 'done',
    })
  }
  return steps
}

/** Readout under the dissolution diagram for a Step. */
export function dissolutionReadout(step: number): string {
  const s = clampSteps(step, DISSOLUTION_STEP_COUNT)
  const lattice = latticeEnthalpyNaCl()
  const hydration = naClHydrationEnthalpy()
  const net = enthalpyOfSolution(lattice, hydration)
  switch (s) {
    case 0:
      return 'The crystal, NaCl(s), is the reference at 0 kJ mol⁻¹. Its separated ions in the gas phase lie far above it.'
    case 1:
      return `Lattice separation, NaCl(s) → Na⁺(g) + Cl⁻(g), takes in ${formatSignedKJ(lattice)} kJ mol⁻¹: an endothermic step.`
    case 2:
      return `Hydration, Na⁺(g) + Cl⁻(g) → aqueous ions, gives out ${formatSignedKJ(hydration)} kJ mol⁻¹: an exothermic step.`
    default:
      return `Net: ΔsolH = ${formatSignedKJ(lattice)} + (${formatSignedKJ(hydration)}) = ${formatSignedKJ(net)} kJ mol⁻¹. The two steps almost cancel.`
  }
}
