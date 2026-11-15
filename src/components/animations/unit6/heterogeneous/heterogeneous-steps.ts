/**
 * Step data for the heterogeneous Scrolly (Section 6.5): two sealed vessels of CaCO3 at 1100 K,
 * one with a little solid and one with a lot, then a check that the solid has not run out, then the
 * same rule for three other heterogeneous equilibria. Every number comes from src/lib/chem.
 */

import {
  CACO3_KP_1100K,
  caco3VesselState,
  gasMolesAtPressure,
  type CaCO3VesselState,
} from '@/lib/chem/heterogeneous'
import { R_BAR_L_PER_MOL_K } from '@/lib/chem/equilibrium'

/** Temperature of both vessels, K. */
export const HET_T = 1100
/** Volume of each vessel, L. */
export const HET_V = 10.0
/** Solid put into vessel A (little) and vessel B (lots), mol. */
export const LITTLE_SOLID_MOL = 0.5
export const LOTS_SOLID_MOL = 2.0
/** The scarce case: too little solid to reach Kp, mol. */
export const SCARCE_SOLID_MOL = 0.1
/** Pressure shown at the midpoint of the approach, bar. */
export const PARTWAY_BAR = 1.0

export interface VesselView {
  label: string
  solidStart: number
  co2Moles: number
  solidRemaining: number
  pressureBar: number
  solidPresent: boolean
}

export type HetStep =
  | { kind: 'vessels'; title: string; a: VesselView; b: VesselView }
  | { kind: 'cards'; title: string }

function fromState(label: string, state: CaCO3VesselState): VesselView {
  return {
    label,
    solidStart: state.solidMoles,
    co2Moles: state.co2Moles,
    solidRemaining: state.solidRemaining,
    pressureBar: state.pressureBar,
    solidPresent: state.solidPresent,
  }
}

/** A vessel before any decomposition: all the solid is there, no CO2, no pressure. */
function atStart(label: string, solidMoles: number): VesselView {
  return { label, solidStart: solidMoles, co2Moles: 0, solidRemaining: solidMoles, pressureBar: 0, solidPresent: true }
}

/** A vessel part way to equilibrium, at a chosen pressure: CO2 from pV = nRT, the rest is solid. */
function partway(label: string, solidMoles: number, pressureBar: number): VesselView {
  const co2 = Math.min(solidMoles, gasMolesAtPressure(pressureBar, HET_V, HET_T))
  return {
    label,
    solidStart: solidMoles,
    co2Moles: co2,
    solidRemaining: solidMoles - co2,
    pressureBar: (co2 * R_BAR_L_PER_MOL_K * HET_T) / HET_V,
    solidPresent: solidMoles - co2 > 1e-12,
  }
}

export function hetSteps(): HetStep[] {
  return [
    { kind: 'vessels', title: 'Two vessels, one solid', a: atStart('A', LITTLE_SOLID_MOL), b: atStart('B', LOTS_SOLID_MOL) },
    { kind: 'vessels', title: 'Decomposition under way', a: partway('A', LITTLE_SOLID_MOL, PARTWAY_BAR), b: partway('B', LOTS_SOLID_MOL, PARTWAY_BAR) },
    {
      kind: 'vessels',
      title: 'Equilibrium: the same pressure',
      a: fromState('A', caco3VesselState(LITTLE_SOLID_MOL, HET_V, HET_T)),
      b: fromState('B', caco3VesselState(LOTS_SOLID_MOL, HET_V, HET_T)),
    },
    {
      kind: 'vessels',
      title: 'Too little solid: the pressure falls',
      a: fromState('A', caco3VesselState(SCARCE_SOLID_MOL, HET_V, HET_T)),
      b: fromState('B', caco3VesselState(LOTS_SOLID_MOL, HET_V, HET_T)),
    },
    { kind: 'cards', title: 'The same rule for other heterogeneous equilibria' },
  ]
}

/** K' for CaCO3: [CO2] = Kp/(RT), in mol L⁻¹, at HET_T. */
export const CO2_CONCENTRATION_AT_EQUILIBRIUM = CACO3_KP_1100K / (R_BAR_L_PER_MOL_K * HET_T)

/** Gauge scale, bar: the dial reads from zero to this pressure. */
export const DIAL_MAX_BAR = 3.0

/** Solid particles drawn per mole, so a vessel with more solid shows more solid. */
export const PARTICLES_PER_MOL = 10
/** Gas particles drawn per mole of CO2. */
export const GAS_PARTICLES_PER_MOL = 40
