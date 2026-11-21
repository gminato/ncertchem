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
  SaltBridge,
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
  placeIons,
  type Rect,
} from './nernst-steps'

export interface NernstConcentrationProps {
  step: number
  reducedMotion: boolean
}

const SVG_H = 560

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

/** The rod as an obstacle: its strip from the top down its length. */
function rodRect(x: number, top: number, length: number, width: number): Rect {
  return { x: x - width / 2, y: top, width, height: length }
}

function IonCloud({
  bx, by, bw, bh, level, formula, charge, logC, rod, max = 14,
}: { bx: number; by: number; bw: number; bh: number; level: number; formula: string; charge: string; logC: number; rod: Rect; max?: number }) {
  const g = beakerGeometry({ x: bx, y: by, width: bw, height: bh, level })
  const n = ionCountFor(logC, max)
  const region: Rect = {
    x: g.innerLeft + 4,
    y: g.liquidTop + 8,
    width: g.innerRight - g.innerLeft - 8,
    height: g.innerBottom - g.liquidTop - 16,
  }
  return (
    <g>
      {placeIons(region, n, rod).map(([x, y], i) => (
        <Ion key={i} x={x} y={y} kind="cation" formula={formula} charge={charge} fontSize={14} />
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
      <IonCloud bx={36} by={60} bw={250} bh={270} level={0.72} formula="Cu" charge="2+" logC={logCu} rod={rodRect(161, 22, 254, 26)} max={10} />
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

/**
 * Two half-cells, a vocab salt bridge and a digital voltmeter. Left is the anode (−),
 * right the cathode (+), as in the cell notation. The external wire runs from the anode
 * to the meter's − terminal and from the cathode to its + terminal.
 */
function TwoHalfCells({
  anode, cathode, emf, t,
}: { anode: CellHalf; cathode: CellHalf; emf: number; t: number }) {
  const bw = 200
  const by = 60
  const bh = 250
  const level = 0.72
  const top = 50
  const length = 220
  const rodW = 24
  const cx = 290
  const cy = 372
  const meter = meterTerminals(cx, cy, 70)
  const ax = anode.x + bw / 2
  const kx = cathode.x + bw / 2
  const anodeRod = rodRect(ax, top, length, rodW)
  const cathodeRod = rodRect(kx, top, length, rodW)
  return (
    <g>
      <Beaker x={anode.x} y={by} width={bw} height={bh} level={level} tint={anode.tint} label={anode.label} />
      <Beaker x={cathode.x} y={by} width={bw} height={bh} level={level} tint={cathode.tint} label={cathode.label} />
      <IonCloud bx={anode.x} by={by} bw={bw} bh={bh} level={level} formula={anode.formula} charge={anode.charge} logC={anode.logC} rod={anodeRod} max={7} />
      <IonCloud bx={cathode.x} by={by} bw={bw} bh={bh} level={level} formula={cathode.formula} charge={cathode.charge} logC={cathode.logC} rod={cathodeRod} max={7} />
      <Electrode x={ax} top={top} length={length} width={rodW} material={anode.material} polarity="−" role="anode" />
      <Electrode x={kx} top={top} length={length} width={rodW} material={cathode.material} polarity="+" role="cathode" />
      <SaltBridge
        start={{ x: anode.x + bw, y: 230 }}
        finish={{ x: cathode.x, y: 230 }}
        apex={92}
        plugs
        t={t}
        ions
        ionCount={4}
        cationsTo="to"
      />
      <Wire
        corners={[{ x: ax, y: 22 }, { x: 8, y: 22 }, { x: 8, y: meter.minus.y + 24 }, { x: meter.minus.x, y: meter.minus.y + 24 }, { x: meter.minus.x, y: meter.minus.y }]}
        t={t}
        electrons
        dots={3}
        direction="forward"
        strokeWidth={3}
      />
      <Wire
        corners={[{ x: kx, y: 22 }, { x: 572, y: 22 }, { x: 572, y: meter.plus.y + 40 }, { x: meter.plus.x, y: meter.plus.y + 40 }, { x: meter.plus.x, y: meter.plus.y }]}
        t={t}
        electrons
        dots={3}
        direction="reverse"
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
          anode={{ x: 24, tint: 'clear', label: 'ZnSO₄(aq)', material: 'zn', formula: 'Zn', charge: '2+', logC: logZn }}
          cathode={{ x: 356, tint: 'blue', label: 'CuSO₄(aq)', material: 'cu', formula: 'Cu', charge: '2+', logC: logCu }}
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
          anode={{ x: 24, tint: 'clear', label: 'NiSO₄(aq)', material: 'ni', formula: 'Ni', charge: '2+', logC: logNi }}
          cathode={{ x: 356, tint: 'clear', label: 'AgNO₃(aq)', material: 'ag', formula: 'Ag', charge: '+', logC: logAg }}
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
