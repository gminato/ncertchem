/**
 * Polyhalogen compounds (NCERT 6.8): the six compounds the Polyhalogen Explorer shows, their uses and
 * effects as NCERT states them, and the two small models the explorer draws (chloroform storage and the
 * freons in the atmosphere). No quantities: every model answers yes or no, or picks a qualitative stage.
 */
import { iupacNameFromSmiles } from './iupac-organic'

export type PolyhalogenId = 'dichloromethane' | 'chloroform' | 'iodoform' | 'carbon-tetrachloride' | 'freon-12' | 'ddt'

export interface PolyhalogenCompound {
  id: PolyhalogenId
  /** Common name as NCERT gives it. */
  common: string
  /** Kekulé SMILES, drawn with the organic components. */
  smiles: string
  /** Name shown for the compound. Set when the namer cannot make the name (DDT). Otherwise iupacNameFromSmiles. */
  ncertName?: string
  uses: readonly string[]
  effects: readonly string[]
}

export const POLYHALOGEN_COMPOUNDS: readonly PolyhalogenCompound[] = [
  {
    id: 'dichloromethane',
    common: 'Dichloromethane (methylene chloride)',
    smiles: 'ClCCl',
    uses: [
      'solvent that dissolves a wide range of substances',
      'paint remover',
      'propellant in aerosol cans',
      'process solvent in the manufacture of drugs',
      'cleaning and finishing of metals',
    ],
    effects: [
      'at low levels in air, hearing and vision are slightly impaired',
      'at higher levels: dizziness, nausea, and a tingling, numb feeling in the fingers and toes',
      'liquid on the skin causes intense burning and mild redness; eye contact can burn the cornea',
    ],
  },
  {
    id: 'chloroform',
    common: 'Chloroform',
    smiles: 'ClC(Cl)Cl',
    uses: [
      'good solvent for fats, alkaloids and iodine',
      'most of the chloroform made today goes into making the refrigerant R-22',
      'once a general anaesthetic; safer anaesthetics such as ether have taken its place',
    ],
    effects: [
      'its vapour depresses the central nervous system: dizziness, fatigue and headache after a short exposure',
      'air oxidises it in the presence of light to phosgene (carbonyl chloride), an extremely poisonous gas',
    ],
  },
  {
    id: 'iodoform',
    common: 'Iodoform',
    smiles: 'IC(I)I',
    uses: ['once used as an antiseptic; the free iodine it releases is what kills microbes'],
    effects: ['it has an objectionable smell, so other formulations that deliver iodine have replaced it'],
  },
  {
    id: 'carbon-tetrachloride',
    common: 'Carbon tetrachloride',
    smiles: 'ClC(Cl)(Cl)Cl',
    uses: [
      'refrigerants and propellants for aerosol cans',
      'feedstock for chlorofluorocarbons and other chemicals',
      'general solvent',
      'until the mid 1960s: cleaning fluid, degreaser, home spot remover and fire extinguisher',
    ],
    effects: [
      'there is some evidence that it causes liver cancer in humans',
      'released into the air, it rises into the atmosphere and depletes the ozone layer',
      'a thinner ozone layer means more ultraviolet exposure, with more skin cancer, eye disease and possibly a disrupted immune system',
    ],
  },
  {
    id: 'freon-12',
    common: 'Freon 12',
    smiles: 'FC(F)(Cl)Cl',
    uses: [
      'refrigeration and air conditioning: freons are extremely stable, unreactive, non-toxic, non-corrosive and easy to liquefy',
    ],
    effects: [
      'it rises into the stratosphere, where it starts radical chain reactions that disturb the ozone balance',
    ],
  },
  {
    id: 'ddt',
    common: 'DDT',
    smiles: 'ClC(Cl)(Cl)C(C1=CC=C(Cl)C=C1)C1=CC=C(Cl)C=C1',
    ncertName: 'p,p′-dichlorodiphenyltrichloroethane (DDT)',
    uses: [
      'an insecticide, used chiefly against the mosquito that spreads malaria and the lice that carry typhus',
    ],
    effects: [
      'many insect species developed resistance to it, and it proved highly toxic to fish',
      'it is stable and dissolves in fat, so animals store it in their fatty tissues and the amount builds up over time',
      'banned in the United States in 1973; still used in some other parts of the world',
    ],
  },
]

/** The name shown for a compound: NCERT's name where the namer cannot make one, otherwise iupacNameFromSmiles. */
export function systematicName(c: PolyhalogenCompound): string {
  return c.ncertName ?? iupacNameFromSmiles(c.smiles)
}

export function findPolyhalogen(id: PolyhalogenId): PolyhalogenCompound {
  const found = POLYHALOGEN_COMPOUNDS.find((c) => c.id === id)
  if (!found) throw new Error(`Unknown polyhalogen compound: ${id}`)
  return found
}

/** Chloroform storage model. Phosgene forms only with light, a clear bottle and a half-empty bottle (air above the liquid). */
export interface ChloroformSetup {
  light: boolean
  bottle: 'brown' | 'clear'
  fill: 'full' | 'half'
}

export function phosgeneForms(s: ChloroformSetup): boolean {
  return s.light && s.bottle === 'clear' && s.fill === 'half'
}

/** The protection that stops phosgene forming, first one that holds: no light, then brown glass, then a full bottle. */
export function chloroformGuardNote(s: ChloroformSetup): string {
  if (!s.light) return 'kept in the dark, so no light reaches it'
  if (s.bottle === 'brown') return 'brown glass blocks the light'
  return 'filled to the top, so no air reaches it'
}

export function chloroformSummary(s: ChloroformSetup): string {
  const light = s.light ? 'in light' : 'in the dark'
  const bottle = s.bottle === 'brown' ? 'in a brown bottle' : 'in a clear bottle'
  const fill = s.fill === 'full' ? 'filled to the top' : 'half empty, with air above'
  return phosgeneForms(s)
    ? `Chloroform ${bottle}, ${fill}, ${light}: phosgene (COCl₂) forms, an extremely poisonous gas.`
    : `Chloroform ${bottle}, ${fill}, ${light}: no phosgene forms, because ${chloroformGuardNote(s)}.`
}

/** Freons in the atmosphere: the layer the molecule has reached. */
export type AtmosphereLayer = 'ground' | 'troposphere' | 'stratosphere'

export function ozoneThinned(layer: AtmosphereLayer): boolean {
  return layer === 'stratosphere'
}

export function atmosphereSummary(compound: PolyhalogenCompound, layer: AtmosphereLayer): string {
  const where = layer === 'ground' ? 'at ground level' : layer === 'troposphere' ? 'in the lower atmosphere' : 'in the stratosphere'
  const effect =
    layer === 'stratosphere'
      ? 'Radical chains start there, and the ozone layer is thinner.'
      : 'It has not reached the ozone layer yet.'
  return `${compound.common} ${where}. ${effect}`
}

/** DDT in a food chain, from the lowest level up. The dot count is a qualitative stage, not a quantity. */
export const FOOD_CHAIN_LEVELS = ['Water', 'Small fish', 'Fish-eating bird'] as const
export type FoodChainLevel = 0 | 1 | 2

/** Stages of build-up drawn on the chain: each level carries more DDT than the one below it. */
export function ddtStage(level: FoodChainLevel): number {
  return level + 1
}

export function ddtSummary(level: FoodChainLevel): string {
  return level === 0
    ? 'DDT in water: little is stored yet. It is stored in fatty tissue, and the amount builds up along the chain.'
    : `DDT in ${FOOD_CHAIN_LEVELS[level].toLowerCase()}: more is stored than in the level below, because DDT is stored in fat and is not broken down.`
}
