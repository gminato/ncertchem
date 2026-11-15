/**
 * Step definitions and deterministic targets for the RedoxDaniell Scrolly animation.
 *
 * All potentials and EMF values are computed from lib functions
 * (electrode-potentials.ts and ncert-unit7-tables.ts), never hard-coded.
 */

import { lookupPotential, cellEmf } from '@/lib/chem/electrode-potentials'

export interface DaniellStepTarget {
  /** Zero-based step index. */
  step: number
  /** Short step title. */
  title: string
  /** Visual stage mode. */
  mode: 'single-beaker' | 'separated' | 'wire-only' | 'bridge-inserted' | 'active-flow' | 'full-potential'
  /** Whether the external circuit switch is closed. */
  switchOn: boolean
  /** Whether the salt bridge is present and inserted. */
  hasBridge: boolean
  /** Whether the overhead metallic wire connects the electrodes. */
  hasWire: boolean
  /** Voltmeter display text, e.g. "0.00 V" or "1.10 V". */
  voltage: string
  /** Zinc electrode mass factor (1 = pristine, 0 = consumed). */
  zincMass: number
  /** Copper electrode mass factor (0 = pristine, 1 = heavily plated). */
  copperMass: number
  /** Copper solution tint factor (1 = deep blue 1 M CuSO4, 0 = faded). */
  solutionTint: number
  /** Animation progress parameter for ion and electron transport. */
  progress: number
  /** Standard cell potential E°cell in Volts computed from the library. */
  e0Cell: number
  /** Standard reduction potential of the cathode (Cu2+/Cu) in Volts. */
  e0Cathode: number
  /** Standard reduction potential of the anode (Zn2+/Zn) in Volts. */
  e0Anode: number
  /** Explanatory caption for the visual. */
  caption: string
  /** Formula / working string for the potential readout. */
  working?: string
}

export const DANIELL_STEP_COUNT = 6

/**
 * Computes deterministic target state for each step of the redox-daniell scrolly.
 *
 * Progression:
 * 0: Direct reaction in one beaker (heat released, no external wire, no current)
 * 1: Separate the halves into two beakers (redox couples Zn2+/Zn and Cu2+/Cu)
 * 2: Connect the external wire (switch closed, no bridge; charge buildup stops flow: 0.00 V)
 * 3: Add the salt bridge (agar-agar + KCl inserted; circuit completed)
 * 4: Spontaneous flow begins (electrons stream Zn -> Cu, current Cu -> Zn, ions migrate)
 * 5: Full standard potential (E°cell = E°cathode - E°anode = 1.10 V; Zn dissolves, Cu plates)
 */
export function daniellStep(index: number): DaniellStepTarget {
  const i = Math.min(DANIELL_STEP_COUNT - 1, Math.max(0, Math.round(index)))

  const e0Cathode = lookupPotential('Cu2+/Cu')
  const e0Anode = lookupPotential('Zn2+/Zn')
  const e0Cell = cellEmf('Cu2+/Cu', 'Zn2+/Zn')

  const steps: DaniellStepTarget[] = [
    {
      step: 0,
      title: 'Direct Electron Transfer',
      mode: 'single-beaker',
      switchOn: false,
      hasBridge: false,
      hasWire: false,
      voltage: '0.00 V',
      zincMass: 0.95,
      copperMass: 0.35,
      solutionTint: 0.8,
      progress: 0,
      e0Cell,
      e0Cathode,
      e0Anode,
      caption:
        'Zinc placed directly into copper sulphate solution: electrons transfer at the metal surface and heat is released directly into the liquid.',
      working: 'q < 0 (heat dissipated into solution; no external work)',
    },
    {
      step: 1,
      title: 'Separate the Half-Cells',
      mode: 'separated',
      switchOn: false,
      hasBridge: false,
      hasWire: false,
      voltage: '0.00 V',
      zincMass: 1.0,
      copperMass: 0.0,
      solutionTint: 1.0,
      progress: 0,
      e0Cell,
      e0Cathode,
      e0Anode,
      caption:
        'Separating the two beakers isolates the Zn²⁺/Zn and Cu²⁺/Cu redox couples. Without a connection, neither reaction can occur.',
      working: 'Isolated half-cells: Zn²⁺/Zn and Cu²⁺/Cu couples',
    },
    {
      step: 2,
      title: 'Wire Connected — No Bridge',
      mode: 'wire-only',
      switchOn: true,
      hasBridge: false,
      hasWire: true,
      voltage: '0.00 V',
      zincMass: 1.0,
      copperMass: 0.0,
      solutionTint: 1.0,
      progress: 0,
      e0Cell,
      e0Cathode,
      e0Anode,
      caption:
        'Connecting the wire without a salt bridge produces no current: immediate charge buildup in both solutions halts electron flow.',
      working: 'Open circuit: charge imbalance halts electron flow',
    },
    {
      step: 3,
      title: 'Insert the Salt Bridge',
      mode: 'bridge-inserted',
      switchOn: false,
      hasBridge: true,
      hasWire: true,
      voltage: '0.00 V',
      zincMass: 1.0,
      copperMass: 0.0,
      solutionTint: 1.0,
      progress: 0,
      e0Cell,
      e0Cathode,
      e0Anode,
      caption:
        'An inverted U-tube containing KCl in agar gel completes the internal electrical path without allowing bulk liquids to mix.',
      working: 'Salt bridge inserted: circuit ready to close',
    },
    {
      step: 4,
      title: 'Spontaneous Current and Ion Flow',
      mode: 'active-flow',
      switchOn: true,
      hasBridge: true,
      hasWire: true,
      voltage: `${e0Cell.toFixed(2)} V`,
      zincMass: 0.7,
      copperMass: 0.45,
      solutionTint: 0.7,
      progress: 0.5,
      e0Cell,
      e0Cathode,
      e0Anode,
      caption:
        'Switch closed: electrons flow through the wire from Zn to Cu, while Cl⁻ and K⁺ migrate through the bridge to keep solutions neutral.',
      working: 'e⁻ flow: Zn anode (−) → Cu cathode (+); current flows Cu → Zn',
    },
    {
      step: 5,
      title: 'Standard Cell Potential 1.10 V',
      mode: 'full-potential',
      switchOn: true,
      hasBridge: true,
      hasWire: true,
      voltage: `${e0Cell.toFixed(2)} V`,
      zincMass: 0.4,
      copperMass: 0.8,
      solutionTint: 0.4,
      progress: 0.85,
      e0Cell,
      e0Cathode,
      e0Anode,
      caption:
        `Under standard conditions (1 M, 298 K), E°cell = E°(cathode) − E°(anode) = +${e0Cathode.toFixed(2)} V − (−${Math.abs(e0Anode).toFixed(2)} V) = ${e0Cell.toFixed(2)} V.`,
      working: `E°cell = E°(Cu²⁺/Cu) − E°(Zn²⁺/Zn) = +${e0Cathode.toFixed(2)} V − (−${Math.abs(e0Anode).toFixed(2)} V) = +${e0Cell.toFixed(2)} V`,
    },
  ]

  return steps[i]
}
