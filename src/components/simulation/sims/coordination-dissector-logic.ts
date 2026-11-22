import {
  NCERT_S2_ENTITIES,
  NCERT_S2_LIGANDS,
  coordinationNumber,
  isHomoleptic,
  oxidationNumber,
  type CoordinationEntity,
  type Denticity,
} from '@/lib/chem/ncert-c12-unit5-s2-tables'

export interface LigandMeta {
  readonly formula: string
  readonly display: string
  readonly name: string
  readonly charge: number
  readonly donorAtoms: number
  readonly kind: Denticity
  readonly donorSymbol: string
}

const EXTRA_LIGANDS: Readonly<Record<string, LigandMeta>> = {
  CO: {
    formula: 'CO',
    display: 'CO',
    name: 'carbonyl (carbon monoxide)',
    charge: 0,
    donorAtoms: 1,
    kind: 'unidentate',
    donorSymbol: 'C',
  },
  CN: {
    formula: 'CN',
    display: 'CN⁻',
    name: 'cyanide',
    charge: -1,
    donorAtoms: 1,
    kind: 'unidentate',
    donorSymbol: 'C',
  },
}

const DISPLAY_MAP: Readonly<Record<string, { display: string; donorSymbol: string }>> = {
  Cl: { display: 'Cl⁻', donorSymbol: 'Cl' },
  H2O: { display: 'H₂O', donorSymbol: 'O' },
  NH3: { display: 'NH₃', donorSymbol: 'N' },
  en: { display: 'en', donorSymbol: 'N' },
  C2O4: { display: 'C₂O₄²⁻', donorSymbol: 'O' },
  'N(CH2CH2NH2)3': { display: 'N(CH₂CH₂NH₂)₃', donorSymbol: 'N' },
  EDTA: { display: 'EDTA⁴⁻', donorSymbol: 'N/O' },
  NO2: { display: 'NO₂⁻', donorSymbol: 'N' },
  SCN: { display: 'SCN⁻', donorSymbol: 'S' },
}

export function ligandMeta(code: string): LigandMeta {
  const fromTable = NCERT_S2_LIGANDS.find((l) => l.formula === code)
  if (fromTable) {
    const extra = DISPLAY_MAP[code] ?? { display: code, donorSymbol: code }
    return {
      formula: fromTable.formula,
      display: extra.display,
      name: fromTable.name,
      charge: fromTable.charge,
      donorAtoms: fromTable.donorAtoms,
      kind: fromTable.kind,
      donorSymbol: extra.donorSymbol,
    }
  }
  const extra = EXTRA_LIGANDS[code]
  if (extra) return extra
  throw new RangeError(`Unknown ligand code: ${code}`)
}

const SUBS: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
}

const SUPS: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻',
}

export function toSub(n: number | string): string {
  return String(n).replace(/[0-9]/g, (ch) => SUBS[ch] ?? ch)
}

export function toSup(s: string): string {
  return s.replace(/[0-9+-]/g, (ch) => SUPS[ch] ?? ch)
}

export function formatChargeSup(charge: number): string {
  if (charge === 0) return ''
  const abs = Math.abs(charge)
  const sign = charge > 0 ? '+' : '-'
  return toSup(abs === 1 ? sign : `${abs}${sign}`)
}

export function formatSigned(n: number): string {
  if (n > 0) return `+${n}`
  if (n < 0) return `-${Math.abs(n)}`
  return '0'
}

export function toRoman(n: number): string {
  const map: Record<number, string> = {
    0: '0',
    1: 'I',
    2: 'II',
    3: 'III',
    4: 'IV',
    5: 'V',
    6: 'VI',
  }
  return map[n] ?? String(n)
}

export function formatLigandFormulaToken(code: string, count: number): string {
  const tokenMap: Record<string, string> = {
    NH3: 'NH₃',
    H2O: 'H₂O',
    C2O4: 'C₂O₄',
    Cl: 'Cl',
    CN: 'CN',
    CO: 'CO',
    en: 'en',
  }
  const base = tokenMap[code] ?? code
  const needsParens = code !== 'Cl' && count > 1
  if (count === 1) return base
  return needsParens ? `(${base})${toSub(count)}` : `${base}${toSub(count)}`
}

export function formatEntityDisplay(entity: CoordinationEntity): string {
  const inner = entity.metal + entity.ligands.map((l) => formatLigandFormulaToken(l.ligand, l.count)).join('')
  const sup = formatChargeSup(entity.entityCharge)
  if (entity.saltFormula === 'K4[Fe(CN)6]') {
    return `K₄[${inner}]`
  }
  return `[${inner}]${sup}`
}

export interface DissectedLigand {
  readonly code: string
  readonly display: string
  readonly name: string
  readonly count: number
  readonly charge: number
  readonly donorAtoms: number
  readonly kind: Denticity
  readonly donorSymbol: string
  readonly formulaToken: string
}

export interface DissectedComplex {
  readonly entity: CoordinationEntity
  readonly displayFormula: string
  readonly sphereDisplay: string
  readonly counterIonPrefix: string | null
  readonly counterIonLabel: string
  readonly metalIonDisplay: string
  readonly ligands: readonly DissectedLigand[]
  readonly cn: number
  readonly cnExpression: string
  readonly oxNumber: number
  readonly oxExpression: string
  readonly romanLabel: string
  readonly homoleptic: boolean
  readonly polyhedronLabel: string
}

export const DEFAULT_ENTITY_FORMULA = '[Co(en)3]3+'

export function dissectComplex(formula: string): DissectedComplex {
  const entity =
    NCERT_S2_ENTITIES.find((e) => e.formula === formula) ??
    NCERT_S2_ENTITIES.find((e) => e.formula === DEFAULT_ENTITY_FORMULA) ??
    NCERT_S2_ENTITIES[0]

  const ligands: DissectedLigand[] = entity.ligands.map((entry) => {
    const meta = ligandMeta(entry.ligand)
    return {
      code: entry.ligand,
      display: meta.display,
      name: meta.name,
      count: entry.count,
      charge: meta.charge,
      donorAtoms: meta.donorAtoms,
      kind: meta.kind,
      donorSymbol: meta.donorSymbol,
      formulaToken: formatLigandFormulaToken(entry.ligand, entry.count),
    }
  })

  const cn = coordinationNumber(ligands.map((l) => ({ donorAtoms: l.donorAtoms, count: l.count })))
  const cnExpression = ligands.map((l) => `${l.count} x ${l.donorAtoms}`).join(' + ') + ` = ${cn}`

  const expandedCharges: number[] = []
  ligands.forEach((l) => {
    for (let i = 0; i < l.count; i++) expandedCharges.push(l.charge)
  })
  const ox = oxidationNumber(entity.entityCharge, expandedCharges)
  const ligandSum = expandedCharges.reduce((a, b) => a + b, 0)
  const oxExpression = `${formatSigned(entity.entityCharge)} - (${formatSigned(ligandSum)}) = ${formatSigned(ox)}`

  const inner = entity.metal + ligands.map((l) => l.formulaToken).join('')
  const sphereDisplay = `[${inner}]${formatChargeSup(entity.entityCharge)}`
  const counterIonPrefix = entity.saltFormula === 'K4[Fe(CN)6]' ? 'K₄' : null
  const counterIonLabel = entity.counterIon ? `4 K⁺ (ionisable outside brackets)` : 'None shown'

  return {
    entity,
    displayFormula: formatEntityDisplay(entity),
    sphereDisplay,
    counterIonPrefix,
    counterIonLabel,
    metalIonDisplay: `${entity.metal}${formatChargeSup(ox)}`,
    ligands,
    cn,
    cnExpression,
    oxNumber: ox,
    oxExpression,
    romanLabel: `${entity.metal}(${toRoman(ox)})`,
    homoleptic: isHomoleptic(entity),
    polyhedronLabel: entity.polyhedron ?? 'Not stated in Section 5.2',
  }
}

export const ALL_DISSECTED_OPTIONS = NCERT_S2_ENTITIES.map((e) => ({
  value: e.formula,
  label: formatEntityDisplay(e),
}))
