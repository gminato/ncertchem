import { blackBodyCurve, peakWavelengthNm, type BlackBodyPoint } from '@/lib/chem/black-body'

/** Number of Steps in the BlackBody Scrolly Animation. */
export const BLACK_BODY_STEP_COUNT = 4

export function clampBlackBodyStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(BLACK_BODY_STEP_COUNT - 1, Math.max(0, Math.round(step)))
}

/** Temperatures (K) drawn on the plot, from coolest to hottest. */
export const CURVE_TEMPERATURES_K = [3000, 4000, 5000, 6000] as const

/** Plot window: wavelength in nm (linear axis) and spectral radiance in W sr⁻¹ m⁻³ (log axis). */
export const PLOT_NM = { min: 300, max: 3000 } as const
export const PLOT_RADIANCE = { min: 1e10, max: 1e14 } as const

/** Which curves are drawn on each Step. */
export function curvesForStep(step: number): readonly number[] {
  switch (clampBlackBodyStep(step)) {
    case 0:
      return []
    case 1:
      return [3000]
    default:
      return CURVE_TEMPERATURES_K
  }
}

/** Map a wavelength in nm to an x fraction (0 to 1) of the plot. */
export function plotFractionX(nm: number): number {
  return (nm - PLOT_NM.min) / (PLOT_NM.max - PLOT_NM.min)
}

/** Map a spectral radiance to a y fraction (0 at the bottom, 1 at the top) on the log axis, clamped. */
export function plotFractionY(radiance: number): number {
  const lo = Math.log10(PLOT_RADIANCE.min)
  const hi = Math.log10(PLOT_RADIANCE.max)
  const value = Math.log10(Math.max(radiance, PLOT_RADIANCE.min))
  return Math.min(1, Math.max(0, (value - lo) / (hi - lo)))
}

/** The curve as plot fractions, sampled every 10 nm. */
export function curveFractions(temperatureK: number): { x: number; y: number }[] {
  return blackBodyCurve(temperatureK, PLOT_NM.min, PLOT_NM.max, 10).map((p: BlackBodyPoint) => ({
    x: plotFractionX(p.nm),
    y: plotFractionY(p.radiance),
  }))
}

/** Peak wavelength (nm) for a temperature, rounded to whole nanometres for labels. */
export function peakLabelNm(temperatureK: number): number {
  return Math.round(peakWavelengthNm(temperatureK))
}

/** The quantum ladder on Step 3: E = nhν for n = 0, 1, 2, 3, and the ellipsis. */
export const QUANTUM_LABELS = ['0', 'hν', '2hν', '3hν', '…'] as const

/** Visually-hidden description of each Step, read by screen readers. */
export function blackBodyStepDescription(step: number): string {
  switch (clampBlackBodyStep(step)) {
    case 0:
      return 'A black body: a cavity with a tiny hole. Light that enters the hole is absorbed by the walls, so the hole looks black.'
    case 1:
      return `At 3000 K the radiation peaks near ${peakLabelNm(3000)} nm, in the infrared, so most of it is not visible.`
    case 2:
      return `Hotter bodies emit more at every wavelength, and their peaks move to shorter wavelengths: ${peakLabelNm(4000)} nm at 4000 K, ${peakLabelNm(5000)} nm at 5000 K, ${peakLabelNm(6000)} nm at 6000 K.`
    default:
      return 'Planck assumed that the oscillators in the walls can take up or give out energy only in whole steps of hν, so E = 0, hν, 2hν, 3hν and so on.'
  }
}
