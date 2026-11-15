'use client'

import React, { useId } from 'react'
import { classicalStep, CLASSICAL_STEP_COUNT } from './classical-steps'

export interface RedoxClassicalProps {
  step: number
  reducedMotion: boolean
}

/**
 * RedoxClassical Scrolly Animation for Section 7.1.
 *
 * Shows the classical progression of oxidation and reduction definitions:
 * - Adding oxygen / removing oxygen
 * - Removing hydrogen / adding hydrogen
 * - Adding electronegative elements / removing electronegative elements
 * - Removing electropositive elements / adding electropositive elements
 * - Final unified matrix showing why oxidation and reduction are simultaneous.
 *
 * ViewBox: 580 × 430 (fills panel width ~570px, high label visibility ≥ 13px).
 */
export function RedoxClassical({ step, reducedMotion: _reducedMotion }: RedoxClassicalProps) {
  const index = Math.min(CLASSICAL_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const data = classicalStep(index)
  const markerIdPrefix = useId().replace(/[^a-zA-Z0-9]/g, '')
  const oxMarkerId = `rc-ox-arr-${markerIdPrefix}`
  const redMarkerId = `rc-red-arr-${markerIdPrefix}`

  const isSummary = index === 4

  return (
    <svg
      viewBox="0 0 580 430"
      role="img"
      aria-label={`Classical Redox Animation: ${data.title}. ${data.oxRule}. ${data.redRule}.`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-step={index}
      data-testid="redox-classical-svg"
    >
      <defs>
        <marker
          id={oxMarkerId}
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 Z" fill="var(--ox)" />
        </marker>
        <marker
          id={redMarkerId}
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 Z" fill="var(--red)" />
        </marker>
      </defs>

      {/* Background container */}
      <rect
        x={8}
        y={8}
        width={564}
        height={414}
        rx={14}
        fill="var(--surface)"
        stroke="var(--border)"
        strokeWidth={1.2}
      />

      {/* Top Header Row */}
      <g transform="translate(24, 24)">
        {/* Stage Badge */}
        <rect
          x={0}
          y={0}
          width={100}
          height={26}
          rx={13}
          fill="var(--surface-raised)"
          stroke="var(--border)"
          strokeWidth={1}
        />
        <text
          x={50}
          y={14}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={12}
          fontWeight={600}
          fontFamily="var(--font-sans)"
          fill="var(--fg-muted)"
          style={{ userSelect: 'none' }}
        >
          {data.stageNumber}
        </text>

        {/* Step Title */}
        <text
          x={116}
          y={14}
          dominantBaseline="central"
          fontSize={16}
          fontWeight={700}
          fontFamily="var(--font-sans)"
          fill="var(--fg)"
        >
          {data.title}
        </text>
      </g>

      {!isSummary ? (
        /* Steps 0 to 3: Detailed Reaction & Comparative Cards */
        <g>
          {/* Reaction Card */}
          <g transform="translate(24, 62)">
            <rect
              x={0}
              y={0}
              width={532}
              height={94}
              rx={10}
              fill="var(--surface-raised)"
              stroke="var(--border)"
              strokeWidth={1.2}
            />

            {/* Sub-label */}
            <text
              x={16}
              y={20}
              fontSize={12}
              fontWeight={600}
              fontFamily="var(--font-sans)"
              fill="var(--fg-subtle)"
            >
              WORKED REACTION
            </text>

            {/* Equation text */}
            <text
              x={266}
              y={44}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={18}
              fontWeight={700}
              fontFamily="var(--font-sans)"
              fill="var(--fg)"
            >
              {data.equationDisplay}
            </text>

            {/* Tags row below equation */}
            <g transform="translate(30, 68)">
              {/* Ox badge */}
              <rect x={0} y={0} width={220} height={20} rx={4} fill="var(--surface)" stroke="var(--ox)" strokeWidth={1.2} />
              <circle cx={10} cy={10} r={4} fill="var(--ox)" />
              <text x={22} y={11} dominantBaseline="central" fontSize={11} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--ox)">
                {data.oxidisedSpecies} is oxidised
              </text>

              {/* Red badge */}
              <rect x={252} y={0} width={220} height={20} rx={4} fill="var(--surface)" stroke="var(--red)" strokeWidth={1.2} />
              <circle cx={262} cy={10} r={4} fill="var(--red)" />
              <text x={274} y={11} dominantBaseline="central" fontSize={11} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--red)">
                {data.reducedSpecies} is reduced
              </text>
            </g>
          </g>

          {/* Side-by-Side Detail Cards */}
          {/* Left Card: OXIDATION */}
          <g transform="translate(24, 168)">
            <rect
              x={0}
              y={0}
              width={256}
              height={196}
              rx={10}
              fill="var(--surface)"
              stroke="var(--ox)"
              strokeWidth={1.8}
            />

            {/* Card Header Pill */}
            <rect x={14} y={14} width={100} height={24} rx={6} fill="var(--ox)" />
            <text
              x={64}
              y={26}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={12}
              fontWeight={700}
              fontFamily="var(--font-sans)"
              fill="#ffffff"
              style={{ letterSpacing: '0.04em' }}
            >
              OXIDATION
            </text>

            {/* Species Name */}
            <text
              x={14}
              y={64}
              fontSize={18}
              fontWeight={700}
              fontFamily="var(--font-sans)"
              fill="var(--fg)"
            >
              {data.oxidisedSpecies}
            </text>

            {/* Transition indicator */}
            <g transform="translate(14, 84)">
              <text x={0} y={10} fontSize={13} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
                Transforms into:
              </text>
              <text x={110} y={10} fontSize={14} fontWeight={600} fill="var(--ox)" fontFamily="var(--font-sans)">
                {data.oxProduct}
              </text>
            </g>

            {/* Classical Definition Box */}
            <g transform="translate(14, 114)">
              <rect
                x={0}
                y={0}
                width={228}
                height={68}
                rx={6}
                fill="var(--surface-raised)"
                stroke="var(--border)"
                strokeWidth={1}
              />
              <text x={10} y={18} fontSize={12} fontWeight={700} fill="var(--ox)" fontFamily="var(--font-sans)">
                Classical Criterion:
              </text>
              <text x={10} y={38} fontSize={12} fill="var(--fg)" fontFamily="var(--font-sans)">
                {data.oxReason.length > 36 ? data.oxReason.slice(0, 36) + '…' : data.oxReason}
              </text>
              <text x={10} y={54} fontSize={11} fontWeight={600} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
                {data.oxRule}
              </text>
            </g>
          </g>

          {/* Right Card: REDUCTION */}
          <g transform="translate(300, 168)">
            <rect
              x={0}
              y={0}
              width={256}
              height={196}
              rx={10}
              fill="var(--surface)"
              stroke="var(--red)"
              strokeWidth={1.8}
            />

            {/* Card Header Pill */}
            <rect x={14} y={14} width={100} height={24} rx={6} fill="var(--red)" />
            <text
              x={64}
              y={26}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={12}
              fontWeight={700}
              fontFamily="var(--font-sans)"
              fill="#ffffff"
              style={{ letterSpacing: '0.04em' }}
            >
              REDUCTION
            </text>

            {/* Species Name */}
            <text
              x={14}
              y={64}
              fontSize={18}
              fontWeight={700}
              fontFamily="var(--font-sans)"
              fill="var(--fg)"
            >
              {data.reducedSpecies}
            </text>

            {/* Transition indicator */}
            <g transform="translate(14, 84)">
              <text x={0} y={10} fontSize={13} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
                Transforms into:
              </text>
              <text x={110} y={10} fontSize={14} fontWeight={600} fill="var(--red)" fontFamily="var(--font-sans)">
                {data.redProduct}
              </text>
            </g>

            {/* Classical Definition Box */}
            <g transform="translate(14, 114)">
              <rect
                x={0}
                y={0}
                width={228}
                height={68}
                rx={6}
                fill="var(--surface-raised)"
                stroke="var(--border)"
                strokeWidth={1}
              />
              <text x={10} y={18} fontSize={12} fontWeight={700} fill="var(--red)" fontFamily="var(--font-sans)">
                Classical Criterion:
              </text>
              <text x={10} y={38} fontSize={12} fill="var(--fg)" fontFamily="var(--font-sans)">
                {data.redReason.length > 36 ? data.redReason.slice(0, 36) + '…' : data.redReason}
              </text>
              <text x={10} y={54} fontSize={11} fontWeight={600} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
                {data.redRule}
              </text>
            </g>
          </g>

          {/* Bottom Simultaneous Note Bar */}
          <g transform="translate(24, 376)">
            <rect
              x={0}
              y={0}
              width={532}
              height={34}
              rx={8}
              fill="var(--surface-raised)"
              stroke="var(--border)"
              strokeWidth={1}
            />
            <text
              x={266}
              y={18}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={12}
              fontWeight={600}
              fontFamily="var(--font-sans)"
              fill="var(--fg-muted)"
            >
              Simultaneous: oxidation and reduction always occur together in the same change.
            </text>
          </g>
        </g>
      ) : (
        /* Step 4: Summary Unified Matrix */
        <g transform="translate(24, 62)">
          {/* Matrix Card */}
          <rect
            x={0}
            y={0}
            width={532}
            height={260}
            rx={10}
            fill="var(--surface-raised)"
            stroke="var(--border)"
            strokeWidth={1.2}
          />

          {/* Table Header */}
          <rect x={0} y={0} width={532} height={42} rx={10} fill="var(--surface)" />
          <line x1={0} y1={42} x2={532} y2={42} stroke="var(--border)" strokeWidth={1.2} />

          <text x={24} y={22} dominantBaseline="central" fontSize={13} fontWeight={700} fill="var(--fg-subtle)" fontFamily="var(--font-sans)">
            CRITERION
          </text>
          <text x={220} y={22} dominantBaseline="central" fontSize={13} fontWeight={700} fill="var(--ox)" fontFamily="var(--font-sans)">
            OXIDATION
          </text>
          <text x={380} y={22} dominantBaseline="central" fontSize={13} fontWeight={700} fill="var(--red)" fontFamily="var(--font-sans)">
            REDUCTION
          </text>

          {/* Table Rows */}
          {data.matrixRows?.map((row, rIdx) => {
            const y = 42 + rIdx * 54
            return (
              <g key={row.criterion}>
                {rIdx > 0 && <line x1={14} y1={y} x2={518} y2={y} stroke="var(--border)" strokeWidth={1} strokeDasharray="3 3" />}
                <text x={24} y={y + 27} dominantBaseline="central" fontSize={13} fontWeight={600} fill="var(--fg)" fontFamily="var(--font-sans)">
                  {row.criterion}
                </text>
                {/* Ox pill */}
                <rect x={212} y={y + 14} width={130} height={26} rx={5} fill="var(--surface)" stroke="var(--ox)" strokeWidth={1.2} />
                <text x={277} y={y + 27} textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600} fill="var(--ox)" fontFamily="var(--font-sans)">
                  {row.oxidation}
                </text>
                {/* Red pill */}
                <rect x={372} y={y + 14} width={130} height={26} rx={5} fill="var(--surface)" stroke="var(--red)" strokeWidth={1.2} />
                <text x={437} y={y + 27} textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600} fill="var(--red)" fontFamily="var(--font-sans)">
                  {row.reduction}
                </text>
              </g>
            )
          })}

          {/* Bottom Takeaway Card */}
          <g transform="translate(0, 274)">
            <rect
              x={0}
              y={0}
              width={532}
              height={74}
              rx={10}
              fill="var(--surface)"
              stroke="var(--border)"
              strokeWidth={1.4}
            />
            <text
              x={24}
              y={24}
              fontSize={14}
              fontWeight={700}
              fill="var(--fg)"
              fontFamily="var(--font-sans)"
            >
              Why &ldquo;Redox&rdquo;?
            </text>
            <text
              x={24}
              y={48}
              fontSize={12.5}
              fill="var(--fg-muted)"
              fontFamily="var(--font-sans)"
            >
              Every oxidation requires an element/electron acceptor; every reduction requires a donor.
            </text>
            <text
              x={24}
              y={64}
              fontSize={12}
              fontWeight={600}
              fill="var(--ox)"
              fontFamily="var(--font-sans)"
            >
              Neither process can ever occur alone in a chemical change.
            </text>
          </g>
        </g>
      )}
    </svg>
  )
}
