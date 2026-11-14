import { energyLevel, orbitRadiusPm, seriesName, transitionEnergy, transitionWavelengthNm } from '@/lib/chem/bohr'
import { joulesToEv } from '@/components/vocab/ladder'

/** Number of Steps in the BohrEmission animation. */
export const BOHR_STEP_COUNT = 4

/** Lowest and highest electron orbit shown (n). */
export const LEVEL_MIN = 1
export const LEVEL_MAX = 3

/**
 * Polar angle (radians) at which the electron sits when it drops from n = 3 to
 * n = 2. The emitted photon leaves from this point. A visual choice only.
 */
export const EMISSION_ANGLE = Math.PI / 3

/** Fraction of the photon's path covered during Step 2; Step 3 completes it. */
export const PHOTON_PROGRESS_STEP2 = 0.85

/** Ambient orbital speed on Step 0 (radians per second). */
export const AMBIENT_SPIN_RATE = 0.35

/**
 * A full, deterministic description of the animation at one instant. Each
 * Step is one such target state; tweens move the live state from wherever it
 * is to the next target, so scrolling in either direction lands on the same
 * picture.
 */
export interface BohrSnapshot {
  /** Electron orbit, continuous between LEVEL_MIN and LEVEL_MAX. */
  level: number
  /** Electron polar angle in radians. */
  angle: number
  /** Photon head progress along its path, 0 (at the atom) to 1 (at the strip). */
  photon: number
  /** Photon visibility, 0 to 1. */
  photonAlpha: number
  /** Spectral line strength, 0 (absent) to 1 (drawn). */
  line: number
  /** Energy pulse progress, 0 to 1. Rings are only visible between 0 and 1. */
  pulse: number
  /** Upward excitation arrow strength. */
  upArrow: number
  /** Downward emission arrow and ΔE label strength. */
  downArrow: number
}

/** Target state for each Step. */
export function snapshotForStep(step: number): BohrSnapshot {
  const clamped = clampStep(step)
  switch (clamped) {
    case 0:
      return {
        level: 1,
        angle: 0,
        photon: 0,
        photonAlpha: 0,
        line: 0,
        pulse: 1,
        upArrow: 0,
        downArrow: 0,
      }
    case 1:
      return {
        level: 3,
        angle: EMISSION_ANGLE,
        photon: 0,
        photonAlpha: 0,
        line: 0,
        pulse: 1,
        upArrow: 1,
        downArrow: 0,
      }
    case 2:
      return {
        level: 2,
        angle: EMISSION_ANGLE,
        photon: PHOTON_PROGRESS_STEP2,
        photonAlpha: 1,
        line: 0,
        pulse: 1,
        upArrow: 0,
        downArrow: 1,
      }
    default:
      return {
        level: 2,
        angle: EMISSION_ANGLE,
        photon: 1,
        photonAlpha: 0,
        line: 1,
        pulse: 1,
        upArrow: 0,
        downArrow: 1,
      }
  }
}

export function clampStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(BOHR_STEP_COUNT - 1, Math.max(0, Math.round(step)))
}

/**
 * Linearly interpolates a per-orbit quantity at a continuous level, using the
 * integer orbits either side of it. `valueForN` is only ever called with
 * integer n in [LEVEL_MIN, LEVEL_MAX].
 */
export function interpolateByLevel(level: number, valueForN: (n: number) => number): number {
  const clamped = Math.min(LEVEL_MAX, Math.max(LEVEL_MIN, level))
  const lo = Math.min(LEVEL_MAX, Math.floor(clamped))
  const hi = Math.min(LEVEL_MAX, lo + 1)
  const t = clamped - lo
  const a = valueForN(lo)
  const b = valueForN(hi)
  return a + (b - a) * t
}

/** Energy of orbit n in eV (negative: bound). */
export function orbitEnergyEv(n: number): number {
  return joulesToEv(energyLevel(n))
}

/** Magnitude of the 3 to 2 transition energy, in eV, formatted to 2 decimals. */
export function emissionDeltaEvLabel(): string {
  return Math.abs(joulesToEv(transitionEnergy(3, 2))).toFixed(2)
}

/** Wavelength of the 3 to 2 photon, rounded to whole nanometres. */
export function emissionWavelengthNm(): number {
  return Math.round(transitionWavelengthNm(3, 2))
}

/** Name of the spectral series that the 3 to 2 transition belongs to. */
export function emissionSeriesName(): string {
  return seriesName(2) ?? 'Balmer'
}

/** Visually-hidden description of what each Step shows, read by screen readers. */
export function stepDescription(step: number): string {
  const delta = emissionDeltaEvLabel()
  const nm = emissionWavelengthNm()
  switch (clampStep(step)) {
    case 0:
      return 'Ground state. The electron sits on the lowest orbit, n = 1.'
    case 1:
      return 'Excitation. The electron absorbs energy and moves outward to n = 3, with an energy pulse from the nucleus.'
    case 2:
      return `Emission. The electron falls from n = 3 to n = 2. A ${nm} nm photon leaves with ΔE = ${delta} eV and travels toward the spectrum.`
    default:
      return `Spectral line. The ${nm} nm photon lands at its wavelength on the spectrum strip: a sharp H-alpha line of the ${emissionSeriesName()} series.`
  }
}

/** Radius of orbit n in picometres, from the Bohr model (orbitRadiusPm). */
export function orbitRadius(n: number): number {
  return orbitRadiusPm(n)
}
