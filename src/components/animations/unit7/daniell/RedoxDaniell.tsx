'use client'

import React, { useId } from 'react'
import { DaniellCell } from '@/components/redox/DaniellCell'
import { formatTrueMinus } from '@/components/redox/geometry'
import { useStepTween } from '@/components/animations/unit4/vbt/useStepTween'
import { DANIELL_STEP_COUNT, daniellStep } from './daniell-steps'

export interface RedoxDaniellProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 620
const VIEW_HEIGHT = 445
const CELL_ORIGIN = { x: 310, y: 145 }

/**
 * RedoxDaniell: Scrolly visual tracing the direct electron transfer in a single beaker
 * to indirect electron transfer in the standard Daniell cell.
 *
 * Progression (6 deterministic steps):
 * 0: Direct reaction in one beaker (heat evolved, no external wire)
 * 1: Separate the half-cells (Zn²⁺/Zn and Cu²⁺/Cu redox couples)
 * 2: Connect the external wire (switch closed, no bridge; charge buildup stops flow: 0.00 V)
 * 3: Add the salt bridge (inverted U-tube KCl in agar gel completes internal circuit)
 * 4: Spontaneous flow begins (electrons stream Zn → Cu, current flows Cu → Zn, ions migrate)
 * 5: Standard cell potential 1.10 V (E°cell = E°cathode − E°anode = 1.10 V)
 */
export function RedoxDaniell({ step, reducedMotion }: RedoxDaniellProps) {
  const index = Math.min(DANIELL_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const target = daniellStep(index)

  const tweened = useStepTween(
    {
      zincMass: target.zincMass,
      copperMass: target.copperMass,
      solutionTint: target.solutionTint,
      progress: target.progress,
    },
    reducedMotion,
    0.8
  )

  const idPrefix = useId().replace(/[^a-zA-Z0-9]/g, '')
  const clipSingleId = `rd-clip-single-${idPrefix}`
  const clipLeftId = `rd-clip-left-${idPrefix}`
  const clipRightId = `rd-clip-right-${idPrefix}`

  // Beaker dimensions matching DaniellCell
  const bw = 150
  const bh = 145
  const bLeft = -bw / 2
  const bRight = bw / 2
  const bTop = 20
  const bBottom = bTop + bh
  const liquidY = 55
  const rodTopY = -45
  const rodBottomY = 145
  const znBeakerX = -140
  const cuBeakerX = 140
  const wireY = -90

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={`Daniell cell progression step ${index + 1}: ${target.title}. ${target.caption}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-testid="redox-daniell"
      data-step={index}
      data-mode={target.mode}
    >
      <defs>
        <clipPath id={clipSingleId}>
          <rect x={-90} y={10} width={180} height={170} rx={12} />
        </clipPath>
        <clipPath id={clipLeftId}>
          <rect x={bLeft} y={bTop} width={bw} height={bh} rx={10} />
        </clipPath>
        <clipPath id={clipRightId}>
          <rect x={bLeft} y={bTop} width={bw} height={bh} rx={10} />
        </clipPath>
      </defs>

      {/* ============================================================== */}
      {/* Step 0: Direct reaction in a single central beaker               */}
      {/* ============================================================== */}
      {target.mode === 'single-beaker' && (
        <g transform={`translate(${CELL_ORIGIN.x}, ${CELL_ORIGIN.y - 10})`}>
          {/* Beaker solution: CuSO4 blue */}
          <g clipPath={`url(#${clipSingleId})`}>
            <rect
              x={-95}
              y={50}
              width={190}
              height={135}
              fill="var(--sol-cu)"
              opacity={0.8}
            />
            <line
              x1={-90}
              y1={50}
              x2={90}
              y2={50}
              stroke="var(--sol-cu)"
              strokeWidth={2}
              opacity={0.9}
            />
          </g>

          {/* Zinc strip dipped directly in solution */}
          <rect
            x={-18}
            y={-30}
            width={36}
            height={190}
            rx={3}
            fill="var(--metal-zn)"
            stroke="var(--fg-muted)"
            strokeWidth={1.5}
          />

          {/* Copper deposit coating on lower submerged portion */}
          <rect
            x={-19}
            y={50}
            width={38}
            height={110}
            rx={2}
            fill="var(--metal-cu)"
            opacity={0.88}
            stroke="var(--metal-cu)"
            strokeWidth={1}
          />

          {/* Beaker glass outline */}
          <path
            d="M -94 10 L -90 14 L -90 170 Q -90 182 -78 182 L 78 182 Q 90 182 90 170 L 90 14 L 94 10"
            fill="none"
            stroke="var(--glass-wall)"
            strokeWidth={2.4}
            strokeLinecap="round"
          />

          {/* Heat emission waves on sides (thermal energy release) */}
          <g>
            <path
              d="M -115 80 Q -125 95 -115 110 Q -105 125 -115 140"
              fill="none"
              stroke="var(--heat)"
              strokeWidth={2}
              strokeLinecap="round"
              opacity={0.85}
            />
            <path
              d="M 115 80 Q 125 95 115 110 Q 105 125 115 140"
              fill="none"
              stroke="var(--heat)"
              strokeWidth={2}
              strokeLinecap="round"
              opacity={0.85}
            />
            <text
              x={-135}
              y={110}
              textAnchor="end"
              dominantBaseline="central"
              fontSize={14}
              fontWeight={600}
              fill="var(--heat)"
            >
              Heat evolved (<tspan className="sym">q</tspan> &lt; 0)
            </text>
            <text
              x={135}
              y={110}
              textAnchor="start"
              dominantBaseline="central"
              fontSize={14}
              fontWeight={600}
              fill="var(--heat)"
            >
              No external work
            </text>
          </g>

          {/* Labels */}
          <text
            x={0}
            y={-45}
            textAnchor="middle"
            fontSize={15}
            fontWeight={600}
            fill="var(--fg)"
          >
            Zinc strip in aqueous copper sulphate
          </text>
          <text
            x={0}
            y={202}
            textAnchor="middle"
            fontSize={14}
            fontWeight={500}
            fill="var(--fg-muted)"
          >
            Direct electron transfer on surface: Cu deposits, Zn dissolves, solution warms
          </text>
        </g>
      )}

      {/* ============================================================== */}
      {/* Step 1: Separated half-cells (No wire, no bridge)               */}
      {/* ============================================================== */}
      {target.mode === 'separated' && (
        <g transform={`translate(${CELL_ORIGIN.x}, ${CELL_ORIGIN.y})`}>
          {/* Left: Zn beaker */}
          <g transform={`translate(${znBeakerX}, 0)`}>
            <g clipPath={`url(#${clipLeftId})`}>
              <rect x={bLeft - 5} y={liquidY} width={bw + 10} height={bBottom - liquidY + 5} fill="var(--fg-subtle)" opacity={0.16} />
              <line x1={bLeft} y1={liquidY} x2={bRight} y2={liquidY} stroke="var(--fg-muted)" strokeWidth={1.5} opacity={0.7} />
            </g>
            <rect x={-14} y={rodTopY} width={28} height={rodBottomY - rodTopY} rx={3} fill="var(--metal-zn)" stroke="var(--fg-muted)" strokeWidth={1.2} />
            <path
              d={`M ${bLeft - 3} ${bTop} L ${bLeft} ${bTop + 4} L ${bLeft} ${bBottom - 10} Q ${bLeft} ${bBottom} ${bLeft + 10} ${bBottom} L ${bRight - 10} ${bBottom} Q ${bRight} ${bBottom} ${bRight} ${bBottom - 10} L ${bRight} ${bTop + 4} L ${bRight + 3} ${bTop}`}
              fill="none"
              stroke="var(--glass-wall)"
              strokeWidth={2}
            />
            <text x={0} y={bBottom + 18} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--ox)">
              Zn²⁺/Zn couple
            </text>
            <text x={0} y={bBottom + 38} textAnchor="middle" fontSize={14} fill="var(--fg-muted)">
              1 M ZnSO₄
            </text>
          </g>

          {/* Right: Cu beaker */}
          <g transform={`translate(${cuBeakerX}, 0)`}>
            <g clipPath={`url(#${clipRightId})`}>
              <rect x={bLeft - 5} y={liquidY} width={bw + 10} height={bBottom - liquidY + 5} fill="var(--sol-cu)" opacity={0.9} />
              <line x1={bLeft} y1={liquidY} x2={bRight} y2={liquidY} stroke="var(--sol-cu)" strokeWidth={2} opacity={0.95} />
            </g>
            <rect x={-14} y={rodTopY} width={28} height={rodBottomY - rodTopY} rx={3} fill="var(--metal-cu)" stroke="var(--fg-muted)" strokeWidth={1.2} />
            <path
              d={`M ${bLeft - 3} ${bTop} L ${bLeft} ${bTop + 4} L ${bLeft} ${bBottom - 10} Q ${bLeft} ${bBottom} ${bLeft + 10} ${bBottom} L ${bRight - 10} ${bBottom} Q ${bRight} ${bBottom} ${bRight} ${bBottom - 10} L ${bRight} ${bTop + 4} L ${bRight + 3} ${bTop}`}
              fill="none"
              stroke="var(--glass-wall)"
              strokeWidth={2}
            />
            <text x={0} y={bBottom + 18} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--red)">
              Cu²⁺/Cu couple
            </text>
            <text x={0} y={bBottom + 38} textAnchor="middle" fontSize={14} fill="var(--fg-muted)">
              1 M CuSO₄
            </text>
          </g>

          {/* Center Callout Badge */}
          <g transform="translate(0, -12)">
            <rect x={-95} y={-18} width={190} height={36} rx={6} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.2} />
            <text x={0} y={1} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={600} fill="var(--fg-muted)">
              Isolated half-cells: no flow
            </text>
          </g>
        </g>
      )}

      {/* ============================================================== */}
      {/* Step 2: Wire Connected — But NO salt bridge                     */}
      {/* ============================================================== */}
      {target.mode === 'wire-only' && (
        <g transform={`translate(${CELL_ORIGIN.x}, ${CELL_ORIGIN.y})`}>
          {/* Left: Zn beaker */}
          <g transform={`translate(${znBeakerX}, 0)`}>
            <g clipPath={`url(#${clipLeftId})`}>
              <rect x={bLeft - 5} y={liquidY} width={bw + 10} height={bBottom - liquidY + 5} fill="var(--fg-subtle)" opacity={0.16} />
              <line x1={bLeft} y1={liquidY} x2={bRight} y2={liquidY} stroke="var(--fg-muted)" strokeWidth={1.5} opacity={0.7} />
            </g>
            <rect x={-14} y={rodTopY} width={28} height={rodBottomY - rodTopY} rx={3} fill="var(--metal-zn)" stroke="var(--fg-muted)" strokeWidth={1.2} />
            <path
              d={`M ${bLeft - 3} ${bTop} L ${bLeft} ${bTop + 4} L ${bLeft} ${bBottom - 10} Q ${bLeft} ${bBottom} ${bLeft + 10} ${bBottom} L ${bRight - 10} ${bBottom} Q ${bRight} ${bBottom} ${bRight} ${bBottom - 10} L ${bRight} ${bTop + 4} L ${bRight + 3} ${bTop}`}
              fill="none"
              stroke="var(--glass-wall)"
              strokeWidth={2}
            />
            <text x={0} y={bBottom + 18} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--ox)">
              Zn electrode
            </text>
            <text x={0} y={bBottom + 38} textAnchor="middle" fontSize={14} fill="var(--fg-muted)">
              1 M ZnSO₄
            </text>
          </g>

          {/* Right: Cu beaker */}
          <g transform={`translate(${cuBeakerX}, 0)`}>
            <g clipPath={`url(#${clipRightId})`}>
              <rect x={bLeft - 5} y={liquidY} width={bw + 10} height={bBottom - liquidY + 5} fill="var(--sol-cu)" opacity={0.9} />
              <line x1={bLeft} y1={liquidY} x2={bRight} y2={liquidY} stroke="var(--sol-cu)" strokeWidth={2} opacity={0.95} />
            </g>
            <rect x={-14} y={rodTopY} width={28} height={rodBottomY - rodTopY} rx={3} fill="var(--metal-cu)" stroke="var(--fg-muted)" strokeWidth={1.2} />
            <path
              d={`M ${bLeft - 3} ${bTop} L ${bLeft} ${bTop + 4} L ${bLeft} ${bBottom - 10} Q ${bLeft} ${bBottom} ${bLeft + 10} ${bBottom} L ${bRight - 10} ${bBottom} Q ${bRight} ${bBottom} ${bRight} ${bBottom - 10} L ${bRight} ${bTop + 4} L ${bRight + 3} ${bTop}`}
              fill="none"
              stroke="var(--glass-wall)"
              strokeWidth={2}
            />
            <text x={0} y={bBottom + 18} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--red)">
              Cu electrode
            </text>
            <text x={0} y={bBottom + 38} textAnchor="middle" fontSize={14} fill="var(--fg-muted)">
              1 M CuSO₄
            </text>
          </g>

          {/* Overhead wire connecting through voltmeter */}
          <path
            d={`M ${znBeakerX} ${rodTopY} L ${znBeakerX} ${wireY} L ${cuBeakerX} ${wireY} L ${cuBeakerX} ${rodTopY}`}
            fill="none"
            stroke="var(--fg-muted)"
            strokeWidth={2.4}
            strokeLinecap="round"
          />

          {/* Voltmeter at center reading 0.00 V */}
          <g transform={`translate(0, ${wireY})`}>
            <circle cx={0} cy={0} r={26} fill="var(--surface)" stroke="var(--border)" strokeWidth={2} />
            <text x={0} y={-5} textAnchor="middle" fontSize={13} fill="var(--fg-muted)" fontWeight={600}>
              V
            </text>
            <line x1={0} y1={6} x2={0} y2={-10} stroke="var(--fg-muted)" strokeWidth={2} strokeLinecap="round" />
            <g transform="translate(0, 38)">
              <rect x={-48} y={-14} width={96} height={28} rx={5} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.2} />
              <text x={0} y={1} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fill="var(--fg-muted)">
                0.00 <tspan className="sym">V</tspan>
              </text>
            </g>
          </g>

          {/* Warning badge explaining why no current flows - placed cleanly under beakers clear of all strokes */}
          <g transform="translate(0, 246)">
            <rect x={-160} y={-22} width={320} height={44} rx={6} fill="var(--surface-raised)" stroke="var(--caution)" strokeWidth={1.4} />
            <text x={0} y={-6} textAnchor="middle" dominantBaseline="central" fontSize={14.5} fontWeight={600} fill="var(--caution)">
              No salt bridge: circuit open
            </text>
            <text x={0} y={12} textAnchor="middle" dominantBaseline="central" fontSize={13.5} fill="var(--fg-muted)">
              Instant charge buildup halts electron transfer
            </text>
          </g>
        </g>
      )}

      {/* ============================================================== */}
      {/* Steps 3, 4, 5: DaniellCell component (with salt bridge)         */}
      {/* ============================================================== */}
      {(target.mode === 'bridge-inserted' || target.mode === 'active-flow' || target.mode === 'full-potential') && (
        <DaniellCell
          switchOn={target.switchOn}
          voltage={target.voltage}
          zincMass={tweened.zincMass}
          copperMass={tweened.copperMass}
          solutionTint={tweened.solutionTint}
          progress={tweened.progress}
          x={CELL_ORIGIN.x}
          y={CELL_ORIGIN.y}
          saltBridgeLabel="KCl"
        />
      )}

      {/* Working / calculation overlay on Step 5 */}
      {target.mode === 'full-potential' && (
        <g transform={`translate(${CELL_ORIGIN.x}, ${VIEW_HEIGHT - 32})`}>
          <rect
            x={-240}
            y={-18}
            width={480}
            height={36}
            rx={6}
            fill="var(--surface-raised)"
            stroke="var(--accent)"
            strokeWidth={1.5}
          />
          <text
            x={0}
            y={1}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={15}
            fontWeight={600}
            fill="var(--fg)"
          >
            <tspan className="sym">E</tspan>°<tspan dy="0.25em" fontSize="0.75em">cell</tspan>
            <tspan dy="-0.25em"> = </tspan>
            <tspan className="sym">E</tspan>°(cathode) − <tspan className="sym">E</tspan>°(anode) = +{target.e0Cathode.toFixed(2)} <tspan className="sym">V</tspan> − ({formatTrueMinus(`−${Math.abs(target.e0Anode).toFixed(2)}`)} <tspan className="sym">V</tspan>) = +{target.e0Cell.toFixed(2)} <tspan className="sym">V</tspan>
          </text>
        </g>
      )}
    </svg>
  )
}
