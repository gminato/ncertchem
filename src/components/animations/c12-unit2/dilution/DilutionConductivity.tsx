'use client'

import { Sub, useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import { Beaker, ConductivityCell } from '@/components/vocab'
import {
  ACETATE_LAMBDA0,
  ACETIC_ALPHA,
  ACETIC_C,
  ACETIC_KA,
  ACETIC_LAMBDA0,
  ACETIC_LAMBDA_MEASURED,
  ACETIC_ONE_IN,
  C_CONC,
  C_DILUTE,
  DILUTION_STEPS,
  H_PLUS_LAMBDA0,
  KAPPA_CONC,
  KAPPA_DILUTE,
  KCL_INTERCEPT,
  KCL_POINTS,
  KCL_SLOPE_A,
  LAMBDA_CONC,
  LAMBDA_DILUTE,
  MGCL2_BARS,
  VOLUME_CONC_CM3,
  VOLUME_DILUTE_CM3,
  aceticMolarConductivity,
  clampDilutionStep,
  groupThousands,
  sciNotation,
  signed,
  type ChartDomain,
  type DilutionScene,
} from './dilution-steps'

export interface DilutionConductivityProps {
  step: number
  reducedMotion: boolean
}

/* The SVG is 400 units wide and renders at 340 px on a 390 px phone, so every label is 17 units:
 * 17 × 340 / 400 = 14.5 px. Keep every text element at this size (the e2e asserts it). */
const VIEW_W = 400
const VIEW_H = 440
const LABEL = 17

/* Chart frame, in viewBox units. */
const PX0 = 66
const PX1 = 384
const PY0 = 36
const PY1 = 372

/** Domain of the last chart step; used to hold the axes steady while the chart fades out. */
const HOLD_DOMAIN: ChartDomain = DILUTION_STEPS[3]?.chart ?? { xMax: 0.36, yMin: 0, yMax: 400 }

/** Cell 1 cm × 1 cm: the drawn box and ion centres as fractions of its width and height. */
const CELL = { x: 70, y: 30, w: 220, h: 170 }
const CUBE_IONS: readonly (readonly [number, number])[] = [
  [0.22, 0.22],
  [0.5, 0.22],
  [0.78, 0.22],
  [0.36, 0.45],
  [0.64, 0.45],
  [0.22, 0.66],
  [0.5, 0.66],
  [0.78, 0.66],
  [0.36, 0.86],
  [0.64, 0.86],
]

/** Solute units (one mole, twelve units) placed in each beaker. */
const MOLE_UNITS = 12

/** Molecules drawn in the acetic beaker: one ionised among ACETIC_ONE_IN. */
const MOLECULE_COUNT = ACETIC_ONE_IN

function unitPosition(i: number, cx: number, cy: number, sx: number, sy: number): readonly [number, number] {
  const r = Math.sqrt((i + 0.5) / MOLE_UNITS)
  const theta = i * 2.39996
  return [cx + sx * r * Math.cos(theta), cy + sy * r * Math.sin(theta)]
}

function ionCountOpacity(available: number, i: number): number {
  return Math.min(1, Math.max(0, available - i))
}

function sceneTarget(active: DilutionScene, scene: DilutionScene): number {
  return active === scene ? 1 : 0
}

function niceTicks(lo: number, hi: number, step: number): number[] {
  const out: number[] = []
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) {
    out.push(Number(v.toFixed(6)))
  }
  return out
}

export function DilutionConductivity({ step, reducedMotion }: DilutionConductivityProps) {
  const index = clampDilutionStep(step)
  const spec = DILUTION_STEPS[index] ?? DILUTION_STEPS[0]!
  const t = useAmbientTime(reducedMotion)

  const dom = spec.chart ?? HOLD_DOMAIN
  const xMax = useTweenedNumber(dom.xMax, reducedMotion, 1.0)
  const yMin = useTweenedNumber(dom.yMin, reducedMotion, 1.0)
  const yMax = useTweenedNumber(dom.yMax, reducedMotion, 1.0)

  const dilute = useTweenedNumber(index === 0 ? 1 : 0, reducedMotion, 0.9)
  const cubeO = useTweenedNumber(sceneTarget(spec.scene, 'cube'), reducedMotion, 0.5)
  const volO = useTweenedNumber(sceneTarget(spec.scene, 'volume'), reducedMotion, 0.5)
  const chartO = useTweenedNumber(sceneTarget(spec.scene, 'chart'), reducedMotion, 0.5)
  const barsO = useTweenedNumber(sceneTarget(spec.scene, 'bars'), reducedMotion, 0.5)
  const acidO = useTweenedNumber(sceneTarget(spec.scene, 'acid'), reducedMotion, 0.5)
  const acetic = useTweenedNumber(spec.showAcetic ? 1 : 0, reducedMotion, 0.8)

  const xs = (x: number) => PX0 + (x / xMax) * (PX1 - PX0)
  const ys = (y: number) => PY1 - ((y - yMin) / (yMax - yMin)) * (PY1 - PY0)

  /* ---- Scene 1: the 1 cm cube. The Before bar is full scale; the After bar shows the fall. ---- */
  const kappaLive = KAPPA_CONC + (KAPPA_DILUTE - KAPPA_CONC) * dilute
  const ionsAvailable = 10 - 8 * dilute
  const barX = 20
  const barW = 340
  const barScale = (kappa: number) => (barW * kappa) / KAPPA_CONC

  /* ---- Scene 2: the volume holding one mole (beakers not to scale) ---- */
  const beakerA = { x: 30, y: 40, w: 150, h: 190 }
  const beakerB = { x: 210, y: 22, w: 170, h: 208 }
  const unitsA = Array.from({ length: MOLE_UNITS }, (_, i) => unitPosition(i, 0.5, 0.62, 0.24, 0.2))
  const unitsB = Array.from({ length: MOLE_UNITS }, (_, i) => unitPosition(i, 0.5, 0.6, 0.42, 0.34))

  /* ---- Scene 3 and 4: the chart ---- */
  const xTickStep = xMax > 0.06 ? 0.1 : 0.01
  const yTickStep = yMax - yMin > 100 ? 100 : 4
  const xTicks = niceTicks(0, xMax, xTickStep)
  const yTicks = niceTicks(yMin, yMax, yTickStep)
  const linePts = [0, xMax].map((x) => [xs(x), ys(KCL_INTERCEPT - KCL_SLOPE_A * x)] as const)
  const aceticSamples = Array.from({ length: 70 }, (_, i) => {
    const x = 0.0032 + ((xMax - 0.0032) * i) / 69
    return [x, aceticMolarConductivity(x * x)] as const
  })
  const aceticPath = aceticSamples
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${xs(x).toFixed(1)},${ys(y).toFixed(1)}`)
    .join(' ')
  const aceticLabelC = 0.0025
  const aceticLabelX = Math.sqrt(aceticLabelC)
  const aceticLabelY = aceticMolarConductivity(aceticLabelC)
  const kclLabelX = 0.28
  const kclLabelY = KCL_INTERCEPT - KCL_SLOPE_A * kclLabelX

  /* ---- Scene 4: stacked ion bars (MgCl₂ only) ---- */
  const barRowX = 20
  const barRowW = 340
  const k4 = barRowW / MGCL2_BARS.total
  const mgW = MGCL2_BARS.mg * k4
  const clW = MGCL2_BARS.cl * k4

  /* ---- Scene 5: degree of dissociation (illustrative point) ---- */
  const k5 = 340 / ACETIC_LAMBDA0
  const hW = H_PLUS_LAMBDA0 * k5
  const acW = ACETATE_LAMBDA0 * k5
  const alphaW = barRowW * ACETIC_ALPHA
  const dissociatedIndex = 7
  const molecules = Array.from({ length: MOLECULE_COUNT }, (_, i) => ({
    x: 40 + (i % 6) * 26,
    y: 74 + Math.floor(i / 6) * 22,
  }))

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-label={spec.ariaLabel}
      width="100%"
      style={{ display: 'block', maxWidth: 480 }}
      fontFamily="var(--font-sans)"
      fill="var(--fg)"
      fontSize={LABEL}
    >
      {/* Scene 1: the cube */}
      <g opacity={cubeO} aria-hidden={cubeO < 0.05}>
        <ConductivityCell x={CELL.x} y={CELL.y} width={CELL.w} height={CELL.h} tint="clear" dimensions={false} />
        {CUBE_IONS.map(([fx, fy], i) => {
          const dx = reducedMotion ? 0 : 2.5 * Math.sin(t * 1.4 + i * 1.7)
          const dy = reducedMotion ? 0 : 2.5 * Math.cos(t * 1.1 + i)
          return (
            <g key={i} opacity={ionCountOpacity(ionsAvailable, i)}>
              <circle
                cx={CELL.x + fx * CELL.w + dx}
                cy={CELL.y + fy * CELL.h + dy}
                r={14}
                fill={i % 2 === 0 ? 'var(--ion-cation)' : 'var(--ion-anion)'}
                stroke="var(--surface)"
                strokeWidth={1.5}
              />
              <text
                x={CELL.x + fx * CELL.w + dx}
                y={CELL.y + fy * CELL.h + dy + 6}
                textAnchor="middle"
                fill="var(--surface)"
                fontWeight={600}
              >
                {i % 2 === 0 ? 'K⁺' : 'Cl⁻'}
              </text>
            </g>
          )
        })}
        <text x={200} y={230} textAnchor="middle" fill="var(--fg-muted)">
          Cell: l = 1 cm, A = 1 cm²
        </text>
        <text x={barX} y={266} fill="var(--fg-muted)">
          Before: c = {C_CONC.toFixed(2)} mol L⁻¹
        </text>
        <rect x={barX} y={276} width={barW} height={22} rx={4} fill="var(--fg-subtle)" fillOpacity={0.35} stroke="var(--fg-subtle)" />
        <text x={barX} y={318}>
          κ = {sciNotation(KAPPA_CONC)} S cm⁻¹
        </text>
        <text x={barX} y={346} fill="var(--fg-muted)">
          After: c = {C_DILUTE.toFixed(3)} mol L⁻¹
        </text>
        <rect x={barX} y={356} width={barW} height={22} rx={4} fill="none" stroke="var(--border)" />
        <rect x={barX} y={356} width={Math.max(2, barScale(kappaLive))} height={22} rx={4} fill="var(--current)" />
        <text x={barX} y={398}>
          κ = {sciNotation(kappaLive)} S cm⁻¹
        </text>
        <text x={barX} y={424} fill="var(--fg-subtle)">
          Full bar = {sciNotation(KAPPA_CONC)} S cm⁻¹
        </text>
      </g>

      {/* Scene 2: the volume holding one mole */}
      <g opacity={volO}>
        <Beaker x={beakerA.x} y={beakerA.y} width={beakerA.w} height={beakerA.h} level={0.85} tint="clear" />
        <Beaker x={beakerB.x} y={beakerB.y} width={beakerB.w} height={beakerB.h} level={0.9} tint="clear" />
        {unitsA.map(([u, v], i) => (
          <circle
            key={`a${i}`}
            cx={beakerA.x + u * beakerA.w + (reducedMotion ? 0 : Math.sin(t * 1.2 + i) * 1.5)}
            cy={beakerA.y + v * beakerA.h + (reducedMotion ? 0 : Math.cos(t * 1.3 + i) * 1.5)}
            r={4.5}
            fill="var(--ion-cation)"
          />
        ))}
        {unitsB.map(([u, v], i) => (
          <circle
            key={`b${i}`}
            cx={beakerB.x + u * beakerB.w + (reducedMotion ? 0 : Math.sin(t * 1.2 + i) * 1.5)}
            cy={beakerB.y + v * beakerB.h + (reducedMotion ? 0 : Math.cos(t * 1.3 + i) * 1.5)}
            r={4.5}
            fill="var(--ion-cation)"
          />
        ))}
        <text x={beakerA.x + beakerA.w / 2} y={262} textAnchor="middle">
          c = {C_CONC.toFixed(2)}
        </text>
        <text x={beakerA.x + beakerA.w / 2} y={286} textAnchor="middle">
          V = {groupThousands(VOLUME_CONC_CM3)}
        </text>
        <text x={beakerA.x + beakerA.w / 2} y={310} textAnchor="middle">
          Λm = {LAMBDA_CONC.toFixed(1)}
        </text>
        <text x={beakerB.x + beakerB.w / 2} y={262} textAnchor="middle">
          c = {C_DILUTE.toFixed(3)}
        </text>
        <text x={beakerB.x + beakerB.w / 2} y={286} textAnchor="middle">
          V = {groupThousands(VOLUME_DILUTE_CM3)}
        </text>
        <text x={beakerB.x + beakerB.w / 2} y={310} textAnchor="middle">
          Λm = {LAMBDA_DILUTE.toFixed(1)}
        </text>
        <text x={200} y={352} textAnchor="middle" fill="var(--fg-muted)">
          One mole of solute in each beaker.
        </text>
        <text x={200} y={378} textAnchor="middle" fill="var(--fg-muted)">
          Λm = κV, in S cm² mol⁻¹.
        </text>
        <text x={200} y={404} textAnchor="middle" fill="var(--fg-subtle)">
          Not to scale. κ falls as V grows.
        </text>
      </g>

      {/* Scenes 3 and 4 share the chart frame */}
      <g opacity={chartO}>
        {yTicks.map((v) => (
          <g key={`y${v}`}>
            <line x1={PX0} x2={PX1} y1={ys(v)} y2={ys(v)} stroke="var(--border)" strokeWidth={1} />
            <text x={PX0 - 8} y={ys(v) + 6} textAnchor="end" fill="var(--fg-muted)">
              {v}
            </text>
          </g>
        ))}
        {xTicks.map((v) => (
          <text key={`x${v}`} x={xs(v)} y={PY1 + 24} textAnchor="middle" fill="var(--fg-muted)">
            {v}
          </text>
        ))}
        <line x1={PX0} x2={PX0} y1={PY0} y2={PY1} stroke="var(--fg-muted)" strokeWidth={1.5} />
        <line x1={PX0} x2={PX1} y1={PY1} y2={PY1} stroke="var(--fg-muted)" strokeWidth={1.5} />
        <text x={(PX0 + PX1) / 2} y={PY1 + 50} textAnchor="middle">
          √c (√(mol L⁻¹))
        </text>
        <text transform={`translate(24 ${(PY0 + PY1) / 2}) rotate(-90)`} textAnchor="middle">
          Λ<Sub>m</Sub> / S cm² mol⁻¹
        </text>

        {/* Strong electrolyte line (solid on Step 3, dashed on Step 4) */}
        <line
          x1={linePts[0]![0]}
          y1={linePts[0]![1]}
          x2={linePts[1]![0]}
          y2={linePts[1]![1]}
          stroke="var(--ion-cation)"
          strokeWidth={2}
          strokeDasharray={spec.showAcetic ? '7 6' : undefined}
        />
        {/* Intercept marker at √c = 0. The label sits right of the marker, clear of the acetic curve. */}
        <circle cx={PX0} cy={ys(KCL_INTERCEPT)} r={5} fill="var(--surface)" stroke="var(--ion-cation)" strokeWidth={2} />
        <text
          x={PX0 + 14}
          y={ys(KCL_INTERCEPT) - 14}
          stroke="var(--surface)"
          strokeWidth={4}
          paintOrder="stroke"
        >
          Λ°m ≈ {signed(KCL_INTERCEPT, 1)}
        </text>
        {KCL_POINTS.map((p) => (
          <circle key={p.c} cx={xs(p.x)} cy={ys(p.lambdaScm2)} r={6} fill="var(--ion-cation)" stroke="var(--surface)" strokeWidth={1.5} />
        ))}
        <text x={PX1 - 8} y={PY0 + 22} textAnchor="end">
          Λm = Λ°m − A√c
        </text>
        <text x={PX1 - 8} y={PY0 + 46} textAnchor="end">
          A ≈ {KCL_SLOPE_A.toFixed(1)} (slope = −A)
        </text>

        {/* Weak electrolyte curve (Step 4) */}
        <g opacity={acetic}>
          <path d={aceticPath} fill="none" stroke="var(--ion-anion)" strokeWidth={2.5} strokeLinejoin="round" />
          <text x={xs(aceticLabelX) + 10} y={ys(aceticLabelY) - 10} fill="var(--ion-anion)">
            CH₃COOH
          </text>
          <text x={xs(kclLabelX)} y={ys(kclLabelY) + 28} textAnchor="middle" fill="var(--ion-cation)">
            KCl (dashed)
          </text>
        </g>
      </g>

      {/* Scene 4: ion bars for MgCl₂ */}
      <g opacity={barsO}>
        <text x={barRowX} y={116} fontSize={LABEL + 2} fontWeight={600}>
          MgCl₂
        </text>
        <rect x={barRowX} y={128} width={mgW} height={84} fill="var(--ion-cation)" stroke="var(--surface)" strokeWidth={1.5} />
        <text x={barRowX + mgW / 2} y={162} textAnchor="middle" fill="var(--surface)">
          Mg²⁺
        </text>
        <text x={barRowX + mgW / 2} y={188} textAnchor="middle" fill="var(--surface)">
          {MGCL2_BARS.mg.toFixed(1)}
        </text>
        {[0, 1].map((k) => {
          const x = barRowX + mgW + k * clW
          return (
            <g key={k}>
              <rect x={x} y={128} width={clW} height={84} fill="var(--ion-anion)" stroke="var(--surface)" strokeWidth={1.5} />
              <text x={x + clW / 2} y={162} textAnchor="middle" fill="var(--surface)">
                Cl⁻
              </text>
              <text x={x + clW / 2} y={188} textAnchor="middle" fill="var(--surface)">
                {MGCL2_BARS.cl.toFixed(1)}
              </text>
            </g>
          )
        })}
        <text x={barRowX} y={240}>
          Λ°m(MgCl₂) = 106.0 + 2 × 76.3
        </text>
        <text x={barRowX} y={266}>
          = {MGCL2_BARS.total.toFixed(1)} S cm² mol⁻¹
        </text>
        <text x={barRowX} y={318} fill="var(--fg-subtle)">
          Each ion bar stands alone.
        </text>
        <text x={barRowX} y={344} fill="var(--fg-subtle)">
          The Cl⁻ bar serves any chloride.
        </text>
        <text x={barRowX} y={370} fill="var(--fg-subtle)">
          Bars from Table 2.4.
        </text>
      </g>

      {/* Scene 5: degree of dissociation */}
      <g opacity={acidO}>
        <Beaker x={20} y={28} width={170} height={190} level={0.82} tint="clear" />
        {molecules.map((m, i) =>
          i === dissociatedIndex ? null : (
            <circle key={i} cx={m.x} cy={m.y} r={5} fill="var(--fg-subtle)" fillOpacity={0.75} />
          ),
        )}
        <circle cx={molecules[dissociatedIndex]!.x - 6} cy={molecules[dissociatedIndex]!.y} r={5.5} fill="var(--ion-cation)" />
        <circle cx={molecules[dissociatedIndex]!.x + 6} cy={molecules[dissociatedIndex]!.y} r={5.5} fill="var(--ion-anion)" />
        <text x={barRowX} y={240} fill="var(--fg-muted)">
          CH₃COOH(aq), {ACETIC_C.toFixed(4)} mol L⁻¹
        </text>

        <text x={212} y={70}>
          Λm = {ACETIC_LAMBDA_MEASURED.toFixed(1)}
        </text>
        <text x={212} y={96} fill="var(--fg-muted)">
          Λ°m = {ACETIC_LAMBDA0.toFixed(1)}
        </text>
        <text x={212} y={122}>
          α = {ACETIC_ALPHA.toFixed(4)}
        </text>
        <text x={212} y={148} fill="var(--fg-muted)">
          1 in {ACETIC_ONE_IN} ionised
        </text>

        <rect x={barRowX} y={262} width={hW} height={36} fill="var(--ion-cation)" />
        <text x={barRowX + hW / 2} y={286} textAnchor="middle" fill="var(--surface)">
          H⁺ {H_PLUS_LAMBDA0.toFixed(1)}
        </text>
        <rect x={barRowX + hW} y={262} width={acW} height={36} fill="var(--ion-anion)" />
        <text x={barRowX + barRowW} y={320} textAnchor="end" fill="var(--ion-anion)">
          CH₃COO⁻ {ACETATE_LAMBDA0.toFixed(1)}
        </text>
        <text x={barRowX} y={320} fill="var(--fg-muted)">
          Λ°m bar, S cm² mol⁻¹
        </text>

        <rect x={barRowX} y={352} width={barRowW} height={18} rx={4} fill="none" stroke="var(--border)" />
        <rect x={barRowX} y={352} width={Math.max(2, alphaW)} height={18} rx={4} fill="var(--current)" />
        <text x={barRowX} y={392} fill="var(--fg-muted)">
          Filled part: α = {ACETIC_ALPHA.toFixed(4)}
        </text>

        <text x={barRowX} y={424}>
          Ka = cα²/(1 − α) = {sciNotation(ACETIC_KA)}
        </text>
      </g>
    </svg>
  )
}
