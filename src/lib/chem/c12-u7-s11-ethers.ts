/**
 * Model and NCERT-verified data adapters for Class 12 Unit 7 Section 7.6.1–7.6.2
 * (Preparation and Physical Properties of Ethers).
 *
 * All boiling points, miscibility numbers, geometries and reaction outcomes come
 * directly from `src/lib/chem/ncert-c12-unit7-data.ts` and NCERT Class 12 Unit 7.
 */

import {
  NCERT_7_6_1_ETHER_PREP,
  NCERT_7_6_2_BOILING_COMPARISON,
  NCERT_7_6_2_WATER_MISCIBILITY,
  NCERT_FIG_7_1_STRUCTURES,
} from './ncert-c12-unit7-data'

export type SynthesisRoute = 'dehydration' | 'williamson'

export type DehydrationAlcohol = 'ethanol' | 'mixture' | 'propan-2-ol' | 'tert-butanol'
export type DehydrationTempK = 413 | 443

export type WilliamsonNucleophile = 'methoxide' | 'tert-butoxide' | 'phenoxide'
export type WilliamsonHalide = 'CH3-Br' | 'CH3CH2-Br' | '(CH3)3C-Br'

export type PathwayVerdict =
  | 'SN2 Substitution'
  | 'Elimination'
  | 'Mixed Ethers (SN2)'
  | 'Elimination & Mixed Side-Products'

export interface SynthesisOutcome {
  route: SynthesisRoute
  equation: string
  pathway: PathwayVerdict
  isEtherSuccess: boolean
  majorProductName: string
  majorProductSubtitle?: string
  majorProductFormula: string
  /** Kekulé SMILES for SkeletalFormula rendering (primary product). */
  productSmiles: string
  /** Optional list of 3 ethers for mixed alcohol dehydration. */
  mixedProducts?: readonly { formula: string; name: string; smiles: string }[]
  byProducts: string
  yieldBadge: string
  mechanismKind: 'sn2-ether' | 'e2-alkene' | 'mixed-ether' | 'aryl-sn2' | 'aryl-e2'
  explanation: string
}

export const DEHYDRATION_ALCOHOL_OPTIONS: readonly {
  id: DehydrationAlcohol
  label: string
  shortLabel: string
  degree: '1°' | '2°' | '3°'
  formula: string
  smiles: string
}[] = [
  {
    id: 'ethanol',
    label: '1° Ethanol (CH₃CH₂OH)',
    shortLabel: '1° Ethanol',
    degree: '1°',
    formula: 'CH₃CH₂OH',
    smiles: 'CCO',
  },
  {
    id: 'mixture',
    label: '1° Mixture (CH₃OH + C₂H₅OH)',
    shortLabel: '1° Mixture',
    degree: '1°',
    formula: 'CH₃OH + C₂H₅OH',
    smiles: 'CO',
  },
  {
    id: 'propan-2-ol',
    label: '2° Propan-2-ol',
    shortLabel: '2° Propan-2-ol',
    degree: '2°',
    formula: 'CH₃CH(OH)CH₃',
    smiles: 'CC(O)C',
  },
  {
    id: 'tert-butanol',
    label: '3° tert-Butyl alcohol',
    shortLabel: '3° tert-Butyl alcohol',
    degree: '3°',
    formula: '(CH₃)₃COH',
    smiles: 'CC(C)(C)O',
  },
] as const

export const DEHYDRATION_TEMPS: readonly DehydrationTempK[] = [413, 443] as const

export const WILLIAMSON_NUCLEOPHILES: readonly {
  id: WilliamsonNucleophile
  label: string
  formula: string
  ionFormula: string
  isAryl: boolean
  isBulky: boolean
  conjugateAlcohol: string
}[] = [
  {
    id: 'methoxide',
    label: 'CH₃O⁻Na⁺',
    formula: 'CH₃O⁻Na⁺',
    ionFormula: 'CH₃O⁻',
    isAryl: false,
    isBulky: false,
    conjugateAlcohol: 'CH₃OH',
  },
  {
    id: 'tert-butoxide',
    label: '(CH₃)₃CO⁻Na⁺',
    formula: '(CH₃)₃CO⁻Na⁺',
    ionFormula: '(CH₃)₃CO⁻',
    isAryl: false,
    isBulky: true,
    conjugateAlcohol: '(CH₃)₃COH',
  },
  {
    id: 'phenoxide',
    label: 'C₆H₅O⁻Na⁺',
    formula: 'C₆H₅O⁻Na⁺',
    ionFormula: 'C₆H₅O⁻',
    isAryl: true,
    isBulky: false,
    conjugateAlcohol: 'C₆H₅OH',
  },
] as const

export const WILLIAMSON_HALIDES: readonly {
  id: WilliamsonHalide
  label: string
  formula: string
  degree: '1°' | '3°'
  smiles: string
}[] = [
  {
    id: 'CH3-Br',
    label: 'CH₃–Br (1°)',
    formula: 'CH₃–Br',
    degree: '1°',
    smiles: 'CBr',
  },
  {
    id: 'CH3CH2-Br',
    label: 'CH₃CH₂–Br (1°)',
    formula: 'CH₃CH₂–Br',
    degree: '1°',
    smiles: 'CCBr',
  },
  {
    id: '(CH3)3C-Br',
    label: '(CH₃)₃C–Br (3°)',
    formula: '(CH₃)₃C–Br',
    degree: '3°',
    smiles: 'CC(C)(C)Br',
  },
] as const

/** Resolve acid-catalysed dehydration outcome for the selected alcohol class and temperature. */
export function evaluateDehydration(
  alcohol: DehydrationAlcohol,
  tempK: DehydrationTempK
): SynthesisOutcome {
  const lowTemp = NCERT_7_6_1_ETHER_PREP.ethanolDehydrationBranching[0]
  const highTemp = NCERT_7_6_1_ETHER_PREP.ethanolDehydrationBranching[1]

  if (alcohol === 'ethanol') {
    if (tempK === lowTemp.temperatureK) {
      return {
        route: 'dehydration',
        equation: '2 CH₃CH₂OH → C₂H₅OC₂H₅ + H₂O (H₂SO₄, 413 K)',
        pathway: 'SN2 Substitution',
        isEtherSuccess: true,
        majorProductName: 'Ethoxyethane',
        majorProductFormula: 'C₂H₅OC₂H₅',
        productSmiles: 'CCOCC',
        byProducts: 'H₂O',
        yieldBadge: 'Major ether yield',
        mechanismKind: 'sn2-ether',
        explanation:
          'At 413 K with H₂SO₄, an unprotonated ethanol molecule attacks protonated ethanol by an SN2 pathway, displacing H₂O to give ethoxyethane cleanly.',
      }
    }
    return {
      route: 'dehydration',
      equation: 'CH₃CH₂OH → CH₂=CH₂ + H₂O (H₂SO₄, 443 K)',
      pathway: 'Elimination',
      isEtherSuccess: false,
      majorProductName: 'Ethene',
      majorProductFormula: 'CH₂=CH₂',
      productSmiles: 'C=C',
      byProducts: 'H₂O',
      yieldBadge: '0% ether (alkene forms)',
      mechanismKind: 'e2-alkene',
      explanation: `Raising the temperature to ${highTemp.temperatureK} K shifts the balance to elimination: losing H₂O produces ${highTemp.majorProduct} instead of an ether.`,
    }
  }

  if (alcohol === 'mixture') {
    if (tempK === 413) {
      return {
        route: 'dehydration',
        equation: 'CH₃OH + C₂H₅OH → CH₃OCH₃ + CH₃OC₂H₅ + C₂H₅OC₂H₅ + H₂O',
        pathway: 'Mixed Ethers (SN2)',
        isEtherSuccess: false,
        majorProductName: 'Mixture of 3 ethers',
        majorProductFormula: 'CH₃OCH₃, CH₃OC₂H₅, C₂H₅OC₂H₅',
        productSmiles: 'COCC',
        mixedProducts: [
          { formula: 'CH₃OCH₃', name: 'Methoxymethane', smiles: 'COC' },
          { formula: 'CH₃OC₂H₅', name: 'Methoxyethane', smiles: 'COCC' },
          { formula: 'C₂H₅OC₂H₅', name: 'Ethoxyethane', smiles: 'CCOCC' },
        ],
        byProducts: 'H₂O',
        yieldBadge: 'Low selectivity (3-ether mix)',
        mechanismKind: 'mixed-ether',
        explanation:
          'Both 1° alcohols protonate and both act as nucleophiles, yielding all three possible ethers that are difficult to separate.',
      }
    }
    return {
      route: 'dehydration',
      equation: 'CH₃OH + C₂H₅OH (H₂SO₄, 443 K) → CH₂=CH₂ + mixed ethers + H₂O',
      pathway: 'Elimination & Mixed Side-Products',
      isEtherSuccess: false,
      majorProductName: 'Ethene + mixed ethers',
      majorProductFormula: 'CH₂=CH₂ (with CH₃OCH₃ / CH₃OC₂H₅)',
      productSmiles: 'C=C',
      byProducts: 'H₂O',
      yieldBadge: 'Unsuitable for single ether',
      mechanismKind: 'e2-alkene',
      explanation:
        'At 443 K, ethanol eliminates strongly to ethene while methanol cannot dehydrate to an alkene, leaving a mixture unsuitable for clean ether synthesis.',
    }
  }

  if (alcohol === 'propan-2-ol') {
    return {
      route: 'dehydration',
      equation: `CH₃CH(OH)CH₃ → CH₃CH=CH₂ + H₂O (H₂SO₄, ${tempK} K)`,
      pathway: 'Elimination',
      isEtherSuccess: false,
      majorProductName: 'Propene',
      majorProductFormula: 'CH₃CH=CH₂',
      productSmiles: 'CC=C',
      byProducts: 'H₂O',
      yieldBadge: '0% ether (alkene dominates)',
      mechanismKind: 'e2-alkene',
      explanation:
        'With a 2° alcohol, dehydration shifts toward a carbocation-like route where elimination outpaces substitution, giving propene instead of an ether.',
    }
  }

  return {
    route: 'dehydration',
    equation: `(CH₃)₃COH → CH₂=C(CH₃)₂ + H₂O (H₂SO₄, ${tempK} K)`,
    pathway: 'Elimination',
    isEtherSuccess: false,
    majorProductName: '2-Methylpropene',
    majorProductFormula: 'CH₂=C(CH₃)₂',
    productSmiles: 'CC(=C)C',
    byProducts: 'H₂O',
    yieldBadge: '0% ether (alkene only)',
    mechanismKind: 'e2-alkene',
    explanation:
      'Tertiary alcohols form a stable 3° carbocation rapidly and undergo elimination to 2-methylpropene; acid dehydration cannot make tert-butyl ether.',
  }
}

const WILLIAMSON_ETHER_MAP: Readonly<
  Record<
    WilliamsonNucleophile,
    Readonly<
      Record<'CH3-Br' | 'CH3CH2-Br', { name: string; subtitle?: string; formula: string; smiles: string }>
    >
  >
> = {
  methoxide: {
    'CH3-Br': { name: 'Methoxymethane', formula: 'CH₃OCH₃', smiles: 'COC' },
    'CH3CH2-Br': { name: 'Methoxyethane', formula: 'CH₃OCH₂CH₃', smiles: 'COCC' },
  },
  'tert-butoxide': {
    'CH3-Br': {
      name: '2-Methoxy-2-methylpropane',
      subtitle: 'tert-butyl methyl ether',
      formula: '(CH₃)₃C–O–CH₃',
      smiles: 'CC(C)(C)OC',
    },
    'CH3CH2-Br': {
      name: '2-Ethoxy-2-methylpropane',
      subtitle: 'tert-butyl ethyl ether',
      formula: '(CH₃)₃C–O–CH₂CH₃',
      smiles: 'CC(C)(C)OCC',
    },
  },
  phenoxide: {
    'CH3-Br': {
      name: 'Methoxybenzene',
      subtitle: 'Anisole',
      formula: 'C₆H₅OCH₃',
      smiles: 'COC1=CC=CC=C1',
    },
    'CH3CH2-Br': {
      name: 'Ethoxybenzene',
      subtitle: 'Phenetole',
      formula: 'C₆H₅OCH₂CH₃',
      smiles: 'CCOC1=CC=CC=C1',
    },
  },
}

/** Resolve Williamson synthesis outcome for the selected nucleophile and alkyl halide. */
export function evaluateWilliamson(
  nucleophile: WilliamsonNucleophile,
  halide: WilliamsonHalide
): SynthesisOutcome {
  const nucInfo = WILLIAMSON_NUCLEOPHILES.find((n) => n.id === nucleophile)!
  const halInfo = WILLIAMSON_HALIDES.find((h) => h.id === halide)!

  if (halide === '(CH3)3C-Br') {
    return {
      route: 'williamson',
      equation: `(CH₃)₃C–Br + ${nucInfo.formula} → CH₂=C(CH₃)₂ + NaBr + ${nucInfo.conjugateAlcohol}`,
      pathway: 'Elimination',
      isEtherSuccess: false,
      majorProductName: '2-Methylpropene',
      majorProductFormula: 'CH₂=C(CH₃)₂',
      productSmiles: 'CC(=C)C',
      byProducts: `NaBr + ${nucInfo.conjugateAlcohol}`,
      yieldBadge: nucInfo.isAryl ? '0% ether (elimination)' : '0% ether (alkene only)',
      mechanismKind: nucInfo.isAryl ? 'aryl-e2' : 'e2-alkene',
      explanation:
        'Three methyl groups block backside SN2 attack on the 3° halide, so the strong base abstracts a β-proton instead to form 2-methylpropene with zero ether.',
    }
  }

  const product = WILLIAMSON_ETHER_MAP[nucleophile][halide]
  const fullLabel = product.subtitle ? `${product.name} (${product.subtitle})` : product.name
  return {
    route: 'williamson',
    equation: `${halInfo.formula} + ${nucInfo.formula} → ${product.formula} + NaBr`,
    pathway: 'SN2 Substitution',
    isEtherSuccess: true,
    majorProductName: product.name,
    majorProductSubtitle: product.subtitle,
    majorProductFormula: product.formula,
    productSmiles: product.smiles,
    byProducts: 'NaBr',
    yieldBadge: nucInfo.isAryl ? 'Clean aryl ether' : 'Clean ether yield',
    mechanismKind: nucInfo.isAryl ? 'aryl-sn2' : 'sn2-ether',
    explanation: nucInfo.isAryl
      ? `Sodium phenoxide (prepared from phenol + NaOH) attacks the unhindered 1° halide ${halInfo.formula} by SN2 displacement to yield ${fullLabel}.`
      : nucInfo.isBulky
        ? `Even though ${nucInfo.ionFormula} is bulky, the 1° halide ${halInfo.formula} is unhindered, so SN2 substitution proceeds cleanly to ${fullLabel}.`
        : `${nucInfo.ionFormula} performs backside SN2 attack on the 1° halide ${halInfo.formula}, displacing Br⁻ cleanly to form ${fullLabel}.`,
  }
}

export type PropertyCompoundId = 'n-pentane' | 'ethoxyethane' | 'butan-1-ol'
export type CompoundSelection = PropertyCompoundId | 'all'
export type PhaseView = 'boiling' | 'miscibility'

export interface PhysicalPropertyRecord {
  id: PropertyCompoundId
  name: string
  compoundClass: 'alkane' | 'ether' | 'alcohol'
  formula: string
  smiles: string
  bpK: number
  printedBp: string
  miscibilityGPer100Ml: number | null
  printedMiscibility: string
  hBondDonor: boolean
  hBondDonorLabel: string
  hBondAcceptor: boolean
  hBondAcceptorLabel: string
  pureLiquidInteraction: string
  aqueousInteraction: string
}

const bpMap = new Map(NCERT_7_6_2_BOILING_COMPARISON.map((entry) => [entry.name.toLowerCase(), entry]))
const miscMap = new Map(NCERT_7_6_2_WATER_MISCIBILITY.map((entry) => [entry.name.toLowerCase(), entry]))

export const ETHER_ANGLE_DEG =
  NCERT_FIG_7_1_STRUCTURES.find((s) => s.id === 'methoxymethane')?.bondAngleDeg ?? 111.7
export const ETHER_CO_LENGTH_PM =
  NCERT_FIG_7_1_STRUCTURES.find((s) => s.id === 'methoxymethane')?.coBondLengthPm ?? 141

export const PHYSICAL_PROPERTY_RECORDS: readonly PhysicalPropertyRecord[] = [
  {
    id: 'n-pentane',
    name: 'n-Pentane',
    compoundClass: 'alkane',
    formula: bpMap.get('n-pentane')!.unicode,
    smiles: bpMap.get('n-pentane')!.smiles,
    bpK: bpMap.get('n-pentane')!.bpK,
    printedBp: bpMap.get('n-pentane')!.printedBp,
    miscibilityGPer100Ml: miscMap.get('n-pentane')!.gPer100MlWater,
    printedMiscibility: 'Essentially immiscible',
    hBondDonor: false,
    hBondDonorLabel: 'No',
    hBondAcceptor: false,
    hBondAcceptorLabel: 'No',
    pureLiquidInteraction: 'Weak dispersion forces only (nonpolar alkane)',
    aqueousInteraction: 'Cannot hydrogen-bond with water; separates as an immiscible top layer',
  },
  {
    id: 'ethoxyethane',
    name: 'Ethoxyethane',
    compoundClass: 'ether',
    formula: bpMap.get('ethoxyethane')!.unicode,
    smiles: bpMap.get('ethoxyethane')!.smiles,
    bpK: bpMap.get('ethoxyethane')!.bpK,
    printedBp: bpMap.get('ethoxyethane')!.printedBp,
    miscibilityGPer100Ml: miscMap.get('ethoxyethane')!.gPer100MlWater,
    printedMiscibility: miscMap.get('ethoxyethane')!.printed,
    hBondDonor: false,
    hBondDonorLabel: 'No (no O–H)',
    hBondAcceptor: true,
    hBondAcceptorLabel: 'Yes (2 lone pairs on O)',
    pureLiquidInteraction: 'Weak dipole-dipole + dispersion; no O–H for self H-bonding',
    aqueousInteraction: 'Oxygen lone pairs accept H-bonds from H₂O (R₂O⋯H–O–H)',
  },
  {
    id: 'butan-1-ol',
    name: 'Butan-1-ol',
    compoundClass: 'alcohol',
    formula: bpMap.get('butan-1-ol')!.unicode,
    smiles: bpMap.get('butan-1-ol')!.smiles,
    bpK: bpMap.get('butan-1-ol')!.bpK,
    printedBp: bpMap.get('butan-1-ol')!.printedBp,
    miscibilityGPer100Ml: miscMap.get('butan-1-ol')!.gPer100MlWater,
    printedMiscibility: miscMap.get('butan-1-ol')!.printed,
    hBondDonor: true,
    hBondDonorLabel: 'Yes (O–H)',
    hBondAcceptor: true,
    hBondAcceptorLabel: 'Yes (lone pairs on O)',
    pureLiquidInteraction: 'Strong intermolecular O–H⋯O hydrogen bonding',
    aqueousInteraction: 'Both donates and accepts hydrogen bonds with water',
  },
] as const

export function getPhysicalPropertyRecord(id: PropertyCompoundId): PhysicalPropertyRecord {
  return PHYSICAL_PROPERTY_RECORDS.find((r) => r.id === id)!
}

export const BOILING_GAP_ALCOHOL_VS_ETHER_K = Number(
  (
    getPhysicalPropertyRecord('butan-1-ol').bpK -
    getPhysicalPropertyRecord('ethoxyethane').bpK
  ).toFixed(1)
)
