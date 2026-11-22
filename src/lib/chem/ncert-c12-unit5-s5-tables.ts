/**
 * Reference data from NCERT Class 12 Chemistry Part I, Unit 5 (Coordination Compounds),
 * Sections 5.5.1 to 5.5.3 (book pp. 128-131). Values are as NCERT prints them.
 * Worked examples, Intext Questions and Exercises are deliberately not transcribed (ADR-0001).
 */

export interface HybridisationRow {
  coordinationNumber: number
  hybridisation: string
  shape: string
}

/** Table 5.2: number of orbitals and types of hybridisation (p. 128). */
export const NCERT_TABLE_5_2: readonly HybridisationRow[] = [
  { coordinationNumber: 4, hybridisation: 'sp³', shape: 'Tetrahedral' },
  { coordinationNumber: 4, hybridisation: 'dsp²', shape: 'Square planar' },
  { coordinationNumber: 5, hybridisation: 'sp³d', shape: 'Trigonal bipyramidal' },
  { coordinationNumber: 6, hybridisation: 'sp³d²', shape: 'Octahedral' },
  { coordinationNumber: 6, hybridisation: 'd²sp³', shape: 'Octahedral' },
]

export interface VbtComplex {
  formula: string
  metalIon: string
  /** d-electron count of the metal ion. */
  d: number
  hybridisation: string
  shape: string
  /** Unpaired electrons as stated or implied by NCERT. */
  unpaired: number
  orbitalType: 'inner' | 'outer' | 'none'
  note: string
}

/** Worked complexes of Section 5.5.1 (pp. 129-130) and the magnetic comparisons of 5.5.2 (p. 130-131). */
export const NCERT_VBT_COMPLEXES: readonly VbtComplex[] = [
  { formula: '[Co(NH₃)₆]³⁺', metalIon: 'Co³⁺', d: 6, hybridisation: 'd²sp³', shape: 'Octahedral', unpaired: 0, orbitalType: 'inner', note: 'diamagnetic, low spin' },
  { formula: '[CoF₆]³⁻', metalIon: 'Co³⁺', d: 6, hybridisation: 'sp³d²', shape: 'Octahedral', unpaired: 4, orbitalType: 'outer', note: 'paramagnetic, high spin, uses 4d' },
  { formula: '[NiCl₄]²⁻', metalIon: 'Ni²⁺', d: 8, hybridisation: 'sp³', shape: 'Tetrahedral', unpaired: 2, orbitalType: 'none', note: 'paramagnetic' },
  { formula: '[Ni(CO)₄]', metalIon: 'Ni', d: 10, hybridisation: 'sp³', shape: 'Tetrahedral', unpaired: 0, orbitalType: 'none', note: 'diamagnetic, nickel in zero oxidation state' },
  { formula: '[Ni(CN)₄]²⁻', metalIon: 'Ni²⁺', d: 8, hybridisation: 'dsp²', shape: 'Square planar', unpaired: 0, orbitalType: 'none', note: 'diamagnetic, low spin' },
  { formula: '[Mn(CN)₆]³⁻', metalIon: 'Mn³⁺', d: 4, hybridisation: 'd²sp³', shape: 'Octahedral', unpaired: 2, orbitalType: 'inner', note: 'inner orbital, paramagnetic' },
  { formula: '[MnCl₆]³⁻', metalIon: 'Mn³⁺', d: 4, hybridisation: 'sp³d²', shape: 'Octahedral', unpaired: 4, orbitalType: 'outer', note: 'outer orbital, paramagnetic' },
  { formula: '[Fe(CN)₆]³⁻', metalIon: 'Fe³⁺', d: 5, hybridisation: 'd²sp³', shape: 'Octahedral', unpaired: 1, orbitalType: 'inner', note: 'inner orbital, paramagnetic' },
  { formula: '[FeF₆]³⁻', metalIon: 'Fe³⁺', d: 5, hybridisation: 'sp³d²', shape: 'Octahedral', unpaired: 5, orbitalType: 'outer', note: 'outer orbital, paramagnetic' },
  { formula: '[Co(C₂O₄)₃]³⁻', metalIon: 'Co³⁺', d: 6, hybridisation: 'd²sp³', shape: 'Octahedral', unpaired: 0, orbitalType: 'inner', note: 'inner orbital, diamagnetic' },
]

/** Spin-only moment, BM, for n unpaired electrons. */
export function spinOnly(n: number): number {
  return Math.sqrt(n * (n + 2))
}

/** Limitations of VBT listed in Section 5.5.3 (p. 131), paraphrased by number. */
export const NCERT_VBT_LIMITATION_COUNT = 6

/** The worked example's datum: [MnBr₄]²⁻ has spin-only moment 5.9 BM (five unpaired electrons, tetrahedral). */
export const NCERT_MNBR4 = { formula: '[MnBr₄]²⁻', moment: 5.9, unpaired: 5, shape: 'Tetrahedral' } as const
