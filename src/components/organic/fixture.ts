/**
 * Hand-written MolGraphs for the Unit 8 vocab demos. Hydrogens on carbon are implicit and given
 * by `hCount`. Atom indices follow the comments.
 */
import type { MolGraph } from '@/lib/chem/molecule-graph'

/** 2,2,4-trimethylpentane, C8H18. Parent chain C1-C5 is atoms 0, 1, 2, 3, 4. */
export const TRIMETHYLPENTANE: MolGraph = {
  atoms: [
    { element: 'C', hCount: 3 }, // 0  C1
    { element: 'C', hCount: 0 }, // 1  C2 (quaternary)
    { element: 'C', hCount: 2 }, // 2  C3
    { element: 'C', hCount: 1 }, // 3  C4
    { element: 'C', hCount: 3 }, // 4  C5
    { element: 'C', hCount: 3 }, // 5  methyl on C2
    { element: 'C', hCount: 3 }, // 6  methyl on C2
    { element: 'C', hCount: 3 }, // 7  methyl on C4
  ],
  bonds: [
    { a: 0, b: 1, order: 1 },
    { a: 1, b: 2, order: 1 },
    { a: 2, b: 3, order: 1 },
    { a: 3, b: 4, order: 1 },
    { a: 1, b: 5, order: 1 },
    { a: 1, b: 6, order: 1 },
    { a: 3, b: 7, order: 1 },
  ],
}

/** Bonds and atoms of the parent chain of TRIMETHYLPENTANE. */
export const TRIMETHYLPENTANE_CHAIN_ATOMS = [0, 1, 2, 3, 4] as const
export const TRIMETHYLPENTANE_CHAIN_BONDS = [0, 1, 2, 3] as const

/** Butanoic acid, CH3CH2CH2COOH. */
export const BUTANOIC_ACID: MolGraph = {
  atoms: [
    { element: 'C', hCount: 3 }, // 0 CH3
    { element: 'C', hCount: 2 }, // 1 CH2
    { element: 'C', hCount: 2 }, // 2 CH2
    { element: 'C', hCount: 0 }, // 3 COOH carbon
    { element: 'O', hCount: 0 }, // 4 carbonyl O
    { element: 'O', hCount: 1 }, // 5 hydroxyl O
  ],
  bonds: [
    { a: 0, b: 1, order: 1 },
    { a: 1, b: 2, order: 1 },
    { a: 2, b: 3, order: 1 },
    { a: 3, b: 4, order: 2 },
    { a: 3, b: 5, order: 1 },
  ],
}

/** 4-chlorotoluene (1-chloro-4-methylbenzene), Kekule form. Ring atoms 0 to 5; 6 is CH3, 7 is Cl. */
export const CHLOROTOLUENE: MolGraph = {
  atoms: [
    { element: 'C', hCount: 0 }, // 0 ring, bears CH3
    { element: 'C', hCount: 1 }, // 1
    { element: 'C', hCount: 1 }, // 2
    { element: 'C', hCount: 0 }, // 3 ring, bears Cl
    { element: 'C', hCount: 1 }, // 4
    { element: 'C', hCount: 1 }, // 5
    { element: 'C', hCount: 3 }, // 6 CH3
    { element: 'Cl', hCount: 0 }, // 7 Cl
  ],
  bonds: [
    { a: 0, b: 1, order: 2 },
    { a: 1, b: 2, order: 1 },
    { a: 2, b: 3, order: 2 },
    { a: 3, b: 4, order: 1 },
    { a: 4, b: 5, order: 2 },
    { a: 5, b: 0, order: 1 },
    { a: 0, b: 6, order: 1 },
    { a: 3, b: 7, order: 1 },
  ],
}

/** Cyclohexene. The double bond is between atoms 0 and 1. */
export const CYCLOHEXENE: MolGraph = {
  atoms: [
    { element: 'C', hCount: 1 },
    { element: 'C', hCount: 1 },
    { element: 'C', hCount: 2 },
    { element: 'C', hCount: 2 },
    { element: 'C', hCount: 2 },
    { element: 'C', hCount: 2 },
  ],
  bonds: [
    { a: 0, b: 1, order: 2 },
    { a: 1, b: 2, order: 1 },
    { a: 2, b: 3, order: 1 },
    { a: 3, b: 4, order: 1 },
    { a: 4, b: 5, order: 1 },
    { a: 5, b: 0, order: 1 },
  ],
}

/** Pentan-2-ol, CH3CH(OH)CH2CH2CH3. The oxygen is atom 2. */
export const PENTAN2OL: MolGraph = {
  atoms: [
    { element: 'C', hCount: 3 }, // 0 C1
    { element: 'C', hCount: 1 }, // 1 C2
    { element: 'O', hCount: 1 }, // 2 O
    { element: 'C', hCount: 2 }, // 3 C3
    { element: 'C', hCount: 2 }, // 4 C4
    { element: 'C', hCount: 3 }, // 5 C5
  ],
  bonds: [
    { a: 0, b: 1, order: 1 },
    { a: 1, b: 2, order: 1 },
    { a: 1, b: 3, order: 1 },
    { a: 3, b: 4, order: 1 },
    { a: 4, b: 5, order: 1 },
  ],
}

/** Acetate ion, resonance contributor A: C=O on atom 2, O- on atom 3. */
export const ACETATE_A: MolGraph = {
  atoms: [
    { element: 'C', hCount: 3 }, // 0 CH3
    { element: 'C', hCount: 0 }, // 1 carboxyl carbon
    { element: 'O', hCount: 0 }, // 2 carbonyl O
    { element: 'O', hCount: 0, charge: -1 }, // 3 O-
  ],
  bonds: [
    { a: 0, b: 1, order: 1 },
    { a: 1, b: 2, order: 2 },
    { a: 1, b: 3, order: 1 },
  ],
}

/** Acetate ion, resonance contributor B: C=O on atom 3, O- on atom 2. */
export const ACETATE_B: MolGraph = {
  atoms: [
    { element: 'C', hCount: 3 },
    { element: 'C', hCount: 0 },
    { element: 'O', hCount: 0, charge: -1 },
    { element: 'O', hCount: 0 },
  ],
  bonds: [
    { a: 0, b: 1, order: 1 },
    { a: 1, b: 2, order: 1 },
    { a: 1, b: 3, order: 2 },
  ],
}

/** Acetate ion as the resonance hybrid: both C-O bonds equal (drawn with order 1, dashed). */
export const ACETATE_HYBRID: MolGraph = {
  atoms: [
    { element: 'C', hCount: 3 },
    { element: 'C', hCount: 0 },
    { element: 'O', hCount: 0 },
    { element: 'O', hCount: 0 },
  ],
  bonds: [
    { a: 0, b: 1, order: 1 },
    { a: 1, b: 2, order: 1 },
    { a: 1, b: 3, order: 1 },
  ],
}

/** Kekule benzene, contributor A: double bonds 0=1, 2=3, 4=5. */
export const BENZENE_A: MolGraph = {
  atoms: Array.from({ length: 6 }, () => ({ element: 'C', hCount: 1 })),
  bonds: [
    { a: 0, b: 1, order: 2 },
    { a: 1, b: 2, order: 1 },
    { a: 2, b: 3, order: 2 },
    { a: 3, b: 4, order: 1 },
    { a: 4, b: 5, order: 2 },
    { a: 5, b: 0, order: 1 },
  ],
}

/** Kekule benzene, contributor B: double bonds 1=2, 3=4, 5=0. */
export const BENZENE_B: MolGraph = {
  atoms: Array.from({ length: 6 }, () => ({ element: 'C', hCount: 1 })),
  bonds: [
    { a: 0, b: 1, order: 1 },
    { a: 1, b: 2, order: 2 },
    { a: 2, b: 3, order: 1 },
    { a: 3, b: 4, order: 2 },
    { a: 4, b: 5, order: 1 },
    { a: 5, b: 0, order: 2 },
  ],
}

/** Benzene as the resonance hybrid: every bond order 1 (drawn dashed). */
export const BENZENE_HYBRID: MolGraph = {
  atoms: Array.from({ length: 6 }, () => ({ element: 'C', hCount: 1 })),
  bonds: [
    { a: 0, b: 1, order: 1 },
    { a: 1, b: 2, order: 1 },
    { a: 2, b: 3, order: 1 },
    { a: 3, b: 4, order: 1 },
    { a: 4, b: 5, order: 1 },
    { a: 5, b: 0, order: 1 },
  ],
}

/** 1-chlorobutane, CH3CH2CH2CH2Cl, as the chain of nodes for InductiveChain (Cl first). */
export const CHLOROBUTANE: MolGraph = {
  atoms: [
    { element: 'Cl', hCount: 0 }, // 0
    { element: 'C', hCount: 2 }, // 1 C1
    { element: 'C', hCount: 2 }, // 2 C2
    { element: 'C', hCount: 2 }, // 3 C3
    { element: 'C', hCount: 3 }, // 4 C4
  ],
  bonds: [
    { a: 0, b: 1, order: 1 },
    { a: 1, b: 2, order: 1 },
    { a: 2, b: 3, order: 1 },
    { a: 3, b: 4, order: 1 },
  ],
}

/** Ethene, a C=C pi bond for the curved-arrow demo. */
export const ETHENE: MolGraph = {
  atoms: [
    { element: 'C', hCount: 2 },
    { element: 'C', hCount: 2 },
  ],
  bonds: [{ a: 0, b: 1, order: 2 }],
}

/** Bromomethane, CH3Br: the C-Br bond breaks heterolytically in the curved-arrow demo. */
export const METHYL_BROMIDE: MolGraph = {
  atoms: [
    { element: 'C', hCount: 3 },
    { element: 'Br', hCount: 0 },
  ],
  bonds: [{ a: 0, b: 1, order: 1 }],
}

/** Chlorine, Cl2: the Cl-Cl bond breaks homolytically in the curved-arrow demo. */
export const CHLORINE: MolGraph = {
  atoms: [
    { element: 'Cl', hCount: 0 },
    { element: 'Cl', hCount: 0 },
  ],
  bonds: [{ a: 0, b: 1, order: 1 }],
}
