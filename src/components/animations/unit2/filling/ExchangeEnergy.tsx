'use client'

import { useEffect, useState } from 'react'
import gsap from 'gsap'
import { Label, OrbitalBox, VocabDefs, type OrbitalSpin } from '@/components/vocab'
import { exchangePairs } from '@/lib/chem/orbital-builder'
import {
  EXCHANGE_STEP_COUNT,
  clampStep,
  exchangeDescription,
  exchangeTargetForStep,
  type ExchangeSnapshot,
} from './filling-steps'
import styles from './filling.module.css'

export interface ExchangeEnergyProps {
  step: number
  reducedMotion: boolean
}

// ---------------------------------------------------------------------------
// Geometry (SVG viewBox 640 x 540)
// ---------------------------------------------------------------------------

const VIEW_WIDTH = 640
const VIEW_HEIGHT = 540
const BOX = 46
const BOX_GAP = 14
const ROW_X = 176
const ROW_WIDTH = 5 * BOX + 4 * BOX_GAP
const FIVE_Y = 176
const FOUR_Y = 354
/** Arcs rise (or fall) this many units per position they span. */
const ARC_DEPTH = 17

interface Pair {
  a: number
  b: number
}

/** Every pair of positions among `count` boxes, shortest span first, so the arcs grow outward. */
function pairsFor(count: number): Pair[] {
  const pairs: Pair[] = []
  for (let a = 0; a < count; a++) {
    for (let b = a + 1; b < count; b++) pairs.push({ a, b })
  }
  return pairs.sort((p, q) => p.b - p.a - (q.b - q.a) || p.a - q.a)
}

const FIVE_PAIRS = pairsFor(5)
const FOUR_PAIRS = pairsFor(4)

function centreX(index: number): number {
  return ROW_X + index * (BOX + BOX_GAP) + BOX / 2
}

/**
 * An elliptical arc between two boxes on one row. `above` arcs rise from the top of
 * the row, and the others fall from the bottom.
 */
function arcPath(pair: Pair, rowTop: number, above: boolean): string {
  const x1 = centreX(pair.a)
  const x2 = centreX(pair.b)
  const y = above ? rowTop : rowTop + BOX
  const rx = (x2 - x1) / 2
  const ry = (pair.b - pair.a) * ARC_DEPTH
  const sweep = above ? 1 : 0
  return `M${x1},${y} A${rx},${ry} 0 0 ${sweep} ${x2},${y}`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ExchangeEnergy: five parallel 3d electrons in d⁵ have ten pairs that can swap,
 * drawn as arcs. The d⁴ row has six. The counter shows how many arcs are drawn.
 */
export function ExchangeEnergy({ step, reducedMotion }: ExchangeEnergyProps) {
  const activeStep = clampStep(step, EXCHANGE_STEP_COUNT)

  const [state] = useState<ExchangeSnapshot>(() => ({ five: 0, four: 0 }))
  const [view, setView] = useState<ExchangeSnapshot>(() => ({ ...state }))
  const render = () => setView({ ...state })

  useEffect(() => {
    const target = exchangeTargetForStep(activeStep)

    if (reducedMotion) {
      Object.assign(state, target)
      const redraw = gsap.delayedCall(0, render)
      return () => {
        redraw.kill()
      }
    }

    const tl = gsap.timeline({ onUpdate: render })
    tl.to(state, { five: target.five, duration: 1.6, ease: 'none' }, 0)
    tl.to(state, { four: target.four, duration: 1.1, ease: 'none' }, target.five > state.five ? 1.2 : 0)
    return () => {
      tl.kill()
    }
    // `render` and `state` are stable for the component lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, reducedMotion])

  const fiveSpins: OrbitalSpin[] = Array.from({ length: 5 }, () => ({ up: true, down: false }))
  const fourSpins: OrbitalSpin[] = [
    { up: true, down: false },
    { up: true, down: false },
    { up: true, down: false },
    { up: true, down: false },
    { up: false, down: false },
  ]

  const fiveTotal = exchangePairs(5)
  const fourTotal = exchangePairs(4)
  const fiveShown = Math.round(view.five)
  const fourShown = Math.round(view.four)

  /** Share of an arc drawn: arc i is complete when the counter passes i + 1. */
  const progress = (shown: number, index: number) => Math.min(1, Math.max(0, shown - index))

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.svg}
        role="img"
        aria-label="Exchange pairs in the 3d subshell: ten pairs of parallel electrons in d five, and six in d four"
        data-testid="exchange-energy"
        data-step={activeStep}
        data-five={fiveShown}
        data-four={fourShown}
      >
        <VocabDefs idPrefix="exchange" />

        <Label x={VIEW_WIDTH / 2} y={34} fontSize={17} fill="var(--fg-muted)">
          Exchange pairs: same-spin electrons in one subshell can swap
        </Label>

        {/* d5: arcs above the row */}
        <Label x={ROW_X - 16} y={FIVE_Y + BOX / 2} textAnchor="end" fontSize={18} fill="var(--fg)">
          3d⁵
        </Label>
        {FIVE_PAIRS.map((pair, i) => {
          const p = progress(fiveShown, i)
          if (p <= 0) return null
          return (
            <path
              key={`five-${pair.a}-${pair.b}`}
              d={arcPath(pair, FIVE_Y, true)}
              fill="none"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - p}
              strokeWidth={1.8}
              strokeLinecap="round"
              data-testid="exchange-arc"
              style={{ stroke: 'var(--accent)', opacity: 0.85 }}
            />
          )
        })}
        <OrbitalBox orbitals={fiveSpins} x={ROW_X} y={FIVE_Y} size={BOX} gap={BOX_GAP} />
        <Label x={ROW_X + ROW_WIDTH + 24} y={FIVE_Y + BOX / 2} textAnchor="start" fontSize={16} fill="var(--fg)">
          {fiveShown} of {fiveTotal} pairs
        </Label>

        {/* d4: arcs below the row */}
        <Label x={ROW_X - 16} y={FOUR_Y + BOX / 2} textAnchor="end" fontSize={18} fill="var(--fg)">
          3d⁴
        </Label>
        {FOUR_PAIRS.map((pair, i) => {
          const p = progress(fourShown, i)
          if (p <= 0) return null
          return (
            <path
              key={`four-${pair.a}-${pair.b}`}
              d={arcPath(pair, FOUR_Y, false)}
              fill="none"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - p}
              strokeWidth={1.8}
              strokeLinecap="round"
              data-testid="exchange-arc"
              style={{ stroke: 'var(--accent)', opacity: 0.85 }}
            />
          )
        })}
        <OrbitalBox orbitals={fourSpins} x={ROW_X} y={FOUR_Y} size={BOX} gap={BOX_GAP} />
        <Label x={ROW_X + ROW_WIDTH + 24} y={FOUR_Y + BOX / 2} textAnchor="start" fontSize={16} fill="var(--fg)">
          {fourShown} of {fourTotal} pairs
        </Label>

        <Label x={VIEW_WIDTH / 2} y={VIEW_HEIGHT - 26} fontSize={14} fill="var(--fg-subtle)">
          Each arc joins two electrons with the same spin.
        </Label>
      </svg>

      <p className={styles.srOnly} aria-live="polite">
        {exchangeDescription(activeStep)}
      </p>
    </div>
  )
}
