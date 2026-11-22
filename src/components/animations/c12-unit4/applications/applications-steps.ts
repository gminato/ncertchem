import { INDUSTRIAL_CATALYSTS, dElectronCount, eStandardM2, formatVolt } from '@/lib/chem/dblock'
import { CATALYST_REPRESENTATIVE_EQUATIONS } from '@/lib/chem/dblock-series-data'
import { NCERT_FIRST_SERIES_PROPERTIES } from '@/lib/chem/ncert-c12-unit4-tables'

/** Metallic radius (pm) from Table 4.2 for a 3d metal. */
export function metallicRadiusPm(symbol: string): number {
  const row = NCERT_FIRST_SERIES_PROPERTIES.find((r) => r.symbol === symbol)
  if (!row) throw new Error(`no Table 4.2 row for ${symbol}`)
  return row.radiusMetalPm
}

/** Percentage difference of a metal radius from the host radius (Fe). */
export function radiusDifferencePercent(symbol: string, host = 'Fe'): number {
  const h = metallicRadiusPm(host)
  return (Math.abs(metallicRadiusPm(symbol) - h) / h) * 100
}

/** The copper E° (Table 4.2) as shown on the Step 2 label, e.g. "+0.34 V". */
export function copperPotentialLabel(): string {
  const e = eStandardM2('Cu')
  if (e === null) throw new Error('no E° for Cu')
  return formatVolt(e)
}

/** Overall equation for a named process (from INDUSTRIAL_CATALYSTS). */
export function overallEquation(process: string): string {
  const row = INDUSTRIAL_CATALYSTS.find((c) => c.process === process)
  if (!row || !row.overallText) throw new Error(`no overall equation for ${process}`)
  return row.overallText
}

/** Representative Ziegler equation (per repeat unit), labelled "representative" on the drawing. */
export function zieglerRepresentative(): string {
  return CATALYST_REPRESENTATIVE_EQUATIONS['Ziegler catalysts (polyethylene)'].unicode
}

/** Number of d electrons in Ti⁴⁺ (Step 3: an empty d set). */
export function titaniumIVdCount(): number {
  return dElectronCount('Ti', 4)
}


export interface ApplicationStep {
  /** Strip cells lit for this Step (symbols). */
  highlight: readonly string[]
  /** The property that makes the application work, shown as the Step's caption. */
  property: string
}

/** One entry per Scrolly Step (0-based). */
export const APPLICATION_STEPS: readonly ApplicationStep[] = [
  { highlight: ['Fe', 'Cr', 'Mn', 'Ni'], property: 'Similar atomic radii let other metals replace Fe atoms' },
  { highlight: ['Zn', 'Cu', 'Ag', 'Au'], property: 'Cu has a positive E°, so dilute acid does not release H₂' },
  { highlight: ['Ti', 'Mn'], property: 'Variable oxidation state (Mn); d⁰ Ti⁴⁺ has no d–d colour' },
  { highlight: ['V', 'Pd'], property: 'Variable oxidation state: V(V)/V(IV) and Pd(II)/Pd(0)' },
  { highlight: ['Fe', 'Ni', 'Ti'], property: 'Surface adsorption: the metal surface weakens reactant bonds' },
  { highlight: ['Ag'], property: 'Light changes AgBr itself, so it is not a catalyst' },
]
