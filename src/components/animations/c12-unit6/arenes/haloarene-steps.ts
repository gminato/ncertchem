import { NCERT_HALOARENE_HYDROLYSIS, C_CL_BOND_LENGTH_COMPARISON_PM } from '@/lib/chem/ncert-c12-unit6-data'
import { formulaUnicode, nitroActivation } from '@/lib/chem/haloalkanes'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'

/** Six Steps, 0-based, in the order P11's Prose gives them. */
export const ARENE_STEP_COUNT = 6

/** Molecules shown in the Scrolly. Each SMILES is Kekulé; ring positions 1 to 6 are atoms 1 to 6. */
export const ARENE_SMILES = {
  chlorobenzene: NCERT_HALOARENE_HYDROLYSIS[0].smiles,
  para4Nitro: NCERT_HALOARENE_HYDROLYSIS[1].smiles,
  dinitro: NCERT_HALOARENE_HYDROLYSIS[2].smiles,
  trinitro: NCERT_HALOARENE_HYDROLYSIS[3].smiles,
  meta3Nitro: 'ClC1=CC(=CC=C1)[N+](=O)[O-]',
  chloroethane: 'CCCl',
  bromobenzene: 'BrC1=CC=CC=C1',
  bromo4Nitro: 'BrC1=CC=C(C=C1)[N+](=O)[O-]',
  bromo2Nitro: 'BrC1=CC=CC=C1[N+](=O)[O-]',
  ethylbenzene: 'CCC1=CC=CC=C1',
  biphenyl: 'C1=CC=C(C=C1)C1=CC=CC=C1',
} as const

/** IUPAC names shown under the products. Each must equal iupacNameFromSmiles of its SMILES (tested). */
export const ARENE_NAMES = {
  bromo4Nitro: '1-bromo-4-nitrobenzene',
  bromo2Nitro: '1-bromo-2-nitrobenzene',
} as const

/** Molecular formula with real subscripts, from the molecule graph. */
export function formulaOf(smiles: string): string {
  return formulaUnicode(molecularFormula(parseSmiles(smiles)))
}

/** Step 1 numbers: the two C–Cl bond lengths from the lead data lib, and their difference. */
export function chlorineBondComparison(): { sp3Pm: number; sp2Pm: number; differencePm: number } {
  const { haloalkane, haloarene } = C_CL_BOND_LENGTH_COMPARISON_PM
  return { sp3Pm: haloalkane, sp2Pm: haloarene, differencePm: haloalkane - haloarene }
}

/** One card of the Step 2 ladder: the chlorobenzene nitro series with its printed conditions. */
export interface LadderCard {
  smiles: string
  nitroGroups: number
  conditions: string
}

/**
 * The four NCERT hydrolysis cases in order. Temperatures and pressures come from the data lib;
 * a case with no temperature (warm water) shows the printed conditions string.
 */
export function ladderCards(): LadderCard[] {
  return NCERT_HALOARENE_HYDROLYSIS.map((r) => {
    let conditions: string
    if (r.temperatureK === null) {
      conditions = r.conditions
    } else {
      const pressure = r.pressureAtm === null ? '' : `, ${r.pressureAtm} atm`
      conditions = `${r.reagent}, ${r.temperatureK} K${pressure}`
    }
    return { smiles: r.smiles, nitroGroups: r.nitroGroups, conditions }
  })
}

/** Step 4 verdict for one nitro position, from the activation lib. */
export function nitroVerdict(position: number): { activated: boolean; chargeReachesNitroCarbon: boolean } {
  const result = nitroActivation([position])
  return { activated: result.activated, chargeReachesNitroCarbon: result.chargeSites.includes(position) }
}

/** Ring positions that carry negative charge after OH⁻ adds at C1 (from the lib). */
export function carbanionSites(): number[] {
  return nitroActivation([4]).chargeSites
}
