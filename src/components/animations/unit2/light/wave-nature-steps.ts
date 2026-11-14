import { emRegion, frequencyFromWavelength, wavenumber, type EmRegion } from '@/lib/chem/radiation'
import { formatScientific } from '@/lib/chem/mole-bridge'

/** Number of Steps in the WaveNature Scrolly Animation. */
export const WAVE_STEP_COUNT = 4

export function clampWaveStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(WAVE_STEP_COUNT - 1, Math.max(0, Math.round(step)))
}

/** The log-scale band runs from 1 pm (10⁻¹² m) to 1 km (10³ m). */
export const BAND_MIN_M = 1e-12
export const BAND_MAX_M = 1e3

/** Position of a wavelength on the log band, from 0 (left, BAND_MIN_M) to 1 (right, BAND_MAX_M). */
export function bandFraction(wavelengthM: number): number {
  const lo = Math.log10(BAND_MIN_M)
  const hi = Math.log10(BAND_MAX_M)
  return (Math.log10(wavelengthM) - lo) / (hi - lo)
}

/** One region of the spectrum, with its wavelength limits in metres. */
export interface RegionSpan {
  region: EmRegion
  startM: number
  endM: number
}

/**
 * Finds the wavelength limits of each region by scanning the log band and then
 * bisecting every change of region, so the limits come from emRegion itself.
 * Regions are returned from the shortest wavelength to the longest.
 */
export function emRegionSpans(samplesPerDecade = 40): RegionSpan[] {
  const lo = Math.log10(BAND_MIN_M)
  const hi = Math.log10(BAND_MAX_M)
  const count = Math.round((hi - lo) * samplesPerDecade)
  const spans: RegionSpan[] = []
  let current = emRegion(BAND_MIN_M)
  let start = BAND_MIN_M

  for (let i = 1; i <= count; i++) {
    const logA = lo + ((hi - lo) * (i - 1)) / count
    const logB = lo + ((hi - lo) * i) / count
    const next = emRegion(Math.pow(10, logB))
    if (next !== current) {
      // Bisect in log space for the exact boundary between logA and logB.
      let a = logA
      let b = logB
      for (let k = 0; k < 80; k++) {
        const mid = (a + b) / 2
        if (emRegion(Math.pow(10, mid)) === current) a = mid
        else b = mid
      }
      const boundary = Math.pow(10, (a + b) / 2)
      spans.push({ region: current, startM: start, endM: boundary })
      current = next
      start = boundary
    }
  }
  spans.push({ region: current, startM: start, endM: BAND_MAX_M })
  return spans
}

/** Facts about one wavelength used on the wave Steps. */
export interface WavelengthFacts {
  nm: number
  frequencyHz: number
  /** Wavenumber in cm⁻¹. */
  wavenumberPerCm: number
  region: EmRegion
}

export function wavelengthFacts(nm: number): WavelengthFacts {
  const wavelengthM = nm * 1e-9
  return {
    nm,
    frequencyHz: frequencyFromWavelength(wavelengthM),
    wavenumberPerCm: wavenumber(wavelengthM) * 0.01,
    region: emRegion(wavelengthM),
  }
}

/** Visually-hidden description of each Step, read by screen readers. */
export function waveStepDescription(step: number): string {
  const ref = wavelengthFacts(500)
  switch (clampWaveStep(step)) {
    case 0:
      return 'An electromagnetic wave: the electric field E and the magnetic field B swing at right angles to each other and to the direction of travel.'
    case 1:
      return `Two waves of one speed. The shorter wave has the higher frequency. At 500 nm, ν = ${formatScientific(ref.frequencyHz, 3)} Hz.`
    case 2:
      return 'The electromagnetic spectrum on a logarithmic scale: radio waves at the long end, gamma rays at the short end, and visible light as a small slice in the middle.'
    default:
      return `The visible slice from 380 nm to 750 nm, with real colours. At 500 nm the wavenumber is ${formatScientific(ref.wavenumberPerCm, 3)} cm⁻¹.`
  }
}
