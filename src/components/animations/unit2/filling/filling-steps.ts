import { electronConfiguration } from '@/lib/chem/quantum'
import { elementInfo, exchangePairs, placementOrder } from '@/lib/chem/orbital-builder'

/**
 * Deterministic targets for the three filling Scrolly Animations. Every Step is
 * one target state. Tweens move the live state from wherever it is to the next
 * target, so scrolling either way lands on the same picture.
 */

export function clampStep(step: number, count: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(count - 1, Math.max(0, Math.round(step)))
}

// ---------------------------------------------------------------------------
// (a) The n + l diagonal and the electron counter
// ---------------------------------------------------------------------------

/** Atomic numbers the counter visits, one per Step. */
export const AUFBAU_Z_STEPS = [0, 10, 20, 24, 36] as const
export const AUFBAU_STEP_COUNT = AUFBAU_Z_STEPS.length

export interface AufbauSnapshot {
  /** Electron counter, continuous; rounded to a whole Z when drawn. */
  z: number
  /** Progress of the diagonal arrows being drawn, 0 to 1. */
  draw: number
}

export function aufbauTargetForStep(step: number): AufbauSnapshot {
  const index = clampStep(step, AUFBAU_STEP_COUNT)
  return { z: AUFBAU_Z_STEPS[index], draw: 1 }
}

/** Visually hidden summary of the diagonal Step, read by screen readers. */
export function aufbauDescription(step: number): string {
  const index = clampStep(step, AUFBAU_STEP_COUNT)
  if (index === 0) {
    return 'The diagonal rule. Each arrow runs from the top right to the bottom left, through subshells with the same value of n + l. Electrons fill them in that order.'
  }
  const Z = AUFBAU_Z_STEPS[index]
  const { name, symbol } = elementInfo(Z)
  const config = electronConfiguration(Z).text
  if (Z === 24) {
    return `Z = 24, ${name} (${symbol}). The plain Aufbau order predicts 4s² 3d⁴, but the ground state is ${config}.`
  }
  return `Z = ${Z}, ${name} (${symbol}). Ground state: ${config}.`
}

// ---------------------------------------------------------------------------
// (b) Building up N, O and Cr, one electron at a time
// ---------------------------------------------------------------------------

/**
 * Electrons placed at each Step, in the single build order for chromium (Z = 24).
 * Nitrogen is the first 7 placements and oxygen the first 8, so one sequence
 * covers all three elements.
 */
export const BUILD_PLACED_STEPS = [0, 4, 7, 8, 24] as const
export const BUILD_STEP_COUNT = BUILD_PLACED_STEPS.length

export interface BuildSnapshot {
  /** Electrons placed so far, continuous; rounded to a whole number when drawn. */
  placed: number
}

export function buildTargetForStep(step: number): BuildSnapshot {
  return { placed: BUILD_PLACED_STEPS[clampStep(step, BUILD_STEP_COUNT)] }
}

/** The full build order for chromium, used by the animation. */
export const BUILD_ORDER = placementOrder(24)

/** Visually hidden summary of the build Step, read by screen readers. */
export function buildDescription(step: number): string {
  const index = clampStep(step, BUILD_STEP_COUNT)
  switch (index) {
    case 0:
      return 'Empty orbitals. Each box is an orbital. An arrow is an electron: up for spin +½, down for spin −½.'
    case 1:
      return 'The first four electrons fill 1s and 2s. Each orbital takes a pair with opposite spins.'
    case 2:
      return 'Nitrogen, Z = 7. The three 2p electrons go into three separate boxes with parallel spins, not into one box as a pair.'
    case 3:
      return 'Oxygen, Z = 8. The fourth 2p electron finally pairs up, because every 2p orbital already holds one electron.'
    default:
      return 'Chromium, Z = 24. After 3p is full, 4s takes one electron and 3d takes five with parallel spins: 3d⁵ 4s¹, the half-filled exception.'
  }
}

// ---------------------------------------------------------------------------
// (c) Exchange pairs in d5 and d4
// ---------------------------------------------------------------------------

export const EXCHANGE_STEP_COUNT = 4
const EXCHANGE_D5 = [0, exchangePairs(5), exchangePairs(5), exchangePairs(5)] as const
const EXCHANGE_D4 = [0, 0, exchangePairs(4), exchangePairs(4)] as const

export interface ExchangeSnapshot {
  /** Exchange pairs drawn for the d5 row, continuous. */
  five: number
  /** Exchange pairs drawn for the d4 row, continuous. */
  four: number
}

export function exchangeTargetForStep(step: number): ExchangeSnapshot {
  const index = clampStep(step, EXCHANGE_STEP_COUNT)
  return { five: EXCHANGE_D5[index], four: EXCHANGE_D4[index] }
}

export function exchangeDescription(step: number): string {
  const index = clampStep(step, EXCHANGE_STEP_COUNT)
  const d5 = exchangePairs(5)
  const d4 = exchangePairs(4)
  switch (index) {
    case 0:
      return 'Five 3d electrons, one in each orbital, all spin up. Any two of them with the same spin can swap places.'
    case 1:
      return `Drawing every swap between two same-spin electrons. The half-filled d⁵ subshell has ${d5} such pairs.`
    case 2:
      return `Now d⁴, with four parallel electrons. It has ${d4} pairs, fewer than d⁵.`
    default:
      return `Side by side: d⁵ gives ${d5} exchanges and d⁴ gives ${d4}. More exchange energy means extra stability, which is why Cr and Cu adopt d⁵ and d¹⁰.`
  }
}
