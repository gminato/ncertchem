import { batchDistillation } from '@/lib/chem/distillation-column'
import {
  BENZENE_ANTOINE,
  TOLUENE_ANTOINE,
  WATER_ANTOINE_HIGH,
  fractionalDistillation,
  steamDistillation,
} from '@/lib/chem/purification'

/** Which apparatus the Scrolly draws. */
export type PurificationStage = 'sublimation' | 'cooling' | 'filtration' | 'fractional' | 'steam' | 'funnel'

/** The target state of one Step: the apparatus, how far it has run, and the temperature shown. */
export interface PurificationTarget {
  stage: PurificationStage
  /** 0 to 1: how far the apparatus has run (sublimate, crystals, filtrate, distillate, layers). */
  progress: number
  /** Thermometer temperature in °C (the head thermometer in the fractional Step). */
  temperatureC: number
  /** Caption under the apparatus. */
  caption: string
}

/** Mixture for the fractional and steam Steps: benzene and toluene, an ideal pair. */
const MIXTURE_X = 0.5
/** Plates of the column in the fractional Step. */
const COLUMN_PLATES = 12

/**
 * Deterministic target states for the six Steps of the purification Scrolly. The temperatures come
 * from the libs, never typed in: the fractional Step shows the head temperature while benzene is
 * distilling (the dew point of the column-top vapour, about the benzene boiling point), and the
 * steam Step shows the steam boiling point.
 */
export function purificationTargets(): PurificationTarget[] {
  // The head thermometer reads the vapour leaving the column top, while benzene is still coming over.
  const batch = batchDistillation(BENZENE_ANTOINE, TOLUENE_ANTOINE, MIXTURE_X, COLUMN_PLATES)
  const headWhileBenzeneDistils = batch.find((p) => p.collected >= 0.2)!.headC
  const steamBoilingC = steamDistillation(WATER_ANTOINE_HIGH, TOLUENE_ANTOINE, 760).boilingPointK - 273.15
  return [
    { stage: 'sublimation', progress: 0.6, temperatureC: 0, caption: 'Sublimation: the solid goes straight to vapour' },
    { stage: 'cooling', progress: 0.9, temperatureC: 25, caption: 'Crystallisation: cool the saturated solution' },
    { stage: 'filtration', progress: 0.8, temperatureC: 25, caption: 'Filtration: the crystals stay on the paper' },
    { stage: 'fractional', progress: 0.45, temperatureC: headWhileBenzeneDistils, caption: 'Fractional distillation: the head thermometer holds' },
    { stage: 'steam', progress: 0.5, temperatureC: steamBoilingC, caption: 'Steam distillation: boils below 100 °C' },
    { stage: 'funnel', progress: 1, temperatureC: 25, caption: 'Separating funnel: the solute moves to the ether' },
  ]
}

/** Index of the Step, clamped to the range of the targets and rounded. */
export function clampStep(step: number, count: number): number {
  return Math.min(count - 1, Math.max(0, Math.round(step)))
}
