'use client'

import type { ReactNode } from 'react'
import { useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import { nernstLog10Slope } from '@/lib/chem/nernst'
import {
  Beaker,
  Electrode,
  HydrogenElectrode,
  Ion,
  VocabDefs,
  Voltmeter,
  Wire,
  beakerGeometry,
  meterTerminals,
  type ElectrodeMaterial,
  type SolutionTint,
} from '@/components/vocab'
import {
  E0_NI_AG,
  cuElectrodePotential,
  daniellPotential,
  getNernstStepState,
  hydrogenPotential,
  niAgPotential,
  niAgReactionQuotient,
} from './nernst-steps'

export interface NernstConcentrationProps {
  step: number
  reducedMotion: boolean
}

const SVG_H = 560
const SLOTS: readonly (readonly [number, number])[] = [
  [0.1, 0.25], [0.3, 0.55], [0.12, 0.7], [0.7, 0.6], [0.08, 0.86], [0.24, 0.93], [0.68, 0.8],
  [0.84, 0.3], [0.22, 0.45], [0.78, 0.62], [0.88, 0.5], [0.3, 0.2], [0.7, 0.2], [0.92, 0.85],
]

/** Ions drawn for a log10 concentration: `max` at 1 mol L⁻¹, falling as the square root of the concentration (schematic). */
export function ionCountFor(logC: number, max = 14): number {
  return Math.max(1, Math.round(max * 10 ** (logC / 2)))
}

/** Superscript exponent for 10^k, with the minus sign as U+2212. */
export function powerOfTen(logC: number): string {
  const k = Math.round(logC)
  const digits: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }
  const body = String(Math.abs(k)).split('').map((d) => digits[d]).join('')
  return `10${k < 0 ? '⁻' : ''}${body}`
}

function IonCloud({
  bx, by, bw, bh, level, formula, charge, logC, max = 14,
}: { bx: number; by: number; bw: number; bh: number; level: number; formula: string; charge: string; logC: number; max?: number }) {
  const g = beakerGeometry({ x: bx, y: by, width: bw, height: bh, level })
  const w = g.innerRight - g.innerLeft
  const h = g.innerBottom - g.liquidTop
  const n = ionCountFor(logC, max)
  return (
    <g>
      {SLOTS.slice(0, n).map(([fx, fy], i) => (
        <Ion
          key={i}
          x={g.innerLeft + fx * w}
          y={g.liquidTop + 14 + fy * (h - 28)}
          kind="cation"
          formula={formula}
          charge={charge}
          fontSize={14}
        />
      ))}
    </g>
  )
}

/** Log scale on the right: 1 at the top, 10⁻⁴ at the bottom. */
function logY(logC: number): number {
  return 130 + -logC * 70
}

function LogRail({ logC, showEValues }: { logC: number; showEValues: boolean }) {
  const ticks = [0, -1, -2, -3, -4]
  return (
    <g>
      <line x1={360} y1={logY(0)} x2={360} y2={logY(-4)} stroke="var(--fg-muted)" strokeWidth={2} />
      {ticks.map((k) => (
        <g key={k}>
          <line x1={352} x2={368} y1={logY(k)} y2={logY(k)} stroke="var(--fg-muted)" strokeWidth={2} />
          <text x={378} y={logY(k) + 5} fontSize={15} fill="var(--fg)" fontFamily="var(--font-sans)">
            {k === 0 ? '1' : powerOfTen(k)}
          </text>
          {showEValues ? (
            <text x={466} y={logY(k) + 5} fontSize={15} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
              {cuElectrodePotential(k).toFixed(3)} V
            </text>
          ) : null}
        </g>
      ))}
      <circle cx={360} cy={logY(logC)} r={9} fill="var(--accent)" />
      <text x={340} y={logY(-4) + 40} fontSize={15} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
        [Cu²⁺] / mol L⁻¹
      </text>
    </g>
  )
}

function SingleHalfCell({ step, logCu }: { step: number; logCu: number }) {
  const E = cuElectrodePotential(logCu)
  return (
    <g>
      <Beaker x={36} y={60} width={250} height={270} level={0.72} tint="blue" label="CuSO₄(aq)" />
      <Electrode x={161} top={22} length={254} width={26} material="cu" />
      <IonCloud bx={36} by={60} bw={250} bh={270} level={0.72} formula="Cu" charge="2+" logC={logCu} />
      <text x={340} y={84} fontSize={16} fill="var(--fg)" fontFamily="var(--font-sans)">
        E = E° + (0.059 / 2) log[Cu²⁺]
      </text>
      <LogRail logC={logCu} showEValues={step === 1} />
      {step === 1 ? (
        <text x={340} y={470} fontSize={15} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
          Each tenfold drop: −{nernstLog10Slope(2).toFixed(4)} V
        </text>
      ) : null}
      <text x={340} y={510} fontSize={26} fill="var(--accent)" fontFamily="var(--font-sans)" fontWeight={600}>
        E = {E.toFixed(3)} V
      </text>
    </g>
  )
}

interface CellHalf {
  x: number
  tint: SolutionTint
  label: string
  material: ElectrodeMaterial
  formula: string
  charge: string
  logC: number
}

/** Two half-cells, a salt bridge and a digital voltmeter. Left is the cathode (+), right the anode (−). */
function TwoHalfCells({
  left, right, emf, t,
}: { left: CellHalf; right: CellHalf; emf: number; t: number }) {
  const bw = 200
  const by = 60
  const bh = 250
  const level = 0.72
  const cx = 290
  const cy = 400
  const meter = meterTerminals(cx, cy, 70)
  const lx = left.x + bw / 2
  const rx = right.x + bw / 2
  return (
    <g>
      <Beaker x={left.x} y={by} width={bw} height={bh} level={level} tint={left.tint} label={left.label} />
      <Beaker x={right.x} y={by} width={bw} height={bh} level={level} tint={right.tint} label={right.label} />
      <IonCloud bx={left.x} by={by} bw={bw} bh={bh} level={level} formula={left.formula} charge={left.charge} logC={left.logC} max={7} />
      <IonCloud bx={right.x} by={by} bw={bw} bh={bh} level={level} formula={right.formula} charge={right.charge} logC={right.logC} max={7} />
      <Electrode x={lx} top={50} length={220} width={24} material={left.material} polarity="+" role="cathode" />
      <Electrode x={rx} top={50} length={220} width={24} material={right.material} polarity="−" role="anode" />
      <path
        d={`M ${left.x + bw - 26} ${by + 190} Q 290 ${by - 40} ${right.x + 26} ${by + 190}`}
        fill="none"
        stroke="var(--fg-muted)"
        strokeWidth={10}
        strokeLinecap="round"
        opacity={0.45}
      />
      <Wire
        corners={[{ x: lx, y: 22 }, { x: 8, y: 22 }, { x: 8, y: meter.plus.y }, { x: meter.plus.x, y: meter.plus.y }]}
        t={t}
        electrons
        dots={3}
        direction="reverse"
        strokeWidth={3}
      />
      <Wire
        corners={[{ x: rx, y: 22 }, { x: 572, y: 22 }, { x: 572, y: meter.minus.y + 16 }, { x: meter.minus.x, y: meter.minus.y + 16 }, { x: meter.minus.x, y: meter.minus.y }]}
        t={t}
        electrons
        dots={3}
        direction="forward"
        strokeWidth={3}
      />
      <Voltmeter x={cx} y={cy} width={150} height={70} value={emf} range={[0, 1.5]} unit="V" caption="Voltmeter" terminals />
    </g>
  )
}

function FormulaBand({ lines }: { lines: readonly { text: ReactNode; accent?: boolean }[] }) {
  return (
    <g>
      {lines.map((line, i) => (
        <text
          key={i}
          x={20}
          y={500 + i * 26}
          fontSize={i === 0 ? 17 : 15}
          fill={line.accent ? 'var(--accent)' : 'var(--fg)'}
          fontFamily="var(--font-sans)"
        >
          {line.text}
        </text>
      ))}
    </g>
  )
}

export function NernstConcentration({ step, reducedMotion }: NernstConcentrationProps) {
  const state = getNernstStepState(step)
  const logCu = useTweenedNumber(state.logCu, reducedMotion)
  const logZn = useTweenedNumber(state.logZn, reducedMotion)
  const logNi = useTweenedNumber(state.logNi, reducedMotion)
  const logAg = useTweenedNumber(state.logAg, reducedMotion)
  const pH = useTweenedNumber(state.pH, reducedMotion)
  const t = useAmbientTime(reducedMotion)
  const id = state.id

  let scene: ReactNode
  if (id === 'one-electrode' || id === 'log-scale') {
    scene = <SingleHalfCell step={state.index} logCu={logCu} />
  } else if (id === 'daniell-ratio') {
    const Q = 10 ** (logZn - logCu)
    scene = (
      <g>
        <TwoHalfCells
          left={{ x: 24, tint: 'blue', label: 'CuSO₄(aq)', material: 'cu', formula: 'Cu', charge: '2+', logC: logCu }}
          right={{ x: 356, tint: 'clear', label: 'ZnSO₄(aq)', material: 'zn', formula: 'Zn', charge: '2+', logC: logZn }}
          emf={daniellPotential(logZn, logCu)}
          t={t}
        />
        <FormulaBand
          lines={[
            { text: <>Q = [Zn²⁺]/[Cu²⁺] = {powerOfTen(logZn)} / {powerOfTen(logCu)} = {Q.toPrecision(2)}</>, accent: true },
            { text: <>E = E°cell − (0.059/2) log Q = {daniellPotential(logZn, logCu).toFixed(2)} V</>, accent: true },
          ]}
        />
      </g>
    )
  } else if (id === 'general-cell') {
    const Q = niAgReactionQuotient(logNi, logAg)
    scene = (
      <g>
        <TwoHalfCells
          left={{ x: 24, tint: 'clear', label: 'AgNO₃(aq)', material: 'ag', formula: 'Ag', charge: '+', logC: logAg }}
          right={{ x: 356, tint: 'clear', label: 'NiSO₄(aq)', material: 'ni', formula: 'Ni', charge: '2+', logC: logNi }}
          emf={niAgPotential(logNi, logAg)}
          t={t}
        />
        <FormulaBand
          lines={[
            { text: <>Ni(s) + 2Ag⁺(aq) → Ni²⁺(aq) + 2Ag(s)</> },
            { text: <>Q = [Ni²⁺]/[Ag⁺]² = {powerOfTen(logNi - 2 * logAg)}</> },
            { text: <>E = {E0_NI_AG.toFixed(2)} V − (0.059/2) log Q = {niAgPotential(logNi, logAg).toFixed(2)} V</>, accent: true },
          ]}
        />
      </g>
    )
  } else {
    const barTop = 112
    const barH = 340
    const yOf = (pHv: number) => barTop + (pHv / 14) * barH
    scene = (
      <g>
        <HydrogenElectrode x={36} y={60} width={330} height={360} t={t} label={`H⁺(aq), pH ${pH.toFixed(1)}`} gasLabel="H₂ (1 bar)" />
        <text x={400} y={84} fontSize={16} fill="var(--fg)" fontFamily="var(--font-sans)">
          pH scale
        </text>
        <rect x={420} y={barTop} width={26} height={barH} rx={6} fill="var(--surface-raised)" stroke="var(--fg-muted)" />
        {[0, 2, 4, 6, 8, 10, 12, 14].map((p) => (
          <g key={p}>
            <line x1={446} x2={456} y1={yOf(p)} y2={yOf(p)} stroke="var(--fg-muted)" strokeWidth={2} />
            <text x={464} y={yOf(p) + 5} fontSize={15} fill="var(--fg-muted)" fontFamily="var(--font-sans)">{p}</text>
          </g>
        ))}
        <circle cx={433} cy={yOf(pH)} r={10} fill="var(--accent)" />
        <FormulaBand
          lines={[
            { text: <>2H⁺(aq) + 2e⁻ → H₂(g), E° = 0 V</> },
            { text: <>E = −0.059 × pH = −0.059 × {pH.toFixed(1)}</> },
            { text: <>E = {hydrogenPotential(pH).toFixed(3)} V</>, accent: true },
          ]}
        />
      </g>
    )
  }

  return (
    <svg
      viewBox={`0 0 580 ${SVG_H}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label={state.ariaLabel}
    >
      <VocabDefs idPrefix="nernst" />
      {scene}
    </svg>
  )
}
