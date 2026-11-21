/**
 * Model for the Nernst Lab: four galvanic cells whose EMF follows the Nernst equation as the
 * concentrations change (NCERT Class 12 Unit 2, Sec. 2.3 and 2.3.1). Every constant and standard
 * potential comes from ncert-c12-unit2-tables and nernst; this file only arranges them.
 *
 * Each cell is written anode on the left. Its two sliders are log₁₀ of a concentration in mol L⁻¹
 * (the pH slider sets [H⁺] = 10^−pH). Ecell = E°cell − (RT/nF) ln Q, with Q built from the
 * reaction as written, Cu(s)|Cu²⁺ etc. The H₂ in the SHE is at 1 bar, so it drops out of Q.
 */

import { NCERT_STANDARD_POTENTIALS, T_REFERENCE_K } from './ncert-c12-unit2-tables'
import { cellPotential, nernstLog10Slope, reactionQuotient, type QuotientTerm } from './nernst'

export type NernstCellId = 'daniell' | 'cu-ag' | 'zn-she' | 'concentration'

/** A concentration slider: log₁₀ c in mol L⁻¹, or a pH whose [H⁺] = 10^−pH. */
export interface NernstSlider {
  readonly label: string
  readonly kind: 'log' | 'pH'
  readonly min: number
  readonly max: number
  readonly defaultValue: number
}

/** One species in Q: its mhchem body, which slider sets it (0 or 1), and its stoichiometric power. */
export interface NernstTerm {
  readonly ce: string
  readonly slot: 0 | 1
  readonly power: number
}

export interface NernstCell {
  readonly id: NernstCellId
  readonly label: string
  /** Cell notation, mhchem body with anode on the left. */
  readonly notation: string
  /** Reaction as written (anode oxidised, cathode reduced), mhchem body. */
  readonly reaction: string
  readonly n: number
  readonly e0Cell: number
  readonly sliders: readonly [NernstSlider, NernstSlider]
  readonly products: readonly NernstTerm[]
  readonly reactants: readonly NernstTerm[]
}

export const LOG_CONC_MIN = -4
export const LOG_CONC_MAX = 1
export const LOG_Q_SPAN = 10
export const TEMP_MIN_K = 273
export const TEMP_MAX_K = 373

/** E° of a Table 2.1 couple (by its id), in volts. Throws if the id is unknown. */
export function standardPotentialOf(id: string): number {
  const row = NCERT_STANDARD_POTENTIALS.find((r) => r.id === id)
  if (!row) throw new RangeError(`Unknown couple ${id}`)
  return row.e0
}

const LOG_SLIDER = { kind: 'log', min: LOG_CONC_MIN, max: LOG_CONC_MAX } as const

function buildCells(): readonly NernstCell[] {
  const eZn = standardPotentialOf('Zn2+/Zn')
  const eCu = standardPotentialOf('Cu2+/Cu')
  const eAg = standardPotentialOf('Ag+/Ag')
  const eH = standardPotentialOf('H+/H2')
  return [
    {
      id: 'daniell',
      label: 'Daniell cell',
      notation: 'Zn(s) | Zn^{2+}(aq) || Cu^{2+}(aq) | Cu(s)',
      reaction: 'Zn(s) + Cu^{2+}(aq) -> Zn^{2+}(aq) + Cu(s)',
      n: 2,
      e0Cell: eCu - eZn,
      sliders: [
        { ...LOG_SLIDER, label: 'Zn²⁺ concentration (anode side)', defaultValue: 0 },
        { ...LOG_SLIDER, label: 'Cu²⁺ concentration (cathode side)', defaultValue: 0 },
      ],
      products: [{ ce: 'Zn^{2+}', slot: 0, power: 1 }],
      reactants: [{ ce: 'Cu^{2+}', slot: 1, power: 1 }],
    },
    {
      id: 'cu-ag',
      label: 'Copper–silver cell',
      notation: 'Cu(s) | Cu^{2+}(aq) || Ag^{+}(aq) | Ag(s)',
      reaction: 'Cu(s) + 2Ag^{+}(aq) -> Cu^{2+}(aq) + 2Ag(s)',
      n: 2,
      e0Cell: eAg - eCu,
      sliders: [
        { ...LOG_SLIDER, label: 'Cu²⁺ concentration (anode side)', defaultValue: 0 },
        { ...LOG_SLIDER, label: 'Ag⁺ concentration (cathode side)', defaultValue: 0 },
      ],
      products: [{ ce: 'Cu^{2+}', slot: 0, power: 1 }],
      reactants: [{ ce: 'Ag^{+}', slot: 1, power: 2 }],
    },
    {
      id: 'zn-she',
      label: 'Zinc against the hydrogen electrode',
      notation: 'Zn(s) | Zn^{2+}(aq) || H^{+}(aq) | H_2(g) | Pt(s)',
      reaction: 'Zn(s) + 2H^{+}(aq) -> Zn^{2+}(aq) + H_2(g)',
      n: 2,
      e0Cell: eH - eZn,
      sliders: [
        { ...LOG_SLIDER, label: 'Zn²⁺ concentration', defaultValue: 0 },
        { kind: 'pH', min: 0, max: 4, label: 'pH of the acid (sets [H⁺]); H₂ at 1 bar', defaultValue: 0 },
      ],
      products: [{ ce: 'Zn^{2+}', slot: 0, power: 1 }],
      reactants: [{ ce: 'H^{+}', slot: 1, power: 2 }],
    },
    {
      id: 'concentration',
      label: 'Concentration cell',
      notation: 'Cu(s) | Cu^{2+}(aq) || Cu^{2+}(aq) | Cu(s)',
      reaction: 'Cu^{2+}(aq, right) -> Cu^{2+}(aq, left)',
      n: 2,
      e0Cell: 0,
      sliders: [
        { ...LOG_SLIDER, label: 'Cu²⁺ in the anode compartment (left)', defaultValue: -2 },
        { ...LOG_SLIDER, label: 'Cu²⁺ in the cathode compartment (right)', defaultValue: -1 },
      ],
      products: [{ ce: 'Cu^{2+}', slot: 0, power: 1 }],
      reactants: [{ ce: 'Cu^{2+}', slot: 1, power: 1 }],
    },
  ] as const
}

/** The four cells, in the order the Lab offers them. */
export const NERNST_CELLS: readonly NernstCell[] = buildCells()

export function nernstCell(id: NernstCellId): NernstCell {
  const cell = NERNST_CELLS.find((c) => c.id === id)
  if (!cell) throw new RangeError(`Unknown Nernst cell ${id}`)
  return cell
}

/** Concentration (mol L⁻¹) that a slider reading sets: 10^x, or 10^−pH for the pH slider. */
export function slotConcentration(slider: NernstSlider, reading: number): number {
  return slider.kind === 'pH' ? 10 ** -reading : 10 ** reading
}

export interface NernstReading {
  /** Concentrations for slot 0 and slot 1 (mol L⁻¹). */
  readonly concentrations: readonly [number, number]
  readonly q: number
  readonly logQ: number
  /** RT ln10 / (nF), in volts per decade of Q. */
  readonly slope: number
  readonly eCell: number
}

function toQuotientTerms(terms: readonly NernstTerm[], concentrations: readonly [number, number]): QuotientTerm[] {
  return terms.map((t) => ({ value: concentrations[t.slot], power: t.power }))
}

/** Q, log Q, the slope and Ecell for the cell at two slider readings and a temperature. */
export function readNernst(
  cell: NernstCell,
  readings: readonly [number, number],
  tempK: number = T_REFERENCE_K,
): NernstReading {
  const concentrations: [number, number] = [
    slotConcentration(cell.sliders[0], readings[0]),
    slotConcentration(cell.sliders[1], readings[1]),
  ]
  const q = reactionQuotient(
    toQuotientTerms(cell.products, concentrations),
    toQuotientTerms(cell.reactants, concentrations),
  )
  return {
    concentrations,
    q,
    logQ: Math.log10(q),
    slope: nernstLog10Slope(cell.n, tempK),
    eCell: cellPotential(cell.e0Cell, cell.n, q, tempK),
  }
}

/** Ecell on the straight line E = E°cell − slope × log₁₀ Q, for plotting against log Q. */
export function cellPotentialAtLogQ(cell: NernstCell, logQ: number, tempK: number = T_REFERENCE_K): number {
  return cell.e0Cell - nernstLog10Slope(cell.n, tempK) * logQ
}
