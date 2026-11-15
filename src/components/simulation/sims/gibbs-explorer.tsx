'use client'

import { useState, type ReactNode } from 'react'
import { Button, Slider } from '@/components/controls'
import { GibbsPlot, gibbsCase, type GibbsCase } from '@/components/thermo'
import type { SimulationProps } from '@/components/simulation/registry'
import { formationEnthalpyKJ } from '@/lib/chem/hess'
import { gibbsPresets, type GibbsPreset } from '@/lib/chem/gibbs-presets'
import { R_J_PER_MOL_K } from '@/lib/chem/pv-work'
import {
  crossoverTemperature,
  gibbsEnergyChange,
  spontaneityFromGibbs,
  type SpontaneityVerdict,
} from '@/lib/chem/spontaneity'
import styles from './gibbs-explorer.module.css'

const T_MIN = 100
const T_MAX = 1200
const DH_RANGE = { min: -200, max: 200 }
const DS_RANGE = { min: -400, max: 400 }
const T_RANGE = { min: T_MIN, max: T_MAX }
const LOG_MAX = 10

/** Minus sign U+2212 in place of the hyphen, for numbers in the UI. */
function minus(text: string): string {
  return text.replace(/-/g, '−')
}

/** A signed value to `digits` places, with U+2212 for negatives and an explicit plus for positives. */
function signedText(value: number, digits: number): string {
  const text = Math.abs(value).toFixed(digits)
  if (Number(text) === 0) return text
  return value < 0 ? `−${text}` : `+${text}`
}

const SUPERSCRIPTS: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻',
}
const superscript = (n: number) => String(n).replace(/[0-9-]/g, (c) => SUPERSCRIPTS[c])

/**
 * K written as a mantissa and a power of ten, from log₁₀K. Working from the logarithm means
 * a very large or very small K never overflows a double.
 */
function kParts(log10K: number): { mantissa: string; exponent: number } {
  let exponent = Math.floor(log10K)
  let mantissa = Math.pow(10, log10K - exponent)
  if (mantissa >= 9.995) {
    mantissa = 1
    exponent += 1
  }
  return { mantissa: mantissa.toFixed(2), exponent }
}

/** The K verdict: K ≫ 1, K ≈ 1 or K ≪ 1, from log₁₀K. */
function kVerdict(log10K: number): string {
  if (log10K >= 2) return 'K ≫ 1: products are strongly favoured at equilibrium'
  if (log10K >= 0.5) return 'K > 1: products are favoured at equilibrium'
  if (log10K <= -2) return 'K ≪ 1: reactants are strongly favoured at equilibrium'
  if (log10K <= -0.5) return 'K < 1: reactants are favoured at equilibrium'
  return 'K ≈ 1: both sides are present in comparable amounts'
}

const CASE_TEXT: Record<GibbsCase, string> = {
  always: 'ΔH < 0 and ΔS > 0: spontaneous at every temperature',
  never: 'ΔH > 0 and ΔS < 0: non-spontaneous at every temperature',
  'low-T': 'ΔH < 0 and ΔS < 0: spontaneous only below the crossover temperature',
  'high-T': 'ΔH > 0 and ΔS > 0: spontaneous only above the crossover temperature',
}

const VERDICT_TEXT: Record<SpontaneityVerdict, string> = {
  spontaneous: 'Spontaneous (ΔG° < 0)',
  'non-spontaneous': 'Non-spontaneous (ΔG° > 0)',
  equilibrium: 'At equilibrium (ΔG° = 0)',
}

/** Diamond to graphite, to show that spontaneous does not mean fast. ΔH from Table 5.2. */
function diamondToGraphite(): { deltaGKJ: number; deltaHKJ: number } {
  const deltaHKJ = formationEnthalpyKJ('C(graphite)') - formationEnthalpyKJ('C(diamond)')
  // Standard entropies at 298 K from a secondary table (not NCERT): S°(diamond) 2.38, S°(graphite) 5.74 J K⁻¹ mol⁻¹.
  const deltaSJ = 5.74 - 2.38
  return { deltaHKJ, deltaGKJ: gibbsEnergyChange(deltaHKJ, 298, deltaSJ) }
}

/** The log scale bar: from 10⁻¹⁰ to 10¹⁰ on the x axis, with the current K marked. */
function KBar({ log10K }: { log10K: number }) {
  const clamped = Math.max(-LOG_MAX, Math.min(LOG_MAX, log10K))
  const x = 20 + ((clamped + LOG_MAX) / (2 * LOG_MAX)) * 260
  return (
    <svg viewBox="0 0 300 60" className={styles.kBar} role="img" aria-label={kVerdict(log10K)} data-testid="k-bar">
      <line x1={20} y1={26} x2={280} y2={26} strokeWidth={1.5} style={{ stroke: 'var(--fg-subtle)' }} />
      <line x1={150} y1={18} x2={150} y2={34} strokeWidth={1.5} style={{ stroke: 'var(--fg-muted)' }} />
      <text x={20} y={50} textAnchor="middle" fontSize={13} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
        10⁻¹⁰
      </text>
      <text x={150} y={50} textAnchor="middle" fontSize={13} fill="var(--fg)" fontFamily="var(--font-sans)">
        K = 1
      </text>
      <text x={280} y={50} textAnchor="middle" fontSize={13} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
        10¹⁰
      </text>
      <circle cx={x} cy={26} r={7} style={{ fill: 'var(--accent)', stroke: 'var(--surface)' }} strokeWidth={1.5} />
    </svg>
  )
}

/** Nothing here moves on its own, so the reduced-motion flag from the shell is not needed. */
export function GibbsExplorer(_props: SimulationProps) {
  const presets = gibbsPresets()
  const [dH, setDH] = useState(presets[0].deltaHKJ)
  const [dS, setDS] = useState(presets[0].deltaSJ)
  const [T, setT] = useState(presets[0].defaultT)
  const [presetId, setPresetId] = useState<GibbsPreset['id'] | null>(presets[0].id)

  const apply = (p: GibbsPreset) => {
    setDH(p.deltaHKJ)
    setDS(p.deltaSJ)
    setT(p.defaultT)
    setPresetId(p.id)
  }

  const tdS = (T * dS) / 1000 // kJ mol⁻¹
  const dG = gibbsEnergyChange(dH, T, dS)
  const verdict = spontaneityFromGibbs(dG)
  const kind = gibbsCase(dH, dS)
  const crossover = crossoverTemperature(dH, dS)
  // ΔG° = −RT ln K, so log₁₀K = −ΔG° × 1000 / (R T ln 10). Kept as a logarithm.
  const log10K = (-dG * 1000) / (R_J_PER_MOL_K * T * Math.LN10)
  const kp = kParts(log10K)
  const dgDiamond = diamondToGraphite()

  const summary = `At ${T.toFixed(2)} K, ΔG° = ${minus(dG.toFixed(2))} kJ mol⁻¹: ${VERDICT_TEXT[verdict]}. K = ${kp.mantissa} × 10${superscript(kp.exponent)}, ${kVerdict(log10K)}.`

  return (
    <div className={styles.sim} data-testid="gibbs-explorer">
      <div className={styles.presets} role="group" aria-label="Presets">
        {presets.map((p) => (
          <Button key={p.id} variant={presetId === p.id ? 'primary' : 'secondary'} onClick={() => apply(p)} aria-pressed={presetId === p.id}>
            {p.label}
          </Button>
        ))}
      </div>

      <div className={styles.layout}>
        <div className={styles.plotCard}>
          <svg viewBox="0 0 300 226" role="img" aria-label={`ΔG° against temperature for ΔH = ${dH.toFixed(2)} kJ mol⁻¹ and ΔS = ${dS.toFixed(2)} J K⁻¹ mol⁻¹`} className={styles.plot} data-testid="gibbs-explorer-plot">
            <GibbsPlot dH={dH} dS={dS} tMin={T_MIN} tMax={T_MAX} temperature={T} />
          </svg>
          <KBar log10K={log10K} />
        </div>

        <div className={styles.side}>
          <div className={styles.sliders}>
            <Slider label="ΔH" value={dH} min={DH_RANGE.min} max={DH_RANGE.max} step={0.01} unit="kJ mol⁻¹" format={(v) => `${signedText(v, 2)} kJ mol⁻¹`} onChange={(v) => { setDH(v); setPresetId(null) }} />
            <Slider label="ΔS" value={dS} min={DS_RANGE.min} max={DS_RANGE.max} step={0.01} format={(v) => `${signedText(v, 2)} J K⁻¹ mol⁻¹`} onChange={(v) => { setDS(v); setPresetId(null) }} />
            <p className={styles.convert} data-testid="unit-conversion">
              ΔS = {minus(dS.toFixed(2))} J K⁻¹ mol⁻¹ = {minus((dS / 1000).toFixed(4))} kJ K⁻¹ mol⁻¹
            </p>
            <Slider label="T" value={T} min={T_RANGE.min} max={T_RANGE.max} step={0.01} unit="K" format={(v) => `${v.toFixed(2)} K`} onChange={(v) => { setT(v); setPresetId(null) }} />
          </div>

          <div className={styles.readout} aria-live="polite" data-testid="gibbs-readout">
            <Row label={<><span className="sym">TΔS</span></>}>
              {minus(T.toFixed(2))} K × {minus((dS / 1000).toFixed(4))} kJ K⁻¹ mol⁻¹ = {minus(tdS.toFixed(2))} kJ mol⁻¹
            </Row>
            <Row label={<><span className="sym">ΔG°</span> = <span className="sym">ΔH</span> − <span className="sym">TΔS</span></>}>
              {minus(dH.toFixed(2))} − ({minus(tdS.toFixed(2))}) = <strong data-testid="dg">{minus(dG.toFixed(2))} kJ mol⁻¹</strong>
            </Row>
            <Row label="Verdict">
              <span data-testid="verdict">{VERDICT_TEXT[verdict]}</span>
            </Row>
            <Row label="Case">
              <span data-testid="table-case">{CASE_TEXT[kind]}</span>
              {crossover !== null && <span className={styles.note}> Crossover at <span className="sym">T</span> ≈ {Math.round(crossover)} K.</span>}
            </Row>
            <Row label={<><span className="sym">K</span> = <span className="sym">e</span><sup>−ΔG°/RT</sup></>}>
              <span data-testid="k-value">
                {kp.mantissa} × 10{superscript(kp.exponent)}
              </span>
              <span className={styles.note}> {kVerdict(log10K)}</span>
            </Row>
          </div>

          <div className={styles.sources}>
            {presetId !== null && (
              <p className={styles.note}>
                {presets.find((p) => p.id === presetId)!.label}: ΔH from {presets.find((p) => p.id === presetId)!.hSource}; ΔS from{' '}
                {presets.find((p) => p.id === presetId)!.sSource}.
              </p>
            )}
            <p className={styles.note}>
              Spontaneous is not fast. Diamond to graphite has ΔG° ≈ {minus(dgDiamond.deltaGKJ.toFixed(1))} kJ mol⁻¹ at 298 K, so it is spontaneous, yet diamond does not visibly turn into graphite at room temperature. Only the thermodynamics is shown here; the rate is a separate question.
            </p>
          </div>
        </div>
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {summary}
      </p>
    </div>
  )
}

function Row({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>{children}</span>
    </div>
  )
}
