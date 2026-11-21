import { cellPotential, electrodePotential, hydrogenElectrodePotential, reactionQuotient } from '@/lib/chem/nernst'
import { standardCellPotential } from '@/lib/chem/electrochemical-cell'
import { NCERT_STANDARD_POTENTIALS } from '@/lib/chem/ncert-c12-unit2-tables'

/**
 * Deterministic target state for each Scrolly step of Section 2.3 (Nernst equation).
 * The component tweens every numeric target from its current value, so the concentration
 * slides and the potential moves with it. All potentials come from the electrochemistry libs.
 */

export type NernstStepId = 'one-electrode' | 'log-scale' | 'daniell-ratio' | 'general-cell' | 'hydrogen-ph'

/** log10 of the concentration of each species (mol L⁻¹), and the pH of the hydrogen electrode. */
export interface NernstTargets {
  readonly logCu: number
  readonly logZn: number
  readonly logNi: number
  readonly logAg: number
  readonly pH: number
}

export interface NernstStepState extends NernstTargets {
  readonly index: number
  readonly id: NernstStepId
  readonly title: string
  readonly ariaLabel: string
}

function standardPotential(id: string): number {
  const row = NCERT_STANDARD_POTENTIALS.find((r) => r.id === id)
  if (!row) throw new Error(`No standard potential row for ${id}`)
  return row.e0
}

export const E0_CU = standardPotential('Cu2+/Cu')
export const E0_ZN = standardPotential('Zn2+/Zn')
export const E0_AG = standardPotential('Ag+/Ag')
export const E0_NI = standardPotential('Ni2+/Ni')

/** E°cell of the Daniell cell, from Table 2.1 (cathode Cu²⁺/Cu, anode Zn²⁺/Zn). */
export const E0_DANIELL = standardCellPotential(E0_CU, E0_ZN)
/** E°cell of Ni | Ni²⁺ || Ag⁺ | Ag (cathode Ag⁺/Ag, anode Ni²⁺/Ni). */
export const E0_NI_AG = standardCellPotential(E0_AG, E0_NI)

/** E(Cu²⁺/Cu) at the given log10 concentration; n = 2. */
export function cuElectrodePotential(logCu: number): number {
  return electrodePotential(E0_CU, 2, 10 ** logCu)
}

/** Daniell cell EMF for [Zn²⁺]/[Cu²⁺] given in log10 form; n = 2. */
export function daniellPotential(logZn: number, logCu: number): number {
  return cellPotential(E0_DANIELL, 2, 10 ** (logZn - logCu))
}

/** Q = [Ni²⁺]/[Ag⁺]² for the Ni | Ag cell, from log10 concentrations. */
export function niAgReactionQuotient(logNi: number, logAg: number): number {
  return reactionQuotient([{ value: 10 ** logNi, power: 1 }], [{ value: 10 ** logAg, power: 2 }])
}

/** Ni | Ag cell EMF; n = 2. */
export function niAgPotential(logNi: number, logAg: number): number {
  return cellPotential(E0_NI_AG, 2, niAgReactionQuotient(logNi, logAg))
}

/** Hydrogen electrode EMF at the given pH (1 bar H₂). */
export function hydrogenPotential(pH: number): number {
  return hydrogenElectrodePotential(pH)
}

const BASE: NernstTargets = { logCu: 0, logZn: 0, logNi: 0, logAg: 0, pH: 0 }

export const NERNST_STEPS: readonly NernstStepState[] = [
  {
    index: 0,
    id: 'one-electrode',
    title: 'One electrode, one concentration',
    ...BASE,
    ariaLabel:
      'A copper electrode dips into copper(II) sulphate solution at 1 mol per litre. A log scale of Cu²⁺ concentration shows the marker at 1, and the electrode potential reads 0.340 volts, equal to E° because the concentration is unity.',
  },
  {
    index: 1,
    id: 'log-scale',
    title: 'Concentration slides down the log scale',
    ...BASE,
    logCu: -4,
    ariaLabel:
      'The Cu²⁺ concentration slides from 1 to 10 to the minus 4 mol per litre on a logarithmic scale. Each tenfold drop lowers the copper electrode potential by 0.0295 volts, so the reading falls from 0.340 V to 0.222 V.',
  },
  {
    index: 2,
    id: 'daniell-ratio',
    title: 'Daniell cell: the ratio [Zn²⁺]/[Cu²⁺]',
    ...BASE,
    logZn: -2,
    ariaLabel:
      'A Daniell cell with zinc sulphate at 0.010 mol per litre and copper sulphate at 1 mol per litre. The concentration ratio is 0.010, so the cell potential rises from 1.10 volts to about 1.16 volts.',
  },
  {
    index: 3,
    id: 'general-cell',
    title: 'General cell and the reaction quotient Q',
    ...BASE,
    logNi: -1,
    logAg: -2,
    ariaLabel:
      'A nickel and silver cell. Nickel ions at 0.10 mol per litre and silver ions at 0.010 mol per litre give a reaction quotient Q of 1000, so the cell potential is about 0.96 volts, below the standard value of 1.05 volts.',
  },
  {
    index: 4,
    id: 'hydrogen-ph',
    title: 'Hydrogen electrode and pH',
    ...BASE,
    logNi: -1,
    logAg: -2,
    pH: 10,
    ariaLabel:
      'A standard hydrogen electrode in a solution whose pH is 10. Its potential is minus 0.059 volts multiplied by the pH, which gives minus 0.590 volts.',
  },
]

export const NERNST_STEP_COUNT = NERNST_STEPS.length

export function clampNernstStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(NERNST_STEP_COUNT - 1, Math.max(0, Math.round(step)))
}

export function getNernstStepState(step: number): NernstStepState {
  return NERNST_STEPS[clampNernstStep(step)]
}
