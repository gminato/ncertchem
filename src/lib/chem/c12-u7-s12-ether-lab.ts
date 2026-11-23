import {
  NCERT_7_6_3_ANISOLE_EAS,
  NCERT_7_6_3_CLEAVAGE_CASES,
  NCERT_UNIT7_ORDERS,
} from '@/lib/chem/ncert-c12-unit7-data'

export type WorkbenchMode = 'cleavage' | 'eas'

export type CleavageSubstrateId = 'diethyl' | 'ethyl-methyl' | 'tert-butyl-methyl' | 'anisole'
export type Stoichiometry = '1eq' | 'excess'
export type AnisoleEasId = 'bromination' | 'fc-alkylation' | 'fc-acylation' | 'nitration'

export interface CleavageSubstrateMeta {
  id: CleavageSubstrateId
  ncertCaseId: (typeof NCERT_7_6_3_CLEAVAGE_CASES)[number]['id']
  pillLabel: string
  name: string
  formula: string
  leftGroup: string
  rightGroup: string
  oxoniumFormula: string
  isAryl: boolean
  isTertiary: boolean
}

export const HX_REACTIVITY_ORDER = NCERT_UNIT7_ORDERS.etherCleavageHX

export const CLEAVAGE_SUBSTRATES: readonly CleavageSubstrateMeta[] = [
  {
    id: 'diethyl',
    ncertCaseId: 'symmetrical-dialkyl',
    pillLabel: 'Diethyl ether (C₂H₅-O-C₂H₅)',
    name: 'Diethyl ether',
    formula: 'C₂H₅-O-C₂H₅',
    leftGroup: 'CH₃CH₂',
    rightGroup: 'CH₂CH₃',
    oxoniumFormula: 'C₂H₅-O⁺(H)-C₂H₅',
    isAryl: false,
    isTertiary: false,
  },
  {
    id: 'ethyl-methyl',
    ncertCaseId: 'mixed-primary-secondary',
    pillLabel: 'Ethyl methyl ether (CH₃-O-CH₂CH₃)',
    name: 'Ethyl methyl ether',
    formula: 'CH₃-O-CH₂CH₃',
    leftGroup: 'CH₃',
    rightGroup: 'CH₂CH₃',
    oxoniumFormula: 'CH₃-O⁺(H)-CH₂CH₃',
    isAryl: false,
    isTertiary: false,
  },
  {
    id: 'tert-butyl-methyl',
    ncertCaseId: 'mixed-with-tertiary',
    pillLabel: 'tert-Butyl methyl ether ((CH₃)₃C-O-CH₃)',
    name: 'tert-Butyl methyl ether',
    formula: '(CH₃)₃C-O-CH₃',
    leftGroup: '(CH₃)₃C',
    rightGroup: 'CH₃',
    oxoniumFormula: '(CH₃)₃C-O⁺(H)-CH₃',
    isAryl: false,
    isTertiary: true,
  },
  {
    id: 'anisole',
    ncertCaseId: 'alkyl-aryl-anisole',
    pillLabel: 'Anisole (C₆H₅-O-CH₃)',
    name: 'Anisole',
    formula: 'C₆H₅-O-CH₃',
    leftGroup: 'C₆H₅',
    rightGroup: 'CH₃',
    oxoniumFormula: 'C₆H₅-O⁺(H)-CH₃',
    isAryl: true,
    isTertiary: false,
  },
] as const

export const STOICHIOMETRY_OPTIONS: readonly { value: Stoichiometry; label: string }[] = [
  { value: '1eq', label: '1 eq conc. HI' },
  { value: 'excess', label: 'Excess conc. HI, high T' },
] as const

export interface CleavageOutcome {
  substrate: CleavageSubstrateMeta
  stoichiometry: Stoichiometry
  mechanismBadge: string
  mechanismKind: 'SN2' | 'SN1'
  bondBroken: string
  attackSummary: string
  productsText: string
  productTokens: readonly string[]
  equation: string
  reason: string
  arylLockNote: string | null
  excessConvertsAlcohol: boolean
}

export function evaluateCleavage(
  substrateId: CleavageSubstrateId,
  stoichiometry: Stoichiometry
): CleavageOutcome {
  const substrate = CLEAVAGE_SUBSTRATES.find((s) => s.id === substrateId) ?? CLEAVAGE_SUBSTRATES[1]

  if (substrate.id === 'diethyl') {
    if (stoichiometry === '1eq') {
      return {
        substrate,
        stoichiometry,
        mechanismBadge: 'SN2',
        mechanismKind: 'SN2',
        bondBroken: 'One C₂H₅-O bond',
        attackSummary: 'I⁻ attacks either primary ethyl carbon from the back side',
        productsText: 'C₂H₅I + C₂H₅OH',
        productTokens: ['C₂H₅I', 'C₂H₅OH'],
        equation: 'C₂H₅-O-C₂H₅ + HI -> C₂H₅I + C₂H₅OH',
        reason:
          'Protonation converts the poor alkoxide group into a neutral ethanol leaving group; iodide displaces ethanol by SN2.',
        arylLockNote: null,
        excessConvertsAlcohol: false,
      }
    }
    return {
      substrate,
      stoichiometry,
      mechanismBadge: 'SN2 (2 steps)',
      mechanismKind: 'SN2',
      bondBroken: 'Both C₂H₅-O bonds',
      attackSummary: 'Second HI protonates C₂H₅OH to C₂H₅-O⁺H₂; I⁻ displaces H₂O',
      productsText: '2 C₂H₅I + H₂O',
      productTokens: ['2 C₂H₅I', 'H₂O'],
      equation: 'C₂H₅-O-C₂H₅ + 2 HI (excess, high T) -> 2 C₂H₅I + H₂O',
      reason:
        'After the first cleavage gives C₂H₅I and C₂H₅OH, excess hot HI protonates ethanol and converts it into a second C₂H₅I molecule.',
      arylLockNote: null,
      excessConvertsAlcohol: true,
    }
  }

  if (substrate.id === 'ethyl-methyl') {
    if (stoichiometry === '1eq') {
      return {
        substrate,
        stoichiometry,
        mechanismBadge: 'SN2',
        mechanismKind: 'SN2',
        bondBroken: 'O-CH₃ (less substituted carbon)',
        attackSummary: 'I⁻ attacks the less crowded CH₃ carbon via backside SN2',
        productsText: 'CH₃I + CH₃CH₂OH',
        productTokens: ['CH₃I', 'CH₃CH₂OH'],
        equation: 'CH₃-O-CH₂CH₃ + HI -> CH₃I + CH₃CH₂OH',
        reason:
          'Between two primary alkyl groups, iodide attacks the less sterically hindered methyl carbon, releasing ethanol as the neutral leaving group.',
        arylLockNote: null,
        excessConvertsAlcohol: false,
      }
    }
    return {
      substrate,
      stoichiometry,
      mechanismBadge: 'SN2 (2 steps)',
      mechanismKind: 'SN2',
      bondBroken: 'O-CH₃, then CH₃CH₂-OH₂⁺',
      attackSummary: 'First SN2 yields CH₃I + CH₃CH₂OH; excess hot HI converts CH₃CH₂OH to CH₃CH₂I',
      productsText: 'CH₃I + CH₃CH₂I + H₂O',
      productTokens: ['CH₃I', 'CH₃CH₂I', 'H₂O'],
      equation: 'CH₃-O-CH₂CH₃ + 2 HI (excess, high T) -> CH₃I + CH₃CH₂I + H₂O',
      reason:
        'Excess HI at high temperature protonates the ethanol formed in step 2 to CH₃CH₂-O⁺H₂, and a second iodide displaces water to give ethyl iodide.',
      arylLockNote: null,
      excessConvertsAlcohol: true,
    }
  }

  if (substrate.id === 'tert-butyl-methyl') {
    if (stoichiometry === '1eq') {
      return {
        substrate,
        stoichiometry,
        mechanismBadge: 'SN1',
        mechanismKind: 'SN1',
        bondBroken: '(CH₃)₃C-O (tertiary carbon bond)',
        attackSummary: 'Slow loss of CH₃OH uncovers planar (CH₃)₃C⁺ carbocation; fast I⁻ capture',
        productsText: '(CH₃)₃C-I + CH₃OH',
        productTokens: ['(CH₃)₃C-I', 'CH₃OH'],
        equation: '(CH₃)₃C-O-CH₃ + HI -> (CH₃)₃C-I + CH₃OH',
        reason:
          'Backside SN2 attack at the crowded tertiary carbon is blocked. Leaving of CH₃OH forms the stable tertiary carbocation (CH₃)₃C⁺, reversing selectivity to SN1.',
        arylLockNote: null,
        excessConvertsAlcohol: false,
      }
    }
    return {
      substrate,
      stoichiometry,
      mechanismBadge: 'SN1 + SN2',
      mechanismKind: 'SN1',
      bondBroken: '(CH₃)₃C-O (SN1), then CH₃-OH₂⁺ (SN2)',
      attackSummary: 'SN1 forms (CH₃)₃C-I + CH₃OH; excess hot HI converts CH₃OH to CH₃I + H₂O',
      productsText: '(CH₃)₃C-I + CH₃I + H₂O',
      productTokens: ['(CH₃)₃C-I', 'CH₃I', 'H₂O'],
      equation: '(CH₃)₃C-O-CH₃ + 2 HI (excess, high T) -> (CH₃)₃C-I + CH₃I + H₂O',
      reason:
        'The first equivalent cleaves the tertiary C-O bond by SN1 to give (CH₃)₃C-I and CH₃OH; excess hot HI then protonates CH₃OH and converts it to CH₃I.',
      arylLockNote: null,
      excessConvertsAlcohol: true,
    }
  }

  // Anisole: identical product outcome for 1 eq and excess HI
  return {
    substrate,
    stoichiometry,
    mechanismBadge: 'SN2 at O-CH₃ only',
    mechanismKind: 'SN2',
    bondBroken: 'O-CH₃ only (O-C₆H₅ stays intact)',
    attackSummary:
      stoichiometry === 'excess'
        ? 'I⁻ attacks only the sp³ CH₃ carbon; phenol resists any second substitution'
        : 'I⁻ attacks the weaker O-CH₃ bond; O-C₆H₅ has sp² carbon and partial double-bond character',
    productsText: 'C₆H₅OH + CH₃I',
    productTokens: ['C₆H₅OH', 'CH₃I'],
    equation: 'C₆H₅-O-CH₃ + HI -> C₆H₅OH + CH₃I',
    reason:
      'In methylphenyl oxonium ion, the phenyl carbon is sp² hybridised and O-C₆H₅ has partial double-bond character. Even with excess HI, phenol cannot undergo nucleophilic substitution to form iodobenzene.',
    arylLockNote:
      'No C₆H₅I formed: sp² ring carbon and partial C=O double-bond character lock O-C₆H₅ against cleavage.',
    excessConvertsAlcohol: false,
  }
}

export interface AnisoleEasRecord {
  id: AnisoleEasId
  ncertId: (typeof NCERT_7_6_3_ANISOLE_EAS)[number]['id']
  pillLabel: string
  reactionType: string
  reagents: string
  catalystLabel: string
  noLewisAcidNeeded: boolean
  electrophile: string
  substituentGroup: string
  majorProduct: string
  majorYieldPercent: number | null
  minorProduct: string
  directingEffect: string
  note: string
}

const EAS_EXTRA: Record<
  AnisoleEasId,
  {
    ncertId: (typeof NCERT_7_6_3_ANISOLE_EAS)[number]['id']
    pillLabel: string
    electrophile: string
    substituentGroup: string
    catalystFallback: string
    noLewisAcidNeeded: boolean
    note: string
  }
> = {
  bromination: {
    ncertId: 'anisole-bromination',
    pillLabel: 'Bromination (Br₂ / CH₃COOH)',
    electrophile: 'Br⁺ (from Br₂)',
    substituentGroup: 'Br',
    catalystFallback: 'None (no FeBr₃ needed)',
    noLewisAcidNeeded: true,
    note: 'Methoxy (-OCH₃) strongly activates the benzene ring, so bromination proceeds in ethanoic acid without an FeBr₃ catalyst, giving 90% p-bromoanisole.',
  },
  'fc-alkylation': {
    ncertId: 'anisole-fc-alkylation',
    pillLabel: 'Friedel-Crafts Alkylation (CH₃Cl / AlCl₃)',
    electrophile: 'CH₃⁺ (AlCl₃ complex)',
    substituentGroup: 'CH₃',
    catalystFallback: 'Anhydrous AlCl₃',
    noLewisAcidNeeded: false,
    note: 'Anhydrous AlCl₃ (Lewis acid) promotes substitution of the methyl group at the activated ortho and para positions in CS₂.',
  },
  'fc-acylation': {
    ncertId: 'anisole-fc-acylation',
    pillLabel: 'Friedel-Crafts Acylation (CH₃COCl / AlCl₃)',
    electrophile: 'CH₃C⁺=O',
    substituentGroup: 'COCH₃',
    catalystFallback: 'Anhydrous AlCl₃',
    noLewisAcidNeeded: false,
    note: 'Ethanoyl chloride with anhydrous AlCl₃ introduces the -COCH₃ acyl group predominantly at the less crowded para position.',
  },
  nitration: {
    ncertId: 'anisole-nitration',
    pillLabel: 'Nitration (conc. H₂SO₄ + HNO₃)',
    electrophile: 'NO₂⁺',
    substituentGroup: 'NO₂',
    catalystFallback: 'Acid mixture (conc. H₂SO₄ + HNO₃)',
    noLewisAcidNeeded: false,
    note: 'Concentrated sulphuric and nitric acids generate the nitronium ion (NO₂⁺) to form 4-nitroanisole (major) and 2-nitroanisole (minor).',
  },
}

export const ANISOLE_EAS_REACTIONS: readonly AnisoleEasRecord[] = (
  ['bromination', 'fc-alkylation', 'fc-acylation', 'nitration'] as const
).map((id) => {
  const extra = EAS_EXTRA[id]
  const ncert = NCERT_7_6_3_ANISOLE_EAS.find((entry) => entry.id === extra.ncertId)!
  return {
    id,
    ncertId: extra.ncertId,
    pillLabel: extra.pillLabel,
    reactionType: ncert.reactionType.replace('–', '-'),
    reagents: ncert.reagents,
    catalystLabel: ncert.catalyst ?? extra.catalystFallback,
    noLewisAcidNeeded: extra.noLewisAcidNeeded,
    electrophile: extra.electrophile,
    substituentGroup: extra.substituentGroup,
    majorProduct: ncert.majorProduct,
    majorYieldPercent: ncert.majorYieldPercent,
    minorProduct: ncert.minorProduct,
    directingEffect: 'ortho, para directing (ring-activating)',
    note: extra.note,
  }
})

export function getAnisoleEas(id: AnisoleEasId): AnisoleEasRecord {
  return ANISOLE_EAS_REACTIONS.find((r) => r.id === id) ?? ANISOLE_EAS_REACTIONS[0]
}
