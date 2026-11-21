import { NCERT_STANDARD_POTENTIALS } from '@/lib/chem/ncert-c12-unit2-tables'

/** E° of a Table 2.1 couple, read from the lib and formatted with a true minus sign. */
function e0(id: string): string {
  const row = NCERT_STANDARD_POTENTIALS.find((r) => r.id === id)
  if (!row) throw new Error(`Missing standard potential for ${id}`)
  return `${row.e0 < 0 ? '−' : ''}${Math.abs(row.e0).toFixed(2)} V`
}

/** 2SO₄²⁻ → S₂O₈²⁻ + 2e⁻ is not a Table 2.1 row; NCERT quotes it in its text (see electrolysis.ts). */
const E0_PERSULPHATE = '1.96 V'

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

const CATHODE_WATER_CARD: RedoxCard = {
  title: 'Cathode, reduction',
  rows: [
    { label: 'Na⁺ / Na', value: e0('Na+/Na'), tone: 'dim' },
    { label: 'H₂O / H₂', value: e0('H2O/H2'), tone: 'win', note: 'less negative, wins' },
    { label: 'H⁺ / H₂', value: e0('H+/H2'), tone: 'idle' },
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
    subtitle: 'The less negative E° wins the reduction, so water is reduced and sodium never deposits',
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
      'Electrolytic cell with aqueous sodium chloride. A card at the cathode compares Na⁺ at −2.71 V with H₂O at −0.83 V; the water card is highlighted as the winner. Hydrogen bubbles rise from the cathode and a faint alkaline tint marks hydroxide ions near it.',
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
        { label: 'H₂O / O₂', value: e0('O2/H2O'), tone: 'dim', note: 'O₂ overpotential slows it' },
        { label: 'Cl⁻ / Cl₂', value: e0('Cl2/Cl-'), tone: 'win', note: 'chloride is oxidised' },
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
      'Aqueous sodium chloride cell with the anode card comparing Cl⁻ at 1.36 V with H₂O at 1.23 V. The water card is dimmed by an overpotential tag, and chlorine bubbles stream from the left anode. No oxygen bubbles are drawn.',
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
    subtitle: 'Hydrogen always forms at the cathode; the anode product depends on the acid strength',
    electrolyte: 'sulphuric-acid',
    beakerLabel: 'concentrated H₂SO₄(aq)',
    anodeCard: {
      title: 'Anode, oxidation',
      rows: [
        { label: 'H₂O / O₂ (dilute)', value: e0('O2/H2O'), tone: 'dim', note: 'O₂ bubbles, dilute acid only' },
        { label: 'SO₄²⁻ / S₂O₈²⁻', value: E0_PERSULPHATE, tone: 'win', note: 'concentrated acid: bubbles stop' },
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
      'Electrolytic cell with concentrated sulphuric acid. Hydrogen bubbles rise from the cathode. At the anode no gas forms; a peroxydisulphate ion S₂O₈²⁻ appears, and the anode card shows the dilute-acid oxygen route at 1.23 V as dimmed.',
  },
]

export function clampElectrolysisStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(ELECTROLYSIS_STEPS.length - 1, Math.max(0, Math.round(step)))
}

export function getElectrolysisStepState(step: number): ElectrolysisStepState {
  return ELECTROLYSIS_STEPS[clampElectrolysisStep(step)]
}
