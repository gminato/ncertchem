/**
 * Column models for the Unit 8 distillation lab (NCERT 8.8.3): the vapour pressure of a pure
 * liquid from its Antoine constants, the relative volatility of an ideal binary mixture, the
 * Fenske relation for a column with N theoretical plates at total reflux, and a batch run
 * (a Rayleigh-type integration) that gives the distillate composition against the volume
 * collected.
 *
 * The model is an idealised estimate: Raoult's law throughout, each theoretical plate taken as
 * one equilibrium stage, and the Fenske relation applied at each instant of the batch.
 */
import { fractionalDistillation, theoreticalPlates, type Antoine } from './purification'

/** Vapour pressure in mmHg of a pure liquid at a temperature in °C (Antoine equation). */
export function vapourPressureMmHg(liquid: Antoine, tC: number): number {
  return 10 ** (liquid.A - liquid.B / (liquid.C + tC))
}

/** Lowest and highest mole fraction used in the models, to keep the logarithms finite. */
const X_EPS = 1e-6

/**
 * Dew point in °C at 760 mmHg of an ideal vapour with mole fraction y of liquid A (Raoult's law):
 * 1 / P = y / P_A + (1 - y) / P_B equals 1 / 760 at the dew point. This is the temperature a
 * thermometer at the column head reads when the vapour reaching it has composition y.
 *
 * @throws {RangeError} If y is outside 0 to 1
 */
export function dewPointC(liquidA: Antoine, liquidB: Antoine, y: number): number {
  if (!(y >= 0 && y <= 1)) throw new RangeError('Mole fraction must be between 0 and 1')
  // Total pressure of the vapour at t, as a function of t: increasing, so bisect on its sign.
  const excess = (t: number) => 1 / (y / vapourPressureMmHg(liquidA, t) + (1 - y) / vapourPressureMmHg(liquidB, t)) - 760
  let lo = 0
  let hi = 300
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2
    if (excess(mid) < 0) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

/**
 * Relative volatility α = (y_A / y_B) / (x_A / x_B) of an ideal mixture at the mole fraction x_A
 * of liquid A, evaluated at the boiling point of the mixture (where α = P_A / P_B).
 *
 * @throws {RangeError} If x is not strictly between 0 and 1
 */
export function relativeVolatility(liquidA: Antoine, liquidB: Antoine, x: number): number {
  if (!(x > 0 && x < 1)) throw new RangeError('Mole fraction must be strictly between 0 and 1')
  const { vapourFractionA: yA } = fractionalDistillation(liquidA, liquidB, x)
  return (yA * (1 - x)) / (x * (1 - yA))
}

/**
 * Mole fraction of A in the vapour leaving the top of a column with N theoretical plates at total
 * reflux, when the liquid it is in equilibrium with has mole fraction x (Fenske equation):
 * (y / (1 − y)) = α^N × x / (1 − x). With N = 1 this is the single-stage Raoult result.
 *
 * @throws {RangeError} If α is not positive, N is not a positive integer, or x is not strictly between 0 and 1
 */
export function fenskeTopComposition(alpha: number, plates: number, x: number): number {
  if (!(alpha > 0)) throw new RangeError('Relative volatility must be positive')
  if (!Number.isInteger(plates) || plates < 1) throw new RangeError('Plates must be a positive integer')
  if (!(x > 0 && x < 1)) throw new RangeError('Mole fraction must be strictly between 0 and 1')
  const r = alpha ** plates * (x / (1 - x))
  return r / (1 + r)
}

/**
 * Theoretical plates of a column of the given length, with a height equivalent to a theoretical
 * plate (HETP). At least one plate: a column that is shorter than one HETP still gives one stage.
 */
export function plateCount(columnLength: number, hetp: number): number {
  return Math.max(1, Math.round(theoreticalPlates(columnLength, hetp)))
}

/** One sample of a batch distillation. */
export interface BatchPoint {
  /** Fraction of the initial charge that has distilled over, 0 to 1. */
  collected: number
  /** Mole fraction of A left in the still. */
  stillX: number
  /** Mole fraction of A in the vapour leaving the column at this instant. */
  topX: number
  /** Mole fraction of A in everything collected so far (the running distillate). */
  distillateX: number
  /** Boiling point of the still liquid at 760 mmHg, in °C: what the flask thermometer reads. */
  boilingPointC: number
  /** Dew point of the vapour leaving the column top, in °C: what the head thermometer reads. */
  headC: number
}

/**
 * Batch fractional distillation of an ideal binary mixture charged with one mole of liquid. The
 * still is stepped in small fractions of its contents. At each step the vapour leaving the column
 * is given by the Fenske relation, and the mass balance on A (Rayleigh) moves the still
 * composition. The run stops when the still holds `endRemaining` of its charge.
 *
 * @param x0 initial mole fraction of A in the charge, strictly between 0 and 1
 * @param plates theoretical plates of the column (1 for simple distillation)
 * @param endRemaining fraction of the charge left in the still at the end, 0 to 1
 * @param stepLog size of each step in ln(charge), so the step is a fixed fraction of the charge
 */
export function batchDistillation(
  liquidA: Antoine,
  liquidB: Antoine,
  x0: number,
  plates: number,
  endRemaining = 0.1,
  stepLog = 0.01,
): BatchPoint[] {
  if (!(x0 > 0 && x0 < 1)) throw new RangeError('Initial mole fraction must be strictly between 0 and 1')
  if (!(endRemaining > 0 && endRemaining < 1)) throw new RangeError('End fraction must be between 0 and 1')
  if (!(stepLog > 0)) throw new RangeError('Step must be positive')

  const shrink = Math.exp(-stepLog)
  const dropFraction = 1 - shrink
  let charge = 1
  let x = x0
  let distilled = 0
  let distilledA = 0
  const points: BatchPoint[] = []

  const instant = (xs: number) => {
    const alpha = relativeVolatility(liquidA, liquidB, xs)
    return fenskeTopComposition(alpha, plates, xs)
  }

  points.push({
    collected: 0,
    stillX: x,
    topX: instant(x),
    distillateX: instant(x),
    boilingPointC: fractionalDistillation(liquidA, liquidB, x).boilingPointC,
    headC: dewPointC(liquidA, liquidB, instant(x)),
  })

  while (charge > endRemaining + 1e-12) {
    const y = instant(x)
    const dD = charge * dropFraction
    distilled += dD
    distilledA += y * dD
    charge *= shrink
    x = Math.min(1 - X_EPS, Math.max(X_EPS, x - (y - x) * dropFraction))
    const top = instant(x)
    points.push({
      collected: 1 - charge,
      stillX: x,
      topX: top,
      distillateX: distilledA / distilled,
      boilingPointC: fractionalDistillation(liquidA, liquidB, x).boilingPointC,
      headC: dewPointC(liquidA, liquidB, top),
    })
  }
  return points
}
