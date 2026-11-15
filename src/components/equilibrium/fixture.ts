import { createElement, Fragment, type ReactNode } from 'react'
import type { TimePoint } from './geometry'
import type { CurvePanel } from './EquilibriumCurves'
import type { IceCell } from './IceTable'
import type { PHMarker } from './PHScale'
import type { SolubilityIon } from './SolubilityBeaker'
import type { VesselSpecies } from './SealedVessel'

/** An italic symbol for HTML text (the .sym class). */
const sym = (text: string): ReactNode => createElement('span', { className: 'sym' }, text)

/** The same symbol inside SVG text, where only <tspan> is valid. */
const symSvg = (text: string): ReactNode => createElement('tspan', { className: 'sym' }, text)

/* ------------------------------------------------------------------ */
/* H₂ + I₂ ⇌ 2HI at 698 K (K ≈ 50), from both sides                    */
/* Concentrations in mol L⁻¹. Equilibrium: [H₂] = [I₂] = 0.22, [HI] = 1.56 */
/* ------------------------------------------------------------------ */

const H2_EQ = 0.22
const HI_EQ = 1.56
const RATE = 0.9
const SAMPLE_T = Array.from({ length: 41 }, (_, i) => i * 0.25)

/** Reactants only: H₂ and I₂ fall to their equilibrium values while HI rises. */
export const HI_FROM_REACTANTS: TimePoint[][] = [
  SAMPLE_T.map((t) => [t, H2_EQ + (1 - H2_EQ) * Math.exp(-RATE * t)] as TimePoint),
  SAMPLE_T.map((t) => [t, HI_EQ * (1 - Math.exp(-RATE * t))] as TimePoint),
]

/** Products only: HI falls and H₂ and I₂ rise to the same equilibrium. */
export const HI_FROM_PRODUCTS: TimePoint[][] = [
  SAMPLE_T.map((t) => [t, H2_EQ * (1 - Math.exp(-RATE * t))] as TimePoint),
  SAMPLE_T.map((t) => [t, HI_EQ + (2 - HI_EQ) * Math.exp(-RATE * t)] as TimePoint),
]

const H2_IN = { id: 'h2', label: symSvg('[H₂]'), color: 'var(--accent)' }
const I2_IN = { id: 'i2', label: symSvg('[I₂]'), color: 'var(--i2)' }
const HI_IN = { id: 'hi', label: symSvg('[HI]'), color: 'var(--fwd)' }

function curveSeries(data: TimePoint[][]) {
  const [h2, hi] = data
  return [
    { ...H2_IN, points: h2 },
    { ...I2_IN, points: h2, dash: '7 5' },
    { ...HI_IN, points: hi },
  ]
}

/** Two panels: approach from reactants (left) and from products (right), converging on the same levels. */
export const H2_I2_PANELS: CurvePanel[] = [
  { title: 'From reactants', series: curveSeries(HI_FROM_REACTANTS) },
  { title: 'From products', series: curveSeries(HI_FROM_PRODUCTS) },
]

/* ------------------------------------------------------------------ */
/* ICE table for H₂ + I₂ ⇌ 2HI                                          */
/* ------------------------------------------------------------------ */

export const ICE_H2_I2 = {
  species: [sym('[H₂]'), sym('[I₂]'), sym('[HI]')],
  initial: [1.0, 1.0, 0] as IceCell[],
  change: [
    createElement(Fragment, null, '−', sym('x')),
    createElement(Fragment, null, '−', sym('x')),
    createElement(Fragment, null, '+2', sym('x')),
  ] as IceCell[],
  equilibrium: [
    createElement(Fragment, null, '1.00 − ', sym('x')),
    createElement(Fragment, null, '1.00 − ', sym('x')),
    createElement(Fragment, null, '2', sym('x')),
  ] as IceCell[],
  rowNotes: { C: createElement(Fragment, null, sym('x'), ' = 0.78') } as Record<'I' | 'C' | 'E', ReactNode>,
}

/* ------------------------------------------------------------------ */
/* Sealed vessels                                                       */
/* ------------------------------------------------------------------ */

export const WATER_VAPOUR_SPECIES: VesselSpecies[] = [
  { id: 'h2o-g', color: 'var(--liquid-edge)', phase: 'gas', label: 'H₂O(g)' },
  { id: 'h2o-l', color: 'var(--accent)', phase: 'liquid', label: 'H₂O(l)' },
]

export const N2O4_SPECIES: VesselSpecies[] = [
  { id: 'n2o4', color: 'var(--fg-subtle)', phase: 'gas', label: 'N₂O₄' },
  { id: 'no2', color: 'var(--no2)', phase: 'gas', label: 'NO₂' },
]

/* ------------------------------------------------------------------ */
/* pH scale markers and examples                                        */
/* ------------------------------------------------------------------ */

export const PH_MARKERS: PHMarker[] = [
  { ph: 2.2, label: 'Lemon juice' },
  { ph: 5.0, label: 'Black coffee' },
  { ph: 7.0, label: 'Pure water' },
  { ph: 8.1, label: 'Sea water' },
  { ph: 11.5, label: 'Household ammonia' },
]

/* ------------------------------------------------------------------ */
/* Solubility                                                           */
/* ------------------------------------------------------------------ */

export const AGCL_IONS = (ag: number, cl: number): SolubilityIon[] => [
  { label: 'Ag⁺', count: ag, color: 'var(--accent)' },
  { label: 'Cl⁻', count: cl, color: 'var(--base)' },
]
