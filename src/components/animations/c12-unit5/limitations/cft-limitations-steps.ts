import { NCERT_S7_FACTS } from '@/lib/chem/ncert-c12-unit5-s7-tables'

/** Number of Steps in the cft-limitations Scrolly (matches MDX). */
export const CFT_LIMITATIONS_STEP_COUNT = 4

/** Clamp a Scrolly step index into 0..CFT_LIMITATIONS_STEP_COUNT-1. NaN maps to 0. */
export function clampCftLimitationsStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(CFT_LIMITATIONS_STEP_COUNT - 1, Math.max(0, Math.trunc(step)))
}

export type CftLimitationsKind = 'prediction' | 'measurement' | 'covalency' | 'way-forward'

export interface CftLimitationsStepState {
  readonly step: number
  readonly kind: CftLimitationsKind
  readonly betterTheories: readonly string[]
  readonly limitations: readonly string[]
  readonly ariaLabel: string
}

export function cftLimitationsStepState(step: number): CftLimitationsStepState {
  const s = clampCftLimitationsStep(step)
  const betterTheories = NCERT_S7_FACTS.betterTheories
  const limitations = NCERT_S7_FACTS.limitations

  switch (s) {
    case 0:
      return {
        step: 0,
        kind: 'prediction',
        betterTheories,
        limitations,
        ariaLabel: 'Point-charge model predicts anionic Cl- should give a larger crystal field splitting than neutral H2O.',
      }
    case 1:
      return {
        step: 1,
        kind: 'measurement',
        betterTheories,
        limitations,
        ariaLabel: 'Observed spectrochemical splitting reverses the point-charge prediction: H2O splits more than Cl-.',
      }
    case 2:
      return {
        step: 2,
        kind: 'covalency',
        betterTheories,
        limitations,
        ariaLabel: 'Metal d orbital and ligand donor orbital overlapping in a shared covalent electron cloud, which crystal field theory omits.',
      }
    default:
      return {
        step: 3,
        kind: 'way-forward',
        betterTheories,
        limitations,
        ariaLabel: 'Ligand field theory and molecular orbital theory include orbital overlap and resolve both limitations of crystal field theory.',
      }
  }
}
