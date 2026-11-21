import { NCERT_STANDARD_POTENTIALS, FARADAY } from '@/lib/chem/ncert-c12-unit2-tables'
import {
  equilibriumConstantFromE,
  gibbsFromCellKJ,
  log10KFromE,
  standardCellPotential,
} from '@/lib/chem/electrochemical-cell'
import { cellPotential } from '@/lib/chem/nernst'

export type RundownScene = 'cell' | 'log' | 'bar' | 'double'

export interface RundownStepState {
  readonly index: number
  readonly id: 'fresh' | 'running' | 'equilibrium' | 'log-scale' | 'energy-bar' | 'doubled'
  readonly scene: RundownScene
  /** Reaction quotient Q shown in the readout (cell scenes only). */
  readonly q: number
  /** Cell potential in V at this Step, from the nernst lib. */
  readonly cellV: number
  /** 0 to 1: how far the zinc electrode has dissolved. */
  readonly zincProgress: number
  /** 0 to 1: how far the copper electrode has plated. Matches zincProgress. */
  readonly copperProgress: number
  /** Opacity of the blue CuSO₄ tint over the clear reference beaker (schematic). */
  readonly blueFraction: number
  /** True while electrons flow in the external wire and ions drift in the salt bridge. */
  readonly flowing: boolean
  readonly zincNote: string
  readonly copperNote: string
  /** Text under the cell drawing. */
  readonly readout: string
  /** ΔrG° in kJ mol⁻¹ for the bar scenes; the bar tweens to this value. */
  readonly deltaGKJ: number
  readonly ariaLabel: string
}

// Table 2.1 values, looked up by id so no number is typed in here.
function standardPotential(id: string): number {
  const row = NCERT_STANDARD_POTENTIALS.find((r) => r.id === id)
  if (!row) throw new Error(`Missing standard potential row ${id}`)
  return row.e0
}

const N_DANIELL = 2
/** Daniell cell: Zn(s) | Zn²⁺ || Cu²⁺ | Cu(s), E°cell from Table 2.1. */
export const E0_DANIELL = standardCellPotential(standardPotential('Cu2+/Cu'), standardPotential('Zn2+/Zn'))
/** Fe(s) + Ni²⁺ → Fe²⁺ + Ni(s), the second example (n = 2). */
export const E0_FE_NI = standardCellPotential(standardPotential('Ni2+/Ni'), standardPotential('Fe2+/Fe'))
export const LOG_K_DANIELL = log10KFromE(N_DANIELL, E0_DANIELL)
export const LOG_K_FE_NI = log10KFromE(N_DANIELL, E0_FE_NI)
export const K_DANIELL = equilibriumConstantFromE(N_DANIELL, E0_DANIELL)
export const DELTA_G_DANIELL_KJ = gibbsFromCellKJ(N_DANIELL, E0_DANIELL)
export const DELTA_G_FE_NI_KJ = gibbsFromCellKJ(N_DANIELL, E0_FE_NI)
export const DELTA_G_FE_NI_DOUBLED_KJ = gibbsFromCellKJ(2 * N_DANIELL, E0_FE_NI)
export const N_F_TWO = N_DANIELL * FARADAY

/** Voltages closer to zero than this are reported as exactly zero (float noise at equilibrium). */
function tidy(v: number): number {
  return Math.abs(v) < 1e-9 ? 0 : v
}

const CELL_Q_RUNNING = 100

const SUPERSCRIPT: Readonly<Record<string, string>> = {
  '-': '⁻',
  '+': '',
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
}

/** Scientific notation with a one-digit mantissa and Unicode superscript exponent, e.g. 2 × 10³⁷. */
export function sciText(x: number, digits = 0): string {
  const [mantissa, exponent] = x.toExponential(digits).split('e')
  const power = [...String(Number(exponent))].map((c) => SUPERSCRIPT[c] ?? c).join('')
  return `${mantissa} × 10${power}`
}

export const RUNDOWN_STEPS: readonly RundownStepState[] = [
  {
    index: 0,
    id: 'fresh',
    scene: 'cell',
    q: 1,
    cellV: tidy(cellPotential(E0_DANIELL, N_DANIELL, 1)),
    zincProgress: 0,
    copperProgress: 0,
    blueFraction: 1,
    flowing: true,
    zincNote: '',
    copperNote: '',
    readout: 'Q = 1',
    deltaGKJ: DELTA_G_DANIELL_KJ,
    ariaLabel:
      'Fresh Daniell cell. A zinc electrode sits in a colourless zinc sulphate solution and a copper electrode in a blue copper sulphate solution, joined by a salt bridge and a wire with a voltmeter reading about 1.10 volts. Electrons flow from zinc to copper.',
  },
  {
    index: 1,
    id: 'running',
    scene: 'cell',
    q: CELL_Q_RUNNING,
    cellV: tidy(cellPotential(E0_DANIELL, N_DANIELL, CELL_Q_RUNNING)),
    zincProgress: 0.3,
    copperProgress: 0.3,
    blueFraction: 0.45,
    flowing: true,
    zincNote: 'Zn²⁺ rising ↑',
    copperNote: 'Cu²⁺ falling ↓',
    readout: 'Q = [Zn²⁺]/[Cu²⁺] = 100',
    deltaGKJ: DELTA_G_DANIELL_KJ,
    ariaLabel:
      'The cell is running. Zinc dissolves as Zn²⁺, copper deposits from the blue solution, and the blue fades. Q is 100 and the voltmeter reads about 1.04 volts.',
  },
  {
    index: 2,
    id: 'equilibrium',
    scene: 'cell',
    q: K_DANIELL,
    cellV: tidy(cellPotential(E0_DANIELL, N_DANIELL, K_DANIELL)),
    zincProgress: 1,
    copperProgress: 1,
    blueFraction: 0.06,
    flowing: false,
    zincNote: 'no net change',
    copperNote: 'no net change',
    readout: `E = 0 and Q = K ≈ ${sciText(K_DANIELL)}`,
    deltaGKJ: DELTA_G_DANIELL_KJ,
    ariaLabel:
      'Equilibrium. The voltmeter reads zero, electrons no longer flow, and the copper solution is almost colourless. Q equals the equilibrium constant, about 2 times 10 to the 37th.',
  },
  {
    index: 3,
    id: 'log-scale',
    scene: 'log',
    q: K_DANIELL,
    cellV: E0_DANIELL,
    zincProgress: 1,
    copperProgress: 1,
    blueFraction: 0.06,
    flowing: false,
    zincNote: '',
    copperNote: '',
    readout: '',
    deltaGKJ: DELTA_G_DANIELL_KJ,
    ariaLabel:
      'A logarithmic scale of log K from 0 to 40. The Daniell cell, with standard potential 1.10 volts, sits at log K of about 37.3. The iron and nickel couple, with 0.19 volts, sits at about 6.4.',
  },
  {
    index: 4,
    id: 'energy-bar',
    scene: 'bar',
    q: K_DANIELL,
    cellV: E0_FE_NI,
    zincProgress: 1,
    copperProgress: 1,
    blueFraction: 0.06,
    flowing: false,
    zincNote: '',
    copperNote: '',
    readout: '',
    deltaGKJ: DELTA_G_FE_NI_KJ,
    ariaLabel:
      'An energy bar drawn downward from zero to the standard Gibbs energy change of the iron and nickel reaction, minus 36.67 kilojoules per mole, with the formula delta G standard equals minus n F E standard.',
  },
  {
    index: 5,
    id: 'doubled',
    scene: 'double',
    q: K_DANIELL,
    cellV: E0_FE_NI,
    zincProgress: 1,
    copperProgress: 1,
    blueFraction: 0.06,
    flowing: false,
    zincNote: '',
    copperNote: '',
    readout: '',
    deltaGKJ: DELTA_G_FE_NI_DOUBLED_KJ,
    ariaLabel:
      'The reaction equation is doubled, so n rises from 2 to 4. The voltmeter still reads 0.19 volts, while the energy bar doubles to minus 73.33 kilojoules per mole.',
  },
]

export const RUNDOWN_STEP_COUNT = RUNDOWN_STEPS.length

export function clampRundownStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(RUNDOWN_STEP_COUNT - 1, Math.max(0, Math.round(step)))
}

export function getRundownStepState(step: number): RundownStepState {
  return RUNDOWN_STEPS[clampRundownStep(step)]
}
