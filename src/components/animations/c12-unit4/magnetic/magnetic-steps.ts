import {
  dElectronCount,
  formatMoment,
  ionConfig,
  spinOnlyMoment,
  unpairedElectrons,
} from '@/lib/chem/dblock'
import { NCERT_MAGNETIC_MOMENTS } from '@/lib/chem/ncert-c12-unit4-tables'

/** Number of Scrolly Steps (P6 Prose). */
export const STEP_COUNT = 5

/** Iron(II), 3d⁶ high spin: n = 4. Looked up from the lib, not typed. */
export const FE2_CONFIG = ionConfig('Fe', 2)
export const FE2_N = unpairedElectrons(dElectronCount('Fe', 2))

/** Zinc(II), 3d¹⁰: no unpaired electrons, so a weak push out of the field (schematic). */
export const ZN2_N = unpairedElectrons(dElectronCount('Zn', 2))
export const DIAMAGNETIC_PULL = -0.15

/** Largest spin-only moment on the ladder (d⁵); pulls are drawn in proportion to it. */
export const MAX_MOMENT = spinOnlyMoment(5)

/** Balance pull (−1…+1) in proportion to a spin-only moment (schematic, not to scale). */
export function pullFor(mu: number): number {
  return mu / MAX_MOMENT
}

/** Balance pull for iron(II): n = 4 gives 4.90 / 5.92 ≈ 0.83. */
export const FE2_PULL = pullFor(spinOnlyMoment(FE2_N))

/** Cr³⁺, 3d³: the Step 4 worked count (n = 3). */
export const CR3_CONFIG = ionConfig('Cr', 3)
export const CR3_N = unpairedElectrons(dElectronCount('Cr', 3))

export interface LadderPoint {
  /** d-electron count, 1 to 10. */
  d: number
  /** Unpaired electrons, high spin. */
  n: number
  /** Spin-only moment, unrounded (BM). */
  mu: number
  /** Formatted to 3 s.f. (2.83 for n = 2). */
  label: string
}

/** Spin-only moments for d¹ … d¹⁰ (high spin), from the lib. */
export function spinOnlyLadder(): LadderPoint[] {
  const out: LadderPoint[] = []
  for (let d = 1; d <= 10; d++) {
    const n = unpairedElectrons(d)
    const mu = spinOnlyMoment(n)
    out.push({ d, n, mu, label: formatMoment(mu) })
  }
  return out
}

export interface ObservedPoint {
  d: number
  ion: string
  lo: number
  hi: number
  /** True when Table 4.7 gives a range (drawn as a bar). */
  range: boolean
  printed: string
}

/** Table 4.7 observed moments for the ions with d1 … d10 (data as printed in the lib). */
export function observedLadder(): ObservedPoint[] {
  return NCERT_MAGNETIC_MOMENTS.filter((row) => row.dCount >= 1).map((row) => {
    const range = typeof row.observedBm !== 'number'
    const lo = typeof row.observedBm === 'number' ? row.observedBm : row.observedBm[0]
    const hi = typeof row.observedBm === 'number' ? row.observedBm : row.observedBm[1]
    return { d: row.dCount, ion: row.ion, lo, hi, range, printed: row.observedAsPrinted }
  })
}

/** Aria labels per Step (0-based). */
export const STEP_ARIA = [
  'Iron(II) sulphate pulled toward a magnet on a balance, zinc(II) sulphate barely moves',
  'Three responses to a magnet: diamagnetic pushed out, paramagnetic drawn in, ferromagnetic drawn in strongly',
  'Fe²⁺ 3d⁶ boxes: one orbital holds a pair whose spins cancel, four single electrons give a net moment',
  'Cr³⁺ 3d³ boxes with three parallel spins, and the formula μ = √(n(n + 2)) BM giving 3.87 BM',
  'Spin-only moment against the number of d electrons, with Table 4.7 measured values beside each point',
] as const

export function clampStep(step: number): number {
  return Math.min(Math.max(Math.round(step), 0), STEP_COUNT - 1)
}
