/**
 * Reference data from NCERT Class 12 Chemistry Part I, Unit 5, Section 5.6
 * (Bonding in Metal Carbonyls), book pp. 135-136, Fig. 5.13 and Fig. 5.14.
 * Intext Questions are deliberately not transcribed (ADR-0001).
 */

export type CarbonylGeometry =
  | 'tetrahedral'
  | 'trigonal bipyramidal'
  | 'octahedral'
  | 'two square pyramids joined by a metal-metal bond'
  | 'metal-metal bond bridged by two CO groups'

export interface Carbonyl {
  readonly formula: string
  readonly latex: string
  readonly name: string
  readonly metal: string
  readonly metalOxidationState: 0
  /** Terminal plus bridging CO groups in the formula unit as drawn in Fig. 5.13. */
  readonly totalCO: number
  readonly terminalCO: number
  readonly bridgingCO: number
  readonly metalCount: 1 | 2
  readonly hasMetalMetalBond: boolean
  readonly geometry: CarbonylGeometry
}

export const NCERT_CARBONYLS: readonly Carbonyl[] = [
  { formula: 'Ni(CO)4', latex: '\\ce{Ni(CO)4}', name: 'tetracarbonylnickel(0)', metal: 'Ni', metalOxidationState: 0, totalCO: 4, terminalCO: 4, bridgingCO: 0, metalCount: 1, hasMetalMetalBond: false, geometry: 'tetrahedral' },
  { formula: 'Fe(CO)5', latex: '\\ce{Fe(CO)5}', name: 'pentacarbonyliron(0)', metal: 'Fe', metalOxidationState: 0, totalCO: 5, terminalCO: 5, bridgingCO: 0, metalCount: 1, hasMetalMetalBond: false, geometry: 'trigonal bipyramidal' },
  { formula: 'Cr(CO)6', latex: '\\ce{Cr(CO)6}', name: 'hexacarbonylchromium(0)', metal: 'Cr', metalOxidationState: 0, totalCO: 6, terminalCO: 6, bridgingCO: 0, metalCount: 1, hasMetalMetalBond: false, geometry: 'octahedral' },
  { formula: '[Mn2(CO)10]', latex: '\\ce{[Mn2(CO)10]}', name: 'decacarbonyldimanganese(0)', metal: 'Mn', metalOxidationState: 0, totalCO: 10, terminalCO: 10, bridgingCO: 0, metalCount: 2, hasMetalMetalBond: true, geometry: 'two square pyramids joined by a metal-metal bond' },
  { formula: '[Co2(CO)8]', latex: '\\ce{[Co2(CO)8]}', name: 'octacarbonyldicobalt(0)', metal: 'Co', metalOxidationState: 0, totalCO: 8, terminalCO: 6, bridgingCO: 2, metalCount: 2, hasMetalMetalBond: true, geometry: 'metal-metal bond bridged by two CO groups' },
] as const

/** The two halves of the synergic metal-carbonyl bond (p. 136, Fig. 5.14). */
export const NCERT_SYNERGIC_BOND = {
  sigma: {
    donor: 'lone pair on the carbonyl carbon',
    acceptor: 'vacant orbital of the metal',
    direction: 'ligand to metal',
  },
  pi: {
    donor: 'filled d orbital of the metal',
    acceptor: 'vacant antibonding pi* orbital of carbon monoxide',
    direction: 'metal to ligand',
  },
  effect: 'synergic effect that strengthens the bond between CO and the metal',
} as const
