'use client'

import React from 'react'
import { TitrationRig } from '@/components/redox/TitrationRig'
import { useStepTween } from '@/components/animations/unit4/vbt/useStepTween'
import {
  TITRATION_STEP_COUNT,
  titrationStep,
  SCROLLY_EQUIVALENCE_VOLUME_ML,
  SCROLLY_TITRATION_CONFIG,
  SCROLLY_INITIAL_FE_MMOL,
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
        <rect x={1} y={1} width={210} height={42} rx={7} fill="var(--surface)" />
        <line x1={0} y1={43} x2={212} y2={43} stroke="var(--border)" strokeWidth={1} />
        <text
          x={14}
          y={28}
          fontSize={16}
          fontWeight={700}
          fontFamily="var(--font-sans)"
          fill="var(--fg)"
          style={{ userSelect: 'none' }}
        >
          {target.stageLabel}
        </text>

        {/* Section 1: Titrant Added */}
        <g transform="translate(14, 58)">
          <text
            x={0}
            y={15}
            fontSize={15}
            fontWeight={600}
            fontFamily="var(--font-sans)"
            fill="var(--fg-muted)"
            style={{ userSelect: 'none' }}
          >
            Titrant Added
          </text>
          <text
            x={0}
            y={45}
            fontSize={24}
            fontWeight={700}
            fontFamily="var(--font-sans)"
            fill="var(--fg)"
            style={{ userSelect: 'none' }}
          >
            {vol.toFixed(1)} <tspan fontSize={16} fontWeight={500} fill="var(--fg-muted)">mL</tspan>
          </text>

          {/* Progress bar */}
          <rect x={0} y={58} width={184} height={8} rx={4} fill="var(--border)" />
          <rect
            x={0}
            y={58}
            width={Math.max(4, (progressPct / 100) * 184)}
            height={8}
            rx={4}
            fill={target.endPoint ? 'var(--sol-pink)' : 'var(--sol-mno4)'}
          />
          <text
            x={0}
            y={84}
            fontSize={15}
            fontWeight={500}
            fontFamily="var(--font-sans)"
            fill="var(--fg-muted)"
            style={{ userSelect: 'none' }}
          >
            {progressPct.toFixed(0)}% of 20.0 mL
          </text>
        </g>

        {/* Section 2: Fe²⁺ Remaining */}
        <g transform="translate(14, 168)">
          <line x1={-14} y1={0} x2={198} y2={0} stroke="var(--border)" strokeWidth={1} strokeDasharray="3 3" />
          <text
            x={0}
            y={22}
            fontSize={15}
            fontWeight={600}
            fontFamily="var(--font-sans)"
            fill="var(--fg-muted)"
            style={{ userSelect: 'none' }}
          >
            Fe²⁺ Remaining
          </text>
          <text
            x={0}
            y={52}
            fontSize={24}
            fontWeight={700}
            fontFamily="var(--font-sans)"
            fill="var(--fg)"
            style={{ userSelect: 'none' }}
          >
            {feRemaining.toFixed(2)} <tspan fontSize={16} fontWeight={500} fill="var(--fg-muted)">mmol</tspan>
          </text>
          <text
            x={0}
            y={78}
            fontSize={15}
            fontWeight={500}
            fontFamily="var(--font-sans)"
            fill="var(--fg-muted)"
            style={{ userSelect: 'none' }}
          >
            {target.endPoint
              ? '0.00 mmol unreacted'
              : `${((feRemaining / SCROLLY_INITIAL_FE_MMOL) * 100).toFixed(0)}% unreacted`}
          </text>
        </g>

        {/* Section 3: Flask Colour / Indicator State */}
        <g transform="translate(14, 272)">
          <line x1={-14} y1={0} x2={198} y2={0} stroke="var(--border)" strokeWidth={1} strokeDasharray="3 3" />
          <text
            x={0}
            y={22}
            fontSize={15}
            fontWeight={600}
            fontFamily="var(--font-sans)"
            fill="var(--fg-muted)"
            style={{ userSelect: 'none' }}
          >
            Flask Colour
          </text>
          <text
            x={0}
            y={52}
            fontSize={22}
            fontWeight={700}
            fontFamily="var(--font-sans)"
            fill={target.endPoint ? 'var(--sol-pink)' : 'var(--fg)'}
            style={{ userSelect: 'none' }}
          >
            {target.flaskAppearance}
          </text>
          <rect
            x={0}
            y={66}
            width={184}
            height={66}
            rx={6}
            fill={target.endPoint ? 'rgba(236, 72, 153, 0.12)' : 'var(--surface)'}
            stroke={target.endPoint ? 'var(--sol-pink)' : 'var(--border)'}
            strokeWidth={1.2}
          />
          <text
            x={10}
            y={90}
            fontSize={15}
            fontWeight={600}
            fontFamily="var(--font-sans)"
            fill={target.endPoint ? 'var(--sol-pink)' : 'var(--fg)'}
            style={{ userSelect: 'none' }}
          >
            {target.endPoint ? 'End point reached' : 'Self-indicator MnO₄⁻'}
          </text>
          <text
            x={10}
            y={116}
            fontSize={15}
            fontWeight={500}
            fontFamily="var(--font-sans)"
            fill="var(--fg-muted)"
            style={{ userSelect: 'none' }}
          >
            {target.endPoint ? 'Excess MnO₄⁻ ≥ 10⁻⁶ M' : 'Bleaches instantly'}
          </text>
        </g>
      </g>
    </svg>
  )
}
