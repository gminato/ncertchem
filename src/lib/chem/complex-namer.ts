import {
  COMPLEX_PREFIXES,
  NCERT_COUNTER_IONS,
  NCERT_LIGANDS,
  NCERT_METAL_NAMES,
  NCERT_METAL_OXIDATION_STATES,
  SIMPLE_PREFIXES,
  romanNumeral,
  type CounterIon,
  type Ligand,
} from './ncert-c12-unit5-s3-tables'

export type MetalSymbol = 'Co' | 'Cr' | 'Fe' | 'Ni' | 'Pt' | 'Zn' | 'Ag' | 'Cu'
export type CounterIonId = 'none' | 'K' | 'Na' | 'Cl' | 'SO4'

export const SIM_METALS: readonly MetalSymbol[] = ['Co', 'Cr', 'Fe', 'Ni', 'Pt', 'Zn', 'Ag', 'Cu']

const SIM_LIGAND_FORMULAS = ['NH3', 'H2O', 'CO', 'NO', 'Cl', 'CN', 'OH', 'C2O4', 'en'] as const
export type SimLigandFormula = (typeof SIM_LIGAND_FORMULAS)[number]

export const SIM_LIGANDS: readonly Ligand[] = SIM_LIGAND_FORMULAS.map((f) => {
  const found = NCERT_LIGANDS.find((l) => l.formula === f)
  if (!found) throw new Error(`Missing ligand ${f} in NCERT_LIGANDS`)
  return found
})

export const SIM_COUNTER_IONS: readonly CounterIon[] = NCERT_COUNTER_IONS

export interface LigandSlot {
  readonly formula: SimLigandFormula
  readonly count: number
}

export interface ComplexSpec {
  readonly metal: MetalSymbol
  readonly oxidationState: number
  readonly slots: readonly [LigandSlot, LigandSlot, LigandSlot]
  readonly counterIon: CounterIonId
}

export const DEFAULT_COMPLEX: ComplexSpec = {
  metal: 'Co',
  oxidationState: 3,
  slots: [
    { formula: 'NH3', count: 4 },
    { formula: 'Cl', count: 2 },
    { formula: 'H2O', count: 0 },
  ],
  counterIon: 'Cl',
}

const SUBSCRIPT_DIGITS = '₀₁₂₃₄₅₆₇₈₉'
const SUPERSCRIPT_DIGITS = '⁰¹²³⁴⁵⁶⁷⁸⁹'

export function toSubscript(n: number | string): string {
  return String(n).replace(/\d/g, (d) => SUBSCRIPT_DIGITS[Number(d)])
}

export function toSuperscriptCharge(charge: number): string {
  if (charge === 0) return ''
  const abs = Math.abs(charge)
  const digits = abs === 1 ? '' : String(abs).replace(/\d/g, (d) => SUPERSCRIPT_DIGITS[Number(d)])
  return `${digits}${charge > 0 ? '⁺' : '⁻'}`
}

export function formatFormulaUnicode(raw: string): string {
  return raw.replace(/(\d+)/g, (m) => toSubscript(m))
}

export function formatLigandBadge(ligand: Ligand): string {
  return `${formatFormulaUnicode(ligand.formula)}${toSuperscriptCharge(ligand.charge)}`
}

export function formatCounterIonBadge(ion: CounterIon): string {
  return `${formatFormulaUnicode(ion.formula)}${toSuperscriptCharge(ion.charge)}`
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y !== 0) {
    const t = x % y
    x = y
    y = t
  }
  return x || 1
}

export interface MergedLigand {
  readonly ligand: Ligand
  readonly count: number
}

export function mergeLigandSlots(slots: readonly LigandSlot[]): MergedLigand[] {
  const counts = new Map<string, number>()
  for (const s of slots) {
    if (s.count > 0) {
      counts.set(s.formula, (counts.get(s.formula) ?? 0) + s.count)
    }
  }
  const merged: MergedLigand[] = []
  for (const [formula, count] of counts.entries()) {
    const ligand = SIM_LIGANDS.find((l) => l.formula === formula)
    if (ligand) merged.push({ ligand, count })
  }
  return merged.sort((a, b) => a.ligand.name.localeCompare(b.ligand.name))
}

const EXTRA_COMPLEX_PREFIXES: Record<number, string> = {
  5: 'pentakis',
  6: 'hexakis',
}

function ligandNamePart(ligand: Ligand, count: number): string {
  if (ligand.numberedName) {
    if (count === 1) return ligand.name
    const prefix = COMPLEX_PREFIXES[count] ?? EXTRA_COMPLEX_PREFIXES[count] ?? `${count}-`
    return `${prefix}(${ligand.name})`
  }
  const prefix = count <= 1 ? '' : SIMPLE_PREFIXES[count] ?? `${count}-`
  return `${prefix}${ligand.name}`
}

export type RuleId =
  | 'cation-first'
  | 'alphabetical'
  | 'anion-o'
  | 'special-neutral'
  | 'bis-prefix'
  | 'anion-ate'

export interface RuleStatus {
  readonly id: RuleId
  readonly label: string
  readonly active: boolean
}

export interface NearestChoice {
  readonly counterIon: CounterIonId
  readonly label: string
}

export interface ComplexResult {
  readonly mergedLigands: readonly MergedLigand[]
  readonly ligandChargeSum: number
  readonly entityCharge: number
  readonly coordinationNumber: number
  readonly entityFormula: string
  readonly fullFormula: string
  readonly entityName: string
  readonly fullName: string
  readonly counterIonCount: number
  readonly entityCount: number
  readonly balanced: boolean
  readonly balanceNote: string | null
  readonly nearestChoice: NearestChoice | null
  readonly rules: readonly RuleStatus[]
}

const SPECIAL_NEUTRAL_SET = new Set(['H2O', 'NH3', 'CO', 'NO'])

export function evaluateComplex(spec: ComplexSpec): ComplexResult {
  const merged = mergeLigandSlots(spec.slots)
  const ligandChargeSum = merged.reduce((sum, item) => sum + item.ligand.charge * item.count, 0)
  const entityCharge = spec.oxidationState + ligandChargeSum
  const coordinationNumber = merged.reduce((sum, item) => sum + item.ligand.denticity * item.count, 0)

  // Build entity formula: [Metal + ligands in alphabetical order of ligand name]
  const ligandFormulaParts = merged.map(({ ligand, count }) => {
    const base = formatFormulaUnicode(ligand.formula)
    if (ligand.polyatomic) {
      return count > 1 ? `(${base})${toSubscript(count)}` : `(${base})`
    }
    return count > 1 ? `${base}${toSubscript(count)}` : base
  })
  const entityCore = `[${spec.metal}${ligandFormulaParts.join('')}]`
  const entityFormula = entityCharge === 0 ? entityCore : `${entityCore}${toSuperscriptCharge(entityCharge)}`

  // Build entity systematic name
  const ligandNameStr = merged.map(({ ligand, count }) => ligandNamePart(ligand, count)).join('')
  const metalEntry = NCERT_METAL_NAMES[spec.metal]
  const metalName = entityCharge < 0 ? metalEntry.anion : metalEntry.cation
  const entityName = `${ligandNameStr}${metalName}(${romanNumeral(spec.oxidationState)})`

  // Counter ion charge balancing
  const selectedCounter =
    spec.counterIon === 'none' ? null : SIM_COUNTER_IONS.find((c) => c.formula === spec.counterIon) ?? null

  let balanced = true
  let balanceNote: string | null = null
  let nearestChoice: NearestChoice | null = null
  let entityCount = 1
  let counterIonCount = 0
  let fullFormula = entityFormula
  let fullName = entityCharge === 0 ? entityName : `${entityName} ion`

  if (entityCharge === 0) {
    if (selectedCounter) {
      balanced = false
      balanceNote = `The coordination entity is neutral (charge 0), so it needs no ${selectedCounter.name} counter ion.`
      nearestChoice = { counterIon: 'none', label: 'Use no counter ion' }
    }
    fullFormula = entityCore
    fullName = entityName
  } else if (selectedCounter === null) {
    // Bare ion: valid representation, no counter ion chosen
    balanced = true
    fullFormula = entityFormula
    fullName = `${entityName} ion`
  } else if (Math.sign(entityCharge) === Math.sign(selectedCounter.charge)) {
    balanced = false
    const signWord = entityCharge > 0 ? 'positive' : 'negative'
    const chargeStr = entityCharge > 0 ? `+${entityCharge}` : `${Math.abs(entityCharge)}−`
    const suggestedId: CounterIonId = entityCharge > 0 ? 'Cl' : 'K'
    const suggestedIon = SIM_COUNTER_IONS.find((c) => c.formula === suggestedId)!
    const needed = Math.abs(entityCharge)
    balanceNote = `A ${signWord} entity (${chargeStr}) cannot be balanced by ${formatCounterIonBadge(selectedCounter)}. Choose ${needed} ${formatCounterIonBadge(suggestedIon)} instead.`
    nearestChoice = {
      counterIon: suggestedId,
      label: `Switch to ${formatCounterIonBadge(suggestedIon)} (${needed})`,
    }
    fullFormula = entityFormula
    fullName = `${entityName} ion`
  } else {
    const g = gcd(entityCharge, selectedCounter.charge)
    entityCount = Math.abs(selectedCounter.charge) / g
    counterIonCount = Math.abs(entityCharge) / g
    const entityPart = entityCount > 1 ? `${entityCore}${toSubscript(entityCount)}` : entityCore
    const ionBase = formatFormulaUnicode(selectedCounter.formula)
    const ionPart =
      counterIonCount > 1
        ? selectedCounter.polyatomic
          ? `(${ionBase})${toSubscript(counterIonCount)}`
          : `${ionBase}${toSubscript(counterIonCount)}`
        : ionBase

    if (entityCharge > 0) {
      // Cationic entity first, anionic counter ion second
      fullFormula = `${entityPart}${ionPart}`
      fullName = `${entityName} ${selectedCounter.name}`
    } else {
      // Cationic counter ion first, anionic entity second
      fullFormula = `${ionPart}${entityPart}`
      fullName = `${selectedCounter.name} ${entityName}`
    }
  }

  const rules: RuleStatus[] = [
    {
      id: 'cation-first',
      label: 'Cation first',
      active: balanced && selectedCounter !== null && entityCharge !== 0,
    },
    {
      id: 'alphabetical',
      label: 'Alphabetical order',
      active: merged.length >= 2,
    },
    {
      id: 'anion-o',
      label: '-o ending',
      active: merged.some((m) => m.ligand.charge < 0),
    },
    {
      id: 'special-neutral',
      label: 'Special neutral name',
      active: merged.some((m) => SPECIAL_NEUTRAL_SET.has(m.ligand.formula)),
    },
    {
      id: 'bis-prefix',
      label: 'bis / tris for numbered ligand',
      active: merged.some((m) => m.ligand.numberedName && m.count >= 2),
    },
    {
      id: 'anion-ate',
      label: '-ate for anion',
      active: entityCharge < 0,
    },
  ]

  return {
    mergedLigands: merged,
    ligandChargeSum,
    entityCharge,
    coordinationNumber,
    entityFormula,
    fullFormula,
    entityName,
    fullName,
    counterIonCount,
    entityCount,
    balanced,
    balanceNote,
    nearestChoice,
    rules,
  }
}

export function oxidationStatesForMetal(metal: MetalSymbol): readonly number[] {
  return NCERT_METAL_OXIDATION_STATES[metal] ?? [2]
}

export interface ReverseChallenge {
  readonly id: string
  readonly targetName: string
  readonly spec: ComplexSpec
}

export const REVERSE_CHALLENGES: readonly ReverseChallenge[] = [
  {
    id: 'co-ammine-cl',
    targetName: 'tetraamminedichloridocobalt(III) chloride',
    spec: {
      metal: 'Co',
      oxidationState: 3,
      slots: [
        { formula: 'NH3', count: 4 },
        { formula: 'Cl', count: 2 },
        { formula: 'H2O', count: 0 },
      ],
      counterIon: 'Cl',
    },
  },
  {
    id: 'k-fe-cn',
    targetName: 'potassium hexacyanidoferrate(II)',
    spec: {
      metal: 'Fe',
      oxidationState: 2,
      slots: [
        { formula: 'CN', count: 6 },
        { formula: 'H2O', count: 0 },
        { formula: 'Cl', count: 0 },
      ],
      counterIon: 'K',
    },
  },
  {
    id: 'co-en-cl',
    targetName: 'dichloridobis(ethane-1,2-diamine)cobalt(III) chloride',
    spec: {
      metal: 'Co',
      oxidationState: 3,
      slots: [
        { formula: 'en', count: 2 },
        { formula: 'Cl', count: 2 },
        { formula: 'NH3', count: 0 },
      ],
      counterIon: 'Cl',
    },
  },
  {
    id: 'k-fe-ox',
    targetName: 'potassium trioxalatoferrate(III)',
    spec: {
      metal: 'Fe',
      oxidationState: 3,
      slots: [
        { formula: 'C2O4', count: 3 },
        { formula: 'H2O', count: 0 },
        { formula: 'Cl', count: 0 },
      ],
      counterIon: 'K',
    },
  },
  {
    id: 'ni-co',
    targetName: 'tetracarbonylnickel(0)',
    spec: {
      metal: 'Ni',
      oxidationState: 0,
      slots: [
        { formula: 'CO', count: 4 },
        { formula: 'H2O', count: 0 },
        { formula: 'Cl', count: 0 },
      ],
      counterIon: 'none',
    },
  },
  {
    id: 'ag-nh3',
    targetName: 'diamminesilver(I) chloride',
    spec: {
      metal: 'Ag',
      oxidationState: 1,
      slots: [
        { formula: 'NH3', count: 2 },
        { formula: 'H2O', count: 0 },
        { formula: 'Cl', count: 0 },
      ],
      counterIon: 'Cl',
    },
  },
]

export function checkReverseMatch(
  candidate: ComplexSpec,
  target: ReverseChallenge,
): { matched: boolean; feedback: string } {
  const candEval = evaluateComplex(candidate)
  const targetEval = evaluateComplex(target.spec)

  if (!candEval.balanced) {
    return {
      matched: false,
      feedback: candEval.balanceNote ?? 'Counter ion does not balance the entity charge.',
    }
  }

  const sameMetal = candidate.metal === target.spec.metal
  const sameOx = candidate.oxidationState === target.spec.oxidationState
  const sameCounter = candidate.counterIon === target.spec.counterIon
  const sameLigands =
    candEval.mergedLigands.length === targetEval.mergedLigands.length &&
    candEval.mergedLigands.every(
      (m, i) =>
        m.ligand.formula === targetEval.mergedLigands[i].ligand.formula &&
        m.count === targetEval.mergedLigands[i].count,
    )

  if (sameMetal && sameOx && sameCounter && sameLigands) {
    return {
      matched: true,
      feedback: `Exact match: ${targetEval.fullFormula}`,
    }
  }

  const hints: string[] = []
  if (!sameMetal) hints.push('central metal')
  if (!sameOx) hints.push('oxidation state')
  if (!sameLigands) hints.push('ligands or counts')
  if (!sameCounter) hints.push('counter ion')

  return {
    matched: false,
    feedback: `Not quite yet. Check: ${hints.join(', ')}.`,
  }
}
