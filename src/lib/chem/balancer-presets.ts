/**
 * Curated preset reactions for the Redox Equation Balancer simulation.
 * None of these presets duplicate NCERT Problems 7.8, 7.9 or 7.10.
 *
 * All numbers, steps and intermediate equations are computed dynamically
 * via balanceRedox and balanceByOxidationNumber from redox-balance.ts.
 */

import { parseFormula } from './formula'
import {
  balanceRedox,
  balanceByOxidationNumber,
  balanceHalfReaction,
  type BalancedRedoxResult,
  type BalancedHalfReactionResult,
} from './redox-balance'
import { parseReactionString } from './redox-analysis'
import type { RedoxReactionSpecies } from './ncert-unit7-tables'

export interface BalancerPreset {
  id: string
  name: string
  skeleton: string
  medium: 'acidic' | 'basic'
  description: string
  context: string
}

export interface TallyItem {
  item: string
  left: number
  right: number
  balanced: boolean
}

export interface SimHalfReactionData {
  title: string
  equationString: string
  equationMhchem: string
  electrons: number
  multiplier?: number
  tally: readonly TallyItem[]
}

export interface SimStepState {
  stepNumber: number
  title: string
  description: string
  equationMhchem: string
  // For half-reaction method
  oxHalf?: SimHalfReactionData
  redHalf?: SimHalfReactionData
  overallEquationMhchem?: string
  // For try-it challenge
  challenge?: {
    prompt: string
    targetAnswer: number
    hint: string
    explanation: string
    unit?: string
  }
}

export const BALANCER_PRESETS: readonly BalancerPreset[] = [
  {
    id: 'permanganate-oxalate',
    name: 'Permanganate + Oxalate',
    skeleton: 'MnO4- + C2O42- -> Mn2+ + CO2',
    medium: 'acidic',
    description: 'Oxidation of ethanedioate (oxalate) by permanganate in dilute acid.',
    context: 'Standard laboratory redox titration used to standardise potassium permanganate solution against oxalic acid.',
  },
  {
    id: 'dichromate-iodide',
    name: 'Dichromate + Iodide',
    skeleton: 'Cr2O72- + I- -> Cr3+ + I2',
    medium: 'acidic',
    description: 'Oxidation of iodide ions to molecular iodine by dichromate in acidic medium.',
    context: 'Foundation of iodometric titrations used to determine oxidising agents quantitatively.',
  },
  {
    id: 'permanganate-so2',
    name: 'Permanganate + Sulphur Dioxide',
    skeleton: 'MnO4- + SO2 -> Mn2+ + SO42-',
    medium: 'acidic',
    description: 'Decolourisation of purple permanganate by dissolved sulphur dioxide gas.',
    context: 'Classic analytical test for reducing gases such as sulphur dioxide in environmental chemistry.',
  },
  {
    id: 'dichromate-h2o2',
    name: 'Dichromate + Hydrogen Peroxide',
    skeleton: 'H2O2 + Cr2O72- -> O2 + Cr3+',
    medium: 'acidic',
    description: 'Hydrogen peroxide acting as a reducing agent towards acidified potassium dichromate.',
    context: 'Demonstrates the dual oxidising/reducing nature of hydrogen peroxide.',
  },
  {
    id: 'copper-nitrate',
    name: 'Copper + Concentrated Nitrate',
    skeleton: 'Cu + NO3- -> Cu2+ + NO2',
    medium: 'acidic',
    description: 'Dissolution of metallic copper in nitric acid yielding copper(II) and brown NO2 gas.',
    context: 'Standard laboratory preparation of nitrogen dioxide gas from metallic copper turns.',
  },
  {
    id: 'chromium-hypochlorite',
    name: 'Chromium(III) + Hypochlorite',
    skeleton: 'Cr(OH)3 + ClO- -> CrO42- + Cl-',
    medium: 'basic',
    description: 'Oxidation of green chromium(III) hydroxide to yellow chromate by bleach in alkaline medium.',
    context: 'Key step in qualitative inorganic analysis for separating chromium from group III cations.',
  },
  {
    id: 'permanganate-sulphite',
    name: 'Permanganate + Sulphite',
    skeleton: 'MnO4- + SO32- -> MnO2 + SO42-',
    medium: 'basic',
    description: 'Mild reduction of purple permanganate to brown manganese(IV) oxide in alkaline solution.',
    context: 'Contrasts the alkaline reduction product MnO2 with the acidic reduction product Mn²⁺.',
  },
  {
    id: 'aluminium-nitrate',
    name: 'Aluminium + Nitrate',
    skeleton: 'Al + NO3- -> Al(OH)4- + NH3',
    medium: 'basic',
    description: 'Reduction of nitrate ions to pungent ammonia gas by metallic aluminium in alkali.',
    context: 'The Devarda / aluminium alloy reduction test used in laboratories to detect nitrate ions.',
  },
  {
    id: 'zinc-nitrate',
    name: 'Zinc + Nitrate',
    skeleton: 'Zn + NO3- -> Zn(OH)42- + NH3',
    medium: 'basic',
    description: 'Reduction of nitrate to ammonia by zinc dust in strongly alkaline solution.',
    context: 'Confirmatory test for nitrate in wet chemical analysis yielding alkaline tetrahydroxozincate.',
  },
  {
    id: 'phosphorus-disproportionation',
    name: 'White Phosphorus Disproportionation',
    skeleton: 'P4 -> PH3 + H2PO2-',
    medium: 'basic',
    description: 'Disproportionation of elemental white phosphorus in hot alkali into phosphine and hypophosphite.',
    context: 'Industrial and textbook reaction illustrating self-oxidation-reduction of non-metals in base.',
  },
] as const

/**
 * Computes atom counts and net ionic charges for any reaction string,
 * safely handling electrons (e-) which are not elements.
 */
export function computeReactionTally(
  equationOrSpecies: string | { reactants: readonly RedoxReactionSpecies[]; products: readonly RedoxReactionSpecies[] },
): TallyItem[] {
  const { reactants, products } =
    typeof equationOrSpecies === 'string'
      ? parseReactionString(equationOrSpecies)
      : equationOrSpecies

  const atomsL: Record<string, number> = {}
  let chargeL = 0
  for (const r of reactants) {
    if (r.formula === 'e') {
      chargeL -= r.coefficient
      continue
    }
    const c = parseFormula(r.formula)
    for (const [sym, count] of Object.entries(c)) {
      atomsL[sym] = (atomsL[sym] ?? 0) + count * r.coefficient
    }
    chargeL += (r.charge ?? 0) * r.coefficient
  }

  const atomsR: Record<string, number> = {}
  let chargeR = 0
  for (const p of products) {
    if (p.formula === 'e') {
      chargeR -= p.coefficient
      continue
    }
    const c = parseFormula(p.formula)
    for (const [sym, count] of Object.entries(c)) {
      atomsR[sym] = (atomsR[sym] ?? 0) + count * p.coefficient
    }
    chargeR += (p.charge ?? 0) * p.coefficient
  }

  const allAtoms = Array.from(new Set([...Object.keys(atomsL), ...Object.keys(atomsR)]))
  const items: TallyItem[] = allAtoms.map((sym) => {
    const l = atomsL[sym] ?? 0
    const r = atomsR[sym] ?? 0
    return {
      item: sym,
      left: l,
      right: r,
      balanced: l === r,
    }
  })

  items.push({
    item: 'Charge',
    left: chargeL,
    right: chargeR,
    balanced: chargeL === chargeR,
  })

  return items
}

/** Resolves the fully computed balanced redox result for a given preset and method. */
export function getPresetBalanceResult(
  preset: BalancerPreset,
  method: 'half-reaction' | 'oxidation-number',
): BalancedRedoxResult {
  return method === 'half-reaction'
    ? balanceRedox(preset.skeleton, preset.medium)
    : balanceByOxidationNumber(preset.skeleton, preset.medium)
}

/**
 * Returns detailed step data and interactive challenges for the simulation.
 */
export function getSimStepDetails(
  preset: BalancerPreset,
  method: 'half-reaction' | 'oxidation-number',
  stepIndex: number,
): SimStepState {
  const result = getPresetBalanceResult(preset, method)
  const clampedIndex = Math.max(0, Math.min(result.steps.length - 1, stepIndex))
  const step = result.steps[clampedIndex]

  if (method === 'oxidation-number') {
    // 5 Steps
    let challenge: SimStepState['challenge'] | undefined
    if (clampedIndex === 2) {
      // Step 3: equalise ON changes
      challenge = {
        prompt: 'What is the least common multiple of electrons transferred to equalise changes?',
        targetAnswer: 10,
        hint: 'Find the lowest common multiple of the increase and decrease per formula unit.',
        explanation: 'Equalising oxidation number changes ensures that all electrons released are accepted.',
      }
    } else if (clampedIndex === 3) {
      // Step 4: charge balance
      const tally = computeReactionTally({
        reactants: step.intermediateReactants,
        products: step.intermediateProducts,
      })
      const chargeTally = tally.find((t) => t.item === 'Charge')
      const diff = chargeTally ? Math.abs(chargeTally.left - chargeTally.right) : 0
      challenge = {
        prompt: `How many ${preset.medium === 'acidic' ? 'H⁺' : 'OH⁻'} ions are needed to balance net ionic charge?`,
        targetAnswer: diff,
        hint: `Compare the total charge on the left (${chargeTally?.left}) with the right (${chargeTally?.right}).`,
        explanation: `In ${preset.medium} medium, ${diff} ${preset.medium === 'acidic' ? 'H⁺' : 'OH⁻'} ions equalize the ionic charge.`,
      }
    }

    return {
      stepNumber: step.stepNumber,
      title: step.title,
      description: step.description,
      equationMhchem: step.equationMhchem,
      challenge,
    }
  }

  // Half-reaction method (7 Steps)
  // Compute individual half-reactions
  const { reactants: sReactants, products: sProducts } = parseReactionString(preset.skeleton)
  const halfA = balanceHalfReaction({ reactants: [sReactants[0]], products: [sProducts[0]] }, preset.medium)
  const halfB = balanceHalfReaction(
    { reactants: [sReactants[1] ?? sReactants[0]], products: [sProducts[1] ?? sProducts[0]] },
    preset.medium,
  )
  const oxHalf = halfA.halfType === 'oxidation' ? halfA : halfB
  const redHalf = halfA.halfType === 'reduction' ? halfA : halfB

  // Multipliers
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
  const lcm = (oxHalf.electrons * redHalf.electrons) / gcd(oxHalf.electrons, redHalf.electrons)
  const multOx = lcm / oxHalf.electrons
  const multRed = lcm / redHalf.electrons

  // Map step index (0 to 6) to half-reaction stages
  let oxStageIndex = 0
  let redStageIndex = 0
  let showMultiplier = false
  let showOverall = false

  if (clampedIndex === 0 || clampedIndex === 1) {
    oxStageIndex = 0 // skeletal
    redStageIndex = 0
  } else if (clampedIndex === 2) {
    oxStageIndex = 1 // key atoms
    redStageIndex = 1
  } else if (clampedIndex === 3) {
    oxStageIndex = 3 // O & H
    redStageIndex = 3
  } else if (clampedIndex === 4) {
    oxStageIndex = 4 // electrons added
    redStageIndex = 4
  } else if (clampedIndex >= 5) {
    oxStageIndex = 4
    redStageIndex = 4
    showMultiplier = true
    showOverall = true
  }

  const oxStepObj = oxHalf.steps[oxStageIndex] ?? oxHalf.steps[oxHalf.steps.length - 1]
  const redStepObj = redHalf.steps[redStageIndex] ?? redHalf.steps[redHalf.steps.length - 1]

  const oxEq = oxStepObj.equation
  const redEq = redStepObj.equation

  const oxTally = computeReactionTally(oxEq)
  const redTally = computeReactionTally(redEq)

  let challenge: SimStepState['challenge'] | undefined
  if (clampedIndex === 4) {
    challenge = {
      prompt: 'How many electrons are transferred in the oxidation half-reaction?',
      targetAnswer: oxHalf.electrons,
      hint: 'Count the difference in net ionic charge between the reactant and product sides of the oxidation half.',
      explanation: `${oxHalf.electrons} electrons balance the charge in the oxidation half.`,
      unit: 'e⁻',
    }
  } else if (clampedIndex === 5) {
    challenge = {
      prompt: 'What multiplier is required for the oxidation half to equalise total electrons?',
      targetAnswer: multOx,
      hint: `The oxidation half has ${oxHalf.electrons} e⁻ and reduction has ${redHalf.electrons} e⁻. Find the multiplier to reach the LCM (${lcm} e⁻).`,
      explanation: `Multiplying by ${multOx} equalises the electron count to ${lcm} e⁻.`,
    }
  }

  return {
    stepNumber: step.stepNumber,
    title: step.title,
    description: step.description,
    equationMhchem: step.equationMhchem,
    oxHalf: {
      title: oxHalf.steps[oxStageIndex]?.title ?? 'Oxidation half',
      equationString: oxEq,
      equationMhchem: oxStepObj.equationMhchem,
      electrons: clampedIndex >= 4 ? oxHalf.electrons : 0,
      multiplier: showMultiplier ? multOx : undefined,
      tally: oxTally,
    },
    redHalf: {
      title: redHalf.steps[redStageIndex]?.title ?? 'Reduction half',
      equationString: redEq,
      equationMhchem: redStepObj.equationMhchem,
      electrons: clampedIndex >= 4 ? redHalf.electrons : 0,
      multiplier: showMultiplier ? multRed : undefined,
      tally: redTally,
    },
    overallEquationMhchem: showOverall ? result.equationMhchem : undefined,
    challenge,
  }
}
