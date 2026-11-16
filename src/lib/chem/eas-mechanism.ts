/**
 * The electrophilic substitution mechanism of benzene (NCERT 9.5.5), as graphs the drawings can
 * draw. The σ-complex (arenium ion) is built here with the electrophile on ring carbon 0 (the sp³
 * carbon) and the + charge on one of the three ring carbons that the charge can reach (positions 1,
 * 3 and 5 of the ring, counted from the sp³ carbon). Each of the three is a contributor of the same
 * ion: the three together are the resonance set that the drawing shows.
 *
 * Every formula, name and equation shown to students comes from the lib: the electrophiles are the
 * ones of electrophilicSubstitution (hydrocarbon-reactions) and the products are its products.
 */

import type { MolAtom, MolBond, MolGraph } from './molecule-graph'
import { findRings } from './hydrocarbon-species'
import { electrophilicSubstitution, type Reaction } from './hydrocarbon-reactions'
import { molecularFormula, parseSmiles } from './molecule-parse'

/** The substitution kinds the mechanism is drawn for: the five of NCERT 9.5.5 that a benzene ring takes. */
export type EasKind = 'nitration' | 'chlorination' | 'sulphonation' | 'alkylation' | 'acylation'

/** The three contributors of the σ-complex: the + charge sits on ring position 1, 3 or 5 (counted from the sp³ carbon). */
export const SIGMA_CONTRIBUTORS = [1, 3, 5] as const
export type SigmaContributor = (typeof SIGMA_CONTRIBUTORS)[number]

/** A fragment that bonds to the sp³ carbon through its root atom. */
export interface Fragment {
  atoms: MolAtom[]
  bonds: MolBond[]
  root: number
}

/** The double bonds of the σ-complex for each contributor, as pairs of ring positions (the sp³ carbon is 0). */
const DOUBLE_PAIRS: Record<SigmaContributor, readonly (readonly [number, number])[]> = {
  1: [
    [2, 3],
    [4, 5],
  ],
  3: [
    [1, 2],
    [4, 5],
  ],
  5: [
    [1, 2],
    [3, 4],
  ],
}

/** The electrophile fragment for a substitution kind: the atoms that bond to the sp³ carbon, with the root that bonds. */
export function electrophileFragment(kind: EasKind, R?: MolGraph): Fragment {
  switch (kind) {
    case 'nitration':
      return {
        atoms: [
          { element: 'N', charge: 1, hCount: 0 },
          { element: 'O', hCount: 0 },
          { element: 'O', charge: -1, hCount: 0 },
        ],
        bonds: [
          { a: 0, b: 1, order: 2 },
          { a: 0, b: 2, order: 1 },
        ],
        root: 0,
      }
    case 'chlorination':
      return { atoms: [{ element: 'Cl', hCount: 0 }], bonds: [], root: 0 }
    case 'sulphonation':
      // SO₃ bonds through sulphur: S(=O)(=O)O⁻ on the sp³ carbon, a zwitterion with the ring cation.
      return {
        atoms: [
          { element: 'S', hCount: 0 },
          { element: 'O', hCount: 0 },
          { element: 'O', hCount: 0 },
          { element: 'O', charge: -1, hCount: 0 },
        ],
        bonds: [
          { a: 0, b: 1, order: 2 },
          { a: 0, b: 2, order: 2 },
          { a: 0, b: 3, order: 1 },
        ],
        root: 0,
      }
    case 'alkylation': {
      // Only the methyl group (from chloromethane) is modelled.
      if (!R || molecularFormula(R) !== 'CH3Cl') throw new RangeError('Alkylation is modelled with chloromethane (CH3Cl)')
      return { atoms: [{ element: 'C', hCount: 3 }], bonds: [], root: 0 }
    }
    case 'acylation': {
      // Only the acetyl group (from ethanoyl chloride) is modelled.
      if (!R || molecularFormula(R) !== 'C2H3ClO') throw new RangeError('Acylation is modelled with ethanoyl chloride (CH3COCl)')
      return {
        atoms: [
          { element: 'C', hCount: 0 },
          { element: 'O', hCount: 0 },
          { element: 'C', hCount: 3 },
        ],
        bonds: [
          { a: 0, b: 1, order: 2 },
          { a: 0, b: 2, order: 1 },
        ],
        root: 0,
      }
    }
  }
}

/** Benzene's ring in ring order, with the sp³ carbon first. Throws unless the graph is benzene. */
function benzeneRingOrder(arene: MolGraph): number[] {
  const ring = findRings(arene, 6).find((r) => r.length === 6 && r.every((i) => arene.atoms[i].element === 'C'))
  if (!ring) throw new RangeError('The σ-complex is drawn for benzene')
  return ring
}

/**
 * The σ-complex of benzene with a fragment on ring carbon 0 (sp³) and the + charge on ring position
 * `contributor`. The result is a MolGraph with the hydrogens rebuilt from valence.
 */
export function sigmaContributor(arene: MolGraph, fragment: Fragment, contributor: SigmaContributor): MolGraph {
  if (arene.atoms.length !== 6 || molecularFormula(arene) !== 'C6H6') throw new RangeError('The σ-complex is drawn for benzene')
  const ring = benzeneRingOrder(arene)
  const sp3 = ring[0]
  const cation = ring[contributor]
  const doubles = new Set(DOUBLE_PAIRS[contributor].map(([a, b]) => pairKey(ring[a], ring[b])))
  const atoms: MolAtom[] = arene.atoms.map((a, i) => (i === cation ? { ...a, charge: 1 } : { ...a }))
  const bonds: MolBond[] = arene.bonds.map((b) => ({ ...b, order: doubles.has(pairKey(b.a, b.b)) ? 2 : 1 }))
  const offset = atoms.length
  const joinedAtoms = [...atoms, ...fragment.atoms.map((a) => ({ ...a }))]
  const joinedBonds: MolBond[] = [
    ...bonds,
    ...fragment.bonds.map((b) => ({ ...b, a: b.a + offset, b: b.b + offset })),
    { a: sp3, b: fragment.root + offset, order: 1 },
  ]
  return withCarbonHydrogens(joinedAtoms, joinedBonds)
}

/**
 * Sets the hydrogens of every carbon from its bonds (four bonds for neutral carbon, three for a
 * carbocation). Other atoms keep the hCount their fragment gives them, because the lib's valence
 * table does not cover sulphur as it is bonded in SO₃.
 */
function withCarbonHydrogens(atoms: MolAtom[], bonds: MolBond[]): MolGraph {
  const out = atoms.map((a) => ({ ...a }))
  out.forEach((atom, i) => {
    if (atom.element !== 'C') return
    const used = bonds.reduce((sum, b) => (b.a === i || b.b === i ? sum + b.order : sum), 0)
    atom.hCount = (atom.charge === 1 ? 3 : 4) - used
  })
  return { atoms: out, bonds: bonds.map((b) => ({ ...b })) }
}

function pairKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`
}

/** The three contributors of the σ-complex of an EAS kind on benzene, in the order 1, 3, 5. */
export function sigmaContributors(kind: EasKind, R?: MolGraph): MolGraph[] {
  const benzene = parseSmiles('C1=CC=CC=C1')
  const fragment = electrophileFragment(kind, R)
  return SIGMA_CONTRIBUTORS.map((c) => sigmaContributor(benzene, fragment, c))
}

/** The nitronium ion, O=N⁺=O, as a graph. */
export function nitroniumIon(): MolGraph {
  return parseSmiles('O=[N+]=O')
}

/** The methyl cation, CH₃⁺, as a graph. */
export function methylCation(): MolGraph {
  return parseSmiles('[CH3+]')
}

/**
 * The Unit 9 electrophilic substitution reaction of benzene for one kind (from the lib's
 * electrophilicSubstitution), so that the mechanism drawings and the workbench share its names.
 */
export function substitutionOfBenzene(kind: EasKind, R?: MolGraph): Reaction {
  return electrophilicSubstitution(parseSmiles('C1=CC=CC=C1'), kind, R ? { R } : {})
}

/**
 * Writes a mhchem-style species (NO2+, HSO4-, H2SO4, C6H6Cl+) with real subscripts and superscript charges,
 * for plain text in a drawing. Digits after a letter become subscripts; a trailing + or - becomes a superscript.
 * Coefficients (digits at the start) are kept upright.
 */
export function formulaText(species: string): string {
  let out = species.replace(/([A-Za-z)])(\d+)/g, (_m, letter: string, digits: string) => letter + subscriptDigits(digits))
  out = out.replace(/\+$/, '⁺').replace(/-$/, '⁻')
  return out
}

/** The digits as subscript digits: 2 gives ₂. */
export function subscriptDigits(digits: string): string {
  const sub: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' }
  return digits.replace(/\d/g, (d) => sub[d])
}

/** The electrophile equation of the lib (mhchem), split into its terms: "HNO3 + 2H2SO4 -> NO2+ + ..." */
export function equationTerms(equation: string): { reactants: string[]; products: string[] } {
  const body = equation.replace(/^\\ce\{/, '').replace(/\}$/, '')
  const [left, right] = body.split('->').map((side) => side.split(' + ').map((t) => t.trim()))
  return { reactants: left, products: right }
}
