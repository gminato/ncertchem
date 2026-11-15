import {
  applyLabEvent,
  approachEpoch,
  createLab,
  EPOCH_LENGTH,
  labSystem,
  seriesBetween,
  type LabEvent,
  type LabSnapshot,
} from '@/lib/chem/le-chatelier-lab'
import type { LeChatelierStress } from '@/components/equilibrium/LeChatelierScale'

/** Time before a stress, so that the curve shows the mixture at rest before the change. */
export const PRE_STRESS = 2

/** A curve for one species, drawn in the Step's plot. */
export interface StressSeries {
  id: string
  label: string
  color: string
  dash?: string
  points: Array<readonly [number, number]>
}

/** One Step of the Le Chatelier Scrolly: the stress, its curves and the numbers it shows. */
export interface StressStep {
  title: string
  stress: LeChatelierStress
  shift: 'products' | 'reactants'
  /** Lab time of the stress, or null for a Step with no stress. */
  perturbAt: number | null
  /** Lab time from which the 'equilibrium reached' band is drawn, or undefined to let the curves decide. */
  bandAt?: number
  series: StressSeries[]
  timeMax: number
  concMax: number
  /** K before the stress and after it. They differ only for a temperature change. */
  kBefore: number
  kAfter: number
  /** Q immediately after the stress, or null when there is no stress. */
  immediateQ: number | null
  /** One line for the readout, with values from the lib. */
  readout: string
  /** The settled composition at the end of the Step, for the vessel. */
  settled: Record<string, number>
  volume: number
  argonMol: number
  temperatureK: number
}

const SPECIES_COLOUR: Record<string, string> = {
  N2: 'var(--fg-muted)',
  H2: 'var(--accent)',
  NH3: 'var(--fwd)',
}

const SPECIES_LABEL: Record<string, string> = {
  N2: '[N₂]',
  H2: '[H₂]',
  NH3: '[NH₃]',
}

/** Rounds the axis top up to a tidy step, so the ticks read as 0.5, 1.0, and so on. */
export function concentrationAxisMax(values: number[]): number {
  const max = Math.max(...values, 0.1)
  const step = 0.5 * 10 ** Math.floor(Math.log10(max))
  return Math.ceil((max * 1.08) / step) * step
}

/** Plain minus sign and fixed digits, for numbers in the readout. */
export function fixed(value: number, digits: number): string {
  const text = Math.abs(value).toFixed(digits)
  return value < 0 ? `−${text}` : text
}

function seriesFor(snap: LabSnapshot, from: number, to: number): StressSeries[] {
  return labSystem('haber').species.map((sp) => ({
    id: sp.id,
    label: SPECIES_LABEL[sp.id],
    color: SPECIES_COLOUR[sp.id],
    points: seriesBetween(snap, sp.id, from, to),
  }))
}

function maxOf(series: StressSeries[]): number {
  return Math.max(...series.flatMap((s) => s.points.map((p) => p[1])))
}

/** The baseline mixture with a flat run in front of it, so the stress has a resting state to leave. */
function withRest(base: LabSnapshot): LabSnapshot {
  return {
    ...base,
    epochs: [
      {
        startTime: 0,
        endTime: PRE_STRESS,
        samples: [
          { time: 0, concentrations: { ...base.settled } },
          { time: PRE_STRESS, concentrations: { ...base.settled } },
        ],
        event: null,
      },
    ],
  }
}

function stressStep(
  base: LabSnapshot,
  spec: {
    title: string
    event: LabEvent
    stress: LeChatelierStress
    shift: 'products' | 'reactants'
    readout: (q: number, kBefore: number, kAfter: number, snap: LabSnapshot) => string
  }
): StressStep {
  const snap = applyLabEvent(withRest(base), spec.event)
  const last = snap.last!
  const to = PRE_STRESS + EPOCH_LENGTH
  const series = seriesFor(snap, 0, to)
  return {
    title: spec.title,
    stress: spec.stress,
    shift: spec.shift,
    perturbAt: PRE_STRESS,
    // A stress that changes nothing is at equilibrium from the moment it is applied.
    bandAt: Math.abs(snap.settled.NH3 - base.settled.NH3) < 1e-9 && Math.abs(snap.settled.N2 - base.settled.N2) < 1e-9 ? PRE_STRESS : undefined,
    series,
    timeMax: to,
    concMax: concentrationAxisMax([maxOf(series)]),
    kBefore: base.k,
    kAfter: last.k,
    immediateQ: last.immediateQ,
    readout: spec.readout(last.immediateQ, base.k, last.k, snap),
    settled: snap.settled,
    volume: snap.volume,
    argonMol: snap.argonMol,
    temperatureK: snap.temperatureK,
  }
}

/** Q against K in words, with the direction of the shift. */
function qVsK(q: number, k: number): string {
  if (Math.abs(q - k) <= 1e-9 * k) return `Q = K = ${fixed(k, 1)}: no net change`
  return q < k
    ? `Q = ${fixed(q, 1)} < K = ${fixed(k, 1)}: net reaction runs forward`
    : `Q = ${fixed(q, 1)} > K = ${fixed(k, 1)}: net reaction runs in reverse`
}

/**
 * The six Steps of the Le Chatelier Scrolly, all from the same Haber baseline at 500 K. Each Step
 * shows one stress: a baseline, then concentration, volume, inert gas, temperature and catalyst.
 * Every number is computed by the lab model (le-chatelier-lab.ts), not typed in.
 */
export function stressSteps(): StressStep[] {
  const base = createLab('haber')
  const baseline: StressSeries[] = seriesFor(base, 0, EPOCH_LENGTH)
  const approachCat = approachEpoch('haber', true)
  const approachPlain = approachEpoch('haber', false)
  const nh3 = (samples: typeof approachPlain.samples) =>
    samples.map((s) => [s.time, s.concentrations.NH3] as const)
  const catalysedMax = Math.max(...nh3(approachCat.samples).map((p) => p[1]))

  const steps: StressStep[] = [
    {
      title: 'Equilibrium at 500 K',
      stress: 'none',
      shift: 'products',
      perturbAt: null,
      series: baseline,
      timeMax: EPOCH_LENGTH,
      concMax: concentrationAxisMax([maxOf(baseline)]),
      kBefore: base.k,
      kAfter: base.k,
      immediateQ: null,
      readout: `Q = K = ${fixed(base.k, 1)} at equilibrium. Both reactions run on, at equal rates.`,
      settled: base.settled,
      volume: base.volume,
      argonMol: 0,
      temperatureK: base.temperatureK,
    },
    stressStep(base, {
      title: 'Add N₂ at constant V and T',
      event: { kind: 'add', species: 'N2' },
      stress: 'add-reactant',
      shift: 'products',
      readout: (q, k) => qVsK(q, k),
    }),
    stressStep(base, {
      title: 'Compress to half the volume',
      event: { kind: 'compress' },
      stress: 'compress',
      shift: 'products',
      readout: (q, k) => qVsK(q, k),
    }),
    stressStep(base, {
      title: 'Add argon at constant volume',
      event: { kind: 'argon-constant-volume' },
      stress: 'none',
      shift: 'products',
      readout: (q, k) => qVsK(q, k),
    }),
    stressStep(base, {
      title: 'Heat by 50 K',
      event: { kind: 'heat' },
      stress: 'heat',
      shift: 'reactants',
      readout: (q, kBefore, kAfter) =>
        `K falls from ${fixed(kBefore, 1)} to ${fixed(kAfter, 1)}. The old Q = ${fixed(kBefore, 1)} now exceeds K, so the mixture shifts to reactants.`,
    }),
    {
      title: 'Add a catalyst',
      stress: 'none',
      shift: 'products',
      perturbAt: null,
      series: [
        {
          id: 'NH3-plain',
          label: 'dashed',
          color: 'var(--fwd)',
          dash: '7 5',
          points: nh3(approachPlain.samples),
        },
        {
          id: 'NH3-catalysed',
          label: 'solid',
          color: 'var(--fwd)',
          points: nh3(approachCat.samples),
        },
      ],
      timeMax: EPOCH_LENGTH,
      concMax: concentrationAxisMax([catalysedMax]),
      kBefore: base.k,
      kAfter: base.k,
      immediateQ: null,
      readout: `Dashed: no catalyst. Solid: with catalyst. Both end at the same [NH₃] for K = ${fixed(base.k, 1)}; the catalyst only gets there sooner.`,
      settled: base.settled,
      volume: base.volume,
      argonMol: 0,
      temperatureK: base.temperatureK,
    },
  ]
  return steps
}
