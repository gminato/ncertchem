import { octahedralConfig, type OctahedralConfig } from '@/lib/chem/ncert-c12-unit5-s6-tables'

export const HIGH_LOW_STEP_COUNT = 5

export function clampHighLowStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(HIGH_LOW_STEP_COUNT - 1, Math.max(0, Math.trunc(step)))
}

export type HighLowStepKind = 'd1-to-d3' | 'fourth-choice' | 'weak-high-spin' | 'strong-low-spin' | 'd4-to-d7-grid'

export interface D4ToD7Entry {
  readonly d: number
  readonly weak: OctahedralConfig
  readonly strong: OctahedralConfig
}

export interface HighLowStepState {
  readonly index: number
  readonly kind: HighLowStepKind
  readonly config: OctahedralConfig
  /** Relative bar heights (0..1) for visual comparison of Δo and P. */
  readonly deltaBar: number
  readonly pairingBar: number
  /** Visual splitting gap multiplier (1 = normal, 0.72 = narrow weak field, 1.25 = wide strong field). */
  readonly gapScale: number
  readonly grid: readonly D4ToD7Entry[]
  readonly ariaLabel: string
}

const D4_TO_D7: readonly D4ToD7Entry[] = [4, 5, 6, 7].map((d) => ({
  d,
  weak: octahedralConfig(d, false),
  strong: octahedralConfig(d, true),
}))

export function highLowStepState(step: number): HighLowStepState {
  const index = clampHighLowStep(step)
  switch (index) {
    case 0:
      return {
        index,
        kind: 'd1-to-d3',
        config: octahedralConfig(3, false),
        deltaBar: 0.55,
        pairingBar: 0.55,
        gapScale: 1,
        grid: D4_TO_D7,
        ariaLabel: 'Three electrons fill the three t2g orbitals singly with parallel spins; this arrangement is identical in weak and strong fields.',
      }
    case 1:
      return {
        index,
        kind: 'fourth-choice',
        config: octahedralConfig(3, false),
        deltaBar: 0.55,
        pairingBar: 0.55,
        gapScale: 1,
        grid: D4_TO_D7,
        ariaLabel: 'The fourth electron can either jump to eg at a cost of Δo or pair in t2g at a cost of P; the smaller cost wins.',
      }
    case 2:
      return {
        index,
        kind: 'weak-high-spin',
        config: octahedralConfig(4, false),
        deltaBar: 0.42,
        pairingBar: 0.82,
        gapScale: 0.76,
        grid: D4_TO_D7,
        ariaLabel: 'Weak field where Δo is smaller than P: the fourth electron enters eg, giving t2g3 eg1 with 4 unpaired electrons (high spin).',
      }
    case 3:
      return {
        index,
        kind: 'strong-low-spin',
        config: octahedralConfig(4, true),
        deltaBar: 0.92,
        pairingBar: 0.56,
        gapScale: 1.24,
        grid: D4_TO_D7,
        ariaLabel: 'Strong field where Δo is larger than P: the fourth electron pairs in t2g, giving t2g4 eg0 with 2 unpaired electrons (low spin).',
      }
    default:
      return {
        index,
        kind: 'd4-to-d7-grid',
        config: octahedralConfig(4, true),
        deltaBar: 0.92,
        pairingBar: 0.56,
        gapScale: 1,
        grid: D4_TO_D7,
        ariaLabel: 'Comparison of weak field high spin and strong field low spin configurations across d4, d5, d6 and d7; strong field always has fewer unpaired electrons.',
      }
  }
}
