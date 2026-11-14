'use client'

import { Label } from '@/components/vocab'
import { OCTAVE_ELEMENTS, octaveStep } from './history-steps'
import styles from './history.module.css'

export interface NewlandsOctavesProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 580
const VIEW_HEIGHT = 330
const COLS = 7
const COL_X0 = 130
const COL_PITCH = 62
const ROW_Y0 = 98
const ROW_PITCH = 66
const CELL_W = 54
const CELL_H = 50
const NOTES = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si'] as const

const cellX = (index: number) => COL_X0 + (index % COLS) * COL_PITCH
const cellY = (index: number) => ROW_Y0 + Math.floor(index / COLS) * ROW_PITCH

/**
 * Newlands' Table 3.2 laid out seven to a row, so the eighth element sits directly below
 * the first. Columns carry the note names of the octave, do re mi fa sol la si.
 */
export function NewlandsOctaves({ step }: NewlandsOctavesProps) {
  const s = octaveStep(step)
  const lit = new Set(s.lit)
  const first = OCTAVE_ELEMENTS[0]
  const eighth = OCTAVE_ELEMENTS[7]

  const caption =
    step <= 0
      ? `${first.symbol} is the first note: do.`
      : step === 1
        ? 'Seven notes, Li to F, one row. The pattern is set.'
        : step === 2
          ? `${eighth.symbol} is the eighth element and echoes ${first.symbol}, as the eighth note of an octave does.`
          : 'The pattern holds up to calcium. Beyond it, Newlands’ spacing no longer works.'

  return (
    <div>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.svg}
        role="img"
        aria-label="Newlands' octaves: elements in order of atomic weight, seven to a row, so every eighth element lines up under the first"
        data-testid="octaves"
        data-step={step}
      >
        {NOTES.map((note, col) => (
          <text key={note} x={cellX(col)} y={ROW_Y0 - 30} textAnchor="middle" className={styles.tick}>
            {note}
          </text>
        ))}

        {s.echoArc && (
          <path
            d={`M ${cellX(0) - 30} ${cellY(0)} C ${cellX(0) - 58} ${cellY(0) + 30}, ${cellX(0) - 58} ${cellY(7) - 30}, ${cellX(0) - 30} ${cellY(7)}`}
            className={styles.arc}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={0}
            data-testid="echo-arc"
          />
        )}

        {OCTAVE_ELEMENTS.map((el, i) => {
          const isLit = lit.has(i)
          return (
            <g key={el.symbol} className={isLit ? styles.lit : styles.dim}>
              <rect
                x={cellX(i) - CELL_W / 2}
                y={cellY(i) - CELL_H / 2}
                width={CELL_W}
                height={CELL_H}
                rx={6}
                className={isLit ? styles.cellFocus : styles.cellKnown}
              />
              <text x={cellX(i)} y={cellY(i) - 5} textAnchor="middle" dominantBaseline="central" className={styles.symbolText}>
                {el.symbol}
              </text>
              <text x={cellX(i)} y={cellY(i) + 13} textAnchor="middle" dominantBaseline="central" className={styles.caption}>
                {el.weight}
              </text>
            </g>
          )
        })}

        {s.breakMarker && (
          <g data-testid="break-marker">
            <rect
              x={cellX(15) + COL_PITCH - CELL_W / 2}
              y={cellY(15) - CELL_H / 2}
              width={CELL_W}
              height={CELL_H}
              rx={6}
              className={styles.cellGap}
            />
            <Label x={cellX(15) + COL_PITCH} y={cellY(15)} fontSize={16} fill="var(--fg-subtle)">
              ?
            </Label>
          </g>
        )}

        <text x={COL_X0 - 52} y={VIEW_HEIGHT - 32} className={styles.note}>
          {caption}
        </text>
      </svg>
    </div>
  )
}
