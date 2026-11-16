/**
 * Pure data for the huckel-count Scrolly (Section 9.5.3): four rings counted in turn, each line of the
 * count taken from huckel() through ringReport(), never typed here.
 */

import { ringReport, type RingReport, type RingVerdict } from '@/lib/chem/huckel-gallery'

/** The rings of the Steps, in order: benzene, naphthalene, anthracene, cyclooctatetraene. */
export const HUCKEL_COUNT_RINGS = ['benzene', 'naphthalene', 'anthracene', 'cyclooctatetraene'] as const
export type HuckelCountRing = (typeof HUCKEL_COUNT_RINGS)[number]

/** The count line for a ring: the π electrons, the 4n + 2 arithmetic when it fits, and the verdict. */
export interface CountLine {
  piElectrons: number
  /** `6 = 4 × 1 + 2` when the count fits 4n + 2, else the statement that it does not. */
  arithmetic: string
  verdict: RingVerdict
  /** Number of C=C double bonds in the Kekulé drawing; each supplies two π electrons. */
  doubleBonds: number
}

/** The count of a gallery ring as printed on its Step. */
export function countLine(id: HuckelCountRing): CountLine {
  const r: RingReport = ringReport(id)
  const doubleBonds = r.graph.bonds.filter((b) => b.order === 2).length
  const arithmetic =
    r.n !== undefined
      ? `${r.piElectrons} = 4 × ${r.n} + 2`
      : `${r.piElectrons} = 4 × ${r.piElectrons / 4}, so not 4n + 2`
  return { piElectrons: r.piElectrons, arithmetic, verdict: r.verdict, doubleBonds }
}
