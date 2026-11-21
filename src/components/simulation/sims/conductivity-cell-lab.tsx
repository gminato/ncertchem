'use client'

import { useState } from 'react'
import { Button, Segmented, Slider } from '@/components/controls'
import type { SimulationProps } from '@/components/simulation/registry'
import { ConductivityCell, Galvanometer, VocabDefs } from '@/components/vocab'
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
  label: String(s.molPerL),
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

  const status = m.isNull
    ? 'Null: the bridge is balanced and the readouts are valid.'
    : 'Not balanced: adjust the variable resistor until the detector reads null.'

  const liveSummary = `${status} Variable resistor ${sig(m.rv)} ohms. Cell resistance R ${sig(m.resistanceOhm)} ohms. Cell constant ${sig(m.cellConstantPerCm)} per centimetre. Conductivity κ ${sig(m.kappaScmInv)} siemens per centimetre. Molar conductivity Λm ${sig(m.lambdaScm2)} siemens square centimetres per mole at ${solution.molPerL} mol per litre.`

  return (
    <div className={styles.lab}>
      <div className={styles.stage}>
        <svg
          viewBox="0 0 580 320"
          role="img"
          aria-label="AC Wheatstone bridge: the conductivity cell is the top arm, the variable resistor the left arm, and a null detector sits across the other diagonal"
          className={styles.svg}
        >
          <VocabDefs idPrefix="condlab" />

          {/* Source loop: left side, then along the bottom to corner C. */}
          <path
            d="M100 60 H56 V129 M56 161 V290 H260 V230"
            fill="none"
            stroke="var(--fg-muted)"
            strokeWidth={2}
          />
          <circle cx={56} cy={145} r={16} fill="var(--surface-raised)" stroke="var(--fg-muted)" strokeWidth={2} />
          <path d="M48 145 Q52 137 56 145 T64 145" fill="none" stroke="var(--fg)" strokeWidth={1.6} />
          <text x={56} y={40} fontSize={14} className={styles.label} textAnchor="middle">
            AC {sig(BRIDGE_SOURCE_VOLTS)} V
          </text>

          {/* Detector loop: right side, then back along the bottom to corner D. */}
          <path
            d="M260 60 H330 V129 M330 161 V266 H100 V230"
            fill="none"
            stroke="var(--fg-muted)"
            strokeWidth={2}
          />
          <circle cx={330} cy={145} r={16} fill="var(--surface-raised)" stroke="var(--fg-muted)" strokeWidth={2} />
          <text x={330} y={150} fontSize={14} textAnchor="middle" className={styles.label}>
            G
          </text>

          {/* Square arms: top Rₓ, right R₄, bottom R₃, left Rᵥ. */}
          <rect x={100} y={60} width={160} height={170} fill="none" stroke="var(--fg-subtle)" strokeWidth={2} />
          <g>
            <rect x={141} y={48} width={78} height={24} rx={6} fill="var(--surface-raised)" stroke="var(--fg-muted)" />
            <text x={180} y={65} fontSize={14} textAnchor="middle" className={styles.label}>
              Rₓ (cell)
            </text>
          </g>
          <g>
            <rect x={236} y={133} width={48} height={24} rx={6} fill="var(--surface-raised)" stroke="var(--fg-muted)" />
            <text x={260} y={149} fontSize={14} textAnchor="middle" className={styles.label}>
              R₄
            </text>
          </g>
          <g>
            <rect x={128} y={218} width={104} height={24} rx={6} fill="var(--surface-raised)" stroke="var(--fg-muted)" />
            <text x={180} y={235} fontSize={14} textAnchor="middle" className={styles.label}>
              R₃ {sig(FIXED_ARM_OHM)} Ω
            </text>
          </g>
          <g>
            <rect x={76} y={133} width={48} height={24} rx={6} fill="var(--accent-soft)" stroke="var(--accent)" />
            <text x={100} y={149} fontSize={14} textAnchor="middle" className={styles.label}>
              Rᵥ
            </text>
          </g>

          <Galvanometer
            x={470}
            y={100}
            width={210}
            height={130}
            value={detectorMilliVolts}
            range={[-10, 10]}
            unit="mV"
            decimals={3}
            caption="Null detector"
            scaleLabels={['−10', '0', '10']}
          />

          <ConductivityCell
            x={395}
            y={180}
            width={170}
            height={110}
            tint="clear"
            lengthLabel="l"
            areaLabel="A"
            dimensions
          />
          <text x={480} y={312} fontSize={14} textAnchor="middle" className={styles.label}>
            {solution.molPerL} mol L⁻¹ KCl
          </text>
        </svg>
        <p className={`${styles.status} ${m.isNull ? styles.statusNull : ''}`}>
          <span className={styles.badge}>{m.isNull ? 'Null' : 'Unbalanced'}</span>
          <span>
            Detector {detectorMilliVolts.toFixed(3).replace('-', '−')} mV
          </span>
        </p>
      </div>

      <div className={styles.controls}>
        <Segmented
          label="KCl concentration, mol L⁻¹"
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
          <dt className={styles.metricLabel}>Table 2.3 κ for this solution</dt>
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
