/**
 * Densities and molar volumes of the elements, read from the PubChem snapshot
 * committed beside periodic-data.ts (column "Density", in g cm⁻³ at standard
 * conditions). The snapshot is the only source here: NCERT prints no densities
 * for the elements Lothar Meyer plotted, so PubChem is labelled on screen.
 *
 * Molar volume is atomic mass divided by density, in cm³ mol⁻¹. Lothar Meyer
 * called the same quantity "atomic volume" (NCERT Section 3.2).
 */

import snapshot from './data/pubchem-periodic-table.json'
import { PERIODIC_TABLE, elementByZ } from './periodic-data'

interface SnapshotTable {
  Table: { Row: { Cell: string[] }[] }
}

/** Index of "Density" in the snapshot's Columns list. */
const DENSITY_COLUMN = 14

const DENSITY_BY_Z: ReadonlyMap<number, number> = new Map(
  (snapshot as SnapshotTable).Table.Row.flatMap((row) => {
    const Z = Number(row.Cell[0])
    const rho = Number(row.Cell[DENSITY_COLUMN])
    return Number.isFinite(rho) && rho > 0 ? [[Z, rho] as const] : []
  })
)

/** Density in g cm⁻³ from the PubChem snapshot, or null when the snapshot has none. */
export function densityGcm3(Z: number): number | null {
  elementByZ(Z)
  return DENSITY_BY_Z.get(Z) ?? null
}

/**
 * Molar volume in cm³ mol⁻¹ (atomic mass ÷ density) for an element that is a solid
 * under standard conditions. Gases and liquids return null, because their
 * densities are not comparable with solid densities on Lothar Meyer's curve.
 */
export function solidMolarVolumeCm3(Z: number): number | null {
  const el = elementByZ(Z)
  if (el.standardState !== 'Solid') return null
  const rho = densityGcm3(Z)
  return rho === null ? null : el.atomicMass / rho
}

/** One point of the atomic-volume curve: atomic mass against molar volume. */
export interface AtomicVolumePoint {
  Z: number
  symbol: string
  atomicMass: number
  volumeCm3: number
}

/**
 * The solid elements from Z = 3 to Z = maxZ that have a snapshot density, sorted by
 * atomic mass, which is the axis Lothar Meyer used.
 */
export function atomicVolumeCurve(maxZ = 56): AtomicVolumePoint[] {
  const points: AtomicVolumePoint[] = []
  for (const el of PERIODIC_TABLE) {
    if (el.Z < 3 || el.Z > maxZ) continue
    const volumeCm3 = solidMolarVolumeCm3(el.Z)
    if (volumeCm3 === null) continue
    points.push({ Z: el.Z, symbol: el.symbol, atomicMass: el.atomicMass, volumeCm3 })
  }
  return points.sort((a, b) => a.atomicMass - b.atomicMass)
}
