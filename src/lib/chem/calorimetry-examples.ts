/**
 * Worked examples for Section 5.3 (measurement of ΔU and ΔH). The numbers are this site's own,
 * not NCERT's Problem 5.6. Every value shown in the Section is computed here from the libraries,
 * so the Prose, the Scrolly and the tests agree.
 *
 * Bomb example: 0.40 g of butane is burnt in a bomb calorimeter whose heat capacity is 9.80 kJ K⁻¹.
 * The water bath warms by 2.20 K. (The heat capacity and the rise are chosen for the example.)
 *
 * Coffee-cup example: 50.0 cm³ of 1.00 mol dm⁻³ hydrochloric acid is mixed with 50.0 cm³ of
 * 1.00 mol dm⁻³ sodium hydroxide, and the solution (100 g in total) warms by 6.8 K.
 */

import { coffeeCupMolarDeltaH, bombCalorimeterMolarDeltaU, reactionHeatFromTemperatureRise, totalHeatCapacityKJPerK } from './calorimetry'
import { enthalpyFromInternalEnergy, deltaNg, type ReactionSpecies } from './enthalpy'
import { molarMass } from './formula'
import { massToMoles as massToMolesFormula } from './mole'
import { R_J_PER_MOL_K } from './pv-work'

export const BOMB_EXAMPLE = (() => {
  const formula = 'C4H10'
  const massG = 0.4
  const heatCapacityKJPerK = 9.8
  const deltaTK = 2.2
  const temperatureK = 298
  const molesReacted = massToMolesFormula(massG, formula)
  /** C₄H₁₀(g) + 13/2 O₂(g) → 4 CO₂(g) + 5 H₂O(l): gas moles fall from 7.5 to 4. */
  const reactants: ReactionSpecies[] = [
    { coefficient: 1, state: 'g' },
    { coefficient: 6.5, state: 'g' },
  ]
  const products: ReactionSpecies[] = [
    { coefficient: 4, state: 'g' },
    { coefficient: 5, state: 'l' },
  ]
  const dNg = deltaNg(reactants, products)
  const qCalorimeterKJ = heatCapacityKJPerK * deltaTK
  return {
    formula,
    massG,
    molarMassGPerMol: molarMass(formula),
    heatCapacityKJPerK,
    deltaTK,
    temperatureK,
    molesReacted,
    qCalorimeterKJ,
    qReactionKJ: reactionHeatFromTemperatureRise(heatCapacityKJPerK, deltaTK),
    deltaUKJPerMol: bombCalorimeterMolarDeltaU(heatCapacityKJPerK, deltaTK, molesReacted),
    deltaNg: dNg,
    deltaHKJPerMol: enthalpyFromInternalEnergy(
      bombCalorimeterMolarDeltaU(heatCapacityKJPerK, deltaTK, molesReacted),
      dNg,
      temperatureK,
    ),
    /** R used for the Δn_g RT term, J mol⁻¹ K⁻¹. */
    gasConstantJPerMolK: R_J_PER_MOL_K,
  }
})()

export const COFFEE_CUP_EXAMPLE = (() => {
  const massG = 100
  const specificHeatJPerGK = 4.18
  const deltaTK = 6.8
  const molesWater = 0.05
  const heatCapacityKJPerK = totalHeatCapacityKJPerK(0, massG, specificHeatJPerGK)
  return {
    massG,
    specificHeatJPerGK,
    deltaTK,
    molesWater,
    heatCapacityKJPerK,
    qReactionKJ: reactionHeatFromTemperatureRise(heatCapacityKJPerK, deltaTK),
    deltaHKJPerMol: coffeeCupMolarDeltaH(heatCapacityKJPerK, deltaTK, molesWater),
  }
})()

/** Signed number with a true minus sign (U+2212), to the given number of decimal places. */
export function signedText(value: number, decimals: number): string {
  const fixed = Math.abs(value).toFixed(decimals)
  return value < 0 ? `−${fixed}` : `+${fixed}`
}
