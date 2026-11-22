'use client'

import type { CSSProperties } from 'react'
import { Sub } from '@/components/animations/c12-unit1/ChemSvg'
import { PlotFrame, PlotLine, PlotCurve, PlotPoint, PlotShade, maxwellBoltzmann, smoothThrough } from '@/components/vocab'
import { DH_KJ, EA_CAT_KJ, EA_UNCAT_KJ, CAT_FIRST_HUMP_KJ, CAT_VALLEY_KJ, T_K, UPHILL_PRODUCTS_KJ, catalystNumbers, catalystStep, type CatalystStep } from './catalyst-steps'

export interface CatalystPathwayProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

const VB_W = 580
const VB_H = 404
const AXIS_X = 70
const AXIS_Y = 345
const BASE_Y = 330

/** Energy (kJ mol⁻¹) to SVG y. Reactants at zero; the lowest drawn level is 30 units above the axis. */
const yOf = (e: number) => BASE_Y - (e + 30) * 2.7

const Ea = () => (
  <>
    <tspan className="sym">E</tspan>
    <Sub>a</Sub>
  </>
)

const DeltaRH = () => (
  <>
    <tspan className="sym">Δ</tspan>
    <Sub>r</Sub>
    <tspan className="sym">H</tspan>
  </>
)

const TRANSITION_MS = 600

/** Opacity group: fades in and out between Steps; reduced motion cuts. */
function fade(on: boolean, reducedMotion: boolean, opacity = 1): CSSProperties {
  return { opacity: on ? opacity : 0, transition: reducedMotion ? 'none' : `opacity ${TRANSITION_MS}ms ease` }
}

/** Vertical arrow whose head sits at y2 (points up when y2 < y1). */
function Arrow({ x, y1, y2, tone }: { x: number; y1: number; y2: number; tone: string }) {
  const dir = Math.sign(y2 - y1)
  const base = y2 - dir * 8
  return (
    <g stroke={tone} fill={tone} strokeWidth={2}>
      <line x1={x} x2={x} y1={y1} y2={base} strokeLinecap="round" />
      <path d={`M${x - 5} ${base} L${x} ${y2} L${x + 5} ${base} Z`} stroke="none" />
    </g>
  )
}

function EnergyAxes() {
  return (
    <g stroke="var(--kin-axis)" fill="var(--kin-axis)" strokeWidth={1.6}>
      <line x1={AXIS_X} x2={AXIS_X} y1={28} y2={AXIS_Y} />
      <path d={`M${AXIS_X - 4} 36 L${AXIS_X} 28 L${AXIS_X + 4} 36 Z`} stroke="none" />
      <line x1={AXIS_X} x2={560} y1={AXIS_Y} y2={AXIS_Y} />
      <path d={`M552 ${AXIS_Y - 4} L560 ${AXIS_Y} L552 ${AXIS_Y + 4} Z`} stroke="none" />
      <text transform={`translate(24 186) rotate(-90)`} textAnchor="middle" fontSize={15} fill="var(--fg)" stroke="none">
        potential energy / kJ mol⁻¹
      </text>
      <text x={315} y={378} textAnchor="middle" fontSize={15} fill="var(--fg)" stroke="none">
        reaction coordinate
      </text>
    </g>
  )
}

const LABEL_HALO = { stroke: 'var(--surface)', strokeWidth: 4, paintOrder: 'stroke' } as const

/** Energy profile for the downhill (products below reactants) and uphill scenes. */
function EnergyScene({ step, products, reducedMotion }: { step: CatalystStep; products: number; reducedMotion: boolean }) {
  const y0 = yOf(0)
  const yP = yOf(products)
  const yPeak = yOf(EA_UNCAT_KJ)
  const yCat = yOf(EA_CAT_KJ)
  const uncat = [
    { x: 80, y: y0 },
    { x: 170, y: y0 },
    { x: 270, y: yPeak },
    { x: 420, y: yP },
    { x: 540, y: yP },
  ]
  const cat = [
    { x: 80, y: y0 },
    { x: 170, y: y0 },
    { x: 200, y: yOf(CAT_FIRST_HUMP_KJ) },
    { x: 230, y: yOf(CAT_VALLEY_KJ) },
    { x: 270, y: yCat },
    { x: 420, y: yP },
    { x: 540, y: yP },
  ]
  const uphill = products > 0
  const backwardUncatTop = yOf(EA_UNCAT_KJ)
  const backwardCatTop = yOf(EA_CAT_KJ)
  const numbers = catalystNumbers()

  return (
    <g>
      <EnergyAxes />

      {/* Reactant and product level guides */}
      <g stroke="var(--kin-axis)" strokeWidth={1} strokeDasharray="3 4" opacity={0.7}>
        <line x1={AXIS_X + 4} x2={560} y1={y0} y2={y0} />
        <line x1={AXIS_X + 4} x2={560} y1={yP} y2={yP} />
      </g>

      {/* Catalysed route: the second, lower pathway between the same end levels */}
      <g style={fade(step.catalysed, reducedMotion)}>
        <path d={smoothThrough(cat)} fill="none" stroke="var(--kin-catalyst)" strokeWidth={2.6} strokeDasharray="8 6" strokeLinecap="round" />
      </g>

      {/* Uncatalysed route: one hump, faint once the catalysed route is drawn */}
      <g style={fade(true, reducedMotion, step.uncatFaint ? 0.3 : 1)}>
        <path d={smoothThrough(uncat)} fill="none" stroke="var(--accent)" strokeWidth={3.2} strokeLinecap="round" />
      </g>

      {/* Eₐ of the uncatalysed route, drawn under its hump */}
      <g style={fade(step.showEaArrow, reducedMotion)}>
        <Arrow x={270} y1={y0} y2={yPeak} tone="var(--fg)" />
        <text x={280} y={y0 - 70} fontSize={15} fill="var(--fg)" {...LABEL_HALO}>
          <Ea />
        </text>
      </g>

      {/* Backward barriers, from the product level up to each peak */}
      <g style={fade(step.showBackward, reducedMotion)}>
        <Arrow x={470} y1={yP} y2={backwardUncatTop} tone="var(--fg)" />
        <text x={470} y={backwardUncatTop - 10} textAnchor="middle" fontSize={15} fill="var(--fg)" {...LABEL_HALO}>
          {numbers.backwardUncatKJ}
        </text>
        <Arrow x={510} y1={yP} y2={backwardCatTop} tone="var(--kin-catalyst)" />
        <text x={510} y={backwardCatTop - 10} textAnchor="middle" fontSize={15} fill="var(--kin-catalyst)" {...LABEL_HALO}>
          {numbers.backwardCatKJ}
        </text>
      </g>

      {/* ΔrH, drawn between the two levels on the right */}
      <g style={fade(step.showDh, reducedMotion)}>
        <Arrow x={556} y1={y0} y2={yP} tone="var(--fg)" />
        <text x={540} y={yP + 22} textAnchor="end" fontSize={15} fill="var(--fg)" {...LABEL_HALO}>
          <DeltaRH /> = −20 kJ mol⁻¹
        </text>
      </g>

      {/* Level and state labels */}
      <text x={80} y={y0 - 10} fontSize={15} fill="var(--fg)" {...LABEL_HALO}>
        reactants
      </text>
      <g style={fade(!step.showBackward, reducedMotion)}>
        <text x={540} y={yP - 10} textAnchor="end" fontSize={15} fill="var(--fg)" {...LABEL_HALO}>
          products
        </text>
      </g>
      <g style={fade(step.catalysed && !uphill, reducedMotion)}>
        <text x={236} y={yOf(CAT_VALLEY_KJ) + 40} fontSize={15} fill="var(--kin-catalyst)" {...LABEL_HALO}>
          intermediate
        </text>
      </g>
      {uphill && (
        <text x={540} y={yP + 22} textAnchor="end" fontSize={15} fill="var(--fg)" {...LABEL_HALO}>
          products above reactants
        </text>
      )}

      {/* Legend, top right: the Eₐ values of each route and the rate factor */}
      <g fontSize={15} textAnchor="end" strokeWidth={0}>
        <text x={560} y={24} fill="var(--accent)">
          uncatalysed: <Ea /> = {EA_UNCAT_KJ} kJ mol⁻¹
        </text>
        <g style={fade(step.catalysed, reducedMotion)}>
          <text x={560} y={42} fill="var(--kin-catalyst)">
            catalysed: <Ea /> = {EA_CAT_KJ} kJ mol⁻¹
          </text>
        </g>
        <g style={fade(step.showBackward, reducedMotion)}>
          <text x={560} y={60} fill="var(--fg)">
            both directions ×{numbers.rateFactor}
          </text>
        </g>
      </g>
    </g>
  )
}

/** Maxwell–Boltzmann curve at 298 K with the two thresholds; the tails are schematic (enlarged). */
function BoltzmannScene({ on, reducedMotion }: { on: boolean; reducedMotion: boolean }) {
  const numbers = catalystNumbers()
  const mb = (E: number) => maxwellBoltzmann(E, 1)
  const tailUncat = 2.6
  const tailCat = 2.2
  return (
    <g style={fade(on, reducedMotion)}>
      <PlotFrame
        x={AXIS_X}
        y={30}
        width={490}
        height={300}
        domain={{ xMin: 0, xMax: 5, yMin: 0, yMax: 0.6 }}
        xTicks={[]}
        yTicks={[]}
        xTitle={<>kinetic energy, schematic scale (T = {T_K} K)</>}
        yTitle="fraction of molecules"
      >
        <PlotCurve fn={mb} from={0} to={5} tone="neutral" width={3} />
        <PlotShade fn={mb} from={tailUncat} to={5} tone="accent" opacity={0.25} />
        <PlotShade fn={mb} from={tailCat} to={5} tone="catalyst" opacity={0.4} />
        <PlotLine from={{ x: tailUncat, y: 0 }} to={{ x: tailUncat, y: mb(tailUncat) }} tone="accent" dashed />
        <PlotLine from={{ x: tailCat, y: 0 }} to={{ x: tailCat, y: mb(tailCat) }} tone="catalyst" />
        <PlotPoint at={{ x: tailCat, y: mb(tailCat) }} tone="catalyst" side="ne" label={`${EA_CAT_KJ} kJ mol⁻¹: ${numbers.fractionCat}`} />
        <PlotPoint at={{ x: tailUncat, y: mb(tailUncat) }} tone="accent" side="ne" label={`${EA_UNCAT_KJ} kJ mol⁻¹: ${numbers.fractionUncat}`} />
      </PlotFrame>
      <text x={AXIS_X} y={393} fontSize={14} fill="var(--fg)" opacity={0.85}>
        Schematic: the shaded tails are enlarged. The labels give e^(−Eₐ/RT) at 298 K.
      </text>
    </g>
  )
}

export function CatalystPathway({ step, reducedMotion }: CatalystPathwayProps) {
  const s = catalystStep(step)
  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} role="img" aria-label={s.ariaLabel} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <g style={fade(s.scene === 'downhill', reducedMotion)}>
        <EnergyScene step={s} products={DH_KJ} reducedMotion={reducedMotion} />
      </g>
      <g style={fade(s.scene === 'uphill', reducedMotion)}>
        <EnergyScene step={s} products={UPHILL_PRODUCTS_KJ} reducedMotion={reducedMotion} />
      </g>
      <BoltzmannScene on={s.scene === 'mb'} reducedMotion={reducedMotion} />
    </svg>
  )
}
