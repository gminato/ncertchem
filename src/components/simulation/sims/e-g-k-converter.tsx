'use client'

import { useId, useState } from 'react'
import { Slider } from '@/components/controls'
import type { SimulationProps } from '@/components/simulation/registry'
import {
  CONVERTER_PRESETS,
  presetThermo,
  scientificFromLog10,
  stateAtProgress,
  type ConverterPreset,
  type PresetThermo,
  type Verdict,
  verdictFor,
} from '@/lib/chem/e-g-k-converter'
import { FARADAY } from '@/lib/chem/ncert-c12-unit2-tables'
import styles from './e-g-k-converter.module.css'

const MINUS = '−'
const SVG_W = 480
const TRACK_LEFT = 40
const TRACK_RIGHT = 440
const E_ROW = { labelY: 36, trackY: 62, markerY: 70, valueY: 102 }
const K_ROW = { labelY: 128, trackY: 146, markerY: 154, valueY: 186 }
const FARADAY_TEXT = String(FARADAY).replace(/\B(?=(\d{3})+$)/g, ' ')
const VERDICT_TEXT: Record<Verdict, string> = {
  spontaneous:
    'Spontaneous as written: E°cell is positive, ΔrG° is negative and K is greater than 1.',
  reverse:
    'Not spontaneous as written: E°cell is negative, ΔrG° is positive and K is less than 1, so the reverse reaction runs.',
  equilibrium: 'E°cell = 0, ΔrG° = 0 and K = 1: no net change.',
}

/** Formats a signed number with a true minus sign and no "−0". */
function signed(value: number, decimals: number): string {
  const tiny = Math.abs(value) < 0.5 * 10 ** -decimals
  return (tiny ? 0 : value).toFixed(decimals).replace(/-/g, MINUS)
}

/** Clamps a label's x so a centred text never runs past the viewBox. */
function clampLabelX(x: number): number {
  return Math.min(TRACK_RIGHT - 20, Math.max(TRACK_LEFT + 20, x))
}

function Scientific({ log10 }: { log10: number }) {
  const { mantissa, exponent } = scientificFromLog10(log10)
  return (
    <span>
      {mantissa} × 10
      <sup className={styles.exp}>{signed(exponent, 0)}</sup>
    </span>
  )
}

interface ScaleGeometry {
  readonly x: (value: number) => number
}

/** Maps values onto the shared track, padded so the markers never sit on the edge. */
function scaleFor(lo: number, hi: number): ScaleGeometry {
  const span = Math.max(hi - lo, 1e-6)
  const dlo = lo - span * 0.15
  const dhi = hi + span * 0.15
  return { x: (v) => TRACK_LEFT + ((v - dlo) / (dhi - dlo)) * (TRACK_RIGHT - TRACK_LEFT) }
}

function summaryText(preset: ConverterPreset, thermo: PresetThermo, progress: number, eNow: number, verdict: Verdict): string {
  const scale = scientificFromLog10(thermo.log10K)
  const status =
    progress >= 100
      ? 'Equilibrium reached: E = 0, ΔrG = 0, Q = K.'
      : `Discharge ${progress}%: E = ${signed(eNow, 3)} V.`
  return [
    `${preset.label}. n = ${thermo.n}. E°cell = ${signed(thermo.eCell, 2)} V.`,
    `ΔrG° = ${signed(thermo.gibbsKJ, 1)} kJ mol⁻¹. K = ${scale.mantissa} × 10^${signed(scale.exponent, 0)}, log K = ${signed(thermo.log10K, 2)}.`,
    status,
    VERDICT_TEXT[verdict],
  ].join(' ')
}

export function EGKConverter({ reducedMotion }: SimulationProps) {
  const selectId = useId()
  const [presetId, setPresetId] = useState<string>(CONVERTER_PRESETS[0].id)
  const [tempK, setTempK] = useState<number>(298)
  const [progress, setProgress] = useState<number>(0)

  const preset = CONVERTER_PRESETS.find((p) => p.id === presetId) ?? CONVERTER_PRESETS[0]
  const thermo = presetThermo(preset, tempK)
  const now = stateAtProgress(thermo, progress / 100, tempK)
  const verdict = verdictFor(thermo.eCell)
  const qScale = scientificFromLog10(now.log10Q)

  const eScale = scaleFor(Math.min(0, thermo.eCell), Math.max(0, thermo.eCell))
  const kScale = scaleFor(Math.min(0, thermo.log10K), Math.max(0, thermo.log10K))
  const transition = reducedMotion ? undefined : { transition: 'all 180ms ease-out' }

  const eX = eScale.x(now.eCell)
  const eZeroX = eScale.x(0)
  const eStartX = eScale.x(thermo.eCell)
  const kX = kScale.x(now.log10Q)
  const kZeroX = kScale.x(0)
  const kEndX = kScale.x(thermo.log10K)

  return (
    <div className={styles.sim}>
      <div className={styles.controls}>
        <label className={styles.selectLabel} htmlFor={selectId}>
          Reaction
        </label>
        <select
          id={selectId}
          className={styles.select}
          value={presetId}
          onChange={(event) => {
            setPresetId(event.target.value)
            setProgress(0)
          }}
        >
          {CONVERTER_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <div className={styles.sliderGrid}>
          <Slider
            label="Temperature T"
            value={tempK}
            min={273}
            max={373}
            step={1}
            unit="K"
            format={(v) => v.toFixed(0)}
            onChange={setTempK}
          />
          <Slider
            label="Discharge"
            value={progress}
            min={0}
            max={100}
            step={1}
            unit="%"
            format={(v) => v.toFixed(0)}
            onChange={setProgress}
          />
        </div>
        <p className={styles.small}>ΔrG° is taken at 298 K and held fixed as T changes; only K moves with T, through RT.</p>
      </div>

      <div className={styles.equation} aria-label="Balanced cell reaction">
        <p>
          <span className={styles.tag}>Cathode (reduction)</span> {preset.cathodeHalf}
        </p>
        <p>
          <span className={styles.tag}>Anode (oxidation)</span> {preset.anodeHalf}
        </p>
        <p>
          <span className={styles.tag}>Overall</span> {preset.overall}
        </p>
        <p>
          <span className={styles.tag}>Electrons transferred</span>{' '}
          <i className="sym">n</i> = {thermo.n}
        </p>
      </div>

      <div className={styles.stage}>
        <p className={styles.caption}>
          Top: cell potential <i className="sym">E</i> falls from <i className="sym">E</i>°cell to 0. Bottom: log{' '}
          <i className="sym">Q</i> climbs to log <i className="sym">K</i>.
        </p>
        <svg
          viewBox={`0 0 ${SVG_W} 200`}
          role="img"
          aria-label={`Cell potential ${signed(now.eCell, 2)} volts; log Q ${signed(now.log10Q, 2)} of log K ${signed(thermo.log10K, 2)}`}
          className={styles.svg}
        >
          <line x1={eZeroX} x2={eZeroX} y1={E_ROW.trackY - 8} y2={E_ROW.trackY + 24} className={styles.zeroLine} />
          <rect x={TRACK_LEFT} y={E_ROW.trackY} width={TRACK_RIGHT - TRACK_LEFT} height={16} rx={8} className={styles.track} />
          <rect
            x={Math.min(eZeroX, eX)}
            y={E_ROW.trackY}
            width={Math.abs(eX - eZeroX)}
            height={16}
            rx={8}
            className={styles.barE}
            style={transition}
          />
          <circle cx={eStartX} cy={E_ROW.trackY + 8} r={4} className={styles.startDot} />
          <text x={clampLabelX(eStartX)} y={E_ROW.labelY} textAnchor="middle" className={styles.label}>
            E°cell
          </text>
          <circle cx={eX} cy={E_ROW.markerY} r={9} className={styles.markerE} style={transition} />
          <text x={clampLabelX(eX)} y={E_ROW.valueY} textAnchor="middle" className={styles.value}>
            E = {signed(now.eCell, 2)} V
          </text>

          <line x1={kZeroX} x2={kZeroX} y1={K_ROW.trackY - 8} y2={K_ROW.trackY + 24} className={styles.zeroLine} />
          <rect x={TRACK_LEFT} y={K_ROW.trackY} width={TRACK_RIGHT - TRACK_LEFT} height={16} rx={8} className={styles.track} />
          <rect
            x={Math.min(kZeroX, kX)}
            y={K_ROW.trackY}
            width={Math.abs(kX - kZeroX)}
            height={16}
            rx={8}
            className={styles.barK}
            style={transition}
          />
          <circle cx={kEndX} cy={K_ROW.trackY + 8} r={4} className={styles.endDot} />
          <text x={clampLabelX(kEndX)} y={K_ROW.labelY} textAnchor="middle" className={styles.label}>
            log K
          </text>
          <circle cx={kX} cy={K_ROW.markerY} r={9} className={styles.markerK} style={transition} />
          <text x={clampLabelX(kX)} y={K_ROW.valueY} textAnchor="middle" className={styles.value}>
            log Q = {signed(now.log10Q, 1)}
          </text>
        </svg>
      </div>

      <div className={styles.cards}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            <i className="sym">E</i>°cell
          </h3>
          <p className={styles.big}>{signed(thermo.eCell, 2)} V</p>
          <p className={styles.small}>
            = {signed(thermo.cathode.e0, 2)} − ({signed(thermo.anode.e0, 2)})
          </p>
        </div>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>ΔrG°</h3>
          <p className={styles.big}>{signed(thermo.gibbsKJ, 1)} kJ mol⁻¹</p>
          <p className={styles.small}>
            = {MINUS}{thermo.n} × {FARADAY_TEXT} × ({signed(thermo.eCell, 2)}) ÷ 1000 kJ mol⁻¹
          </p>
        </div>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>
            <i className="sym">K</i>
          </h3>
          <p className={styles.big}>
            <Scientific log10={thermo.log10K} />
          </p>
          <p className={styles.small}>
            log <i className="sym">K</i> = {signed(thermo.log10K, 2)}
          </p>
        </div>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Now</h3>
          <p className={styles.big}>
            <i className="sym">Q</i> = {qScale.mantissa} × 10
            <sup className={styles.exp}>{signed(qScale.exponent, 0)}</sup>
          </p>
          <p className={styles.small}>
            ΔrG = {signed(now.gibbsKJ, 1)} kJ mol⁻¹
          </p>
        </div>
      </div>

      <p className={styles.verdict} data-verdict={verdict}>
        {VERDICT_TEXT[verdict]}
      </p>

      <p className={styles.srOnly} aria-live="polite">
        {summaryText(preset, thermo, progress, now.eCell, verdict)}
      </p>
    </div>
  )
}
