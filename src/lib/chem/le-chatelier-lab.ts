/**
 * The model behind the Section 6.8 Lab: three equilibria in one piston vessel, a set of stresses
 * (concentration, volume, inert gas, temperature, catalyst) and a timeline of how each stress
 * re-settles the mixture. Every number the Lab shows is computed here through equilibrium.ts, and
 * the constants K come from NCERT's Kp table or from a named source.
 *
 * Amounts are molar concentrations (mol L⁻¹) at the current volume. The vessel starts at 1.0 L, so
 * at the start the concentrations and the amounts in mol are the same number.
 */

import {
  deltaNGas,
  kcFromKp,
  leChatelier,
  predictDirection,
  reactionQuotient,
  solveIce,
  timeCourse,
  vantHoffK,
  type Direction,
  type EquilibriumState,
  type LeChatelierResult,
  type Perturbation,
  type Reaction,
  type TimeSample,
} from './equilibrium'
import { reactionEnthalpyFromTable } from './gibbs-presets'
import { NCERT_TABLE_6_5_KP } from './ncert-unit6-tables'

/** Length of one relaxation after a stress, in lab time units. */
export const EPOCH_LENGTH = 10
/** Integration steps for one relaxation (RK4). */
export const EPOCH_STEPS = 400
/** Both rate constants are multiplied by this after a catalyst is added. */
export const CATALYST_FACTOR = 4
/** Temperature change per heat or cool press, K. */
export const TEMPERATURE_STEP_K = 50
/** Fraction of a species removed by one remove press. */
export const REMOVE_FRACTION = 0.5
/** Volume limits for the piston, L. */
export const VOLUME_MIN = 0.5
export const VOLUME_MAX = 2
/** Argon added by one press, mol. */
export const ARGON_AMOUNT = 0.5

export type LabSystemId = 'haber' | 'n2o4' | 'fe-scn'

export interface LabSpecies {
  id: string
  /** Name for the UI, with subscripts and superscripts. */
  label: string
  role: 'reactant' | 'product'
  /** Amount added by one add press, mol L⁻¹. */
  addAmount: number
}

export interface LabSystem {
  id: LabSystemId
  /** The balanced equation, for the UI. */
  name: string
  reaction: Reaction
  species: LabSpecies[]
  medium: 'gas' | 'solution'
  /** Temperature at which the anchor constant applies, K. */
  anchorT: number
  /** Equilibrium constant Kc at the anchor temperature, in mol L⁻¹ units. */
  anchorK: number
  /** Standard enthalpy change for the equation as written, kJ mol⁻¹, or null when not given. */
  deltaHkJ: number | null
  /** Allowed temperature range for heat and cool, K, or null when temperature is not changed. */
  temperatureRange: readonly [number, number] | null
  /** Starting amounts (mol L⁻¹) before the reaction runs. */
  initial: Record<string, number>
  /** Forward rate constant used for the lab's time axis. The reverse is kf / K. */
  kfBase: number
  /** Where the anchor constant comes from. */
  kSource: string
}

/** A stress the Learner can apply. */
export type LabEvent =
  | { kind: 'add'; species: string }
  | { kind: 'remove'; species: string }
  | { kind: 'compress' }
  | { kind: 'expand' }
  | { kind: 'argon-constant-volume' }
  | { kind: 'argon-constant-pressure' }
  | { kind: 'heat' }
  | { kind: 'cool' }
  | { kind: 'catalyst' }

/** One relaxation: the mixture moving from the composition after a stress to the new equilibrium. */
export interface LabEpoch {
  startTime: number
  endTime: number
  /** Samples in time order with absolute lab times, from the start to the end of the relaxation. */
  samples: TimeSample[]
  /** The stress that started it, or null for the first run from the starting mixture. */
  event: LabEvent | null
}

/** What the last stress did, for the readout. */
export interface LabEventRecord {
  event: LabEvent
  /** Q immediately after the stress, before the mixture moves. */
  immediateQ: number
  /** K at the temperature after the stress. */
  k: number
  shift: LeChatelierResult['shift']
  direction: Direction
  /** Equilibrium composition before the stress. */
  before: Record<string, number>
  /** Equilibrium composition after the stress. */
  after: Record<string, number>
}

export interface LabSnapshot {
  systemId: LabSystemId
  /** The settled equilibrium composition, mol L⁻¹ at the current volume. */
  settled: Record<string, number>
  /** Vessel volume, L. Starts at 1.0. */
  volume: number
  /** Argon added so far, mol. Argon is inert, so it is not in any constant. */
  argonMol: number
  temperatureK: number
  /** Equilibrium constant at temperatureK. */
  k: number
  catalysed: boolean
  epochs: LabEpoch[]
  last: LabEventRecord | null
}

/** A button in the Lab and whether it can be pressed now. */
export interface LabAction {
  id: string
  label: string
  group: 'concentration' | 'pressure' | 'temperature' | 'catalyst' | 'inert'
  event: LabEvent
  enabled: boolean
  /** Why the action is disabled, for the Learner. */
  reason: string | null
}

// ---------------------------------------------------------------------------
// Systems
// ---------------------------------------------------------------------------

const KP_LOOKUP = (reaction: string, temperatureK: number): number => {
  const row = NCERT_TABLE_6_5_KP.rows.find((r) => r.reaction === reaction && r.temperatureK === temperatureK)
  if (!row) throw new RangeError(`No NCERT Kp for ${reaction} at ${temperatureK} K`)
  return row.kp
}

const HABER_EQ = 'N2(g) + 3H2(g) ⇌ 2NH3(g)'
const N2O4_EQ = 'N2O4(g) ⇌ 2NO2(g)'

/** Enthalpy of 2NO₂ ⇌ N₂O₄ is −57.2 kJ mol⁻¹ (NCERT, Section 6.8.4), so N₂O₄ ⇌ 2NO₂ is +57.2. */
const N2O4_DELTA_H = 57.2

function buildSystems(): Record<LabSystemId, LabSystem> {
  const haberReaction: Reaction = {
    reactants: [
      { species: 'N2', coefficient: 1, phase: 'g' },
      { species: 'H2', coefficient: 3, phase: 'g' },
    ],
    products: [{ species: 'NH3', coefficient: 2, phase: 'g' }],
  }
  const haberDeltaH = reactionEnthalpyFromTable({
    label: 'NH3',
    reactants: [
      { species: 'N2(g)', coefficient: 1 },
      { species: 'H2(g)', coefficient: 3 },
    ],
    products: [{ species: 'NH3(g)', coefficient: 2 }],
  })
  const haberK = kcFromKp(KP_LOOKUP(HABER_EQ, 500), deltaNGas(haberReaction), 500)

  const n2o4Reaction: Reaction = {
    reactants: [{ species: 'N2O4', coefficient: 1, phase: 'g' }],
    products: [{ species: 'NO2', coefficient: 2, phase: 'g' }],
  }
  const n2o4K = kcFromKp(KP_LOOKUP(N2O4_EQ, 400), deltaNGas(n2o4Reaction), 400)

  const feReaction: Reaction = {
    reactants: [
      { species: 'Fe3+', coefficient: 1, phase: 'aq' },
      { species: 'SCN-', coefficient: 1, phase: 'aq' },
    ],
    products: [{ species: 'FeSCN2+', coefficient: 1, phase: 'aq' }],
  }

  return {
    haber: {
      id: 'haber',
      name: 'N₂ + 3H₂ ⇌ 2NH₃',
      reaction: haberReaction,
      species: [
        { id: 'N2', label: 'N₂', role: 'reactant', addAmount: 0.5 },
        { id: 'H2', label: 'H₂', role: 'reactant', addAmount: 0.5 },
        { id: 'NH3', label: 'NH₃', role: 'product', addAmount: 0.5 },
      ],
      medium: 'gas',
      anchorT: 500,
      anchorK: haberK,
      deltaHkJ: haberDeltaH,
      temperatureRange: [400, 800],
      initial: { N2: 1.0, H2: 3.0, NH3: 0 },
      kfBase: 1,
      kSource: 'Kp at 500 K from NCERT Table 6.5 (3.6 × 10⁻²), converted with Kc = Kp (RT)², Δn = −2',
    },
    n2o4: {
      id: 'n2o4',
      name: 'N₂O₄ ⇌ 2NO₂',
      reaction: n2o4Reaction,
      species: [
        { id: 'N2O4', label: 'N₂O₄', role: 'reactant', addAmount: 0.5 },
        { id: 'NO2', label: 'NO₂', role: 'product', addAmount: 0.5 },
      ],
      medium: 'gas',
      anchorT: 400,
      anchorK: n2o4K,
      deltaHkJ: N2O4_DELTA_H,
      temperatureRange: [300, 500],
      initial: { N2O4: 1.0, NO2: 0 },
      kfBase: 1,
      kSource: 'Kp at 400 K from NCERT Table 6.5 (47.9), converted with Kc = Kp / RT, Δn = +1',
    },
    'fe-scn': {
      id: 'fe-scn',
      name: 'Fe³⁺ + SCN⁻ ⇌ [Fe(SCN)]²⁺',
      reaction: feReaction,
      species: [
        { id: 'Fe3+', label: 'Fe³⁺', role: 'reactant', addAmount: 0.1 },
        { id: 'SCN-', label: 'SCN⁻', role: 'reactant', addAmount: 0.1 },
        { id: 'FeSCN2+', label: '[Fe(SCN)]²⁺', role: 'product', addAmount: 0.05 },
      ],
      medium: 'solution',
      anchorT: 298,
      anchorK: 140,
      deltaHkJ: null,
      temperatureRange: null,
      initial: { 'Fe3+': 0.2, 'SCN-': 0.2, 'FeSCN2+': 0 },
      // Dilute ions react slowly with kf = 1 (timescale ~13 lab units, longer than an epoch), so the
      // curve would not reach equilibrium before the last sample is pinned. kf = 20 settles in ~1 unit.
      kfBase: 20,
      kSource: 'Illustrative value, not from NCERT: K ≈ 1.4 × 10² M⁻¹ at 298 K. Only the direction and the colour matter here.',
    },
  }
}

let systemCache: Record<LabSystemId, LabSystem> | null = null

/** The three systems the Lab offers, built once from the NCERT tables. */
export function labSystems(): LabSystem[] {
  systemCache ??= buildSystems()
  return [systemCache.haber, systemCache['n2o4'], systemCache['fe-scn']]
}

/** One system by id. */
export function labSystem(id: LabSystemId): LabSystem {
  systemCache ??= buildSystems()
  return systemCache[id]
}

// ---------------------------------------------------------------------------
// Timelines
// ---------------------------------------------------------------------------

function kfFor(system: LabSystem, catalysed: boolean): number {
  return system.kfBase * (catalysed ? CATALYST_FACTOR : 1)
}

/** Concentration against time from `start` to the new equilibrium, by mass-action kinetics with kr = kf / K. */
function relaxation(
  system: LabSystem,
  from: Record<string, number>,
  k: number,
  catalysed: boolean,
  start: number,
  event: LabEvent | null
): LabEpoch {
  const kf = kfFor(system, catalysed)
  // RK4 is stable only while the step times the fastest rate stays below about 2.8. A faster rate
  // needs proportionally more steps, or the curve overshoots.
  const steps = EPOCH_STEPS * (catalysed ? CATALYST_FACTOR : 1)
  const samples = timeCourse(system.reaction, from, kf, kf / k, EPOCH_LENGTH, steps).map((s) => ({
    time: start + s.time,
    concentrations: s.concentrations,
  }))
  // The integration ends within ~1e-5 of the exact equilibrium from solveIce. Pin the last sample to
  // that exact value, so the curve and the settled amounts agree to the last digit.
  const exact = solveIce(system.reaction, from, k, { basis: 'concentration' }).equilibrium
  samples[samples.length - 1] = { time: start + EPOCH_LENGTH, concentrations: { ...exact } }
  return { startTime: start, endTime: start + EPOCH_LENGTH, samples, event }
}

/**
 * The starting mixture of a system, run to equilibrium at its anchor temperature. The first epoch
 * shows the approach from the starting amounts, so the Lab opens with a curve, not a flat line.
 */
export function createLab(id: LabSystemId): LabSnapshot {
  const system = labSystem(id)
  const eq = solveIce(system.reaction, system.initial, system.anchorK, { basis: 'concentration' })
  const first = approachEpoch(id, false)
  return {
    systemId: id,
    settled: eq.equilibrium,
    volume: 1,
    argonMol: 0,
    temperatureK: system.anchorT,
    k: system.anchorK,
    catalysed: false,
    epochs: [first],
    last: null,
  }
}

/**
 * The approach from the starting mixture to equilibrium, with or without a catalyst. Only the rate
 * differs: the two runs end at the same composition.
 */
export function approachEpoch(id: LabSystemId, catalysed: boolean): LabEpoch {
  const system = labSystem(id)
  return relaxation(system, system.initial, system.anchorK, catalysed, 0, null)
}

/** The time at which the last relaxation ends, which is when the next stress starts. */
export function lastEnd(snap: LabSnapshot): number {
  return snap.epochs[snap.epochs.length - 1].endTime
}

/**
 * Amounts at lab time t, from the relaxations. Between samples the value is interpolated linearly.
 * Before the first sample it is the first value; after the last relaxation it is the settled state.
 */
export function compositionAt(snap: LabSnapshot, t: number): Record<string, number> {
  const first = snap.epochs[0]
  if (t <= first.startTime) return { ...first.samples[0].concentrations }
  for (const epoch of snap.epochs) {
    if (t < epoch.startTime || t > epoch.endTime) continue
    const s = epoch.samples
    for (let i = 0; i < s.length - 1; i++) {
      const a = s[i]
      const b = s[i + 1]
      if (t < a.time || t > b.time) continue
      const span = b.time - a.time
      const w = span > 0 ? (t - a.time) / span : 1
      const out: Record<string, number> = {}
      for (const key of Object.keys(a.concentrations)) {
        out[key] = a.concentrations[key] + w * (b.concentrations[key] - a.concentrations[key])
      }
      return out
    }
    return { ...s[s.length - 1].concentrations }
  }
  return { ...snap.settled }
}

/**
 * Points for one species between two lab times, for the curve plot. Each point is [time, amount].
 * The curve includes the endpoints, interpolated, and every sample in between, including the jump
 * at a stress, where two points share a time.
 */
export function seriesBetween(snap: LabSnapshot, id: string, from: number, to: number): Array<readonly [number, number]> {
  const points: Array<readonly [number, number]> = [[from, compositionAt(snap, from)[id] ?? 0]]
  for (const epoch of snap.epochs) {
    for (const s of epoch.samples) {
      if (s.time <= from || s.time > to) continue
      const value = s.concentrations[id] ?? 0
      const prev = points[points.length - 1]
      if (prev[0] === s.time && prev[1] === value) continue
      points.push([s.time, value])
    }
  }
  const last = points[points.length - 1]
  if (last[0] < to) points.push([to, compositionAt(snap, to)[id] ?? 0])
  return points
}

// ---------------------------------------------------------------------------
// Stresses
// ---------------------------------------------------------------------------

function totalGasMoles(snap: LabSnapshot): number {
  const sum = Object.values(snap.settled).reduce((acc, v) => acc + v, 0)
  return sum * snap.volume + snap.argonMol
}

function sameEvent(a: LabEvent, b: LabEvent): boolean {
  if (a.kind !== b.kind) return false
  if (a.kind === 'add' || a.kind === 'remove') return 'species' in b && a.species === b.species
  return true
}

/** The buttons of the Lab, with whether each can be pressed for this system and state. */
export function labActions(snap: LabSnapshot): LabAction[] {
  const system = labSystem(snap.systemId)
  const gas = system.medium === 'gas'
  const noGas = 'Only gases respond to pressure, volume and inert gas. This mixture is in solution.'
  const actions: LabAction[] = []
  for (const sp of system.species) {
    actions.push({
      id: `add-${sp.id}`,
      label: `Add ${sp.label}`,
      group: 'concentration',
      event: { kind: 'add', species: sp.id },
      enabled: true,
      reason: null,
    })
    actions.push({
      id: `remove-${sp.id}`,
      label: `Remove ${sp.label}`,
      group: 'concentration',
      event: { kind: 'remove', species: sp.id },
      enabled: snap.settled[sp.id] > 1e-9,
      reason: snap.settled[sp.id] > 1e-9 ? null : `${sp.label} is already gone`,
    })
  }
  const compressOk = gas && snap.volume * 0.5 >= VOLUME_MIN
  actions.push({
    id: 'compress',
    label: 'Compress to ½ V',
    group: 'pressure',
    event: { kind: 'compress' },
    enabled: compressOk,
    reason: !gas ? noGas : compressOk ? null : 'The piston is at its lowest position',
  })
  const expandOk = gas && snap.volume * 2 <= VOLUME_MAX
  actions.push({
    id: 'expand',
    label: 'Expand to 2 V',
    group: 'pressure',
    event: { kind: 'expand' },
    enabled: expandOk,
    reason: !gas ? noGas : expandOk ? null : 'The piston is at its highest position',
  })
  const range = system.temperatureRange
  const hasDeltaH = system.deltaHkJ !== null && range !== null
  const heatOk = hasDeltaH && snap.temperatureK + TEMPERATURE_STEP_K <= range[1]
  actions.push({
    id: 'heat',
    label: `Heat +${TEMPERATURE_STEP_K} K`,
    group: 'temperature',
    event: { kind: 'heat' },
    enabled: heatOk,
    reason: !hasDeltaH
      ? 'No enthalpy change is given for this equation, so the temperature is held fixed.'
      : heatOk
        ? null
        : 'The top of the temperature range is reached',
  })
  const coolOk = hasDeltaH && snap.temperatureK - TEMPERATURE_STEP_K >= range![0]
  actions.push({
    id: 'cool',
    label: `Cool −${TEMPERATURE_STEP_K} K`,
    group: 'temperature',
    event: { kind: 'cool' },
    enabled: coolOk,
    reason: !hasDeltaH
      ? 'No enthalpy change is given for this equation, so the temperature is held fixed.'
      : coolOk
        ? null
        : 'The bottom of the temperature range is reached',
  })
  actions.push({
    id: 'argon-volume',
    label: 'Add Ar at constant V',
    group: 'inert',
    event: { kind: 'argon-constant-volume' },
    enabled: gas,
    reason: gas ? null : noGas,
  })
  const argonPressureFactor = gas ? (totalGasMoles(snap) + ARGON_AMOUNT) / totalGasMoles(snap) : 1
  const argonPressureOk = gas && snap.volume * argonPressureFactor <= VOLUME_MAX
  actions.push({
    id: 'argon-pressure',
    label: 'Add Ar at constant p',
    group: 'inert',
    event: { kind: 'argon-constant-pressure' },
    enabled: argonPressureOk,
    reason: !gas ? noGas : argonPressureOk ? null : 'The piston would rise above its highest position',
  })
  actions.push({
    id: 'catalyst',
    label: 'Add catalyst',
    group: 'catalyst',
    event: { kind: 'catalyst' },
    enabled: !snap.catalysed,
    reason: snap.catalysed ? 'The catalyst is already in the vessel' : null,
  })
  return actions
}

/**
 * Applies one stress to the settled mixture with the lib's leChatelier, then starts a relaxation
 * from the composition the stress leaves behind to the new equilibrium. The stress starts when the
 * current relaxation ends, so a press made mid-motion is queued.
 *
 * @throws {RangeError} If the action is not enabled for this state
 */
export function applyLabEvent(snap: LabSnapshot, event: LabEvent): LabSnapshot {
  const system = labSystem(snap.systemId)
  const action = labActions(snap).find((a) => sameEvent(a.event, event))
  if (!action) throw new RangeError(`Unknown event ${event.kind}`)
  if (!action.enabled) throw new RangeError(`${action.label} is not available: ${action.reason ?? 'not enabled'}`)

  const before = { ...snap.settled }
  const base: EquilibriumState = { reaction: system.reaction, equilibrium: snap.settled, k: snap.k }
  let perturbation: Perturbation
  let volume = snap.volume
  let argonMol = snap.argonMol
  let temperatureK = snap.temperatureK
  let catalysed = snap.catalysed

  switch (event.kind) {
    case 'add':
      perturbation = { kind: 'add', species: event.species, amount: system.species.find((s) => s.id === event.species)!.addAmount }
      break
    case 'remove':
      perturbation = { kind: 'remove', species: event.species, amount: REMOVE_FRACTION * snap.settled[event.species] }
      break
    case 'compress':
      perturbation = { kind: 'volume', factor: 0.5 }
      volume = snap.volume * 0.5
      break
    case 'expand':
      perturbation = { kind: 'volume', factor: 2 }
      volume = snap.volume * 2
      break
    case 'argon-constant-volume':
      // Argon in the equation's units: mol per litre at the current volume.
      perturbation = { kind: 'inert-constant-volume', amount: ARGON_AMOUNT / snap.volume }
      argonMol = snap.argonMol + ARGON_AMOUNT
      break
    case 'argon-constant-pressure': {
      // At constant pressure the volume grows by (N + a) / N, with N the total gas moles.
      const n = totalGasMoles(snap)
      const factor = (n + ARGON_AMOUNT) / n
      perturbation = { kind: 'volume', factor }
      volume = snap.volume * factor
      argonMol = snap.argonMol + ARGON_AMOUNT
      break
    }
    case 'heat':
    case 'cool': {
      const toK = snap.temperatureK + (event.kind === 'heat' ? TEMPERATURE_STEP_K : -TEMPERATURE_STEP_K)
      perturbation = { kind: 'temperature', fromK: snap.temperatureK, toK, deltaHkJ: system.deltaHkJ! }
      temperatureK = toK
      break
    }
    case 'catalyst':
      perturbation = { kind: 'catalyst' }
      catalysed = true
      break
  }

  const lc = leChatelier(base, perturbation)
  const start = lastEnd(snap)
  const epoch = relaxation(system, lc.perturbed, lc.k, catalysed, start, event)
  const record: LabEventRecord = {
    event,
    immediateQ: lc.immediateQ,
    k: lc.k,
    shift: lc.shift,
    direction: predictDirection(lc.immediateQ, lc.k),
    before,
    after: { ...lc.equilibrium },
  }

  return {
    ...snap,
    settled: { ...lc.equilibrium },
    volume,
    argonMol,
    temperatureK,
    k: lc.k,
    catalysed,
    epochs: [...snap.epochs, epoch],
    last: record,
  }
}

/** Q for a composition, in the system's own basis (mol L⁻¹). */
export function quotientOf(system: LabSystem, amounts: Record<string, number>): number {
  return reactionQuotient(system.reaction, amounts)
}

/** K at a temperature from the anchor, with van 't Hoff, when the system has an enthalpy change. */
export function constantAt(system: LabSystem, temperatureK: number): number {
  if (temperatureK === system.anchorT) return system.anchorK
  if (system.deltaHkJ === null) throw new RangeError(`${system.name} has no enthalpy change, so K is fixed`)
  return vantHoffK(system.anchorK, system.anchorT, temperatureK, system.deltaHkJ)
}

/**
 * The unit of K for a system, from its net change in moles of aqueous and gaseous species: K has
 * units of mol L⁻¹ raised to that net number, so 2NH₃ over N₂ + 3H₂ gives M⁻².
 */
export function kUnit(system: LabSystem): string {
  const net = system.reaction.products.reduce((sum, t) => sum + t.coefficient, 0) -
    system.reaction.reactants.reduce((sum, t) => sum + t.coefficient, 0)
  if (net === 0) return ''
  if (net === 1) return 'M'
  return `M${net > 0 ? '' : '⁻'}${superscript(Math.abs(net))}`
}

const SUPERSCRIPT_DIGITS: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }

function superscript(n: number): string {
  return String(n).replace(/[0-9]/g, (d) => SUPERSCRIPT_DIGITS[d])
}
