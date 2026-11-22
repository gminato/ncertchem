import type { PlotTone } from '@/components/vocab/kinetics/Plot'

/**
 * Deterministic frames for the five Steps of Section 3.2.4 (Molecularity of a Reaction).
 * Each Step loops a short cycle. A cycle phase q in [0, 1) gives every particle's position,
 * opacity and collision burst, so the same q always draws the same picture. Reduced motion
 * draws each Step at its `restPhase`, a frame that shows the event the Step is about.
 *
 * Coordinates are local to the reaction vessel (520 × 240, origin at its top-left).
 * Species colours follow their role across all Steps: reactants use the reactant tone,
 * products the product tone, the intermediate IO⁻ the neutral tone, and the slow step is marked accent.
 */

export interface Dot {
  readonly id: string
  readonly label: string
  readonly tone: PlotTone
  readonly x: number
  readonly y: number
  readonly r: number
  readonly opacity: number
}

export interface Burst {
  readonly x: number
  readonly y: number
  readonly size: number
  readonly effective: boolean
  readonly opacity: number
}

export interface MechanismFrame {
  readonly dots: readonly Dot[]
  readonly bursts: readonly Burst[]
}

export type MechanismStepId = 'unimolecular' | 'bimolecular' | 'termolecular' | 'slow-step' | 'fast-step'

export interface MechanismStepState {
  readonly index: number
  readonly id: MechanismStepId
  readonly title: string
  readonly tag: string
  readonly tagAccent: boolean
  /** Seconds for one loop of the animation. */
  readonly period: number
  /** Phase drawn under reduced motion. */
  readonly restPhase: number
  /** Whether the Step shows the energy profile below the vessel. */
  readonly energy: boolean
  readonly formula: readonly string[]
  readonly ariaLabel: string
}

/** Energy profile (schematic, unitless): reactants, TS1 (taller, slow step), IO⁻ + products level, TS2 (lower), products. */
export const ENERGY_PROFILE: number[] = [0, 70, 25, 50, -30]

export const VESSEL = { width: 520, height: 240 } as const

export function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}

/** Smoothstep between a and b, from 0 to 1. */
export function smooth(a: number, b: number, q: number): number {
  const x = clamp01((q - a) / (b - a))
  return x * x * (3 - 2 * x)
}

function lerp(a: number, b: number, s: number): number {
  return a + (b - a) * s
}

function dot(id: string, label: string, tone: PlotTone, x: number, y: number, r: number, opacity = 1): Dot {
  return { id, label, tone, x, y, r, opacity }
}

/** Step 1: NH₄NO₂ splits on its own into N₂ and two H₂O. */
function unimolecular(q: number): MechanismFrame {
  const s = smooth(0.42, 0.6, q)
  return {
    dots: [
      dot('nh4no2', 'NH₄NO₂', 'reactant', 150, 120, 36, 1 - s),
      dot('n2', 'N₂', 'product', lerp(150, 370, s), lerp(120, 80, s), 22, s),
      dot('h2o-a', 'H₂O', 'product', lerp(150, 430, s), lerp(120, 165, s), 18, s),
      dot('h2o-b', 'H₂O', 'product', lerp(150, 300, s), lerp(120, 190, s), 18, s),
    ],
    bursts: [],
  }
}

/** Step 2: two HI approach, collide once, and form H₂ and I₂. */
function bimolecular(q: number): MechanismFrame {
  const a = smooth(0, 0.5, q)
  const form = smooth(0.52, 0.62, q) * (1 - smooth(0.9, 1, q))
  const flash = smooth(0.46, 0.5, q) * (1 - smooth(0.62, 0.7, q))
  return {
    dots: [
      dot('hi-a', 'HI', 'reactant', lerp(50, 236, a), 120, 24, 1 - form),
      dot('hi-b', 'HI', 'reactant', lerp(470, 284, a), 120, 24, 1 - form),
      dot('h2', 'H₂', 'product', lerp(260, 200, form), lerp(120, 60, form), 16, form),
      dot('i2', 'I₂', 'product', lerp(260, 340, form), lerp(120, 172, form), 24, form),
    ],
    bursts: [{ x: 260, y: 120, size: 40, effective: true, opacity: flash }],
  }
}

/** Step 3: two NO and one O₂ converge on one spot, and 2NO₂ forms. */
function termolecular(q: number): MechanismFrame {
  const a = smooth(0, 0.5, q)
  const form = smooth(0.52, 0.62, q) * (1 - smooth(0.9, 1, q))
  const flash = smooth(0.46, 0.5, q) * (1 - smooth(0.6, 0.68, q))
  return {
    dots: [
      dot('no-a', 'NO', 'reactant', lerp(60, 226, a), lerp(40, 70, a), 22, 1 - form),
      dot('no-b', 'NO', 'reactant', lerp(60, 226, a), lerp(200, 170, a), 22, 1 - form),
      dot('o2', 'O₂', 'reactant', lerp(480, 288, a), 120, 22, 1 - form),
      dot('no2-a', 'NO₂', 'product', lerp(260, 200, form), lerp(120, 70, form), 22, form),
      dot('no2-b', 'NO₂', 'product', lerp(260, 320, form), lerp(120, 170, form), 22, form),
    ],
    bursts: [{ x: 256, y: 120, size: 24, effective: true, opacity: flash }],
  }
}

/** Step 4: the slow step 1, H₂O₂ + I⁻ → H₂O + IO⁻. Long approach, then one collision. */
function slowStep(q: number): MechanismFrame {
  const a = smooth(0, 0.6, q)
  const form = smooth(0.62, 0.72, q) * (1 - smooth(0.95, 1, q))
  const flash = smooth(0.6, 0.65, q) * (1 - smooth(0.7, 0.74, q))
  return {
    dots: [
      dot('h2o2', 'H₂O₂', 'reactant', lerp(40, 236, a), 120, 22, 1 - form),
      dot('i-slow', 'I⁻', 'reactant', lerp(480, 284, a), 120, 22, 1 - form),
      dot('h2o', 'H₂O', 'product', lerp(260, 200, form), lerp(120, 60, form), 16, form),
      dot('io', 'IO⁻', 'neutral', lerp(260, 300, form), lerp(120, 170, form), 22, form),
    ],
    bursts: [{ x: 260, y: 120, size: 40, effective: true, opacity: flash }],
  }
}

/**
 * Step 5: the fast step 2, H₂O₂ + IO⁻ → H₂O + I⁻ + O₂. The intermediate IO⁻ is used up almost at once,
 * so only a short-lived particle appears; I⁻ returns to the reactant side unchanged.
 */
function fastStep(q: number): MechanismFrame {
  const a = smooth(0, 0.4, q)
  const use = smooth(0.4, 0.5, q) * (1 - smooth(0.9, 1, q))
  const flash = smooth(0.4, 0.45, q) * (1 - smooth(0.52, 0.6, q))
  return {
    dots: [
      dot('io-fast', 'IO⁻', 'neutral', 250, 130, 22, 1 - use),
      dot('h2o2-fast', 'H₂O₂', 'reactant', lerp(476, 296, a), lerp(40, 130, a), 22, 1 - use),
      dot('h2o-fast', 'H₂O', 'product', 200, 50, 16, use),
      dot('o2-fast', 'O₂', 'product', 330, 60, 18, use),
      dot('i-fast', 'I⁻', 'reactant', 390, 150, 22, use),
    ],
    bursts: [{ x: 272, y: 130, size: 36, effective: true, opacity: flash }],
  }
}

const FRAMES: readonly ((q: number) => MechanismFrame)[] = [unimolecular, bimolecular, termolecular, slowStep, fastStep]

export const MECHANISM_STEPS: readonly MechanismStepState[] = [
  {
    index: 0,
    id: 'unimolecular',
    title: 'One species, no partner',
    tag: 'Unimolecular: one molecule',
    tagAccent: false,
    period: 6,
    restPhase: 0.8,
    energy: false,
    formula: ['NH₄NO₂ → N₂ + 2H₂O', 'One molecule reacts on its own: molecularity = 1'],
    ariaLabel:
      'A single ammonium nitrite molecule breaks apart in place into one nitrogen molecule and two water molecules. No second particle has to arrive.',
  },
  {
    index: 1,
    id: 'bimolecular',
    title: 'Two particles must meet',
    tag: 'Bimolecular: two particles',
    tagAccent: false,
    period: 4,
    restPhase: 0.8,
    energy: false,
    formula: ['2HI → H₂ + I₂', 'Two particles collide: molecularity = 2'],
    ariaLabel:
      'Two hydrogen iodide molecules drift together, collide, and regroup into hydrogen and iodine.',
  },
  {
    index: 2,
    id: 'termolecular',
    title: 'Three at one instant',
    tag: 'Termolecular: three at once, rare',
    tagAccent: false,
    period: 6,
    restPhase: 0.8,
    energy: false,
    formula: ['2NO + O₂ → 2NO₂', 'Three particles meet at one instant: molecularity = 3'],
    ariaLabel:
      'Two nitric oxide molecules and one oxygen molecule converge on one point at the same instant, and two nitrogen dioxide molecules form.',
  },
  {
    index: 3,
    id: 'slow-step',
    title: 'The slow first step',
    tag: 'Step 1: slow, rate-determining',
    tagAccent: true,
    period: 10,
    restPhase: 0.8,
    energy: true,
    formula: ['Step 1 (slow): H₂O₂ + I⁻ → H₂O + IO⁻', 'The intermediate IO⁻ forms only at this slow rate.'],
    ariaLabel:
      'Hydrogen peroxide meets an iodide ion in a slow first step, forming water and the intermediate hypoiodite ion. The energy profile shows this step has the taller barrier.',
  },
  {
    index: 4,
    id: 'fast-step',
    title: 'The intermediate is used up',
    tag: 'Step 2: fast',
    tagAccent: false,
    period: 4,
    restPhase: 0.7,
    energy: true,
    formula: ['Step 2 (fast): H₂O₂ + IO⁻ → H₂O + I⁻ + O₂', 'Overall: 2H₂O₂ → 2H₂O + O₂;  Rate = k[H₂O₂][I⁻]'],
    ariaLabel:
      'The intermediate hypoiodite ion meets a hydrogen peroxide molecule almost at once. Water, oxygen and the iodide ion form, and the iodide ion is back unchanged. The second barrier is lower than the first.',
  },
]

/** Clamp a Scrolly step index into the Step list. */
export function mechanismStepIndex(step: number): number {
  return Math.min(MECHANISM_STEPS.length - 1, Math.max(0, Math.floor(step)))
}

/** The frame for a Step at cycle phase q in [0, 1). */
export function mechanismFrame(index: number, q: number): MechanismFrame {
  const fn = FRAMES[mechanismStepIndex(index)]
  return fn(((q % 1) + 1) % 1)
}
