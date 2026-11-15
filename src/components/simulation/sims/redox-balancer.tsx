'use client'

import React, { useId, useMemo, useRef, useState } from 'react'
import { Button, Segmented } from '@/components/controls'
import { Ce, EquationView, HalfCard, TallyStrip } from '@/components/animations/unit7/balance/BalanceEquation'
import { useIsActive } from '@/components/simulation/useIsActive'
import type { SimulationProps } from '@/components/simulation/registry'
import {
  BALANCER_PRESETS,
  RAIL_LABELS,
  getBalancerStep,
  getPresetBalanceResult,
  prettyFormula,
  type BalancerMethod,
  type BalancerPreset,
  type BalancerStepView,
} from '@/lib/chem/balancer-presets'
import styles from './redox-balancer.module.css'

type Mode = 'walkthrough' | 'try-it'
type Status = 'open' | 'solved' | 'revealed'

const METHOD_OPTIONS: { value: BalancerMethod; label: string }[] = [
  { value: 'half-reaction', label: 'Half-reaction (basic or acidic)' },
  { value: 'oxidation-number', label: 'Oxidation number' },
]

/** Compares a typed answer with a target, accepting only whole numbers. */
function isCorrect(text: string, target: number): boolean {
  if (text.trim() === '') return false
  const n = Number(text)
  return Number.isInteger(n) && n === target
}

function oxText(n: number): string {
  return n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0'
}

export function RedoxBalancer({ reducedMotion }: SimulationProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const active = useIsActive(rootRef)
  const uid = useId()

  const [presetId, setPresetId] = useState<string>(BALANCER_PRESETS[0].id)
  const [method, setMethod] = useState<BalancerMethod>('half-reaction')
  const [mode, setMode] = useState<Mode>('walkthrough')
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [wrongTries, setWrongTries] = useState(0)
  const [status, setStatus] = useState<Status>('open')
  const [feedback, setFeedback] = useState<string[]>([])

  const preset = BALANCER_PRESETS.find((p) => p.id === presetId) ?? BALANCER_PRESETS[0]
  const total = getPresetBalanceResult(preset, method).steps.length
  const view: BalancerStepView = useMemo(
    () => getBalancerStep(preset, method, stepIndex),
    [preset, method, stepIndex],
  )
  const rail = RAIL_LABELS[method]
  const challenge = mode === 'try-it' ? view.challenge : undefined
  const motion = !reducedMotion

  const resetQuestion = () => {
    setAnswers({})
    setWrongTries(0)
    setStatus('open')
    setFeedback([])
  }

  const goTo = (index: number) => {
    setStepIndex(Math.max(0, Math.min(total - 1, index)))
    resetQuestion()
  }

  const choosePreset = (id: string) => {
    setPresetId(id)
    setStepIndex(0)
    resetQuestion()
  }

  const chooseMethod = (m: BalancerMethod) => {
    setMethod(m)
    setStepIndex(0)
    resetQuestion()
  }

  const chooseMode = (m: Mode) => {
    setMode(m)
    resetQuestion()
  }

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!challenge || status !== 'open') return
    const messages: string[] = []
    let allRight = true
    for (const field of challenge.fields) {
      if (isCorrect(answers[field.id] ?? '', field.target)) continue
      allRight = false
      messages.push(field.hint)
    }
    if (allRight) {
      setStatus('solved')
      setFeedback([])
      return
    }
    const tries = wrongTries + 1
    setWrongTries(tries)
    if (tries >= 2) {
      // After two wrong tries, reveal the answer so the learner can carry on.
      const revealed: Record<string, string> = {}
      for (const field of challenge.fields) revealed[field.id] = String(field.target)
      setAnswers(revealed)
      setStatus('revealed')
      setFeedback(challenge.fields.map((f) => `${f.label}: ${f.target}.`))
      return
    }
    setFeedback(messages)
  }

  const nextStep = () => {
    goTo(stepIndex + 1)
  }

  const cardsForHalves = method === 'half-reaction' && view.halves
  const cardsForON = method === 'oxidation-number' && view.onCards

  const summaryText = `Reaction ${preset.name}, ${preset.medium} medium, ${
    method === 'half-reaction' ? 'half-reaction method' : 'oxidation-number method'
  }. Step ${stepIndex + 1} of ${total}: ${view.title}. ${view.description}${
    challenge && status === 'open' ? ' Try it: answer the question to continue.' : ''
  }`

  return (
    <div ref={rootRef} className={styles.root} data-active={active ? 'true' : 'false'} data-medium={preset.medium}>
      {/* Toolbar: skeleton, method, mode */}
      <div className={styles.toolbar}>
        <div className={styles.field}>
          <label htmlFor={`${uid}-preset`} className={styles.label}>
            Reaction skeleton
          </label>
          <select
            id={`${uid}-preset`}
            className={styles.select}
            value={preset.id}
            onChange={(e) => choosePreset(e.target.value)}
            data-testid="preset-select"
          >
            {BALANCER_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.medium})
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <span className={styles.label}>Method</span>
          <Segmented<BalancerMethod>
            label="Balancing method"
            value={method}
            onChange={chooseMethod}
            options={METHOD_OPTIONS}
          />
        </div>
        <div className={styles.field}>
          <span className={styles.label}>Mode</span>
          <Segmented<Mode>
            label="Learning mode"
            value={mode}
            onChange={chooseMode}
            options={[
              { value: 'walkthrough', label: 'Walkthrough' },
              { value: 'try-it', label: 'Try it' },
            ]}
          />
        </div>
      </div>

      {/* Labelled step rail */}
      <ol className={styles.rail} aria-label="Balancing steps">
        {rail.map((label, i) => {
          const done = i < stepIndex
          const current = i === stepIndex
          const blocked = mode === 'try-it' && i > stepIndex
          return (
            <li key={label} className={styles.railItem}>
              <button
                type="button"
                className={`${styles.railButton} ${current ? styles.railCurrent : ''} ${done ? styles.railDone : ''}`}
                onClick={() => goTo(i)}
                disabled={blocked || i >= total}
                aria-current={current ? 'step' : undefined}
                data-testid={`step-dot-${i}`}
              >
                <span className={styles.railDot} aria-hidden="true">
                  {done ? '✓' : i + 1}
                </span>
                <span className={styles.railLabel}>{label}</span>
              </button>
              {i < rail.length - 1 && <span className={styles.railLine} aria-hidden="true" />}
            </li>
          )
        })}
      </ol>

      <div className={styles.stepHead}>
        <span className={styles.stepCount} data-testid="sim-step-title">
          Step {stepIndex + 1} of {total}: {view.title}
        </span>
        <span className={styles.stepDesc}>{view.description}</span>
      </div>

      {/* Hero stage: the equation, with the try-it prompt beside it */}
      <div className={`${styles.stage} ${challenge ? styles.stageWithTry : ''}`}>
        <div className={styles.hero}>
          <EquationView
            equation={view.equation}
            previous={view.previousEquation}
            roles={stepIndex >= 1 ? view.roles : undefined}
            size="hero"
            animKey={`${preset.id}-${method}-${stepIndex}`}
            reducedMotion={!motion}
            data-testid="sim-equation"
          />
          {stepIndex >= 1 && (
            <div className={styles.legend} aria-hidden="true">
              <span className={styles.legendOx}>Oxidised</span>
              <span className={styles.legendRed}>Reduced</span>
            </div>
          )}
          {view.tally.length > 0 && <TallyStrip items={view.tally} />}
        </div>

        {challenge && (
          <form className={styles.tryCard} onSubmit={submit} data-testid="challenge-card" aria-labelledby={`${uid}-prompt`}>
            <div className={styles.tryHead}>Your turn</div>
            <div id={`${uid}-prompt`} className={styles.tryPrompt}>
              {challenge.prompt}
            </div>
            <div className={styles.tryFields}>
              {challenge.fields.map((field) => (
                <label key={field.id} className={styles.tryField}>
                  <span className={styles.tryFieldLabel}>{field.label}</span>
                  <input
                    className={styles.tryInput}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={50}
                    step={1}
                    value={answers[field.id] ?? ''}
                    disabled={status !== 'open'}
                    onChange={(e) => {
                      setAnswers((a) => ({ ...a, [field.id]: e.target.value }))
                      setFeedback([])
                    }}
                    data-testid={`try-input-${field.id}`}
                  />
                </label>
              ))}
            </div>

            {status === 'open' && (
              <div className={styles.tryActions}>
                <Button type="submit" variant="primary" data-testid="check-answer-btn">
                  Check (Enter)
                </Button>
                <span className={styles.tryTries}>
                  {wrongTries === 0 ? 'Two tries before the answer is shown.' : `Wrong tries: ${wrongTries} of 2`}
                </span>
              </div>
            )}

            {status === 'open' && feedback.length > 0 && (
              <ul className={styles.feedbackWrong} data-testid="feedback-wrong" role="alert">
                {feedback.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            )}

            {status === 'solved' && (
              <div className={styles.feedbackRight} data-testid="feedback-success" role="status">
                <strong>✓ Correct.</strong> {challenge.explanation}
              </div>
            )}

            {status === 'revealed' && (
              <div className={styles.feedbackReveal} data-testid="feedback-revealed" role="status">
                <strong>The answer:</strong> {feedback.join(' ')} {challenge.explanation}
              </div>
            )}

            {status !== 'open' && (
              <div className={styles.tryActions}>
                <Button variant="primary" onClick={nextStep} disabled={stepIndex >= total - 1} data-testid="continue-btn">
                  Continue →
                </Button>
              </div>
            )}
          </form>
        )}
      </div>

      {/* Half-reaction cards, or the oxidation-number ledger, side by side on wide screens */}
      {cardsForHalves && view.halves && (
        <div className={styles.cards} data-testid="half-cards">
          <HalfCard
            tone="ox"
            title={view.halves.ox.title}
            subtitle="loses electrons"
            equation={view.halves.ox.equation}
            electrons={view.halves.ox.electrons || undefined}
            multiplier={view.halves.ox.multiplier}
            tally={view.halves.ox.tally}
            animKey={`ox-${preset.id}-${stepIndex}`}
            reducedMotion={!motion}
          />
          <HalfCard
            tone="red"
            title={view.halves.red.title}
            subtitle="gains electrons"
            equation={view.halves.red.equation}
            electrons={view.halves.red.electrons || undefined}
            multiplier={view.halves.red.multiplier}
            tally={view.halves.red.tally}
            animKey={`red-${preset.id}-${stepIndex}`}
            reducedMotion={!motion}
          />
        </div>
      )}

      {cardsForON && view.onCards && (
        <div className={styles.cards} data-testid="on-cards">
          <OxCard
            tone="ox"
            label="Oxidised · reductant"
            species={view.onCards.ox.species}
            element={view.onCards.ox.element}
            from={view.onCards.ox.from}
            to={view.onCards.ox.to}
            electrons={view.onCards.ox.electrons}
            multiplier={stepIndex >= 2 ? view.onCards.ox.multiplier : undefined}
            verb="loses"
          />
          <OxCard
            tone="red"
            label="Reduced · oxidant"
            species={view.onCards.red.species}
            element={view.onCards.red.element}
            from={view.onCards.red.from}
            to={view.onCards.red.to}
            electrons={view.onCards.red.electrons}
            multiplier={stepIndex >= 2 ? view.onCards.red.multiplier : undefined}
            verb="gains"
          />
          {stepIndex >= 2 && (
            <p className={styles.lcm}>
              Electrons lost = electrons gained = <strong>{view.onCards.lcm}</strong>
            </p>
          )}
        </div>
      )}

      {stepIndex === 0 && (
        <p className={styles.quiet}>
          {method === 'half-reaction'
            ? 'The skeleton is split into two half-reactions in step 2.'
            : 'Oxidation numbers are assigned in step 2.'}
        </p>
      )}

      {/* Navigation */}
      <div className={styles.navRow}>
        <Button variant="secondary" disabled={stepIndex === 0} onClick={() => goTo(stepIndex - 1)} data-testid="prev-step-btn">
          ← Previous step
        </Button>
        <span className={styles.navCount}>
          {stepIndex + 1} / {total}
        </span>
        {!challenge && (
          <Button variant="primary" disabled={stepIndex >= total - 1} onClick={nextStep} data-testid="next-step-btn">
            Next step →
          </Button>
        )}
        {challenge && status === 'open' && <span className={styles.navHint}>Answer the question to continue</span>}
      </div>

      <div className={styles.srOnly} aria-live="polite">
        {summaryText}
        {preset.context ? ` ${preset.context}` : ''}
      </div>
    </div>
  )
}

function OxCard({
  tone,
  label,
  species,
  element,
  from,
  to,
  electrons,
  multiplier,
  verb,
}: {
  tone: 'ox' | 'red'
  label: string
  species: string
  element: string
  from: number
  to: number
  electrons: number
  multiplier?: number
  verb: 'loses' | 'gains'
}) {
  return (
    <section className={`${styles.oxCard} ${tone === 'ox' ? styles.oxCardOx : styles.oxCardRed}`} aria-label={label}>
      <span className={styles.oxTag}>{label}</span>
      <span className={styles.oxSpecies}>
        <Ce ce={species} />
      </span>
      <span className={styles.oxNums}>
        {element} {oxText(from)} <span aria-hidden="true">→</span> {oxText(to)}
      </span>
      <span className={styles.oxNote}>
        {verb} {electrons} e⁻ per {prettyFormula(species)}
        {multiplier !== undefined && (
          <>
            {' '}
            · <strong>× {multiplier}</strong>
          </>
        )}
      </span>
    </section>
  )
}
