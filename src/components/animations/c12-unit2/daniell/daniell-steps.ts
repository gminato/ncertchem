import { NCERT_STANDARD_POTENTIALS } from '@/lib/chem/ncert-c12-unit2-tables'
import { standardCellPotential } from '@/lib/chem/electrochemical-cell'

export type DaniellStepId =
  | 'direct-transfer'
  | 'voltmeter-reading'
  | 'opposing-below'
  | 'balanced'
  | 'opposing-above'

export type DaniellStepMode = 'direct' | 'galvanic' | 'balanced' | 'electrolytic'
export type DaniellCircuit = 'none' | 'voltmeter' | 'supply'
export type ElectrodeRole = 'anode' | 'cathode' | null

export interface DaniellStepState {
  readonly index: number
  readonly id: DaniellStepId
  readonly mode: DaniellStepMode
  readonly circuit: DaniellCircuit
  /** Opposing external potential in volts (0 when no supply is wired). */
  readonly eExt: number
  /** Daniell cell potential at unit ion concentration, in volts (1.10). */
  readonly eCell: number
  /** Voltmeter reading in volts (only meaningful when circuit is 'voltmeter'). */
  readonly voltmeterValue: number
  /** Illustrative galvanometer deflection in [-1, 1]; positive means galvanic direction. */
  readonly galvanometerValue: number
  /** Electrons travel through the external wire from Zn toward Cu (galvanic) or back (electrolytic). */
  readonly electronsVisible: boolean
  readonly electronDirection: 'forward' | 'reverse'
  readonly znRole: ElectrodeRole
  readonly cuRole: ElectrodeRole
  readonly znPolarity: '+' | '−'
  readonly cuPolarity: '+' | '−'
  /** Fractions 0 to 1 of the electrode lower part eaten away or plated over. */
  readonly znThinning: number
  readonly znPlating: number
  readonly cuThinning: number
  readonly cuPlating: number
  readonly title: string
  readonly caption: string
  readonly ariaLabel: string
}

const E0_CU = NCERT_STANDARD_POTENTIALS.find((r) => r.id === 'Cu2+/Cu')?.e0 ?? 0.34
const E0_ZN = NCERT_STANDARD_POTENTIALS.find((r) => r.id === 'Zn2+/Zn')?.e0 ?? -0.76

/** Daniell cell potential at unit concentration, rounded to 0.01 V (1.10 V). */
export const DANIELL_E_CELL = Number(standardCellPotential(E0_CU, E0_ZN).toFixed(2))

/** Illustrative galvanometer scale: deflection proportional to (Ecell - Eext) / Ecell. */
export function illustrativeDeflection(eExt: number): number {
  const v = (DANIELL_E_CELL - eExt) / DANIELL_E_CELL
  return Math.max(-1, Math.min(1, Number(v.toFixed(3))))
}

const BASE = {
  znPolarity: '−',
  cuPolarity: '+',
  znThinning: 0,
  znPlating: 0,
  cuThinning: 0,
  cuPlating: 0,
} as const

export const DANIELL_STEPS: readonly DaniellStepState[] = [
  {
    index: 0,
    id: 'direct-transfer',
    mode: 'direct',
    circuit: 'none',
    eExt: 0,
    eCell: DANIELL_E_CELL,
    voltmeterValue: 0,
    galvanometerValue: 0,
    electronsVisible: false,
    electronDirection: 'forward',
    znRole: null,
    cuRole: null,
    znPolarity: BASE.znPolarity,
    cuPolarity: BASE.cuPolarity,
    znThinning: 0.35,
    znPlating: 0,
    cuThinning: 0,
    cuPlating: 0.35,
    title: 'Direct Transfer',
    caption: 'Zinc in CuSO₄(aq): electrons pass directly, so only heat is produced.',
    ariaLabel:
      'A zinc rod dips into a blue copper sulphate solution. The rod is eaten away and copper coats its lower part. No wire or meter is present, so the energy appears only as heat.',
  },
  {
    index: 1,
    id: 'voltmeter-reading',
    mode: 'galvanic',
    circuit: 'voltmeter',
    eExt: 0,
    eCell: DANIELL_E_CELL,
    voltmeterValue: DANIELL_E_CELL,
    galvanometerValue: 0,
    electronsVisible: true,
    electronDirection: 'forward',
    znRole: 'anode',
    cuRole: 'cathode',
    znPolarity: '−',
    cuPolarity: '+',
    znThinning: 0,
    znPlating: 0,
    cuThinning: 0,
    cuPlating: 0,
    title: 'Separate Half-Cells',
    caption: 'Two half-cells, a salt bridge and a wire: the voltmeter reads 1.10 V.',
    ariaLabel:
      'Zinc and copper half-cells joined by a salt bridge and an external wire. A voltmeter in the wire reads 1.10 V. Electrons flow through the wire from the zinc electrode, the anode, to the copper electrode, the cathode.',
  },
  {
    index: 2,
    id: 'opposing-below',
    mode: 'galvanic',
    circuit: 'supply',
    eExt: 0.6,
    eCell: DANIELL_E_CELL,
    voltmeterValue: 0,
    galvanometerValue: illustrativeDeflection(0.6),
    electronsVisible: true,
    electronDirection: 'forward',
    znRole: 'anode',
    cuRole: 'cathode',
    znPolarity: '−',
    cuPolarity: '+',
    znThinning: 0,
    znPlating: 0,
    cuThinning: 0,
    cuPlating: 0,
    title: 'Opposing Potential Below 1.1 V',
    caption: 'Eext = 0.60 V: still galvanic, but the current is smaller.',
    ariaLabel:
      'A DC supply of 0.60 V is wired against the cell with its positive terminal on the copper side. The galvanometer deflects in the galvanic direction by a smaller amount, and electrons still flow from zinc to copper.',
  },
  {
    index: 3,
    id: 'balanced',
    mode: 'balanced',
    circuit: 'supply',
    eExt: DANIELL_E_CELL,
    eCell: DANIELL_E_CELL,
    voltmeterValue: 0,
    galvanometerValue: illustrativeDeflection(DANIELL_E_CELL),
    electronsVisible: false,
    electronDirection: 'forward',
    znRole: null,
    cuRole: null,
    znPolarity: '−',
    cuPolarity: '+',
    znThinning: 0,
    znPlating: 0,
    cuThinning: 0,
    cuPlating: 0,
    title: 'Balanced at 1.1 V',
    caption: 'Eext = 1.10 V: the galvanometer reads zero, and no current flows.',
    ariaLabel:
      'A DC supply of 1.10 V exactly balances the cell. The galvanometer needle rests at zero, no electrons move, and neither electrode changes.',
  },
  {
    index: 4,
    id: 'opposing-above',
    mode: 'electrolytic',
    circuit: 'supply',
    eExt: 1.5,
    eCell: DANIELL_E_CELL,
    voltmeterValue: 0,
    galvanometerValue: illustrativeDeflection(1.5),
    electronsVisible: true,
    electronDirection: 'reverse',
    znRole: 'cathode',
    cuRole: 'anode',
    znPolarity: '−',
    cuPolarity: '+',
    znThinning: 0,
    znPlating: 0.4,
    cuThinning: 0.4,
    cuPlating: 0,
    title: 'Opposing Potential Above 1.1 V',
    caption: 'Eext = 1.50 V: the flow reverses. Zinc deposits and copper dissolves.',
    ariaLabel:
      'A DC supply of 1.50 V overrides the cell. The galvanometer deflects the other way, electrons flow from copper back toward zinc, zinc is plated onto the zinc electrode and copper dissolves from the copper electrode. The galvanic cell has become an electrolytic cell.',
  },
] as const

export const DANIELL_STEP_COUNT = DANIELL_STEPS.length

export function clampDaniellStep(index: number): number {
  if (!Number.isFinite(index)) return 0
  return Math.max(0, Math.min(DANIELL_STEP_COUNT - 1, Math.floor(index)))
}

export function getDaniellStepState(index: number): DaniellStepState {
  return DANIELL_STEPS[clampDaniellStep(index)]
}
