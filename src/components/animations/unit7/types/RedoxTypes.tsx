'use client'

import React, { useMemo } from 'react'
import katex from 'katex'
import 'katex/contrib/mhchem'
import { LaneLadder } from './LaneLadder'
import { buildLadderModel } from './ladder-model'
import { getRedoxTypeStep } from './types-steps'
import styles from './types.module.css'

export interface RedoxTypesProps {
  step: number
  reducedMotion: boolean
}

const LADDER_HEIGHT = 330

export function RedoxTypes({ step }: RedoxTypesProps) {
  const stepData = getRedoxTypeStep(step)
  const equationHtml = useMemo(
    () => katex.renderToString(`\\ce{${stepData.equationMhchem}}`, { throwOnError: false }),
    [stepData.equationMhchem]
  )
  const model = useMemo(
    () => (stepData.kind === 'ladder' ? buildLadderModel(stepData.equation) : null),
    [stepData.kind, stepData.equation]
  )

  return (
    <div
      className={styles.container}
      data-testid="redox-types"
      data-step={stepData.stepIndex}
    >
      <div className={styles.title}>{stepData.title}</div>
      <div
        className={styles.equation}
        role="img"
        aria-label={`${stepData.title}: ${stepData.equationMhchem}`}
        dangerouslySetInnerHTML={{ __html: equationHtml }}
      />

      {stepData.kind === 'ladder' && model ? (
        <LaneLadder
          model={model}
          height={LADDER_HEIGHT}
          ariaLabel={`${stepData.title} oxidation number ladder`}
        />
      ) : (
        <TetrathionateFigure />
      )}

      {stepData.footnote && <p className={styles.footnote}>{stepData.footnote}</p>}
    </div>
  )
}

/** Step 5: real per-atom states of the tetrathionate ion, with the arithmetic average beneath. */
function TetrathionateFigure() {
  return (
    <svg
      viewBox="0 0 570 340"
      role="img"
      aria-label="Tetrathionate ion: terminal sulphur +5, central sulphur 0, average +2.5"
      style={{ display: 'block', width: '100%', height: 'auto' }}
    >
      <text x={0} y={16} fontSize={14} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        Whole-number state of each sulphur atom in [O₃S−S−S−SO₃]²⁻
      </text>

      <g transform="translate(285 170) scale(1.07) translate(-285 -170)">
      {/* S−S bonds; the S−S bond between the two central atoms is highlighted */}
      <Bond x1={170} y1={170} x2={250} y2={170} r1={18} r2={18} />
      <Bond x1={250} y1={170} x2={330} y2={170} r1={18} r2={18} highlight />
      <Bond x1={330} y1={170} x2={410} y2={170} r1={18} r2={18} />

      {/* Terminal S1 bonds to two doubly bonded O atoms and one O⁻ */}
      <Bond x1={170} y1={170} x2={100} y2={120} r1={18} r2={16} double />
      <Bond x1={170} y1={170} x2={100} y2={220} r1={18} r2={16} double />
      <Bond x1={170} y1={170} x2={70} y2={170} r1={18} r2={16} />

      {/* Terminal S4 */}
      <Bond x1={410} y1={170} x2={470} y2={120} r1={18} r2={16} double />
      <Bond x1={410} y1={170} x2={470} y2={220} r1={18} r2={16} double />
      <Bond x1={410} y1={170} x2={500} y2={170} r1={18} r2={16} />

      <AtomO cx={100} cy={120} label="O" charge="−2" />
      <AtomO cx={100} cy={220} label="O" charge="−2" />
      <AtomO cx={70} cy={170} label="O⁻" charge="−2" />
      <AtomO cx={470} cy={120} label="O" charge="−2" />
      <AtomO cx={470} cy={220} label="O" charge="−2" />
      <AtomO cx={500} cy={170} label="O⁻" charge="−2" />

      <AtomS cx={170} cy={170} on="+5" terminal />
      <AtomS cx={250} cy={170} on="0" />
      <AtomS cx={330} cy={170} on="0" />
      <AtomS cx={410} cy={170} on="+5" terminal />
      </g>

      {/* Annotation under the homonuclear bond */}
      <text x={290} y={226} textAnchor="middle" fontSize={14} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--primary, #3b82f6)">
        S−S bond: Δχ = 0, contributes 0
      </text>

      {/* Ledger */}
      <rect x={14} y={270} width={542} height={62} rx={8} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.2} />
      <text x={28} y={291} fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        Average O.N. of S = (+5 + 0 + 0 + 5) ÷ 4 = +2.5
      </text>
      <text x={28} y={314} fontSize={14} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        Each atom has a whole-number state. Only the average is fractional.
      </text>
    </svg>
  )
}

/** A bond drawn between the edges of two atoms; `double` draws two offset strokes. */
function Bond({
  x1,
  y1,
  x2,
  y2,
  r1,
  r2,
  double = false,
  highlight = false,
}: {
  x1: number
  y1: number
  x2: number
  y2: number
  r1: number
  r2: number
  double?: boolean
  highlight?: boolean
}) {
  const len = Math.hypot(x2 - x1, y2 - y1)
  const ux = (x2 - x1) / len
  const uy = (y2 - y1) / len
  const nx = -uy * 3
  const ny = ux * 3
  const sx = x1 + ux * r1
  const sy = y1 + uy * r1
  const ex = x2 - ux * r2
  const ey = y2 - uy * r2
  const stroke = highlight ? 'var(--primary, #3b82f6)' : 'var(--border)'
  const width = highlight ? 3.5 : 2.5
  if (!double) {
    return <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={stroke} strokeWidth={width} />
  }
  return (
    <g>
      <line x1={sx + nx} y1={sy + ny} x2={ex + nx} y2={ey + ny} stroke={stroke} strokeWidth={width} />
      <line x1={sx - nx} y1={sy - ny} x2={ex - nx} y2={ey - ny} stroke={stroke} strokeWidth={width} />
    </g>
  )
}

function AtomS({ cx, cy, on, terminal = false }: { cx: number; cy: number; on: string; terminal?: boolean }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={18} fill="var(--surface)" stroke={terminal ? 'var(--ox)' : 'var(--border)'} strokeWidth={2.2} />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        S
      </text>
      <rect
        x={cx - 22}
        y={cy - 52}
        width={44}
        height={22}
        rx={5}
        fill={terminal ? 'var(--ox)' : 'var(--surface-raised)'}
        stroke={terminal ? 'none' : 'var(--border)'}
        strokeWidth={1.2}
      />
      <text x={cx} y={cy - 41} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={700} fontFamily="var(--font-sans)" fill={terminal ? '#fff' : 'var(--fg)'}>
        {on}
      </text>
    </g>
  )
}

function AtomO({ cx, cy, label, charge }: { cx: number; cy: number; label: string; charge: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={16} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.5} />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        {label}
      </text>
      <text x={cx} y={cy - 26} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        {charge}
      </text>
    </g>
  )
}
