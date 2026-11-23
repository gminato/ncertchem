/**
 * Chemistry logic and NCERT Unit 7 Section 7.4.4(b) reaction evaluator for
 * C-O cleavage, dehydration, Lucas test, oxidation, and heated Cu pathways.
 *
 * All printed temperatures, reagents, products, and reactivity orders come from
 * `ncert-c12-unit7-data.ts` (NCERT Class 12 Part II, Unit 7, Section 7.4.4).
 */

import {
  NCERT_7_4_4_ALCOHOL_DEHYDRATION,
  NCERT_7_4_4_ALCOHOL_REACTIONS,
  NCERT_UNIT7_ORDERS,
} from './ncert-c12-unit7-data'

export type SubstrateId = 'ethanol' | 'propan-2-ol' | '2-methylpropan-2-ol' | 'but-2-en-1-ol'

export type ReagentId = 'lucas' | 'dehydration' | 'pcc' | 'cro3' | 'kmno4' | 'cu-573k'

export type DehydrationConditionId =
  | 'matched'
  | '20-h3po4-358k'
  | '85-h3po4-440k'
  | 'conc-h2so4-443k'

export type AlcoholDegree = '1°' | '2°' | '3°'

export type HighlightMode =
  | 'co'
  | 'co-beta-ch'
  | 'oh-alpha-ch'
  | 'oh-alpha-ch-and-cc-double'
  | 'cc-cleave'
  | 'none'

export type DiagnosticMode = 'lucas' | 'dehydration' | 'oxidation'

export interface SubstrateMeta {
  id: SubstrateId
  name: string
  shortLabel: string
  degree: AlcoholDegree
  classLabel: string
  formula: string
  alphaHydrogens: number
  isAllylic: boolean
  carbocationNote: string
  /** Relative E1 carbocation barrier rank: 1 = lowest (3°), 2 = medium (2°), 3 = highest (1°). */
  dehydrationRank: 1 | 2 | 3
  matchedDehydrationId: DehydrationConditionId
}

export interface ReagentMeta {
  id: ReagentId
  label: string
  shortLabel: string
  diagnosticMode: DiagnosticMode
}

export interface DehydrationConditionMeta {
  id: DehydrationConditionId
  label: string
  reagentText: string
  temperatureK: number | null
  /** Acid/thermal severity rank: 1 = 20% H₃PO₄ 358 K, 2 = 85% H₃PO₄ 440 K, 3 = conc. H₂SO₄ 443 K. */
  severityRank: 1 | 2 | 3 | null
}

export interface DehydrationAssessment {
  passes: boolean
  requiredLabel: string
  activeLabel: string
  barrierLevel: 'low' | 'medium' | 'high'
  severityRank: 1 | 2 | 3
  requiredRank: 1 | 2 | 3
}

export interface CleavageOutcome {
  substrate: SubstrateMeta
  reagent: ReagentMeta
  diagnosticMode: DiagnosticMode
  reacts: boolean
  reactionType: string
  mechanismNote: string
  bondsCleaved: string
  highlightMode: HighlightMode
  preserveDoubleBond: boolean
  reagentArrowTop: string
  reagentArrowBottom: string
  majorProductName: string
  majorProductFormula: string
  byProduct: string | null
  lucasTurbidity: 'immediate' | 'delayed' | 'none' | null
  dehydrationAssessment: DehydrationAssessment | null
  alphaHydrogens: number
  ncertNote: string
  liveSummary: string
}

const DEHYDRATION_BY_ID = new Map(NCERT_7_4_4_ALCOHOL_DEHYDRATION.map((r) => [r.id, r]))
const REACTION_BY_ID = new Map(NCERT_7_4_4_ALCOHOL_REACTIONS.map((r) => [r.id, r]))

function requireDehydration(id: string) {
  const row = DEHYDRATION_BY_ID.get(id)
  if (!row) throw new Error(`Missing NCERT dehydration record: ${id}`)
  return row
}

function requireReaction(id: string) {
  const row = REACTION_BY_ID.get(id)
  if (!row) throw new Error(`Missing NCERT alcohol reaction record: ${id}`)
  return row
}

export const SUBSTRATES: readonly SubstrateMeta[] = [
  {
    id: 'ethanol',
    name: 'Ethanol',
    shortLabel: 'Ethanol (1°)',
    degree: '1°',
    classLabel: 'Primary (1°) alcohol',
    formula: 'CH₃CH₂OH',
    alphaHydrogens: 2,
    isAllylic: false,
    carbocationNote: '1° ethyl carbocation (least stable)',
    dehydrationRank: 3,
    matchedDehydrationId: 'conc-h2so4-443k',
  },
  {
    id: 'propan-2-ol',
    name: 'Propan-2-ol',
    shortLabel: 'Propan-2-ol (2°)',
    degree: '2°',
    classLabel: 'Secondary (2°) alcohol',
    formula: 'CH₃CH(OH)CH₃',
    alphaHydrogens: 1,
    isAllylic: false,
    carbocationNote: '2° isopropyl carbocation (moderate stability)',
    dehydrationRank: 2,
    matchedDehydrationId: '85-h3po4-440k',
  },
  {
    id: '2-methylpropan-2-ol',
    name: '2-Methylpropan-2-ol',
    shortLabel: '2-Methylpropan-2-ol (3°)',
    degree: '3°',
    classLabel: 'Tertiary (3°) alcohol',
    formula: '(CH₃)₃COH',
    alphaHydrogens: 0,
    isAllylic: false,
    carbocationNote: '3° tert-butyl carbocation (most stable)',
    dehydrationRank: 1,
    matchedDehydrationId: '20-h3po4-358k',
  },
  {
    id: 'but-2-en-1-ol',
    name: 'But-2-en-1-ol',
    shortLabel: 'But-2-en-1-ol (allylic 1°)',
    degree: '1°',
    classLabel: 'Allylic primary (1°) alcohol',
    formula: 'CH₃-CH=CH-CH₂OH',
    alphaHydrogens: 2,
    isAllylic: true,
    carbocationNote: 'Resonance-stabilised allylic carbocation (1° carbinol C)',
    dehydrationRank: 2,
    matchedDehydrationId: '85-h3po4-440k',
  },
] as const

export const REAGENTS: readonly ReagentMeta[] = [
  { id: 'lucas', label: 'Lucas reagent', shortLabel: 'Lucas reagent', diagnosticMode: 'lucas' },
  { id: 'dehydration', label: 'Acid dehydration', shortLabel: 'Acid dehydration', diagnosticMode: 'dehydration' },
  { id: 'pcc', label: 'PCC (anhydrous)', shortLabel: 'PCC', diagnosticMode: 'oxidation' },
  { id: 'cro3', label: 'CrO₃ (anhydrous)', shortLabel: 'CrO₃ (anhyd.)', diagnosticMode: 'oxidation' },
  { id: 'kmno4', label: 'Acidified KMnO₄', shortLabel: 'Acidified KMnO₄', diagnosticMode: 'oxidation' },
  { id: 'cu-573k', label: 'Heated Cu (573 K)', shortLabel: 'Cu, 573 K', diagnosticMode: 'oxidation' },
] as const

export const DEHYDRATION_CONDITIONS: readonly DehydrationConditionMeta[] = [
  { id: 'matched', label: 'Matched (NCERT)', reagentText: 'Matched acid', temperatureK: null, severityRank: null },
  { id: '20-h3po4-358k', label: '20% H₃PO₄, 358 K', reagentText: '20% H₃PO₄', temperatureK: 358, severityRank: 1 },
  { id: '85-h3po4-440k', label: '85% H₃PO₄, 440 K', reagentText: '85% H₃PO₄', temperatureK: 440, severityRank: 2 },
  { id: 'conc-h2so4-443k', label: 'conc. H₂SO₄, 443 K', reagentText: 'conc. H₂SO₄', temperatureK: 443, severityRank: 3 },
] as const

export function findSubstrate(id: SubstrateId): SubstrateMeta {
  return SUBSTRATES.find((s) => s.id === id) ?? SUBSTRATES[0]
}

export function findReagent(id: ReagentId): ReagentMeta {
  return REAGENTS.find((r) => r.id === id) ?? REAGENTS[0]
}

export function findDehydrationCondition(id: DehydrationConditionId): DehydrationConditionMeta {
  return DEHYDRATION_CONDITIONS.find((c) => c.id === id) ?? DEHYDRATION_CONDITIONS[0]
}

function buildSummary(outcome: Omit<CleavageOutcome, 'liveSummary'>): string {
  const parts = [
    `${outcome.substrate.name} (${outcome.substrate.classLabel}) with ${outcome.reagent.label}.`,
    `Reaction type: ${outcome.reactionType}.`,
    `Bonds cleaved: ${outcome.bondsCleaved}.`,
    `Major product: ${outcome.majorProductName} (${outcome.majorProductFormula}).`,
    outcome.byProduct ? `By-product: ${outcome.byProduct}.` : 'No by-product.',
    outcome.ncertNote,
  ]
  return parts.join(' ')
}

function evaluateLucas(sub: SubstrateMeta, reagent: ReagentMeta): CleavageOutcome {
  const lucas = requireReaction('lucas-test')
  if (sub.degree === '3°') {
    const base: Omit<CleavageOutcome, 'liveSummary'> = {
      substrate: sub,
      reagent,
      diagnosticMode: 'lucas',
      reacts: true,
      reactionType: 'Nucleophilic Substitution (Lucas)',
      mechanismNote: sub.carbocationNote,
      bondsCleaved: 'C-O',
      highlightMode: 'co',
      preserveDoubleBond: false,
      reagentArrowTop: 'conc. HCl + anhyd. ZnCl₂',
      reagentArrowBottom: '298 K (room T)',
      majorProductName: '2-Chloro-2-methylpropane',
      majorProductFormula: '(CH₃)₃C-Cl',
      byProduct: lucas.byProducts ?? 'H₂O',
      lucasTurbidity: 'immediate',
      dehydrationAssessment: null,
      alphaHydrogens: sub.alphaHydrogens,
      ncertNote: 'NCERT 7.4.4(b): at room temperature, the 3° alcohol forms a stable carbocation and separates rapidly as immiscible (CH₃)₃C-Cl, causing immediate turbidity.',
    }
    return { ...base, liveSummary: buildSummary(base) }
  }
  if (sub.degree === '2°') {
    const base: Omit<CleavageOutcome, 'liveSummary'> = {
      substrate: sub,
      reagent,
      diagnosticMode: 'lucas',
      reacts: true,
      reactionType: 'Nucleophilic Substitution (Lucas)',
      mechanismNote: sub.carbocationNote,
      bondsCleaved: 'C-O',
      highlightMode: 'co',
      preserveDoubleBond: false,
      reagentArrowTop: 'conc. HCl + anhyd. ZnCl₂',
      reagentArrowBottom: '298 K (delayed)',
      majorProductName: '2-Chloropropane',
      majorProductFormula: 'CH₃CH(Cl)CH₃',
      byProduct: lucas.byProducts ?? 'H₂O',
      lucasTurbidity: 'delayed',
      dehydrationAssessment: null,
      alphaHydrogens: sub.alphaHydrogens,
      ncertNote: 'Delayed turbidity at room temperature: 2° alcohol forms the 2° carbocation more slowly than a 3° alcohol, turning cloudy after standing.',
    }
    return { ...base, liveSummary: buildSummary(base) }
  }
  if (sub.isAllylic) {
    const base: Omit<CleavageOutcome, 'liveSummary'> = {
      substrate: sub,
      reagent,
      diagnosticMode: 'lucas',
      reacts: true,
      reactionType: 'Nucleophilic Substitution (Lucas)',
      mechanismNote: sub.carbocationNote,
      bondsCleaved: 'C-O',
      highlightMode: 'co',
      preserveDoubleBond: true,
      reagentArrowTop: 'conc. HCl + anhyd. ZnCl₂',
      reagentArrowBottom: '298 K (rapid)',
      majorProductName: '1-Chlorobut-2-ene',
      majorProductFormula: 'CH₃-CH=CH-CH₂Cl',
      byProduct: lucas.byProducts ?? 'H₂O',
      lucasTurbidity: 'immediate',
      dehydrationAssessment: null,
      alphaHydrogens: sub.alphaHydrogens,
      ncertNote:
        'NCERT 7.4.4(b) benchmarks saturated 1° ethanol (no turbidity at 298 K), whereas allylic 1° alcohols react rapidly at room temperature via a resonance-stabilised carbocation to form the immiscible allylic chloride.',
    }
    return { ...base, liveSummary: buildSummary(base) }
  }
  const base: Omit<CleavageOutcome, 'liveSummary'> = {
    substrate: sub,
    reagent,
    diagnosticMode: 'lucas',
    reacts: false,
    reactionType: 'No turbidity at room temperature',
    mechanismNote: sub.carbocationNote,
    bondsCleaved: 'None',
    highlightMode: 'none',
    preserveDoubleBond: sub.isAllylic,
    reagentArrowTop: 'conc. HCl + anhyd. ZnCl₂',
    reagentArrowBottom: '298 K (room temp.)',
    majorProductName: 'No turbidity at 298 K',
    majorProductFormula: `${sub.formula} (clear solution)`,
    byProduct: null,
    lucasTurbidity: 'none',
    dehydrationAssessment: null,
    alphaHydrogens: sub.alphaHydrogens,
    ncertNote:
      'Primary (1°) saturated alcohols dissolve in Lucas reagent and react too slowly at room temperature to separate out an immiscible chloride layer.',
  }
  return { ...base, liveSummary: buildSummary(base) }
}

function evaluateDehydration(
  sub: SubstrateMeta,
  reagent: ReagentMeta,
  conditionId: DehydrationConditionId
): CleavageOutcome {
  const eth = requireDehydration('dehydration-primary-ethanol')
  const iso = requireDehydration('dehydration-secondary-propan2ol')
  const tbu = requireDehydration('dehydration-tertiary-tbutanol')

  const effectiveId = conditionId === 'matched' ? sub.matchedDehydrationId : conditionId
  const condMeta = findDehydrationCondition(effectiveId)
  const severity = condMeta.severityRank ?? 3
  const passes = severity >= sub.dehydrationRank

  const barrierLevel: DehydrationAssessment['barrierLevel'] =
    sub.dehydrationRank === 1 ? 'low' : sub.dehydrationRank === 2 ? 'medium' : 'high'

  const requiredLabel =
    sub.id === 'ethanol'
      ? `conc. H₂SO₄, ${eth.temperatureK} K`
      : sub.id === 'propan-2-ol'
        ? `${iso.reagents}, ${iso.temperatureK} K`
        : sub.id === '2-methylpropan-2-ol'
          ? `${tbu.reagents}, ${tbu.temperatureK} K`
          : `${iso.reagents}, ${iso.temperatureK} K`

  const activeLabel = condMeta.label

  const productBySubstrate: Record<SubstrateId, { name: string; formula: string; extraNote: string }> = {
    ethanol: {
      name: 'Ethene',
      formula: 'CH₂=CH₂',
      extraNote: `NCERT 7.4.4(b): ethanol requires conc. H₂SO₄ at ${eth.temperatureK} K via a 1° carbocation (slow RDS Step 2).`,
    },
    'propan-2-ol': {
      name: 'Propene',
      formula: 'CH₃-CH=CH₂',
      extraNote: `NCERT 7.4.4(b): propan-2-ol (2°) dehydrates under milder ${iso.reagents} at ${iso.temperatureK} K.`,
    },
    '2-methylpropan-2-ol': {
      name: '2-Methylpropene',
      formula: 'CH₂=C(CH₃)CH₃',
      extraNote: `NCERT 7.4.4(b): 2-methylpropan-2-ol (3°) forms a stable 3° carbocation and dehydrates at just ${tbu.reagents}, ${tbu.temperatureK} K.`,
    },
    'but-2-en-1-ol': {
      name: 'Buta-1,3-diene',
      formula: 'CH₂=CH-CH=CH₂',
      extraNote: 'Acid-catalysed dehydration proceeds through a resonance-stabilised allylic carbocation to form the conjugated diene; NCERT benchmarks the 1°/2°/3° ladder with ethanol, propan-2-ol, and 2-methylpropan-2-ol.',
    },
  }

  const target = productBySubstrate[sub.id]
  const assessment: DehydrationAssessment = {
    passes,
    requiredLabel,
    activeLabel,
    barrierLevel,
    severityRank: severity,
    requiredRank: sub.dehydrationRank,
  }

  if (!passes) {
    const base: Omit<CleavageOutcome, 'liveSummary'> = {
      substrate: sub,
      reagent,
      diagnosticMode: 'dehydration',
      reacts: false,
      reactionType: 'Barrier Too High (No Alkene)',
      mechanismNote: sub.carbocationNote,
      bondsCleaved: 'None',
      highlightMode: 'none',
      preserveDoubleBond: sub.isAllylic,
      reagentArrowTop: condMeta.reagentText,
      reagentArrowBottom: `${condMeta.temperatureK ?? 358} K`,
      majorProductName: 'No alkene formed under these mild conditions',
      majorProductFormula: `Needs ${requiredLabel}`,
      byProduct: null,
      lucasTurbidity: null,
      dehydrationAssessment: assessment,
      alphaHydrogens: sub.alphaHydrogens,
      ncertNote: `Ease of dehydration: ${NCERT_UNIT7_ORDERS.alcoholDehydrationEase}. ${condMeta.label} is not harsh enough for ${sub.name}; it requires ${requiredLabel}.`,
    }
    return { ...base, liveSummary: buildSummary(base) }
  }

  const base: Omit<CleavageOutcome, 'liveSummary'> = {
    substrate: sub,
    reagent,
    diagnosticMode: 'dehydration',
    reacts: true,
    reactionType: 'E1 Dehydration',
    mechanismNote: sub.carbocationNote,
    bondsCleaved: sub.isAllylic ? 'C-O and allylic C-H' : 'C-O and β-C-H',
    highlightMode: 'co-beta-ch',
    preserveDoubleBond: false,
    reagentArrowTop: condMeta.reagentText,
    reagentArrowBottom: `${condMeta.temperatureK ?? 443} K`,
    majorProductName: target.name,
    majorProductFormula: target.formula,
    byProduct: 'H₂O',
    lucasTurbidity: null,
    dehydrationAssessment: assessment,
    alphaHydrogens: sub.alphaHydrogens,
    ncertNote: `${target.extraNote} Relative ease: ${NCERT_UNIT7_ORDERS.alcoholDehydrationEase}.`,
  }
  return { ...base, liveSummary: buildSummary(base) }
}

function evaluateOxidation(sub: SubstrateMeta, reagent: ReagentMeta): CleavageOutcome {
  const pccRec = requireReaction('oxidation-pcc')
  const cro3Rec = requireReaction('oxidation-cro3-anhydrous')
  const kmno4Rec = requireReaction('oxidation-strong-kmno4')
  const cuRec = requireReaction('dehydrogenation-cu-573k')

  if (reagent.id === 'pcc') {
    if (sub.degree === '3°') {
      const base: Omit<CleavageOutcome, 'liveSummary'> = {
        substrate: sub,
        reagent,
        diagnosticMode: 'oxidation',
        reacts: false,
        reactionType: 'No reaction (0 α-H)',
        mechanismNote: '0 α-H on carbinol C (mild oxidation blocked)',
        bondsCleaved: 'None',
        highlightMode: 'none',
        preserveDoubleBond: false,
        reagentArrowTop: 'PCC',
        reagentArrowBottom: 'anhydrous CH₂Cl₂',
        majorProductName: 'No oxidation',
        majorProductFormula: `${sub.formula} (unchanged)`,
        byProduct: null,
        lucasTurbidity: null,
        dehydrationAssessment: null,
        alphaHydrogens: sub.alphaHydrogens,
        ncertNote: 'Tertiary alcohols have 0 α-hydrogens on the carbinol carbon, so mild oxidants like PCC cannot form a C=O bond.',
      }
      return { ...base, liveSummary: buildSummary(base) }
    }

    const isSec = sub.degree === '2°'
    const prod =
      sub.id === 'ethanol'
        ? { name: 'Ethanal', formula: 'CH₃CHO' }
        : sub.id === 'propan-2-ol'
          ? { name: 'Propanone', formula: 'CH₃COCH₃' }
          : { name: 'But-2-enal', formula: 'CH₃-CH=CH-CHO' }

    const base: Omit<CleavageOutcome, 'liveSummary'> = {
      substrate: sub,
      reagent,
      diagnosticMode: 'oxidation',
      reacts: true,
      reactionType: 'Selective Oxidation',
      mechanismNote: sub.isAllylic
        ? '2 α-H on carbinol C; C=C double bond preserved'
        : `${sub.alphaHydrogens} α-H on carbinol C (stops at ${isSec ? 'ketone' : 'aldehyde'})`,
      bondsCleaved: 'O-H and α-C-H',
      highlightMode: 'oh-alpha-ch',
      preserveDoubleBond: sub.isAllylic,
      reagentArrowTop: 'PCC',
      reagentArrowBottom: 'CrO₃, pyridine, HCl',
      majorProductName: prod.name,
      majorProductFormula: prod.formula,
      byProduct: null,
      lucasTurbidity: null,
      dehydrationAssessment: null,
      alphaHydrogens: sub.alphaHydrogens,
      ncertNote: sub.isAllylic
        ? `NCERT 7.4.4(b): ${pccRec.reagents} oxidises the 1° alcohol selectively to but-2-enal in good yield while leaving the C=C double bond untouched.`
        : isSec
          ? 'PCC oxidises secondary (2°) alcohols smoothly to ketones by cleaving O-H and the single α-C-H bond.'
          : 'PCC halts oxidation of primary alcohols cleanly at the aldehyde stage without over-oxidising to the carboxylic acid.',
    }
    return { ...base, liveSummary: buildSummary(base) }
  }

  if (reagent.id === 'cro3') {
    if (sub.degree === '3°') {
      const base: Omit<CleavageOutcome, 'liveSummary'> = {
        substrate: sub,
        reagent,
        diagnosticMode: 'oxidation',
        reacts: false,
        reactionType: 'No reaction (0 α-H)',
        mechanismNote: '0 α-H on carbinol C (mild oxidation blocked)',
        bondsCleaved: 'None',
        highlightMode: 'none',
        preserveDoubleBond: false,
        reagentArrowTop: 'CrO₃',
        reagentArrowBottom: 'anhydrous medium',
        majorProductName: 'No oxidation',
        majorProductFormula: `${sub.formula} (unchanged)`,
        byProduct: null,
        lucasTurbidity: null,
        dehydrationAssessment: null,
        alphaHydrogens: sub.alphaHydrogens,
        ncertNote: 'Tertiary alcohols lack an α-hydrogen, so chromic anhydride (CrO₃) causes no oxidation.',
      }
      return { ...base, liveSummary: buildSummary(base) }
    }

    const prod =
      sub.id === 'ethanol'
        ? { name: 'Ethanal', formula: 'CH₃CHO' }
        : sub.id === 'propan-2-ol'
          ? { name: 'Propanone', formula: 'CH₃COCH₃' }
          : { name: 'But-2-enal', formula: 'CH₃-CH=CH-CHO' }

    const base: Omit<CleavageOutcome, 'liveSummary'> = {
      substrate: sub,
      reagent,
      diagnosticMode: 'oxidation',
      reacts: true,
      reactionType: 'Selective Oxidation',
      mechanismNote: `${sub.alphaHydrogens} α-H on carbinol C (${sub.degree === '2°' ? 'ketone' : 'aldehyde'})`,
      bondsCleaved: 'O-H and α-C-H',
      highlightMode: 'oh-alpha-ch',
      preserveDoubleBond: sub.isAllylic,
      reagentArrowTop: 'CrO₃',
      reagentArrowBottom: 'anhydrous medium',
      majorProductName: prod.name,
      majorProductFormula: prod.formula,
      byProduct: null,
      lucasTurbidity: null,
      dehydrationAssessment: null,
      alphaHydrogens: sub.alphaHydrogens,
      ncertNote:
        sub.degree === '2°'
          ? `NCERT 7.4.4(b): chromic anhydride (${cro3Rec.reagents.split(' ')[0]}) oxidises secondary alcohols cleanly to ketones.`
          : sub.isAllylic
            ? 'Anhydrous CrO₃ isolates the aldehyde from a 1° alcohol; NCERT notes PCC gives an even better yield when a C=C bond is present.'
            : 'NCERT 7.4.4(b): anhydrous CrO₃ isolates the aldehyde by stopping before carboxylic acid formation.',
    }
    return { ...base, liveSummary: buildSummary(base) }
  }

  if (reagent.id === 'kmno4') {
    if (sub.degree === '3°') {
      const base: Omit<CleavageOutcome, 'liveSummary'> = {
        substrate: sub,
        reagent,
        diagnosticMode: 'oxidation',
        reacts: true,
        reactionType: 'C-C Cleavage (harsh T)',
        mechanismNote: '0 α-H; elevated T forces C-C bond cleavage',
        bondsCleaved: 'C-C under elevated T',
        highlightMode: 'cc-cleave',
        preserveDoubleBond: false,
        reagentArrowTop: kmno4Rec.reagents,
        reagentArrowBottom: 'elevated T (harsh)',
        majorProductName: 'Shorter carboxylic acids',
        majorProductFormula: 'CH₃COOH + CO₂ (< 4 C)',
        byProduct: 'H₂O',
        lucasTurbidity: null,
        dehydrationAssessment: null,
        alphaHydrogens: sub.alphaHydrogens,
        ncertNote: 'NCERT 7.4.4(b): 3° alcohols resist mild oxidation (0 α-H), but strong KMnO₄ at elevated temperatures cleaves C-C bonds into carboxylic acids with fewer carbons.',
      }
      return { ...base, liveSummary: buildSummary(base) }
    }

    if (sub.isAllylic) {
      const base: Omit<CleavageOutcome, 'liveSummary'> = {
        substrate: sub,
        reagent,
        diagnosticMode: 'oxidation',
        reacts: true,
        reactionType: 'Complete Oxidation',
        mechanismNote: 'Strong oxidant attacks alcohol and C=C bond',
        bondsCleaved: 'O-H, α-C-H, and C=C (strong oxidant)',
        highlightMode: 'oh-alpha-ch-and-cc-double',
        preserveDoubleBond: false,
        reagentArrowTop: kmno4Rec.reagents,
        reagentArrowBottom: 'strong oxidation',
        majorProductName: 'Oxidative cleavage mixture',
        majorProductFormula: 'CH₃COOH + CO₂ (C=C cleaved)',
        byProduct: 'H₂O',
        lucasTurbidity: null,
        dehydrationAssessment: null,
        alphaHydrogens: sub.alphaHydrogens,
        ncertNote: 'Unlike PCC, strong acidified KMnO₄ over-oxidises the primary alcohol to acid and also cleaves the C=C double bond.',
      }
      return { ...base, liveSummary: buildSummary(base) }
    }

    if (sub.degree === '2°') {
      const base: Omit<CleavageOutcome, 'liveSummary'> = {
        substrate: sub,
        reagent,
        diagnosticMode: 'oxidation',
        reacts: true,
        reactionType: 'Selective Oxidation',
        mechanismNote: '1 α-H oxidises to ketone',
        bondsCleaved: 'O-H and α-C-H',
        highlightMode: 'oh-alpha-ch',
        preserveDoubleBond: false,
        reagentArrowTop: kmno4Rec.reagents,
        reagentArrowBottom: 'controlled oxidation',
        majorProductName: 'Propanone',
        majorProductFormula: 'CH₃COCH₃',
        byProduct: null,
        lucasTurbidity: null,
        dehydrationAssessment: null,
        alphaHydrogens: sub.alphaHydrogens,
        ncertNote: 'Propan-2-ol (1 α-H) oxidises to propanone; vigorous heating with strong KMnO₄ would be needed to force C-C cleavage of the ketone.',
      }
      return { ...base, liveSummary: buildSummary(base) }
    }

    const base: Omit<CleavageOutcome, 'liveSummary'> = {
      substrate: sub,
      reagent,
      diagnosticMode: 'oxidation',
      reacts: true,
      reactionType: 'Complete Oxidation',
      mechanismNote: '2 α-H oxidised directly to carboxylic acid',
      bondsCleaved: 'O-H and α-C-H',
      highlightMode: 'oh-alpha-ch',
      preserveDoubleBond: false,
      reagentArrowTop: kmno4Rec.reagents,
      reagentArrowBottom: 'direct to acid',
      majorProductName: 'Ethanoic acid',
      majorProductFormula: 'CH₃COOH',
      byProduct: null,
      lucasTurbidity: null,
      dehydrationAssessment: null,
      alphaHydrogens: sub.alphaHydrogens,
      ncertNote: 'NCERT 7.4.4(b): strong oxidising agents like acidified KMnO₄ convert 1° alcohols directly to carboxylic acids (via the aldehyde).',
    }
    return { ...base, liveSummary: buildSummary(base) }
  }

  // Heated Cu (573 K)
  const cuTempK = Number(cuRec.temperatureK ?? 573)
  if (sub.degree === '3°') {
    const base: Omit<CleavageOutcome, 'liveSummary'> = {
      substrate: sub,
      reagent,
      diagnosticMode: 'oxidation',
      reacts: true,
      reactionType: 'Catalytic Dehydration',
      mechanismNote: '0 α-H shifts Cu 573 K pathway to dehydration',
      bondsCleaved: 'C-O and β-C-H',
      highlightMode: 'co-beta-ch',
      preserveDoubleBond: false,
      reagentArrowTop: 'Heated Cu',
      reagentArrowBottom: `${cuTempK} K (vapour phase)`,
      majorProductName: '2-Methylpropene',
      majorProductFormula: 'CH₂=C(CH₃)CH₃',
      byProduct: 'H₂O',
      lucasTurbidity: null,
      dehydrationAssessment: null,
      alphaHydrogens: sub.alphaHydrogens,
      ncertNote: `NCERT 7.4.4(b): passing vapours over heated Cu at ${cuTempK} K cannot dehydrogenate a 3° alcohol (0 α-H), so dehydration occurs instead to yield 2-methylpropene + H₂O.`,
    }
    return { ...base, liveSummary: buildSummary(base) }
  }

  const prod =
    sub.id === 'ethanol'
      ? { name: 'Ethanal', formula: 'CH₃CHO' }
      : sub.id === 'propan-2-ol'
        ? { name: 'Propanone', formula: 'CH₃COCH₃' }
        : { name: 'But-2-enal', formula: 'CH₃-CH=CH-CHO' }

  const base: Omit<CleavageOutcome, 'liveSummary'> = {
    substrate: sub,
    reagent,
    diagnosticMode: 'oxidation',
    reacts: true,
    reactionType: 'Catalytic Dehydrogenation',
    mechanismNote: `${sub.alphaHydrogens} α-H + O-H lost as H₂ over Cu`,
    bondsCleaved: 'O-H and α-C-H',
    highlightMode: 'oh-alpha-ch',
    preserveDoubleBond: sub.isAllylic,
    reagentArrowTop: 'Heated Cu',
    reagentArrowBottom: `${cuTempK} K (vapour phase)`,
    majorProductName: prod.name,
    majorProductFormula: prod.formula,
    byProduct: 'H₂',
    lucasTurbidity: null,
    dehydrationAssessment: null,
    alphaHydrogens: sub.alphaHydrogens,
    ncertNote: `NCERT 7.4.4(b): passing alcohol vapours over heated Cu at ${cuTempK} K removes H₂ from ${sub.degree} alcohols to yield ${sub.degree === '1°' ? 'an aldehyde' : 'a ketone'}.`,
  }
  return { ...base, liveSummary: buildSummary(base) }
}

/**
 * Evaluates any combination of NCERT Section 7.4.4(b) substrate, reagent, and
 * optional dehydration condition override.
 */
export function evaluateCleavageReaction(
  substrateId: SubstrateId,
  reagentId: ReagentId,
  dehydrationCondition: DehydrationConditionId = 'matched'
): CleavageOutcome {
  const sub = findSubstrate(substrateId)
  const reagent = findReagent(reagentId)
  if (reagentId === 'lucas') return evaluateLucas(sub, reagent)
  if (reagentId === 'dehydration') return evaluateDehydration(sub, reagent, dehydrationCondition)
  return evaluateOxidation(sub, reagent)
}
