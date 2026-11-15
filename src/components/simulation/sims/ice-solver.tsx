'use client'

import { useMemo, useState, type ReactNode } from 'react'
import katex from 'katex'
import 'katex/contrib/mhchem'
import { Button, NumberField, Slider } from '@/components/controls'
import { IceTable, type IceCell } from '@/components/equilibrium'
import type { SimulationProps } from '@/components/simulation/registry'
import {
  ICE_SOLVER_PRESETS,
  changeText,
  reactionCe,
  solveIceProblem,
  type IceProblem,
  type IceSolverPreset,
} from '@/lib/chem/ice-solver'
import { R_J_PER_MOL_K } from '@/lib/chem/pv-work'
import styles from './ice-solver.module.css'

const T_RANGE = { min: 250, max: 1000 }

/** A signed number with U+2212 for a negative value and no sign for zero. */
function signed(value: number, digits = 2): string {
  const text = Math.abs(value).toFixed(digits)
  if (Number(text) === 0) return text
  return value < 0 ? `−${text}` : `+${text}`
}

/** Three significant figures for the readout, with a plain decimal for values from 0.01 to 1000. */
function sig(value: number): string {
  if (value === 0) return '0'
  const a = Math.abs(value)
  if (a >= 0.01 && a < 1000) return value.toPrecision(3)
  const exponent = Math.floor(Math.log10(a))
  return `${(value / 10 ** exponent).toFixed(2)} × 10${superscript(exponent)}`
}

const SUPERSCRIPTS: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻',
}
const superscript = (n: number) => String(n).replace(/[0-9-]/g, (c) => SUPERSCRIPTS[c])

/** A mhchem equation rendered by KaTeX. */
function Equation({ ce }: { ce: string }) {
  const html = useMemo(() => katex.renderToString(`\\ce{${ce}}`, { throwOnError: false }), [ce])
  return <span className={styles.equation} dangerouslySetInnerHTML={{ __html: html }} />
}

/** A TeX string rendered by KaTeX in display mode. */
function Tex({ tex }: { tex: string }) {
  const html = useMemo(() => katex.renderToString(tex, { throwOnError: false, displayMode: true }), [tex])
  return <div className={styles.tex} dangerouslySetInnerHTML={{ __html: html }} />
}

/** Replaces the hyphen-minus in a number's text with U+2212. */
const trueMinus = (text: string) => text.replace(/-/g, '−')

/** Two numbers agree when they differ by less than a part in a million. */
const agrees = (a: number, b: number) => Math.abs(a - b) <= 1e-6 * Math.max(Math.abs(b), 1e-12)

const DIRECTION_TEXT = {
  forward: 'the forward reaction runs (Q < K)',
  reverse: 'the reverse reaction runs (Q > K)',
  'at equilibrium': 'the mixture is already at equilibrium (Q = K)',
} as const

const VERDICT_TEXT = {
  'products-predominate': 'K > 10³: products predominate',
  'reactants-predominate': 'K < 10⁻³: reactants predominate',
  'appreciable-both': 'K between 10⁻³ and 10³: both are present',
} as const

/**
 * Chooses a reaction, enters the starting amounts and K, and solves the ICE table with the library.
 * It shows the equation in x, the equilibrium amounts, a check that Q = K, and ΔG° = −RT ln K at a
 * chosen temperature. K is entered for one temperature; the temperature slider only changes ΔG°.
 */
export function IceSolver(_props: SimulationProps) {
  const [presetId, setPresetId] = useState<string>(ICE_SOLVER_PRESETS[0].id)
  const preset = ICE_SOLVER_PRESETS.find((p) => p.id === presetId) ?? ICE_SOLVER_PRESETS[0]
  const [initial, setInitial] = useState<Record<string, number>>({ ...preset.initial })
  const [k, setK] = useState<number>(preset.k)
  const [temperatureK, setTemperatureK] = useState<number>(preset.temperatureK)

  const apply = (p: IceSolverPreset) => {
    setPresetId(p.id)
    setInitial({ ...p.initial })
    setK(p.k)
    setTemperatureK(p.temperatureK)
  }

  const kSymbol = preset.basis === 'concentration' ? 'Kc' : 'Kp'
  const unit = preset.basis === 'concentration' ? 'mol L⁻¹' : 'bar'
  const speciesOrder = [...preset.reaction.reactants, ...preset.reaction.products]

  let problem: IceProblem | null = null
  let error: string | null = null
  try {
    problem = solveIceProblem({ reaction: preset.reaction, initial, k, basis: preset.basis, temperatureK })
  } catch (e) {
    error = e instanceof RangeError ? e.message : 'The inputs could not be solved.'
  }

  const summary = problem
    ? `${preset.label}. The extent is x = ${sig(problem.ice.extent)}. At equilibrium, ${speciesOrder
        .map((t) => `${preset.names[t.species]} ${sig(problem!.ice.equilibrium[t.species])}`)
        .join(', ')} ${unit}. Q at equilibrium is ${sig(problem.qEquilibrium)}, equal to K. ${VERDICT_TEXT[problem.verdict]}. At ${temperatureK} K, ΔG° is ${signed(problem.deltaG0KJ)} kilojoules per mole.`
    : error ?? ''

  return (
    <div className={styles.sim} data-testid="ice-solver" data-preset={preset.id}>
      <div className={styles.presets} role="group" aria-label="Reactions">
        {ICE_SOLVER_PRESETS.map((p) => (
          <Button
            key={p.id}
            variant={p.id === preset.id ? 'primary' : 'secondary'}
            aria-pressed={p.id === preset.id}
            onClick={() => apply(p)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      <div className={styles.layout}>
        <div className={styles.inputs}>
          <div className={styles.card}>
            <h4 className={styles.cardTitle}>Reaction</h4>
            <Equation ce={reactionCe(preset.reaction)} />
            <p className={styles.note}>{preset.note}</p>
          </div>

          <div className={styles.card}>
            <h4 className={styles.cardTitle}>Starting amounts ({unit})</h4>
            <div className={styles.fields}>
              {speciesOrder.map((t) => (
                <NumberField
                  key={t.species}
                  label={`[${preset.names[t.species]}] at start`}
                  value={initial[t.species] ?? 0}
                  min={0}
                  max={100}
                  step={0.1}
                  precision={2}
                  onChange={(v) => setInitial((prev) => ({ ...prev, [t.species]: v }))}
                />
              ))}
              <NumberField
                label={kSymbol}
                value={k}
                min={0.000001}
                max={1000000}
                step={0.01}
                precision={3}
                onChange={(v) => setK(v)}
              />
            </div>
          </div>

          <div className={styles.card}>
            <h4 className={styles.cardTitle}>How the solver works</h4>
            <p className={styles.note}>
              Every amount is kept between zero and the limit where it runs out. Inside that range Q rises steadily
              with x, so ln(Q/K) crosses zero at exactly one point, and bisection finds it.
            </p>
          </div>
        </div>

        <div className={styles.outputs}>
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : problem ? (
            <>
              <div className={styles.tableWrap}>
                <IceTable
                  species={speciesOrder.map((t) => `[${preset.names[t.species]}]`)}
                  initial={speciesOrder.map((t) => initial[t.species] ?? 0) as IceCell[]}
                  change={speciesOrder.map((t) => changeText(t, preset.reaction.reactants.includes(t)))}
                  equilibrium={speciesOrder.map((t) => problem!.ice.equilibrium[t.species])}
                  rowNotes={{ C: <span>x = {sig(problem.ice.extent)}</span> }}
                  revealStep={3}
                  caption={`${unit}: I, C and E rows`}
                />
              </div>

              <Tex tex={problem.equationTex} />

              <div className={styles.readout} aria-live="polite" data-testid="ice-readout">
                <Row label="Solution">
                  <span data-testid="x-value">x = {sig(problem.ice.extent)} {unit === 'bar' ? 'bar' : 'mol L⁻¹'}</span>
                </Row>
                <Row label="Start">
                  <span data-testid="q-start">
                    Q = {Number.isFinite(problem.qStart) ? sig(problem.qStart) : '∞'}: {DIRECTION_TEXT[problem.direction]}
                  </span>
                </Row>
                <Row label="Check">
                  <span data-testid="q-check">
                    Q at equilibrium = {sig(problem.qEquilibrium)}, K = {sig(k)}
                    {agrees(problem.qEquilibrium, k) ? ' ✓ Q = K' : ' (not equal)'}
                  </span>
                </Row>
                <Row label="Extent">
                  <span data-testid="verdict">{VERDICT_TEXT[problem.verdict]}</span>
                </Row>
              </div>

              <div className={styles.gibbs} data-testid="gibbs-panel">
                <h4 className={styles.cardTitle}>Gibbs energy at {temperatureK} K</h4>
                <Slider
                  label="T"
                  value={temperatureK}
                  min={T_RANGE.min}
                  max={T_RANGE.max}
                  step={1}
                  unit="K"
                  format={(v) => `${v.toFixed(0)} K`}
                  onChange={(v) => setTemperatureK(v)}
                />
                <p className={styles.formula} data-testid="dg0">
                  ΔG° = −RT ln {kSymbol} = −({R_J_PER_MOL_K} × {temperatureK} × {trueMinus(Math.log(k).toFixed(3))}) J mol⁻¹ ={' '}
                  <strong>{signed(problem.deltaG0KJ)} kJ mol⁻¹</strong>
                </p>
                <p className={styles.note}>
                  {problem.deltaG0KJ < 0
                    ? `K > 1 gives ΔG° < 0 at this temperature.`
                    : problem.deltaG0KJ > 0
                      ? `K < 1 gives ΔG° > 0 at this temperature.`
                      : `K = 1 gives ΔG° = 0 at this temperature.`}{' '}
                  K is set for one temperature, so moving the slider changes ΔG° only.
                </p>
              </div>
            </>
          ) : null}
        </div>
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {summary}
      </p>
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.row}>
      <span className={styles.rowLabel}>{label}</span>
      <span className={styles.rowValue}>{children}</span>
    </div>
  )
}
