/**
 * Step targets for the buffer Scrolly (Section 6.12). The same strong acid or base goes into 100 mL of
 * water and into 100 mL of a buffer made from 10 mmol of acetic acid and 10 mmol of sodium acetate. Every
 * pH is computed with the acid-base library; the particle counts are the same moles in units of 0.5 mmol.
 */

import {
  bufferAfterAddition,
  pKa,
  strongAcidPH,
  strongBasePH,
  type BufferState,
} from '@/lib/chem/acid-base'
import { NCERT_TABLE_6_6_KA } from '@/lib/chem/ncert-unit6-tables'
import { particleLayout, type Box, type Point } from '@/components/equilibrium/geometry'

/** Ka of acetic acid from NCERT Table 6.6 (1.74 × 10⁻⁵ at 298 K). */
export function tableKa(formula: string): number {
  const row = NCERT_TABLE_6_6_KA.rows.find((r) => r.formula === formula)
  if (!row) throw new RangeError(`No Ka for ${formula} in Table 6.6`)
  return row.ka
}

export const ACETIC_KA = tableKa('CH3COOH')
export const VOLUME_ML = 100
/** Acetic acid and sodium acetate, each, in mmol in the 100 mL buffer. */
export const PAIR_MMOL = 10
/** One particle stands for this many mmol. */
export const UNIT_MMOL = 0.5
/** Most particles drawn for each species; the counts in the steps stay below this. */
export const SLOTS = 40

/** The buffer before any addition. */
export const BUFFER: BufferState = {
  pKa: pKa(ACETIC_KA),
  acidMoles: PAIR_MMOL / 1000,
  saltMoles: PAIR_MMOL / 1000,
  volumeL: VOLUME_ML / 1000,
}

/** Signed amounts in mmol: positive is strong acid (HCl), negative is strong base (NaOH). */
export const BUFFER_STEP_ADDITIONS = [0.5, 2, 9, -2] as const

export interface BufferStepState {
  /** Signed mmol added: + strong acid, − strong base. */
  added: number
  pHWater: number
  pHBuffer: number
  /** Acetic acid, HA, in mmol after the addition. */
  acidMmol: number
  /** Acetate, A⁻, in mmol after the addition. */
  saltMmol: number
  /** Particles of incoming H₃O⁺ or OH⁻ drawn for this addition. */
  incomingUnits: number
}

/**
 * The state after adding `added` mmol of strong acid (positive) or base (negative) to 100 mL of water
 * and to the buffer. Water uses the strong acid or base pH with the water term; the buffer uses
 * bufferAfterAddition, which converts A⁻ to HA for acid and HA to A⁻ for base.
 */
export function bufferStepState(added: number): BufferStepState {
  const moles = Math.abs(added) / 1000
  const concentration = Math.abs(added) / VOLUME_ML
  const pHWater =
    added === 0 ? strongAcidPH(1e-7) : added > 0 ? strongAcidPH(concentration) : strongBasePH(concentration)
  const pHBuffer =
    added === 0
      ? BUFFER.pKa + Math.log10(BUFFER.saltMoles / BUFFER.acidMoles)
      : bufferAfterAddition(BUFFER, { kind: added > 0 ? 'acid' : 'base', moles })
  return {
    added,
    pHWater,
    pHBuffer,
    acidMmol: PAIR_MMOL + added,
    saltMmol: PAIR_MMOL - added,
    incomingUnits: Math.round(Math.abs(added) / UNIT_MMOL),
  }
}

export const BUFFER_STEP_STATES: readonly BufferStepState[] = BUFFER_STEP_ADDITIONS.map(bufferStepState)

/** The state for a Scrolly Step index, clamped to the Steps that exist. */
export function stateAt(step: number): BufferStepState {
  const i = Math.min(BUFFER_STEP_STATES.length - 1, Math.max(0, step))
  return BUFFER_STEP_STATES[i]
}

/** The particle box in SVG units, below the meters. */
export const PARTICLE_BOX: Box = { x0: 26, y0: 354, x1: 554, y1: 458 }

/**
 * Fixed positions for the particles, SLOTS for A⁻ then SLOTS for HA. A slot is drawn only while its count
 * is above its index, so a particle that changes species keeps its place.
 */
export const PARTICLE_POINTS: readonly Point[] = particleLayout(SLOTS * 2, PARTICLE_BOX, 11, 18)
