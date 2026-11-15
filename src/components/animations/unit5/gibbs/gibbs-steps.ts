import {
  NCERT_TABLE_5_1_FUSION_VAPORISATION,
  NCERT_TABLE_5_4_SPONTANEITY,
} from '@/lib/chem/ncert-unit5-tables'
import { reactionEnthalpyFromTable, reactionEntropyFromStandard } from '@/lib/chem/gibbs-presets'
import {
  entropyOfPhaseChange,
  entropyOfSurroundings,
  standardGibbsFromK,
  totalEntropyChange,
} from '@/lib/chem/spontaneity'
import { gibbsCase, type GibbsCase } from '@/components/thermo/geometry'

const H2O = NCERT_TABLE_5_1_FUSION_VAPORISATION.rows.find((r) => r.substance === 'H2O')!

/** A signed number with the U+2212 minus, and no sign for zero. */
export function signed(value: number, digits = 1): string {
  const text = Math.abs(value).toFixed(digits)
  if (Number(text) === 0) return text
  return value < 0 ? `−${text}` : `+${text}`
}

// ---------------------------------------------------------------------------
// Entropy of the three phases (Section 5.6(b))
// ---------------------------------------------------------------------------

export interface PhaseStep {
  /** 0 solid, 1 liquid, 2 gas. */
  state: 0 | 1 | 2
  /** Temperature of the transition into this state, K (or null for the solid). */
  transitionK: number | null
  /** ΔS_sys of the transition, J K⁻¹ mol⁻¹. */
  deltaSSys: number | null
  /** ΔS_surr, J K⁻¹ mol⁻¹. */
  deltaSSurr: number | null
  /** ΔS_total, J K⁻¹ mol⁻¹. */
  deltaSTotal: number | null
}

/** The three Steps: the solid, the melting at 273.15 K into the liquid, and the boiling at 373.15 K into the gas. */
export function phaseSteps(): PhaseStep[] {
  const fus = H2O.fusionKJ
  const vap = H2O.vaporisationKJ
  const tFus = H2O.meltingPointK
  const tVap = H2O.boilingPointK
  const dSFus = entropyOfPhaseChange(fus, tFus)
  const dSVap = entropyOfPhaseChange(vap, tVap)
  return [
    { state: 0, transitionK: null, deltaSSys: null, deltaSSurr: null, deltaSTotal: null },
    {
      state: 1,
      transitionK: tFus,
      deltaSSys: dSFus,
      deltaSSurr: entropyOfSurroundings(fus, tFus),
      deltaSTotal: totalEntropyChange(dSFus, fus, tFus),
    },
    {
      state: 2,
      transitionK: tVap,
      deltaSSys: dSVap,
      deltaSSurr: entropyOfSurroundings(vap, tVap),
      deltaSTotal: totalEntropyChange(dSVap, vap, tVap),
    },
  ]
}

// ---------------------------------------------------------------------------
// The four sign cases on GibbsPlot (Section 5.6(c), Table 5.4)
// ---------------------------------------------------------------------------

export interface SignCaseStep {
  dH: number
  dS: number
  kind: GibbsCase
  /** Short label for the case. */
  title: string
  /** Whether the numbers are NCERT-derived or illustrative. */
  note: string
  /** Table 5.4 row description for this case. */
  table: string
}

/** Four cases in the order the Steps show them. */
export function signCaseSteps(): SignCaseStep[] {
  const nh3H = reactionEnthalpyFromTable({
    label: 'NH3',
    reactants: [
      { species: 'N2(g)', coefficient: 1 },
      { species: 'H2(g)', coefficient: 3 },
    ],
    products: [{ species: 'NH3(g)', coefficient: 2 }],
  })
  const caco3H = reactionEnthalpyFromTable({
    label: 'CaCO3',
    reactants: [{ species: 'CaCO3(s)', coefficient: 1 }],
    products: [
      { species: 'CaO(s)', coefficient: 1 },
      { species: 'CO2(g)', coefficient: 1 },
    ],
  })
  const nh3S = reactionEntropyFromStandard({
    label: "NH3",
    reactants: [
      { species: "N2(g)", coefficient: 1 },
      { species: "H2(g)", coefficient: 3 },
    ],
    products: [{ species: "NH3(g)", coefficient: 2 }],
  })
  const caco3S = reactionEntropyFromStandard({
    label: "CaCO3",
    reactants: [{ species: "CaCO3(s)", coefficient: 1 }],
    products: [
      { species: "CaO(s)", coefficient: 1 },
      { species: "CO2(g)", coefficient: 1 },
    ],
  })
  const rows = NCERT_TABLE_5_4_SPONTANEITY.rows
  const tableFor = (dh: '+' | '-', ds: '+' | '-', dg: '-' | '+', t: 'all' | 'low' | 'high') =>
    rows.find((r) => r.deltaH === dh && r.deltaS === ds && r.deltaG === dg && r.temperature === t)?.description ?? ''
  return [
    {
      dH: -100,
      dS: 150,
      kind: gibbsCase(-100, 150),
      title: 'ΔH < 0, ΔS > 0',
      note: 'Illustrative numbers',
      table: tableFor('-', '+', '-', 'all'),
    },
    {
      dH: nh3H,
      dS: nh3S,
      kind: gibbsCase(nh3H, nh3S),
      title: 'ΔH < 0, ΔS < 0: NH₃ synthesis',
      note: 'Table 5.2 and standard entropies',
      table: tableFor('-', '-', '-', 'low'),
    },
    {
      dH: caco3H,
      dS: caco3S,
      kind: gibbsCase(caco3H, caco3S),
      title: 'ΔH > 0, ΔS > 0: CaCO₃ decomposition',
      note: 'Table 5.2 and standard entropies',
      table: tableFor('+', '+', '-', 'high'),
    },
    {
      dH: 40,
      dS: -100,
      kind: gibbsCase(40, -100),
      title: 'ΔH > 0, ΔS < 0',
      note: 'Illustrative numbers',
      table: tableFor('+', '-', '+', 'all'),
    },
  ]
}

// ---------------------------------------------------------------------------
// ΔG° and K on a log scale (Section 5.7)
// ---------------------------------------------------------------------------

export const K_LADDER_T = 298

export interface KLadderStep {
  /** log₁₀ K for the Step. */
  exponent: number
  title: string
  body: string
}

export function kLadderSteps(): KLadderStep[] {
  return [
    { exponent: 0, title: 'K = 1', body: 'Forward and reverse rates balance under standard conditions.' },
    { exponent: 5, title: 'K = 10⁵', body: 'Products are favoured by about a hundred thousand to one.' },
    { exponent: -5, title: 'K = 10⁻⁵', body: 'Reactants are favoured by the same factor.' },
    { exponent: 10, title: 'K = 10¹⁰', body: 'The reaction runs almost to completion.' },
    { exponent: -10, title: 'K = 10⁻¹⁰', body: 'Almost no product forms at equilibrium.' },
  ]
}

/** ΔG° in kJ mol⁻¹ for a log₁₀K value at K_LADDER_T, from the library. */
export function deltaGForExponent(exponent: number): number {
  const k = Math.pow(10, exponent)
  return standardGibbsFromK(k, K_LADDER_T)
}
