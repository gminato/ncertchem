/**
 * Redox reaction analysis and classification according to NCERT Class 11 Unit 7, Section 7.3.1.
 *
 * Analyses oxidation numbers on both sides, identifies oxidised and reduced elements,
 * detects oxidants and reductants, and classifies into NCERT's standard reaction types:
 * - combination
 * - decomposition
 * - metal-displacement
 * - non-metal-displacement
 * - disproportionation
 * - not-redox
 */

import { parseFormula } from './formula'
import {
  makeRational,
  oxidationNumbers,
  rationalToNumber,
  type Rational,
} from './oxidation-number'
import type { NcertRedoxType, RedoxReactionSpecies, StructuredRedoxReaction } from './ncert-unit7-tables'

/** Detailed changes in an element's oxidation state during a reaction. */
export interface ElementStateChange {
  element: string
  from: Rational
  to: Rational
  changePerAtom: Rational
}

/** Result of a complete redox analysis. */
export interface RedoxAnalysisResult {
  isRedox: boolean
  type: NcertRedoxType
  reactantStates: Record<string, Rational>
  productStates: Record<string, Rational>
  changes: readonly ElementStateChange[]
  oxidisedElements: readonly string[]
  reducedElements: readonly string[]
  oxidants: readonly string[]
  reductants: readonly string[]
  summary: string
}

const METALS = new Set([
  'Li', 'Na', 'K', 'Rb', 'Cs', 'Fr',
  'Be', 'Mg', 'Ca', 'Sr', 'Ba', 'Ra',
  'Al', 'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn',
  'Y', 'Zr', 'Nb', 'Mo', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd',
  'Sn', 'Pt', 'Au', 'Hg', 'Tl', 'Pb',
])

/**
 * Parses a single chemical species token, e.g. "2Mg(s)", "Cu2+(aq)", "Cr2O7^2-", "H2O(l)".
 */
export function parseSpeciesToken(rawToken: string): RedoxReactionSpecies {
  const token = rawToken.trim()
  if (token.length === 0) {
    throw new RangeError('Species token cannot be empty')
  }

  // Check leading coefficient
  const match = /^(\d+)?\s*(.+)$/.exec(token)
  if (!match) {
    throw new RangeError(`Cannot parse species token: "${rawToken}"`)
  }

  const coefficient = match[1] ? Number(match[1]) : 1
  let remainder = match[2].trim()

  // Extract physical state (s), (l), (g), (aq) if present at end
  let state: 's' | 'l' | 'g' | 'aq' | undefined
  const stateMatch = /\((s|l|g|aq)\)$/i.exec(remainder)
  if (stateMatch) {
    state = stateMatch[1].toLowerCase() as 's' | 'l' | 'g' | 'aq'
    remainder = remainder.slice(0, stateMatch.index).trim()
  }

  // Extract charge if present, e.g. "Cu2+", "2+", "Cr2O72-", "Cr2O7^2-", "Cl-", "Fe3+"
  let charge = 0
  const caretMatch = /^(.+?)\^([+-]?\d*[+-])$/.exec(remainder)
  if (caretMatch) {
    remainder = caretMatch[1].trim()
    const rawChg = caretMatch[2]
    const sign = rawChg.endsWith('-') ? -1 : 1
    const digits = rawChg.slice(0, -1).replace(/[+-]/g, '')
    charge = sign * (digits.length > 0 ? Number(digits) : 1)
  } else {
    // Monatomic ion: single element symbol followed by optional digits and sign, e.g. "Cu2+", "Fe3+", "Cl-", "O2-"
    const monatomicMatch = /^([A-Z][a-z]?)(\d*)([+-])$/.exec(remainder)
    if (monatomicMatch) {
      remainder = monatomicMatch[1]
      const mag = monatomicMatch[2].length > 0 ? Number(monatomicMatch[2]) : 1
      const sign = monatomicMatch[3] === '-' ? -1 : 1
      charge = sign * mag
    } else {
      // Polyatomic ions ending with charge
      // Check for e.g. "SO42-", "Cr2O72-", "S2O32-", "S4O62-" (subscript followed by charge digits and sign)
      const multiDigitChargeMatch = /^([A-Za-z0-9()\[\]]+?\d+)(\d+)([+-])$/.exec(remainder)
      if (multiDigitChargeMatch) {
        remainder = multiDigitChargeMatch[1]
        const mag = Number(multiDigitChargeMatch[2])
        const sign = multiDigitChargeMatch[3] === '-' ? -1 : 1
        charge = sign * mag
      } else {
        // Ending with just "+" or "-", e.g. "NO2-", "NO3-", "ClO-", "ClO3-", "MnO4-", "OH-", "H2PO2-"
        const singleSignMatch = /^([A-Za-z0-9()\[\]]+)([+-])$/.exec(remainder)
        if (singleSignMatch) {
          remainder = singleSignMatch[1]
          charge = singleSignMatch[2] === '-' ? -1 : 1
        }
      }
    }
  }

  return {
    formula: remainder,
    coefficient,
    state,
    charge,
  }
}

/**
 * Parses an entire chemical reaction string into structured reactants and products.
 *
 * @example parseReactionString("2Mg(s) + O2(g) -> 2MgO(s)")
 * @throws {RangeError} If the reaction syntax is invalid
 */
export function parseReactionString(equation: string): {
  reactants: RedoxReactionSpecies[]
  products: RedoxReactionSpecies[]
} {
  if (typeof equation !== 'string' || equation.trim().length === 0) {
    throw new RangeError('Equation string must not be empty')
  }

  const parts = equation.split(/->|→|⇌|=/)
  if (parts.length !== 2) {
    throw new RangeError(`Reaction equation must contain a single arrow separator (received: "${equation}")`)
  }

  const parseSide = (sideStr: string): RedoxReactionSpecies[] => {
    return sideStr
      .split(/\s+\+\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map(parseSpeciesToken)
  }

  const reactants = parseSide(parts[0])
  const products = parseSide(parts[1])

  if (reactants.length === 0 || products.length === 0) {
    throw new RangeError(`Equation must have at least one reactant and one product: "${equation}"`)
  }

  return { reactants, products }
}

/**
 * Normalises any input format into structured reactant and product lists.
 */
function normalizeReactionInput(
  input: StructuredRedoxReaction | { reactants: readonly RedoxReactionSpecies[]; products: readonly RedoxReactionSpecies[] } | string,
): { reactants: readonly RedoxReactionSpecies[]; products: readonly RedoxReactionSpecies[]; declaredType?: NcertRedoxType } {
  if (typeof input === 'string') {
    return parseReactionString(input)
  }
  return {
    reactants: input.reactants,
    products: input.products,
    declaredType: 'type' in input ? input.type : undefined,
  }
}

/**
 * Analyses a chemical reaction for redox changes, identifying oxidised/reduced elements,
 * oxidants, reductants, and the NCERT reaction classification type.
 *
 * @param reaction Structured reaction or reaction equation string
 * @returns Complete redox analysis result
 * @throws {RangeError} On invalid or unparseable input
 */
export function analyseRedox(
  reaction: StructuredRedoxReaction | { reactants: readonly RedoxReactionSpecies[]; products: readonly RedoxReactionSpecies[] } | string,
): RedoxAnalysisResult {
  const { reactants, products, declaredType } = normalizeReactionInput(reaction)

  // Map element -> set of rational oxidation numbers on reactant side
  const reactantElemStates: Record<string, Rational[]> = {}
  const reactantSpeciesMap: { species: RedoxReactionSpecies; states: Record<string, Rational> }[] = []

  for (const r of reactants) {
    const states = oxidationNumbers(r.formula, r.charge ?? 0)
    reactantSpeciesMap.push({ species: r, states })
    for (const [elem, val] of Object.entries(states)) {
      reactantElemStates[elem] = reactantElemStates[elem] ?? []
      reactantElemStates[elem].push(val)
    }
  }

  // Map element -> set of rational oxidation numbers on product side
  const productElemStates: Record<string, Rational[]> = {}
  for (const p of products) {
    const states = oxidationNumbers(p.formula, p.charge ?? 0)
    for (const [elem, val] of Object.entries(states)) {
      productElemStates[elem] = productElemStates[elem] ?? []
      productElemStates[elem].push(val)
    }
  }

  // Compare oxidation states for each element
  const allElements = Array.from(new Set([...Object.keys(reactantElemStates), ...Object.keys(productElemStates)]))
  const changes: ElementStateChange[] = []
  const oxidisedElementsSet = new Set<string>()
  const reducedElementsSet = new Set<string>()

  // Pick representative reactant and product state for overall mapping
  const reactantStates: Record<string, Rational> = {}
  const productStates: Record<string, Rational> = {}

  for (const elem of allElements) {
    const rList = reactantElemStates[elem] ?? []
    const pList = productElemStates[elem] ?? []

    if (rList.length > 0) {
      reactantStates[elem] = rList[0]
    }
    if (pList.length > 0) {
      productStates[elem] = pList[0]
    }

    // Check pairwise changes across all reactant and product states for this element
    for (const rVal of rList) {
      for (const pVal of pList) {
        const diffNum = pVal.num * rVal.den - rVal.num * pVal.den
        const diffDen = pVal.den * rVal.den
        if (diffNum !== 0) {
          const changePerAtom = makeRational(diffNum, diffDen)
          changes.push({
            element: elem,
            from: rVal,
            to: pVal,
            changePerAtom,
          })
          if (diffNum > 0) {
            oxidisedElementsSet.add(elem)
          } else {
            reducedElementsSet.add(elem)
          }
        }
      }
    }
  }

  const oxidisedElements = Array.from(oxidisedElementsSet)
  const reducedElements = Array.from(reducedElementsSet)
  const isRedox = oxidisedElements.length > 0 || reducedElements.length > 0

  // Identify oxidant and reductant reactant species
  const oxidantsSet = new Set<string>()
  const reductantsSet = new Set<string>()

  if (isRedox) {
    for (const { species, states } of reactantSpeciesMap) {
      let isOxidant = false
      let isReductant = false
      for (const [elem, val] of Object.entries(states)) {
        const pList = productElemStates[elem] ?? []
        for (const pVal of pList) {
          const diff = rationalToNumber(pVal) - rationalToNumber(val)
          if (diff < -1e-6) {
            isOxidant = true
          }
          if (diff > 1e-6) {
            isReductant = true
          }
        }
      }
      if (isOxidant) {
        oxidantsSet.add(species.formula)
        if (species.charge) {
          const mag = Math.abs(species.charge)
          const sign = species.charge > 0 ? '+' : '-'
          const suffix = mag === 1 ? sign : `${mag}${sign}`
          oxidantsSet.add(`${species.formula}${suffix}`)
        }
      }
      if (isReductant) {
        reductantsSet.add(species.formula)
        if (species.charge) {
          const mag = Math.abs(species.charge)
          const sign = species.charge > 0 ? '+' : '-'
          const suffix = mag === 1 ? sign : `${mag}${sign}`
          reductantsSet.add(`${species.formula}${suffix}`)
        }
      }
    }
  }

  const oxidants = Array.from(oxidantsSet)
  const reductants = Array.from(reductantsSet)

  // Reaction Classification Type
  let type: NcertRedoxType = 'redox'

  // Disproportionation: an element starting in a single oxidation state in one reactant
  // is simultaneously oxidised and reduced
  const isDisproportionation = oxidisedElements.some((elem) => {
    if (!reducedElements.includes(elem)) return false
    const containingReactants = reactantSpeciesMap.filter(({ states }) => elem in states)
    if (containingReactants.length === 1) return true
    const rStates = containingReactants.map(({ states }) => rationalToNumber(states[elem]))
    return rStates.every((v) => Math.abs(v - rStates[0]) < 1e-6)
  })

  if (!isRedox) {
    type = 'not-redox'
  } else if (isDisproportionation) {
    type = 'disproportionation'
  } else if (reactants.length >= 2 && products.length === 1) {
    // Combination: A + B -> C
    type = 'combination'
  } else if (reactants.length === 1 && products.length >= 2) {
    // Decomposition: A -> B + C + ...
    type = 'decomposition'
  } else {
    // Check for displacement
    // Metal displacement: an uncombined metal reactant displaces another metal
    const hasUncombinedMetalReactant = reactants.some((r) => {
      const counts = parseFormula(r.formula)
      const syms = Object.keys(counts)
      return syms.length === 1 && METALS.has(syms[0]) && (r.charge ?? 0) === 0
    })

    const hasUncombinedMetalProduct = products.some((p) => {
      const counts = parseFormula(p.formula)
      const syms = Object.keys(counts)
      return syms.length === 1 && METALS.has(syms[0]) && (p.charge ?? 0) === 0
    })

    const hasHydrogenGasProduct = products.some((p) => p.formula === 'H2')
    const hasHalogenDisplacement =
      (reactants.some((r) => r.formula === 'F2') && products.some((p) => p.formula === 'O2' || p.formula === 'OF2')) ||
      (reactants.some((r) => r.formula === 'Cl2') && products.some((p) => p.formula === 'Br2' || p.formula === 'I2')) ||
      (reactants.some((r) => r.formula === 'Br2') && products.some((p) => p.formula === 'I2'))

    if (hasUncombinedMetalReactant && hasUncombinedMetalProduct) {
      type = 'metal-displacement'
    } else if (hasHydrogenGasProduct || hasHalogenDisplacement) {
      type = 'non-metal-displacement'
    } else if (reactants.some((r) => r.formula === 'CH4') && reactants.some((r) => r.formula === 'O2')) {
      // Methane combustion is grouped under combination in NCERT Section 7.3.1
      type = 'combination'
    } else if (reactants.some((r) => r.formula === 'N2') && reactants.some((r) => r.formula === 'O2') && products.length <= 2) {
      type = 'combination'
    } else if (declaredType) {
      type = declaredType
    }
  }

  const summary = isRedox
    ? `Redox reaction (${type}): ${oxidisedElements.join(', ')} oxidised; ${reducedElements.join(', ')} reduced.`
    : 'Not a redox reaction (no change in oxidation numbers).'

  return {
    isRedox,
    type,
    reactantStates,
    productStates,
    changes,
    oxidisedElements,
    reducedElements,
    oxidants,
    reductants,
    summary,
  }
}
