import { seriesName, transitionWavelengthNm, energyLevel, spectrumRegion, type SeriesName } from '@/lib/chem/bohr'
import { joulesToEv } from '@/components/vocab/ladder'

/** Number of Steps in the LineSpectra Scrolly Animation. */
export const LINE_STEP_COUNT = 4

export function clampLineStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(LINE_STEP_COUNT - 1, Math.max(0, Math.round(step)))
}

/** The visible range of the strips on this Section, in nm. */
export const VISIBLE_RANGE_NM = [380, 750] as const

/** A hydrogen line: the transition, its wavelength in nm and its colour region. */
export interface HydrogenLine {
  /** Upper level n2 (the level the electron falls from). */
  upper: number
  /** Lower level n1 (the level it falls to). */
  lower: number
  /** Wavelength in nm, from the Rydberg formula in bohr.ts, rounded to 0.1 nm. */
  nm: number
  series: SeriesName
  region: ReturnType<typeof spectrumRegion>
}

/** The first line of each series, and the visible lines of the Balmer series. */
export function firstLine(lower: number): HydrogenLine {
  const upper = lower + 1
  const nm = Math.round(transitionWavelengthNm(upper, lower) * 10) / 10
  const series = seriesName(lower)
  if (series === null) throw new RangeError(`No series name for n1 = ${lower}`)
  return { upper, lower, nm, series, region: spectrumRegion(nm) }
}

/** The first four Balmer lines (n1 = 2, n2 = 3 to 6) from the Rydberg formula. All four are visible. */
export function balmerLines(): HydrogenLine[] {
  const lines: HydrogenLine[] = []
  for (let upper = 3; upper <= 6; upper++) {
    const nm = Math.round(transitionWavelengthNm(upper, 2) * 10) / 10
    lines.push({ upper, lower: 2, nm, series: 'Balmer', region: spectrumRegion(nm) })
  }
  return lines
}

/** Name of Balmer's Greek-letter line for n2 = 3 to 6. */
export const BALMER_GREEK: Readonly<Record<number, string>> = {
  3: 'α',
  4: 'β',
  5: 'γ',
  6: 'δ',
}

/** The five named series, each with its first line (n2 = n1 + 1 to n1). */
export function seriesFirstLines(): HydrogenLine[] {
  return [1, 2, 3, 4, 5].map((lower) => firstLine(lower))
}

/** Energy of level n in eV, from energyLevel in bohr.ts, to two decimal places. */
export function levelEnergyEv(n: number): number {
  return joulesToEv(energyLevel(n))
}

/** Visually-hidden description of each Step, read by screen readers. */
export function lineStepDescription(step: number): string {
  const lines = balmerLines()
  const first = lines[0]
  switch (clampLineStep(step)) {
    case 0:
      return 'White light through a prism gives a continuous band of colours, from violet to red. Every visible wavelength is present, so there are no gaps.'
    case 1:
      return `A hydrogen discharge tube emits sharp lines, not a band. The first four Balmer lines are at ${lines.map((l) => `${l.nm} nm`).join(', ')}; the first is ${first.nm} nm.`
    case 2:
      return 'A gas that absorbs at those wavelengths removes them from white light, so dark lines appear at the same positions. This is the negative of the emission spectrum.'
    default:
      return 'Each series ends on one lower level: Lyman on n = 1, Balmer on n = 2, Paschen on n = 3, Brackett on n = 4 and Pfund on n = 5.'
  }
}
