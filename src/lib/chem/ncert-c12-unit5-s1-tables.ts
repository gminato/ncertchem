/**
 * Reference data from NCERT Class 12 Chemistry Part I, Unit 5 (Coordination Compounds),
 * Section 5.1 (Werner's Theory), book pp. 118-119. Values are as NCERT prints them.
 * Worked examples, Intext Questions and Exercises are deliberately not transcribed (ADR-0001).
 */

export interface WernerComplexRow {
  /** Colour of the solid as printed in Table 5.1 */
  colour: string
  /** Empirical formula, e.g. CoCl3.6NH3 */
  empirical: string
  /** Number of NH3 per cobalt in the empirical formula */
  ammonia: number
  /** Moles of AgCl precipitated per mole with excess cold AgNO3 */
  agclMoles: number
  /** Coordination entity formula (mhchem) */
  entity: string
  /** Charge on the coordination entity */
  entityCharge: number
  /** Chloride ions bound to cobalt inside the bracket */
  boundChloride: number
  /** Counter ions (free chloride) outside the bracket */
  counterIons: number
  /** Conductivity type, as ions per formula unit */
  electrolyte: '1:3' | '1:2' | '1:1'
  /** Full formula in mhchem */
  formula: string
}

/** Table 5.1 with the AgCl results printed above it (p. 119). */
export const NCERT_WERNER_COBALT: readonly WernerComplexRow[] = [
  { colour: 'Yellow', empirical: 'CoCl3.6NH3', ammonia: 6, agclMoles: 3, entity: '[Co(NH3)6]^3+', entityCharge: 3, boundChloride: 0, counterIons: 3, electrolyte: '1:3', formula: '[Co(NH3)6]Cl3' },
  { colour: 'Purple', empirical: 'CoCl3.5NH3', ammonia: 5, agclMoles: 2, entity: '[CoCl(NH3)5]^2+', entityCharge: 2, boundChloride: 1, counterIons: 2, electrolyte: '1:2', formula: '[CoCl(NH3)5]Cl2' },
  { colour: 'Green', empirical: 'CoCl3.4NH3', ammonia: 4, agclMoles: 1, entity: '[CoCl2(NH3)4]^+', entityCharge: 1, boundChloride: 2, counterIons: 1, electrolyte: '1:1', formula: '[CoCl2(NH3)4]Cl' },
  { colour: 'Violet', empirical: 'CoCl3.4NH3', ammonia: 4, agclMoles: 1, entity: '[CoCl2(NH3)4]^+', entityCharge: 1, boundChloride: 2, counterIons: 1, electrolyte: '1:1', formula: '[CoCl2(NH3)4]Cl' },
]

/** Primary valence of the binary chlorides named in the text (p. 118). */
export const NCERT_PRIMARY_VALENCE: readonly { compound: string; primary: number }[] = [
  { compound: 'CrCl3', primary: 3 },
  { compound: 'CoCl2', primary: 2 },
  { compound: 'PdCl2', primary: 2 },
]

/** Secondary valence of Co(III) in every compound of Table 5.1. */
export const NCERT_COBALT_SECONDARY_VALENCE = 6

/** Shapes named in the postulates (p. 119). */
export const NCERT_WERNER_SHAPES: readonly { entity: string; shape: string }[] = [
  { entity: '[Co(NH3)6]^3+', shape: 'octahedral' },
  { entity: '[CoCl(NH3)5]^2+', shape: 'octahedral' },
  { entity: '[CoCl2(NH3)4]^+', shape: 'octahedral' },
  { entity: '[Ni(CO)4]', shape: 'tetrahedral' },
  { entity: '[PtCl4]^2-', shape: 'square planar' },
]

/** Biographical facts (pp. 118, 120). */
export const NCERT_WERNER_FACTS = {
  born: 1866,
  died: 1919,
  nationality: 'Swiss',
  theoryYear: 1898,
  nobelYear: 1913,
} as const
