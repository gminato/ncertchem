import { EV_JOULES, PLANCK, SPEED_OF_LIGHT } from '@/lib/chem/constants'
import { photonEnergyEv } from '@/lib/chem/radiation'
import {
  WORK_FUNCTIONS_EV,
  photoelectronKE,
  thresholdFrequency,
  thresholdWavelengthNm,
  type PhotoelectronResult,
} from '@/lib/chem/photoelectric'

/** The six metals of NCERT Table 2.2, in the table's order. Every value comes from WORK_FUNCTIONS_EV. */
export const METALS: readonly string[] = Object.keys(WORK_FUNCTIONS_EV)

export const WAVELENGTH_MIN_NM = 100
export const WAVELENGTH_MAX_NM = 800

/** Slope of the KE-versus-ν line in eV per hertz: h / e, from the NCERT h and e values. */
export const SLOPE_EV_PER_HZ = PLANCK / EV_JOULES

/**
 * Everything the readout shows for one metal at one wavelength. Values are
 * computed from WORK_FUNCTIONS_EV through photoelectronKE and the lib helpers.
 */
export interface BeamReadout {
  metal: string
  workFunctionEv: number
  wavelengthNm: number
  frequencyHz: number
  photonEv: number
  thresholdHz: number
  thresholdNm: number
  emitted: boolean
  /** Maximum KE of an ejected electron in eV (0 when nothing is ejected). */
  keEv: number
  /** Maximum speed of an ejected electron in m/s (0 when nothing is ejected). */
  maxSpeedMs: number
}

/**
 * The readout for a metal and a wavelength. Throws a RangeError for an unknown
 * metal or a wavelength outside the simulation's range.
 */
export function beamReadout(metal: string, wavelengthNm: number): BeamReadout {
  const workFunctionEv = WORK_FUNCTIONS_EV[metal]
  if (workFunctionEv === undefined) {
    throw new RangeError(`Unknown metal "${metal}"`)
  }
  if (!(wavelengthNm >= WAVELENGTH_MIN_NM && wavelengthNm <= WAVELENGTH_MAX_NM)) {
    throw new RangeError(`Wavelength must be from ${WAVELENGTH_MIN_NM} to ${WAVELENGTH_MAX_NM} nm`)
  }
  const frequencyHz = SPEED_OF_LIGHT / (wavelengthNm * 1e-9)
  const result: PhotoelectronResult = photoelectronKE({ wavelengthNm, workFunctionEv })
  return {
    metal,
    workFunctionEv,
    wavelengthNm,
    frequencyHz,
    photonEv: photonEnergyEv({ frequencyHz }),
    thresholdHz: thresholdFrequency(workFunctionEv),
    thresholdNm: thresholdWavelengthNm(workFunctionEv),
    emitted: result.emitted,
    keEv: result.keEv,
    maxSpeedMs: result.maxSpeedMs,
  }
}

/**
 * The Einstein line for the KE plot: KE = hν − W₀ in eV, floored at 0 below the
 * threshold, where no electron leaves and so there is no kinetic energy to show.
 */
export function keLineEv(frequencyHz: number, workFunctionEv: number): number {
  return Math.max(0, SLOPE_EV_PER_HZ * frequencyHz - workFunctionEv)
}

/** Pace of the on-screen electrons: px/s per √eV. Only the on-screen pace uses it. */
export const VISUAL_SPEED_PER_SQRT_EV = 70

/**
 * On-screen speed of an ejected electron in px/s. It is proportional to √KE,
 * as the physical speed is (v = √(2KE / m_e)). Zero when nothing is ejected.
 */
export function visualElectronSpeed(keEv: number): number {
  if (!(keEv > 0)) return 0
  return VISUAL_SPEED_PER_SQRT_EV * Math.sqrt(keEv)
}

/** Photons arriving per second at full intensity (on screen). */
export const PHOTONS_PER_SECOND_AT_FULL = 12

/**
 * Photons arriving per second at the plate, for the animation. Proportional to
 * the intensity (0 to 100 %). Each photon above threshold ejects one electron,
 * so the electron rate is proportional to the intensity as well.
 */
export function photonsPerSecond(intensityPct: number): number {
  const clamped = Math.min(100, Math.max(0, intensityPct))
  return (PHOTONS_PER_SECOND_AT_FULL * clamped) / 100
}

/** The headline statement under the stage, from the readout. */
export function thresholdMessage(readout: BeamReadout): string {
  if (readout.emitted) {
    return 'Above threshold: electrons leave the plate. Their number grows with intensity, and their maximum speed depends only on the wavelength.'
  }
  return 'Below threshold: 0 electrons, at any intensity.'
}

/** Half-angle (radians) from the surface normal within which ejected electrons spread. */
export const EJECT_SPREAD_RAD = 0.6

// ---------------------------------------------------------------------------
// Particle emitter: a pure stepper, so the physics of the animation can be tested.
// ---------------------------------------------------------------------------

export interface PhotonPacket {
  /** x of the packet's leading edge, in stage units. */
  x: number
}

export interface EjectedElectron {
  x: number
  y: number
  vx: number
  vy: number
}

export interface EmitterState {
  photons: PhotonPacket[]
  electrons: EjectedElectron[]
  /** Time carried over until the next photon is due, in seconds. */
  photonClock: number
  /** Brief highlight on the plate after an absorption, 1 to 0. */
  flash: number
  /** Electrons ejected since the state was created. */
  ejectedCount: number
}

export interface EmitterGeometry {
  lampX: number
  plateX: number
  plateTop: number
  plateBottom: number
  tubeLeft: number
  beamY: number
  photonSpeed: number
}

export const STAGE_GEOMETRY: EmitterGeometry = {
  lampX: 112,
  plateX: 520,
  plateTop: 112,
  plateBottom: 226,
  tubeLeft: 158,
  beamY: 170,
  photonSpeed: 210,
}

export function createEmitterState(): EmitterState {
  return { photons: [], electrons: [], photonClock: 0, flash: 0, ejectedCount: 0 }
}

/** A tiny seeded generator (mulberry32), so every run and every test is repeatable. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface EmitterInput {
  /** Photons per second, from {@link photonsPerSecond}. */
  rate: number
  /** Whether the photon energy exceeds the work function (from beamReadout). */
  emitted: boolean
  /** On-screen electron speed, from {@link visualElectronSpeed}. */
  electronSpeed: number
  geometry?: EmitterGeometry
}

/**
 * Advances the emitter by `dt` seconds, in place. Photons are launched at
 * `rate` per second, travel to the plate and are absorbed there. An absorbed
 * photon ejects an electron only when `emitted` is true. Electrons leave the
 * plate's left face, spread within EJECT_SPREAD_RAD of the normal, and are
 * removed when they reach the end of the tube.
 */
export function stepEmitter(
  state: EmitterState,
  dt: number,
  input: EmitterInput,
  random: () => number
): void {
  const g = input.geometry ?? STAGE_GEOMETRY

  state.photonClock += dt * input.rate
  while (state.photonClock >= 1) {
    state.photonClock -= 1
    state.photons.push({ x: g.lampX })
  }

  const keep: PhotonPacket[] = []
  for (const photon of state.photons) {
    photon.x += g.photonSpeed * dt
    if (photon.x >= g.plateX) {
      state.flash = 1
      if (input.emitted) {
        state.ejectedCount += 1
        const spread = (random() * 2 - 1) * EJECT_SPREAD_RAD
        state.electrons.push({
          x: g.plateX - 6,
          y: g.plateTop + 8 + random() * (g.plateBottom - g.plateTop - 16),
          vx: -input.electronSpeed * Math.cos(spread),
          vy: input.electronSpeed * Math.sin(spread),
        })
      }
    } else {
      keep.push(photon)
    }
  }
  state.photons = keep

  state.flash = Math.max(0, state.flash - dt * 2.5)

  state.electrons = state.electrons.filter((e) => {
    e.x += e.vx * dt
    e.y += e.vy * dt
    return e.x > g.tubeLeft + 6 && e.y > g.plateTop - 40 && e.y < g.plateBottom + 40
  })
}

/**
 * A still picture for reduced motion: photons spaced along the beam, and
 * electrons arranged in a fixed fan from the plate when emission happens.
 * Nothing moves, and below threshold the fan is empty.
 */
export function staticEmitterState(
  intensityPct: number,
  emitted: boolean,
  geometry: EmitterGeometry = STAGE_GEOMETRY
): EmitterState {
  const state = createEmitterState()
  const span = geometry.plateX - geometry.lampX
  const count = Math.round(4 + 6 * (Math.min(100, Math.max(0, intensityPct)) / 100))
  for (let i = 0; i < count; i++) {
    state.photons.push({ x: geometry.lampX + ((i + 0.5) / count) * span * 0.9 })
  }
  if (emitted) {
    const electrons = Math.max(1, Math.round(count * 0.9))
    for (let i = 0; i < electrons; i++) {
      const t = electrons === 1 ? 0.5 : i / (electrons - 1)
      state.electrons.push({
        x: geometry.plateX - 26 - (i % 3) * 22,
        y: geometry.plateTop + 14 + t * (geometry.plateBottom - geometry.plateTop - 28),
        vx: 0,
        vy: 0,
      })
    }
    state.ejectedCount = electrons
  }
  return state
}
