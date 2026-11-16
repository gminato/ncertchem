'use client'

import { useMemo, useState } from 'react'
import { NumberField, Segmented } from '@/components/controls'
import type { SimulationProps } from '@/components/simulation/registry'
import { SkeletalFormula, drawingFrame } from '@/components/organic'
import {
  HUCKEL_GALLERY,
  ringReport,
  scoreAnswers,
  type CheckerAnswers,
  type RingReport,
  type RingVerdict,
} from '@/lib/chem/huckel-gallery'
import styles from './huckel-checker.module.css'

/** Card drawings are 220 × 140 units and shown at that size, so a bond is at least 36 px and a label at least 13 px. */
const CARD = { w: 220, h: 140 }
const CARD_MIN_SCALE = 36
const CARD_MAX_SCALE = 50
/** The detail drawing is 560 × 300 units, shown at that size. */
const STAGE = { w: 560, h: 300 }
const STAGE_MAX_SCALE = 90

type YesNo = 'yes' | 'no' | 'none'
const YN_OPTIONS = [
  { value: 'yes' as const, label: 'Yes' },
  { value: 'no' as const, label: 'No' },
]
const VERDICT_OPTIONS: { value: RingVerdict; label: string }[] = [
  { value: 'aromatic', label: 'Aromatic' },
  { value: 'antiaromatic', label: 'Antiaromatic' },
  { value: 'non-aromatic', label: 'Non-aromatic' },
]
const VERDICT_WORD: Record<RingVerdict, string> = { aromatic: 'aromatic', antiaromatic: 'antiaromatic', 'non-aromatic': 'non-aromatic' }

/** Scale that fits a drawing in a box, clamped to a range. */
function fitScale(r: RingReport, w: number, h: number, min: number, max: number): number {
  const f = drawingFrame(r.graph, 1)
  const fit = Math.min((w - 24) / f.bounds.width, (h - 24) / f.bounds.height)
  return Math.max(min, Math.min(max, fit))
}

const yn = (v: boolean | undefined): YesNo => (v === undefined ? 'none' : v ? 'yes' : 'no')
const fromYn = (v: YesNo): boolean | undefined => (v === 'none' ? undefined : v === 'yes')

/** The answer the rule gives for a question, as the learner should read it. */
function truthText(r: RingReport, key: keyof CheckerAnswers): string {
  switch (key) {
    case 'cyclic':
      return r.cyclic ? 'Yes' : 'No'
    case 'flat':
      return r.conjugated && r.planar ? 'Yes' : 'No'
    case 'count':
      return String(r.piElectrons)
    case 'fits':
      return r.n !== undefined ? 'Yes' : 'No'
    case 'verdict':
      return VERDICT_WORD[r.verdict]
  }
}

const QUESTIONS: { key: keyof CheckerAnswers; text: string }[] = [
  { key: 'cyclic', text: 'Is the ring closed (cyclic)?' },
  { key: 'flat', text: 'Is it flat, with every ring atom in one π system?' },
  { key: 'count', text: 'How many π electrons does the ring have?' },
  { key: 'fits', text: 'Does the count fit 4n + 2?' },
  { key: 'verdict', text: 'Verdict' },
]

/**
 * The Hückel checker (Section 9.5.3). Pick a ring from the gallery, answer the four criteria and the verdict.
 * Each answer is marked against huckel() through the lib; the lib's reasons are shown once the verdict is given.
 */
export function HuckelChecker({ reducedMotion }: SimulationProps) {
  const reports = useMemo(() => HUCKEL_GALLERY.map((g) => ringReport(g.id)), [])
  const [selected, setSelected] = useState(0)
  const [answers, setAnswers] = useState<Record<string, CheckerAnswers>>({})

  const report = reports[selected]
  const mine: CheckerAnswers = answers[report.id] ?? {}
  const rows = scoreAnswers(report, mine)
  const answered = rows.filter((r) => r.correct !== undefined).length
  const right = rows.filter((r) => r.correct === true).length

  const update = (patch: CheckerAnswers) => {
    setAnswers((prev) => ({ ...prev, [report.id]: { ...(prev[report.id] ?? {}), ...patch } }))
  }

  const select = (index: number) => setSelected(index)

  const readout =
    answered === 0
      ? `${report.name}: answer the five questions. Each answer is checked against the rule.`
      : answered < QUESTIONS.length
        ? `${right} of ${answered} answered so far match the rule.`
        : mine.verdict === report.verdict && right === QUESTIONS.length
          ? `All five match. The rule gives ${VERDICT_WORD[report.verdict]} for ${report.name}.`
          : `${right} of ${QUESTIONS.length} match. The rule gives ${VERDICT_WORD[report.verdict]} for ${report.name}.`

  return (
    <div className={styles.lab} data-huckel-rings={HUCKEL_GALLERY.length} data-ring={report.id} data-reduced={reducedMotion ? 'true' : 'false'}>
      <div className={styles.gallery} role="group" aria-label="Rings to check">
        {reports.map((r, i) => {
          const isOn = i === selected
          const scale = fitScale(r, CARD.w, CARD.h, CARD_MIN_SCALE, CARD_MAX_SCALE)
          return (
            <button
              key={r.id}
              type="button"
              className={styles.card}
              aria-pressed={isOn}
              data-selected={isOn ? 'true' : 'false'}
              data-ring={r.id}
              onClick={() => select(i)}
            >
              <svg viewBox={`0 0 ${CARD.w} ${CARD.h}`} className={styles.cardDrawing} aria-hidden="true">
                <SkeletalFormula graph={r.graph} scale={scale} x={CARD.w / 2} y={CARD.h / 2} />
              </svg>
              <span className={styles.cardName}>{HUCKEL_GALLERY[i].name}</span>
            </button>
          )
        })}
      </div>

      <section className={styles.detail} aria-label={`${report.name} checker`} data-testid="huckel-detail">
        <div className={styles.stage}>
          <svg viewBox={`0 0 ${STAGE.w} ${STAGE.h}`} className={styles.stageDrawing} role="img" aria-label={`${report.name}, ${report.formula}`}>
            <SkeletalFormula graph={report.graph} scale={fitScale(report, STAGE.w, STAGE.h, 30, STAGE_MAX_SCALE)} x={STAGE.w / 2} y={STAGE.h / 2} />
          </svg>
        </div>
        <div className={styles.heading}>
          <h3 className={styles.name}>{HUCKEL_GALLERY[selected].name}</h3>
          <span className={styles.formula}>{report.formula}</span>
        </div>
        <p className={styles.shape}>{HUCKEL_GALLERY[selected].shape}</p>
        {report.iupac && <p className={styles.iupac}>IUPAC: {report.iupac}</p>}

        <ol className={styles.criteria}>
          {QUESTIONS.map((q, i) => {
            const row = rows[i]
            const mark = row.correct === undefined ? '' : row.correct ? 'Matches the rule.' : `The rule says ${truthText(report, q.key)}.`
            return (
              <li key={q.key} className={styles.criterion} data-key={q.key} data-correct={row.correct === undefined ? 'open' : row.correct ? 'true' : 'false'}>
                <span className={styles.question}>{q.text}</span>
                {q.key === 'count' && (
                  <NumberField
                    id={`huckel-count-${report.id}`}
                    label="π electrons"
                    value={mine.count ?? 0}
                    min={0}
                    max={20}
                    step={1}
                    onChange={(v) => update({ count: Math.round(v) })}
                  />
                )}
                {(q.key === 'cyclic' || q.key === 'flat' || q.key === 'fits') && (
                  <Segmented<YesNo>
                    label={q.text}
                    options={YN_OPTIONS}
                    value={yn(mine[q.key] as boolean | undefined)}
                    onChange={(v) => update({ [q.key]: fromYn(v) } as CheckerAnswers)}
                  />
                )}
                {q.key === 'verdict' && (
                  <Segmented<RingVerdict | 'none'>
                    label="Verdict"
                    options={VERDICT_OPTIONS}
                    value={mine.verdict ?? 'none'}
                    onChange={(v) => {
                      if (v !== 'none') update({ verdict: v })
                    }}
                  />
                )}
                <span className={styles.mark}>{mark}</span>
              </li>
            )
          })}
        </ol>

        <p className={styles.readout} aria-live="polite" data-testid="huckel-readout">
          {readout}
        </p>
        {mine.verdict !== undefined && (
          <ul className={styles.reasons} data-testid="huckel-reasons">
            {[...new Set(report.reasons)].map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
