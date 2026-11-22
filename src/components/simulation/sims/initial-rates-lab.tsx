'use client'

import { useState } from 'react'
import katex from 'katex'
import 'katex/contrib/mhchem'
import { Button, Segmented, Slider } from '@/components/controls'
import type { SimulationProps } from '@/components/simulation/registry'
import {
  LAB_REACTIONS,
  compareRuns,
  initialRate,
  reactionById,
  roundConc,
  type LabReaction,
  type LabReactionId,
  type LabRun,
  type RunComparison,
} from '@/lib/chem/initial-rates-lab'
import { formatSig, rateConstantUnits, rationalFromNumber } from '@/lib/chem/kinetics'
import { InitialRatesDrawing } from './initial-rates-drawing'
import styles from './initial-rates-lab.module.css'

const MAX_RUNS = 8
const RATE_UNIT = 'mol L⁻¹ s⁻¹'

type Concs = Record<string, number>

function tex(source: string, display = false): string {
  return katex.renderToString(source, { throwOnError: false, displayMode: display })
}

/** Unicode subscripts for UI text: O2 becomes O₂. Hypothetical single letters pass through. */
function pretty(ce: string): string {
  return ce.replace(/\d/g, (d) => '₀₁₂₃₄₅₆₇₈₉'[Number(d)])
}

function startingConcs(reaction: LabReaction): Concs {
  return Object.fromEntries(reaction.species.map((s) => [s.key, s.defaultValue]))
}

/** Exponent as TeX: 2, 1, \frac{1}{2}; zero orders are dropped by the caller. */
function exponentTex(x: number): string {
  const r = rationalFromNumber(x)
  return r.denominator === 1 ? `${r.numerator}` : `\\frac{${r.numerator}}{${r.denominator}}`
}

function rateLawTex(reaction: LabReaction): string {
  const factors = reaction.species
    .map((s) => {
      const x = reaction.orders[s.key]
      if (x === 0) return ''
      return `[\\ce{${s.ce}}]${x === 1 ? '' : `^{${exponentTex(x)}}`}`
    })
    .join('')
  return `\\text{Rate} = k${factors}`
}

function overallOrderOf(reaction: LabReaction): number {
  return Object.values(reaction.orders).reduce((sum, x) => sum + x, 0)
}

function cleanOrder(x: number): number {
  return Math.abs(x) < 1e-9 ? 0 : x
}

function describeComparison(reaction: LabReaction, c: RunComparison): string {
  if (c.kind === 'same') return 'These two runs used the same concentrations. Change one of them.'
  if (c.kind === 'several') return 'Two concentrations changed. Compare runs that differ in one concentration only.'
  const s = reaction.species.find((sp) => sp.key === c.species)
  return `[${pretty(s?.ce ?? c.species)}] changed ×${formatSig(c.concRatio, 3)} and the rate changed ×${formatSig(c.rateRatio, 3)}, so the order in ${pretty(s?.ce ?? c.species)} is ${formatSig(cleanOrder(c.order), 3)}.`
}

export function InitialRatesLab({ reducedMotion }: SimulationProps) {
  const [reactionId, setReactionId] = useState<LabReactionId>('no-o2')
  const reaction = reactionById(reactionId)
  const [concs, setConcs] = useState<Concs>(() => startingConcs(reaction))
  const [runs, setRuns] = useState<LabRun[]>([])
  const [pickA, setPickA] = useState(0)
  const [pickB, setPickB] = useState(1)
  const [revealed, setRevealed] = useState(false)

  const maxRate = runs.reduce((m, r) => Math.max(m, r.rate), 0)
  // One scale for every meter: the largest run, rounded up to 3 decimals (1 when there are no runs).
  const meterScale = runs.length > 0 ? Math.ceil(maxRate * 1000 - 1e-9) / 1000 : 1
  const lastRun = runs[runs.length - 1]
  const runA = runs[Math.min(pickA, runs.length - 1)]
  const runB = runs[Math.min(pickB, runs.length - 1)]
  const comparison = runs.length >= 2 && runA && runB && runA !== runB ? compareRuns(reaction, runA, runB) : undefined

  function chooseReaction(id: LabReactionId) {
    const next = reactionById(id)
    setReactionId(id)
    setConcs(startingConcs(next))
    setRuns([])
    setPickA(0)
    setPickB(1)
    setRevealed(false)
  }

  function setConc(key: string, value: number) {
    setConcs((prev) => ({ ...prev, [key]: roundConc(value) }))
  }

  function run() {
    if (runs.length >= MAX_RUNS) return
    const rate = initialRate(reaction, concs)
    setRuns((prev) => [...prev, { concs: { ...concs }, rate }])
  }

  const live = lastRun
    ? `Run ${runs.length}: ${reaction.species.map((s) => `[${pretty(s.ce)}] ${lastRun.concs[s.key].toFixed(2)}`).join(', ')} mol L⁻¹, ${reaction.rateName} ${formatSig(lastRun.rate, 3)} ${RATE_UNIT}.`
    : 'No runs yet. Set the starting concentrations and press Run.'

  const overall = overallOrderOf(reaction)
  const unitsText = rateConstantUnits(overall).text

  return (
    <div className={styles.lab} data-reaction={reaction.id}>
      <Segmented<LabReactionId>
        label="Reaction"
        value={reactionId}
        onChange={chooseReaction}
        options={LAB_REACTIONS.map((r) => ({ value: r.id, label: r.label }))}
      />

      <div className={styles.equation}>
        <div dangerouslySetInnerHTML={{ __html: tex(`\\ce{${reaction.equation}}`, true) }} />
        <p className={styles.note}>
          {reaction.origin === 'table'
            ? 'NCERT Table 3.2 data. The rate here is the rate of NO₂ formation.'
            : 'An invented reaction. Its orders are hidden until you reveal the rate law.'}
        </p>
      </div>

      <div className={styles.sliders}>
        {reaction.species.map((s) => (
          <Slider
            key={s.key}
            label={`Starting [${pretty(s.ce)}]`}
            value={concs[s.key]}
            min={s.min}
            max={s.max}
            step={s.step}
            unit="mol L⁻¹"
            format={(v) => v.toFixed(2)}
            onChange={(v) => setConc(s.key, v)}
          />
        ))}
      </div>

      <div className={styles.actions}>
        <Button variant="primary" onClick={run} disabled={runs.length >= MAX_RUNS}>
          Run
        </Button>
        <Button variant="secondary" onClick={() => { setRuns([]); setRevealed(false) }} disabled={runs.length === 0}>
          Clear table
        </Button>
        {runs.length >= MAX_RUNS && <span className={styles.note}>The table is full. Clear it to run more.</span>}
      </div>

      <figure className={styles.stage}>
        <InitialRatesDrawing
          species={reaction.species.map((s) => ({ key: s.key, symbol: pretty(s.ce) }))}
          concs={concs}
          runs={runs}
          scale={meterScale}
        />
      </figure>

      <div className={styles.tableWrap}>
        {runs.length === 0 ? (
          <p className={styles.empty}>No runs yet. Each Run adds a row with its initial rate.</p>
        ) : (
          <table className={styles.table}>
            <caption className={styles.srOnly}>Initial-rate runs for {reaction.label}</caption>
            <thead>
              <tr>
                <th scope="col">Run</th>
                {reaction.species.map((s) => (
                  <th scope="col" key={s.key}>
                    [{pretty(s.ce)}] / mol L⁻¹
                  </th>
                ))}
                <th scope="col">Initial rate / {RATE_UNIT}</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r, i) => (
                <tr key={i}>
                  <th scope="row">{i + 1}</th>
                  {reaction.species.map((s) => (
                    <td key={s.key}>{r.concs[s.key].toFixed(2)}</td>
                  ))}
                  <td>
                    <span className={styles.rateCell}>
                      <span className={reducedMotion ? styles.barStatic : styles.bar} style={{ width: `${(r.rate / maxRate) * 100}%` }} aria-hidden="true" />
                      <span>{formatSig(r.rate, 3)}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <section className={styles.panel} aria-label="Find the orders">
        <h3 className={styles.heading}>Find the orders</h3>
        {runs.length < 2 ? (
          <p className={styles.note}>Make at least two runs. Then pick two rows to compare.</p>
        ) : (
          <>
            <Segmented<string>
              label="First run"
              value={String(Math.min(pickA, runs.length - 1))}
              onChange={(v) => setPickA(Number(v))}
              options={runs.map((_, i) => ({ value: String(i), label: `Run ${i + 1}` }))}
            />
            <Segmented<string>
              label="Second run"
              value={String(Math.min(pickB, runs.length - 1))}
              onChange={(v) => setPickB(Number(v))}
              options={runs.map((_, i) => ({ value: String(i), label: `Run ${i + 1}` }))}
            />
            {comparison ? (
              <>
                <p className={styles.result}>{describeComparison(reaction, comparison)}</p>
                {comparison.kind === 'order' && (
                  <div dangerouslySetInnerHTML={{ __html: tex(`n = \\dfrac{\\log(\\text{rate ratio})}{\\log(\\text{concentration ratio})} = \\dfrac{\\log ${formatSig(comparison.rateRatio, 3)}}{\\log ${formatSig(comparison.concRatio, 3)}}`, true) }} />
                )}
              </>
            ) : (
              <p className={styles.note}>Pick two different runs.</p>
            )}
          </>
        )}
        <Button variant="secondary" onClick={() => setRevealed(true)} disabled={runs.length < 2 || revealed}>
          Reveal the rate law and k
        </Button>
        {revealed && (
          <div className={styles.reveal}>
            <div dangerouslySetInnerHTML={{ __html: tex(rateLawTex(reaction), true) }} />
            <p className={styles.result}>
              k = {formatSig(reaction.k, 3)} {unitsText}
              {reaction.origin === 'table' ? ' (k for the rate of formation of NO₂)' : ''}
            </p>
            <p className={styles.note}>
              Overall order {formatSig(overall, 3)}. The exponents came from experiments, so they need not match the balanced coefficients.
            </p>
          </div>
        )}
      </section>

      <p className={styles.srOnly} aria-live="polite">
        {live}
      </p>
    </div>
  )
}
