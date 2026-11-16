'use client'

import React from 'react'
import { ReactionScheme, SkeletalFormula, layoutReactionScheme, type SchemePath } from '@/components/organic'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import {
  ALKYNE_STEP_COPY,
  acidityRows,
  benzeneScheme,
  brominationScheme,
  hydrationScheme,
  sodamideLine,
  sodiumScheme,
  type AcidityRow,
} from './alkyne-reactions-steps'
import styles from './AlkyneReactions.module.css'

export interface AlkyneReactionsProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 960
const VIEW_HEIGHT = 480
const FONT = 'var(--font-sans)'
/** Bar length and height for the s-character bars (about twice the first version). */
const BAR_LENGTH = 280
const BAR_HEIGHT = 34
/** Distance of the bonding pair from the nucleus for 25% s; the other carbons scale with pairRadius. */
const PAIR_MAX = 130
const NUCLEUS_Y = 424
const NUCLEUS_R = 18
const PAIR_DOT_R = 9
const COLUMN_X = [176, 480, 784] as const
/** A scheme fills this share of the 960-unit width, and no more than this height of the band. */
const FIT_WIDTH = 0.85 * VIEW_WIDTH
const FIT_HEIGHT_WITH_FOOTER = 250
const FIT_HEIGHT = 320
const FIT_CENTRE_Y = 250
const MAX_SCALE = 2.4
const FOOTER_Y = 396

const enter = (reducedMotion: boolean) => (reducedMotion ? undefined : styles.enter)

function Title({ children }: { children: React.ReactNode }) {
  return (
    <text x={VIEW_WIDTH / 2} y={52} textAnchor="middle" fontSize={28} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
      {children}
    </text>
  )
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <text x={VIEW_WIDTH / 2} y={466} textAnchor="middle" fontSize={19} fontWeight={500} fontFamily={FONT} fill="var(--fg-muted)">
      {children}
    </text>
  )
}

/** One molecule of the acidity comparison: its formula, hybrid, s-character bar and the bonding pair. */
function AcidityColumn({ row, cx }: { row: AcidityRow; cx: number }) {
  const barWidth = BAR_LENGTH * (row.sCharacter / 0.5)
  const radius = PAIR_MAX * row.pairRadius
  const pairY = NUCLEUS_Y - radius
  const percent = `${Math.round(row.sCharacter * 1000) / 10}%`
  const hybrid = row.hybrid === 'sp3' ? 'sp³' : row.hybrid === 'sp2' ? 'sp²' : 'sp'
  return (
    <g>
      <text x={cx} y={130} textAnchor="middle" fontSize={40} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        {row.formula}
      </text>
      <text x={cx} y={166} textAnchor="middle" fontSize={22} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        {row.name}
      </text>
      <text x={cx} y={194} textAnchor="middle" fontSize={20} fontFamily={FONT} fill="var(--fg-muted)">
        C–H on an {hybrid} carbon
      </text>
      <rect x={cx - BAR_LENGTH / 2} y={212} width={BAR_LENGTH} height={BAR_HEIGHT} rx={BAR_HEIGHT / 2} fill="var(--surface)" stroke="var(--border)" />
      <rect x={cx - BAR_LENGTH / 2} y={212} width={barWidth} height={BAR_HEIGHT} rx={BAR_HEIGHT / 2} fill="var(--delta-plus)" />
      <text x={cx} y={276} textAnchor="middle" fontSize={22} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        {percent} s character
      </text>
      <line x1={cx} y1={NUCLEUS_Y - NUCLEUS_R - 2} x2={cx} y2={pairY + PAIR_DOT_R + 2} stroke="var(--fg-muted)" strokeWidth={2} strokeDasharray="5 6" />
      <circle cx={cx} cy={pairY} r={PAIR_DOT_R} fill="var(--fg)" />
      <circle cx={cx} cy={NUCLEUS_Y} r={NUCLEUS_R} fill="var(--surface-raised)" stroke="var(--fg)" strokeWidth={2.5} />
      <text x={cx} y={NUCLEUS_Y + 7} textAnchor="middle" fontSize={20} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        C
      </text>
      <text x={cx + 22} y={pairY + 7} fontSize={19} fontFamily={FONT} fill="var(--fg-muted)">
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

/**
 * A reaction scheme scaled uniformly so it spans about 85% of the width, centred in the band, with a
 * balanced line under it when the Step has one.
 */
function SchemeStep({ sequence, footer }: { sequence: SchemePath; footer?: string }) {
  const natural = layoutReactionScheme(sequence, VIEW_WIDTH, [56])
  const band = footer ? FIT_HEIGHT_WITH_FOOTER : FIT_HEIGHT
  const scale = Math.min(FIT_WIDTH / natural.width, band / natural.height, MAX_SCALE)
  const x = (VIEW_WIDTH - natural.width * scale) / 2
  const centreY = footer ? (FIT_CENTRE_Y - 20) : FIT_CENTRE_Y
  const y = centreY - (natural.height * scale) / 2
  return (
    <g>
      <g transform={`translate(${x}, ${y}) scale(${scale})`}>
        <ReactionScheme sequence={sequence} maxWidth={VIEW_WIDTH} scales={[56]} x={0} y={0} />
      </g>
      {footer ? (
        <text x={VIEW_WIDTH / 2} y={FOOTER_Y} textAnchor="middle" fontSize={22} fontFamily={FONT} fill="var(--fg)">
          {footer}
        </text>
      ) : null}
    </g>
  )
}

const SCHEMES: readonly (() => SchemePath)[] = [sodiumScheme, brominationScheme, hydrationScheme, benzeneScheme]
/** The sodium Step adds the sodamide case for propyne as its second line. */
const FOOTERS: readonly (string | undefined)[] = [sodamideLine(), undefined, undefined, undefined]

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
