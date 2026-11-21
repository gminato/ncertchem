import { E0_PERSULFATE } from '@/lib/chem/electrolysis-predictor'
import { NCERT_STANDARD_POTENTIALS } from '@/lib/chem/ncert-c12-unit2-tables'

/** Formats a potential in volts with a true minus sign. */
function volts(v: number): string {
  return `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(2)} V`
}

/** E° of a Table 2.1 couple, read from the lib. */
function e0(id: string): string {
  const row = NCERT_STANDARD_POTENTIALS.find((r) => r.id === id)
  if (!row) throw new Error(`Missing standard potential for ${id}`)
  return volts(row.e0)
}

const NA_E0 = e0('Na+/Na')
const H_E0 = e0('H+/H2')
const CL_E0 = e0('Cl2/Cl-')
const O2_E0 = e0('O2/H2O')
/** S₂O₈²⁻ formation is not a Table 2.1 row; the predictor lib holds NCERT's quoted value. */
const PERSULPHATE_E0 = volts(E0_PERSULFATE)

export type ElectrolysisStepId =
  | 'molten-salt'
  | 'water-at-cathode'
  | 'chloride-at-anode'
  | 'net-result'
  | 'acid-strength'

export type ElectrolyteKind = 'molten-nacl' | 'aqueous-nacl' | 'sulphuric-acid'
export type RowTone = 'win' | 'dim' | 'idle'
/** Where the drawn alkalinity shows: none, around the cathode only, or through the whole solution. */
export type AlkalineMode = 'none' | 'cathode' | 'bulk'
/** Which ions float in the solution for this Step. */
export type IonSet = 'melt' | 'aqueous' | 'persulphate'

export interface CardRow {
  readonly label: string
  readonly value: string
  readonly tone: RowTone
  readonly note?: string
}

export interface RedoxCard {
  readonly title: string
  readonly rows: readonly CardRow[]
}

export interface ElectrolysisStepState {
  readonly index: number
  readonly id: ElectrolysisStepId
  readonly title: string
  readonly subtitle: string
  readonly electrolyte: ElectrolyteKind
  readonly beakerLabel: string
  readonly anodeCard: RedoxCard | null
  readonly cathodeCard: RedoxCard | null
  /** Gas formula drawn as bubbles at the anode, or null when no gas forms there. */
  readonly anodeGas: string | null
  /** Gas formula drawn as bubbles at the cathode, or null when no gas forms there. */
  readonly cathodeGas: string | null
  readonly sodiumBeads: boolean
  readonly alkalineMode: AlkalineMode
  readonly ionSet: IonSet
  /** Balanced overall equation shown under the drawing, or null. Unicode subscripts. */
  readonly equation: string | null
  readonly ariaLabel: string
}

/** NCERT p.23: H⁺/H₂ (0.00 V) beats Na⁺/Na (−2.71 V); the H⁺ comes from water. */
const CATHODE_WATER_CARD: RedoxCard = {
  title: 'Cathode, reduction',
  rows: [
    { label: 'Na⁺ / Na', value: NA_E0, tone: 'dim' },
    { label: 'H⁺ / H₂', value: H_E0, tone: 'win', note: 'higher E°: wins' },
  ],
}

export const ELECTROLYSIS_STEPS: readonly ElectrolysisStepState[] = [
  {
    index: 0,
    id: 'molten-salt',
    title: 'Molten salt, no competition',
    subtitle: 'Only Na⁺ and Cl⁻ are present, so each ion meets one electrode reaction',
    electrolyte: 'molten-nacl',
    beakerLabel: 'molten NaCl',
    anodeCard: null,
    cathodeCard: null,
    anodeGas: 'Cl₂',
    cathodeGas: null,
    sodiumBeads: true,
    alkalineMode: 'none',
    ionSet: 'melt',
    equation: null,
    ariaLabel:
      'Electrolytic cell with molten sodium chloride between two graphite electrodes. The positive terminal of the source is wired to the left anode and the negative terminal to the right cathode. Sodium ions drift to the cathode and form liquid sodium beads. Chloride ions drift to the anode and leave as chlorine bubbles.',
  },
  {
    index: 1,
    id: 'water-at-cathode',
    title: 'Water competes at the cathode',
    subtitle: `The higher E° wins, so H⁺ (${H_E0}) beats Na⁺ (${NA_E0}). The H⁺ comes from water: H₂O + e⁻ → ½H₂ + OH⁻`,
    electrolyte: 'aqueous-nacl',
    beakerLabel: 'NaCl(aq)',
    anodeCard: null,
    cathodeCard: CATHODE_WATER_CARD,
    anodeGas: null,
    cathodeGas: 'H₂',
    sodiumBeads: false,
    alkalineMode: 'cathode',
    ionSet: 'aqueous',
    equation: null,
    ariaLabel:
      `Electrolytic cell with aqueous sodium chloride. A card at the cathode compares Na⁺ at ${NA_E0} with H⁺ at ${H_E0}; the H⁺ card is highlighted as the winner, because the H⁺ comes from water and hydroxide is left behind. Hydrogen bubbles rise from the cathode and a faint alkaline tint marks hydroxide ions near it.`,
  },
  {
    index: 2,
    id: 'chloride-at-anode',
    title: 'Chloride or water at the anode',
    subtitle: 'O₂ has the lower E°, but its overpotential lets Cl⁻ be oxidised instead',
    electrolyte: 'aqueous-nacl',
    beakerLabel: 'NaCl(aq)',
    anodeCard: {
      title: 'Anode, oxidation',
      rows: [
        { label: 'H₂O / O₂', value: O2_E0, tone: 'dim', note: 'O₂ overpotential slows it' },
        { label: 'Cl⁻ / Cl₂', value: CL_E0, tone: 'win', note: 'chloride is oxidised' },
      ],
    },
    cathodeCard: CATHODE_WATER_CARD,
    anodeGas: 'Cl₂',
    cathodeGas: 'H₂',
    sodiumBeads: false,
    alkalineMode: 'cathode',
    ionSet: 'aqueous',
    equation: null,
    ariaLabel:
      `Aqueous sodium chloride cell with the anode card comparing Cl⁻ at ${CL_E0} with H₂O at ${O2_E0}. The water card is dimmed by an overpotential tag, and chlorine bubbles stream from the left anode. No oxygen bubbles are drawn.`,
  },
  {
    index: 3,
    id: 'net-result',
    title: 'The net result',
    subtitle: 'Both electrode reactions run together, so the solution gains NaOH',
    electrolyte: 'aqueous-nacl',
    beakerLabel: 'NaCl(aq) → NaOH(aq)',
    anodeCard: null,
    cathodeCard: null,
    anodeGas: 'Cl₂',
    cathodeGas: 'H₂',
    sodiumBeads: false,
    alkalineMode: 'bulk',
    ionSet: 'aqueous',
    equation: '2NaCl + 2H₂O → 2NaOH + H₂ + Cl₂',
    ariaLabel:
      'Electrolytic cell with aqueous sodium chloride at its net stage. Chlorine leaves the left anode, hydrogen leaves the right cathode, and the whole solution is shaded to show sodium hydroxide building up. The balanced equation 2NaCl + 2H₂O → 2NaOH + H₂ + Cl₂ is shown below.',
  },
  {
    index: 4,
    id: 'acid-strength',
    title: 'Dilute versus concentrated sulphuric acid',
    subtitle: 'Hydrogen always forms at the cathode; at the anode the product depends on the acid strength',
    electrolyte: 'sulphuric-acid',
    beakerLabel: 'concentrated H₂SO₄(aq)',
    anodeCard: {
      title: 'Anode, oxidation',
      rows: [
        { label: 'H₂O / O₂ (dilute)', value: O2_E0, tone: 'dim', note: 'O₂ bubbles, dilute acid only' },
        { label: 'SO₄²⁻ / S₂O₈²⁻', value: PERSULPHATE_E0, tone: 'win', note: 'preferred at high conc.' },
      ],
    },
    cathodeCard: null,
    anodeGas: null,
    cathodeGas: 'H₂',
    sodiumBeads: false,
    alkalineMode: 'none',
    ionSet: 'persulphate',
    equation: null,
    ariaLabel:
      `Electrolytic cell with concentrated sulphuric acid. Hydrogen bubbles rise from the cathode. At the anode no gas forms; a peroxydisulphate ion S₂O₈²⁻ appears, and the anode card shows the dilute-acid oxygen route at ${O2_E0} as dimmed.`,
  },
]

export function clampElectrolysisStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(ELECTROLYSIS_STEPS.length - 1, Math.max(0, Math.round(step)))
}

export function getElectrolysisStepState(step: number): ElectrolysisStepState {
  return ELECTROLYSIS_STEPS[clampElectrolysisStep(step)]
}
