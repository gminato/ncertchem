/**
 * Pure chemistry model for Class 12 Unit 7, Section 7.4.4:
 * Acidity of alcohols and phenols, Table 7.3 pKa comparisons, active-metal / NaOH tests,
 * and esterification / acetylation (including aspirin synthesis).
 *
 * Tabulated pKa values and reaction conditions are imported from `ncert-c12-unit7-data.ts`.
 */

import {
  NCERT_7_4_4_ALCOHOL_REACTIONS,
  NCERT_TABLE_7_3,
  NCERT_UNIT7_ORDERS,
} from './ncert-c12-unit7-data'

export type AcidityCompoundId =
  | 'p-nitrophenol'
  | 'o-nitrophenol'
  | 'm-nitrophenol'
  | 'phenol'
  | 'm-cresol'
  | 'o-cresol'
  | 'p-cresol'
  | 'water'
  | 'ethanol'
  | 'propan-2-ol'
  | 'tert-butanol'

export type AcidityCategory = 'nitrophenol' | 'phenol' | 'cresol' | 'water' | 'alcohol'
export type ReagentTestId = 'Na' | 'Al' | 'NaOH'

export interface RingSubstituentSpec {
  /** Ring carbon position relative to -OH at C1: 2 (ortho), 3 (meta), 4 (para). */
  position: 2 | 3 | 4
  group: 'NO₂' | 'CH₃'
  effectBadge: '−R, −I (captures charge)' | '−I only (off resonance path)' | '+I (electron-releasing)'
}

export interface AcidityCompound {
  id: AcidityCompoundId
  name: string
  shortName: string
  formula: string
  conjugateBaseFormula: string
  category: AcidityCategory
  alcoholDegree: '1°' | '2°' | '3°' | null
  carbonHybridisation: 'sp²' | 'sp³' | null
  /** Exact NCERT Table 7.3 value, or null for qualitative entries (water, 2°, 3° alcohols). */
  pKa: number | null
  printedPka: string | null
  /** Strict acidity rank (1 = strongest among these 11; o-cresol & p-cresol tie at 6). */
  acidityRank: number
  isAromatic: boolean
  resonanceDelocalised: boolean
  substituent: RingSubstituentSpec | null
  chargeDistributionSummary: string
  explanation: string
}

function table73(name: string) {
  const row = NCERT_TABLE_7_3.find((entry) => entry.name === name)
  if (!row) throw new Error(`Missing Table 7.3 entry: ${name}`)
  return row
}

const pNitro = table73('p-Nitrophenol')
const oNitro = table73('o-Nitrophenol')
const mNitro = table73('m-Nitrophenol')
const phenolRow = table73('Phenol')
const mCresol = table73('m-Cresol')
const oCresol = table73('o-Cresol')
const pCresol = table73('p-Cresol')
const ethanolRow = table73('Ethanol')

export const ACIDITY_COMPOUNDS: readonly AcidityCompound[] = [
  {
    id: 'p-nitrophenol',
    name: pNitro.name,
    shortName: 'p-NO₂ phenol',
    formula: pNitro.unicode,
    conjugateBaseFormula: 'p-O₂N–C₆H₄–O⁻',
    category: 'nitrophenol',
    alcoholDegree: null,
    carbonHybridisation: 'sp²',
    pKa: pNitro.pKa,
    printedPka: pNitro.printed,
    acidityRank: 1,
    isAromatic: true,
    resonanceDelocalised: true,
    substituent: { position: 4, group: 'NO₂', effectBadge: '−R, −I (captures charge)' },
    chargeDistributionSummary: 'O, C-2, C-4, C-6, and para-NO₂ oxygens',
    explanation:
      'The para nitro group sits directly on a negative-charge carbon in phenoxide resonance, pulling charge onto its own oxygens (−R and −I) and strongly stabilising the conjugate base.',
  },
  {
    id: 'o-nitrophenol',
    name: oNitro.name,
    shortName: 'o-NO₂ phenol',
    formula: oNitro.unicode,
    conjugateBaseFormula: 'o-O₂N–C₆H₄–O⁻',
    category: 'nitrophenol',
    alcoholDegree: null,
    carbonHybridisation: 'sp²',
    pKa: oNitro.pKa,
    printedPka: oNitro.printed,
    acidityRank: 2,
    isAromatic: true,
    resonanceDelocalised: true,
    substituent: { position: 2, group: 'NO₂', effectBadge: '−R, −I (captures charge)' },
    chargeDistributionSummary: 'O, C-2, C-4, C-6, and ortho-NO₂ oxygens',
    explanation:
      'At the ortho carbon (C-2), −NO₂ directly receives the delocalised negative charge of phenoxide onto its oxygens (−R and −I), dropping pKₐ from 10.0 to 7.2.',
  },
  {
    id: 'm-nitrophenol',
    name: mNitro.name,
    shortName: 'm-NO₂ phenol',
    formula: mNitro.unicode,
    conjugateBaseFormula: 'm-O₂N–C₆H₄–O⁻',
    category: 'nitrophenol',
    alcoholDegree: null,
    carbonHybridisation: 'sp²',
    pKa: mNitro.pKa,
    printedPka: mNitro.printed,
    acidityRank: 3,
    isAromatic: true,
    resonanceDelocalised: true,
    substituent: { position: 3, group: 'NO₂', effectBadge: '−I only (off resonance path)' },
    chargeDistributionSummary: 'O, C-2, C-4, and C-6 (misses C-3 meta-NO₂)',
    explanation:
      'Phenoxide negative charge appears only at ortho and para carbons (C-2, C-4, C-6), never at meta (C-3). Thus meta-NO₂ stabilises phenoxide through −I induction alone (pKₐ 8.3).',
  },
  {
    id: 'phenol',
    name: phenolRow.name,
    shortName: 'Phenol',
    formula: phenolRow.unicode,
    conjugateBaseFormula: 'C₆H₅–O⁻',
    category: 'phenol',
    alcoholDegree: null,
    carbonHybridisation: 'sp²',
    pKa: phenolRow.pKa,
    printedPka: phenolRow.printed,
    acidityRank: 4,
    isAromatic: true,
    resonanceDelocalised: true,
    substituent: null,
    chargeDistributionSummary: 'O and 3 ring carbons (C-2, C-4, C-6)',
    explanation:
      'The electronegative sp² ring carbon polarises the O-H bond, and phenoxide spreads its negative charge across oxygen and three ring carbons (ortho/para) without charge separation.',
  },
  {
    id: 'm-cresol',
    name: mCresol.name,
    shortName: 'm-Cresol',
    formula: mCresol.unicode,
    conjugateBaseFormula: 'm-CH₃–C₆H₄–O⁻',
    category: 'cresol',
    alcoholDegree: null,
    carbonHybridisation: 'sp²',
    pKa: mCresol.pKa,
    printedPka: mCresol.printed,
    acidityRank: 5,
    isAromatic: true,
    resonanceDelocalised: true,
    substituent: { position: 3, group: 'CH₃', effectBadge: '+I (electron-releasing)' },
    chargeDistributionSummary: 'O, C-2, C-4, C-6; +I CH₃ slightly opposes ionisation',
    explanation:
      'Electron-releasing −CH₃ opposes negative-charge build-up in the phenoxide ion, raising pKₐ slightly from 10.0 (phenol) to 10.1.',
  },
  {
    id: 'o-cresol',
    name: oCresol.name,
    shortName: 'o-Cresol',
    formula: oCresol.unicode,
    conjugateBaseFormula: 'o-CH₃–C₆H₄–O⁻',
    category: 'cresol',
    alcoholDegree: null,
    carbonHybridisation: 'sp²',
    pKa: oCresol.pKa,
    printedPka: oCresol.printed,
    acidityRank: 6,
    isAromatic: true,
    resonanceDelocalised: true,
    substituent: { position: 2, group: 'CH₃', effectBadge: '+I (electron-releasing)' },
    chargeDistributionSummary: 'O, C-2, C-4, C-6; ortho-CH₃ destabilises phenoxide',
    explanation:
      'An ortho methyl group releases electron density (+I) directly toward a charge-bearing carbon, slightly destabilising phenoxide (pKₐ 10.2).',
  },
  {
    id: 'p-cresol',
    name: pCresol.name,
    shortName: 'p-Cresol',
    formula: pCresol.unicode,
    conjugateBaseFormula: 'p-CH₃–C₆H₄–O⁻',
    category: 'cresol',
    alcoholDegree: null,
    carbonHybridisation: 'sp²',
    pKa: pCresol.pKa,
    printedPka: pCresol.printed,
    acidityRank: 6,
    isAromatic: true,
    resonanceDelocalised: true,
    substituent: { position: 4, group: 'CH₃', effectBadge: '+I (electron-releasing)' },
    chargeDistributionSummary: 'O, C-2, C-4, C-6; para-CH₃ destabilises phenoxide',
    explanation:
      'A para methyl group releases electron density (+I), making p-cresol (pKₐ 10.2) slightly less acidic than unsubstituted phenol (10.0).',
  },
  {
    id: 'water',
    name: 'Water (H₂O)',
    shortName: 'Water',
    formula: 'H–O–H',
    conjugateBaseFormula: 'OH⁻',
    category: 'water',
    alcoholDegree: null,
    carbonHybridisation: null,
    pKa: null,
    printedPka: null,
    acidityRank: 7,
    isAromatic: false,
    resonanceDelocalised: false,
    substituent: null,
    chargeDistributionSummary: 'Localised on O (no +I alkyl push)',
    explanation:
      'Water lacks electron-releasing alkyl groups, so it is a better proton donor than alcohols (R-O⁻ + H₂O → R-OH + OH⁻), though far weaker than phenols.',
  },
  {
    id: 'ethanol',
    name: 'Ethanol (1°)',
    shortName: 'Ethanol (1°)',
    formula: ethanolRow.unicode,
    conjugateBaseFormula: 'CH₃CH₂O⁻',
    category: 'alcohol',
    alcoholDegree: '1°',
    carbonHybridisation: 'sp³',
    pKa: ethanolRow.pKa,
    printedPka: ethanolRow.printed,
    acidityRank: 8,
    isAromatic: false,
    resonanceDelocalised: false,
    substituent: null,
    chargeDistributionSummary: 'Localised solely on one oxygen atom (1 alkyl chain)',
    explanation:
      'Ethoxide has no aromatic ring to disperse negative charge, and the ethyl group (+I) pushes electron density toward O, giving pKₐ 15.9 (weaker than water).',
  },
  {
    id: 'propan-2-ol',
    name: 'Propan-2-ol (2°)',
    shortName: 'Propan-2-ol (2°)',
    formula: 'CH₃CH(OH)CH₃',
    conjugateBaseFormula: '(CH₃)₂CHO⁻',
    category: 'alcohol',
    alcoholDegree: '2°',
    carbonHybridisation: 'sp³',
    pKa: null,
    printedPka: null,
    acidityRank: 9,
    isAromatic: false,
    resonanceDelocalised: false,
    substituent: null,
    chargeDistributionSummary: 'Localised on O; two +I CH₃ groups push e⁻ density',
    explanation:
      'Two alkyl groups on the carbinol carbon exert a stronger +I effect than one, reducing O-H polarity and destabilising the secondary alkoxide ion.',
  },
  {
    id: 'tert-butanol',
    name: '2-Methylpropan-2-ol (3°)',
    shortName: 'tert-Butyl alcohol (3°)',
    formula: '(CH₃)₃COH',
    conjugateBaseFormula: '(CH₃)₃CO⁻',
    category: 'alcohol',
    alcoholDegree: '3°',
    carbonHybridisation: 'sp³',
    pKa: null,
    printedPka: null,
    acidityRank: 10,
    isAromatic: false,
    resonanceDelocalised: false,
    substituent: null,
    chargeDistributionSummary: 'Localised on O; three +I CH₃ groups push e⁻ density',
    explanation:
      'Three electron-releasing methyl groups strongly decrease O-H polarity and destabilise the tert-butoxide ion, making 3° alcohols the weakest acids in the 1° > 2° ≫ 3° trend.',
  },
] as const

export function getAcidityCompound(id: AcidityCompoundId): AcidityCompound {
  const found = ACIDITY_COMPOUNDS.find((c) => c.id === id)
  if (!found) throw new RangeError(`Unknown acidity compound: ${id}`)
  return found
}

export interface AcidityComparison {
  compoundA: AcidityCompound
  compoundB: AcidityCompound
  stronger: 'A' | 'B' | 'equal'
  /** Exact positive pKa gap when both compounds appear in NCERT Table 7.3, otherwise null. */
  deltaPka: number | null
  /** Relative acidity factor 10^(deltaPka) when both pKa values are tabulated, otherwise null. */
  relativeFactor: number | null
  factorDisplay: string
  orderVerdict: string
}

const SUP_DIGITS: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '.': '·',
}

function toSup(s: string): string {
  return s.replace(/[0-9.]/g, (ch) => SUP_DIGITS[ch] ?? ch)
}

function formatAcidityFactor(delta: number, isEqual: boolean): string {
  if (isEqual) return '1× (equal pKₐ)'
  const raw = Math.pow(10, delta)
  const deltaStr = delta.toFixed(1)
  if (delta >= 5.85 && delta <= 5.95) {
    return `10${toSup(deltaStr)} (≈ 7.9 × 10⁵, roughly 10⁶×)`
  }
  if (raw >= 1e4) {
    const exp = Math.floor(Math.log10(raw))
    const mantissa = (raw / Math.pow(10, exp)).toFixed(1)
    return `10${toSup(deltaStr)} (≈ ${mantissa} × 10${toSup(String(exp))}×)`
  }
  if (raw >= 100) {
    return `10${toSup(deltaStr)} (≈ ${Math.round(raw).toLocaleString('en-US')}×)`
  }
  return `10${toSup(deltaStr)} (≈ ${raw.toFixed(1)}×)`
}

export function compareAcidity(idA: AcidityCompoundId, idB: AcidityCompoundId): AcidityComparison {
  const a = getAcidityCompound(idA)
  const b = getAcidityCompound(idB)

  let stronger: 'A' | 'B' | 'equal'
  if (a.acidityRank < b.acidityRank) stronger = 'A'
  else if (b.acidityRank < a.acidityRank) stronger = 'B'
  else stronger = 'equal'

  if (a.pKa !== null && b.pKa !== null) {
    const deltaPka = Number(Math.abs(a.pKa - b.pKa).toFixed(1))
    const relativeFactor = Math.pow(10, deltaPka)
    const factorDisplay = formatAcidityFactor(deltaPka, stronger === 'equal')
    const orderVerdict =
      stronger === 'equal'
        ? `${a.shortName} and ${b.shortName} share pKₐ = ${a.printedPka} in Table 7.3.`
        : stronger === 'A'
          ? `${a.shortName} (pKₐ ${a.printedPka}) is stronger than ${b.shortName} (pKₐ ${b.printedPka}).`
          : `${b.shortName} (pKₐ ${b.printedPka}) is stronger than ${a.shortName} (pKₐ ${a.printedPka}).`

    return { compoundA: a, compoundB: b, stronger, deltaPka, relativeFactor, factorDisplay, orderVerdict }
  }

  const orderVerdict =
    stronger === 'equal'
      ? `${a.shortName} and ${b.shortName} are the same species.`
      : stronger === 'A'
        ? `${a.shortName} > ${b.shortName} by NCERT qualitative order (${NCERT_UNIT7_ORDERS.bronstedAcidStrength}; ${NCERT_UNIT7_ORDERS.alcoholAcidity}).`
        : `${b.shortName} > ${a.shortName} by NCERT qualitative order (${NCERT_UNIT7_ORDERS.bronstedAcidStrength}; ${NCERT_UNIT7_ORDERS.alcoholAcidity}).`

  return {
    compoundA: a,
    compoundB: b,
    stronger,
    deltaPka: null,
    relativeFactor: null,
    factorDisplay: 'Qualitative order (no Table 7.3 pKₐ printed for 2°/3° or H₂O)',
    orderVerdict,
  }
}

export interface ReagentOutcome {
  compoundId: AcidityCompoundId
  reagent: ReagentTestId
  reacts: boolean
  gasEvolved: boolean
  badge: string
  productName: string
  equation: string
  explanation: string
}

export function reagentTestOutcome(id: AcidityCompoundId, reagent: ReagentTestId): ReagentOutcome {
  const c = getAcidityCompound(id)

  if (reagent === 'Na') {
    if (c.category === 'water') {
      return {
        compoundId: id,
        reagent,
        reacts: true,
        gasEvolved: true,
        badge: 'Reacts vigorously (H₂ ↑)',
        productName: 'Sodium hydroxide (NaOH) + H₂',
        equation: '2 H₂O + 2 Na → 2 NaOH + H₂ ↑',
        explanation: 'Sodium reduces water briskly, liberating hydrogen gas and forming aqueous hydroxide.',
      }
    }
    const isPhenol = c.isAromatic
    const salt = isPhenol ? `${c.conjugateBaseFormula}Na⁺` : c.id === 'ethanol' ? 'C₂H₅ONa' : `${c.conjugateBaseFormula}Na⁺`
    return {
      compoundId: id,
      reagent,
      reacts: true,
      gasEvolved: true,
      badge: 'Reacts (H₂ gas ↑)',
      productName: isPhenol ? `Sodium phenoxide (${salt})` : `Sodium alkoxide (${salt})`,
      equation: isPhenol
        ? `2 ${c.formula} + 2 Na → 2 ${salt} + H₂ ↑`
        : `2 ${c.formula} + 2 Na → 2 ${salt} + H₂ ↑`,
      explanation: `Active metal Na cleaves the O-H bond in both alcohols and phenols, liberating H₂ gas and proving Brønsted acidity.`,
    }
  }

  if (reagent === 'Al') {
    if (c.id === 'tert-butanol') {
      return {
        compoundId: id,
        reagent,
        reacts: true,
        gasEvolved: true,
        badge: 'Reacts (H₂ gas ↑)',
        productName: 'Aluminium tert-butoxide',
        equation: '6 (CH₃)₃C–OH + 2 Al → 2 ((CH₃)₃C–O)₃Al + 3 H₂ ↑',
        explanation:
          'Even the weakest 3° alcohol reacts with active aluminium metal to yield aluminium tert-butoxide and hydrogen gas (NCERT 7.4.4).',
      }
    }
    if (c.category === 'water') {
      return {
        compoundId: id,
        reagent,
        reacts: true,
        gasEvolved: true,
        badge: 'Active metal (slow at 298 K)',
        productName: 'Aluminium hydroxide + H₂',
        equation: '2 Al + 6 H₂O → 2 Al(OH)₃ + 3 H₂ ↑',
        explanation: 'Aluminium is an active metal; pure Al reacts with water to liberate H₂, though a thin oxide coat slows cold water.',
      }
    }
    const baseStem = c.conjugateBaseFormula.replace(/⁻$/, '')
    return {
      compoundId: id,
      reagent,
      reacts: true,
      gasEvolved: true,
      badge: 'Reacts (H₂ gas ↑)',
      productName: c.isAromatic ? 'Aluminium phenoxide' : 'Aluminium alkoxide',
      equation: `6 ${c.formula} + 2 Al → 2 (${baseStem})₃Al + 3 H₂ ↑`,
      explanation: `Active metal Al reacts with ${c.shortName} via O-H cleavage to produce the trivalent aluminium salt and H₂ gas.`,
    }
  }

  // Aqueous NaOH
  if (c.isAromatic) {
    const salt = c.id === 'phenol' ? 'C₆H₅–ONa' : `${c.conjugateBaseFormula}Na⁺`
    return {
      compoundId: id,
      reagent,
      reacts: true,
      gasEvolved: false,
      badge: 'Dissolves (salt formed)',
      productName: c.id === 'phenol' ? 'Sodium phenoxide + H₂O' : `Sodium phenoxide derivative + H₂O`,
      equation: `${c.formula} + NaOH (aq) → ${salt} + H₂O`,
      explanation: `Phenols are stronger Brønsted acids than water (${NCERT_UNIT7_ORDERS.bronstedAcidStrength}), so OH⁻ quantitatively deprotonates ${c.shortName}.`,
    }
  }

  if (c.category === 'water') {
    return {
      compoundId: id,
      reagent,
      reacts: false,
      gasEvolved: false,
      badge: 'Solvent reference',
      productName: 'No net change (H₂O / OH⁻ pair)',
      equation: 'H–O–H + OH⁻ ⇌ OH⁻ + H–O–H',
      explanation: 'Water is the conjugate acid of hydroxide ion (OH⁻) and defines the threshold between phenols (react with NaOH) and alcohols (do not).',
    }
  }

  return {
    compoundId: id,
    reagent,
    reacts: false,
    gasEvolved: false,
    badge: 'No reaction with aq. NaOH',
    productName: 'Alkoxide not formed in water',
    equation: `${c.conjugateBaseFormula} + H₂O → ${c.formula} + OH⁻ (reverse dominates)`,
    explanation: `Alcohols are weaker acids than water. Hydroxide (OH⁻) is too weak a base to pull the proton off ${c.shortName}; water immediately re-protonates any alkoxide.`,
  }
}

// ---------------------------------------------------------------------------------------------
// Esterification Bench (Section 7.4.4(a)(2))
// ---------------------------------------------------------------------------------------------

export type EsterSubstrateId = 'ethanol' | 'phenol' | 'salicylic-acid'
export type AcylReagentId = 'carboxylic-acid' | 'anhydride' | 'acyl-chloride'

export interface EsterSubstrateInfo {
  id: EsterSubstrateId
  name: string
  formula: string
  reactingGroup: string
}

export const ESTER_SUBSTRATES: readonly EsterSubstrateInfo[] = [
  { id: 'ethanol', name: 'Ethanol', formula: 'C₂H₅–OH', reactingGroup: '1° alcoholic –OH' },
  { id: 'phenol', name: 'Phenol', formula: 'C₆H₅–OH', reactingGroup: 'phenolic –OH' },
  {
    id: 'salicylic-acid',
    name: 'Salicylic acid',
    formula: 'HO–C₆H₄–COOH',
    reactingGroup: 'phenolic –OH (C-2), while –COOH stays intact',
  },
] as const

export interface AcylReagentInfo {
  id: AcylReagentId
  label: string
  formula: string
  classLabel: string
}

export const ACYL_REAGENTS: readonly AcylReagentInfo[] = [
  { id: 'carboxylic-acid', label: "Carboxylic acid (R'COOH)", formula: "R'–COOH", classLabel: 'Carboxylic acid' },
  { id: 'anhydride', label: "Acid anhydride ((R'CO)₂O)", formula: "(R'CO)₂O", classLabel: 'Acid anhydride' },
  { id: 'acyl-chloride', label: "Acid chloride (R'COCl)", formula: "R'–COCl", classLabel: 'Acid chloride' },
] as const

export interface EsterificationResult {
  substrate: EsterSubstrateInfo
  reagent: AcylReagentInfo
  trapActive: boolean
  isAspirinSynthesis: boolean
  catalystOrBase: string
  reversible: boolean
  byproduct: string
  productName: string
  productFormula: string
  equation: string
  trapLabel: string
  trapEffectText: string
  /** 0..1 visual equilibrium position toward ester product (for the Le Chatelier gauge). */
  equilibriumPosition: number
  verdictBadge: string
  explanation: string
}

export function esterificationOutcome(
  substrateId: EsterSubstrateId,
  reagentId: AcylReagentId,
  trapActive: boolean
): EsterificationResult {
  const substrate = ESTER_SUBSTRATES.find((s) => s.id === substrateId)!
  const reagent = ACYL_REAGENTS.find((r) => r.id === reagentId)!
  const isAspirinSynthesis = substrateId === 'salicylic-acid' && reagentId === 'anhydride'

  const acidCatalyst = NCERT_7_4_4_ALCOHOL_REACTIONS[0].catalyst ?? 'Conc. H₂SO₄ (H⁺)'
  const aspirinCatalyst = NCERT_7_4_4_ALCOHOL_REACTIONS[2].catalyst ?? 'H⁺'

  if (reagentId === 'acyl-chloride') {
    const productName =
      substrateId === 'ethanol'
        ? 'Ethyl ester'
        : substrateId === 'phenol'
          ? 'Phenyl ester'
          : '2-Acyloxybenzoic acid (salicyl ester)'
    const productFormula =
      substrateId === 'ethanol'
        ? "C₂H₅–OCOR'"
        : substrateId === 'phenol'
          ? "C₆H₅–OCOR'"
          : "R'COO–C₆H₄–COOH"
    return {
      substrate,
      reagent,
      trapActive,
      isAspirinSynthesis: false,
      catalystOrBase: trapActive ? 'Pyridine (neutralises HCl)' : 'No Pyridine base',
      reversible: !trapActive,
      byproduct: trapActive ? 'HCl → Pyridinium chloride' : 'HCl (untrapped)',
      productName,
      productFormula,
      equation: `${substrate.formula} + ${reagent.formula} ${trapActive ? '→' : '⇌'} ${productFormula} + HCl  (${trapActive ? 'Pyridine' : 'no base trap'})`,
      trapLabel: 'Add Pyridine (neutralise HCl)',
      trapEffectText: trapActive
        ? 'Pyridine neutralises HCl immediately as it forms, shifting the equilibrium cleanly to the right.'
        : 'Without pyridine, HCl accumulates in the mixture and hinders complete conversion.',
      equilibriumPosition: trapActive ? 0.94 : 0.45,
      verdictBadge: trapActive ? 'Driven right by Pyridine' : 'HCl build-up stalls yield',
      explanation:
        'Acid chlorides cleave the O-H bond of alcohols and phenols to release HCl. Pyridine captures HCl as a salt so the reaction goes cleanly toward the ester.',
    }
  }

  if (reagentId === 'anhydride') {
    if (isAspirinSynthesis) {
      return {
        substrate,
        reagent,
        trapActive,
        isAspirinSynthesis: true,
        catalystOrBase: aspirinCatalyst + ' (conc. H₂SO₄)',
        reversible: !trapActive,
        byproduct: 'CH₃COOH (acetic acid)',
        productName: 'Acetylsalicylic acid (Aspirin)',
        productFormula: 'CH₃COO–C₆H₄–COOH',
        equation: `HO–C₆H₄–COOH + (CH₃CO)₂O ${trapActive ? '→' : '⇌'} CH₃COO–C₆H₄–COOH + CH₃COOH  (catalyst: H⁺)`,
        trapLabel: 'Drive equilibrium right (excess anhydride / acid removal)',
        trapEffectText: trapActive
          ? 'Acetylating the phenolic –OH with (CH₃CO)₂O / H⁺ selectively yields Aspirin (analgesic, anti-inflammatory, antipyretic).'
          : 'Equilibrium sits partly left if acetic acid accumulates without driving conditions.',
        equilibriumPosition: trapActive ? 0.91 : 0.56,
        verdictBadge: 'NCERT Aspirin synthesis',
        explanation:
          'Acetylation introduces a CH₃CO– group onto the phenolic –OH of salicylic acid while leaving –COOH untouched, yielding acetylsalicylic acid (aspirin) and acetic acid.',
      }
    }

    const productName = substrateId === 'ethanol' ? 'Ethyl ester' : 'Phenyl ester'
    const productFormula = substrateId === 'ethanol' ? "C₂H₅–OCOR'" : "C₆H₅–OCOR'"
    return {
      substrate,
      reagent,
      trapActive,
      isAspirinSynthesis: false,
      catalystOrBase: acidCatalyst,
      reversible: true,
      byproduct: "R'COOH",
      productName,
      productFormula,
      equation: `${substrate.formula} + (R'CO)₂O ⇌ ${productFormula} + R'COOH  (catalyst: H⁺)`,
      trapLabel: 'Shift equilibrium right (remove carboxylic acid / excess reagent)',
      trapEffectText: trapActive
        ? 'Removing byproduct acid shifts the acid-catalysed equilibrium toward the ester.'
        : 'Reversible acid-catalysed equilibrium leaves unconverted starting material.',
      equilibriumPosition: trapActive ? 0.86 : 0.52,
      verdictBadge: trapActive ? 'Shifted right' : 'Reversible equilibrium',
      explanation:
        'Acid anhydrides react with alcohols and phenols in the presence of a small amount of conc. H₂SO₄, cleaving the O-H bond to give the ester and one equivalent of carboxylic acid.',
    }
  }

  // Carboxylic acid
  const productName =
    substrateId === 'ethanol'
      ? 'Ethyl ester'
      : substrateId === 'phenol'
        ? 'Phenyl ester'
        : '2-Acyloxybenzoic acid'
  const productFormula =
    substrateId === 'ethanol'
      ? "C₂H₅–OCOR'"
      : substrateId === 'phenol'
        ? "C₆H₅–OCOR'"
        : "R'COO–C₆H₄–COOH"
  return {
    substrate,
    reagent,
    trapActive,
    isAspirinSynthesis: false,
    catalystOrBase: acidCatalyst,
    reversible: true,
    byproduct: 'H₂O',
    productName,
    productFormula,
    equation: `${substrate.formula} + R'–COOH ⇌ ${productFormula} + H₂O  (catalyst: H⁺)`,
    trapLabel: 'Remove H₂O continuously',
    trapEffectText: trapActive
      ? 'Water is removed as soon as it forms, blocking reverse hydrolysis and shifting equilibrium right.'
      : 'Water remains in the flask, driving reverse hydrolysis back toward reactants.',
    equilibriumPosition: trapActive ? 0.87 : 0.36,
    verdictBadge: trapActive ? 'Shifted right (H₂O removed)' : 'Reversible (H₂O hydrolyses ester)',
    explanation:
      substrateId === 'ethanol'
        ? 'Alcohol + carboxylic acid with catalytic conc. H₂SO₄ is reversible; continuous removal of H₂O shifts the equilibrium toward the ester.'
        : 'Phenolic O-H reacts reversibly with R′COOH under conc. H₂SO₄ catalysis (anhydrides or acyl chlorides are even more effective acylating agents).',
  }
}
