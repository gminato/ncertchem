import {
  seriesName,
  spectrumRegion,
  transitionEnergy,
  transitionWavelengthNm,
  type SeriesName,
  type SpectrumRegion,
} from './bohr'
import { frequencyFromWavelength } from './radiation'
import { EV_JOULES } from './constants'

/** Highest principal quantum number the hydrogen simulation draws. */
export const SIM_LEVEL_MAX = 6

/** Left and right ends of the spectrum axis, in nanometres. */
export const AXIS_MIN_NM = 90
export const AXIS_MAX_NM = 2000

/** Visible range, drawn linearly in the middle of the axis. */
export const VISIBLE_MIN_NM = 380
export const VISIBLE_MAX_NM = 750

/**
 * Share of the strip given to each zone. The ultraviolet and infrared zones use
 * a log scale; the visible zone is linear in wavelength, so its lines stay apart.
 */
export const AXIS_ZONES = { ultraviolet: 0.2, visible: 0.5, infrared: 0.3 } as const

/** A transition between two levels, with everything the readout shows. */
export interface TransitionReadout {
  /** Higher level (larger n). */
  upper: number
  /** Lower level (smaller n). */
  lower: number
  /** Magnitude of the energy change, in joules (always positive). */
  deltaEnergyJ: number
  /** Magnitude of the energy change, in electronvolts. */
  deltaEnergyEv: number
  /** Photon wavelength in nanometres, from the Rydberg formula. */
  wavelengthNm: number
  /** Photon frequency in hertz, ν = c / λ. */
  frequencyHz: number
  series: SeriesName
  region: SpectrumRegion
  /** False when the wavelength lies beyond AXIS_MAX_NM and is drawn at the right edge. */
  onAxis: boolean
}

function requireLevel(n: number, name: string): void {
  if (!Number.isInteger(n) || n < 1 || n > SIM_LEVEL_MAX) {
    throw new RangeError(`${name} must be an integer from 1 to ${SIM_LEVEL_MAX} (received ${n})`)
  }
}

/**
 * Describes the transition between two levels of hydrogen. The order of the
 * arguments does not matter: the upper level is the larger n.
 *
 * @throws {RangeError} If either level is not an integer from 1 to 6, or they are equal
 */
export function transitionReadout(a: number, b: number): TransitionReadout {
  requireLevel(a, 'Level')
  requireLevel(b, 'Level')
  if (a === b) {
    throw new RangeError(`A transition needs two different levels (received ${a} and ${b})`)
  }
  const upper = Math.max(a, b)
  const lower = Math.min(a, b)
  const wavelengthNm = transitionWavelengthNm(upper, lower)
  const deltaEnergyJ = Math.abs(transitionEnergy(upper, lower))
  return {
    upper,
    lower,
    deltaEnergyJ,
    deltaEnergyEv: deltaEnergyJ / EV_JOULES,
    wavelengthNm,
    frequencyHz: frequencyFromWavelength(wavelengthNm * 1e-9),
    series: seriesName(lower) ?? 'Humphreys',
    region: spectrumRegion(wavelengthNm),
    onAxis: wavelengthNm <= AXIS_MAX_NM,
  }
}

/**
 * Position of a wavelength along the spectrum strip, as a fraction from 0 (at
 * AXIS_MIN_NM) to 1 (at AXIS_MAX_NM). Wavelengths outside the axis are clamped.
 */
export function spectrumAxisFraction(nm: number): number {
  const clamped = Math.min(AXIS_MAX_NM, Math.max(AXIS_MIN_NM, nm))
  const uv = AXIS_ZONES.ultraviolet
  const vis = AXIS_ZONES.visible
  const ir = AXIS_ZONES.infrared
  if (clamped <= VISIBLE_MIN_NM) {
    return (uv * Math.log(clamped / AXIS_MIN_NM)) / Math.log(VISIBLE_MIN_NM / AXIS_MIN_NM)
  }
  if (clamped <= VISIBLE_MAX_NM) {
    return uv + (vis * (clamped - VISIBLE_MIN_NM)) / (VISIBLE_MAX_NM - VISIBLE_MIN_NM)
  }
  return uv + vis + (ir * Math.log(clamped / VISIBLE_MAX_NM)) / Math.log(AXIS_MAX_NM / VISIBLE_MAX_NM)
}

/** Tick marks on the strip: a few wavelengths in each zone. */
export const AXIS_TICKS_NM: readonly number[] = [100, 400, 500, 600, 700, 1000, 1500, 2000]

/**
 * Chooses a pair of different levels for "random transition". The random source
 * is a parameter so tests can pass a fixed sequence.
 */
export function randomLevelPair(random: () => number = Math.random): [number, number] {
  const upper = 2 + Math.floor(random() * (SIM_LEVEL_MAX - 1))
  const lower = 1 + Math.floor(random() * (upper - 1))
  return [upper, lower]
}

/**
 * Applies a click on level `n` to an (upper, lower) pair. A level above the
 * upper end becomes the new upper end, and a level below the lower end becomes
 * the new lower end. A level between the two ends replaces whichever end it is
 * nearer to, so the pair always keeps upper > lower.
 */
export function pickLevel(
  pair: { upper: number; lower: number },
  n: number
): { upper: number; lower: number } {
  requireLevel(n, 'Level')
  if (n > pair.upper) return { upper: n, lower: pair.lower }
  if (n < pair.lower) return { upper: pair.upper, lower: n }
  if (n === pair.upper || n === pair.lower) return { ...pair }
  const nearerUpper = pair.upper - n <= n - pair.lower
  return nearerUpper ? { upper: n, lower: pair.lower } : { upper: pair.upper, lower: n }
}
