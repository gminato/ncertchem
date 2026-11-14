import { deBroglieWavelength } from '@/lib/chem/matter-waves'
import { ELECTRON_MASS_KG } from '@/lib/chem/constants'
import { photonMomentum } from '@/lib/chem/wave-orbit'

/** Clamps a Step index to the Steps a Scrolly defines, 0 to count − 1. */
function clampIndex(step: number, count: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(count - 1, Math.max(0, Math.round(step)))
}

// ---------------------------------------------------------------------------
// De Broglie: cricket ball against an electron, on a log scale of wavelengths
// ---------------------------------------------------------------------------

/** A cricket ball of 0.16 kg moving at 40 m/s (the Learner's own example). */
export const BALL_MASS_KG = 0.16
export const BALL_SPEED_MS = 40
/** An electron moving at 1.0 × 10⁶ m/s. */
export const ELECTRON_SPEED_MS = 1.0e6

export const SCALE_STEP_COUNT = 4

/** Wavelengths (m) of the two particles, from matter-waves.ts. */
export const BALL_WAVELENGTH_M = deBroglieWavelength(BALL_MASS_KG, BALL_SPEED_MS)
export const ELECTRON_WAVELENGTH_M = deBroglieWavelength(ELECTRON_MASS_KG, ELECTRON_SPEED_MS)

/** How many times longer the electron's wavelength is than the ball's. */
export function scaleRatio(): number {
  return ELECTRON_WAVELENGTH_M / BALL_WAVELENGTH_M
}

export interface ScaleTargets {
  ball: number
  electron: number
  bohr: number
  ratio: number
  [key: string]: number
}

/** Which markers are visible at each Scrolly Step of the de Broglie scale. */
export function scaleTargets(step: number): ScaleTargets {
  const s = clampIndex(step, SCALE_STEP_COUNT)
  return {
    ball: s >= 1 ? 1 : 0,
    electron: s >= 2 ? 1 : 0,
    bohr: s >= 3 ? 1 : 0,
    ratio: s >= 3 ? 1 : 0,
  }
}

// ---------------------------------------------------------------------------
// De Broglie waves on Bohr orbits
// ---------------------------------------------------------------------------

/** Display radius (SVG units) of orbit n: proportional to n², so 11 · n². */
export const ORBIT_DISPLAY_UNIT = 11

export const ORBIT_STEP_COUNT = 5

export interface OrbitTargets {
  /** Display radius of the orbit. */
  radius: number
  /** Number of wavelengths that fit around the orbit. */
  waves: number
  /** 1 when the wave is drawn. */
  wave: number
  /** 1 when the seam, where the wave fails to close, is marked. */
  seam: number
  [key: string]: number
}

/** The orbit and wave count shown at each Scrolly Step. */
export function orbitTargets(step: number): OrbitTargets {
  const s = clampIndex(step, ORBIT_STEP_COUNT)
  const n = s === 4 ? 3 : s + 1
  const waves = s === 4 ? 3.5 : n
  return {
    radius: ORBIT_DISPLAY_UNIT * n * n,
    waves,
    wave: 1,
    seam: s === 4 ? 1 : 0,
  }
}

// ---------------------------------------------------------------------------
// Heisenberg: locating an electron with light
// ---------------------------------------------------------------------------

/** Long wavelength: red light at 700 nm. Short: 0.1 nm, an X-ray. */
export const LONG_WAVELENGTH_NM = 700
export const SHORT_WAVELENGTH_NM = 0.1

export const MICROSCOPE_STEP_COUNT = 4

export interface MicroscopeTargets {
  /** Photon visible (1) or not (0). */
  photon: number
  /** Radius of the uncertainty cloud around the electron, in SVG units. */
  cloud: number
  /** Length of the recoil arrow, in SVG units. */
  kick: number
  [key: string]: number
}

/** Position cloud and recoil arrow for each Step. Shorter light: smaller cloud, bigger kick. */
export function microscopeTargets(step: number): MicroscopeTargets {
  const s = clampIndex(step, MICROSCOPE_STEP_COUNT)
  switch (s) {
    case 0:
      return { photon: 0, cloud: 46, kick: 0 }
    case 1:
      return { photon: 1, cloud: 46, kick: 0 }
    case 2:
      return { photon: 1, cloud: 10, kick: 150 }
    default:
      return { photon: 0, cloud: 10, kick: 150 }
  }
}

/** Ratio of the recoil from 0.1 nm light to the electron's own momentum at 10⁶ m/s. */
export function shortLightKickRatio(): number {
  return photonMomentum(SHORT_WAVELENGTH_NM * 1e-9) / (ELECTRON_MASS_KG * ELECTRON_SPEED_MS)
}

/** Ratio of the recoil from 700 nm light to the electron's own momentum at 10⁶ m/s. */
export function longLightKickRatio(): number {
  return photonMomentum(LONG_WAVELENGTH_NM * 1e-9) / (ELECTRON_MASS_KG * ELECTRON_SPEED_MS)
}
