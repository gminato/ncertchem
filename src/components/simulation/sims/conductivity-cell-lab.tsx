'use client'

import { useState } from 'react'
import { Button, Segmented, Slider } from '@/components/controls'
import type { SimulationProps } from '@/components/simulation/registry'
import { Galvanometer, VocabDefs } from '@/components/vocab'
import {
  BRIDGE_SOURCE_VOLTS,
  CONDUCTIVITY_SOLUTIONS,
  COARSE_STEPS,
  FINE_LIMIT_STEPS,
  FIXED_ARM_OHM,
  RATIO_FACTOR,
  coarseResistance,
  measureCell,
  solutionById,
  type RatioId,
} from '@/lib/chem/conductivity-bridge'
import styles from './conductivity-cell-lab.module.css'

const SOLUTION_OPTIONS = CONDUCTIVITY_SOLUTIONS.map((s) => ({
  value: s.id,
  label: s.label,
}))

const RATIO_OPTIONS = [
  { value: 'tenth', label: '0.1' },
  { value: 'unity', label: '1' },
  { value: 'ten', label: '10' },
] as const

const INITIAL_INDEX = 500
const TRIM_BUTTONS = [
  { delta: -10, label: '−0.1 %' },
  { delta: -1, label: '−0.01 %' },
  { delta: 1, label: '+0.01 %' },
  { delta: 10, label: '+0.1 %' },
] as const

/** Formats a value to four significant figures with a true minus sign. */
function sig(value: number): string {
  return value.toPrecision(4).replace('-', '−')
}

function trimLabel(steps: number): string {
  const percent = steps * 0.01
  const text = `${percent.toFixed(2)} %`
  return (percent > 0 ? `+${text}` : text).replace('-', '−')
}

export function ConductivityCellLab(_props: SimulationProps) {
  const [solutionId, setSolutionId] = useState<string>('kcl-0.1')
  const [area, setArea] = useState(1)
  const [gap, setGap] = useState(1)
  const [ratio, setRatio] = useState<RatioId>('unity')
  const [index, setIndex] = useState(INITIAL_INDEX)
  const [trim, setTrim] = useState(0)

  const solution = solutionById(solutionId)
  const m = measureCell({ solutionId, gapCm: gap, areaCm2: area, ratio, index, trim })
  const ratioFactor = RATIO_FACTOR[ratio]
  const detectorMilliVolts = m.detectorVolts * 1000

  const nudgeTrim = (delta: number) =>
    setTrim((t) => Math.min(FINE_LIMIT_STEPS, Math.max(-FINE_LIMIT_STEPS, t + delta)))

  const detectorText = `${detectorMilliVolts.toFixed(3).replace('-', 'minus ')} millivolts`
  const liveSummary = m.isNull
    ? `Null: the bridge is balanced and the readouts are valid. Variable resistor ${sig(m.rv)} ohms. Cell resistance R ${sig(m.resistanceOhm)} ohms. Cell constant ${sig(m.cellConstantPerCm)} per centimetre. Conductivity κ ${sig(m.kappaScmInv)} siemens per centimetre. Molar conductivity Λm ${sig(m.lambdaScm2)} siemens square centimetres per mole at ${solution.label}.`
    : `Not balanced yet. Detector reads ${detectorText}. Variable resistor ${sig(m.rv)} ohms. Adjust it until the detector reads null. Conductivity and molar conductivity appear once the bridge is balanced.`


  return (
    <div className={styles.lab}>
      <div className={styles.stage}>
        <svg
          viewBox="0 0 490 368"
          role="img"
          aria-label="AC Wheatstone bridge drawn as a diamond. Nodes A left, B top, C right, D bottom. Arm AB is the variable resistor Rv, arm BC the conductivity cell, arm AD R3 and arm DC R4. The null detector G runs vertically from B to D. The AC source sits in the outer loop from A under the diamond to C."
          className={styles.svg}
        >
          <VocabDefs idPrefix="condlab" />

          {/* Outer loop: A down, along the bottom under the diamond, up to C. The AC source sits on the bottom wire. */}
          <path d="M100 170 V326 H400 V170" fill="none" stroke="var(--fg-muted)" strokeWidth={2} />
          <circle cx={250} cy={326} r={13} fill="var(--surface-raised)" stroke="var(--fg-muted)" strokeWidth={2} />
          <path d="M241 326 Q245.25 319 250 326 T259 326" fill="none" stroke="var(--fg)" strokeWidth={1.6} />
          <text x={250} y={360} textAnchor="middle" className={styles.label}>
            AC {sig(BRIDGE_SOURCE_VOLTS)} V
          </text>

          {/* Bridge diamond: arms AB, BC, CD, DA. */}
          <path d="M100 170 L250 64 L400 170 L250 276 Z" fill="none" stroke="var(--fg-muted)" strokeWidth={2.5} />

          {/* Detector branch B to D through the centre, with the detector G. */}
          <path d="M250 64 V153 M250 187 V276" fill="none" stroke="var(--fg-muted)" strokeWidth={2} />
          <circle cx={250} cy={170} r={17} fill="var(--surface-raised)" stroke="var(--fg-muted)" strokeWidth={2} />
          <text x={250} y={176} textAnchor="middle" className={styles.label}>
            G
          </text>

          {/* Variable resistor Rv on arm AB (highlighted), label outside the arm. */}
          <g transform="translate(175 117) rotate(-35.25)">
            <rect x={-20} y={-8} width={40} height={16} rx={4} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={2} />
          </g>
          <text x={160} y={96} textAnchor="middle" className={styles.label}>
            Rᵥ
          </text>

          {/* Fixed arm R3 on AD, label outside the arm, parallel to it. */}
          <g transform="translate(175 223) rotate(35.25)">
            <rect x={-20} y={-8} width={40} height={16} rx={4} fill="var(--surface-raised)" stroke="var(--fg-muted)" strokeWidth={2} />
          </g>
          <text x={155.4} y={250.8} textAnchor="middle" transform="rotate(35.25 155.4 250.8)" className={styles.label}>
            R₃ {sig(FIXED_ARM_OHM)} Ω
          </text>

          {/* Ratio arm R4 on DC, label outside the arm, parallel to it. */}
          <g transform="translate(325 223) rotate(-35.25)">
            <rect x={-20} y={-8} width={40} height={16} rx={4} fill="var(--surface-raised)" stroke="var(--fg-muted)" strokeWidth={2} />
          </g>
          <text x={344.6} y={250.8} textAnchor="middle" transform="rotate(-35.25 344.6 250.8)" className={styles.label}>
            R₄ {sig(ratioFactor * FIXED_ARM_OHM)} Ω
          </text>

          {/* The conductivity cell on arm BC: a solution container with two parallel plates across the arm. */}
          <g transform="translate(325 117) rotate(35.25)">
            <rect x={-32} y={-18} width={64} height={36} rx={6} fill="var(--liquid)" stroke="var(--glass-wall)" strokeWidth={2} />
            <rect x={-26} y={-14} width={6} height={28} rx={1.5} fill="var(--fg-muted)" />
            <rect x={20} y={-14} width={6} height={28} rx={1.5} fill="var(--fg-muted)" />
          </g>
          <text x={340} y={44} textAnchor="start" className={styles.label}>
            Rₓ (cell)
          </text>
          <text x={340} y={62} textAnchor="start" className={styles.label}>
            {solution.label}
          </text>
          <text x={340} y={80} textAnchor="start" className={styles.label}>
            l = {gap.toFixed(1)} cm
          </text>
          <text x={340} y={98} textAnchor="start" className={styles.label}>
            A = {area.toFixed(1)} cm²
          </text>

          {/* Node junctions and their letters. */}
          <circle cx={100} cy={170} r={5} fill="var(--fg)" />
          <circle cx={250} cy={64} r={5} fill="var(--fg)" />
          <circle cx={400} cy={170} r={5} fill="var(--fg)" />
          <circle cx={250} cy={276} r={5} fill="var(--fg)" />
          <text x={84} y={176} textAnchor="end" className={styles.label}>A</text>
          <text x={250} y={36} textAnchor="middle" className={styles.label}>B</text>
          <text x={416} y={176} textAnchor="start" className={styles.label}>C</text>
          <text x={262} y={300} textAnchor="start" className={styles.label}>D</text>
        </svg>
        <p className={`${styles.status} ${m.isNull ? styles.statusNull : ''}`}>
          <span className={styles.badge}>{m.isNull ? 'Null' : 'Unbalanced'}</span>
          <span>
            Detector {detectorMilliVolts.toFixed(3).replace('-', '−')} mV
          </span>
        </p>
        <svg
          viewBox="0 0 200 172"
          role="img"
          aria-label={`G reading: ${detectorText}`}
          className={styles.meter}
        >
          <Galvanometer
            x={100}
            y={92}
            width={136}
            height={124}
            value={detectorMilliVolts}
            range={[-10, 10]}
            unit="mV"
            decimals={3}
            caption="G reading"
            scaleLabels={['−10', '0', '10']}
            terminals={false}
          />
        </svg>
      </div>

      <div className={styles.controls}>
        <Segmented
          label="Solution and concentration"
          options={SOLUTION_OPTIONS}
          value={solutionId}
          onChange={setSolutionId}
        />
        <div className={styles.sliderGrid}>
          <Slider
            label="Plate area A"
            value={area}
            min={0.5}
            max={4}
            step={0.1}
            unit="cm²"
            onChange={setArea}
          />
          <Slider
            label="Plate separation l"
            value={gap}
            min={0.5}
            max={3}
            step={0.1}
            unit="cm"
            onChange={setGap}
          />
          <Slider
            label="Coarse resistor Rᵥ"
            value={index}
            min={0}
            max={COARSE_STEPS}
            step={1}
            format={(v) => `${sig(coarseResistance(v))} Ω`}
            onChange={setIndex}
          />
        </div>
        <div className={styles.fineRow}>
          <span className={styles.fineLabel} id="condlab-trim">
            Fine trim {trimLabel(trim)}
          </span>
          <div className={styles.fineButtons} role="group" aria-labelledby="condlab-trim">
            {TRIM_BUTTONS.map((b) => (
              <Button
                key={b.label}
                variant="secondary"
                onClick={() => nudgeTrim(b.delta)}
              >
                {b.label}
              </Button>
            ))}
            <Button variant="secondary" onClick={() => setTrim(0)}>
              Reset trim
            </Button>
          </div>
        </div>
        <Segmented
          label="Ratio arms R₄ / R₃"
          options={RATIO_OPTIONS}
          value={ratio}
          onChange={(v) => setRatio(v)}
        />
      </div>

      <dl className={styles.readout}>
        <div className={styles.metric}>
          <dt className={styles.metricLabel}>Balance: Rₓ = Rᵥ × R₄ / R₃</dt>
          <dd className={styles.metricValue}>
            {sig(m.rv)} Ω × {ratioFactor} = {sig(m.resistanceOhm)} Ω
          </dd>
        </div>
        <div className={styles.metric}>
          <dt className={styles.metricLabel}>Cell constant G* = l / A</dt>
          <dd className={styles.metricValue}>{sig(m.cellConstantPerCm)} cm⁻¹</dd>
        </div>
        <div className={styles.metric}>
          <dt className={styles.metricLabel}>Conductivity κ = G* / R</dt>
          <dd className={styles.metricValue}>
            {sig(m.kappaScmInv)} S cm⁻¹ = {sig(m.kappaSmInv)} S m⁻¹
          </dd>
        </div>
        <div className={styles.metric}>
          <dt className={styles.metricLabel}>Molar conductivity Λm = κ × 1000 / c</dt>
          <dd className={styles.metricValue}>
            {sig(m.lambdaScm2)} S cm² mol⁻¹ = {sig(m.lambdaSm2)} S m² mol⁻¹
          </dd>
        </div>
        <div className={styles.metric}>
          <dt className={styles.metricLabel}>Tabulated κ for this solution</dt>
          <dd className={styles.metricValue}>{sig(solution.kappaScmInv)} S cm⁻¹</dd>
        </div>
      </dl>
      {!m.isNull && (
        <p className={styles.note}>
          These values are provisional until the detector reads null.
        </p>
      )}

      <p className={styles.srOnly} aria-live="polite">
        {liveSummary}
      </p>
    </div>
  )
}
