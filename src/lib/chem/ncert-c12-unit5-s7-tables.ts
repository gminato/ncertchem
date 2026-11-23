/**
 * Reference data from NCERT Class 12 Chemistry Part I, Unit 5 (Coordination Compounds),
 * Sections 5.5.5 and 5.5.6, book pp. 133-135. Values are as NCERT prints them.
 *
 * - Table 5.3 wavelength absorbed and colour observed (p. 133)
 * - The [Ni(H2O)6]2+ plus en series and its colours (p. 134)
 * - Gem stone facts for ruby and emerald (p. 134-135)
 * - Limitations of crystal field theory (p. 135)
 *
 * Worked examples, Intext Questions and Exercises are deliberately not transcribed (ADR-0001).
 */

export interface ColourRow {
  readonly id: string
  readonly entity: string
  /** mhchem-style formula, e.g. "[Co(NH3)6]^3+". */
  readonly formula: string
  readonly wavelengthNm: number
  readonly absorbed: string
  readonly observed: string
}

/** Table 5.3, in printed order. */
export const NCERT_TABLE_5_3: readonly ColourRow[] = [
  { id: 'co-cl-nh3-5', entity: '[CoCl(NH3)5]2+', formula: '[CoCl(NH3)5]^2+', wavelengthNm: 535, absorbed: 'Yellow', observed: 'Violet' },
  { id: 'co-nh3-5-h2o', entity: '[Co(NH3)5(H2O)]3+', formula: '[Co(NH3)5(H2O)]^3+', wavelengthNm: 500, absorbed: 'Blue Green', observed: 'Red' },
  { id: 'co-nh3-6', entity: '[Co(NH3)6]3+', formula: '[Co(NH3)6]^3+', wavelengthNm: 475, absorbed: 'Blue', observed: 'Yellow Orange' },
  { id: 'co-cn-6', entity: '[Co(CN)6]3-', formula: '[Co(CN)6]^3-', wavelengthNm: 310, absorbed: 'Ultraviolet', observed: 'Pale Yellow' },
  { id: 'cu-h2o-4', entity: '[Cu(H2O)4]2+', formula: '[Cu(H2O)4]^2+', wavelengthNm: 600, absorbed: 'Red', observed: 'Blue' },
  { id: 'ti-h2o-6', entity: '[Ti(H2O)6]3+', formula: '[Ti(H2O)6]^3+', wavelengthNm: 498, absorbed: 'Blue Green', observed: 'Violet' },
] as const

export interface NickelEnStep {
  readonly enPerNi: number
  readonly formula: string
  readonly colour: string
  readonly waterLeft: number
}

/** The [Ni(H2O)6]2+ plus en series (p. 134): each en displaces two water molecules. */
export const NCERT_NI_EN_SERIES: readonly NickelEnStep[] = [
  { enPerNi: 0, formula: '[Ni(H2O)6]^2+', colour: 'green', waterLeft: 6 },
  { enPerNi: 1, formula: '[Ni(H2O)4(en)]^2+', colour: 'pale blue', waterLeft: 4 },
  { enPerNi: 2, formula: '[Ni(H2O)2(en)2]^2+', colour: 'blue/purple', waterLeft: 2 },
  { enPerNi: 3, formula: '[Ni(en)3]^2+', colour: 'violet', waterLeft: 0 },
] as const

export interface GemStone {
  readonly id: string
  readonly name: string
  readonly host: string
  readonly dopant: string
  readonly dElectrons: number
  readonly note: string
}

/** Gem stone facts from the box on pp. 134-135. */
export const NCERT_GEMS: readonly GemStone[] = [
  {
    id: 'ruby',
    name: 'Ruby',
    host: 'Al2O3 (aluminium oxide)',
    dopant: 'about 0.5-1% Cr3+ in place of Al3+',
    dElectrons: 3,
    note: 'd-d transitions at octahedral Cr3+ centres give the colour',
  },
  {
    id: 'emerald',
    name: 'Emerald',
    host: 'beryl, Be3Al2Si6O18',
    dopant: 'Cr3+ in octahedral sites',
    dElectrons: 3,
    note: 'absorption bands shift to longer wavelength (yellow-red and blue), so green is transmitted',
  },
] as const

/** Named facts in the running text of 5.5.5 and 5.5.6. */
export const NCERT_S7_FACTS = {
  complementaryExample: { absorbed: 'green', seen: 'red' },
  tiComplex: { formula: '[Ti(H2O)6]3+', dCount: 1, ground: 't2g1 eg0', excited: 't2g0 eg1', colour: 'violet', absorbed: 'blue-green' },
  colourlessAnhydrous: [
    { dry: '[Ti(H2O)6]Cl3 after heating, water removed', dryColour: 'colourless' },
    { dry: 'anhydrous CuSO4', dryColour: 'white', hydrate: 'CuSO4.5H2O', hydrateColour: 'blue' },
  ],
  limitations: [
    'Ligands are treated as point charges, so anionic ligands should split most, yet they sit at the low end of the spectrochemical series.',
    'The covalent character of the ligand to metal bond is not considered.',
  ],
  betterTheories: ['ligand field theory', 'molecular orbital theory'],
} as const

/** Energy of one photon, in joules, for a wavelength in nm: E = hc / lambda. */
export function photonEnergyJ(wavelengthNm: number): number {
  const h = 6.626e-34
  const c = 2.998e8
  return (h * c) / (wavelengthNm * 1e-9)
}
