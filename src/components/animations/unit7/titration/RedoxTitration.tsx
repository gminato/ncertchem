'use client'

import React from 'react'
import { TitrationRig } from '@/components/redox/TitrationRig'
import { useStepTween } from '@/components/animations/unit4/vbt/useStepTween'
import {
  TITRATION_STEP_COUNT,
  titrationStep,
  SCROLLY_EQUIVALENCE_VOLUME_ML,
  SCROLLY_TITRATION_CONFIG,
} from './titration-steps'

export interface RedoxTitrationProps {
  step: number
  reducedMotion: boolean
}

/**
 * Pinned Scrolly Animation for Section 7.3.3:
 * A 5-step permanganate–Fe2+ redox titration using TitrationRig.
 *
 * Visual spans ~92% of the 580-unit SVG width, pairing an enlarged TitrationRig
 * with an interactive telemetry HUD tracking reaction stoichiometry, millimoles,
 * and indicator appearance with generous spacing to avoid collisions.
 */
export function RedoxTitration({ step, reducedMotion }: RedoxTitrationProps) {
  const index = Math.min(TITRATION_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const target = titrationStep(index)

  // Smoothly interpolate numeric state between steps
  const tweened = useStepTween(
    {
      vol: target.addedMl,
      progress: target.progressPct,
      feRemaining: target.feRemainingMmol,
      mno4Delivered: target.mno4DeliveredMmol,
    },
    reducedMotion,
    0.85
  )

  const vol = tweened.vol
  const progressPct = Math.min(100, Math.max(0, tweened.progress))
  const feRemaining = Math.max(0, tweened.feRemaining)
  const mno4Delivered = Math.max(0, tweened.mno4Delivered)

  return (
    <svg
      viewBox="0 0 580 480"
      role="img"
      aria-label={`Permanganate-iron redox titration. ${target.explanation}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-step={index}
    >
      {/* Background card container */}
      <rect
        x={8}
        y={8}
        width={564}
        height={464}
        rx={12}
        fill="var(--surface)"
        stroke="var(--border)"
        strokeWidth={1.2}
      />

      {/* ============================================================== */}
      {/* 1. Titration Rig (enlarged, centered at x=155, y=225)           */}
      {/* ============================================================== */}
      <TitrationRig
        x={155}
        y={225}
        addedMl={vol}
        maxMl={SCROLLY_TITRATION_CONFIG.maxBuretteMl}
        endPointMl={SCROLLY_EQUIVALENCE_VOLUME_ML}
        titrantTint="var(--sol-mno4)"
        endTint="var(--sol-pink)"
        startTint="clear"
        dropping={target.dropping}
        endPoint={target.endPoint}
        subLabel={target.subLabel}
      />

      {/* ============================================================== */}
      {/* 2. Chemistry Telemetry Card / HUD (x=348 to 560)                */}
      {/* ============================================================== */}
      <g transform="translate(348, 24)">
        {/* HUD container box */}
        <rect
          x={0}
          y={0}
          width={212}
          height={432}
          rx={8}
          fill="var(--surface-raised)"
          stroke="var(--border)"
          strokeWidth={1.2}
        />

        {/* Header banner */}
        <rect x={1} y={1} width={210} height={38} rx={7} fill="var(--surface)" />
        <line x1={0} y1={39} x2={212} y2={39} stroke="var(--border)" strokeWidth={1} />
        <text
          x={14}
          y={18}
          fontSize={11}
          fontWeight={700}
          letterSpacing="0.06em"
          fontFamily="var(--font-sans)"
          fill="var(--fg-muted)"
          style={{ textTransform: 'uppercase', userSelect: 'none' }}
        >
          REDOX TITRATION HUD
        </text>
        <text
          x={14}
          y={32}
          fontSize={13}
          fontWeight={600}
          fontFamily="var(--font-sans)"
          fill="var(--fg)"
          style={{ userSelect: 'none' }}
        >
          {target.stageLabel}
        </text>

        {/* Section A: Delivered Volume & Progress */}
        <g transform="translate(14, 52)">
          <text
            x={0}
            y={12}
            fontSize={12}
            fontWeight={600}
            fontFamily="var(--font-sans)"
            fill="var(--fg-muted)"
            style={{ userSelect: 'none' }}
          >
            Delivered KMnO₄ (<tspan className="sym">V</tspan>)
          </text>
          <text
            x={0}
            y={32}
            fontSize={18}
            fontWeight={700}
            fontFamily="var(--font-sans)"
            fill="var(--fg)"
            style={{ userSelect: 'none' }}
          >
            {vol.toFixed(1)} <tspan fontSize={14} fontWeight={500} fill="var(--fg-muted)">/ 20.0 mL</tspan>
          </text>

          {/* Progress bar */}
          <rect x={0} y={42} width={184} height={8} rx={4} fill="var(--border)" />
          <rect
            x={0}
            y={42}
            width={Math.max(4, (progressPct / 100) * 184)}
            height={8}
            rx={4}
            fill={target.endPoint ? 'var(--sol-pink)' : 'var(--sol-mno4)'}
          />
          <text
            x={184}
            y={62}
            textAnchor="end"
            fontSize={12}
            fontWeight={600}
            fontFamily="var(--font-sans)"
            fill="var(--fg-muted)"
            style={{ userSelect: 'none' }}
          >
            {progressPct.toFixed(0)}% Equivalence
          </text>
        </g>

        {/* Section B: Analyte & Titrant Ledger */}
        <g transform="translate(14, 134)">
          <line x1={-14} y1={0} x2={198} y2={0} stroke="var(--border)" strokeWidth={1} strokeDasharray="3 3" />
          <text
            x={0}
            y={16}
            fontSize={12}
            fontWeight={600}
            fontFamily="var(--font-sans)"
            fill="var(--fg-muted)"
            style={{ userSelect: 'none' }}
          >
            Unreacted Fe²⁺ in flask
          </text>
          <text
            x={0}
            y={34}
            fontSize={16}
            fontWeight={700}
            fontFamily="var(--font-sans)"
            fill="var(--fg)"
            style={{ userSelect: 'none' }}
          >
            {feRemaining.toFixed(2)} <tspan fontSize={13} fontWeight={500} fill="var(--fg-muted)">mmol</tspan>
          </text>

          <text
            x={0}
            y={58}
            fontSize={12}
            fontWeight={600}
            fontFamily="var(--font-sans)"
            fill="var(--fg-muted)"
            style={{ userSelect: 'none' }}
          >
            Delivered MnO₄⁻
          </text>
          <text
            x={0}
            y={76}
            fontSize={16}
            fontWeight={700}
            fontFamily="var(--font-sans)"
            fill="var(--fg)"
            style={{ userSelect: 'none' }}
          >
            {mno4Delivered.toFixed(3)} <tspan fontSize={13} fontWeight={500} fill="var(--fg-muted)">mmol</tspan>
          </text>
        </g>

        {/* Section C: Indicator Status Callout */}
        <g transform="translate(14, 234)">
          <rect
            x={0}
            y={0}
            width={184}
            height={68}
            rx={6}
            fill={target.endPoint ? 'rgba(236, 72, 153, 0.12)' : 'var(--surface)'}
            stroke={target.endPoint ? 'var(--sol-pink)' : 'var(--border)'}
            strokeWidth={1.2}
          />
          <text
            x={10}
            y={18}
            fontSize={11}
            fontWeight={700}
            letterSpacing="0.04em"
            fontFamily="var(--font-sans)"
            fill="var(--fg-muted)"
            style={{ textTransform: 'uppercase', userSelect: 'none' }}
          >
            INDICATOR: SELF (MnO₄⁻)
          </text>
          <text
            x={10}
            y={37}
            fontSize={14}
            fontWeight={700}
            fontFamily="var(--font-sans)"
            fill={target.endPoint ? 'var(--sol-pink)' : 'var(--fg)'}
            style={{ userSelect: 'none' }}
          >
            {target.flaskAppearance}
          </text>
          <text
            x={10}
            y={54}
            fontSize={11}
            fontFamily="var(--font-sans)"
            fill="var(--fg-muted)"
            style={{ userSelect: 'none' }}
          >
            {target.endPoint ? 'Excess MnO₄⁻ ≥ 10⁻⁶ mol L⁻¹' : 'MnO₄⁻ instantly bleaches to Mn²⁺'}
          </text>
        </g>

        {/* Section D: Balanced Redox Stoichiometry */}
        <g transform="translate(14, 320)">
          <line x1={-14} y1={0} x2={198} y2={0} stroke="var(--border)" strokeWidth={1} strokeDasharray="3 3" />
          <text
            x={0}
            y={16}
            fontSize={11}
            fontWeight={700}
            letterSpacing="0.04em"
            fontFamily="var(--font-sans)"
            fill="var(--fg-muted)"
            style={{ textTransform: 'uppercase', userSelect: 'none' }}
          >
            REDOX REACTION (1 : 5)
          </text>
          <text
            x={0}
            y={34}
            fontSize={12}
            fontFamily="var(--font-sans)"
            fill="var(--fg)"
            fontWeight={500}
            style={{ userSelect: 'none' }}
          >
            MnO₄⁻ + 5Fe²⁺ + 8H⁺
          </text>
          <text
            x={0}
            y={50}
            fontSize={12}
            fontFamily="var(--font-sans)"
            fill="var(--fg)"
            fontWeight={500}
            style={{ userSelect: 'none' }}
          >
            → Mn²⁺ + 5Fe³⁺ + 4H₂O
          </text>
          <g transform="translate(0, 62)">
            <rect x={0} y={0} width={184} height={26} rx={4} fill="var(--surface)" />
            <text
              x={92}
              y={14}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={12}
              fontWeight={600}
              fontFamily="var(--font-sans)"
              fill="var(--fg)"
              style={{ userSelect: 'none' }}
            >
              1 mol MnO₄⁻ ≡ 5 mol Fe²⁺
            </text>
          </g>
        </g>
      </g>
    </svg>
  )
}
