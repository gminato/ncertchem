/**
 * Hydrogen-like wavefunctions in atomic units (a₀ = 1), for n = 1 to 4 and all l, m.
 * They power the 3D orbital explorer. Radial distances are in units of a₀ (52.9 pm),
 * and orbitals use real combinations (px, py, pz, dxy, ...) rather than complex ones.
 *
 * Conventions:
 * - mReal ranges from −l to +l. Zero gives the axial orbital (pz, dz², ...).
 *   Positive values give cos(mφ) lobes and negative values give sin(|m|φ) lobes.
 * - For l = 1: +1 = px, −1 = py, 0 = pz. For l = 2: +2 = dx²−y², −2 = dxy, +1 = dxz, −1 = dyz.
 * - Spherical harmonics use the Condon-Shortley-free convention, so p_z is positive
 *   along +z and p_x is positive along +x.
 */

const MAX_N = 4

function requireN(n: number): void {
  if (!Number.isInteger(n) || n < 1 || n > MAX_N) {
    throw new RangeError(`Principal quantum number n must be an integer from 1 to ${MAX_N} (received ${n})`)
  }
}

function requireNL(n: number, l: number): void {
  requireN(n)
  if (!Number.isInteger(l) || l < 0 || l > n - 1) {
    throw new RangeError(`Azimuthal quantum number l must be an integer from 0 to ${n - 1} (received ${l})`)
  }
}

function requireM(l: number, m: number): void {
  if (!Number.isInteger(m) || m < -l || m > l) {
    throw new RangeError(`Real magnetic index must be an integer from ${-l} to ${l} (received ${m})`)
  }
}

function factorial(k: number): number {
  let f = 1
  for (let i = 2; i <= k; i++) f *= i
  return f
}

function binomial(a: number, b: number): number {
  if (b < 0 || b > a) return 0
  return factorial(a) / (factorial(b) * factorial(a - b))
}

/** Generalised Laguerre polynomial L_p^(a)(x). */
function laguerre(p: number, a: number, x: number): number {
  let sum = 0
  for (let k = 0; k <= p; k++) {
    sum += ((k % 2 === 0 ? 1 : -1) * binomial(p + a, p - k) * x ** k) / factorial(k)
  }
  return sum
}

/**
 * Normalised radial wavefunction R_nl(r) for hydrogen in atomic units, so that
 * ∫₀^∞ r² R_nl(r)² dr = 1.
 *
 * @param n Principal quantum number, 1 to 4
 * @param l Azimuthal quantum number, 0 to n − 1
 * @param r Distance from the nucleus in units of a₀ (≥ 0)
 * @throws {RangeError} If n or l is out of range, or r is negative or not finite
 */
export function radialR(n: number, l: number, r: number): number {
  requireNL(n, l)
  if (!Number.isFinite(r) || r < 0) {
    throw new RangeError(`Radius r must be a non-negative finite number (received ${r})`)
  }
  const rho = (2 * r) / n
  const norm = Math.sqrt(
    (2 / n) ** 3 * (factorial(n - l - 1) / (2 * n * factorial(n + l)))
  )
  return norm * Math.exp(-r / n) * rho ** l * laguerre(n - l - 1, 2 * l + 1, rho)
}

/**
 * Radial probability density r² R_nl(r)², which is the probability per unit radius
 * of finding the electron at distance r.
 *
 * @throws {RangeError} If n, l or r is invalid (see {@link radialR})
 */
export function radialProbability(n: number, l: number, r: number): number {
  const R = radialR(n, l, r)
  return r * r * R * R
}

/** Coefficients (lowest power first) of the Legendre polynomial P_l(x). */
function legendreCoefficients(l: number): number[] {
  let prev = [1] // P_0
  if (l === 0) return prev
  let curr = [0, 1] // P_1
  for (let k = 1; k < l; k++) {
    const next = new Array<number>(k + 2).fill(0)
    for (let i = 0; i < curr.length; i++) {
      next[i + 1] += ((2 * k + 1) * curr[i]) / (k + 1)
    }
    for (let i = 0; i < prev.length; i++) {
      next[i] -= (k * prev[i]) / (k + 1)
    }
    prev = curr
    curr = next
  }
  return curr
}

/** Differentiates a polynomial (coefficients lowest power first) once. */
function derivative(coeffs: number[]): number[] {
  if (coeffs.length <= 1) return [0]
  return coeffs.slice(1).map((c, i) => c * (i + 1))
}

function evaluate(coeffs: number[], x: number): number {
  let value = 0
  for (let i = coeffs.length - 1; i >= 0; i--) {
    value = value * x + coeffs[i]
  }
  return value
}

/**
 * Real spherical harmonic Y_l^m (orthonormal over the sphere), with
 * m = mReal in −l..l. Positive m gives cos(mφ) and negative m gives sin(|m|φ).
 * The angular part is N · sin^|m|θ · (d^|m| P_l / dx^|m|)(cos θ) · trig(mφ).
 *
 * @param l Azimuthal quantum number, 0 to 3
 * @param mReal Real magnetic index, −l to +l
 * @param theta Polar angle from +z, in radians
 * @param phi Azimuthal angle in the xy-plane, in radians
 * @throws {RangeError} If l or mReal is out of range
 */
export function realSphericalHarmonic(l: number, mReal: number, theta: number, phi: number): number {
  return angularHarmonic(l, mReal, Math.cos(theta), Math.sin(theta), phi)
}

/**
 * Real spherical harmonic from cos θ and sin θ directly. Passing the exact cos θ = z/r
 * keeps nodal planes exact (for example, p_z vanishes exactly on z = 0).
 */
function angularHarmonic(l: number, mReal: number, cosT: number, sinT: number, phi: number): number {
  if (!Number.isInteger(l) || l < 0 || l > 3) {
    throw new RangeError(`Real spherical harmonics are supported for l from 0 to 3 (received ${l})`)
  }
  requireM(l, mReal)

  const absM = Math.abs(mReal)
  let poly = legendreCoefficients(l)
  for (let k = 0; k < absM; k++) poly = derivative(poly)
  const angular = sinT ** absM * evaluate(poly, cosT)

  const normSquared =
    ((2 * l + 1) / (4 * Math.PI)) * (factorial(l - absM) / factorial(l + absM))
  const norm = mReal === 0 ? Math.sqrt(normSquared) : Math.SQRT2 * Math.sqrt(normSquared)

  if (mReal === 0) return norm * angular
  if (mReal > 0) return norm * angular * Math.cos(absM * phi)
  return norm * angular * Math.sin(absM * phi)
}

/**
 * Real hydrogen-like wavefunction ψ = R_nl(r) · Y_l^m at a point (x, y, z) in atomic
 * units. At the nucleus, ψ is R(0) for s orbitals and 0 otherwise.
 *
 * @param n Principal quantum number, 1 to 4
 * @param l Azimuthal quantum number, 0 to n − 1
 * @param mReal Real magnetic index, −l to +l
 * @throws {RangeError} If any quantum number is out of range
 */
export function psi(n: number, l: number, mReal: number, x: number, y: number, z: number): number {
  requireNL(n, l)
  requireM(l, mReal)
  const r = Math.sqrt(x * x + y * y + z * z)
  if (r === 0) {
    return l === 0 ? radialR(n, 0, 0) * realSphericalHarmonic(0, 0, 0, 0) : 0
  }
  const cosT = z / r
  const sinT = Math.sqrt(x * x + y * y) / r
  const phi = Math.atan2(y, x)
  return radialR(n, l, r) * angularHarmonic(l, mReal, cosT, sinT, phi)
}

const D_NAMES: Record<string, string> = {
  '0': 'dz²',
  '1': 'dxz',
  '-1': 'dyz',
  '2': 'dx²−y²',
  '-2': 'dxy',
}

const F_NAMES: Record<string, string> = {
  '0': 'fz³',
  '1': 'fxz²',
  '-1': 'fyz²',
  '2': 'fz(x²−y²)',
  '-2': 'fxyz',
  '3': 'fx(x²−3y²)',
  '-3': 'fy(3x²−y²)',
}

const P_NAMES: Record<string, string> = {
  '0': 'pz',
  '1': 'px',
  '-1': 'py',
}

/**
 * Returns the name of a real orbital, such as "2pz" or "3dxy".
 *
 * @param n Principal quantum number, 1 to 4
 * @param l Azimuthal quantum number, 0 to n − 1
 * @param mReal Real magnetic index, −l to +l
 * @throws {RangeError} If any quantum number is out of range
 */
export function orbitalName(n: number, l: number, mReal: number): string {
  requireNL(n, l)
  requireM(l, mReal)
  if (l === 0) return `${n}s`
  if (l === 1) return `${n}${P_NAMES[String(mReal)]}`
  if (l === 2) return `${n}${D_NAMES[String(mReal)]}`
  return `${n}${F_NAMES[String(mReal)]}`
}
