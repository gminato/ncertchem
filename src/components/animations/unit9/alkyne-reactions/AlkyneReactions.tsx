'use client'

import React from 'react'
import { ReactionScheme, SkeletalFormula, layoutReactionScheme, type SchemePath } from '@/components/organic'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import {
  ALKYNE_STEP_COPY,
  acidityRows,
  plainEquation,
  benzeneScheme,
  brominationScheme,
  hydrationScheme,
  sodiumEquation,
  sodiumScheme,
  type AcidityRow,
} from './alkyne-reactions-steps'
import styles from './AlkyneReactions.module.css'

export interface AlkyneReactionsProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 960
const VIEW_HEIGHT = 460
const FONT = 'var(--font-sans)'
/** Width of the s-character bar at 50% s (the sp carbon). */
const BAR_FULL = 240
/** Largest distance of the bonding pair from the carbon nucleus. */
const PAIR_MAX = 84
const NUCLEUS_Y = 392
const COLUMN_X = [176, 480, 784] as const
const SCHEME_WIDTH = 880
/** Vertical band (top, bottom) where a scheme is centred. */
const BAND = [112, 392] as const
/** Baseline of the balanced equation under a scheme that needs coefficients. */
const FOOTER_Y = 380

const enter = (reducedMotion: boolean) => (reducedMotion ? undefined : styles.enter)

function Title({ children }: { children: React.ReactNode }) {
  return (
    <text x={VIEW_WIDTH / 2} y={50} textAnchor="middle" fontSize={26} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
      {children}
    </text>
  )
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <text x={VIEW_WIDTH / 2} y={446} textAnchor="middle" fontSize={17} fontWeight={500} fontFamily={FONT} fill="var(--fg-muted)">
      {children}
    </text>
  )
}

/** One molecule of the acidity comparison: its formula, hybrid, s-character bar and the bonding pair. */
function AcidityColumn({ row, cx }: { row: AcidityRow; cx: number }) {
  const barWidth = BAR_FULL * (row.sCharacter / 0.5)
  const radius = PAIR_MAX * row.pairRadius
  const pairY = NUCLEUS_Y - radius
  const percent = `${Math.round(row.sCharacter * 1000) / 10}%`
  const hybrid = row.hybrid === 'sp3' ? 'sp³' : row.hybrid === 'sp2' ? 'sp²' : 'sp'
  return (
    <g>
      <text x={cx} y={150} textAnchor="middle" fontSize={34} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        {row.formula}
      </text>
      <text x={cx} y={184} textAnchor="middle" fontSize={18} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        {row.name}
      </text>
      <text x={cx} y={208} textAnchor="middle" fontSize={17} fontFamily={FONT} fill="var(--fg-muted)">
        C–H on an {hybrid} carbon
      </text>
      <rect x={cx - BAR_FULL / 2} y={222} width={BAR_FULL} height={18} rx={9} fill="var(--surface)" stroke="var(--border)" />
      <rect x={cx - BAR_FULL / 2} y={222} width={barWidth} height={18} rx={9} fill="var(--delta-plus)" />
      <text x={cx} y={262} textAnchor="middle" fontSize={18} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        {percent} s character
      </text>
      <line x1={cx} y1={NUCLEUS_Y - 16} x2={cx} y2={pairY + 8} stroke="var(--fg-muted)" strokeWidth={1.5} strokeDasharray="4 5" />
      <circle cx={cx} cy={pairY} r={6} fill="var(--fg)" />
      <circle cx={cx} cy={NUCLEUS_Y} r={14} fill="var(--surface-raised)" stroke="var(--fg)" strokeWidth={2} />
      <text x={cx} y={NUCLEUS_Y + 6} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        C
      </text>
      <text x={cx + 16} y={pairY + 5} fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        pair closer
      </text>
    </g>
  )
}

function AcidityStep() {
  const rows = acidityRows()
  return (
    <g>
      <Title>{ALKYNE_STEP_COPY[0].title}</Title>
      {rows.map((row, i) => (
        <AcidityColumn key={row.smiles} row={row} cx={COLUMN_X[i]} />
      ))}
    </g>
  )
}

/** A reaction scheme centred in the band between the title and the caption, with an optional balanced line under it. */
function SchemeStep({ sequence, footer }: { sequence: SchemePath; footer?: string }) {
  const layout = layoutReactionScheme(sequence, SCHEME_WIDTH)
  const bandBottom = footer ? FOOTER_Y - 30 : BAND[1]
  const y = BAND[0] + (bandBottom - BAND[0] - layout.height) / 2
  return (
    <g>
      <ReactionScheme sequence={sequence} maxWidth={SCHEME_WIDTH} x={(VIEW_WIDTH - layout.width) / 2} y={y} />
      {footer ? (
        <text x={VIEW_WIDTH / 2} y={FOOTER_Y} textAnchor="middle" fontSize={22} fontFamily={FONT} fill="var(--fg)">
          {footer}
        </text>
      ) : null}
    </g>
  )
}

const SCHEMES: readonly (() => SchemePath)[] = [sodiumScheme, brominationScheme, hydrationScheme, benzeneScheme]
/** The balanced line under the sodium scheme (the scheme itself shows one molecule of each). */
const FOOTERS: readonly (string | undefined)[] = [plainEquation(sodiumEquation()), undefined, undefined, undefined]

export function AlkyneReactions({ step, reducedMotion }: AlkyneReactionsProps) {
  const index = Math.min(Math.max(step, 0), ALKYNE_STEP_COPY.length - 1)
  const copy = ALKYNE_STEP_COPY[index]
  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      width="100%"
      role="img"
      aria-label={`${copy.title}. ${copy.caption}`}
      className={styles.svg}
    >
      <g key={index} className={enter(reducedMotion)}>
        {index === 0 ? (
          <AcidityStep />
        ) : (
          <>
            <Title>{copy.title}</Title>
            <SchemeStep sequence={SCHEMES[index - 1]()} footer={FOOTERS[index - 1]} />
          </>
        )}
        <Caption>{copy.caption}</Caption>
      </g>
    </svg>
  )
}
