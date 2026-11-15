/**
 * Illustrative model of adsorption chromatography for the Unit 8 chromatography lab (Section 8.8.5).
 *
 * The textbook relations are exact: Rf = distance moved by the spot ÷ distance moved by the solvent
 * front, and Rf = 1 / (1 + k′) where k′ is the retention factor. The affinities below are NOT measured
 * values. They are chosen so that the separations look like a real run on silica gel, and the UI says so.
 */

/** Solvent strength on an illustrative 0 (non-polar, hexane-like) to 1 (polar, methanol-like) scale. */
export const SOLVENT_STRENGTH_MIN = 0
export const SOLVENT_STRENGTH_MAX = 1

/** Plate geometry used by ChromatographyPlate: origin line, solvent path and the 8 cm it stands for. */
export const PLATE_BASELINE_Y = 258
export const PLATE_SOLVENT_PX = 220
export const PLATE_SOLVENT_CM = 8

/** The Rf of a spot is read against the solvent front; a reading within this of the model counts as right. */
export const RF_READING_TOLERANCE = 0.03

export interface Analyte {
  /** Stable id, used as a key and in tests. */
  id: 'red' | 'blue' | 'green' | 'colourless' | 'unknown'
  /** Name shown in the UI. Illustrative, not a named compound. */
  label: string
  /**
   * Illustrative adsorption constant on silica gel. A larger value means the substance sticks more
   * strongly to the stationary phase and moves less far in any given solvent.
   */
  adsorption: number
  /** A colourless substance shows only after UV or iodine visualisation. */
  colourless: boolean
  /** Spot colour as a CSS colour. The unknown is drawn in neutral grey so its identity is not given away. */
  color: string
}

/**
 * Four known substances and one unknown. The unknown is modelled with the same adsorption constant
 * as the blue dye, so an Rf match in the same solvent identifies it; the student is not told that.
 */
export const ANALYTES: readonly Analyte[] = [
  { id: 'red', label: 'Red dye', adsorption: 0.6, colourless: false, color: 'var(--spot-2)' },
  { id: 'blue', label: 'Blue dye', adsorption: 1.4, colourless: false, color: 'var(--spot-1)' },
  { id: 'green', label: 'Green dye', adsorption: 2.4, colourless: false, color: 'var(--spot-3)' },
  { id: 'colourless', label: 'Colourless compound', adsorption: 1.0, colourless: true, color: 'var(--fg-muted)' },
  { id: 'unknown', label: 'Unknown', adsorption: 1.4, colourless: false, color: 'var(--fg-muted)' },
]

/** The known substances that the identification table compares against (the unknown is excluded). */
export const CANDIDATES: readonly Analyte[] = ANALYTES.filter((a) => a.id !== 'unknown')

/** Looks up an analyte by id. Throws for an unknown id, so a typo cannot pass silently. */
export function analyteById(id: Analyte['id']): Analyte {
  const found = ANALYTES.find((a) => a.id === id)
  if (!found) throw new RangeError(`No analyte with id ${id}`)
  return found
}

/** Clamps a solvent strength to the 0 to 1 scale. */
export function clampSolvent(s: number): number {
  return Math.min(SOLVENT_STRENGTH_MAX, Math.max(SOLVENT_STRENGTH_MIN, s))
}

/**
 * Retention factor k′ for an adsorption constant in a solvent of strength s. A more polar solvent
 * competes with the substance for the adsorbent, so k′ falls as s rises. Always positive.
 */
export function retentionFactor(adsorption: number, s: number): number {
  if (!(adsorption > 0)) throw new RangeError('Adsorption constant must be positive')
  return adsorption * (1.6 - clampSolvent(s))
}

/** Rf = 1 / (1 + k′). Always between 0 and 1, and has no unit. */
export function modelRf(adsorption: number, s: number): number {
  return 1 / (1 + retentionFactor(adsorption, s))
}

/**
 * Column progress at which a band reaches the bottom of the column. A strongly adsorbed band has a
 * larger value. Kept inside (0, 1) so every band is still visible while the eluent runs.
 */
export function columnArrival(adsorption: number, s: number): number {
  const k = retentionFactor(adsorption, s)
  return Math.min(0.98, Math.max(0.2, 0.2 + 0.22 * k))
}

export interface RfMatch {
  analyte: Analyte
  /** Model Rf of this candidate in the solvent used. */
  rf: number
  /** Absolute difference from the measured Rf. */
  difference: number
}

/**
 * Candidates whose model Rf in solvent s lies within `tolerance` of a measured Rf, closest first.
 * Rf values are only comparable in the same solvent, so the caller must pass the solvent used for
 * the standards and for the unknown.
 */
export function matchRf(measured: number, s: number, tolerance = RF_READING_TOLERANCE): RfMatch[] {
  return CANDIDATES.map((analyte) => {
    const rf = modelRf(analyte.adsorption, s)
    return { analyte, rf, difference: Math.abs(rf - measured) }
  })
    .filter((m) => m.difference <= tolerance)
    .sort((a, b) => a.difference - b.difference)
}

/** Model Rf for every known candidate in solvent s, in the order of CANDIDATES. */
export function candidateRfTable(s: number): { analyte: Analyte; rf: number }[] {
  return CANDIDATES.map((analyte) => ({ analyte, rf: modelRf(analyte.adsorption, s) }))
}

/** Plain-language name for the solvent strength, used beside the slider. */
export function solventLabel(s: number): string {
  const v = clampSolvent(s)
  if (v < 0.34) return 'less polar'
  if (v < 0.67) return 'medium polarity'
  return 'more polar'
}

/**
 * Groups items whose column arrivals differ by at most `tolerance` (default 1 %). Identical compounds
 * arrive together and must share one band and one fraction. Groups come out in elution order, each
 * with the arrival of its first member.
 */
export function elutionGroups<T>(
  items: readonly { arrival: number; value: T }[],
  tolerance = 0.01
): { arrival: number; members: T[] }[] {
  const sorted = [...items].sort((a, b) => a.arrival - b.arrival)
  const groups: { arrival: number; members: T[] }[] = []
  for (const item of sorted) {
    const last = groups[groups.length - 1]
    if (last && item.arrival - last.arrival <= tolerance) last.members.push(item.value)
    else groups.push({ arrival: item.arrival, members: [item.value] })
  }
  return groups
}
