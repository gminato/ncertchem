'use client'

import React from 'react'
import { HalfEquationCard } from '@/components/redox/HalfEquationCard'
import { getHalfStep, HALF_STEP_COUNT } from './balance-half-steps'
import styles from './balance-half.module.css'

export interface RedoxBalanceHalfProps {
  step: number
  reducedMotion: boolean
}

/** Formats chemical equation strings into readable JSX with proper super/subscripts. */
export function renderFormattedFormula(eq: string): React.ReactNode {
  // Replace minus signs and arrow
  const arrowParts = eq.split('->')
  if (arrowParts.length !== 2) {
    return <span className={styles.equationText}>{eq}</span>
  }

  const formatSide = (sideStr: string) => {
    const terms = sideStr.trim().split(' + ')
    return terms.map((term, i) => {
      // Parse coefficient, formula, charge
      // e.g. "2Cr(OH)3", "3ClO-", "4OH-(aq)", "2CrO4^2-", "5H2O(l)", "6e-"
      const cleanTerm = term
        .replace(/\^2-/g, '²⁻')
        .replace(/\^3\+/g, '³⁺')
        .replace(/\^2\+/g, '²⁺')
        .replace(/2-/g, '²⁻')
        .replace(/-/g, '⁻')
        .replace(/\+/g, '⁺')
        .replace(/3\+/g, '³⁺')
        .replace(/2\+/g, '²⁺')
        .replace(/3\(/g, '₃(')
        .replace(/4\(/g, '₄(')
        .replace(/Cr\(OH\)3/g, 'Cr(OH)₃')
        .replace(/CrO4/g, 'CrO₄')
        .replace(/H2O/g, 'H₂O')
        .replace(/\(l\)/g, '(l)')
        .replace(/\(aq\)/g, '(aq)')

      return (
        <React.Fragment key={i}>
          {i > 0 && ' + '}
          <span>{cleanTerm}</span>
        </React.Fragment>
      )
    })
  }

  return (
    <span className={styles.equationText}>
      {formatSide(arrowParts[0])}
      {' → '}
      {formatSide(arrowParts[1])}
    </span>
  )
}

export function RedoxBalanceHalf({ step, reducedMotion }: RedoxBalanceHalfProps) {
  const index = Math.min(HALF_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const data = getHalfStep(index)

  const oxNode = renderFormattedFormula(data.oxHalf.equationMhchem)
  const redNode = renderFormattedFormula(data.redHalf.equationMhchem)
  const overallNode = data.overallEquationMhchem
    ? renderFormattedFormula(data.overallEquationMhchem)
    : undefined

  return (
    <div
      className={styles.container}
      data-animation="redox-balance-half"
      data-step={index}
    >
      {/* Step Header */}
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={styles.stepPill}>STEP {data.stepNumber} OF 7</span>
          <span className={styles.title} data-testid="half-step-title">{data.title}</span>
        </div>
      </div>

      {/* Flagship HalfEquationCard from the Redox library */}
      <HalfEquationCard
        className={styles.cardOverride}
        title="Ion-Electron Method (Basic Medium)"
        oxHalf={{
          title: data.oxHalf.title,
          equation: oxNode,
          electrons: data.oxHalf.electrons,
          multiplier: data.oxHalf.multiplier,
          tally: data.oxHalf.tally.map((t) => ({
            item: t.item,
            left: t.left,
            right: t.right,
          })),
        }}
        redHalf={{
          title: data.redHalf.title,
          equation: redNode,
          electrons: data.redHalf.electrons,
          multiplier: data.redHalf.multiplier,
          tally: data.redHalf.tally.map((t) => ({
            item: t.item,
            left: t.left,
            right: t.right,
          })),
        }}
        overallEquation={overallNode}
      />

      {/* Step Takeaway */}
      <div className={styles.takeawayCard}>
        <span className={styles.takeawayLabel}>STEP {data.stepNumber} PRINCIPLE</span>
        <span className={styles.takeawayText}>{data.instruction}</span>
        <span className={styles.takeawayHint}>
          {index === 0 && 'Begin with the correct ionic identities of all species in aqueous basic medium.'}
          {index === 1 && 'Cr(OH)₃ is oxidised (+3 to +6) and ClO⁻ is reduced (+1 to −1).'}
          {index === 2 && 'Chromium and chlorine are already equal in number on both sides (1:1).'}
          {index === 3 && 'In base, each H⁺ is converted to H₂O by adding equal OH⁻ to both sides.'}
          {index === 4 && 'Electrons balance electric charge: 3 e⁻ lost by Cr, 2 e⁻ gained by Cl.'}
          {index === 5 && 'LCM(3, 2) = 6 electrons. Add equations and cancel spectator OH⁻ and H₂O.'}
          {index === 6 && 'Verification confirms equal atom counts and identical net charge (−4 = −4).'}
        </span>
      </div>
    </div>
  )
}
