'use client'

import { useMemo, useState, type ReactNode } from 'react'
import katex from 'katex'
import { Segmented, Slider } from '@/components/controls'
import { IonisationBeaker, formatSci } from '@/components/equilibrium'
import type { SimulationProps } from '@/components/simulation/registry'
import { polyprotic, polyproticPH } from '@/lib/chem/acid-base'
import {
  APPROXIMATION_LIMIT,
  polyproticCurve,
  weakAcidReport,
  weakBaseReport,
  weakPHCurve,
} from '@/lib/chem/weak-acid-lab'
import { NCERT_TABLE_6_6_KA, NCERT_TABLE_6_7_KB, NCERT_TABLE_6_8_POLYPROTIC } from '@/lib/chem/ncert-unit6-tables'
import styles from './weak-acid-lab.module.css'

type Mode = 'acid' | 'base' | 'polyprotic'

const MODES = [
  { value: 'acid', label: 'Weak acid' },
  { value: 'base', label: 'Weak base' },
  { value: 'polyprotic', label: 'Polyprotic acid' },
] as const satisfies readonly { value: Mode; label: string }[]

const ACIDS = NCERT_TABLE_6_6_KA.rows
const BASES = NCERT_TABLE_6_7_KB.rows
/** Sulphuric acid's first constant is listed as "very large" in Table 6.8, so it cannot enter the formula. */
const POLYPROTICS = NCERT_TABLE_6_8_POLYPROTIC.rows.flatMap((row) =>
  typeof row.ka1 === 'number' ? [{ name: row.name, kas: [row.ka1, row.ka2, row.ka3].filter((v): v is number => v !== null) }] : []
)

const LOG_C = { min: -4, max: 0, step: 0.05 } as const
const CURVE_SAMPLES = 61
const SPECIES_COLOURS = ['var(--acid)', 'var(--fwd)', 'var(--accent)', 'var(--base)'] as const

const SUPERSCRIPT: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' }
const SUBSCRIPT: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' }

/** Species name for the form with i protons removed from H_nA: H₂A, HA⁻, A²⁻ for a diprotic acid. */
function speciesLabel(i: number, n: number): string {
  const h = n - i
  const hydrogens = h === 0 ? '' : h === 1 ? 'H' : `H${SUBSCRIPT[String(h)]}`
  const charge = i === 0 ? '' : i === 1 ? '⁻' : `${SUPERSCRIPT[String(i)]}⁻`
  return `${hydrogens}A${charge}`
}

/** A TeX string rendered by KaTeX. */
function Tex({ tex }: { tex: string }) {
  const html = useMemo(() => katex.renderToString(tex, { throwOnError: false }), [tex])
  return <span className={styles.tex} dangerouslySetInnerHTML={{ __html: html }} />
}

/** Digits of a formula written as subscripts, for the option labels: CH3COOH → CH₃COOH. */
const subscriptDigits = (formula: string) => formula.replace(/\d/g, (d) => SUBSCRIPT[d])

const percent = (v: number) => `${(v * 100).toFixed(v < 0.1 ? 2 : 1)} %`
const fixed = (v: number, d = 2) => v.toFixed(d).replace(/-/g, '−')

/** Log-scale x-axis tick positions: whole powers of ten. */
const TICKS = [-4, -3, -2, -1, 0] as const

/** Swatches for a chart, as HTML so they never sit on top of a curve. */
function ChartLegend({ items }: { items: { colour: string; label: string; dashed?: boolean }[] }) {
  return (
    <ul className={styles.legend} aria-hidden="true">
      {items.map((item) => (
        <li key={item.label}>
          <span
            className={styles.swatch}
            style={item.dashed ? { borderTopColor: item.colour, borderTopStyle: 'dashed' } : { background: item.colour }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  )
}

/**
 * Exact pH (solid) and the √(K·c) shortcut (dashed) against log₁₀ c, with the chosen solution marked.
 * The shortcut bends away from the exact curve once the acid is dilute enough for α to pass 5 %.
 */
function PHCurveChart({ points, markerLogC, markerPH, label }: { points: { logC: number; pH: number; pHApprox: number }[]; markerLogC: number; markerPH: number; label: string }) {
  const W = 520
  const H = 300
  const x0 = 62
  const x1 = 500
  const y0 = 24
  const y1 = 250
  const pHMin = 1
  const pHMax = 13
  const X = (logC: number) => x0 + ((logC - LOG_C.min) / (LOG_C.max - LOG_C.min)) * (x1 - x0)
  const Y = (pH: number) => y1 - ((Math.min(pHMax, Math.max(pHMin, pH)) - pHMin) / (pHMax - pHMin)) * (y1 - y0)
  const exactPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${X(p.logC).toFixed(1)} ${Y(p.pH).toFixed(1)}`).join(' ')
  const approxPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${X(p.logC).toFixed(1)} ${Y(p.pHApprox).toFixed(1)}`)
    .join(' ')
  return (
    <>
      <ChartLegend
        items={[
          { colour: 'var(--accent)', label: 'exact' },
          { colour: 'var(--fg-muted)', label: '√(K·c) shortcut', dashed: true },
        ]}
      />
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className={styles.chart} data-testid="ph-chart">
        {[2, 4, 6, 8, 10, 12].map((ph) => (
          <g key={ph}>
            <line x1={x0} x2={x1} y1={Y(ph)} y2={Y(ph)} stroke="var(--border)" strokeWidth={1} />
            <text x={x0 - 10} y={Y(ph)} textAnchor="end" dominantBaseline="central" fontSize={14} fill="var(--fg-muted)">
              {ph}
            </text>
          </g>
        ))}
        {TICKS.map((t) => (
          <text key={t} x={X(t)} y={y1 + 22} textAnchor="middle" fontSize={14} fill="var(--fg-muted)">
            {t === 0 ? '0' : `−${Math.abs(t)}`}
          </text>
        ))}
        <text x={(x0 + x1) / 2} y={H - 4} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
          log₁₀ c (c in mol L⁻¹)
        </text>
        <text x={18} y={(y0 + y1) / 2} textAnchor="middle" fontSize={15} fill="var(--fg-muted)" transform={`rotate(-90 18 ${(y0 + y1) / 2})`}>
          pH
        </text>
        <path d={approxPath} fill="none" stroke="var(--fg-muted)" strokeWidth={2} strokeDasharray="6 5" />
        <path d={exactPath} fill="none" stroke="var(--accent)" strokeWidth={3} strokeLinejoin="round" />
        <line x1={X(markerLogC)} x2={X(markerLogC)} y1={y0} y2={y1} stroke="var(--rev)" strokeWidth={1.5} />
        <circle cx={X(markerLogC)} cy={Y(markerPH)} r={6} fill="var(--rev)" stroke="var(--surface)" strokeWidth={2} />
      </svg>
      </>
  )
}

/**
 * Species fractions of a polyprotic acid against pH, with the solution's own pH marked. Each curve is
 * one form of the acid, from H_nA at low pH to Aⁿ⁻ at high pH.
 */
function SpeciesChart({ kas, markerPH }: { kas: readonly number[]; markerPH: number }) {
  const n = kas.length
  const curve = useMemo(() => polyproticCurve(kas, 0, 14, 141), [kas])
  const W = 520
  const H = 300
  const x0 = 62
  const x1 = 500
  const y0 = 24
  const y1 = 250
  const X = (pH: number) => x0 + (pH / 14) * (x1 - x0)
  const Y = (f: number) => y1 - f * (y1 - y0)
  return (
    <>
      <ChartLegend items={Array.from({ length: n + 1 }, (_, i) => ({ colour: SPECIES_COLOURS[i % SPECIES_COLOURS.length], label: speciesLabel(i, n) }))} />
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Species fractions against pH for a ${n}-protic acid, with the solution at pH ${fixed(markerPH)}`} className={styles.chart} data-testid="species-chart">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={x0} x2={x1} y1={Y(f)} y2={Y(f)} stroke="var(--border)" strokeWidth={1} />
            <text x={x0 - 10} y={Y(f)} textAnchor="end" dominantBaseline="central" fontSize={14} fill="var(--fg-muted)">
              {f.toFixed(2)}
            </text>
          </g>
        ))}
        {[0, 2, 4, 6, 8, 10, 12, 14].map((ph) => (
          <text key={ph} x={X(ph)} y={y1 + 22} textAnchor="middle" fontSize={14} fill="var(--fg-muted)">
            {ph}
          </text>
        ))}
        <text x={(x0 + x1) / 2} y={H - 4} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
          pH
        </text>
        <text x={18} y={(y0 + y1) / 2} textAnchor="middle" fontSize={15} fill="var(--fg-muted)" transform={`rotate(-90 18 ${(y0 + y1) / 2})`}>
          fraction
        </text>
        {Array.from({ length: n + 1 }, (_, i) => {
          const d = curve.map((p, j) => `${j === 0 ? 'M' : 'L'}${X(p.pH).toFixed(1)} ${Y(p.fractions[i]).toFixed(1)}`).join(' ')
          return <path key={i} d={d} fill="none" stroke={SPECIES_COLOURS[i % SPECIES_COLOURS.length]} strokeWidth={3} strokeLinejoin="round" data-species={i} />
        })}
        <line x1={X(markerPH)} x2={X(markerPH)} y1={y0} y2={y1} stroke="var(--rev)" strokeWidth={1.5} />
      </svg>
      </>
  )
}

/**
 * A weak acid, a weak base or a polyprotic acid at a chosen concentration. The library's exact quadratic
 * gives α, [H₃O⁺] or [OH⁻] and pH; the √(K·c) shortcut is shown beside it, flagged once α passes 5 %.
 * The polyprotic mode plots the species fractions against pH and marks the pH the solution takes.
 */
export function WeakAcidLab(_props: SimulationProps) {
  const [mode, setMode] = useState<Mode>('acid')
  const [acidIndex, setAcidIndex] = useState(4)
  const [baseIndex, setBaseIndex] = useState(2)
  const [polyIndex, setPolyIndex] = useState(0)
  const [logC, setLogC] = useState(-1)

  const c = 10 ** logC
  const cText = formatSci(c, 2)
  const cLabel = `${cText} mol L⁻¹`

  let summary = ''
  let body: ReactNode = null

  if (mode === 'acid') {
    const row = ACIDS[acidIndex]
    const r = weakAcidReport(c, row.ka)
    const points = weakPHCurve('acid', row.ka, LOG_C.min, LOG_C.max, CURVE_SAMPLES)
    const verdict = r.approximationHolds
      ? `The shortcut holds: its α is ${percent(r.alphaApprox)}, under 5 %.`
      : `The shortcut fails: its α would be ${percent(r.alphaApprox)}, over 5 %, so the quadratic is needed.`
    summary = `${row.name} at ${cLabel}, Ka ${formatSci(row.ka, 2)}. α is ${percent(r.alpha)}, [H₃O⁺] is ${formatSci(r.hConc, 2)} mol per litre and pH is ${fixed(r.pH)}. The shortcut gives pH ${fixed(r.pHApprox)}. ${verdict}`
    body = (
      <>
        <div className={styles.beakerWrap}>
          <svg viewBox="0 0 260 262" role="img" aria-label={`Beaker of ${row.name} with ${percent(r.alpha)} ionised`} className={styles.beaker}>
            <g transform="translate(10, 4) scale(1)">
              <IonisationBeaker fractionIonised={r.alpha} molecules={36} seed={5} title={`${row.name} beaker, ${percent(r.alpha)} ionised`} />
            </g>
          </svg>
        </div>
        <Readout
          rows={[
            ['Constant', <Tex key="k" tex={`K_a = ${formatSci(row.ka, 2)}`} />],
            ['α (exact)', <span key="a" data-testid="alpha">{percent(r.alpha)}</span>],
            ['[H₃O⁺] (exact)', <span key="h" data-testid="h">{formatSci(r.hConc, 2)} mol L⁻¹</span>],
            ['pH (exact)', <span key="p" data-testid="ph">{fixed(r.pH)}</span>],
            ['pH (shortcut √(Ka·c))', <span key="ps" data-testid="ph-approx">{fixed(r.pHApprox)}</span>],
          ]}
        />
        <p className={r.approximationHolds ? styles.ok : styles.warn} data-testid="verdict">
          {r.approximationHolds ? 'Shortcut holds: α under 5 %' : 'Shortcut fails: α over 5 %, use the quadratic'}
        </p>
        <PHCurveChart
          points={points}
          markerLogC={logC}
          markerPH={r.pH}
          label={`pH against log c for ${row.name}, exact and shortcut, with the current solution marked`}
        />
      </>
    )
  } else if (mode === 'base') {
    const row = BASES[baseIndex]
    const r = weakBaseReport(c, row.kb)
    const points = weakPHCurve('base', row.kb, LOG_C.min, LOG_C.max, CURVE_SAMPLES)
    const verdict = r.approximationHolds
      ? `The shortcut holds: its α is ${percent(r.alphaApprox)}, under 5 %.`
      : `The shortcut fails: its α would be ${percent(r.alphaApprox)}, over 5 %, so the quadratic is needed.`
    summary = `${row.name} at ${cLabel}, Kb ${formatSci(row.kb, 2)}. α is ${percent(r.alpha)}, [OH⁻] is ${formatSci(r.ohConc, 2)} mol per litre and pH is ${fixed(r.pH)}. The shortcut gives pH ${fixed(r.pHApprox)}. ${verdict}`
    body = (
      <>
        <Readout
          rows={[
            ['Constant', <Tex key="k" tex={`K_b = ${formatSci(row.kb, 2)}`} />],
            ['α (exact)', <span key="a" data-testid="alpha">{percent(r.alpha)}</span>],
            ['[OH⁻] (exact)', <span key="o" data-testid="oh">{formatSci(r.ohConc, 2)} mol L⁻¹</span>],
            ['pH (exact)', <span key="p" data-testid="ph">{fixed(r.pH)}</span>],
            ['pH (shortcut √(Kb·c))', <span key="ps" data-testid="ph-approx">{fixed(r.pHApprox)}</span>],
          ]}
        />
        <p className={r.approximationHolds ? styles.ok : styles.warn} data-testid="verdict">
          {r.approximationHolds ? 'Shortcut holds: α under 5 %' : 'Shortcut fails: α over 5 %, use the quadratic'}
        </p>
        <PHCurveChart
          points={points}
          markerLogC={logC}
          markerPH={r.pH}
          label={`pH against log c for ${row.name}, exact and shortcut, with the current solution marked`}
        />
      </>
    )
  } else {
    const row = POLYPROTICS[polyIndex]
    const pHValue = polyproticPH(c, row.kas)
    const fractions = polyprotic(pHValue, row.kas)
    const dominant = fractions.indexOf(Math.max(...fractions))
    summary = `${row.name} at ${cLabel} has pH ${fixed(pHValue)}. The most abundant form there is ${speciesLabel(dominant, row.kas.length)} at ${percent(fractions[dominant])}.`
    body = (
      <>
        <Readout
          rows={[
            ['Constants', <Tex key="k" tex={row.kas.map((k, i) => `K_{a${i + 1}} = ${formatSci(k, 2)}`).join(' \\quad ')} />],
            ['pH (charge balance)', <span key="p" data-testid="ph">{fixed(pHValue)}</span>],
            ['Most abundant form', <span key="d" data-testid="dominant">{speciesLabel(dominant, row.kas.length)} ({percent(fractions[dominant])})</span>],
          ]}
        />
        <SpeciesChart kas={row.kas} markerPH={pHValue} />
      </>
    )
  }

  const activeList = mode === 'acid' ? ACIDS : mode === 'base' ? BASES : POLYPROTICS

  return (
    <div className={styles.sim} data-testid="weak-acid-lab" data-mode={mode}>
      <div className={styles.layout}>
        <div className={styles.inputs}>
          <Segmented
            label="Species type"
            options={MODES}
            value={mode}
            onChange={(v) => setMode(v)}
          />

          <div className={styles.card}>
            <label className={styles.label} htmlFor="weak-acid-species">
              {mode === 'acid' ? 'Weak acid (Table 6.6)' : mode === 'base' ? 'Weak base (Table 6.7)' : 'Polyprotic acid (Table 6.8)'}
            </label>
            <select
              id="weak-acid-species"
              className={styles.select}
              value={mode === 'acid' ? acidIndex : mode === 'base' ? baseIndex : polyIndex}
              onChange={(e) => {
                const i = Number(e.target.value)
                if (mode === 'acid') setAcidIndex(i)
                else if (mode === 'base') setBaseIndex(i)
                else setPolyIndex(i)
              }}
            >
              {activeList.map((row, i) => (
                <option key={row.name} value={i}>
                  {'formula' in row ? `${row.name}, ${subscriptDigits(row.formula)}` : row.name}
                </option>
              ))}
            </select>
            {mode === 'polyprotic' && (
              <p className={styles.note}>Sulphuric acid is left out: its first constant is listed as “very large” in Table 6.8.</p>
            )}
          </div>

          <div className={styles.card}>
            <Slider
              label="c"
              value={logC}
              min={LOG_C.min}
              max={LOG_C.max}
              step={LOG_C.step}
              unit="mol L⁻¹"
              format={(v) => `${formatSci(10 ** v, 2)} mol L⁻¹`}
              onChange={(v) => setLogC(v)}
            />
            <p className={styles.note}>The slider sets log₁₀ c, so each step is a change of about 12 %.</p>
          </div>

          {mode !== 'polyprotic' && (
          <div className={styles.card}>
            <h4 className={styles.cardTitle}>The shortcut</h4>
            <p className={styles.note}>
              For a weak acid, x ≪ c lets [H₃O⁺] ≈ √(Ka·c). That is accepted while √(Ka/c) is below {APPROXIMATION_LIMIT * 100} %. The
              quadratic is always exact.
            </p>
          </div>
          )}
        </div>

        <div className={styles.outputs}>
          {body}
        </div>
      </div>

      <p className={styles.summary} aria-live="polite" data-testid="summary">
        {summary}
      </p>
    </div>
  )
}

/** A two-column readout of labelled values. */
function Readout({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className={styles.readout}>
      {rows.map(([label, value]) => (
        <div key={label} className={styles.readoutRow}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}
