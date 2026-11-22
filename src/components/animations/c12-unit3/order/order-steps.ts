import { formatSig, rateConstantUnits, rateFromLaw } from '@/lib/chem/kinetics'

/**
 * Deterministic target state for each Scrolly step of Section 3.2.3 (Order of a Reaction).
 * Every rate is computed from the kinetics lib with the one example constant k = 0.200 that the
 * Prose and the Simulation both use. The component fades curves between steps; reduced motion cuts.
 */

/** The example rate constant. Its units depend on the order (see rateConstantUnits). */
export const EXAMPLE_K = 0.2

/** Concentrations of the three sample points, in mol L⁻¹ (the Prose quotes these). */
export const SAMPLE_CONCS: readonly number[] = [0.25, 0.5, 1]

export const X_MAX = 1.2
export const Y_MAX = 0.25

export type OrderId = 'zero' | 'first' | 'second' | 'half'
export type CurveTone = 'neutral' | 'reactant' | 'product' | 'accent' | 'catalyst'

export interface OrderSpec {
  readonly id: OrderId
  readonly order: number
  readonly title: string
  readonly rateLaw: string
  readonly tone: CurveTone
}

export const ORDER_SPECS: readonly OrderSpec[] = [
  { id: 'zero', order: 0, title: 'Zero order', rateLaw: 'Rate = k[A]⁰ = k', tone: 'neutral' },
  { id: 'first', order: 1, title: 'First order', rateLaw: 'Rate = k[A]', tone: 'reactant' },
  { id: 'second', order: 2, title: 'Second order', rateLaw: 'Rate = k[A]²', tone: 'product' },
  { id: 'half', order: 0.5, title: 'Order one-half', rateLaw: 'Rate = k[A]^(1/2)', tone: 'catalyst' },
]

export function specFor(id: OrderId): OrderSpec {
  const spec = ORDER_SPECS.find((s) => s.id === id)
  if (!spec) throw new Error(`No order spec for ${id}`)
  return spec
}

/** Rate of reaction at [A] = a, for the example k and the given order (from the lib). */
export function rateAt(order: number, a: number): number {
  return rateFromLaw(EXAMPLE_K, { A: a }, { A: order })
}

/** Three significant figures, with a real minus sign. */
export function fmtRate(x: number): string {
  return formatSig(x, 3)
}

export function unitsOf(order: number): string {
  return rateConstantUnits(order).text
}

export type CurveVisibility = 'active' | 'faded' | 'hidden'

export interface OrderStepState {
  readonly index: number
  readonly title: string
  readonly ariaLabel: string
  /** Header line 1 (rate law) and line 2 (units of k or the slope). */
  readonly headerLaw: string
  readonly headerUnits: string
  readonly curves: Readonly<Record<OrderId, CurveVisibility>>
  /** The sample points and their labels are drawn for this order only. */
  readonly points: OrderId | null
  readonly slope: boolean
  /** The units decoder (four cards) replaces the plot. */
  readonly decoder: boolean
}

function visibility(active: OrderId, shown: readonly OrderId[]): Record<OrderId, CurveVisibility> {
  const all: OrderId[] = ['zero', 'first', 'second', 'half']
  const out = {} as Record<OrderId, CurveVisibility>
  for (const id of all) {
    out[id] = id === active ? 'active' : shown.includes(id) ? 'faded' : 'hidden'
  }
  return out
}

const KLAW = `k = ${fmtRate(EXAMPLE_K)}`

export const ORDER_STEPS: readonly OrderStepState[] = [
  {
    index: 0,
    title: 'Zero order',
    ariaLabel: 'Zero order: a flat rate line at k = 0.200 mol L⁻¹ s⁻¹ for every concentration.',
    headerLaw: 'Rate = k[A]⁰ = k',
    headerUnits: `${KLAW} ${unitsOf(0)}`,
    curves: visibility('zero', ['zero']),
    points: 'zero',
    slope: false,
    decoder: false,
  },
  {
    index: 1,
    title: 'First order',
    ariaLabel: 'First order: a straight line through the origin with slope k = 0.200 s⁻¹.',
    headerLaw: 'Rate = k[A]',
    headerUnits: `slope = k = ${fmtRate(EXAMPLE_K)} ${unitsOf(1)}`,
    curves: visibility('first', ['zero', 'first']),
    points: 'first',
    slope: true,
    decoder: false,
  },
  {
    index: 2,
    title: 'Second order',
    ariaLabel: 'Second order: a rising parabola that meets the other curves at [A] = 1 mol L⁻¹.',
    headerLaw: 'Rate = k[A]²',
    headerUnits: `${KLAW} ${unitsOf(2)}`,
    curves: visibility('second', ['zero', 'first', 'second']),
    points: 'second',
    slope: false,
    decoder: false,
  },
  {
    index: 3,
    title: 'Order one-half',
    ariaLabel: 'Order one-half: a curve that climbs steeply and then flattens.',
    headerLaw: 'Rate = k[A]^(1/2)',
    headerUnits: `${KLAW} ${unitsOf(0.5)}`,
    curves: visibility('half', ['zero', 'first', 'second', 'half']),
    points: 'half',
    slope: false,
    decoder: false,
  },
  {
    index: 4,
    title: 'Units decoder',
    ariaLabel: 'Four cards: each order with its rate law and the units of k.',
    headerLaw: 'The units give the order away',
    headerUnits: 'Read the order from the units of k',
    curves: visibility('zero', []),
    points: null,
    slope: false,
    decoder: true,
  },
]

export function getOrderStepState(index: number): OrderStepState {
  const i = Math.min(Math.max(Math.round(index), 0), ORDER_STEPS.length - 1)
  return ORDER_STEPS[i]
}

/** Sampled curve for a mini thumbnail, from [A] = 0 to 1 (inclusive). */
export function thumbnailPoints(order: number, n = 40): ReadonlyArray<readonly [number, number]> {
  const out: Array<readonly [number, number]> = []
  for (let i = 0; i <= n; i++) {
    const a = i / n
    out.push([a, rateAt(order, a)])
  }
  return out
}
