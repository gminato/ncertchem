'use client'

import type { ReactNode } from 'react'
import { useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import {
  CollisionFlash,
  EnergyProfile,
  MoleculeSprite,
  Particle,
  PlotCurve,
  PlotFrame,
  PlotLine,
  PlotPoint,
  PlotShade,
  PlotSlopeTriangle,
  ReactionBox,
  VocabDefs,
  maxwellBoltzmann,
  usePlotScale,
} from '@/components/vocab'
import {
  EA_DRAWN,
  LABELS,
  LN_DOMAIN,
  LN_SLOPE_PLOT,
  PEAK_LEVEL,
  PRODUCT_LEVEL,
  REACTANT_LEVEL,
  SPREAD,
  THETA_REF,
  getArrheniusStepState,
  lnKPoint,
} from './arrhenius-steps'

export interface ArrheniusEnergyProps {
  step: number
  reducedMotion: boolean
}

const W = 580
const H = 528
const MB_X_MAX = 6
const THETA_2 = THETA_REF * SPREAD

/** A symbol in SVG text, in the KaTeX-italic style used across the site, with Eₐ's subscript. */
function Ea() {
  return (
    <>
      <tspan className="sym">E</tspan>ₐ
    </>
  )
}

/** A text label at a data point of the surrounding PlotFrame. */
function PlotText({ at, anchor = 'start', dy = 0, children }: { at: { x: number; y: number }; anchor?: 'start' | 'middle' | 'end'; dy?: number; children: ReactNode }) {
  const s = usePlotScale()
  return (
    <text x={s.x(at.x)} y={s.y(at.y) + dy} fontSize={15} textAnchor={anchor} fill="var(--fg)" fontFamily="var(--font-sans)">
      {children}
    </text>
  )
}

/** Fades a whole scene in or out; reduced motion cuts straight to the target. */
function Scene({ on, reducedMotion, children }: { on: 0 | 1; reducedMotion: boolean; children: ReactNode }) {
  return <g style={{ opacity: on, transition: reducedMotion ? 'none' : 'opacity 600ms ease' }}>{children}</g>
}

function minusFormat(v: number, digits: number): string {
  return v.toFixed(digits).replace('-', '−')
}

/** Peak height of the dimensionless distribution with parameter θ (the peak sits at θ/2). */
function peakOf(theta: number): number {
  return maxwellBoltzmann(theta / 2, theta)
}

/** Area under a curve from Eₐ to the axis, filled with a diagonal hatch so it never blends with the 298 K tail. */
function HatchTail({ fn, from, to, id }: { fn: (E: number) => number; from: number; to: number; id: string }) {
  const s = usePlotScale()
  const base = s.domain.yMin
  const n = 120
  const xs = Array.from({ length: n + 1 }, (_, i) => from + ((to - from) * i) / n)
  const top = xs.map((v, i) => `${i === 0 ? 'M' : 'L'}${s.x(v).toFixed(2)} ${s.y(fn(v)).toFixed(2)}`).join(' ')
  const d = `${top} L${s.x(to).toFixed(2)} ${s.y(base).toFixed(2)} L${s.x(from).toFixed(2)} ${s.y(base).toFixed(2)} Z`
  return (
    <>
      <defs>
        <pattern id={id} patternUnits="userSpaceOnUse" width={7} height={7} patternTransform="rotate(45)">
          <rect width={7} height={7} fill="var(--kin-product)" fillOpacity={0.14} />
          <line x1={0} y1={0} x2={0} y2={7} stroke="var(--kin-product)" strokeWidth={2.6} />
        </pattern>
      </defs>
      <path d={d} fill={`url(#${id})`} stroke="none" />
    </>
  )
}

/** Scene 1: H₂ and I₂ drift in a sealed box; one collision holds as the complex and HI forms. */
function MoleculeScene({ t, on, reducedMotion }: { t: number; on: 0 | 1; reducedMotion: boolean }) {
  const hx = 130 + 30 * Math.sin(0.9 * t + 0.3)
  const hy = 150 + 22 * Math.cos(0.7 * t)
  const ix = 370 + 26 * Math.cos(0.8 * t + 1)
  const iy = 200 + 20 * Math.sin(0.6 * t)
  return (
    <Scene on={on} reducedMotion={reducedMotion}>
      <ReactionBox x={30} y={30} width={520} height={400} radius={20}>
        <CollisionFlash x={230} y={110} size={20} effective={false} />
        <CollisionFlash x={150} y={300} size={20} effective={false} />
        <MoleculeSprite formula="H2" x={hx} y={hy} scale={1.5} defsPrefix="arr-h2" />
        <text x={hx} y={hy + 56} textAnchor="middle" fontSize={15} fill="var(--fg)" fontFamily="var(--font-sans)">H₂</text>
        <Particle x={ix - 12} y={iy} r={13} tone="neutral" />
        <Particle x={ix + 12} y={iy} r={13} tone="neutral" />
        <text x={ix} y={iy + 52} textAnchor="middle" fontSize={15} fill="var(--fg)" fontFamily="var(--font-sans)">I₂</text>
        <CollisionFlash x={300} y={230} size={28} effective />
        <text x={300} y={276} textAnchor="middle" fontSize={15} fill="var(--fg)" fontFamily="var(--font-sans)">activated complex</text>
        <Particle x={410} y={320} r={14} tone="product" />
        <Particle x={436} y={320} r={14} tone="product" />
        <text x={423} y={370} textAnchor="middle" fontSize={15} fill="var(--fg)" fontFamily="var(--font-sans)">2HI</text>
      </ReactionBox>
      <text x={W / 2} y={462} textAnchor="middle" fontSize={15} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
        Only energetic meetings lead to product.
      </text>
    </Scene>
  )
}

/** Scene 2: the energy barrier from the reactants up to the activated complex, down to the products. */
function ProfileScene({ on, reducedMotion }: { on: 0 | 1; reducedMotion: boolean }) {
  return (
    <Scene on={on} reducedMotion={reducedMotion}>
      <EnergyProfile
        x={30}
        y={30}
        width={520}
        height={400}
        reactant={REACTANT_LEVEL}
        product={PRODUCT_LEVEL}
        peak={PEAK_LEVEL}
        reactantsLabel="H₂ + I₂"
        peakLabel="activated complex"
        productsLabel="2HI"
        eaLabel={<Ea />}
        dhLabel={<>Δ<tspan baseline-shift="sub" fontSize="70%">r</tspan><tspan className="sym">H</tspan></>}
        xTitle="reaction coordinate"
        yTitle="potential energy"
      />
    </Scene>
  )
}

/**
 * Scenes 3 and 4: the Maxwell–Boltzmann curve at 298 K, and the 308 K curve over it.
 * The tails are enlarged (schematic); the printed fractions are the Arrhenius values.
 */
function DistributionScene({ on, reducedMotion, second }: { on: 0 | 1; reducedMotion: boolean; second: 0 | 1 }) {
  const yMax = Math.max(peakOf(THETA_REF), peakOf(THETA_2)) * 1.14
  const f1 = (E: number) => maxwellBoltzmann(E, THETA_REF)
  const f2 = (E: number) => maxwellBoltzmann(E, THETA_2)
  const tailTop = yMax * 0.17
  return (
    <Scene on={on} reducedMotion={reducedMotion}>
      <PlotFrame
        x={50}
        y={30}
        width={490}
        height={400}
        domain={{ xMin: 0, xMax: MB_X_MAX, yMin: 0, yMax }}
        yTickFormat={(v) => v.toFixed(2)}
        xTickFormat={(v) => String(Math.round(v))}
        xTitle="kinetic energy, E (schematic units)"
        yTitle="fraction of molecules, f(E)"
      >
        <PlotShade fn={f1} from={EA_DRAWN} to={MB_X_MAX} tone="reactant" opacity={0.32} />
        <PlotLine from={{ x: EA_DRAWN, y: 0 }} to={{ x: EA_DRAWN, y: yMax * 0.92 }} tone="neutral" dashed width={1.6} />
        <PlotCurve fn={f1} from={0} to={MB_X_MAX} samples={240} tone="reactant" width={3} />
        <PlotText at={{ x: EA_DRAWN + 0.08, y: yMax * 0.95 }}>
          <Ea />
        </PlotText>
        <PlotText at={{ x: 1, y: peakOf(THETA_REF) * 1.05 }} anchor="middle">
          298 K
        </PlotText>
        <PlotText at={{ x: 2.4, y: tailTop }}>fraction above Eₐ</PlotText>
        <PlotText at={{ x: 2.4, y: tailTop }} dy={20}>
          = {LABELS.fractionRef}
        </PlotText>
        <g style={{ opacity: second, transition: reducedMotion ? 'none' : 'opacity 600ms ease' }}>
          <HatchTail fn={f2} from={EA_DRAWN} to={MB_X_MAX} id="arr-hatch-308" />
          <PlotCurve fn={f2} from={0} to={MB_X_MAX} samples={240} tone="product" width={3} />
          <PlotText at={{ x: THETA_2 / 2, y: peakOf(THETA_2) * 1.05 }} anchor="middle">
            308 K
          </PlotText>
          <PlotText at={{ x: 2.4, y: tailTop }} dy={44}>true ratio × {LABELS.ratio} for +10 K</PlotText>
        </g>
      </PlotFrame>
      <text x={60} y={500} fontSize={14} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
        Schematic: the tails are drawn enlarged, not to scale.
      </text>
      <text x={60} y={520} fontSize={14} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
        The printed values are the Arrhenius fractions.
      </text>
    </Scene>
  )
}

/** Scene 5: ln k against 1/T is one straight line; its slope gives −Eₐ/R and its intercept gives ln A. */
function LineScene({ on, reducedMotion }: { on: 0 | 1; reducedMotion: boolean }) {
  const p = lnKPoint(298)
  const yAt = (x: number) => p.y + LN_SLOPE_PLOT * (x - p.x)
  const minorX = 3.15
  return (
    <Scene on={on} reducedMotion={reducedMotion}>
      <PlotFrame
        x={70}
        y={30}
        width={470}
        height={400}
        domain={LN_DOMAIN}
        xTicks={[3.1, 3.2, 3.3, 3.4]}
        yTicks={[-9, -8, -7, -6]}
        xTickFormat={(v) => v.toFixed(1)}
        yTickFormat={(v) => minusFormat(v, 0)}
        xTitle="1/T / 10⁻³ K⁻¹"
        yTitle="ln(k / s⁻¹)"
      >
        <PlotLine through={p} slope={LN_SLOPE_PLOT} tone="neutral" width={2.4} />
        <PlotPoint at={lnKPoint(298)} tone="reactant" label="298 K" side="ne" />
        <PlotPoint at={lnKPoint(308)} tone="accent" label="308 K" side="ne" />
        <PlotPoint at={lnKPoint(318)} tone="product" label="318 K" side="ne" />
        <PlotSlopeTriangle at={{ x: minorX, y: yAt(minorX) }} dx={0.1} slope={LN_SLOPE_PLOT} dxLabel="Δ(1/T)" dyLabel="Δ ln k" tone="neutral" />
        <PlotText at={{ x: 3.11, y: -6.25 }}>
          slope = −Eₐ/R = {LABELS.slope} K
        </PlotText>
      </PlotFrame>
      <text x={70} y={500} fontSize={14} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
        Intercept (off the chart): ln A = {LABELS.intercept}, so A = {LABELS.A} s⁻¹.
      </text>
    </Scene>
  )
}

export function ArrheniusEnergy({ step, reducedMotion }: ArrheniusEnergyProps) {
  const t = useAmbientTime(reducedMotion)
  const s = getArrheniusStepState(step)
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label="Arrhenius scene: molecules colliding, the energy barrier, the Maxwell–Boltzmann curve at two temperatures, and the ln k line against 1/T"
      style={{ display: 'block', height: 'auto' }}
    >
      <VocabDefs />
      <MoleculeScene t={reducedMotion ? 0 : t} on={s.box} reducedMotion={reducedMotion} />
      <ProfileScene on={s.profile} reducedMotion={reducedMotion} />
      <DistributionScene on={s.mbFirst} reducedMotion={reducedMotion} second={s.mbSecond} />
      <LineScene on={s.line} reducedMotion={reducedMotion} />
    </svg>
  )
}
