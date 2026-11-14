import { celsiusToFahrenheit, celsiusToKelvin } from '@/lib/chem/units'

/**
 * ThermometerTrio: one physical temperature shown on three scales. Each Step
 * is a temperature in °C. The liquid column is set by °C alone, so the three
 * thermometers rise together and only their numbers differ.
 */

/** Lowest and highest temperature drawn, in °C. */
export const SCALE_MIN_C = -40
export const SCALE_MAX_C = 110

export interface ThermometerStep {
  /** Short name shown above the thermometers. */
  name: string
  /** Temperature in °C. */
  celsius: number
}

export const THERMOMETER_STEPS: readonly ThermometerStep[] = [
  { name: 'Ice point of water', celsius: 0 },
  { name: 'Body temperature', celsius: 37 },
  { name: 'Boiling point of water', celsius: 100 },
  { name: 'Where the scales agree', celsius: -40 },
]

export const THERMOMETER_STEP_COUNT = THERMOMETER_STEPS.length

export function clampStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(THERMOMETER_STEP_COUNT - 1, Math.max(0, Math.round(step)))
}

/** The tweened snapshot for a Step: the temperature in °C. */
export function snapshotForStep(step: number): { celsius: number } {
  return { celsius: THERMOMETER_STEPS[clampStep(step)].celsius }
}

/**
 * Fraction of the column filled at a temperature in °C, from 0 at the bottom of
 * the scale to 1 at the top. Linear in °C, so it is the same on every scale.
 */
export function levelForCelsius(celsius: number): number {
  return (celsius - SCALE_MIN_C) / (SCALE_MAX_C - SCALE_MIN_C)
}

/** Degree marks every 20 °C across the scale, as column fractions. */
export const TICK_LEVELS: readonly number[] = Array.from(
  { length: (SCALE_MAX_C - SCALE_MIN_C) / 20 + 1 },
  (_, i) => levelForCelsius(SCALE_MIN_C + i * 20)
)

/** The same temperature on the three scales, formatted for display. */
export function readoutsFor(celsius: number): { c: string; k: string; f: string } {
  return {
    c: `${signed(celsius, 0)} °C`,
    k: `${signed(celsiusToKelvin(celsius), 2)} K`,
    f: `${signed(celsiusToFahrenheit(celsius), 1)} °F`,
  }
}

/** Fixed decimals, with a true minus sign (U+2212). */
export function signed(value: number, decimals: number): string {
  return value.toFixed(decimals).replace('-', '−')
}
