/**
 * Pure model for the isoelectronic Simulation: which species a given electron count gives,
 * their radii (NCERT or Shannon, from ionic-radii.ts), and the Z/electron ratio shown in the
 * readout. Nothing here draws.
 */

import { speciesRadius, type SpeciesRadius } from '@/lib/chem/ionic-radii'
import { isoelectronicSeries } from '@/lib/chem/periodicity'

export const ELECTRON_COUNTS = [2, 10, 18] as const
export type ElectronCount = (typeof ELECTRON_COUNTS)[number]

/** Charges shown for each electron count: a neutral-or-cation window for 2, and ±2 for 10 and 18. */
const CHARGE_WINDOW: Record<ElectronCount, { min: number; max: number }> = {
  2: { min: 0, max: 2 },
  10: { min: -2, max: 2 },
  18: { min: -2, max: 2 },
}

export interface IsoSpecies {
  Z: number
  symbol: string
  charge: number
  electrons: number
  label: string
  radius: SpeciesRadius
  /**
   * Radius drawn on screen: radius.pm where tabulated, otherwise the midpoint of the nearest
   * tabulated neighbours. Null when the series has no tabulated value on either side, and the
   * Simulation then draws no size for it.
   */
  drawnPm: number | null
  /** True when drawnPm is an interpolation, not a tabulated value. */
  estimated: boolean
}

/** The species of one electron count, in Z order (anions, then the noble gas, then cations). */
export function speciesFor(electrons: ElectronCount): IsoSpecies[] {
  const { min, max } = CHARGE_WINDOW[electrons]
  const raw = isoelectronicSeries(electrons, 2)
    .filter((s) => s.charge >= min && s.charge <= max)
    .map((s) => ({
      Z: s.Z,
      symbol: s.symbol,
      charge: s.charge,
      electrons,
      label: s.label,
      radius: speciesRadius(s.Z, s.symbol, s.charge),
    }))
    .sort((a, b) => a.Z - b.Z)
  return withDrawnSizes(raw)
}

/**
 * Gives every species a drawn size. A species with no tabulated radius (for example neon)
 * takes the midpoint of its nearest tabulated neighbours, so the morph stays continuous. The
 * result is flagged `estimated`, and the readout never shows it as a radius.
 */
function withDrawnSizes(
  list: Omit<IsoSpecies, 'drawnPm' | 'estimated'>[],
): IsoSpecies[] {
  return list.map((s, i) => {
    if (s.radius.pm !== null) return { ...s, drawnPm: s.radius.pm, estimated: false }
    const left = nearestKnown(list, i, -1)
    const right = nearestKnown(list, i, 1)
    const drawn = left !== null && right !== null ? (left + right) / 2 : (left ?? right)
    return { ...s, drawnPm: drawn, estimated: true }
  })
}

function nearestKnown(list: readonly { radius: SpeciesRadius }[], from: number, step: -1 | 1): number | null {
  for (let i = from + step; i >= 0 && i < list.length; i += step) {
    const pm = list[i].radius.pm
    if (pm !== null) return pm
  }
  return null
}

/** Z over the electron count: the pull per electron that the readout reports. */
export function protonToElectronRatio(Z: number, electrons: number): number {
  if (!Number.isInteger(Z) || Z < 1) throw new RangeError(`Z must be a positive integer (received ${Z})`)
  if (!Number.isInteger(electrons) || electrons < 1) throw new RangeError(`Electron count must be a positive integer`)
  return Z / electrons
}

/** Range of Z the proton slider can reach for an electron count. */
export function protonRange(electrons: ElectronCount): { min: number; max: number } {
  const list = speciesFor(electrons)
  return { min: list[0].Z, max: list[list.length - 1].Z }
}
