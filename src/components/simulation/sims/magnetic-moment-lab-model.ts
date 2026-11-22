import { dElectronCount, formatMoment, ionConfig, ionSymbol, spinOnlyMoment, unpairedElectrons } from '@/lib/chem/dblock'
import { formatSig } from '@/lib/chem/kinetics'
import { NCERT_MAGNETIC_MOMENTS } from '@/lib/chem/ncert-c12-unit4-tables'

export interface IonChoice {
  symbol: string
  charge: number
}

/** The 3d ions the lab offers, in order of increasing d count (Cr³⁺ and Fe³⁺ are not in Table 4.7). */
export const ION_CHOICES: readonly IonChoice[] = [
  { symbol: 'Sc', charge: 3 },
  { symbol: 'Ti', charge: 3 },
  { symbol: 'V', charge: 3 },
  { symbol: 'V', charge: 2 },
  { symbol: 'Cr', charge: 3 },
  { symbol: 'Cr', charge: 2 },
  { symbol: 'Mn', charge: 2 },
  { symbol: 'Fe', charge: 2 },
  { symbol: 'Fe', charge: 3 },
  { symbol: 'Co', charge: 2 },
  { symbol: 'Ni', charge: 2 },
  { symbol: 'Cu', charge: 2 },
  { symbol: 'Zn', charge: 2 },
]

export const DEFAULT_ION_INDEX = ION_CHOICES.findIndex((c) => c.symbol === 'Cr' && c.charge === 3)

/** Balance pull for a diamagnetic sample (no unpaired electrons): a faint push out of the field. Schematic. */
export const DIAMAGNETIC_PUSH = -0.15

/** Spin-only moment for five unpaired electrons: the largest value in the lab, used to scale the pull. */
const MAX_MU = spinOnlyMoment(5)

export type MeasuredMoment = number | readonly [number, number]

export interface MomentReadout {
  ion: string
  configuration: string
  dCount: number
  unpaired: number
  /** Spin-only moment, unrounded: √(n(n + 2)) BM. */
  mu: number
  /** The spin-only moment to 3 s.f. (2.83 for n = 2, never 2.84). */
  muText: string
  behaviour: 'paramagnetic' | 'diamagnetic'
  /** Table 4.7 measured value for this ion, or null when the table does not list it. */
  measured: MeasuredMoment | null
  /** Measured value as text: "1.75", "2.9–3.4"; null when not listed. */
  measuredText: string | null
  /** Balance pull from −1 (pushed out) to +1 (pulled in), proportional to μ. */
  pull: number
}

function measuredFor(ion: string): MeasuredMoment | null {
  const row = NCERT_MAGNETIC_MOMENTS.find((r) => r.ion === ion)
  if (!row) return null
  return row.observedBm
}

function measuredTextOf(value: MeasuredMoment): string {
  if (typeof value === 'number') return formatSig(value, 3)
  return `${formatSig(value[0], 2)}–${formatSig(value[1], 2)}`
}

/** Everything the lab shows for one ion, computed from the libs. */
export function readMoment(index: number): MomentReadout {
  const choice = ION_CHOICES[Math.min(ION_CHOICES.length - 1, Math.max(0, index))]
  const ion = ionSymbol(choice.symbol, choice.charge)
  const dCount = dElectronCount(choice.symbol, choice.charge)
  const unpaired = unpairedElectrons(dCount)
  const mu = spinOnlyMoment(unpaired)
  const measured = measuredFor(ion)
  const behaviour = unpaired === 0 ? 'diamagnetic' : 'paramagnetic'
  return {
    ion,
    configuration: ionConfig(choice.symbol, choice.charge).display,
    dCount,
    unpaired,
    mu,
    muText: formatMoment(mu),
    behaviour,
    measured,
    measuredText: measured === null ? null : measuredTextOf(measured),
    pull: behaviour === 'diamagnetic' ? DIAMAGNETIC_PUSH : mu / MAX_MU,
  }
}

/** Spin-only moment for each d count 1 to 10 (high spin): the calculated series plotted in the lab. */
export function calculatedSeries(): { d: number; mu: number }[] {
  return Array.from({ length: 10 }, (_, i) => {
    const d = i + 1
    return { d, mu: spinOnlyMoment(unpairedElectrons(d)) }
  })
}

/** Table 4.7 measured values by d count, for the ions that the table lists with a d count from 1 to 9. */
export function measuredSeries(): { d: number; ion: string; value: MeasuredMoment }[] {
  return NCERT_MAGNETIC_MOMENTS.filter((r) => r.dCount >= 1 && r.dCount <= 9).map((r) => ({
    d: r.dCount,
    ion: r.ion,
    value: r.observedBm,
  }))
}

/** The live summary: changes only when a displayed value changes. */
export function momentSummary(r: MomentReadout): string {
  const n = `${r.unpaired} unpaired electron${r.unpaired === 1 ? '' : 's'}`
  const measured = r.measuredText === null ? 'not listed in Table 4.7' : `measured ${r.measuredText} BM in Table 4.7`
  const side = r.behaviour === 'diamagnetic' ? 'no unpaired electrons, so it is pushed out of the field' : 'pulled into the field'
  return `${r.ion}, ${r.configuration}: ${n}, spin-only μ = ${r.muText} BM, ${measured}. The sample is ${side}.`
}
