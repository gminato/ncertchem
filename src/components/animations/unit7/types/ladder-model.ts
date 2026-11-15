import { analyseRedox, parseReactionString } from '@/lib/chem/redox-analysis'
import { oxidationNumbers, rationalToNumber } from '@/lib/chem/oxidation-number'
import type { RedoxReactionSpecies } from '@/lib/chem/ncert-unit7-tables'

/**
 * Pure model for a per-element oxidation-number ladder.
 *
 * Each element that changes gets its OWN lane (column), so the arrow of one
 * element never crosses the arrow of another. An element that changes in more
 * than one direction (disproportionation) gets a reactant lane and a product lane.
 * Every number comes from the redox libraries; nothing here is hard-coded.
 */

export interface LadderMarker {
  id: string
  /** Species the marker belongs to, e.g. "Mg", "Mg²⁺ in MgO", "Cl in KClO₃". */
  label: string
  on: number
  lane: number
}

export interface LadderArrow {
  id: string
  fromId: string
  toId: string
  tone: 'ox' | 'red'
  /** "Oxidation" or "Reduction". */
  title: string
  /** Element and states, e.g. "Mg: 0 → +2". */
  detail: string
}

export interface LadderModel {
  laneCount: number
  range: [number, number]
  markers: LadderMarker[]
  arrows: LadderArrow[]
}

/** Non-metals (and noble gases). Any other element is treated as a metal for ion notation. */
const NON_METALS = new Set([
  'H', 'B', 'C', 'N', 'O', 'F', 'Si', 'P', 'S', 'Cl', 'Br', 'I',
  'Se', 'Te', 'As', 'At', 'He', 'Ne', 'Ar', 'Kr', 'Xe', 'Rn',
])

const SUBSCRIPT: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
}
const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
}

/** Converts digits in a formula to subscripts: "KClO3" -> "KClO₃". */
export function toUnicodeFormula(formula: string): string {
  return formula.replace(/\d/g, (d) => SUBSCRIPT[d])
}

function superDigits(n: number): string {
  return String(n)
    .split('')
    .map((d) => SUPERSCRIPT[d])
    .join('')
}

/** Superscript charge: +2 -> "²⁺", −1 -> "⁻", +1 -> "⁺". */
export function superscriptCharge(charge: number): string {
  const sign = charge > 0 ? '⁺' : '⁻'
  const mag = Math.abs(charge)
  return mag === 1 ? sign : `${superDigits(mag)}${sign}`
}

/** Signed oxidation number with a true minus sign: 2 -> "+2", -2 -> "−2", 0 -> "0". */
export function formatOn(value: number): string {
  if (value > 0) return `+${value}`
  if (value < 0) return `−${Math.abs(value)}`
  return '0'
}

function isElementalFormula(formula: string): boolean {
  return /^[A-Z][a-z]?\d*$/.test(formula)
}

/**
 * Label for the marker of one species of one element, e.g.
 * "Mg" (element), "Mg²⁺ in MgO", "Cl in KClO₃", "Cl⁻ in KCl", "Cl⁻" (ion).
 */
export function markerLabel(species: RedoxReactionSpecies, element: string, on: number): string {
  const charge = species.charge ?? 0
  const formula = species.formula
  const elementU = toUnicodeFormula(element)
  const formulaU = toUnicodeFormula(formula) + (charge !== 0 ? superscriptCharge(charge) : '')

  if (/^[A-Z][a-z]?$/.test(formula) && charge !== 0) {
    return `${elementU}${superscriptCharge(charge)}`
  }
  if (on === 0 && charge === 0 && isElementalFormula(formula)) {
    return toUnicodeFormula(formula)
  }

  const elements = new Set(formula.match(/[A-Z][a-z]?/g) ?? [])
  const hasMetal = [...elements].some((e) => !NON_METALS.has(e))
  const isBinary = elements.size === 2
  const integerOn = Number.isInteger(on)

  const cationOfMetal = integerOn && on > 0 && !NON_METALS.has(element)
  const anionInMetalSalt = integerOn && on < 0 && isBinary && hasMetal
  if (cationOfMetal || anionInMetalSalt) {
    return `${elementU}${superscriptCharge(on)} in ${formulaU}`
  }
  return `${elementU} in ${formulaU}`
}

interface StateRecord {
  index: number
  species: RedoxReactionSpecies
  states: Record<string, number>
}

function stateNumbers(species: RedoxReactionSpecies): Record<string, number> {
  const raw = oxidationNumbers(species.formula, species.charge ?? 0)
  const out: Record<string, number> = {}
  for (const [element, value] of Object.entries(raw)) {
    out[element] = rationalToNumber(value)
  }
  return out
}

const EPS = 1e-9

/**
 * Builds the ladder for a balanced reaction string such as
 * "2Mg(s) + O2(g) -> 2MgO(s)". Returns null when no element changes.
 */
export function buildLadderModel(equation: string): LadderModel | null {
  const analysis = analyseRedox(equation)
  if (!analysis.isRedox) return null

  const { reactants, products } = parseReactionString(equation)
  const reactantRecords: StateRecord[] = reactants.map((species, index) => ({
    index,
    species,
    states: stateNumbers(species),
  }))
  const productRecords: StateRecord[] = products.map((species, index) => ({
    index,
    species,
    states: stateNumbers(species),
  }))

  // Remove duplicates produced by species that share an element state.
  const seen = new Set<string>()
  const changes = analysis.changes.filter((c) => {
    const key = `${c.element}|${rationalToNumber(c.from)}|${rationalToNumber(c.to)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const markers: LadderMarker[] = []
  const markerIdByKey = new Map<string, string>()
  const addMarker = (
    side: 'r' | 'p',
    record: StateRecord,
    element: string,
    lane: number
  ): string => {
    const key = `${side}${record.index}-${element}-${lane}`
    const existing = markerIdByKey.get(key)
    if (existing) return existing
    const id = `${side}${record.index}-${element}-${lane}`
    const on = record.states[element]
    markers.push({ id, label: markerLabel(record.species, element, on), on, lane })
    markerIdByKey.set(key, id)
    return id
  }

  const findRecord = (records: StateRecord[], element: string, value: number): StateRecord | undefined =>
    records.find((r) => r.states[element] !== undefined && Math.abs(r.states[element] - value) < EPS)

  const elementOrder: string[] = []
  for (const c of changes) {
    if (!elementOrder.includes(c.element)) elementOrder.push(c.element)
  }

  const arrows: LadderArrow[] = []
  let laneCount = 0

  for (const element of elementOrder) {
    const group = changes.filter((c) => c.element === element)
    const multiple = group.length > 1
    const reactantLane = laneCount++
    const productLane = multiple ? laneCount++ : reactantLane

    group.forEach((c, i) => {
      const from = rationalToNumber(c.from)
      const to = rationalToNumber(c.to)
      const rRecord = findRecord(reactantRecords, element, from)
      const pRecord = findRecord(productRecords, element, to)
      if (!rRecord || !pRecord) {
        throw new RangeError(`No species carries ${element} at ${from} -> ${to}`)
      }
      const fromId = addMarker('r', rRecord, element, reactantLane)
      const toId = addMarker('p', pRecord, element, productLane)
      const tone: 'ox' | 'red' = to > from ? 'ox' : 'red'
      const elementU = toUnicodeFormula(element)
      arrows.push({
        id: `${element}-${i}`,
        fromId,
        toId,
        tone,
        title: tone === 'ox' ? 'Oxidation' : 'Reduction',
        detail: `${elementU}: ${formatOn(from)} → ${formatOn(to)}`,
      })
    })
  }

  // The exact span of the markers; the renderer adds headroom where a diagonal arrow needs it.
  const values = markers.map((m) => m.on)
  const range: [number, number] = [Math.floor(Math.min(...values)), Math.ceil(Math.max(...values))]

  return { laneCount, range, markers, arrows }
}
