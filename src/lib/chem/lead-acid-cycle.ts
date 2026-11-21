import { sumAtomicMasses } from './atomic-mass'
import { chargeFromCurrent, massDeposited, molesOfElectrons } from './electrolysis'

/** Molar mass of lead, g mol⁻¹, from the atomic masses. */
export const PB_MOLAR_MASS = sumAtomicMasses(['Pb'])

/** Molar mass of lead(II) sulphate, PbSO₄, g mol⁻¹. */
export const PBSO4_MOLAR_MASS = sumAtomicMasses(['Pb', 'S', 'O', 'O', 'O', 'O'])

/** Electrons per lead in Pb + SO₄²⁻ → PbSO₄ + 2e⁻ (and its reverse). */
export const LEAD_ELECTRONS = 2

export interface LeadCycleReadout {
  /** Charge passed, C (Q = It). */
  charge: number
  /** Moles of electrons passed (Q / F). */
  electronMoles: number
  /** Moles of lead converted to or from PbSO₄ on the Pb plate. */
  leadMoles: number
  /** Mass of lead converted, g. */
  leadMassG: number
  /** Mass of PbSO₄ formed or removed across both plates, g. */
  pbSO4MassG: number
  /** Moles of H₂SO₄ used up (discharge) or made back (charge). */
  h2SO4Moles: number
}

/**
 * Lead storage cell at a constant current for a given time. The overall cell
 * reaction is Pb + PbO₂ + 2H₂SO₄ → 2PbSO₄ + 2H₂O, so each mole of lead
 * converted uses two moles of H₂SO₄ and forms two moles of PbSO₄ overall.
 */
export function leadCycleAtTime(currentA: number, hours: number): LeadCycleReadout {
  const charge = chargeFromCurrent(currentA, hours * 3600)
  const electronMoles = molesOfElectrons(charge)
  const leadMoles = electronMoles / LEAD_ELECTRONS
  return {
    charge,
    electronMoles,
    leadMoles,
    leadMassG: massDeposited({ charge, molarMass: PB_MOLAR_MASS, electrons: LEAD_ELECTRONS }),
    pbSO4MassG: 2 * leadMoles * PBSO4_MOLAR_MASS,
    h2SO4Moles: 2 * leadMoles,
  }
}
