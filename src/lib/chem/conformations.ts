/**
 * Conformations of ethane (NCERT Class 11 Unit 9, section 9.2.1): the torsional energy of the C–C bond,
 * the eclipsed and staggered names of a dihedral angle, and 2D positions for a Newman or sawhorse drawing.
 *
 * The torsional energy is the NCERT barrier of 12.5 kJ mol⁻¹ written as E(φ) = (12.5/2)(1 + cos 3φ): zero at
 * the staggered 60°, maximum at the eclipsed 0°. The Boltzmann function is a two-level illustration only (see
 * boltzmannStaggeredFraction).
 */

/** The NCERT torsional barrier of ethane, kJ mol⁻¹ (eclipsed minus staggered). */
export const ETHANE_TORSIONAL_BARRIER_KJ = 12.5

/** The gas constant in kJ mol⁻¹ K⁻¹. */
const R_KJ = 8.314e-3

/** A point on a 2D drawing. */
export interface Point2D {
  x: number
  y: number
}

/** The torsional energy of ethane at a dihedral angle, in kJ mol⁻¹: (12.5/2)(1 + cos 3φ).
 *
 * @param dihedralDeg the H–C–C–H dihedral angle in degrees
 * @throws {RangeError} If the angle is not finite
 */
export function ethaneTorsionalEnergy(dihedralDeg: number): number {
  if (!Number.isFinite(dihedralDeg)) throw new RangeError('The dihedral angle must be a finite number of degrees')
  return (ETHANE_TORSIONAL_BARRIER_KJ / 2) * (1 + Math.cos((3 * dihedralDeg * Math.PI) / 180))
}

/** Reduces an angle to [0, 120) degrees: the period of the front–back pattern in ethane. */
function modulo120(deg: number): number {
  const m = ((deg % 120) + 120) % 120
  return Math.abs(m - 120) < 1e-9 ? 0 : m
}

/**
 * The name of the conformation at a dihedral angle: 'eclipsed' at multiples of 120°, 'staggered' at 60° + 120°k,
 * and 'skew' anywhere else.
 *
 * @throws {RangeError} If the angle is not finite
 */
export function conformationName(dihedralDeg: number): 'eclipsed' | 'staggered' | 'skew' {
  if (!Number.isFinite(dihedralDeg)) throw new RangeError('The dihedral angle must be a finite number of degrees')
  const m = modulo120(dihedralDeg)
  if (Math.abs(m) < 1e-9) return 'eclipsed'
  if (Math.abs(m - 60) < 1e-9) return 'staggered'
  return 'skew'
}

/**
 * Newman projection: the three front and three back hydrogens on a unit circle, as (x, y) with the front carbon
 * at the centre. The front hydrogens are at 90°, 210° and 330°; the back at the same angles turned by φ.
 *
 * @throws {RangeError} If the angle is not finite
 */
export function newmanPositions(dihedralDeg: number): { front: Point2D[]; back: Point2D[] } {
  if (!Number.isFinite(dihedralDeg)) throw new RangeError('The dihedral angle must be a finite number of degrees')
  const at = (deg: number): Point2D => ({ x: Math.cos((deg * Math.PI) / 180), y: Math.sin((deg * Math.PI) / 180) })
  const front = [90, 210, 330].map(at)
  const back = [90, 210, 330].map((d) => at(d + dihedralDeg))
  return { front, back }
}

/**
 * Sawhorse drawing as schematic 2D positions: the front carbon at y = −0.5 and the back carbon at y = +0.5, each
 * with three substituents spread around the C–C axis. The back substituents turn by the dihedral angle. The
 * projection is schematic: x is the horizontal spread and y the position along the bond.
 *
 * @throws {RangeError} If the angle is not finite
 */
export function sawhorsePositions(dihedralDeg: number): { frontCarbon: Point2D; backCarbon: Point2D; front: Point2D[]; back: Point2D[] } {
  if (!Number.isFinite(dihedralDeg)) throw new RangeError('The dihedral angle must be a finite number of degrees')
  const frontCarbon = { x: 0, y: -0.5 }
  const backCarbon = { x: 0, y: 0.5 }
  const spread = (deg: number, y0: number): Point2D => ({
    x: 0.8 * Math.cos((deg * Math.PI) / 180),
    y: y0 + 0.25 * Math.sin((deg * Math.PI) / 180),
  })
  const front = [90, 210, 330].map((d) => spread(d, frontCarbon.y))
  const back = [90, 210, 330].map((d) => spread(d + dihedralDeg, backCarbon.y))
  return { frontCarbon, backCarbon, front, back }
}

/**
 * Illustrative Boltzmann population of the staggered region of ethane at temperature T, from a two-level model: a
 * staggered level at 0 and an eclipsed level 12.5 kJ mol⁻¹ higher, with equal degeneracy. The fraction is
 * 1 / (1 + exp(−12.5 / RT)). It ignores the skew region and the way the barrier varies with angle, so it is an
 * illustration of how a barrier of this size favours the staggered form, not a computed population.
 *
 * @throws {RangeError} If T is not a positive finite temperature in kelvin
 */
export function boltzmannStaggeredFraction(T: number): number {
  if (!Number.isFinite(T) || T <= 0) throw new RangeError('The temperature must be a positive number of kelvin')
  return 1 / (1 + Math.exp(-ETHANE_TORSIONAL_BARRIER_KJ / (R_KJ * T)))
}
