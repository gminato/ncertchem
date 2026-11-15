/**
 * Redox reaction balancing by the ion-electron (half-reaction) method and
 * the oxidation-number method, following NCERT Class 11 Unit 7, Section 7.4.
 *
 * Provides:
 * 1. `isBalanced(equation)` - Verifies atom and charge balance with exact integers.
 * 2. `balanceHalfReaction(halfSkeleton, medium)` - Balances a single half-reaction.
 * 3. `balanceRedox(skeleton, medium)` - NCERT 7-step ion-electron method with animation steps.
 * 4. `balanceByOxidationNumber(skeleton, medium)` - NCERT 5-step oxidation-number method.
 */

import { parseFormula, type FormulaCounts } from './formula'
import {
  oxidationNumbers,
  rationalToNumber,
} from './oxidation-number'
import {
  parseReactionString,
  parseSpeciesToken,
} from './redox-analysis'
import type { RedoxReactionSpecies } from './ncert-unit7-tables'

/** Atom balance count for one element on both sides of an equation. */
export interface ElementAtomBalance {
  reactant: number
  product: number
  balanced: boolean
}

/** Result of checking if a reaction is balanced. */
export interface BalanceVerification {
  balanced: boolean
  atomBalance: Record<string, ElementAtomBalance>
  chargeBalance: {
    reactant: number
    product: number
    balanced: boolean
  }
}

/** One discrete step in an equation balancing derivation for UI animations. */
export interface BalanceStep {
  stepNumber: number
  title: string
  description: string
  equation: string
  equationMhchem: string
  intermediateReactants: readonly RedoxReactionSpecies[]
  intermediateProducts: readonly RedoxReactionSpecies[]
}

/** Result of balancing a single half-reaction. */
export interface BalancedHalfReactionResult {
  halfType: 'oxidation' | 'reduction'
  electrons: number
  reactants: readonly RedoxReactionSpecies[]
  products: readonly RedoxReactionSpecies[]
  equationString: string
  equationMhchem: string
  steps: readonly BalanceStep[]
}

/** Result of balancing a full redox reaction. */
export interface BalancedRedoxResult {
  method: 'half-reaction' | 'oxidation-number'
  medium: 'acidic' | 'basic'
  reactants: readonly RedoxReactionSpecies[]
  products: readonly RedoxReactionSpecies[]
  equationString: string
  equationMhchem: string
  steps: readonly BalanceStep[]
  isBalanced: boolean
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y !== 0) {
    const t = y
    y = x % y
    x = t
  }
  return x === 0 ? 1 : x
}

function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0
  return Math.abs(a * b) / gcd(a, b)
}

/** Formats a single species into a chemical string. */
export function formatSpecies(s: RedoxReactionSpecies): string {
  const coeff = s.coefficient > 1 ? String(s.coefficient) : ''
  let chargeStr = ''
  if (s.charge) {
    const mag = Math.abs(s.charge)
    const sign = s.charge > 0 ? '+' : '-'
    chargeStr = mag === 1 ? sign : `${mag}${sign}`
  }
  const stateStr = s.state ? `(${s.state})` : ''
  return `${coeff}${s.formula}${chargeStr}${stateStr}`
}

/** Formats lists of reactant and product species into an equation string. */
export function formatEquation(
  reactants: readonly RedoxReactionSpecies[],
  products: readonly RedoxReactionSpecies[],
): string {
  const rStr = reactants.map(formatSpecies).join(' + ')
  const pStr = products.map(formatSpecies).join(' + ')
  return `${rStr} -> ${pStr}`
}

/**
 * Formats a single species or formula into unambiguous mhchem notation for \ce{}.
 * Charges with magnitude > 1 or single signs are written with ^ notation (e.g. C2O4^2-, Cr2O7^2-, Fe^3+).
 * Electrons are written as e- or [n]e-.
 */
export function toMhchem(species: RedoxReactionSpecies | string): string {
  const s = typeof species === 'string' ? parseSpeciesToken(species) : species

  const coeff = s.coefficient > 1 ? String(s.coefficient) : ''
  if (s.formula === 'e') {
    return `${coeff}e-`
  }
  let chargeStr = ''
  if (s.charge) {
    const mag = Math.abs(s.charge)
    const sign = s.charge > 0 ? '+' : '-'
    chargeStr = mag === 1 ? sign : `^${mag}${sign}`
  }
  const stateStr = s.state ? `(${s.state})` : ''
  return `${coeff}${s.formula}${chargeStr}${stateStr}`
}

/** Formats lists of reactant and product species into an equation string in mhchem notation. */
export function formatEquationMhchem(
  reactants: readonly RedoxReactionSpecies[],
  products: readonly RedoxReactionSpecies[],
): string {
  const rStr = reactants.map(toMhchem).join(' + ')
  const pStr = products.map(toMhchem).join(' + ')
  return `${rStr} -> ${pStr}`
}

function normalizeInput(
  input: string | { reactants: readonly RedoxReactionSpecies[]; products: readonly RedoxReactionSpecies[] },
): { reactants: readonly RedoxReactionSpecies[]; products: readonly RedoxReactionSpecies[] } {
  if (typeof input === 'string') {
    return parseReactionString(input)
  }
  return input
}

/** True for the electron token in a half-equation ("e" or "e-"); it carries charge but no atoms. */
function isElectron(formula: string): boolean {
  return /^e-?$/.test(formula.trim())
}

/**
 * Checks whether a reaction is balanced in both atom counts and net electric charge.
 *
 * @param equation Reaction string or structured reaction object
 */
export function isBalanced(
  equation: string | { reactants: readonly RedoxReactionSpecies[]; products: readonly RedoxReactionSpecies[] },
): BalanceVerification {
  const { reactants, products } = normalizeInput(equation)

  const reactantAtoms: Record<string, number> = {}
  let reactantCharge = 0
  for (const r of reactants) {
    const counts = isElectron(r.formula) ? {} : parseFormula(r.formula)
    for (const [sym, count] of Object.entries(counts)) {
      reactantAtoms[sym] = (reactantAtoms[sym] ?? 0) + count * r.coefficient
    }
    reactantCharge += (r.charge ?? 0) * r.coefficient
  }

  const productAtoms: Record<string, number> = {}
  let productCharge = 0
  for (const p of products) {
    const counts = isElectron(p.formula) ? {} : parseFormula(p.formula)
    for (const [sym, count] of Object.entries(counts)) {
      productAtoms[sym] = (productAtoms[sym] ?? 0) + count * p.coefficient
    }
    productCharge += (p.charge ?? 0) * p.coefficient
  }

  const allElements = Array.from(new Set([...Object.keys(reactantAtoms), ...Object.keys(productAtoms)]))
  const atomBalance: Record<string, ElementAtomBalance> = {}
  let allAtomsBalanced = true

  for (const elem of allElements) {
    const rCount = reactantAtoms[elem] ?? 0
    const pCount = productAtoms[elem] ?? 0
    const balanced = rCount === pCount
    atomBalance[elem] = { reactant: rCount, product: pCount, balanced }
    if (!balanced) {
      allAtomsBalanced = false
    }
  }

  const chargeBalanced = reactantCharge === productCharge
  const balanced = allAtomsBalanced && chargeBalanced

  return {
    balanced,
    atomBalance,
    chargeBalance: {
      reactant: reactantCharge,
      product: productCharge,
      balanced: chargeBalanced,
    },
  }
}

/**
 * Balances a single oxidation or reduction half-reaction skeleton.
 *
 * @param halfSkeleton Skeleton half-reaction, e.g. "Cr2O72- -> Cr3+" or "MnO4- -> MnO2"
 * @param medium Reaction medium ('acidic' or 'basic')
 */
export function balanceHalfReaction(
  halfSkeleton: string | { reactants: readonly RedoxReactionSpecies[]; products: readonly RedoxReactionSpecies[] },
  medium: 'acidic' | 'basic',
): BalancedHalfReactionResult {
  const { reactants: initR, products: initP } = normalizeInput(halfSkeleton)
  if (initR.length === 0 || initP.length === 0) {
    throw new RangeError('Half-reaction must have at least one reactant and one product')
  }

  const rMain = { ...initR[0], coefficient: 1 }
  const pMain = { ...initP[0], coefficient: 1 }

  const countsR = parseFormula(rMain.formula)
  const countsP = parseFormula(pMain.formula)

  const steps: BalanceStep[] = []

  // Step 1: Write skeletal half-reaction
  steps.push({
    stepNumber: 1,
    title: 'Skeletal half-reaction',
    description: 'Write the skeletal ionic half-equation.',
    equation: formatEquation([rMain], [pMain]),
    equationMhchem: formatEquationMhchem([rMain], [pMain]),
    intermediateReactants: [rMain],
    intermediateProducts: [pMain],
  })

  // Step 2: Balance atoms other than O and H
  const nonOH = Object.keys(countsR).filter((sym) => sym !== 'O' && sym !== 'H')
  let coeffR = 1
  let coeffP = 1

  if (nonOH.length > 0) {
    const mainElem = nonOH[0]
    const cR = countsR[mainElem] ?? 1
    const cP = countsP[mainElem] ?? 1
    const l = lcm(cR, cP)
    coeffR = l / cR
    coeffP = l / cP
  } else if ('O' in countsR && 'O' in countsP) {
    const cR = countsR.O
    const cP = countsP.O
    const l = lcm(cR, cP)
    coeffR = l / cR
    coeffP = l / cP
  }

  let curReactants: RedoxReactionSpecies[] = [{ ...rMain, coefficient: coeffR }]
  let curProducts: RedoxReactionSpecies[] = [{ ...pMain, coefficient: coeffP }]

  steps.push({
    stepNumber: 2,
    title: 'Balance key atoms',
    description: 'Balance atoms other than oxygen and hydrogen.',
    equation: formatEquation(curReactants, curProducts),
    equationMhchem: formatEquationMhchem(curReactants, curProducts),
    intermediateReactants: [...curReactants],
    intermediateProducts: [...curProducts],
  })

  // Step 3: Balance Oxygen by adding H2O
  let oLeft = 0
  for (const r of curReactants) {
    const c = parseFormula(r.formula)
    oLeft += r.coefficient * (c.O ?? 0)
  }
  let oRight = 0
  for (const p of curProducts) {
    const c = parseFormula(p.formula)
    oRight += p.coefficient * (c.O ?? 0)
  }
  const diffO = oLeft - oRight

  if (diffO > 0) {
    const existing = curProducts.find((p) => p.formula === 'H2O')
    if (existing) {
      existing.coefficient += diffO
    } else {
      curProducts.push({ formula: 'H2O', coefficient: diffO, state: 'l', charge: 0 })
    }
  } else if (diffO < 0) {
    const existing = curReactants.find((r) => r.formula === 'H2O')
    if (existing) {
      existing.coefficient += -diffO
    } else {
      curReactants.push({ formula: 'H2O', coefficient: -diffO, state: 'l', charge: 0 })
    }
  }

  steps.push({
    stepNumber: 3,
    title: 'Balance oxygen',
    description: 'Add H2O molecules to balance oxygen atoms.',
    equation: formatEquation(curReactants, curProducts),
    equationMhchem: formatEquationMhchem(curReactants, curProducts),
    intermediateReactants: [...curReactants],
    intermediateProducts: [...curProducts],
  })

  // Step 4: Balance Hydrogen by adding H+
  let hLeft = 0
  for (const r of curReactants) {
    const c = parseFormula(r.formula)
    hLeft += r.coefficient * (c.H ?? 0)
  }
  let hRight = 0
  for (const p of curProducts) {
    const c = parseFormula(p.formula)
    hRight += p.coefficient * (c.H ?? 0)
  }
  const diffH = hLeft - hRight

  if (diffH > 0) {
    curProducts.push({ formula: 'H', coefficient: diffH, state: 'aq', charge: 1 })
  } else if (diffH < 0) {
    curReactants.push({ formula: 'H', coefficient: -diffH, state: 'aq', charge: 1 })
  }

  // Convert to basic medium if needed (add OH- to both sides)
  if (medium === 'basic' && diffH !== 0) {
    const hCount = Math.abs(diffH)
    if (diffH < 0) {
      // H+ was on reactants:
      // Remove H+ from reactants
      curReactants = curReactants.filter((r) => !(r.formula === 'H' && r.charge === 1))
      // Add hCount OH- to products
      curProducts.push({ formula: 'OH', coefficient: hCount, state: 'aq', charge: -1 })
      // Add hCount H2O to reactants
      const rH2O = curReactants.find((r) => r.formula === 'H2O')
      if (rH2O) {
        rH2O.coefficient += hCount
      } else {
        curReactants.push({ formula: 'H2O', coefficient: hCount, state: 'l', charge: 0 })
      }
    } else {
      // H+ was on products:
      curProducts = curProducts.filter((p) => !(p.formula === 'H' && p.charge === 1))
      curReactants.push({ formula: 'OH', coefficient: hCount, state: 'aq', charge: -1 })
      const pH2O = curProducts.find((p) => p.formula === 'H2O')
      if (pH2O) {
        pH2O.coefficient += hCount
      } else {
        curProducts.push({ formula: 'H2O', coefficient: hCount, state: 'l', charge: 0 })
      }
    }

    // Simplify H2O appearing on both sides
    const rH2O = curReactants.find((r) => r.formula === 'H2O')
    const pH2O = curProducts.find((p) => p.formula === 'H2O')
    if (rH2O && pH2O) {
      if (rH2O.coefficient > pH2O.coefficient) {
        rH2O.coefficient -= pH2O.coefficient
        curProducts = curProducts.filter((p) => p.formula !== 'H2O')
      } else if (pH2O.coefficient > rH2O.coefficient) {
        pH2O.coefficient -= rH2O.coefficient
        curReactants = curReactants.filter((r) => r.formula !== 'H2O')
      } else {
        curReactants = curReactants.filter((r) => r.formula !== 'H2O')
        curProducts = curProducts.filter((p) => p.formula !== 'H2O')
      }
    }
  }

  steps.push({
    stepNumber: 4,
    title: medium === 'acidic' ? 'Balance hydrogen' : 'Balance hydrogen and convert to basic medium',
    description:
      medium === 'acidic'
        ? 'Add H+ ions to balance hydrogen atoms.'
        : 'Add equal OH- ions to both sides to convert H+ to H2O and simplify.',
    equation: formatEquation(curReactants, curProducts),
    equationMhchem: formatEquationMhchem(curReactants, curProducts),
    intermediateReactants: [...curReactants],
    intermediateProducts: [...curProducts],
  })

  // Step 5: Balance charge by adding electrons
  let chgLeft = 0
  for (const r of curReactants) {
    chgLeft += (r.charge ?? 0) * r.coefficient
  }
  let chgRight = 0
  for (const p of curProducts) {
    chgRight += (p.charge ?? 0) * p.coefficient
  }

  const chgDiff = chgLeft - chgRight
  let halfType: 'oxidation' | 'reduction' = 'reduction'
  let electrons = 0

  if (chgDiff > 0) {
    // Left is more positive: reduction
    halfType = 'reduction'
    electrons = chgDiff
    curReactants.push({ formula: 'e', coefficient: electrons, charge: -1 })
  } else if (chgDiff < 0) {
    // Right is more positive: oxidation
    halfType = 'oxidation'
    electrons = -chgDiff
    curProducts.push({ formula: 'e', coefficient: electrons, charge: -1 })
  }

  steps.push({
    stepNumber: 5,
    title: 'Balance charge with electrons',
    description: `Add ${electrons} electrons to the ${halfType === 'reduction' ? 'reactant' : 'product'} side.`,
    equation: formatEquation(curReactants, curProducts),
    equationMhchem: formatEquationMhchem(curReactants, curProducts),
    intermediateReactants: [...curReactants],
    intermediateProducts: [...curProducts],
  })

  return {
    halfType,
    electrons,
    reactants: curReactants,
    products: curProducts,
    equationString: formatEquation(curReactants, curProducts),
    equationMhchem: formatEquationMhchem(curReactants, curProducts),
    steps,
  }
}

/**
 * Balances a skeletal redox equation using NCERT's 7-step ion-electron (half-reaction) method.
 *
 * @param skeleton Unbalanced skeletal reaction string or structured reaction
 * @param medium Reaction medium ('acidic' or 'basic')
 */
export function balanceRedox(
  skeleton: string | { reactants: readonly RedoxReactionSpecies[]; products: readonly RedoxReactionSpecies[] },
  medium: 'acidic' | 'basic',
): BalancedRedoxResult {
  const { reactants: sReactants, products: sProducts } = normalizeInput(skeleton)
  const steps: BalanceStep[] = []

  // Step 1: Skeletal equation in ionic form
  steps.push({
    stepNumber: 1,
    title: 'Skeletal equation in ionic form',
    description: 'Produce unbalanced equation for the reaction in ionic form.',
    equation: formatEquation(sReactants, sProducts),
    equationMhchem: formatEquationMhchem(sReactants, sProducts),
    intermediateReactants: sReactants,
    intermediateProducts: sProducts,
  })

  // Separate into oxidation and reduction pairs
  // Compute oxidation numbers for each species
  const rAnalyzed = sReactants.map((r) => ({
    species: r,
    states: oxidationNumbers(r.formula, r.charge ?? 0),
  }))
  const pAnalyzed = sProducts.map((p) => ({
    species: p,
    states: oxidationNumbers(p.formula, p.charge ?? 0),
  }))

  let oxR = sReactants[0]
  let oxP = sProducts[0]
  let redR = sReactants[0]
  let redP = sProducts[0]

  let foundOx = false
  let foundRed = false

  for (const r of rAnalyzed) {
    for (const [elem, rVal] of Object.entries(r.states)) {
      for (const p of pAnalyzed) {
        if (elem in p.states) {
          const pVal = p.states[elem]
          const diff = rationalToNumber(pVal) - rationalToNumber(rVal)
          if (diff > 1e-6 && !foundOx) {
            oxR = r.species
            oxP = p.species
            foundOx = true
          } else if (diff < -1e-6 && !foundRed) {
            redR = r.species
            redP = p.species
            foundRed = true
          }
        }
      }
    }
  }

  // Fallback if elements not cleanly separated: take first two
  if (!foundOx || !foundRed) {
    if (sReactants.length >= 2 && sProducts.length >= 2) {
      oxR = sReactants[0]
      oxP = sProducts[0]
      redR = sReactants[1]
      redP = sProducts[1]
    }
  }

  // Step 2: Separate into half-reactions
  let halfA = balanceHalfReaction({ reactants: [oxR], products: [oxP] }, medium)
  let halfB = balanceHalfReaction({ reactants: [redR], products: [redP] }, medium)

  const oxHalf = halfA.halfType === 'oxidation' ? halfA : halfB
  const redHalf = halfA.halfType === 'reduction' ? halfA : halfB

  steps.push({
    stepNumber: 2,
    title: 'Separate into half-reactions',
    description: `Oxidation half: ${formatSpecies(oxR)} -> ${formatSpecies(oxP)}; Reduction half: ${formatSpecies(redR)} -> ${formatSpecies(redP)}.`,
    equation: `Oxidation: ${formatEquation([oxR], [oxP])} | Reduction: ${formatEquation([redR], [redP])}`,
    equationMhchem: `Oxidation: ${formatEquationMhchem([oxR], [oxP])} | Reduction: ${formatEquationMhchem([redR], [redP])}`,
    intermediateReactants: sReactants,
    intermediateProducts: sProducts,
  })

  // Step 3: Balance atoms other than O and H (recorded in steps of half-reactions)
  steps.push({
    stepNumber: 3,
    title: 'Balance key atoms in each half-reaction',
    description: 'Balance atoms other than O and H in each half-reaction individually.',
    equation: `Oxidation: ${oxHalf.steps[1].equation} | Reduction: ${redHalf.steps[1].equation}`,
    equationMhchem: `Oxidation: ${oxHalf.steps[1].equationMhchem} | Reduction: ${redHalf.steps[1].equationMhchem}`,
    intermediateReactants: sReactants,
    intermediateProducts: sProducts,
  })

  // Step 4: Balance O and H
  steps.push({
    stepNumber: 4,
    title: 'Balance oxygen and hydrogen',
    description:
      medium === 'acidic'
        ? 'Add H2O to balance O, and H+ to balance H in each half-reaction.'
        : 'Add H2O to balance O, H+ to balance H, then equal OH- to both sides.',
    equation: `Oxidation: ${oxHalf.steps[3].equation} | Reduction: ${redHalf.steps[3].equation}`,
    equationMhchem: `Oxidation: ${oxHalf.steps[3].equationMhchem} | Reduction: ${redHalf.steps[3].equationMhchem}`,
    intermediateReactants: sReactants,
    intermediateProducts: sProducts,
  })

  // Step 5: Add electrons to balance charge
  steps.push({
    stepNumber: 5,
    title: 'Add electrons to balance charges',
    description: `Oxidation loses ${oxHalf.electrons}e-; Reduction gains ${redHalf.electrons}e-.`,
    equation: `Oxidation: ${oxHalf.equationString} | Reduction: ${redHalf.equationString}`,
    equationMhchem: `Oxidation: ${oxHalf.equationMhchem} | Reduction: ${redHalf.equationMhchem}`,
    intermediateReactants: sReactants,
    intermediateProducts: sProducts,
  })

  // Step 6: Equalise electrons, add and cancel
  const l = lcm(oxHalf.electrons, redHalf.electrons)
  const multOx = l / oxHalf.electrons
  const multRed = l / redHalf.electrons

  const combinedReactants: Record<string, RedoxReactionSpecies> = {}
  const combinedProducts: Record<string, RedoxReactionSpecies> = {}

  const addSpecies = (
    target: Record<string, RedoxReactionSpecies>,
    s: RedoxReactionSpecies,
    multiplier: number,
  ) => {
    if (s.formula === 'e') return // electrons cancel
    const key = `${s.formula}_${s.charge ?? 0}`
    if (!target[key]) {
      target[key] = { ...s, coefficient: s.coefficient * multiplier }
    } else {
      target[key].coefficient += s.coefficient * multiplier
    }
  }

  for (const r of oxHalf.reactants) addSpecies(combinedReactants, r, multOx)
  for (const p of oxHalf.products) addSpecies(combinedProducts, p, multOx)
  for (const r of redHalf.reactants) addSpecies(combinedReactants, r, multRed)
  for (const p of redHalf.products) addSpecies(combinedProducts, p, multRed)

  // Cancel common spectator species (H2O, H+, OH-) appearing on both sides
  for (const key of Object.keys(combinedReactants)) {
    if (key in combinedProducts) {
      const rCoeff = combinedReactants[key].coefficient
      const pCoeff = combinedProducts[key].coefficient
      if (rCoeff > pCoeff) {
        combinedReactants[key].coefficient -= pCoeff
        delete combinedProducts[key]
      } else if (pCoeff > rCoeff) {
        combinedProducts[key].coefficient -= rCoeff
        delete combinedReactants[key]
      } else {
        delete combinedReactants[key]
        delete combinedProducts[key]
      }
    }
  }

  // Order species nicely: main reactants first, then H+ / OH-, then H2O
  const sortSpecies = (list: RedoxReactionSpecies[]) => {
    return list.sort((a, b) => {
      const order = (f: string) => (f === 'H' || f === 'OH' ? 2 : f === 'H2O' ? 3 : 1)
      return order(a.formula) - order(b.formula)
    })
  }

  const finalReactants = sortSpecies(Object.values(combinedReactants))
  const finalProducts = sortSpecies(Object.values(combinedProducts))
  const finalEqStr = formatEquation(finalReactants, finalProducts)

  steps.push({
    stepNumber: 6,
    title: 'Equalise electrons and add half-reactions',
    description: `Multiply oxidation by ${multOx} and reduction by ${multRed}, add equations and cancel common species.`,
    equation: finalEqStr,
    equationMhchem: formatEquationMhchem(finalReactants, finalProducts),
    intermediateReactants: finalReactants,
    intermediateProducts: finalProducts,
  })

  // Step 7: Verification
  const verification = isBalanced({ reactants: finalReactants, products: finalProducts })
  steps.push({
    stepNumber: 7,
    title: 'Verify balance',
    description: 'Verify that the equation contains the same type and number of atoms and the same net charge.',
    equation: finalEqStr,
    equationMhchem: formatEquationMhchem(finalReactants, finalProducts),
    intermediateReactants: finalReactants,
    intermediateProducts: finalProducts,
  })

  return {
    method: 'half-reaction',
    medium,
    reactants: finalReactants,
    products: finalProducts,
    equationString: finalEqStr,
    equationMhchem: formatEquationMhchem(finalReactants, finalProducts),
    steps,
    isBalanced: verification.balanced,
  }
}

/**
 * Balances a skeletal redox equation using NCERT's 5-step oxidation-number method.
 *
 * @param skeleton Unbalanced skeletal reaction
 * @param medium Reaction medium ('acidic' or 'basic')
 */
export function balanceByOxidationNumber(
  skeleton: string | { reactants: readonly RedoxReactionSpecies[]; products: readonly RedoxReactionSpecies[] },
  medium: 'acidic' | 'basic',
): BalancedRedoxResult {
  // Use balanceRedox to compute exact integer balanced coefficients, then build NCERT's 5 oxidation-number steps
  const halfResult = balanceRedox(skeleton, medium)
  const { reactants: sReactants, products: sProducts } = normalizeInput(skeleton)

  const steps: BalanceStep[] = []

  // Step 1: Skeletal equation
  steps.push({
    stepNumber: 1,
    title: 'Skeletal ionic equation',
    description: 'Write the skeletal ionic equation for the reaction.',
    equation: formatEquation(sReactants, sProducts),
    equationMhchem: formatEquationMhchem(sReactants, sProducts),
    intermediateReactants: sReactants,
    intermediateProducts: sProducts,
  })

  // Step 2: Assign oxidation numbers
  steps.push({
    stepNumber: 2,
    title: 'Assign oxidation numbers',
    description: 'Assign oxidation numbers to elements to identify the oxidant and reductant.',
    equation: formatEquation(sReactants, sProducts),
    equationMhchem: formatEquationMhchem(sReactants, sProducts),
    intermediateReactants: sReactants,
    intermediateProducts: sProducts,
  })

  // Step 3: Equalise increase and decrease in oxidation number
  // Extract main reacting species with their final stoichiometric coefficients
  const mainReactants = halfResult.reactants.filter((r) => r.formula !== 'H' && r.formula !== 'OH' && r.formula !== 'H2O')
  const mainProducts = halfResult.products.filter((p) => p.formula !== 'H' && p.formula !== 'OH' && p.formula !== 'H2O')

  steps.push({
    stepNumber: 3,
    title: 'Equalise oxidation number changes',
    description: 'Calculate increase and decrease in oxidation number, and make them equal by adjusting coefficients.',
    equation: formatEquation(mainReactants, mainProducts),
    equationMhchem: formatEquationMhchem(mainReactants, mainProducts),
    intermediateReactants: mainReactants,
    intermediateProducts: mainProducts,
  })

  // Step 4: Balance ionic charge using H+ (acidic) or OH- (basic)
  const nonH2OReactants = halfResult.reactants.filter((r) => r.formula !== 'H2O')
  const nonH2OProducts = halfResult.products.filter((p) => p.formula !== 'H2O')

  steps.push({
    stepNumber: 4,
    title: medium === 'acidic' ? 'Balance ionic charges using H+' : 'Balance ionic charges using OH-',
    description:
      medium === 'acidic'
        ? 'Add H+ ions to balance net charges on both sides.'
        : 'Add OH- ions to balance net charges on both sides.',
    equation: formatEquation(nonH2OReactants, nonH2OProducts),
    equationMhchem: formatEquationMhchem(nonH2OReactants, nonH2OProducts),
    intermediateReactants: nonH2OReactants,
    intermediateProducts: nonH2OProducts,
  })

  // Step 5: Balance H and O by adding H2O
  steps.push({
    stepNumber: 5,
    title: 'Balance hydrogen and oxygen with H2O',
    description: 'Add H2O molecules to achieve atom balance and verify.',
    equation: halfResult.equationString,
    equationMhchem: halfResult.equationMhchem,
    intermediateReactants: halfResult.reactants,
    intermediateProducts: halfResult.products,
  })

  return {
    method: 'oxidation-number',
    medium,
    reactants: halfResult.reactants,
    products: halfResult.products,
    equationString: halfResult.equationString,
    equationMhchem: halfResult.equationMhchem,
    steps,
    isBalanced: halfResult.isBalanced,
  }
}
