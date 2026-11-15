/**
 * Isothermal expansion and compression of an ideal gas carried out in N steps, for Unit 5
 * Section 5.2.1. Each step is an irreversible move against the pressure at the end of that step.
 * With one step the work is the single irreversible value; as N grows the work approaches the
 * reversible value from the expansion side, and from the compression side it falls back towards
 * the same value from above (more work is needed for fewer steps).
 *
 * The functions here describe a process as a function of its progress s (0 to 1). They feed the
 * pv-work-lab Simulation and the Scrolly that compares one step, many steps and the reversible
 * limit. Pressures, work and nRT are all in bar and L bar, so the PV path needs no conversion.
 *
 * Sign convention (IUPAC, as Section 5.1.4): w is positive when work is done on the gas. An
 * expansion therefore has negative w, and a compression positive w.
 */

import {
  R_LITRE_BAR_PER_MOL_K,
  reversibleIsothermalWork,
  steppedIsothermalWork,
  workFromLitreBar,
  type Work,
} from './pv-work'

export type Direction = 'expansion' | 'compression'

/** A number of equal steps, or the reversible limit (infinitely many infinitesimal steps). */
export type StepCount = number | 'reversible'

/** One isothermal change of an ideal gas, from `startL` to `endL` in litres. */
export interface IsothermalProcess {
  moles: number
  temperatureK: number
  startL: number
  endL: number
}

/** The gas and volumes used throughout the Section: 1.00 mol at 300 K between 6.00 L and 12.00 L. */
export const SECTION_GAS = { moles: 1, temperatureK: 300, smallL: 6, largeL: 12 } as const

/** The process for a direction: expansion goes from the small volume to the large one. */
export function processFor(direction: Direction): IsothermalProcess {
  const { moles, temperatureK, smallL, largeL } = SECTION_GAS
  return direction === 'expansion'
    ? { moles, temperatureK, startL: smallL, endL: largeL }
    : { moles, temperatureK, startL: largeL, endL: smallL }
}

/** nRT in L bar, which is the constant in p = nRT / V (with p in bar and V in litres). */
export function nRTBar(process: IsothermalProcess): number {
  return process.moles * R_LITRE_BAR_PER_MOL_K * process.temperatureK
}

/** Gas pressure on the isotherm at a volume, in bar. */
export function gasPressureBar(process: IsothermalProcess, volumeL: number): number {
  return nRTBar(process) / volumeL
}

function assertSteps(steps: number): void {
  if (!Number.isInteger(steps) || steps < 1) {
    throw new RangeError(`steps must be an integer of 1 or more (received ${steps})`)
  }
}

/** The volumes at the N + 1 step boundaries, V_0 = start … V_N = end, evenly spaced. */
export function stepVolumes(process: IsothermalProcess, steps: number): number[] {
  assertSteps(steps)
  const dV = (process.endL - process.startL) / steps
  return Array.from({ length: steps + 1 }, (_, k) => (k === steps ? process.endL : process.startL + k * dV))
}

/**
 * The external pressure during each step, in bar. Step j (counting from 0) runs from V_j to V_(j+1)
 * and is set to the gas pressure at its end, nRT / V_(j+1). Expansion is therefore against a lower
 * pressure than the gas has at the start of the step, and compression against a higher one.
 */
export function stepPressuresBar(process: IsothermalProcess, steps: number): number[] {
  const volumes = stepVolumes(process, steps)
  return volumes.slice(1).map((v) => gasPressureBar(process, v))
}

/** Work for the whole process, in L bar and J. Reversible gives the limit as N tends to infinity. */
export function totalWork(process: IsothermalProcess, steps: StepCount): Work {
  if (steps === 'reversible') {
    return reversibleIsothermalWork(process.moles, process.temperatureK, process.startL, process.endL)
  }
  const stepped = steppedIsothermalWork(process.moles, process.temperatureK, process.startL, process.endL, steps)
  return workFromLitreBar(stepped.litreBar)
}

/** The reversible work for a process, in L bar and J. */
export function reversibleWork(process: IsothermalProcess): Work {
  return totalWork(process, 'reversible')
}

/**
 * The work of N steps as a fraction of the reversible work, |w_N| / |w_rev|. For an expansion this
 * is at most one (a fraction of the reversible maximum). For a compression it is at least one (a
 * multiple of the reversible minimum).
 */
export function workFraction(process: IsothermalProcess, steps: StepCount): number {
  const rev = reversibleWork(process).litreBar
  return Math.abs(totalWork(process, steps).litreBar) / Math.abs(rev)
}

function clampProgress(s: number): number {
  if (!Number.isFinite(s)) return 0
  return Math.min(1, Math.max(0, s))
}

/** Volume of the gas at progress s. Reversible moves smoothly; N steps move through each step in turn. */
export function volumeAt(process: IsothermalProcess, steps: StepCount, s: number): number {
  const progress = clampProgress(s)
  if (steps === 'reversible') return process.startL + progress * (process.endL - process.startL)
  const volumes = stepVolumes(process, steps)
  const x = progress * steps
  const k = Math.min(steps - 1, Math.floor(x))
  const t = x - k
  return volumes[k] + t * (volumes[k + 1] - volumes[k])
}

/**
 * The external pressure acting on the piston at progress s, in bar. For N steps it is the value set
 * for the step in progress and changes only at a step boundary. For the reversible limit it equals
 * the gas pressure at every instant.
 */
export function externalPressureAt(process: IsothermalProcess, steps: StepCount, s: number): number {
  if (steps === 'reversible') return gasPressureBar(process, volumeAt(process, steps, s))
  const progress = clampProgress(s)
  const k = Math.min(steps - 1, Math.floor(progress * steps))
  return stepPressuresBar(process, steps)[k]
}

/**
 * Work done so far at progress s, in L bar and J. For N steps it sums the completed steps and the
 * fraction of the step in progress. At s = 1 it equals totalWork. For the reversible limit it is
 * the isothermal integral from the start volume to the current one.
 */
export function workSoFar(process: IsothermalProcess, steps: StepCount, s: number): Work {
  const progress = clampProgress(s)
  if (steps === 'reversible') {
    const end = volumeAt(process, steps, progress)
    if (end === process.startL) return workFromLitreBar(0)
    return reversibleIsothermalWork(process.moles, process.temperatureK, process.startL, end)
  }
  const volumes = stepVolumes(process, steps)
  const pressures = stepPressuresBar(process, steps)
  const x = progress * steps
  const full = Math.min(steps, Math.floor(x))
  const t = full < steps ? x - full : 0
  let litreBar = 0
  for (let j = 0; j < full; j++) litreBar -= pressures[j] * (volumes[j + 1] - volumes[j])
  if (full < steps) litreBar -= pressures[full] * t * (volumes[full + 1] - volumes[full])
  return workFromLitreBar(litreBar)
}

/**
 * The p–V path at progress s, in bar and L, as corner points for PVDiagram (pressureUnit 'bar'). N steps draw the
 * staircase: a drop (or rise) at each step boundary, then a horizontal run at the step's external
 * pressure. The reversible limit draws the isotherm. The shaded area under the path is the work.
 */
export function pvPath(process: IsothermalProcess, steps: StepCount, s: number): Array<{ v: number; p: number }> {
  const progress = clampProgress(s)
  const nRT = nRTBar(process)
  if (steps === 'reversible') {
    const end = volumeAt(process, steps, progress)
    const samples = 48
    return Array.from({ length: samples + 1 }, (_, i) => {
      const v = process.startL + ((end - process.startL) * i) / samples
      return { v, p: nRT / v }
    })
  }
  const volumes = stepVolumes(process, steps)
  const pressures = stepPressuresBar(process, steps)
  const x = progress * steps
  const full = Math.min(steps, Math.floor(x))
  const t = full < steps ? x - full : 0
  const pts = [{ v: volumes[0], p: gasPressureBar(process, volumes[0]) }]
  for (let j = 0; j < full; j++) {
    pts.push({ v: volumes[j], p: pressures[j] })
    pts.push({ v: volumes[j + 1], p: pressures[j] })
  }
  if (full < steps) {
    pts.push({ v: volumes[full], p: pressures[full] })
    pts.push({ v: volumes[full] + t * (volumes[full + 1] - volumes[full]), p: pressures[full] })
  }
  return pts
}
