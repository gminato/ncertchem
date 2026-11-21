import { NCERT_STANDARD_POTENTIALS } from './ncert-c12-unit2-tables'
import type { ElectrolysisCaseId } from './electrolysis'

/**
 * Product predictor for the Section 2.5.1 simulation. Every E° comes from Table 2.1
 * (NCERT_STANDARD_POTENTIALS), except the persulfate couple, which NCERT quotes in the
 * Sec. 2.5.1 text (eq. 2.39) and which Table 2.1 does not list.
 */

/** E° of 2SO₄²⁻ → S₂O₈²⁻ + 2e⁻ as NCERT quotes it in Sec. 2.5.1 (not a Table 2.1 row). */
export const E0_PERSULFATE = 1.96

export type Electrolyte = 'molten-nacl' | 'aqueous-nacl' | 'h2so4' | 'cuso4' | 'agno3' | 'kbr'
export type SulphuricStrength = 'dilute' | 'concentrated'
export type ElectrodeChoice = 'inert' | 'reactive'

/** The eight NCERT-and-Unit cases in electrolysis.ts, plus aqueous KBr with Pt (used in a Check). */
export type PredictorCaseId = ElectrolysisCaseId | 'aqueous-KBr-Pt-electrodes'

export interface Candidate {
  readonly key: string
  /** Unicode couple label, e.g. 'Na⁺/Na'. */
  readonly couple: string
  /** Half-reaction as shown to the learner (Unicode). */
  readonly half: string
  readonly e0: number
  /** Species this electrode produces, as shown in the drawing. */
  readonly product: string
  /** True when this candidate is the anode metal itself, which dissolves. */
  readonly dissolves: boolean
  /** True for O₂ at the anode, the candidate that an overpotential holds back. */
  readonly isOxygen: boolean
  readonly selected: boolean
}

export type AnodeRule = 'only-candidate' | 'lowest-E°' | 'O₂-overpotential' | 'concentrated-persulfate'

export interface Prediction {
  readonly id: PredictorCaseId
  readonly description: string
  readonly cathode: readonly Candidate[]
  readonly anode: readonly Candidate[]
  readonly anodeRule: AnodeRule
  readonly reason: 'only-ions-present' | 'lower-E°' | 'overpotential-of-O2' | 'active-anode-dissolves' | 'concentration-favours-persulfate'
}

interface RawCandidate {
  readonly key: string
  readonly couple: string
  readonly half: string
  readonly e0: number
  readonly product: string
  readonly dissolves?: boolean
  readonly isOxygen?: boolean
}

interface RawCase {
  readonly id: PredictorCaseId
  readonly description: string
  readonly cathode: readonly RawCandidate[]
  readonly anode: readonly RawCandidate[]
  readonly anodeRule: AnodeRule
}

/** Look up a Table 2.1 row by id. Throws if the id is missing, so a typo fails loudly. */
function table21(id: string): number {
  const row = NCERT_STANDARD_POTENTIALS.find((r) => r.id === id)
  if (!row) throw new RangeError(`No Table 2.1 row: ${id}`)
  return row.e0
}

const WATER_REDUCTION: RawCandidate = {
  key: 'water',
  couple: 'H₂O/H₂',
  half: '2H₂O + 2e⁻ → H₂ + 2OH⁻',
  e0: table21('H2O/H2'),
  product: 'H₂',
}

const WATER_OXIDATION: RawCandidate = {
  key: 'oxygen',
  couple: 'O₂/H₂O',
  half: '2H₂O → O₂ + 4H⁺ + 4e⁻',
  e0: table21('O2/H2O'),
  product: 'O₂',
  isOxygen: true,
}

const PT_CATHODE_COPPER: RawCandidate = {
  key: 'copper',
  couple: 'Cu²⁺/Cu',
  half: 'Cu²⁺ + 2e⁻ → Cu',
  e0: table21('Cu2+/Cu'),
  product: 'Cu',
}

const PT_CATHODE_SILVER: RawCandidate = {
  key: 'silver',
  couple: 'Ag⁺/Ag',
  half: 'Ag⁺ + e⁻ → Ag',
  e0: table21('Ag+/Ag'),
  product: 'Ag',
}

const HYDROGEN_CATHODE: RawCandidate = {
  key: 'hydrogen',
  couple: 'H⁺/H₂',
  half: '2H⁺ + 2e⁻ → H₂',
  e0: table21('H+/H2'),
  product: 'H₂',
}

const PERSULFATE: RawCandidate = {
  key: 'persulfate',
  couple: 'SO₄²⁻/S₂O₈²⁻',
  half: '2SO₄²⁻ → S₂O₈²⁻ + 2e⁻',
  e0: E0_PERSULFATE,
  product: 'S₂O₈²⁻',
}

const RAW_CASES: readonly RawCase[] = [
  {
    id: 'molten-NaCl',
    description: 'Molten NaCl with inert electrodes',
    cathode: [{ key: 'sodium', couple: 'Na⁺/Na', half: 'Na⁺ + e⁻ → Na', e0: table21('Na+/Na'), product: 'Na' }],
    anode: [{ key: 'chlorine', couple: 'Cl₂/Cl⁻', half: '2Cl⁻ → Cl₂ + 2e⁻', e0: table21('Cl2/Cl-'), product: 'Cl₂' }],
    anodeRule: 'only-candidate',
  },
  {
    id: 'aqueous-NaCl-inert',
    description: 'Aqueous NaCl with inert electrodes',
    cathode: [
      { key: 'sodium', couple: 'Na⁺/Na', half: 'Na⁺ + e⁻ → Na', e0: table21('Na+/Na'), product: 'Na' },
      WATER_REDUCTION,
    ],
    anode: [
      { key: 'chlorine', couple: 'Cl₂/Cl⁻', half: '2Cl⁻ → Cl₂ + 2e⁻', e0: table21('Cl2/Cl-'), product: 'Cl₂' },
      WATER_OXIDATION,
    ],
    anodeRule: 'O₂-overpotential',
  },
  {
    id: 'dilute-H2SO4-inert',
    description: 'Dilute H₂SO₄ with inert (Pt) electrodes',
    cathode: [HYDROGEN_CATHODE],
    anode: [WATER_OXIDATION, PERSULFATE],
    anodeRule: 'lowest-E°',
  },
  {
    id: 'concentrated-H2SO4-inert',
    description: 'Concentrated H₂SO₄ with inert (Pt) electrodes',
    cathode: [HYDROGEN_CATHODE],
    anode: [WATER_OXIDATION, PERSULFATE],
    anodeRule: 'concentrated-persulfate',
  },
  {
    id: 'aqueous-CuSO4-Pt-electrodes',
    description: 'Aqueous CuSO₄ with platinum electrodes',
    cathode: [PT_CATHODE_COPPER, WATER_REDUCTION],
    anode: [WATER_OXIDATION],
    anodeRule: 'only-candidate',
  },
  {
    id: 'aqueous-CuSO4-Cu-electrodes',
    description: 'Aqueous CuSO₄ with copper electrodes',
    cathode: [PT_CATHODE_COPPER, WATER_REDUCTION],
    anode: [
      { key: 'copper-anode', couple: 'Cu²⁺/Cu', half: 'Cu → Cu²⁺ + 2e⁻', e0: table21('Cu2+/Cu'), product: 'Cu²⁺', dissolves: true },
      WATER_OXIDATION,
    ],
    anodeRule: 'lowest-E°',
  },
  {
    id: 'aqueous-AgNO3-Pt-electrodes',
    description: 'Aqueous AgNO₃ with platinum electrodes',
    cathode: [PT_CATHODE_SILVER, WATER_REDUCTION],
    anode: [WATER_OXIDATION],
    anodeRule: 'only-candidate',
  },
  {
    id: 'aqueous-AgNO3-Ag-electrodes',
    description: 'Aqueous AgNO₃ with silver electrodes',
    cathode: [PT_CATHODE_SILVER, WATER_REDUCTION],
    anode: [
      { key: 'silver-anode', couple: 'Ag⁺/Ag', half: 'Ag → Ag⁺ + e⁻', e0: table21('Ag+/Ag'), product: 'Ag⁺', dissolves: true },
      WATER_OXIDATION,
    ],
    anodeRule: 'lowest-E°',
  },
  {
    id: 'aqueous-KBr-Pt-electrodes',
    description: 'Aqueous KBr with platinum electrodes',
    cathode: [
      { key: 'potassium', couple: 'K⁺/K', half: 'K⁺ + e⁻ → K', e0: table21('K+/K'), product: 'K' },
      WATER_REDUCTION,
    ],
    anode: [
      { key: 'bromine', couple: 'Br₂/Br⁻', half: '2Br⁻ → Br₂ + 2e⁻', e0: table21('Br2/Br-'), product: 'Br₂' },
      WATER_OXIDATION,
    ],
    anodeRule: 'lowest-E°',
  },
]

/** Pick the winner: cathode takes the highest E° (reduced first); anode per its rule. */
function chooseAnode(raw: RawCase): RawCandidate {
  const { anode, anodeRule } = raw
  if (anodeRule === 'only-candidate') return anode[0]
  if (anodeRule === 'concentrated-persulfate') {
    const p = anode.find((c) => c.key === 'persulfate')
    if (!p) throw new RangeError(`${raw.id} has no persulfate candidate`)
    return p
  }
  if (anodeRule === 'O₂-overpotential') {
    // Oxygen would win on E°, but its overpotential holds it back, so the next candidate forms.
    const rest = anode.filter((c) => !c.isOxygen)
    return rest.reduce((a, b) => (b.e0 < a.e0 ? b : a))
  }
  return anode.reduce((a, b) => (b.e0 < a.e0 ? b : a))
}

function reasonFor(raw: RawCase, winner: RawCandidate): Prediction['reason'] {
  if (raw.id === 'molten-NaCl') return 'only-ions-present'
  if (raw.anodeRule === 'O₂-overpotential') return 'overpotential-of-O2'
  if (raw.anodeRule === 'concentrated-persulfate') return 'concentration-favours-persulfate'
  if (winner.dissolves) return 'active-anode-dissolves'
  return 'lower-E°'
}

/** Predict the products of one case: the winners, the full competition, and the reason. */
export function predictElectrolysis(id: PredictorCaseId): Prediction {
  const raw = RAW_CASES.find((c) => c.id === id)
  if (!raw) throw new RangeError(`Unknown predictor case: ${id}`)
  const cathodeWinner = raw.cathode.reduce((a, b) => (b.e0 > a.e0 ? b : a))
  const anodeWinner = chooseAnode(raw)
  const mark = (list: readonly RawCandidate[], winner: RawCandidate, sort: 1 | -1): Candidate[] =>
    [...list]
      .sort((a, b) => sort * (b.e0 - a.e0))
      .map((c) => ({ ...c, dissolves: !!c.dissolves, isOxygen: !!c.isOxygen, selected: c.key === winner.key }))
  return {
    id,
    description: raw.description,
    cathode: mark(raw.cathode, cathodeWinner, 1),
    anode: mark(raw.anode, anodeWinner, -1),
    anodeRule: raw.anodeRule,
    reason: reasonFor(raw, anodeWinner),
  }
}

/** Map the simulation's three choices to one case. */
export function resolveCase(
  electrolyte: Electrolyte,
  strength: SulphuricStrength,
  electrodes: ElectrodeChoice,
): PredictorCaseId {
  switch (electrolyte) {
    case 'molten-nacl':
      return 'molten-NaCl'
    case 'aqueous-nacl':
      return 'aqueous-NaCl-inert'
    case 'h2so4':
      return strength === 'dilute' ? 'dilute-H2SO4-inert' : 'concentrated-H2SO4-inert'
    case 'cuso4':
      return electrodes === 'inert' ? 'aqueous-CuSO4-Pt-electrodes' : 'aqueous-CuSO4-Cu-electrodes'
    case 'agno3':
      return electrodes === 'inert' ? 'aqueous-AgNO3-Pt-electrodes' : 'aqueous-AgNO3-Ag-electrodes'
    case 'kbr':
      return 'aqueous-KBr-Pt-electrodes'
  }
}
