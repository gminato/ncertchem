import { NCERT_STANDARD_POTENTIALS, type StandardPotentialRow } from '@/lib/chem/ncert-c12-unit2-tables'
import { assignElectrodes, type Couple } from '@/lib/chem/electrochemical-cell'

export type HalfMaterial = 'zn' | 'cu' | 'ag' | 'pt'
export type HalfTint = 'clear' | 'blue'

/** One half-cell as drawn: a Table 2.1 couple plus its electrode and solution. */
export interface HalfSpec {
  readonly couple: string
  readonly material: HalfMaterial
  readonly ion: string
  readonly charge: string
  readonly tint: HalfTint
  readonly solution: string
}

export const SHE_HALF: HalfSpec = {
  couple: 'H+/H2',
  material: 'pt',
  ion: 'H',
  charge: '+',
  tint: 'clear',
  solution: '1 M H⁺(aq)',
}
export const CU_HALF: HalfSpec = {
  couple: 'Cu2+/Cu',
  material: 'cu',
  ion: 'Cu',
  charge: '2+',
  tint: 'blue',
  solution: '1 M Cu²⁺(aq)',
}
export const ZN_HALF: HalfSpec = {
  couple: 'Zn2+/Zn',
  material: 'zn',
  ion: 'Zn',
  charge: '2+',
  tint: 'clear',
  solution: '1 M Zn²⁺(aq)',
}
export const AG_HALF: HalfSpec = {
  couple: 'Ag+/Ag',
  material: 'ag',
  ion: 'Ag',
  charge: '+',
  tint: 'clear',
  solution: '1 M Ag⁺(aq)',
}

export function standardRow(id: string): StandardPotentialRow {
  const row = NCERT_STANDARD_POTENTIALS.find((r) => r.id === id)
  if (!row) throw new Error(`Table 2.1 has no row ${id}`)
  return row
}

function couple(h: HalfSpec): Couple {
  return { name: h.couple, e0: standardRow(h.couple).e0 }
}

export interface PairScene {
  /** Left electrode in the drawing (always the anode, by the anode-left convention). */
  readonly anode: HalfSpec
  /** Right electrode in the drawing (always the cathode). */
  readonly cathode: HalfSpec
  readonly eAnode: number
  readonly eCathode: number
  readonly eCell: number
}

/** Pairs two half-cells with the lib's electrode assignment (higher E° is reduced). */
export function pairScene(a: HalfSpec, b: HalfSpec): PairScene {
  const r = assignElectrodes(couple(a), couple(b))
  const anode = r.anode.name === a.couple ? a : b
  const cathode = anode === a ? b : a
  return { anode, cathode, eAnode: r.anode.e0, eCathode: r.cathode.e0, eCell: r.eCell }
}

/** Signed volts with a real minus sign, bracketed when negative. */
export function signedVolts(x: number): string {
  const body = Math.abs(x).toFixed(2)
  return x < 0 ? `(−${body})` : body
}

/** Volts with a true minus sign and no brackets, for equations written out in full. */
export function plainVolts(x: number): string {
  return `${x < 0 ? '−' : ''}${Math.abs(x).toFixed(2)}`
}

export type SheScene =
  | { readonly kind: 'single'; readonly half: HalfSpec }
  | { readonly kind: 'she' }
  | { readonly kind: 'pair'; readonly pair: PairScene }
  | { readonly kind: 'ladder'; readonly highlight: readonly string[] }

/** Table 2.1 couples shown on the ladder, strongest oxidising agent first. */
export const LADDER_IDS = [
  'F2/F-',
  'Ag+/Ag',
  'Cu2+/Cu',
  'H+/H2',
  'Pb2+/Pb',
  'Zn2+/Zn',
  'Mg2+/Mg',
  'Li+/Li',
] as const

export interface SheStepState {
  readonly index: number
  readonly id: string
  readonly title: string
  readonly scene: SheScene
  /** Meter reading in volts, or null when no meter is drawn. */
  readonly meter: number | null
  /** Lines under the drawing (joined with \n), with the numbers the Step uses. */
  readonly readout: string
  readonly ariaLabel: string
}

function buildSteps(): readonly SheStepState[] {
  const cuVsShe = pairScene(SHE_HALF, CU_HALF)
  const znVsShe = pairScene(ZN_HALF, SHE_HALF)
  const agZn = pairScene(AG_HALF, ZN_HALF)
  const eZn = standardRow('Zn2+/Zn').e0
  const eSHE = standardRow('H+/H2').e0
  const eCu = standardRow('Cu2+/Cu').e0
  const eAg = standardRow('Ag+/Ag').e0

  return [
    {
      index: 0,
      id: 'half-cell',
      title: 'One half-cell at its interface',
      scene: { kind: 'single', half: CU_HALF },
      meter: null,
      readout: 'Cu²⁺ ⇄ Cu at the interface: a potential exists, but no meter reads it alone',
      ariaLabel:
        'A copper electrode dipped in blue copper(II) sulphate solution. At the metal and solution interface a charge separation builds a potential, but a single half-cell cannot be measured on its own.',
    },
    {
      index: 1,
      id: 'she',
      title: 'Building the reference: the SHE',
      scene: { kind: 'she' },
      meter: null,
      readout: 'Pt foil, H₂ at 1 bar, 1 M H⁺(aq): E° = 0 V at every temperature',
      ariaLabel:
        'Standard hydrogen electrode: a platinum foil coated with platinum black in 1 molar hydrogen ion solution, with hydrogen gas at 1 bar bubbling over it.',
    },
    {
      index: 2,
      id: 'cu-vs-she',
      title: 'SHE against Cu²⁺/Cu',
      scene: { kind: 'pair', pair: cuVsShe },
      meter: cuVsShe.eCell,
      readout: `E°cell = ${signedVolts(cuVsShe.eCathode)} − ${signedVolts(cuVsShe.eAnode)} = ${signedVolts(cuVsShe.eCell)} V`,
      ariaLabel:
        'SHE on the left as the anode, copper on the right as the cathode. The meter reads plus 0.34 volts and electrons flow from the hydrogen electrode to the copper electrode.',
    },
    {
      index: 3,
      id: 'zn-vs-she',
      title: 'SHE against Zn²⁺/Zn',
      scene: { kind: 'pair', pair: znVsShe },
      meter: znVsShe.eCell,
      readout: [
        `E°cell = E°(SHE) − E°(Zn²⁺/Zn) = ${plainVolts(znVsShe.eCell)} V`,
        `so E°(Zn²⁺/Zn) = ${plainVolts(eSHE)} − ${plainVolts(znVsShe.eCell)} = ${plainVolts(eZn)} V`,
      ].join('\n'),
      ariaLabel:
        'Zinc on the left as the anode, standard hydrogen electrode on the right as the cathode. The meter reads 0.76 volts with zinc at the negative terminal, so the standard electrode potential of zinc is minus 0.76 volts.',
    },
    {
      index: 4,
      id: 'ladder',
      title: 'The electrochemical series',
      scene: { kind: 'ladder', highlight: ['Cu2+/Cu', 'H+/H2', 'Zn2+/Zn'] },
      meter: null,
      readout: 'Higher E° means a stronger oxidising agent; lower E° means a stronger reducing agent',
      ariaLabel:
        'Ladder of standard electrode potentials from F2 at the top (+2.87 volts) down to Li+ at the bottom (minus 3.05 volts), with Cu2+/Cu, H+/H2 and Zn2+/Zn highlighted.',
    },
    {
      index: 5,
      id: 'pair-any-two',
      title: 'Pairing any two couples',
      scene: { kind: 'pair', pair: agZn },
      meter: agZn.eCell,
      readout: `E°cell = E°(Ag⁺/Ag) − E°(Zn²⁺/Zn) = ${signedVolts(eAg)} − ${signedVolts(eZn)} = ${agZn.eCell.toFixed(2)} V`,
      ariaLabel:
        'Zinc on the left as the anode and silver on the right as the cathode. The meter reads 1.56 volts. Cell notation: Zn(s) | Zn²⁺(aq) || Ag⁺(aq) | Ag(s).',
    },
  ]
}

export const SHE_STEPS: readonly SheStepState[] = buildSteps()

export function clampSheStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(SHE_STEPS.length - 1, Math.max(0, Math.round(step)))
}

export function getSheStep(step: number): SheStepState {
  return SHE_STEPS[clampSheStep(step)]
}
