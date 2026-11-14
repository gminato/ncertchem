import { NCERT_TABLE_3_1_TRIADS, NCERT_TABLE_3_2_OCTAVES, triadMean } from '@/lib/chem/ncert-unit3-tables'
import { atomicVolumeCurve, type AtomicVolumePoint } from '@/lib/chem/solid-density'
import { clampIndex } from './steps'

// ---------------------------------------------------------------------------
// Döbereiner's triads (NCERT Table 3.1)
// ---------------------------------------------------------------------------

export interface TriadStep {
  /** Index into NCERT_TABLE_3_1_TRIADS. */
  triad: number
  /** The dashed mean marker is drawn. */
  showMean: boolean
  /** The middle element's dot is drawn (it starts at the mean, then slides to its own mass). */
  showMiddle: boolean
  /** The middle dot sits at its own atomic weight rather than at the mean. */
  middleAtOwnWeight: boolean
}

export const TRIAD_STEP_COUNT = 4

export function triadStep(step: number): TriadStep {
  switch (clampIndex(step, TRIAD_STEP_COUNT)) {
    case 0:
      return { triad: 0, showMean: true, showMiddle: false, middleAtOwnWeight: false }
    case 1:
      return { triad: 0, showMean: true, showMiddle: true, middleAtOwnWeight: true }
    case 2:
      return { triad: 1, showMean: true, showMiddle: true, middleAtOwnWeight: false }
    default:
      return { triad: 2, showMean: true, showMiddle: true, middleAtOwnWeight: false }
  }
}

/** The mean of the outer two weights of the triad shown at this step. */
export function triadStepMean(step: number): number {
  return triadMean(NCERT_TABLE_3_1_TRIADS.rows[triadStep(step).triad])
}

// ---------------------------------------------------------------------------
// Newlands' octaves (NCERT Table 3.2), laid out seven to a row as printed
// ---------------------------------------------------------------------------

/** The 16 elements of Table 3.2 in printed order (Li … Ca). */
export const OCTAVE_ELEMENTS: readonly { symbol: string; weight: number }[] = NCERT_TABLE_3_2_OCTAVES.rows
  .flat()
  .map((e) => ({ symbol: e.symbol, weight: e.value }))

export const OCTAVE_STEP_COUNT = 4

export interface OctaveStep {
  /** Indexes into OCTAVE_ELEMENTS that are lit. */
  lit: readonly number[]
  /** Draw the arc from index 0 to index 7 (the eighth element echoing the first). */
  echoArc: boolean
  /** Draw the marker past calcium (index 15) where the pattern is said to break down. */
  breakMarker: boolean
}

export function octaveStep(step: number): OctaveStep {
  switch (clampIndex(step, OCTAVE_STEP_COUNT)) {
    case 0:
      return { lit: [0], echoArc: false, breakMarker: false }
    case 1:
      return { lit: [0, 1, 2, 3, 4, 5, 6], echoArc: false, breakMarker: false }
    case 2:
      return { lit: [0, 7], echoArc: true, breakMarker: false }
    default:
      return { lit: [0, 7, 14, 15], echoArc: true, breakMarker: true }
  }
}

// ---------------------------------------------------------------------------
// Lothar Meyer's atomic-volume curve (solids, plotted against atomic mass)
// ---------------------------------------------------------------------------

export const MEYER_STEP_COUNT = 4

/** The largest atomic number revealed at each Step. */
const MEYER_MAX_Z = [6, 11, 20, 56] as const

export interface MeyerStep {
  maxZ: number
  /** Points visible at this step, in atomic-mass order. */
  points: readonly AtomicVolumePoint[]
  /** Symbols labelled on the curve (the alkali metals revealed so far). */
  labelled: readonly string[]
}

export const ALKALI_SYMBOLS: readonly string[] = ['Li', 'Na', 'K', 'Rb', 'Cs']

const CURVE = atomicVolumeCurve(56)

export function meyerStep(step: number): MeyerStep {
  const maxZ = MEYER_MAX_Z[clampIndex(step, MEYER_STEP_COUNT)]
  const points = CURVE.filter((p) => p.Z <= maxZ)
  const labelled = ALKALI_SYMBOLS.filter((s) => points.some((p) => p.symbol === s))
  return { maxZ, points, labelled }
}

// ---------------------------------------------------------------------------
// Mendeleev's gaps on the 1869 partial table
// ---------------------------------------------------------------------------

export const GAP_STEP_COUNT = 4

export interface GapStep {
  /** Atomic numbers outlined as the gaps in focus. */
  gapZ: readonly number[]
  /** Atomic numbers highlighted as the swapped pair. */
  swapZ: readonly number[]
  /** Show the predicted values beneath the gaps. */
  showPredictions: boolean
}

export function gapStep(step: number): GapStep {
  switch (clampIndex(step, GAP_STEP_COUNT)) {
    case 0:
      return { gapZ: [], swapZ: [], showPredictions: false }
    case 1:
      return { gapZ: [31, 32], swapZ: [], showPredictions: false }
    case 2:
      return { gapZ: [], swapZ: [52, 53], showPredictions: false }
    default:
      return { gapZ: [31, 32], swapZ: [], showPredictions: true }
  }
}
