'use client'

import { SERIES_TONE } from '@/components/vocab/dblock/tones'
import { P_BLOCK_STEP_OF_TWO_EXAMPLE } from '@/lib/chem/dblock-series-data'
import {
  METALS,
  MN_RUNGS,
  MN_TOKEN_SUBSHELLS,
  STATE_ROWS,
  endNotes,
  getOxStateStep,
  gridCells,
  group6Cells,
  mnRemovedTokens,
  mnRungs,
  stateCounts,
} from './oxstates-steps'

export interface OxidationStateGridProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

const W = 580
const H = 500

/* Grid (Steps 1 to 3): ten metal columns, charges +7 (top) to +1. */
const COL_X0 = 64
const COL_W = 50
const CELL_W = 44
const CELL_H = 28
const ROW_TOP = 56
const ROW_STEP = 34
const BAR_BASE = 404
const BAR_UNIT = 13
const BAR_W = 22

/* Ladders (Steps 4 to 6). */
const AXIS_X = 60
const AXIS_TOP = 60
const AXIS_BOTTOM = 380
const UNIT = 40

const TEXT = { fontSize: 14, fill: 'var(--fg)' } as const
const MUTED = { fontSize: 14, fill: 'var(--fg-muted)' } as const

function colX(i: number): number {
  return COL_X0 + COL_W / 2 + i * COL_W
}

function rowY(state: number): number {
  return ROW_TOP + (7 - state) * ROW_STEP
}

/** y of a charge on the shared ladder scale (0 at the bottom, 8 at the top). */
function ladderY(state: number): number {
  return AXIS_BOTTOM - state * UNIT
}

function Grid({ fill, ends }: { fill: boolean; ends: boolean }) {
  const counts = stateCounts()
  const tone = SERIES_TONE['3d']
  return (
    <g>
      {METALS.map((metal, i) => {
        const cx = colX(i)
        const dim = ends && metal !== 'Sc' && metal !== 'Zn'
        const cells = gridCells(metal)
        const common = new Set(cells.filter((c) => c.common).map((c) => c.state))
        const filled = new Set(cells.map((c) => c.state))
        return (
          <g key={metal} opacity={dim ? 0.3 : 1}>
            <text x={cx} y={ROW_TOP - 12} textAnchor="middle" {...TEXT} fontWeight={600}>
              {metal}
            </text>
            {STATE_ROWS.map((state) => {
              const y = rowY(state)
              const isFilled = fill && filled.has(state)
              const isCommon = common.has(state)
              return (
                <rect
                  key={state}
                  x={cx - CELL_W / 2}
                  y={y}
                  width={CELL_W}
                  height={CELL_H}
                  rx={6}
                  fill={isFilled ? tone : 'none'}
                  fillOpacity={isFilled ? (isCommon ? 0.9 : 0.3) : undefined}
                  stroke={isFilled && isCommon ? tone : 'var(--border)'}
                  strokeWidth={isCommon ? 2 : 1}
                />
              )
            })}
            {counts && (
              <g>
                <rect
                  x={cx - BAR_W / 2}
                  y={BAR_BASE - counts[i]! * BAR_UNIT}
                  width={BAR_W}
                  height={counts[i]! * BAR_UNIT}
                  rx={3}
                  fill={tone}
                  fillOpacity={0.55}
                />
                <text x={cx} y={BAR_BASE - counts[i]! * BAR_UNIT - 6} textAnchor="middle" {...TEXT}>
                  {counts[i]}
                </text>
              </g>
            )}
          </g>
        )
      })}
      {counts && (
        <text x={52} y={BAR_BASE - 4} textAnchor="end" {...MUTED}>
          states
        </text>
      )}
      {STATE_ROWS.map((state) => (
        <text key={state} x={52} y={rowY(state) + CELL_H / 2 + 5} textAnchor="end" {...TEXT}>
          {`+${state}`}
        </text>
      ))}
    </g>
  )
}

function EndsFrame() {
  return (
    <g>
      {['Sc', 'Zn'].map((metal) => {
        const i = METALS.indexOf(metal as (typeof METALS)[number])
        const cx = colX(i)
        return (
          <rect
            key={metal}
            x={cx - COL_W / 2 + 2}
            y={ROW_TOP - 28}
            width={COL_W - 4}
            height={BAR_BASE - ROW_TOP + 32}
            rx={8}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={2}
            strokeDasharray="5 4"
          />
        )
      })}
      {endNotes().map((note, k) => (
        <text
          key={note.symbol}
          x={k === 0 ? COL_X0 : 564}
          y={446}
          textAnchor={k === 0 ? 'start' : 'end'}
          {...TEXT}
        >
          {`${note.symbol} ${note.config}: only +${note.state}`}
        </text>
      ))}
    </g>
  )
}

function MnLadder() {
  const tone = SERIES_TONE['3d']
  const tokenX = (j: number) => 112 + j * 28
  return (
    <g>
      <text x={48} y={40} {...TEXT} fontWeight={600}>
        Mn
      </text>
      <text x={tokenX(0.5)} y={40} textAnchor="middle" {...MUTED}>
        4s
      </text>
      <text x={tokenX(4)} y={40} textAnchor="middle" {...MUTED}>
        3d
      </text>
      {mnRungs().map((rung, i) => {
        const cy = 96 + i * 56
        const removed = mnRemovedTokens(rung.state)
        return (
          <g key={rung.state}>
            <text x={84} y={cy + 5} textAnchor="end" {...TEXT}>
              {`+${rung.state}`}
            </text>
            {MN_TOKEN_SUBSHELLS.map((sub, j) => {
              const isGone = j < removed
              const fillColour = sub === '4s' ? 'var(--accent)' : tone
              return (
                <circle
                  key={j}
                  cx={tokenX(j)}
                  cy={cy}
                  r={10}
                  fill={isGone ? 'none' : fillColour}
                  stroke={isGone ? 'var(--fg-subtle)' : fillColour}
                  strokeWidth={isGone ? 1.5 : 1}
                  strokeDasharray={isGone ? '3 3' : undefined}
                />
              )
            })}
            <text x={312} y={cy + 5} {...TEXT}>
              {`${rung.label}  ${rung.config}`}
            </text>
          </g>
        )
      })}
      <line x1={96} y1={96} x2={96} y2={376} stroke="var(--border)" strokeWidth={2} />
      <text x={48} y={440} {...MUTED}>
        Each rung removes one more token; dashed tokens have gone.
      </text>
    </g>
  )
}

function Axis() {
  return (
    <g>
      <line x1={AXIS_X} y1={AXIS_TOP} x2={AXIS_X} y2={AXIS_BOTTOM} stroke="var(--border)" strokeWidth={1.5} />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
        <g key={s}>
          <line x1={AXIS_X - 5} y1={ladderY(s)} x2={AXIS_X} y2={ladderY(s)} stroke="var(--border)" />
          <text x={AXIS_X - 9} y={ladderY(s) + 5} textAnchor="end" {...MUTED}>
            {s}
          </text>
        </g>
      ))}
      <text x={48} y={40} {...MUTED}>
        oxidation state
      </text>
    </g>
  )
}

function TinLadder() {
  const mnX0 = 120
  const snX0 = 330
  const rungLength = 80
  return (
    <g>
      <Axis />
      {MN_RUNGS.map((s) => (
        <g key={`mn${s}`}>
          <line x1={mnX0} x2={mnX0 + rungLength} y1={ladderY(s)} y2={ladderY(s)} stroke={SERIES_TONE['3d']} strokeWidth={4} strokeLinecap="round" />
          <text x={mnX0 + rungLength + 8} y={ladderY(s) + 5} {...TEXT}>
            {`+${s}`}
          </text>
        </g>
      ))}
      {P_BLOCK_STEP_OF_TWO_EXAMPLE.states.map((s) => (
        <g key={`sn${s}`}>
          <line x1={snX0} x2={snX0 + rungLength} y1={ladderY(s)} y2={ladderY(s)} stroke="var(--fg-muted)" strokeWidth={4} strokeLinecap="round" />
          <text x={snX0 + rungLength + 8} y={ladderY(s) + 5} {...TEXT}>
            {`+${s}`}
          </text>
        </g>
      ))}
      <text x={mnX0 + rungLength / 2} y={414} textAnchor="middle" {...TEXT} fontWeight={600}>
        Mn
      </text>
      <text x={snX0 + rungLength / 2} y={414} textAnchor="middle" {...TEXT} fontWeight={600}>
        {P_BLOCK_STEP_OF_TWO_EXAMPLE.symbol}
      </text>
      <text x={48} y={446} {...MUTED}>
        Mn: a rung at every unit. Sn: rungs two units apart.
      </text>
    </g>
  )
}

function Group6() {
  const cells = group6Cells()
  const tones: Record<string, string> = { Cr: SERIES_TONE['3d'], Mo: SERIES_TONE['4d'], W: SERIES_TONE['5d'] }
  return (
    <g>
      <Axis />
      <text x={290} y={100} textAnchor="middle" {...TEXT}>
        The +6 state grows more stable down the group
      </text>
      {cells.map((cell, i) => {
        const cx = 170 + i * 130
        const y = ladderY(6)
        return (
          <g key={cell.symbol}>
            <line
              x1={cx - 45}
              x2={cx + 45}
              y1={y}
              y2={y}
              stroke={tones[cell.symbol]}
              strokeWidth={6}
              strokeLinecap="round"
              opacity={cell.strength}
            />
            <text x={cx} y={y - 12} textAnchor="middle" {...TEXT}>
              +6
            </text>
            <text x={cx} y={414} textAnchor="middle" {...TEXT} fontWeight={600}>
              {cell.symbol}
            </text>
            <text x={cx} y={436} textAnchor="middle" {...TEXT}>
              {cell.species}
            </text>
            <text x={cx} y={458} textAnchor="middle" {...MUTED}>
              {cell.strongOxidant ? 'strong oxidant' : 'not an oxidant'}
            </text>
          </g>
        )
      })}
    </g>
  )
}

export function OxidationStateGrid({ step }: OxidationStateGridProps) {
  const s = getOxStateStep(step)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Oxidation states of the first-row d-block metals">
      {s.mnLadder ? (
        <MnLadder />
      ) : s.tinLadder ? (
        <TinLadder />
      ) : s.group6 ? (
        <Group6 />
      ) : (
        <g>
          <Grid fill={s.fill} ends={s.ends} />
          {s.ends && <EndsFrame />}
        </g>
      )}
    </svg>
  )
}
