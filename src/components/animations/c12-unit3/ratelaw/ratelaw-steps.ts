import { formatSig, mulberry32, rateConstantFromRun } from '@/lib/chem/kinetics'
import { NCERT_NO_O2_INITIAL_RATES, type NoO2InitialRateRow } from '@/lib/chem/ncert-c12-unit3-tables'

/**
 * Deterministic target state for each Scrolly step of Section 3.2 (Factors and the Rate Law).
 * The component tweens the concentrations and the rate from their current values to these targets.
 * Every number comes from the kinetics lib or from the Table 3.2 data rows.
 */

export const RATE_LAW_STEP_COUNT = 5

/** Drawing scale only: particles drawn per mol L⁻¹ of reactant (schematic, not a count of molecules). */
export const PARTICLES_PER_MOL_L = 20

/** Largest slot count per species in the box: 24 slots, 12 per species. */
export const SLOTS_PER_SPECIES = 12

export interface Point {
  readonly x: number
  readonly y: number
}

export type RateLawSceneKind = 'vessel' | 'exponents'

export interface RateLawStepState {
  readonly index: number
  readonly experiment: number
  readonly noMolPerL: number
  readonly o2MolPerL: number
  /** Initial rate of NO₂ formation from Table 3.2, mol L⁻¹ s⁻¹. */
  readonly rate: number
  /** Ratio to experiment 1 shown as a tag, e.g. "×4"; null where no comparison is made. */
  readonly ratioTag: string | null
  readonly showLaw: boolean
  readonly scene: RateLawSceneKind
  readonly headline: string
  readonly ariaLabel: string
}

export function experimentRow(experiment: number): NoO2InitialRateRow {
  const row = NCERT_NO_O2_INITIAL_RATES.find((r) => r.experiment === experiment)
  if (!row) throw new Error(`No Table 3.2 row for experiment ${experiment}`)
  return row
}

const BASE = experimentRow(1)

/** k for Rate = k[NO]²[O₂], from experiment 1 (the rate of NO₂ formation, Table 3.2 convention). */
export const K_NO_O2 = rateConstantFromRun(BASE.initialRate, { NO: BASE.noMolPerL, O2: BASE.o2MolPerL }, { NO: 2, O2: 1 })

/** k as shown to students, 3 significant figures: "3.56". */
export const K_LABEL = formatSig(K_NO_O2, 3)

/** Rate ratio against experiment 1, e.g. experiment 2 gives "×4". */
export function rateRatioTag(experiment: number): string {
  const ratio = experimentRow(experiment).initialRate / BASE.initialRate
  return `×${formatSig(ratio, 1)}`
}

/** Schematic particle count for a concentration in mol L⁻¹. */
export function particleCount(conc: number): number {
  return Math.round(conc * PARTICLES_PER_MOL_L)
}

/** Experiment shown at each Step: 1 baseline, 2 NO doubled, 3 O₂ doubled, 4 both doubled, 5 the exponents. */
const EXPERIMENT_FOR_STEP: Readonly<Record<number, number>> = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 4 }

/** Scrolly passes a 0-based step (0 for the first Step); the returned index is 1-based. */
function clampStep(step: number): number {
  return Math.min(RATE_LAW_STEP_COUNT - 1, Math.max(0, Math.round(step))) + 1
}

function fmt(conc: number): string {
  return conc.toFixed(2)
}

/** `step` is the 0-based Scrolly index. */
export function getRateLawStepState(step: number): RateLawStepState {
  const index = clampStep(step)
  const experiment = EXPERIMENT_FOR_STEP[index]
  const row = experimentRow(experiment)
  const no = fmt(row.noMolPerL)
  const o2 = fmt(row.o2MolPerL)

  const headline = (() => {
    switch (index) {
      case 1:
        return `Experiment 1: [NO] = ${no}, [O₂] = ${o2} mol L⁻¹`
      case 2:
        return `Experiment 2: [NO] doubled to ${no} mol L⁻¹`
      case 3:
        return `Experiment 3: [O₂] doubled to ${o2} mol L⁻¹`
      case 4:
        return `Experiment 4: both doubled to ${no} mol L⁻¹`
      default:
        return 'Balanced equation and rate law'
    }
  })()

  const ariaLabel = (() => {
    switch (index) {
      case 1:
        return `Sealed box with NO and O₂ at ${no} and ${o2} mol per litre. Initial rate of NO₂ formation ${row.initialRate.toFixed(3)} mol per litre per second.`
      case 2:
        return `Box with NO doubled to ${no} mol per litre. Rate rises to ${row.initialRate.toFixed(3)}, four times experiment 1.`
      case 3:
        return `Box with O₂ doubled to ${o2} mol per litre. Rate rises to ${row.initialRate.toFixed(3)}, twice experiment 1.`
      case 4:
        return `Box with both doubled. Rate ${row.initialRate.toFixed(3)}, eight times experiment 1, with the rate law Rate = k[NO]² [O₂] and k = ${K_LABEL}.`
      default:
        return `Two cards: the balanced equation has coefficients 2 for NO and 1 for O₂; the rate law has exponents 2 and 1.`
    }
  })()

  return {
    index,
    experiment,
    noMolPerL: row.noMolPerL,
    o2MolPerL: row.o2MolPerL,
    rate: row.initialRate,
    ratioTag: index === 1 || index === 5 ? null : rateRatioTag(experiment),
    showLaw: index === 4,
    scene: index === 5 ? 'exponents' : 'vessel',
    headline,
    ariaLabel,
  }
}

/** The 24 particle slots (box coordinates, 330 × 290 box), a 6 × 4 grid with a seeded jitter. */
export const PARTICLE_SLOTS: readonly Point[] = (() => {
  const rng = mulberry32(3212)
  const out: Point[] = []
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 6; col++) {
      out.push({ x: 40 + col * 52 + (rng() * 2 - 1) * 5, y: 52 + row * 64 + (rng() * 2 - 1) * 5 })
    }
  }
  return out
})()

/** A seeded shuffle of the slot indices. NO takes the first slots of this order; O₂ starts at slot 12. */
export const SLOT_ORDER: readonly number[] = (() => {
  const rng = mulberry32(977)
  const idx = Array.from({ length: PARTICLE_SLOTS.length }, (_, i) => i)
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  return idx
})()

/** Slot indices for each species, so the particles never overlap and existing particles never move. */
export function placeParticles(nNO: number, nO2: number): { no: number[]; o2: number[] } {
  if (nNO > SLOTS_PER_SPECIES || nO2 > SLOTS_PER_SPECIES) {
    throw new Error(`At most ${SLOTS_PER_SPECIES} particles per species fit in the box`)
  }
  return {
    no: SLOT_ORDER.slice(0, nNO),
    o2: SLOT_ORDER.slice(SLOTS_PER_SPECIES, SLOTS_PER_SPECIES + nO2),
  }
}
