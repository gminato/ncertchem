'use client'

import React from 'react'
import { SkeletalFormula, drawingFrame } from '@/components/organic'
import { useSweptNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import { ringReport, type RingReport, type RingVerdict } from '@/lib/chem/huckel-gallery'
import { countLine, HUCKEL_COUNT_RINGS, type HuckelCountRing } from './huckel-count-steps'
import { HybridBenzene } from './HybridBenzene'
import styles from './benzene.module.css'

export interface HuckelCountProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 580
const VIEW_HEIGHT = 440
const FONT = 'var(--font-sans)'
/** The drawing sits in this box: at most 420 units wide and 220 tall, so it fills the panel without touching the text. */
const BOX = { cx: VIEW_WIDTH / 2, cy: 180, width: 420, height: 220 }
const MAX_BOND_SCALE = 84

const VERDICT_WORD: Record<RingVerdict, string> = {
  aromatic: 'Aromatic',
  antiaromatic: 'Antiaromatic',
  'non-aromatic': 'Non-aromatic',
}

const enter = (reducedMotion: boolean) => (reducedMotion ? undefined : styles.enter)

/** The short reason shown under the count: what decides the verdict for this ring. */
function reasonFor(r: RingReport): string {
  if (r.verdict === 'aromatic') return 'Every ring atom is in one continuous π system, and the count fits 4n + 2.'
  if (r.verdict === 'non-aromatic' && !r.planar) return 'The count fits 4n, but the tub shape is not flat, so the ring is non-aromatic.'
  return 'Every ring atom is in the π system, but the count does not fit 4n + 2.'
}

/** A ring drawn with its Kekulé form, scaled so it fills the box. Benzene is drawn as the hybrid instead. */
function RingDrawing({ report, id }: { report: RingReport; id: HuckelCountRing }) {
  if (id === 'benzene') {
    return (
      <g transform={`translate(${BOX.cx} 175) rotate(30) scale(1.3)`}>
        <HybridBenzene />
      </g>
    )
  }
  const frame = drawingFrame(report.graph, 1)
  const fit = Math.min(BOX.width / frame.bounds.width, BOX.height / frame.bounds.height)
  const scale = Math.min(MAX_BOND_SCALE, fit)
  return <SkeletalFormula graph={report.graph} scale={scale} x={BOX.cx} y={BOX.cy} />
}

/** One ring of the count: its drawing, the π-electron arithmetic, and the verdict. */
function CountStep({ id, reducedMotion }: { id: HuckelCountRing; reducedMotion: boolean }) {
  const report = ringReport(id)
  const line = countLine(id)
  const count = Math.round(useSweptNumber(0, 0, line.piElectrons, reducedMotion, 1.2))
  const bonds = line.doubleBonds
  return (
    <g>
      <text x={VIEW_WIDTH / 2} y={40} textAnchor="middle" fontSize={22} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        {`Counting π electrons: ${report.name}`}
      </text>
      <RingDrawing report={report} id={id} />
      <text x={VIEW_WIDTH / 2} y={330} textAnchor="middle" fontSize={28} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        {id === 'benzene' ? `${count} π electrons` : `${bonds} C=C × 2 = ${count} π electrons`}
      </text>
      <text x={VIEW_WIDTH / 2} y={362} textAnchor="middle" fontSize={21} fontWeight={600} fontFamily={FONT} fill="var(--fg-muted)">
        {`${line.arithmetic}: ${VERDICT_WORD[line.verdict]}`}
      </text>
      <text x={VIEW_WIDTH / 2} y={404} textAnchor="middle" fontSize={17} fontWeight={500} fontFamily={FONT} fill="var(--fg-muted)">
        {reasonFor(report)}
      </text>
    </g>
  )
}

/**
 * The huckel-count Scrolly (Section 9.5.3): four rings counted in turn, each count and verdict from the lib.
 */
export function HuckelCount({ step, reducedMotion }: HuckelCountProps) {
  const index = Math.min(HUCKEL_COUNT_RINGS.length - 1, Math.max(0, Math.round(step)))
  const id = HUCKEL_COUNT_RINGS[index]
  const report = ringReport(id)
  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={`${report.name}: ${countLine(id).arithmetic}; verdict ${VERDICT_WORD[report.verdict].toLowerCase()}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-testid="huckel-count"
      data-step={index}
    >
      <g key={`step-${index}`} className={enter(reducedMotion)}>
        <CountStep id={id} reducedMotion={reducedMotion} />
      </g>
    </svg>
  )
}
