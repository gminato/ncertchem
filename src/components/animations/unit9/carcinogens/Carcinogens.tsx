'use client'

import React from 'react'
import { SkeletalFormula, drawingFrame, subscriptDigits } from '@/components/organic'
import { NCERT_CARCINOGENS } from '@/lib/chem/ncert-unit9-tables'
import { benzeneNodes, CARCINOGEN_STEP_KINDS, drawnPahs, namedOnly, type CarcinogenStepKind } from './carcinogens-steps'
import { fitScale } from '../family/formula'
import styles from '../directing/DirectingGroups.module.css'

export interface CarcinogensProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 580
const VIEW_HEIGHT = 440
const FONT = 'var(--font-sans)'

/** A formula with its digits as subscripts, e.g. C18H12 to C₁₈H₁₂. */
const sub = (formula: string) => formula.replace(/\d+/g, (d) => subscriptDigits(Number(d)))

function Title({ children }: { children: React.ReactNode }) {
  return (
    <text x={VIEW_WIDTH / 2} y={44} textAnchor="middle" fontSize={22} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
      {children}
    </text>
  )
}

function Caption({ lines }: { lines: readonly string[] }) {
  return (
    <g>
      {lines.map((line, i) => (
        <text key={i} x={VIEW_WIDTH / 2} y={392 + i * 24} textAnchor="middle" fontSize={16} fontWeight={500} fontFamily={FONT} fill="var(--fg-muted)">
          {line}
        </text>
      ))}
    </g>
  )
}

function BenzeneStep() {
  const { hybrid } = benzeneNodes()
  const formula = 'C6H6'
  return (
    <g>
      <Title>Benzene: a ring that burns with a sooty flame</Title>
      <SkeletalFormula graph={hybrid.graph} scale={128} x={VIEW_WIDTH / 2} y={190} innerCircles partialBonds={hybrid.partialBonds} />
      <text x={VIEW_WIDTH / 2} y={352} textAnchor="middle" fontSize={20} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        {sub(formula)}
      </text>
      <Caption
        lines={[
          'Benzene is toxic. Its ring has six equal C–C bonds.',
          'When heated in air, it burns with a sooty flame.',
        ]}
      />
    </g>
  )
}

function FusedStep() {
  const pahs = drawnPahs()
  const xs = [VIEW_WIDTH * 0.27, VIEW_WIDTH * 0.73]
  const scale = Math.min(...pahs.map((p) => fitScale(p.graph, 40, 250, 170)))
  return (
    <g>
      <Title>Fused rings: the polynuclear hydrocarbons</Title>
      {pahs.map((p, i) => {
        const b = drawingFrame(p.graph, scale).bounds
        return (
          <g key={p.name}>
            <SkeletalFormula graph={p.graph} scale={scale} x={xs[i]} y={180} />
            <text x={xs[i]} y={180 + b.height / 2 + 26} textAnchor="middle" fontSize={17} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
              {p.name}
            </text>
            <text x={xs[i]} y={180 + b.height / 2 + 50} textAnchor="middle" fontSize={16} fontFamily={FONT} fill="var(--fg-muted)">
              {`${sub(p.formula)}, ${p.rings} fused rings`}
            </text>
          </g>
        )
      })}
      <Caption
        lines={[
          'Each hydrocarbon here has benzene rings sharing edges.',
          'They form when coal, tobacco and petroleum burn incompletely.',
        ]}
      />
    </g>
  )
}

function OthersStep() {
  const drawn = new Set(drawnPahs().map((p) => p.name))
  const named = namedOnly()
  return (
    <g>
      <Title>NCERT&apos;s box of carcinogens</Title>
      {NCERT_CARCINOGENS.map((c, i) => {
        const y = 118 + i * 52
        return (
          <g key={c.name}>
            <text x={VIEW_WIDTH / 2} y={y} textAnchor="middle" fontSize={20} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
              {c.name}
            </text>
            <text x={VIEW_WIDTH / 2} y={y + 22} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
              {drawn.has(c.name) ? 'drawn above' : named.includes(c.name) ? 'named in NCERT’s box only' : ''}
            </text>
          </g>
        )
      })}
      <Caption
        lines={[
          'Inside the body, they damage DNA and can cause cancer.',
          'Each one in the box has benzene rings fused together.',
        ]}
      />
    </g>
  )
}

function renderStep(kind: CarcinogenStepKind): React.ReactNode {
  switch (kind) {
    case 'benzene':
      return <BenzeneStep />
    case 'fused':
      return <FusedStep />
    case 'others':
      return <OthersStep />
  }
}

function ariaFor(kind: CarcinogenStepKind): string {
  switch (kind) {
    case 'benzene':
      return 'Benzene drawn as a hexagon with an inscribed circle, with its formula C6H6 and a note that it burns with a sooty flame'
    case 'fused':
      return '1,2-Benzanthracene (C18H12, four fused rings) and 1,2-Benzpyrene (C20H12, five fused rings)'
    case 'others':
      return 'NCERT’s box of five carcinogenic polynuclear hydrocarbons, with the three that are named only'
  }
}

/** The carcinogens Scrolly: three Steps (Section 9.6). */
export function Carcinogens({ step, reducedMotion }: CarcinogensProps) {
  const kind = CARCINOGEN_STEP_KINDS[Math.max(0, Math.min(step, CARCINOGEN_STEP_KINDS.length - 1))]
  return (
    <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} role="img" aria-label={ariaFor(kind)} className={styles.drawing} data-step={kind}>
      <g key={kind} className={reducedMotion ? undefined : styles.enter}>
        {renderStep(kind)}
      </g>
    </svg>
  )
}
