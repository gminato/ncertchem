'use client'

import React from 'react'
import { OxidationTag } from '@/components/redox/OxidationTag'
import { ON_RULE_STEPS } from './onrules-steps'
import styles from './RedoxOnRules.module.css'

export interface RedoxOnRulesProps {
  step: number
  reducedMotion?: boolean
}

const VIEW_WIDTH = 580
const VIEW_HEIGHT = 430

function renderSvgEquation(eq: string) {
  const normalized = eq.replace(/\*/g, '×').replace(/-/g, '−')
  const parts = normalized.split(/(x)/g)
  return parts.map((part, i) => {
    if (part === 'x') {
      return (
        <tspan key={i} className="sym">
          x
        </tspan>
      )
    }
    return <React.Fragment key={i}>{part}</React.Fragment>
  })
}

export function RedoxOnRules({ step }: RedoxOnRulesProps) {
  const stepIndex = Math.min(ON_RULE_STEPS.length - 1, Math.max(0, Math.round(step)))
  const current = ON_RULE_STEPS[stepIndex]

  const isSolved = current.isSolved
  const isTrap = current.isTrap

  const cardClass = isSolved
    ? styles.surfaceCardSolved
    : isTrap
      ? styles.surfaceCardTrap
      : styles.surfaceCard

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={`Oxidation number rule derivation step ${stepIndex + 1}: ${current.stepTitle}. ${current.stepCaption}`}
      className={styles.container}
      data-testid="redox-on-rules-svg"
      data-step={stepIndex}
    >
      <defs>
        {/* Soft radial glow behind formula */}
        <radialGradient id="formula-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={isSolved ? 'var(--accent)' : isTrap ? '#f59e0b' : 'var(--primary)'} stopOpacity={0.15} />
          <stop offset="100%" stopColor="transparent" stopOpacity={0} />
        </radialGradient>
      </defs>

      {/* Top Banner: Compound Name & Net Charge */}
      <g transform="translate(35, 18)">
        <rect
          x={0}
          y={0}
          width={510}
          height={34}
          rx={8}
          className={styles.headerPill}
        />
        <text
          x={16}
          y={22}
          className={styles.textTitle}
          dominantBaseline="middle"
        >
          {current.name}
        </text>
        <g transform="translate(410, 7)">
          <rect
            x={0}
            y={0}
            width={84}
            height={20}
            rx={4}
            fill="var(--surface)"
            stroke="var(--border)"
            strokeWidth={1}
          />
          <text
            x={42}
            y={11}
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="var(--font-sans)"
            fontSize={12}
            fontWeight={600}
            fill="var(--fg-muted)"
          >
            Charge: {current.charge === 0 ? '0' : current.charge > 0 ? `+${current.charge}` : `−${Math.abs(current.charge)}`}
          </text>
        </g>
      </g>

      {/* Formula Glow & Large OxidationTag Presentation */}
      <g transform="translate(290, 140)">
        <ellipse
          cx={0}
          cy={0}
          rx={180}
          ry={55}
          fill="url(#formula-glow)"
        />
        <OxidationTag
          formula={current.formula}
          charge={current.charge === 0 ? undefined : current.charge > 0 ? `+${current.charge}` : `−${Math.abs(current.charge)}`}
          tags={current.tags}
          fontSize={34}
          className={isSolved ? styles.tagGlowAccent : undefined}
        />
      </g>

      {/* Rule Citation Pill */}
      <g transform="translate(35, 204)">
        <rect
          x={0}
          y={0}
          width={510}
          height={28}
          rx={6}
          className={styles.ruleBanner}
        />
        <text
          x={14}
          y={15}
          dominantBaseline="middle"
          fontFamily="var(--font-sans)"
          fontSize={12}
          fontWeight={600}
          fill={isTrap ? '#f59e0b' : isSolved ? 'var(--accent)' : 'var(--fg-muted)'}
        >
          {current.ruleCitation}
        </text>
      </g>

      {/* Arithmetic Ledger & Resolution Card */}
      <g transform="translate(35, 240)">
        <rect
          x={0}
          y={0}
          width={510}
          height={105}
          rx={10}
          className={cardClass}
        />

        {/* Ledger Row 1: Step title */}
        <text
          x={16}
          y={24}
          className={styles.textTitle}
          dominantBaseline="middle"
        >
          {current.stepTitle}
        </text>

        {/* Ledger Row 2: Equation / derivation */}
        {current.equation ? (
          <text
            x={16}
            y={52}
            className={styles.textEquation}
            dominantBaseline="middle"
          >
            {renderSvgEquation(current.equation)}
          </text>
        ) : (
          <text
            x={16}
            y={52}
            className={styles.textLedger}
            dominantBaseline="middle"
          >
            {current.explanation}
          </text>
        )}

        {/* Ledger Row 3: Sum check progress */}
        <line
          x1={16}
          y1={72}
          x2={494}
          y2={72}
          stroke="var(--border)"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
        <text
          x={16}
          y={89}
          className={isSolved ? styles.textSuccess : styles.textSubtitle}
          dominantBaseline="middle"
        >
          Sum Rule Ledger:{' '}
          <tspan fontFamily="var(--font-mono, monospace)" fontWeight={600}>
            {current.sumCheckString}
          </tspan>
        </text>
      </g>

      {/* Bottom Alert / Educational Annotation */}
      <g transform="translate(35, 355)">
        <rect
          x={0}
          y={0}
          width={510}
          height={62}
          rx={8}
          fill={isTrap ? 'rgba(245, 158, 11, 0.08)' : 'var(--surface)'}
          stroke={isTrap ? '#f59e0b' : 'var(--border)'}
          strokeWidth={1.2}
        />

        {isTrap ? (
          <>
            <text
              x={14}
              y={20}
              className={styles.textWarning}
              dominantBaseline="middle"
            >
              ⚠️ Peroxide Trap:
            </text>
            <text
              x={14}
              y={42}
              fontFamily="var(--font-sans)"
              fontSize={12}
              fill="var(--fg)"
              dominantBaseline="middle"
            >
              Ba is fixed at +2 (Group 2); sum rule forces O to −1, confirming peroxide.
            </text>
          </>
        ) : (
          <>
            <text
              x={14}
              y={20}
              fontFamily="var(--font-sans)"
              fontSize={13}
              fontWeight={600}
              fill="var(--fg)"
              dominantBaseline="middle"
            >
              Key Principle:
            </text>
            <text
              x={14}
              y={42}
              fontFamily="var(--font-sans)"
              fontSize={12}
              fill="var(--fg-muted)"
              dominantBaseline="middle"
            >
              {isSolved
                ? 'Sum of oxidation numbers strictly balances net charge: Σ(c × ON) = charge.'
                : 'Priority: Free elements (0) → Monatomic ions → Group 1/2 → H → O → Sum rule.'}
            </text>
          </>
        )}
      </g>
    </svg>
  )
}
