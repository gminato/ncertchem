'use client'

import React, { useState, useRef, useId } from 'react'
import { Button, Segmented, NumberField } from '@/components/controls'
import { HalfEquationCard } from '@/components/redox/HalfEquationCard'
import { useIsActive } from '@/components/simulation/useIsActive'
import type { SimulationProps } from '@/components/simulation/registry'
import {
  BALANCER_PRESETS,
  getPresetBalanceResult,
  getSimStepDetails,
  type BalancerPreset,
} from '@/lib/chem/balancer-presets'
import { renderFormattedFormula } from '@/components/animations/unit7/balance/RedoxBalanceHalf'
import styles from './redox-balancer.module.css'

export function RedoxBalancer({ reducedMotion }: SimulationProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const active = useIsActive(rootRef)
  const presetSelectId = useId()

  const [presetId, setPresetId] = useState<string>(BALANCER_PRESETS[0].id)
  const [method, setMethod] = useState<'half-reaction' | 'oxidation-number'>('half-reaction')
  const [stepIndex, setStepIndex] = useState<number>(0)
  const [mode, setMode] = useState<'walkthrough' | 'try-it'>('walkthrough')

  // Try-It interactive state
  const [userAnswer, setUserAnswer] = useState<number>(1)
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle')

  const preset = BALANCER_PRESETS.find((p) => p.id === presetId) ?? BALANCER_PRESETS[0]
  const fullResult = getPresetBalanceResult(preset, method)
  const totalSteps = fullResult.steps.length
  const stepDetails = getSimStepDetails(preset, method, stepIndex)

  const handlePresetChange = (newId: string) => {
    setPresetId(newId)
    setStepIndex(0)
    setFeedback('idle')
    setUserAnswer(1)
  }

  const handleMethodChange = (newMethod: 'half-reaction' | 'oxidation-number') => {
    setMethod(newMethod)
    setStepIndex(0)
    setFeedback('idle')
    setUserAnswer(1)
  }

  const handleStepChange = (newIndex: number) => {
    const clamped = Math.max(0, Math.min(totalSteps - 1, newIndex))
    setStepIndex(clamped)
    setFeedback('idle')
    setUserAnswer(1)
  }

  const handleCheckAnswer = () => {
    if (!stepDetails.challenge) return
    if (userAnswer === stepDetails.challenge.targetAnswer) {
      setFeedback('correct')
    } else {
      setFeedback('incorrect')
    }
  }

  const handleRevealAnswer = () => {
    if (!stepDetails.challenge) return
    setUserAnswer(stepDetails.challenge.targetAnswer)
    setFeedback('correct')
  }

  const ariaSummary = `Reaction ${preset.name} in ${preset.medium} medium. Method: ${
    method === 'half-reaction' ? 'Half-reaction method' : 'Oxidation-number method'
  }. Step ${stepIndex + 1} of ${totalSteps}: ${stepDetails.title}. Current equation: ${stepDetails.equationMhchem}.`

  return (
    <div
      ref={rootRef}
      className={styles.root}
      data-active={active ? 'true' : 'false'}
    >
      {/* Controls Bar */}
      <div className={styles.controlsBar}>
        <div className={styles.controlsRow}>
          <div className={styles.selectGroup}>
            <label htmlFor={presetSelectId} className={styles.controlLabel}>
              Select Reaction Skeleton
            </label>
            <select
              id={presetSelectId}
              className={styles.presetSelect}
              value={preset.id}
              onChange={(e) => handlePresetChange(e.target.value)}
              data-testid="preset-select"
            >
              {BALANCER_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.medium.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span className={styles.controlLabel}>Medium</span>
            <span
              className={`${styles.mediumBadge} ${
                preset.medium === 'acidic' ? styles.mediumAcidic : styles.mediumBasic
              }`}
            >
              {preset.medium} medium
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span className={styles.controlLabel}>Mode</span>
            <Segmented<'walkthrough' | 'try-it'>
              label="Learning Mode"
              value={mode}
              onChange={(m) => {
                setMode(m)
                setFeedback('idle')
              }}
              options={[
                { value: 'walkthrough', label: 'Walkthrough' },
                { value: 'try-it', label: 'Try It Yourself' },
              ]}
            />
          </div>
        </div>

        <div className={styles.controlsRow}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            <span className={styles.controlLabel}>Balancing Method</span>
            <Segmented<'half-reaction' | 'oxidation-number'>
              label="Method"
              value={method}
              onChange={handleMethodChange}
              options={[
                { value: 'half-reaction', label: 'Half-Reaction Method (7 steps)' },
                { value: 'oxidation-number', label: 'Oxidation Number Method (5 steps)' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Stepper Navigation Bar */}
      <div className={styles.navBar}>
        <Button
          variant="secondary"
          disabled={stepIndex === 0}
          onClick={() => handleStepChange(stepIndex - 1)}
          data-testid="prev-step-btn"
        >
          ← Previous
        </Button>

        <div className={styles.stepPills}>
          {Array.from({ length: totalSteps }, (_, i) => {
            const isActive = i === stepIndex
            const isCompleted = i < stepIndex
            return (
              <button
                key={i}
                type="button"
                className={`${styles.stepDot} ${isActive ? styles.stepDotActive : ''} ${
                  isCompleted ? styles.stepDotCompleted : ''
                }`}
                onClick={() => handleStepChange(i)}
                aria-label={`Jump to step ${i + 1}`}
                aria-current={isActive ? 'step' : undefined}
                data-testid={`step-dot-${i}`}
              >
                {i + 1}
              </button>
            )
          })}
        </div>

        <Button
          variant="primary"
          disabled={stepIndex === totalSteps - 1}
          onClick={() => handleStepChange(stepIndex + 1)}
          data-testid="next-step-btn"
        >
          Next →
        </Button>
      </div>

      {/* Step Banner */}
      <div className={styles.stepBanner}>
        <span className={styles.stepTitle} data-testid="sim-step-title">
          Step {stepIndex + 1} of {totalSteps}: {stepDetails.title}
        </span>
        <span className={styles.stepDesc}>{stepDetails.description}</span>
      </div>

      {/* Morphing Equation Display Card */}
      <div className={styles.morphEquationCard}>
        <span className={styles.morphEquationLabel}>Equation at this stage</span>
        <div className={styles.morphEquationText} data-testid="sim-equation">
          {renderFormattedFormula(stepDetails.equationMhchem)}
        </div>
      </div>

      {/* Interactive Stage Content */}
      <div className={styles.stageArea}>
        {method === 'half-reaction' && stepDetails.oxHalf && stepDetails.redHalf ? (
          <HalfEquationCard
            className={styles.cardOverride}
            title={`${preset.name} (${preset.medium} medium)`}
            oxHalf={{
              title: stepDetails.oxHalf.title,
              equation: renderFormattedFormula(stepDetails.oxHalf.equationMhchem),
              electrons: stepDetails.oxHalf.electrons,
              multiplier: stepDetails.oxHalf.multiplier,
              tally: stepDetails.oxHalf.tally,
            }}
            redHalf={{
              title: stepDetails.redHalf.title,
              equation: renderFormattedFormula(stepDetails.redHalf.equationMhchem),
              electrons: stepDetails.redHalf.electrons,
              multiplier: stepDetails.redHalf.multiplier,
              tally: stepDetails.redHalf.tally,
            }}
            overallEquation={
              stepDetails.overallEquationMhchem
                ? renderFormattedFormula(stepDetails.overallEquationMhchem)
                : undefined
            }
          />
        ) : (
          <div className={styles.onMethodGrid}>
            <div className={styles.onCard}>
              <span className={styles.onCardHeader} style={{ color: 'var(--ox)' }}>
                Oxidation / Reduction Identification
              </span>
              <div className={styles.onCardBody}>
                Reaction in {preset.medium} solution: {preset.description}
              </div>
            </div>

            <div className={styles.onCard}>
              <span className={styles.onCardHeader} style={{ color: 'var(--sol-cu)' }}>
                Chemical Context
              </span>
              <div className={styles.onCardBody}>{preset.context}</div>
            </div>
          </div>
        )}
      </div>

      {/* "Try It Yourself" Mode Interactive Challenge */}
      {mode === 'try-it' && stepDetails.challenge && (
        <div className={styles.challengeCard} data-testid="challenge-card">
          <div className={styles.challengeHeader}>
            <span className={styles.challengeTitle}>Interactive Challenge</span>
            <span style={{ fontSize: '12px', color: 'var(--fg-muted)' }}>
              Target answer required to reveal
            </span>
          </div>

          <div className={styles.challengePrompt}>{stepDetails.challenge.prompt}</div>

          <div className={styles.challengeRow}>
            <NumberField
              label="Your answer"
              value={userAnswer}
              onChange={(val) => {
                setUserAnswer(val)
                setFeedback('idle')
              }}
              min={1}
              max={50}
              step={1}
              unit={stepDetails.challenge.unit}
            />

            <Button variant="primary" onClick={handleCheckAnswer} data-testid="check-answer-btn">
              Check Answer
            </Button>
            <Button variant="secondary" onClick={handleRevealAnswer} data-testid="reveal-answer-btn">
              Reveal Answer
            </Button>
          </div>

          {feedback === 'correct' && (
            <div className={`${styles.feedbackBox} ${styles.feedbackSuccess}`} data-testid="feedback-success">
              <strong>✓ Spot on!</strong>
              <span>{stepDetails.challenge.explanation}</span>
            </div>
          )}

          {feedback === 'incorrect' && (
            <div className={`${styles.feedbackBox} ${styles.feedbackWrong}`} data-testid="feedback-wrong">
              <strong>Not quite right yet.</strong>
              <span>Hint: {stepDetails.challenge.hint}</span>
            </div>
          )}
        </div>
      )}

      {/* Screen Reader Live Announcement */}
      <div className={styles.srOnly} aria-live="polite">
        {ariaSummary}
      </div>
    </div>
  )
}
