'use client'

import { useState } from 'react'
import { Button, Segmented, Slider, Toggle } from '@/components/controls'
import { PhAxis } from '@/components/animations/unit6/ph/PhAxis'
import {
  DILUTION_EXPONENTS,
  REFERENCE_T_K,
  strongAcidFrame,
  strongBaseFrame,
  type PhFrame,
} from '@/components/animations/unit6/ph/ph-model'
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import { formatSci, phTint } from '@/components/equilibrium/geometry'
import { NCERT_TABLE_6_5_PH } from '@/lib/chem/ncert-unit6-tables'
import type { SimulationProps } from '@/components/simulation/registry'
import styles from './ph-explorer.module.css'

type Kind = 'acid' | 'base'

const T_MIN = 273
const T_MAX = 323
const MIN_EXPONENT = DILUTION_EXPONENTS[DILUTION_EXPONENTS.length - 1]
const MAX_EXPONENT = DILUTION_EXPONENTS[0]
const AXIS = { x0: 100, x1: 560, y: 66, height: 28 }

/** The solute as a formula for labels. */
const FORMULA: Record<Kind, string> = { acid: 'HCl', base: 'NaOH' }

/** The solution at a concentration exponent n (c = 10ⁿ mol L⁻¹), a kind and a temperature. */
export function explorerFrame(kind: Kind, exponent: number, temperatureK: number): PhFrame {
  const c = 10 ** exponent
  const label = `${formatSci(c, 1)} M ${FORMULA[kind]}`
  return kind === 'acid' ? strongAcidFrame(c, temperatureK, label) : strongBaseFrame(c, temperatureK, label)
}

/** The common substances of the NCERT table that lie on the 0 to 14 scale, with their pH. */
function substances(): Array<{ name: string; pH: number; approximate: boolean }> {
  return NCERT_TABLE_6_5_PH.rows
    .filter((r) => r.pH >= 0 && r.pH <= 14)
    .map((r) => ({ name: r.fluid, pH: r.pH, approximate: r.approximate }))
    .sort((a, b) => a.pH - b.pH)
}

/** Verdict from a frame: its pH against the neutral pH at its temperature. */
function verdict(frame: PhFrame): string {
  if (Math.abs(frame.pH - frame.neutralPH) < 0.0005) return 'Neutral: [H₃O⁺] = [OH⁻]'
  return frame.pH < frame.neutralPH ? 'Acidic: [H₃O⁺] > [OH⁻]' : 'Basic: [H₃O⁺] < [OH⁻]'
}

/**
 * The pH explorer. A strong acid or strong base is diluted by factors of ten; the temperature sets
 * Kw and the neutral pH. Every value on screen comes from the acid-base library.
 */
export function PhExplorer({ reducedMotion }: SimulationProps) {
  const [kind, setKind] = useState<Kind>('acid')
  const [exponent, setExponent] = useState(-2)
  const [temperatureK, setTemperatureK] = useState(REFERENCE_T_K)
  const [showSubstances, setShowSubstances] = useState(false)

  const frame = explorerFrame(kind, exponent, temperatureK)
  const pointer = useTweenedNumber(frame.pH, reducedMotion, 0.6)
  const names = substances()
  const fromWater = frame.waterHPlus
  const fromSolute = kind === 'acid' ? 10 ** exponent : 0
  const neutralText = frame.neutralPH.toFixed(2)
  const pHText = frame.pH.toFixed(3)
  const waterShare = fromWater / frame.hPlus
  const waterMatters = kind === 'acid' && waterShare > 0.05

  const summary =
    `${frame.label} at ${temperatureK} K: pH ${pHText}, pOH ${frame.pOH.toFixed(3)}. ` +
    `[H₃O⁺] = ${formatSci(frame.hPlus)} mol L⁻¹, [OH⁻] = ${formatSci(frame.oh)} mol L⁻¹. ` +
    `Kw = ${formatSci(10 ** -frame.pKw)} and the neutral pH is ${neutralText}. ${verdict(frame)}.`

  return (
    <div className={styles.sim} data-testid="ph-explorer">
      <div className={styles.controls}>
        <Segmented<Kind>
          label="Solute"
          value={kind}
          onChange={setKind}
          options={[
            { value: 'acid', label: 'Strong acid (HCl)' },
            { value: 'base', label: 'Strong base (NaOH)' },
          ]}
        />
        <div className={styles.dilute} role="group" aria-label="Dilution">
          <Button variant="secondary" onClick={() => setExponent((e) => Math.max(MIN_EXPONENT, e - 1))} disabled={exponent <= MIN_EXPONENT} data-testid="ph-dilute">
            Dilute ×10
          </Button>
          <Button variant="secondary" onClick={() => setExponent((e) => Math.min(MAX_EXPONENT, e + 1))} disabled={exponent >= MAX_EXPONENT} data-testid="ph-concentrate">
            Concentrate ×10
          </Button>
        </div>
        <Slider
          label="Concentration"
          value={exponent}
          min={MIN_EXPONENT}
          max={MAX_EXPONENT}
          step={1}
          format={(v) => `${formatSci(10 ** v, 1)} mol L⁻¹`}
          onChange={(v) => setExponent(Math.round(v))}
        />
        <Slider label="Temperature" value={temperatureK} min={T_MIN} max={T_MAX} step={1} unit="K" format={(v) => `${Math.round(v)} K`} onChange={(v) => setTemperatureK(Math.round(v))} />
        <Toggle label="Show common substances" checked={showSubstances} onChange={setShowSubstances} />
      </div>

      <div className={styles.stage}>
        <svg viewBox="0 0 620 196" role="img" aria-label={summary} className={styles.stageSvg} data-testid="ph-explorer-scale">
          <PhAxis
            x0={AXIS.x0}
            x1={AXIS.x1}
            y={AXIS.y}
            height={AXIS.height}
            pH={pointer}
            neutralPH={frame.neutralPH}
            neutralCaption={`neutral at ${temperatureK} K: pH ${neutralText}`}
            callout={`pH ${pHText}`}
            markers={showSubstances ? names.map((s) => ({ pH: s.pH, name: s.name })) : []}
          />
        </svg>
      </div>

      <div className={styles.readout} aria-live="polite" data-testid="ph-readout">
        <div className={styles.row}>
          <span className={styles.label}>Solution</span>
          <span data-testid="ph-label">{frame.label}</span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>
            <span className="sym">pH</span> = −log[H₃O⁺]
          </span>
          <span data-testid="ph-value">
            pH {pHText} · <span className="sym">pOH</span> {frame.pOH.toFixed(3)}
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>
            <span className="sym">[H₃O⁺]</span> and <span className="sym">[OH⁻]</span>
          </span>
          <span data-testid="ph-concentrations">
            {formatSci(frame.hPlus)} and {formatSci(frame.oh)} mol L⁻¹
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>
            <span className="sym">K</span>
            <sub>w</sub> at {temperatureK} K
          </span>
          <span data-testid="ph-kw">
            {formatSci(10 ** -frame.pKw)} · neutral pH {neutralText}
          </span>
        </div>
        <div className={styles.row}>
          <span className={styles.label}>Verdict</span>
          <span data-testid="ph-verdict">{verdict(frame)}</span>
        </div>
        {kind === 'acid' && (
          <div className={styles.row}>
            <span className={styles.label}>
              Source of <span className="sym">[H₃O⁺]</span>
            </span>
            <span data-testid="ph-water-share">
              {formatSci(fromSolute)} from the acid and {formatSci(fromWater)} from water
              {waterMatters ? ' (the water term is more than 5 % of the total, so it matters)' : ''}
            </span>
          </div>
        )}
      </div>

      {showSubstances && (
        <ol className={styles.substances} aria-label="Common substances by pH" data-testid="ph-substances">
          {names.map((s) => (
            <li key={s.name} className={styles.substance}>
              <span className={styles.swatch} style={{ background: phTint(s.pH) }} aria-hidden="true" />
              <span className={styles.substanceName}>{s.name}</span>
              <span className={styles.substancePH}>
                pH {s.approximate ? '~' : ''}
                {s.pH.toFixed(1)}
              </span>
            </li>
          ))}
        </ol>
      )}

      <p className={styles.note}>
        Every value is computed by the acid-base library. Kw at other temperatures is an estimate that uses a fixed enthalpy of ionisation of +55.84 kJ mol⁻¹, not a value from NCERT. Activities are ignored, so the strong-acid and strong-base values are for dilute solutions.
      </p>
    </div>
  )
}

