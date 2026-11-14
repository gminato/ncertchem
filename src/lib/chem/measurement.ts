/**
 * Summary statistics for repeated measurements, used to compare precision
 * (spread of the readings) and accuracy (how far the mean sits from the true value).
 */

/**
 * Arithmetic mean of a set of readings.
 *
 * @throws {RangeError} If no values are given
 */
export function mean(values: readonly number[]): number {
  if (values.length === 0) {
    throw new RangeError('At least one value is required')
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

/**
 * Spread of a set of readings: the largest minus the smallest. A small spread
 * means the readings are precise.
 *
 * @throws {RangeError} If no values are given
 */
export function spread(values: readonly number[]): number {
  if (values.length === 0) {
    throw new RangeError('At least one value is required')
  }
  return Math.max(...values) - Math.min(...values)
}
