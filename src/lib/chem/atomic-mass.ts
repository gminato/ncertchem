import { AMU_GRAMS } from './constants'
import { ELEMENTS } from './elements'

/** One isotope of an element: its mass in u and its natural abundance in per cent. */
export interface Isotope {
  /** Display label, e.g. "³⁵Cl". */
  label: string
  /** Isotopic mass in u (atomic mass units). */
  massU: number
  /** Natural abundance, in per cent of all atoms of the element. */
  abundancePercent: number
}

/**
 * Chlorine's two stable isotopes, as given in NCERT Class 11 Unit 1, Exercise 1.9
 * (abundances 75.77 % and 24.23 %; masses 34.9689 u and 36.9659 u).
 */
export const CHLORINE_ISOTOPES: readonly Isotope[] = [
  { label: '³⁵Cl', massU: 34.9689, abundancePercent: 75.77 },
  { label: '³⁷Cl', massU: 36.9659, abundancePercent: 24.23 },
]

const ABUNDANCE_TOLERANCE = 0.005

/**
 * Average atomic mass of an element from its isotopes: the abundance-weighted mean
 * of the isotopic masses, in u. The abundances must add up to 100 per cent.
 *
 * @throws {RangeError} If there are no isotopes, a mass is not positive, or the abundances do not sum to 100
 */
export function averageAtomicMass(isotopes: readonly Isotope[]): number {
  if (isotopes.length === 0) {
    throw new RangeError('At least one isotope is required')
  }
  let total = 0
  let abundanceSum = 0
  for (const isotope of isotopes) {
    if (!Number.isFinite(isotope.massU) || isotope.massU <= 0) {
      throw new RangeError(`Isotope mass must be positive (received ${isotope.massU})`)
    }
    if (!Number.isFinite(isotope.abundancePercent) || isotope.abundancePercent < 0) {
      throw new RangeError(`Abundance must be non-negative (received ${isotope.abundancePercent})`)
    }
    total += (isotope.abundancePercent / 100) * isotope.massU
    abundanceSum += isotope.abundancePercent
  }
  if (Math.abs(abundanceSum - 100) > ABUNDANCE_TOLERANCE) {
    throw new RangeError(`Abundances must sum to 100 per cent (received ${abundanceSum})`)
  }
  return total
}

/**
 * Where a value sits between the lightest and heaviest isotope, from 0 (lightest)
 * to 1 (heaviest). The average atomic mass always lies inside that range.
 */
export function fractionAcrossIsotopes(isotopes: readonly Isotope[], massU: number): number {
  const masses = isotopes.map((isotope) => isotope.massU)
  const lo = Math.min(...masses)
  const hi = Math.max(...masses)
  if (hi === lo) {
    throw new RangeError('Isotopes must have different masses')
  }
  return (massU - lo) / (hi - lo)
}

/** Mass of a single atom in grams, from its mass in u: m = m_u × 1.66056 × 10⁻²⁴ g. */
export function massOfAtomGrams(massU: number): number {
  if (!Number.isFinite(massU) || massU < 0) {
    throw new RangeError(`Mass must be a non-negative number (received ${massU})`)
  }
  return massU * AMU_GRAMS
}

/**
 * Sum of the NCERT atomic masses of a list of element symbols, in u. Used to build a
 * molecular or formula mass one atom at a time; the full list gives molarMass().
 *
 * @throws {RangeError} On an unknown element symbol
 */
export function sumAtomicMasses(symbols: readonly string[]): number {
  let total = 0
  for (const symbol of symbols) {
    const element = ELEMENTS[symbol]
    if (!element) {
      throw new RangeError(`Unknown element symbol "${symbol}"`)
    }
    total += element.atomicMass
  }
  return total
}
