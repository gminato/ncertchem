'use client'

import { useMemo, useState } from 'react'
import katex from 'katex'
import 'katex/contrib/mhchem'
import { NumberField, Segmented, Slider } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { CO2_CONCENTRATION_AT_EQUILIBRIUM } from '@/components/animations/unit6/heterogeneous/heterogeneous-steps'
import { formatConstant } from '@/components/animations/unit6/kpkc/kpkc-steps'
import {
  convertEquilibriumConstant,
  equationCe,
  expressionLatex,
  inspectEquation,
  parseEquation,
  termCe,
  type ConversionSteps,
} from '@/lib/chem/kp-kc'
import { R_BAR_L_PER_MOL_K, type Reaction } from '@/lib/chem/equilibrium'
import styles from './kp-kc-converter.module.css'

// ---------------------------------------------------------------------------
// Presets: the equations the Learner is most likely to type, with an initial constant for each.
// ---------------------------------------------------------------------------

export interface Preset {
  id: string
  label: string
  equation: string
  /** Initial Kc, mol L⁻¹ (or as the equation's basis allows). */
  kc: number
}

export const PRESETS: Preset[] = [
  { id: 'h2-i2', label: 'H₂ + I₂ ⇌ 2HI', equation: 'H2(g) + I2(g) <=> 2HI(g)', kc: 64 },
  { id: 'n2-h2', label: 'N₂ + 3H₂ ⇌ 2NH₃', equation: 'N2(g) + 3H2(g) <=> 2NH3(g)', kc: 2 },
  { id: 'nocl', label: '2NOCl ⇌ 2NO + Cl₂', equation: '2NOCl(g) <=> 2NO(g) + Cl2(g)', kc: 0.025 },
  { id: 'caco3', label: 'CaCO₃(s) ⇌ CaO(s) + CO₂(g)', equation: 'CaCO3(s) <=> CaO(s) + CO2(g)', kc: 0.02 },
  { id: 'ni', label: 'Ni(s) + 4CO ⇌ Ni(CO)₄', equation: 'Ni(s) + 4CO(g) <=> Ni(CO)4(g)', kc: 0.5 },
  { id: 'water', label: 'H₂O(l) ⇌ H₂O(g)', equation: 'H2O(l) <=> H2O(g)', kc: 0.01 },
  { id: 'no-gas', label: 'Ag₂O(s) + 2HNO₃(aq) ⇌ …', equation: 'Ag2O(s) + 2HNO3(aq) <=> 2AgNO3(aq) + H2O(l)', kc: 1 },
]

const TEMPERATURE_MIN = 300
const TEMPERATURE_MAX = 1500

// ---------------------------------------------------------------------------
// Number and LaTeX formatting
// ---------------------------------------------------------------------------

/** A number as LaTeX: three significant figures, or mantissa × 10^exp outside [0.01, 1000). */
export function texNumber(value: number): string {
  if (value === 0) return '0'
  const magnitude = Math.abs(value)
  if (magnitude >= 0.01 && magnitude < 1000) return value.toPrecision(3)
  const exp = Math.floor(Math.log10(magnitude))
  const mantissa = (value / 10 ** exp).toPrecision(3)
  return `${mantissa} \\times 10^{${exp}}`
}

/** Signed integer as LaTeX with a true minus sign: +1, −2, 0. */
export function texSigned(n: number): string {
  if (n === 0) return '0'
  return n > 0 ? `+${n}` : `-${Math.abs(n)}`
}

/** Units of Kc for a given Δn, as LaTeX; empty when Kc is dimensionless. Kc has units mol L⁻¹ to the power Δn. */
export function kcUnitTex(deltaN: number): string {
  if (deltaN === 0) return ''
  if (deltaN === 1) return '\\,\\text{mol L}^{-1}'
  if (deltaN < 0) return `\\,\\text{L}^{${-deltaN}}\\text{mol}^{${deltaN}}`
  return `\\,\\text{mol}^{${deltaN}}\\text{L}^{${-deltaN}}`
}

/** Units of Kp for a given Δn, as LaTeX: bar, bar⁻², and so on. */
export function kpUnitTex(deltaN: number): string {
  if (deltaN === 0) return ''
  if (deltaN === 1) return '\\,\\text{bar}'
  return `\\,\\text{bar}^{${deltaN}}`
}

function renderTex(tex: string, displayMode: boolean): string {
  return katex.renderToString(tex, { throwOnError: false, displayMode })
}

function renderCe(ce: string): string {
  return katex.renderToString(`\\ce{${ce}}`, { throwOnError: false })
}

// ---------------------------------------------------------------------------
// The converter
// ---------------------------------------------------------------------------

type Direction = 'Kc' | 'Kp'

interface ConverterProps {
  initialEquation: string
  initialKc: number
  initialTemperature: number
  reducedMotion: boolean
}

interface Outcome {
  reaction: Reaction
  conversion: ConversionSteps
}

/** Parses and converts; returns the error text instead of throwing, so the sim always renders. */
function compute(text: string, value: number, direction: Direction, temperatureK: number): { outcome?: Outcome; error?: string; reaction?: Reaction } {
  let reaction: Reaction
  try {
    reaction = parseEquation(text)
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Cannot read this equation' }
  }
  try {
    const conversion = convertEquilibriumConstant(reaction, value, direction, temperatureK)
    return { outcome: { reaction, conversion }, reaction }
  } catch (err) {
    return { reaction, error: err instanceof Error ? err.message : 'Cannot convert this constant' }
  }
}

function summaryText(outcome: Outcome, temperatureK: number): string {
  const { conversion } = outcome
  const input = `${conversion.from} = ${formatConstant(conversion.input)}`
  const output = `${conversion.to} = ${formatConstant(conversion.output)}${conversion.to === 'Kp' ? ' bar' : ''}`
  return `${input} at ${temperatureK} K gives ${output}, with Δn = ${signedText(conversion.inspection.deltaN)}.`
}

/** Signed integer with a true minus sign, as text: +1, −2, 0. */
function signedText(n: number): string {
  if (n === 0) return '0'
  return n > 0 ? `+${n}` : `−${Math.abs(n)}`
}

function Converter({ initialEquation, initialKc, initialTemperature, reducedMotion }: ConverterProps) {
  const [text, setText] = useState(initialEquation)
  const [presetId, setPresetId] = useState<string>(
    PRESETS.find((p) => p.equation === initialEquation)?.id ?? 'custom'
  )
  const [direction, setDirection] = useState<Direction>('Kc')
  const [value, setValue] = useState(initialKc)
  const [temperature, setTemperature] = useState(initialTemperature)

  const result = useMemo(() => compute(text, value, direction, temperature), [text, value, direction, temperature])
  const outcome = result.outcome

  const choosePreset = (id: string) => {
    setPresetId(id)
    const preset = PRESETS.find((p) => p.id === id)
    if (!preset) return
    setText(preset.equation)
    setValue(preset.kc)
    setDirection('Kc')
  }

  const editText = (next: string) => {
    setText(next)
    setPresetId(PRESETS.find((p) => p.equation === next)?.id ?? 'custom')
  }

  const inspection = result.reaction ? inspectEquation(result.reaction) : null
  const kpMissing = inspection !== null && !inspection.hasGas

  const equationHtml = useMemo(() => (result.reaction ? renderCe(equationCe(result.reaction)) : ''), [result.reaction])
  const excludedHtml = useMemo(
    () => (inspection ? inspection.excluded.map((t) => renderCe(termCe(t))) : []),
    [inspection]
  )
  const includedHtml = useMemo(
    () => (inspection ? inspection.included.map((t) => renderCe(termCe(t))) : []),
    [inspection]
  )

  const kcExpr = useMemo(() => (result.reaction ? renderTex(expressionLatex(result.reaction, 'K_{c}'), true) : ''), [result.reaction])
  const kpExpr = useMemo(() => (result.reaction && !kpMissing ? renderTex(expressionLatex(result.reaction, 'K_{p}'), true) : ''), [result.reaction, kpMissing])

  const steps = outcome ? outcome.conversion : null
  const working = useMemo(() => {
    if (!steps) return []
    const dn = steps.inspection.deltaN
    const rtText = steps.rt.toFixed(2)
    const lines: { label: string; tex: string }[] = [
      {
        label: 'Gas moles: products minus reactants (Δn)',
        tex: `\\Delta n = ${steps.inspection.gasProducts} - ${steps.inspection.gasReactants} = ${texSigned(dn)}`,
      },
      {
        label: 'RT at this temperature',
        tex: `RT = ${R_BAR_L_PER_MOL_K} \\times ${steps.temperatureK} = ${rtText}\\ \\text{L bar mol}^{-1}`,
      },
      {
        label: 'Factor (RT) to the power Δn',
        tex: `(RT)^{\\Delta n} = ${rtText}^{${texSigned(dn)}} = ${texNumber(steps.factor)}`,
      },
    ]
    if (steps.to === 'Kp') {
      lines.push({
        label: 'Kp = Kc × factor',
        tex: `K_{p} = K_{c}\\,(RT)^{\\Delta n} = ${texNumber(steps.input)} \\times ${texNumber(steps.factor)} = ${texNumber(steps.output)}${kpUnitTex(dn)}`,
      })
    } else {
      lines.push({
        label: 'Kc = Kp / factor',
        tex: `K_{c} = \\frac{K_{p}}{(RT)^{\\Delta n}} = \\frac{${texNumber(steps.input)}}{${texNumber(steps.factor)}} = ${texNumber(steps.output)}${kcUnitTex(dn)}`,
      })
    }
    return lines
  }, [steps])

  const resultTex = steps
    ? steps.to === 'Kp'
      ? `K_{p} = ${texNumber(steps.output)}${kpUnitTex(steps.inspection.deltaN)}`
      : `K_{c} = ${texNumber(steps.output)}${kcUnitTex(steps.inspection.deltaN)}`
    : ''
  const resultHtml = resultTex ? renderTex(resultTex, true) : ''

  const live = result.error
    ? `Cannot convert yet: ${result.error}.`
    : outcome
      ? summaryText(outcome, temperature)
      : ''

  const gasBars = inspection
    ? { reactants: inspection.gasReactants, products: inspection.gasProducts }
    : { reactants: 0, products: 0 }
  const maxGas = Math.max(gasBars.reactants, gasBars.products, 1)

  return (
    <div className={styles.sim} data-reduced-motion={reducedMotion ? 'true' : 'false'} data-testid="kp-kc-converter">
      <section className={styles.panel} aria-label="Equation">
        <h4 className={styles.kicker}>Equation</h4>
        {result.reaction ? (
          <div className={styles.equation} dangerouslySetInnerHTML={{ __html: equationHtml }} data-testid="kpkc-equation" />
        ) : (
          <p className={styles.note}>Type an equation with &lt;=&gt; between the sides.</p>
        )}
        <div className={styles.chips}>
          {includedHtml.length > 0 && (
            <div className={styles.chipRow}>
              <span className={styles.chipLabel}>Counted in K</span>
              {includedHtml.map((html, i) => (
                <span key={`in-${i}`} className={styles.chipIn} dangerouslySetInnerHTML={{ __html: html }} />
              ))}
            </div>
          )}
          {excludedHtml.length > 0 && (
            <div className={styles.chipRow} data-testid="kpkc-excluded">
              <span className={styles.chipLabel}>Left out of K (solid or liquid)</span>
              {excludedHtml.map((html, i) => (
                <span key={`out-${i}`} className={styles.chipOut} dangerouslySetInnerHTML={{ __html: html }} />
              ))}
            </div>
          )}
        </div>
      </section>

      <div className={styles.grid}>
        <section className={styles.panel} aria-label="Equilibrium constants">
          <h4 className={styles.kicker}>Equilibrium constants</h4>
          {result.reaction && (
            <>
              <div className={styles.expr} dangerouslySetInnerHTML={{ __html: kcExpr }} data-testid="kpkc-kc-expression" />
              {kpMissing ? (
                <p className={styles.note} data-testid="kpkc-no-gas">
                  No species is a gas, so Kp has no partial pressures and is not defined.
                </p>
              ) : (
                <div className={styles.expr} dangerouslySetInnerHTML={{ __html: kpExpr }} data-testid="kpkc-kp-expression" />
              )}
            </>
          )}
        </section>

        <section className={styles.panel} aria-label="Gaseous moles">
          <h4 className={styles.kicker}>Gaseous moles</h4>
          {inspection && (
            <div className={styles.ledger} data-testid="kpkc-ledger">
              {(['reactants', 'products'] as const).map((side) => (
                <div key={side} className={styles.ledgerCol}>
                  <div className={styles.ledgerBar} style={{ height: `${(gasBars[side] / maxGas) * 100}%` }} data-side={side}>
                    <span>{gasBars[side]}</span>
                  </div>
                  <span className={styles.ledgerLabel}>{side}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className={styles.panel} aria-label="Working">
        <h4 className={styles.kicker}>Working</h4>
        {steps ? (
          <ol className={styles.working} data-testid="kpkc-working">
            {working.map((line, i) => (
              <li key={i}>
                <span className={styles.lineLabel}>{line.label}</span>
                <span dangerouslySetInnerHTML={{ __html: renderTex(line.tex, true) }} />
              </li>
            ))}
          </ol>
        ) : (
          <p className={styles.note}>{result.error ?? 'Enter a constant above zero.'}</p>
        )}
        {resultHtml && <div className={styles.result} dangerouslySetInnerHTML={{ __html: resultHtml }} data-testid="kpkc-result" />}
      </section>

      <p className={styles.live} aria-live="polite" data-testid="kpkc-live">
        {live}
      </p>

      <SimulationControls>
        <div className={styles.controlGrid}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Preset</span>
            <select
              className={styles.select}
              value={presetId}
              onChange={(e) => choosePreset(e.target.value)}
              data-testid="kpkc-preset"
            >
              {PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id === 'no-gas' ? 'No gas: Kp undefined' : p.label}
                </option>
              ))}
              {presetId === 'custom' && <option value="custom">Custom equation</option>}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Equation (type your own)</span>
            <input
              className={styles.input}
              type="text"
              value={text}
              onChange={(e) => editText(e.target.value)}
              spellCheck={false}
              aria-invalid={result.error ? 'true' : 'false'}
              aria-describedby="kpkc-hint"
              data-testid="kpkc-text"
            />
            <span id="kpkc-hint" className={styles.hint}>
              Every species needs (g), (aq), (l) or (s). Terms are joined by + and the sides by &lt;=&gt;.
            </span>
          </label>
          <Segmented<Direction>
            label="Convert"
            options={[
              { value: 'Kc', label: 'Kc → Kp' },
              { value: 'Kp', label: 'Kp → Kc' },
            ]}
            value={direction}
            onChange={setDirection}
          />
          <NumberField
            label={direction === 'Kc' ? 'Kc (the given constant)' : 'Kp (the given constant)'}
            value={value}
            min={1e-6}
            max={1e6}
            step="any"
            precision={4}
            onChange={setValue}
          />
          <Slider
            label="Temperature"
            value={temperature}
            min={TEMPERATURE_MIN}
            max={TEMPERATURE_MAX}
            step={10}
            unit="K"
            onChange={setTemperature}
          />
        </div>
      </SimulationControls>
    </div>
  )
}

/** The converter for Section 6.4: starts on N2 + 3H2 at 500 K, with every preset in the list. */
export function KpKcConverter({ reducedMotion }: SimulationProps) {
  return (
    <Converter
      initialEquation="N2(g) + 3H2(g) <=> 2NH3(g)"
      initialKc={2}
      initialTemperature={500}
      reducedMotion={reducedMotion}
    />
  )
}

/** The same converter, started on CaCO3(s) at 1100 K for Section 6.5. */
export function HeterogeneousConverter({ reducedMotion }: SimulationProps) {
  return (
    <Converter
      initialEquation="CaCO3(s) <=> CaO(s) + CO2(g)"
      initialKc={CO2_CONCENTRATION_AT_EQUILIBRIUM}
      initialTemperature={1100}
      reducedMotion={reducedMotion}
    />
  )
}
