'use client'

import { Sub, useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import { Beaker, ConductivityCell, Ion } from '@/components/vocab'
import {
  ACETIC_C,
  ACETIC_LAMBDA0,
  ACETIC_LAMBDA_MEASURED,
  ACETIC_ALPHA,
  ACETIC_KA,
  C_CONC,
  C_DILUTE,
  CACL2_BARS,
  DILUTION_STEPS,
  KAPPA_CONC,
  KAPPA_DILUTE,
  KCL_FIT,
  KCL_POINTS,
  LAMBDA_CONC,
  LAMBDA_DILUTE,
  MGSO4_BARS,
  aceticMolarConductivity,
  clampDilutionStep,
  litresPerMole,
  sciNotation,
  signed,
  type ChartDomain,
  type DilutionScene,
} from './dilution-steps'

export interface DilutionConductivityProps {
  step: number
  reducedMotion: boolean
}

const VIEW_W = 580
const VIEW_H = 520

/* Chart frame, in viewBox units. */
const PX0 = 96
const PX1 = 548
const PY0 = 50
const PY1 = 430

/** Domain of the last chart step; used to hold the axes steady while the chart fades out. */
const HOLD_DOMAIN: ChartDomain = DILUTION_STEPS[2]?.chart ?? { xMax: 0.036, yMin: 140, yMax: 152 }

/** Ion positions inside the 1 cm cube (centres), ten in all. */
const CUBE_IONS: readonly (readonly [number, number])[] = [
  [110, 182],
  [215, 182],
  [160, 226],
  [265, 226],
  [110, 270],
  [215, 270],
  [160, 314],
  [265, 314],
  [110, 340],
  [215, 340],
]

/** Solute units (one mole, twelve units) placed in each beaker. */
const MOLE_UNITS = 12

/** Maps the cube's ion layout (drawn for a 300-wide cell at x 40) onto the 260-wide cell at x 90. */
function cubeX(x: number): number {
  return 90 + (x - 40) * (260 / 300)
}

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

  /* ---- Scene 1: the 1 cm cube ---- */
  const kappaLive = KAPPA_CONC + (KAPPA_DILUTE - KAPPA_CONC) * dilute
  const ionsAvailable = 10 - 8 * dilute
  const barW = 170
  const barScale = (kappa: number) => (barW * kappa) / KAPPA_CONC

  /* ---- Scene 2: the volume holding one mole ---- */
  const beakerA = { x: 40, y: 130, w: 190, h: 230 }
  const beakerB = { x: 330, y: 100, w: 220, h: 270 }
  const unitsA = Array.from({ length: MOLE_UNITS }, (_, i) => unitPosition(i, 0.5, 0.62, 0.24, 0.2))
  const unitsB = Array.from({ length: MOLE_UNITS }, (_, i) => unitPosition(i, 0.5, 0.6, 0.42, 0.34))

  /* ---- Scene 3: the chart ---- */
  const xTickStep = xMax > 0.06 ? 0.04 : 0.01
  const yTickStep = yMax - yMin > 100 ? 100 : 4
  const xTicks = niceTicks(0, xMax, xTickStep)
  const yTicks = niceTicks(yMin, yMax, yTickStep)
  const linePts = [0, xMax].map((x) => [xs(x), ys(KCL_FIT.lambda0Scm2 - KCL_FIT.A * x)] as const)
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

  /* ---- Scene 4: stacked ion bars ---- */
  const k4 = 0.95
  const X0 = 170

  /* ---- Scene 5: degree of dissociation ---- */
  const k5 = 0.717
  const A0 = 250
  const acidBarTotal = ACETIC_LAMBDA0 * k5
  const fracPx = ACETIC_LAMBDA_MEASURED * k5
  const dissociatedIndex = 7
  const molecules = Array.from({ length: 24 }, (_, i) => ({
    x: 62 + (i % 6) * 26,
    y: 186 + Math.floor(i / 6) * 34,
  }))

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-label={spec.ariaLabel}
      width="100%"
      style={{ display: 'block', maxWidth: VIEW_W }}
      fontFamily="var(--font-sans)"
      fill="var(--fg)"
    >
      {/* Scene 1: the cube */}
      <g opacity={cubeO} aria-hidden={cubeO < 0.05}>
        <ConductivityCell
          x={90}
          y={120}
          width={260}
          height={250}
          tint="clear"
          lengthLabel="l = 1 cm"
          areaLabel="A = 1 cm²"
          dimensions
        />
        {CUBE_IONS.map(([x0, y], i) => {
          const x = cubeX(x0)
          const dx = reducedMotion ? 0 : 2.5 * Math.sin(t * 1.4 + i * 1.7)
          const dy = reducedMotion ? 0 : 2.5 * Math.cos(t * 1.1 + i)
          return (
            <g key={i} opacity={ionCountOpacity(ionsAvailable, i)}>
              <Ion
                x={x + dx}
                y={y + dy}
                kind={i % 2 === 0 ? 'cation' : 'anion'}
                formula={i % 2 === 0 ? 'K' : 'Cl'}
                charge={i % 2 === 0 ? '+' : '-'}
                fontSize={14}
              />
            </g>
          )
        })}
        <text x={380} y={150} fontSize={15} fill="var(--fg-muted)">
          Before: 0.000989 mol L⁻¹
        </text>
        <rect x={380} y={162} width={barW} height={24} rx={4} fill="none" stroke="var(--fg-subtle)" strokeDasharray="5 4" />
        <rect x={380} y={162} width={barScale(KAPPA_CONC)} height={24} rx={4} fill="var(--fg-subtle)" fillOpacity={0.35} />
        <text x={380} y={206} fontSize={15}>
          κ = {sciNotation(KAPPA_CONC)} S cm⁻¹
        </text>
        <text x={380} y={262} fontSize={15} fill="var(--fg-muted)">
          After five-fold dilution
        </text>
        <rect x={380} y={274} width={barW} height={24} rx={4} fill="none" stroke="var(--border)" />
        <rect x={380} y={274} width={Math.max(2, barScale(kappaLive))} height={24} rx={4} fill="var(--current)" />
        <text x={380} y={318} fontSize={15}>
          κ = {sciNotation(kappaLive)} S cm⁻¹
        </text>
        <text x={380} y={354} fontSize={14} fill="var(--fg-muted)">
          Fewer ions per cm³
        </text>
        <text x={190} y={404} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
          KCl(aq) between two electrodes
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
        <text x={135} y={398} textAnchor="middle" fontSize={15}>
          V = {Math.floor(litresPerMole(C_CONC))} L
        </text>
        <text x={135} y={422} textAnchor="middle" fontSize={15}>
          Λm = {LAMBDA_CONC.toFixed(2)}
        </text>
        <text x={440} y={398} textAnchor="middle" fontSize={15}>
          V = {Math.floor(litresPerMole(C_DILUTE))} L
        </text>
        <text x={440} y={422} textAnchor="middle" fontSize={15}>
          Λm = {LAMBDA_DILUTE.toFixed(2)}
        </text>
        <text x={290} y={466} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
          One mole of solute in each beaker. Λm = κ × V, in S cm² mol⁻¹.
        </text>
        <text x={290} y={492} textAnchor="middle" fontSize={14} fill="var(--fg-subtle)">
          Beaker sizes are not to scale. κ falls while V grows.
        </text>
      </g>

      {/* Scenes 3 and 4 share the chart frame */}
      <g opacity={chartO}>
        {yTicks.map((v) => (
          <g key={`y${v}`}>
            <line x1={PX0} x2={PX1} y1={ys(v)} y2={ys(v)} stroke="var(--border)" strokeWidth={1} />
            <text x={PX0 - 8} y={ys(v) + 5} textAnchor="end" fontSize={14} fill="var(--fg-muted)">
              {v}
            </text>
          </g>
        ))}
        {xTicks.map((v) => (
          <text key={`x${v}`} x={xs(v)} y={PY1 + 22} textAnchor="middle" fontSize={14} fill="var(--fg-muted)">
            {v}
          </text>
        ))}
        <line x1={PX0} x2={PX0} y1={PY0} y2={PY1} stroke="var(--fg-muted)" strokeWidth={1.5} />
        <line x1={PX0} x2={PX1} y1={PY1} y2={PY1} stroke="var(--fg-muted)" strokeWidth={1.5} />
        <text x={(PX0 + PX1) / 2} y={PY1 + 48} textAnchor="middle" fontSize={15}>
          √c, with c in mol L⁻¹ (square root axis)
        </text>
        <text
          transform={`translate(30 ${(PY0 + PY1) / 2}) rotate(-90)`}
          textAnchor="middle"
          fontSize={15}
        >
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
        {/* Intercept marker at c^1/2 = 0 */}
        <circle cx={PX0} cy={ys(KCL_FIT.lambda0Scm2)} r={5} fill="var(--surface)" stroke="var(--ion-cation)" strokeWidth={2} />
        <text
          x={PX0 + 12}
          y={ys(KCL_FIT.lambda0Scm2) - 12}
          fontSize={15}
          stroke="var(--surface)"
          strokeWidth={4}
          paintOrder="stroke"
        >
          Λ°m ≈ {signed(KCL_FIT.lambda0Scm2, 1)}
        </text>
        {KCL_POINTS.map((p) => (
          <circle key={p.c} cx={xs(p.x)} cy={ys(p.lambdaScm2)} r={6} fill="var(--ion-cation)" stroke="var(--surface)" strokeWidth={1.5} />
        ))}
        <text x={PX1 - 14} y={PY0 + 22} textAnchor="end" fontSize={15}>
          Λm = Λ°m − A√c
        </text>
        <text x={PX1 - 14} y={PY0 + 44} textAnchor="end" fontSize={15}>
          A ≈ {KCL_FIT.A.toFixed(1)} (slope = −A)
        </text>

        {/* Weak electrolyte curve (Step 4) */}
        <g opacity={acetic}>
          <path d={aceticPath} fill="none" stroke="var(--ion-anion)" strokeWidth={2.5} strokeLinejoin="round" />
          <text x={xs(aceticLabelX) + 10} y={ys(aceticLabelY) - 10} fontSize={15} fill="var(--ion-anion)">
            CH₃COOH
          </text>
          <text x={xs(0.1)} y={ys(139.5) - 12} textAnchor="middle" fontSize={15} fill="var(--ion-cation)">
            KCl (dashed)
          </text>
        </g>
      </g>

      {/* Scene 4: ion bars */}
      <g opacity={barsO}>
        {[
          { label: 'CaCl₂', y: 130, parts: [{ name: 'Ca²⁺', v: CACL2_BARS.ca, fill: 'var(--ion-cation)' }, { name: 'Cl⁻', v: CACL2_BARS.cl, fill: 'var(--ion-anion)' }, { name: 'Cl⁻', v: CACL2_BARS.cl, fill: 'var(--ion-anion)' }], total: CACL2_BARS.total },
          { label: 'MgSO₄', y: 280, parts: [{ name: 'Mg²⁺', v: MGSO4_BARS.mg, fill: 'var(--ion-cation)' }, { name: 'SO₄²⁻', v: MGSO4_BARS.so4, fill: 'var(--ion-anion)' }], total: MGSO4_BARS.total },
        ].map((row) => {
          let cursor = X0
          return (
            <g key={row.label}>
              <text x={40} y={row.y + 38} fontSize={18} fontWeight={600}>
                {row.label}
              </text>
              {row.parts.map((p, i) => {
                const w = p.v * k4
                const x = cursor
                cursor += w
                return (
                  <g key={`${row.label}-${i}`}>
                    <rect x={x} y={row.y} width={w} height={64} fill={p.fill} stroke="var(--surface)" strokeWidth={1.5} />
                    <text x={x + w / 2} y={row.y + 38} textAnchor="middle" fontSize={14} fill="var(--surface)">
                      {p.name} {p.v.toFixed(1)}
                    </text>
                  </g>
                )
              })}
              <text x={X0 + row.total * k4 + 10} y={row.y + 38} fontSize={15}>
                = {row.total.toFixed(1)}
              </text>
            </g>
          )
        })}
        <text x={40} y={400} fontSize={15}>
          Λ°m(CaCl₂) = 119.0 + 2 × 76.3 = {CACL2_BARS.total.toFixed(1)}
        </text>
        <text x={40} y={426} fontSize={15} fill="var(--fg-muted)">
          Λ°m(MgSO₄) = 106.0 + 160.0 = {MGSO4_BARS.total.toFixed(1)}
        </text>
        <text x={40} y={460} fontSize={14} fill="var(--fg-subtle)">
          Each ion bar is independent: the Cl⁻ bar is reused for any chloride.
        </text>
        <text x={40} y={484} fontSize={14} fill="var(--fg-subtle)">
          Bars in S cm² mol⁻¹ (Table 2.4 values).
        </text>
      </g>

      {/* Scene 5: degree of dissociation */}
      <g opacity={acidO}>
        <Beaker x={30} y={120} width={190} height={250} level={0.82} tint="clear" />
        {molecules.map((m, i) =>
          i === dissociatedIndex ? null : (
            <circle key={i} cx={m.x} cy={m.y} r={5} fill="var(--fg-subtle)" fillOpacity={0.75} />
          ),
        )}
        <circle cx={molecules[dissociatedIndex]!.x - 6} cy={molecules[dissociatedIndex]!.y} r={5.5} fill="var(--ion-cation)" />
        <circle cx={molecules[dissociatedIndex]!.x + 6} cy={molecules[dissociatedIndex]!.y} r={5.5} fill="var(--ion-anion)" />
        <text x={125} y={398} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
          CH₃COOH(aq), {ACETIC_C.toFixed(4)} mol L⁻¹
        </text>

        <text x={A0} y={150} fontSize={15}>
          Measured Λm = {ACETIC_LAMBDA_MEASURED.toFixed(1)}
        </text>
        <text x={A0} y={212} fontSize={15} fill="var(--fg-muted)">
          Λ°m = 349.6 + 40.9 = {ACETIC_LAMBDA0.toFixed(1)}
        </text>
        <rect x={A0} y={224} width={349.6 * k5} height={40} fill="var(--ion-cation)" />
        <text x={A0 + (349.6 * k5) / 2} y={250} textAnchor="middle" fontSize={14} fill="var(--surface)">
          H⁺ 349.6
        </text>
        <rect x={A0 + 349.6 * k5} y={224} width={40.9 * k5} height={40} fill="var(--ion-anion)" />
        <text x={A0 + acidBarTotal} y={282} textAnchor="end" fontSize={14} fill="var(--ion-anion)">
          CH₃COO⁻ 40.9
        </text>

        <text x={A0} y={326} fontSize={15} fill="var(--fg-muted)">
          α = Λm / Λ°m = {ACETIC_ALPHA.toFixed(4)}
        </text>
        <rect x={A0} y={338} width={acidBarTotal} height={18} rx={4} fill="none" stroke="var(--border)" />
        <rect x={A0} y={338} width={Math.max(2, fracPx)} height={18} rx={4} fill="var(--current)" />
        <text x={A0 + acidBarTotal + 10} y={353} fontSize={14} fill="var(--fg-muted)">
          1
        </text>

        <text x={A0} y={400} fontSize={15}>
          Ka = cα²/(1 − α) = {sciNotation(ACETIC_KA)}
        </text>
        <text x={A0} y={426} fontSize={14} fill="var(--fg-subtle)">
          One ionised molecule in about 24.
        </text>
      </g>
    </svg>
  )
}
