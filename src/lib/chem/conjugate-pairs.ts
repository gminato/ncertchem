/**
 * A deck of acid-base and Lewis cards for the conjugate-pair sorter (Section 6.10).
 *
 * Each species carries its proton count and charge, so the tests can check that every
 * Brønsted conjugate pair really differs by one H⁺ (one H and one unit of charge). Lewis
 * cards are checked by role only: the acid accepts an electron pair, the base donates one.
 */

export type BronstedRole = 'acid' | 'base' | 'conjugate-acid' | 'conjugate-base'
export type LewisRole = 'lewis-acid' | 'lewis-base'
export type PairRole = BronstedRole | LewisRole

export interface PairSpecies {
  id: string
  /** mhchem formula, rendered with \ce{} */
  ce: string
  /** Number of H atoms (a proton count is the difference between two species). */
  h: number
  /** Net charge. */
  charge: number
}

export interface PairCard {
  id: string
  kind: 'bronsted' | 'lewis'
  /** mhchem reaction, rendered with \ce{} */
  reaction: string
  /** The species the Learner picks from. Each role takes one of them. */
  choices: PairSpecies[]
  /** The correct species id for each role of this card. */
  answers: Partial<Record<PairRole, string>>
  /** Shown after the card is checked. */
  explanation: string
}

const SPECIES = {
  HCl: { id: 'HCl', ce: 'HCl', h: 1, charge: 0 },
  H2O: { id: 'H2O', ce: 'H2O', h: 2, charge: 0 },
  H3O: { id: 'H3O+', ce: 'H3O+', h: 3, charge: 1 },
  Cl: { id: 'Cl-', ce: 'Cl-', h: 0, charge: -1 },
  NH3: { id: 'NH3', ce: 'NH3', h: 3, charge: 0 },
  NH4: { id: 'NH4+', ce: 'NH4+', h: 4, charge: 1 },
  OH: { id: 'OH-', ce: 'OH-', h: 1, charge: -1 },
  CH3COOH: { id: 'CH3COOH', ce: 'CH3COOH', h: 4, charge: 0 },
  CH3COO: { id: 'CH3COO-', ce: 'CH3COO-', h: 3, charge: -1 },
  HCO3: { id: 'HCO3-', ce: 'HCO3-', h: 1, charge: -1 },
  CO3: { id: 'CO3^2-', ce: 'CO3^2-', h: 0, charge: -2 },
  H2CO3: { id: 'H2CO3', ce: 'H2CO3', h: 2, charge: 0 },
  C6H5COOH: { id: 'C6H5COOH', ce: 'C6H5COOH', h: 6, charge: 0 },
  C6H5COO: { id: 'C6H5COO-', ce: 'C6H5COO-', h: 5, charge: -1 },
  HF: { id: 'HF', ce: 'HF', h: 1, charge: 0 },
  F: { id: 'F-', ce: 'F-', h: 0, charge: -1 },
  BF3: { id: 'BF3', ce: 'BF3', h: 0, charge: 0 },
  AlCl3: { id: 'AlCl3', ce: 'AlCl3', h: 0, charge: 0 },
  AlCl4: { id: 'AlCl4-', ce: 'AlCl4-', h: 0, charge: -1 },
  Mg: { id: 'Mg2+', ce: 'Mg^2+', h: 0, charge: 2 },
  MgAq: { id: 'Mg(H2O)6', ce: '[Mg(H2O)6]^2+', h: 12, charge: 2 },
  Co: { id: 'Co3+', ce: 'Co^3+', h: 0, charge: 3 },
  CoAm: { id: 'Co(NH3)6', ce: '[Co(NH3)6]^3+', h: 18, charge: 3 },
  Hplus: { id: 'H+', ce: 'H^+', h: 1, charge: 1 },
  OHplus: { id: 'OH-', ce: 'OH^-', h: 1, charge: -1 },
  H2Oprod: { id: 'H2O-prod', ce: 'H2O', h: 2, charge: 0 },
  BF3NH3: { id: 'BF3NH3', ce: 'F3B-NH3', h: 3, charge: 0 },
} satisfies Record<string, PairSpecies>

export const CONJUGATE_DECK: readonly PairCard[] = [
  {
    id: 'hcl-water',
    kind: 'bronsted',
    reaction: '\\ce{HCl + H2O -> H3O+ + Cl-}',
    choices: [SPECIES.HCl, SPECIES.H2O, SPECIES.H3O, SPECIES.Cl],
    answers: { acid: 'HCl', base: 'H2O', 'conjugate-acid': 'H3O+', 'conjugate-base': 'Cl-' },
    explanation:
      'HCl gives up its proton, so it is the acid. Water takes the proton, so it is the base. Its conjugate acid is H₃O⁺, and Cl⁻ is the conjugate base of HCl.',
  },
  {
    id: 'ammonia-water',
    kind: 'bronsted',
    reaction: '\\ce{NH3 + H2O <=> NH4+ + OH-}',
    choices: [SPECIES.NH3, SPECIES.H2O, SPECIES.NH4, SPECIES.OH],
    answers: { acid: 'H2O', base: 'NH3', 'conjugate-acid': 'NH4+', 'conjugate-base': 'OH-' },
    explanation:
      'Water donates a proton here, so it is the acid, and NH₃ accepts it as the base. The pair that differs by one proton is NH₄⁺ and NH₃, and the other is H₂O and OH⁻.',
  },
  {
    id: 'acetic-water',
    kind: 'bronsted',
    reaction: '\\ce{CH3COOH + H2O <=> H3O+ + CH3COO-}',
    choices: [SPECIES.CH3COOH, SPECIES.H2O, SPECIES.H3O, SPECIES.CH3COO],
    answers: { acid: 'CH3COOH', base: 'H2O', 'conjugate-acid': 'H3O+', 'conjugate-base': 'CH3COO-' },
    explanation:
      'Acetic acid is the proton donor, and the water it protonates is the base. The acetate ion is what acetic acid becomes after losing its proton.',
  },
  {
    id: 'bicarbonate-water',
    kind: 'bronsted',
    reaction: '\\ce{HCO3- + H2O <=> CO3^2- + H3O+}',
    choices: [SPECIES.HCO3, SPECIES.H2O, SPECIES.CO3, SPECIES.H3O],
    answers: { acid: 'HCO3-', base: 'H2O', 'conjugate-acid': 'H3O+', 'conjugate-base': 'CO3^2-' },
    explanation:
      'Here HCO₃⁻ donates a proton to water, so it is the acid and CO₃²⁻ is its conjugate base. Water accepts the proton, so it is the base and H₃O⁺ its conjugate acid.',
  },
  {
    id: 'bicarbonate-hydronium',
    kind: 'bronsted',
    reaction: '\\ce{HCO3- + H3O+ -> H2CO3 + H2O}',
    choices: [SPECIES.HCO3, SPECIES.H3O, SPECIES.H2CO3, SPECIES.H2Oprod],
    answers: { acid: 'H3O+', base: 'HCO3-', 'conjugate-acid': 'H2CO3', 'conjugate-base': 'H2O-prod' },
    explanation:
      'Now H₃O⁺ donates a proton, so it is the acid, and its conjugate base is H₂O. HCO₃⁻ accepts the proton, so it is the base, and its conjugate acid is H₂CO₃. The same ion acted as an acid in the card before, which is what makes it amphiprotic.',
  },
  {
    id: 'ammonium-hydroxide',
    kind: 'bronsted',
    reaction: '\\ce{NH4+ + OH- <=> NH3 + H2O}',
    choices: [SPECIES.NH4, SPECIES.OH, SPECIES.NH3, SPECIES.H2Oprod],
    answers: { acid: 'NH4+', base: 'OH-', 'conjugate-acid': 'H2O-prod', 'conjugate-base': 'NH3' },
    explanation:
      'NH₄⁺ gives up a proton to OH⁻, so NH₄⁺ is the acid and OH⁻ the base. Losing a proton leaves NH₃, the conjugate base, and gaining one gives H₂O, the conjugate acid of OH⁻.',
  },
  {
    id: 'benzoic-water',
    kind: 'bronsted',
    reaction: '\\ce{C6H5COOH + H2O <=> C6H5COO- + H3O+}',
    choices: [SPECIES.C6H5COOH, SPECIES.H2O, SPECIES.C6H5COO, SPECIES.H3O],
    answers: { acid: 'C6H5COOH', base: 'H2O', 'conjugate-acid': 'H3O+', 'conjugate-base': 'C6H5COO-' },
    explanation:
      'Benzoic acid is a weak acid. Its conjugate base is benzoate, C₆H₅COO⁻, which has one H fewer and one unit more negative charge.',
  },
  {
    id: 'bf3-ammonia',
    kind: 'lewis',
    reaction: '\\ce{BF3 + NH3 -> F3B-NH3}',
    choices: [SPECIES.BF3, SPECIES.NH3, SPECIES.BF3NH3],
    answers: { 'lewis-acid': 'BF3', 'lewis-base': 'NH3' },
    explanation:
      'BF₃ has no proton, yet it accepts the lone pair from NH₃. Boron has only six electrons around it, so it is the Lewis acid, and NH₃ donates the pair, so it is the Lewis base.',
  },
  {
    id: 'alcl3-chloride',
    kind: 'lewis',
    reaction: '\\ce{AlCl3 + Cl- -> AlCl4-}',
    choices: [SPECIES.AlCl3, SPECIES.Cl, SPECIES.AlCl4],
    answers: { 'lewis-acid': 'AlCl3', 'lewis-base': 'Cl-' },
    explanation:
      'Aluminium chloride is electron deficient, so it accepts an electron pair from the chloride ion. The chloride ion donates the pair, so it is the Lewis base.',
  },
  {
    id: 'magnesium-water',
    kind: 'lewis',
    reaction: '\\ce{Mg^2+ + 6H2O -> [Mg(H2O)6]^2+}',
    choices: [SPECIES.Mg, SPECIES.H2O, SPECIES.MgAq],
    answers: { 'lewis-acid': 'Mg2+', 'lewis-base': 'H2O' },
    explanation:
      'The Mg²⁺ ion accepts electron pairs from the oxygen atoms of water, so it is the Lewis acid. Each water molecule donates one lone pair, so it is the Lewis base.',
  },
  {
    id: 'cobalt-ammonia',
    kind: 'lewis',
    reaction: '\\ce{Co^3+ + 6NH3 -> [Co(NH3)6]^3+}',
    choices: [SPECIES.Co, SPECIES.NH3, SPECIES.CoAm],
    answers: { 'lewis-acid': 'Co3+', 'lewis-base': 'NH3' },
    explanation:
      'Co³⁺ is a metal ion that accepts electron pairs, so it is the Lewis acid. Each NH₃ donates the lone pair on its nitrogen, so NH₃ is the Lewis base.',
  },
  {
    id: 'proton-hydroxide',
    kind: 'lewis',
    reaction: '\\ce{H+ + OH- -> H2O}',
    choices: [SPECIES.Hplus, SPECIES.OHplus, SPECIES.H2Oprod],
    answers: { 'lewis-acid': 'H+', 'lewis-base': 'OH-' },
    explanation:
      'A bare proton has an empty orbital and accepts a lone pair from hydroxide, so H⁺ is the Lewis acid and OH⁻ the Lewis base. Every Brønsted acid–base reaction is also a Lewis one, because the base donates the pair that the proton accepts.',
  },
]

/** The roles a card of this kind asks for. */
export function pairRoles(kind: PairCard['kind']): readonly PairRole[] {
  return kind === 'bronsted'
    ? ['acid', 'base', 'conjugate-acid', 'conjugate-base']
    : ['lewis-acid', 'lewis-base']
}

export interface CardJudgement {
  /** One entry per role of the card: true when the pick matches the answer. */
  roles: Partial<Record<PairRole, boolean>>
  /** True when every role is right. */
  correct: boolean
}

/**
 * Judges a Learner's picks for one card. A role with no pick counts as wrong. The card is
 * correct only when all of its roles are right.
 */
export function judgeCard(card: PairCard, picks: Partial<Record<PairRole, string>>): CardJudgement {
  const roles: Partial<Record<PairRole, boolean>> = {}
  for (const role of pairRoles(card.kind)) {
    roles[role] = picks[role] !== undefined && picks[role] === card.answers[role]
  }
  const correct = pairRoles(card.kind).every((role) => roles[role] === true)
  return { roles, correct }
}

/** Number of cards answered fully correctly, out of the deck size. */
export function deckScore(results: readonly CardJudgement[]): { correct: number; total: number } {
  return { correct: results.filter((r) => r.correct).length, total: results.length }
}
