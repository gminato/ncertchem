import { ACID_STRENGTH_SERIES, PKA_VALUES, type PkaRow, pkaBand } from '@/lib/chem/ncert-c12-unit8-data'

/** The six Steps of the acid-strength Scrolly, in Prose order (Section 12, 8.8–8.9.1). */
export const ACID_STRENGTH_BEATS = ['dimer', 'proton-transfer', 'acetate', 'phenoxide', 'pka-scale', 'inductive-strip'] as const

/** Screen-reader description of each Step's drawing. */
export const ACID_STRENGTH_ALT = [
  'Two acetic acid molecules joined by two hydrogen bonds into a dimer',
  'Acetic acid giving its proton to water, with curved electron arrows, and the equilibrium written with Ka and pKa',
  'Acetate ion drawn as two equivalent resonance forms joined by a double arrow',
  'Phenoxide ion drawn as three resonance forms: charge on oxygen, on an ortho carbon and on the para carbon',
  'Vertical pKa scale from hydrochloric acid to ethanol with NCERT values and four shaded bands',
  'Chloroacetic acid with inductive arrows toward chlorine, and an ordered strip of six acids from strongest to weakest',
] as const

// Molecules. The drawings are hand-placed from these constants; the unit test checks each formula.
export const ACETIC_SMILES = 'CC(O)=O'
export const WATER_SMILES = 'O'
export const HYDRONIUM_SMILES = '[OH3+]'
export const ACETATE_SMILES = 'CC(=O)[O-]'
export const PHENOXIDE_SMILES = '[O-]C1=CC=CC=C1'
/** Phenoxide resonance form with the charge on an ortho carbon. */
export const PHENOXIDE_ORTHO_SMILES = 'O=C1[CH-]C=CC=C1'
/** Phenoxide resonance form with the charge on the para carbon. */
export const PHENOXIDE_PARA_SMILES = 'O=C1C=C[CH-]C=C1'
export const CHLOROACETIC_SMILES = 'ClCC(O)=O'

/** Ruler: pKa from −8 (top) to 17 (bottom), in SVG units. */
export const RULER_MIN = -8
export const RULER_MAX = 17
const RULER_TOP = 100
const RULER_BOTTOM = 540

export function rulerY(pKa: number): number {
  return RULER_TOP + ((pKa - RULER_MIN) / (RULER_MAX - RULER_MIN)) * (RULER_BOTTOM - RULER_TOP)
}

/** The acids marked on the ruler, all from NCERT's printed pKa values. */
export const RULER_ACIDS = ['Hydrochloric acid', 'Trifluoroacetic acid', 'Benzoic acid', 'Acetic acid', 'Phenol', 'Ethanol'] as const

export function pkaRow(name: string): PkaRow {
  const row = PKA_VALUES.find((r) => r.name === name)
  if (!row) throw new Error(`No NCERT pKa row for ${name}`)
  return row
}

/** NCERT's four bands, named by pkaBand(). Each sample lies inside its band. */
export const RULER_BANDS = [
  { from: RULER_MIN, to: 1, sample: -3 },
  { from: 1, to: 5, sample: 3 },
  { from: 5, to: 15, sample: 10 },
  { from: 15, to: RULER_MAX, sample: 16 },
].map((b) => ({ ...b, name: pkaBand(b.sample) }))

/** Step 6 strip, strongest first (a subset of ACID_STRENGTH_SERIES, in the same order). */
export const STRIP_FORMULAS = ['CF₃COOH', 'ClCH₂COOH', 'HCOOH', 'C₆H₅COOH', 'CH₃COOH', 'CH₃CH₂COOH'] as const

export function stripIndices(): number[] {
  return STRIP_FORMULAS.map((f) => {
    const i = ACID_STRENGTH_SERIES.findIndex((s) => s.formula === f)
    if (i < 0) throw new Error(`${f} is not in ACID_STRENGTH_SERIES`)
    return i
  })
}
