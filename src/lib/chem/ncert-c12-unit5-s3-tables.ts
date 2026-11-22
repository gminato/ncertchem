/**
 * Reference data from NCERT Class 12 Chemistry Part I, Unit 5 (Coordination Compounds),
 * Section 5.3 (book pp. 122-124): naming rules, ligand names, metal stems, and counter ions.
 * Worked examples, Intext Questions and Exercises are deliberately not transcribed (ADR-0001).
 */

export interface Ligand {
  readonly formula: string
  readonly name: string
  readonly charge: number
  /** Number of donor atoms bound to the central metal (1 = unidentate, 2 = didentate). */
  readonly denticity: 1 | 2
  /** True when the formula is polyatomic or an abbreviation, so it takes parentheses in formulas. */
  readonly polyatomic: boolean
  /** True when the name contains a numerical prefix, so bis/tris/tetrakis is used. */
  readonly numberedName: boolean
}

/** Ligand names as NCERT uses them (chlorido form, per the 2004 IUPAC draft note). */
export const NCERT_LIGANDS: readonly Ligand[] = [
  { formula: 'H2O', name: 'aqua', charge: 0, denticity: 1, polyatomic: true, numberedName: false },
  { formula: 'NH3', name: 'ammine', charge: 0, denticity: 1, polyatomic: true, numberedName: false },
  { formula: 'CO', name: 'carbonyl', charge: 0, denticity: 1, polyatomic: true, numberedName: false },
  { formula: 'NO', name: 'nitrosyl', charge: 0, denticity: 1, polyatomic: true, numberedName: false },
  { formula: 'Cl', name: 'chlorido', charge: -1, denticity: 1, polyatomic: false, numberedName: false },
  { formula: 'Br', name: 'bromido', charge: -1, denticity: 1, polyatomic: false, numberedName: false },
  { formula: 'CN', name: 'cyanido', charge: -1, denticity: 1, polyatomic: true, numberedName: false },
  { formula: 'OH', name: 'hydroxido', charge: -1, denticity: 1, polyatomic: true, numberedName: false },
  { formula: 'NO2', name: 'nitrito-N', charge: -1, denticity: 1, polyatomic: true, numberedName: false },
  { formula: 'SCN', name: 'thiocyanato-S', charge: -1, denticity: 1, polyatomic: true, numberedName: false },
  { formula: 'C2O4', name: 'oxalato', charge: -2, denticity: 2, polyatomic: true, numberedName: false },
  { formula: 'CO3', name: 'carbonato', charge: -2, denticity: 1, polyatomic: true, numberedName: false },
  { formula: 'en', name: 'ethane-1,2-diamine', charge: 0, denticity: 2, polyatomic: true, numberedName: true },
  { formula: 'PPh3', name: 'triphenylphosphine', charge: 0, denticity: 1, polyatomic: true, numberedName: true },
]

export interface CounterIon {
  readonly formula: string
  readonly name: string
  readonly charge: number
  readonly polyatomic: boolean
}

/** Counter ions used to balance charged coordination entities. */
export const NCERT_COUNTER_IONS: readonly CounterIon[] = [
  { formula: 'K', name: 'potassium', charge: 1, polyatomic: false },
  { formula: 'Na', name: 'sodium', charge: 1, polyatomic: false },
  { formula: 'Cl', name: 'chloride', charge: -1, polyatomic: false },
  { formula: 'SO4', name: 'sulphate', charge: -2, polyatomic: true },
]

/** Multiplying prefixes for simple and for already-numbered ligand names. */
export const SIMPLE_PREFIXES: readonly string[] = ['', 'mono', 'di', 'tri', 'tetra', 'penta', 'hexa']
export const COMPLEX_PREFIXES: readonly string[] = ['', '', 'bis', 'tris', 'tetrakis']

/** Metal names in a cationic or neutral entity, and in an anionic entity (-ate, Latin stems). */
export const NCERT_METAL_NAMES: Record<string, { cation: string; anion: string }> = {
  Co: { cation: 'cobalt', anion: 'cobaltate' },
  Cr: { cation: 'chromium', anion: 'chromate' },
  Fe: { cation: 'iron', anion: 'ferrate' },
  Ni: { cation: 'nickel', anion: 'nickelate' },
  Pt: { cation: 'platinum', anion: 'platinate' },
  Zn: { cation: 'zinc', anion: 'zincate' },
  Ag: { cation: 'silver', anion: 'argentate' },
  Cu: { cation: 'copper', anion: 'cuprate' },
}

/** Common oxidation states shown by each central metal in NCERT Unit 5 complexes. */
export const NCERT_METAL_OXIDATION_STATES: Record<string, readonly number[]> = {
  Co: [2, 3],
  Cr: [2, 3],
  Fe: [0, 2, 3],
  Ni: [0, 2],
  Pt: [2, 4],
  Zn: [2],
  Ag: [1],
  Cu: [1, 2],
}

const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

export function romanNumeral(state: number): string {
  return ROMAN[state] ?? String(state)
}

/** Oxidation state of the metal from the entity charge and the ligand list. */
export function metalOxidationState(
  entityCharge: number,
  ligands: readonly { ligand: Ligand; count: number }[],
): number {
  return entityCharge - ligands.reduce((s, l) => s + l.ligand.charge * l.count, 0)
}

/** Ligand segment of a name, sorted alphabetically ignoring multiplying prefixes. */
export function ligandSegment(ligands: readonly { ligand: Ligand; count: number }[]): string {
  return [...ligands]
    .filter((l) => l.count > 0)
    .sort((a, b) => a.ligand.name.localeCompare(b.ligand.name))
    .map(({ ligand, count }) => {
      if (ligand.numberedName) {
        const p = count > 1 ? COMPLEX_PREFIXES[count] : ''
        return count > 1 ? `${p}(${ligand.name})` : ligand.name
      }
      return `${SIMPLE_PREFIXES[count] === 'mono' ? '' : SIMPLE_PREFIXES[count]}${ligand.name}`
    })
    .join('')
}
