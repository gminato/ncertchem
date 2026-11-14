/**
 * Reading a graduated instrument. The Learner records every digit they are
 * sure of (the marks they can read) plus one estimated digit between the marks.
 * This module checks a typed reading against the true position of the object
 * and counts its significant figures from the string the Learner typed.
 */
import { countSigFigs, roundToSigFigs } from './sigfigs'

/** Smallest and largest true positions the sim draws, by instrument. */
export const SAMPLE_RANGE = { min: 10, max: 90 } as const

export type ReadingState =
  /** Nothing typed yet. */
  | 'empty'
  /** Typed text is not a plain decimal number. */
  | 'invalid'
  /** Only certain digits: no estimated digit after the decimal point. */
  | 'no-estimate'
  /** More digits after the decimal point than the marks can support. */
  | 'too-fine'
  /** One estimated digit: the right form. Check the accuracy separately. */
  | 'estimated'

export interface ReadingAnalysis {
  state: ReadingState
  /** Significant figures of the typed string, when it is a valid number. */
  sigFigs: number | null
  /** Digits before the decimal point: read directly off the marks. */
  certain: string
  /** The first digit after the decimal point: the estimated digit. */
  estimated: string
  /** Any digits after the estimated digit. They cannot be read from the marks. */
  beyond: string
  /** The typed value, when valid. */
  value: number | null
  /** True when |typed − true position| is at most half a division. */
  withinHalfDivision: boolean | null
}

const PLAIN_DECIMAL = /^\d+(\.\d*)?$/

/**
 * Analyses the reading the Learner typed, for an instrument whose divisions
 * are `division` units wide.
 *
 * @param typed The text in the input, exactly as typed (trailing zeros matter)
 * @param truth The true position of the object, in the instrument's units
 * @param division Width of one graduation (1 for a mm ruler, 1 for a 1 mL cylinder)
 */
export function analyseReading(typed: string, truth: number, division: number): ReadingAnalysis {
  const text = typed.trim()
  const empty: ReadingAnalysis = {
    state: 'empty',
    sigFigs: null,
    certain: '',
    estimated: '',
    beyond: '',
    value: null,
    withinHalfDivision: null,
  }
  if (text === '') return empty

  if (!PLAIN_DECIMAL.test(text)) {
    return { ...empty, state: 'invalid' }
  }

  const [intPart, fracPart = ''] = text.split('.')
  const value = Number(text)
  const sigFigs = countSigFigs(text)
  const withinHalfDivision = Math.abs(value - truth) <= division / 2 + 1e-9

  let state: ReadingState
  if (fracPart.length === 0) state = 'no-estimate'
  else if (fracPart.length === 1) state = 'estimated'
  else state = 'too-fine'

  return {
    state,
    sigFigs,
    certain: intPart,
    estimated: fracPart.slice(0, 1),
    beyond: fracPart.slice(1),
    value,
    withinHalfDivision,
  }
}

/**
 * The reading the Learner should record: the true position rounded to one
 * estimated digit, which is the digit after the last certain digit. It is
 * written with roundToSigFigs, so 47.36 gives "47.4" and 47.96 gives "48.0".
 * The range in SAMPLE_RANGE keeps the integer part at two digits, so this
 * always has three significant figures.
 */
export function expectedReading(truth: number): string {
  const integerDigits = String(Math.floor(truth)).length
  return roundToSigFigs(truth, integerDigits + 1)
}

/**
 * A deterministic true position for sample number `index`, between `min` and
 * `max`, to two decimal places. The same index always gives the same value.
 */
export function sampleTruth(index: number, min: number, max: number): number {
  // Golden-ratio sequence: well spread, never repeats within a range, and never
  // lands on the edge of the range for the first few indices.
  const golden = 0.6180339887498949
  const fraction = ((Math.max(0, Math.floor(index)) + 1) * golden) % 1
  const value = min + fraction * (max - min)
  return Math.round(value * 100) / 100
}
