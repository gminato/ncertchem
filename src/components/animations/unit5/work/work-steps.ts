/**
 * Step targets for the three Unit 5 Section 5.2 Scrollies: the piston against a weight (why
 * w = −p_ex ΔV), one step against many steps against the reversible limit on a p–V diagram, and
 * ΔH against ΔU when the number of moles of gas changes. Every number shown is computed here with
 * the pure libraries (pv-work, isothermal-steps, hess, enthalpy); none is typed in by hand.
 */

import { workFromLitreBar, type Work } from '@/lib/chem/pv-work'
import {
  processFor,
  totalWork,
  workFraction,
  type StepCount,
} from '@/lib/chem/isothermal-steps'
import { reactionEnthalpyFromFormation } from '@/lib/chem/hess'
import { deltaNg, enthalpyFromInternalEnergy, internalEnergyFromEnthalpy, type ReactionSpecies } from '@/lib/chem/enthalpy'

/** The true minus sign (U+2212), so a negative number never reads as a hyphen. */
export function signed(value: number, digits: number): string {
  const rounded = Number(value.toFixed(digits))
  const body = Math.abs(rounded).toFixed(digits)
  return rounded < 0 ? `−${body}` : body
}

/** Joules as a signed whole number, with a true minus sign. */
export function signedJoule(work: Work): string {
  return `${signed(work.joule, 0)} J`
}

/** Litre-bar readout, signed, to two decimals. */
export function signedLitreBar(work: Work): string {
  return `${signed(work.litreBar, 2)} L bar`
}

// ---------------------------------------------------------------------------
// Scrolly 1: why w = −p_ex ΔV
// ---------------------------------------------------------------------------

/** The piston's start and end volumes, and the constant external pressure in bar, for Scrolly 1. */
export const PISTON_DEMO = {
  startL: 6,
  dVL: 3,
  pExtBar: 2,
} as const

/** Volume scale of the cylinder drawing: the piston is at the top of travel at this volume. */
export const CYLINDER_FULL_L = 14

export interface PistonStep {
  /** Gas volume in litres, drawn as the piston height. */
  volumeL: number
  /** External pressure on the piston in bar, drawn as whole weights. */
  pExtBar: number
  caption: string
  /** The working line, shown under the drawing. */
  working: string
}

/** The work of the piston move: w = −p_ex ΔV (equation 5.2), for the Scrolly's numbers. */
export function pistonWork(): Work {
  return workFromLitreBar(-PISTON_DEMO.pExtBar * PISTON_DEMO.dVL)
}

export const PISTON_STEP_COUNT = 4

export function pistonStep(index: number): PistonStep {
  const { startL, dVL, pExtBar } = PISTON_DEMO
  const w = pistonWork()
  const wSign = signedLitreBar(w)
  const wJoule = signedJoule(w)
  const steps: PistonStep[] = [
    {
      volumeL: startL,
      pExtBar,
      caption: 'The gas pushes up on the piston. The weight on top pushes back with a pressure p_ex, and the piston holds still.',
      working: `Initial volume V_i = ${startL.toFixed(2)} L`,
    },
    {
      volumeL: startL + dVL,
      pExtBar,
      caption: 'The gas wins, and the piston rises a distance l. The weight rises with it, against the same p_ex.',
      working: `Volume change ΔV = ${dVL.toFixed(2)} L`,
    },
    {
      volumeL: startL + dVL,
      pExtBar,
      caption: 'The force is p_ex A, and the work done against it is force × distance. Since A l = ΔV, the work is −p_ex ΔV.',
      working: `w = −p_ex ΔV = −(${pExtBar.toFixed(2)} bar)(${dVL.toFixed(2)} L) = ${wSign} = ${wJoule}`,
    },
    {
      volumeL: startL,
      pExtBar,
      caption: 'Now push the piston back in, against the same p_ex. The surroundings do work on the gas, so the sign of w is positive.',
      working: `Work on the gas: w = +${Math.abs(w.joule).toFixed(0)} J (positive)`,
    },
  ]
  const clamped = Math.min(PISTON_STEP_COUNT - 1, Math.max(0, Math.round(index)))
  return steps[clamped]
}

// ---------------------------------------------------------------------------
// Scrolly 2: one step, many steps and the reversible limit on the p–V diagram
// ---------------------------------------------------------------------------

export interface PathStep {
  steps: StepCount
  label: string
  caption: string
  work: Work
  fraction: number
}

export const PATH_STEP_COUNT = 4

/** Four Steps: one step, two, eight and the reversible limit, all for the Section gas. */
export function pathStep(index: number): PathStep {
  const expansion = processFor('expansion')
  const plan: Array<{ steps: StepCount; label: string; caption: string }> = [
    {
      steps: 1,
      label: 'One step',
      caption: 'One step: the piston meets one weight, set to the final pressure, and the gas expands all the way. The shaded rectangle is the work.',
    },
    {
      steps: 2,
      label: 'Two steps',
      caption: 'Two steps: the weight is changed once, halfway. The staircase now fits the curve better, and the work rises.',
    },
    {
      steps: 8,
      label: 'Eight steps',
      caption: 'Eight steps: each drop is smaller and the staircase hugs the isotherm. The shaded area is closer to the reversible area.',
    },
    {
      steps: 'reversible',
      label: 'Reversible',
      caption: 'Reversible: the weight matches the gas pressure at every instant. The area is the integral of p dV, and the work is −2.303 nRT log(V_f / V_i).',
    },
  ]
  const clamped = Math.min(PATH_STEP_COUNT - 1, Math.max(0, Math.round(index)))
  const { steps, label, caption } = plan[clamped]
  return {
    steps,
    label,
    caption,
    work: totalWork(expansion, steps),
    fraction: workFraction(expansion, steps),
  }
}

/** The fraction of the reversible maximum as a whole percentage, for a caption. */
export function percentOfReversible(fraction: number): string {
  return `${Math.round(fraction * 100)}%`
}

// ---------------------------------------------------------------------------
// Scrolly 3: ΔH against ΔU when the moles of gas change
// ---------------------------------------------------------------------------

/**
 * The Section's enthalpy example: N₂(g) + 3 H₂(g) → 2 NH₃(g) at 298 K. Its ΔH comes from Table
 * 5.2 through the formation enthalpies, and ΔU from equation 5.10 with Δn_g = −2.
 */
export const AMMONIA_EQUATION = {
  reactants: [
    { species: 'N2(g)', coefficient: 1 },
    { species: 'H2(g)', coefficient: 3 },
  ],
  products: [{ species: 'NH3(g)', coefficient: 2 }],
} as const

/** A solids-only change for the contrast: no gas moles change, so ΔH and ΔU agree. */
export const DIAMOND_EQUATION = {
  reactants: [{ species: 'C(graphite)', coefficient: 1 }],
  products: [{ species: 'C(diamond)', coefficient: 1 }],
} as const

export const ENTHALPY_TEMPERATURE_K = 298

/** Kelvin-scale enthalpy and internal energy changes for the two reactions, in kJ mol⁻¹. */
export function enthalpyExample() {
  const ammoniaDeltaH = reactionEnthalpyFromFormation({ label: 'NH₃ synthesis', ...AMMONIA_EQUATION })
  const ammoniaSpecies: readonly ReactionSpecies[] = [
    { coefficient: 1, state: 'g' },
    { coefficient: 3, state: 'g' },
  ]
  const ammoniaProducts: readonly ReactionSpecies[] = [{ coefficient: 2, state: 'g' }]
  const ammoniaDeltaNg = deltaNg(ammoniaSpecies, ammoniaProducts)
  const ammoniaDeltaU = internalEnergyFromEnthalpy(ammoniaDeltaH, ammoniaDeltaNg, ENTHALPY_TEMPERATURE_K)

  const diamondDeltaH = reactionEnthalpyFromFormation({ label: 'graphite to diamond', ...DIAMOND_EQUATION })
  const diamondDeltaNg = deltaNg([{ coefficient: 1, state: 's' }], [{ coefficient: 1, state: 's' }])
  const diamondDeltaU = internalEnergyFromEnthalpy(diamondDeltaH, diamondDeltaNg, ENTHALPY_TEMPERATURE_K)

  return {
    ammonia: {
      deltaH: ammoniaDeltaH,
      deltaU: ammoniaDeltaU,
      deltaNg: ammoniaDeltaNg,
      /** ΔH − ΔU, which equals Δn_g RT. */
      gap: ammoniaDeltaH - ammoniaDeltaU,
      check: enthalpyFromInternalEnergy(ammoniaDeltaU, ammoniaDeltaNg, ENTHALPY_TEMPERATURE_K),
    },
    diamond: {
      deltaH: diamondDeltaH,
      deltaU: diamondDeltaU,
      deltaNg: diamondDeltaNg,
      gap: diamondDeltaH - diamondDeltaU,
    },
  }
}

/** Kilojoule value with a true minus, two decimals, for a bar label. */
export function kJ(value: number): string {
  return `${signed(value, 2)} kJ mol⁻¹`
}

export const ENTHALPY_STEP_COUNT = 4
