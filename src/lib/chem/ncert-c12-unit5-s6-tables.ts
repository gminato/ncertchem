/**
 * Reference data from NCERT Class 12 Chemistry Part I, Unit 5 (Coordination Compounds),
 * Section 5.5.4 Crystal Field Theory, book pp. 131-133 (Figs 5.8 and 5.9, spectrochemical series).
 * Values are as NCERT prints them. Worked examples, Intext Questions and Exercises are not
 * transcribed (ADR-0001).
 */

/** Spectrochemical series, weakest field first, as NCERT prints it (p. 132). */
export interface SpectrochemicalLigand {
  readonly formula: string
  /** Display text with Unicode super/subscripts, no caret notation. */
  readonly display: string
  readonly rank: number
}

const SERIES: readonly string[] = [
  'I⁻', 'Br⁻', 'SCN⁻', 'Cl⁻', 'S²⁻', 'F⁻', 'OH⁻', 'C₂O₄²⁻', 'H₂O', 'NCS⁻', 'edta⁴⁻', 'NH₃', 'en', 'CN⁻', 'CO',
]

export const NCERT_SPECTROCHEMICAL_SERIES: readonly SpectrochemicalLigand[] = SERIES.map((d, i) => ({
  formula: d,
  display: d,
  rank: i + 1,
}))

/** Octahedral field: eg rises by 3/5 Δo, t2g falls by 2/5 Δo (p. 132). */
export const OCTAHEDRAL_EG_SHIFT = 3 / 5
export const OCTAHEDRAL_T2G_SHIFT = -2 / 5
export const OCTAHEDRAL_EG_COUNT = 2
export const OCTAHEDRAL_T2G_COUNT = 3

/** Tetrahedral splitting Δt = (4/9) Δo for same metal, ligands and distances (p. 133). */
export const TETRAHEDRAL_RATIO = 4 / 9

/** Tetrahedral field: t2 rises by 2/5 Δt, e falls by 3/5 Δt (Fig. 5.9, p. 133). */
export const TETRAHEDRAL_T2_SHIFT = 2 / 5
export const TETRAHEDRAL_E_SHIFT = -3 / 5
export const TETRAHEDRAL_T2_COUNT = 3
export const TETRAHEDRAL_E_COUNT = 2

export interface OctahedralConfig {
  readonly d: number
  readonly t2g: number
  readonly eg: number
  readonly unpaired: number
}

export interface TetrahedralConfig {
  readonly d: number
  readonly e: number
  readonly t2: number
  readonly unpaired: number
}

/**
 * Octahedral occupation of d^n. d1-d3 and d8-d10 have one arrangement; d4-d7 have a high spin
 * (weak field, Δo < P) and a low spin (strong field, Δo > P) arrangement (p. 132).
 */
export function octahedralConfig(d: number, strongField: boolean): OctahedralConfig {
  if (!Number.isInteger(d) || d < 0 || d > 10) throw new RangeError('d must be an integer 0 to 10')
  let t2g: number
  if (strongField) {
    t2g = Math.min(d, 6)
  } else {
    t2g = d <= 3 ? d : d <= 5 ? 3 : Math.min(d - 2, 6)
  }
  const eg = d - t2g
  const unpaired = (t2g <= 3 ? t2g : 6 - t2g) + (eg <= 2 ? eg : 4 - eg)
  return { d, t2g, eg, unpaired }
}

/**
 * Tetrahedral occupation of d^n. Because Δt = (4/9) Δo is small, low spin configurations are
 * rarely observed (p. 133); electrons fill e (lower pair) then t2 (upper triple) singly first.
 */
export function tetrahedralConfig(d: number): TetrahedralConfig {
  if (!Number.isInteger(d) || d < 0 || d > 10) throw new RangeError('d must be an integer 0 to 10')
  const e = d <= 2 ? d : d <= 5 ? 2 : Math.min(d - 3, 4)
  const t2 = d - e
  const unpaired = (e <= 2 ? e : 4 - e) + (t2 <= 3 ? t2 : 6 - t2)
  return { d, e, t2, unpaired }
}

/** Energies in units of Δo, relative to the spherical-field average (barycentre). */
export function octahedralLevelEnergies(): { t2g: number; eg: number } {
  return { t2g: OCTAHEDRAL_T2G_SHIFT, eg: OCTAHEDRAL_EG_SHIFT }
}

/** Energies in units of Δt, relative to the spherical-field average (barycentre). */
export function tetrahedralLevelEnergies(): { e: number; t2: number } {
  return { e: TETRAHEDRAL_E_SHIFT, t2: TETRAHEDRAL_T2_SHIFT }
}

export function tetrahedralSplitting(deltaO: number): number {
  return TETRAHEDRAL_RATIO * deltaO
}

/** Weak field when Δo < P (high spin); strong field when Δo > P (low spin). */
export function fieldType(deltaO: number, pairing: number): 'weak' | 'strong' {
  return deltaO < pairing ? 'weak' : 'strong'
}

export const NCERT_UNIT5_S6_ERRATA: readonly { id: string; where: string; ncertSays: string; correct: string }[] = [
  {
    id: 'fig-5-8-orbital-labels',
    where: 'Section 5.5.4, p. 131',
    ncertSays: 'dx²−y² and dz² are raised; dxy, dyz, dxz are lowered.',
    correct: 'Kept as printed; no discrepancy found.',
  },
]
