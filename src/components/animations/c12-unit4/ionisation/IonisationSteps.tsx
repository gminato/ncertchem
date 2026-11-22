'use client'

import { PlotCurve, PlotFrame, PlotPoint, TONE_VAR, usePlotScale, type PlotTone } from '@/components/vocab'
import { ConfigurationBoxes, configurationLayout } from '@/components/vocab/dblock'
import {
  SERIES_VALUES,
  SYMBOLS,
  gapOf,
  getIonisationStepState,
  type IeLevel,
  type MarkSpec,
  type RowSpec,
} from './ionisation-steps'

export interface IonisationStepsProps {
  /** 0-based Step index from Scrolly. */
  step: number
}

const W = 580
const H = 580
const TONE: Record<IeLevel, PlotTone> = { 1: 'reactant', 2: 'product', 3: 'catalyst' }
const LEVEL_LABEL: Record<IeLevel, string> = { 1: 'IE₁', 2: 'IE₂', 3: 'IE₃' }
const DIMMED = 0.16
const DOMAIN = { xMin: -0.5, xMax: 9.5, yMin: 0, yMax: 4000 }
const Y_TICKS = [0, 1000, 2000, 3000, 4000]
const X_TICKS = SYMBOLS.map((_, i) => i)
const FULL = { x: 78, y: 44, width: 470, height: 420 }
const SPLIT = { x: 78, y: 44, width: 470, height: 200 }

const LEFT_X = 36
const RIGHT_X = 276
const ARROW_X = 264
const VALUE_X = 506
const CFG_W = 216
const CFG_MAX = 36
const ROWS_TOP = 300
const ROW_GAP = 58
/** With only two rows, space them out so the block fills the panel. */
const ROW_GAP_TWO = 120

function levelOpacity(lit: readonly IeLevel[], level: IeLevel): number {
  return lit.includes(level) ? 1 : DIMMED
}

function markLabel(mark: MarkSpec): string {
  const value = SERIES_VALUES.find((v) => v.symbol === mark.element)?.[mark.level] ?? NaN
  return mark.label === 'symbol' ? `${mark.element} ${value}` : String(value)
}

function markPoint(mark: MarkSpec): { x: number; y: number } {
  const index = SYMBOLS.indexOf(mark.element as (typeof SYMBOLS)[number])
  const value = SERIES_VALUES[index][mark.level]
  return { x: index, y: value }
}

/** Dots at every element of one level, drawn in data coordinates. */
function LevelDots({ level, opacity }: { level: IeLevel; opacity: number }) {
  const scale = usePlotScale()
  return (
    <g opacity={opacity}>
      {SERIES_VALUES.map((v, i) => (
        <circle key={i} cx={scale.x(i)} cy={scale.y(v[level])} r={3.5} fill={TONE_VAR[TONE[level]]} />
      ))}
    </g>
  )
}

/** Dashed guides from Mn's and Fe's level-3 points, with the gap between them. */
function GapBracket({ from, to, gap }: { from: { x: number; y: number }; to: { x: number; y: number }; gap: number }) {
  const scale = usePlotScale()
  const xa = scale.x(from.x)
  const ya = scale.y(from.y)
  const xb = scale.x(to.x)
  const yb = scale.y(to.y)
  const xr = xb + 16
  return (
    <g>
      <path
        d={`M${xa} ${ya} H${xr} V${yb} H${xb}`}
        fill="none"
        stroke="var(--fg-muted)"
        strokeWidth={1.5}
        strokeDasharray="4 3"
      />
      <text x={(xa + xb) / 2} y={scale.y(3420)} fontSize={15} fill="var(--fg)" textAnchor="middle">
        {`gap ${gap}`}
      </text>
    </g>
  )
}

function Legend({ lit }: { lit: readonly IeLevel[] }) {
  const levels: IeLevel[] = [1, 2, 3]
  return (
    <g>
      {levels.map((level, i) => {
        const x = 78 + i * 100
        return (
          <g key={level} opacity={levelOpacity(lit, level)}>
            <line x1={x} x2={x + 26} y1={22} y2={22} stroke={TONE_VAR[TONE[level]]} strokeWidth={3} strokeLinecap="round" />
            <text x={x + 34} y={22} fontSize={15} fill="var(--fg)" dominantBaseline="middle">
              {LEVEL_LABEL[level]}
            </text>
          </g>
        )
      })}
    </g>
  )
}

/** One row of the configuration block: left configuration, arrow, right configuration, and the value. */
function RowBlock({ row, top, size }: { row: RowSpec; top: number; size: number }) {
  const h = size
  const mid = top + h / 2
  return (
    <g>
      <text x={LEFT_X} y={top - 8} fontSize={15} fill="var(--fg)">
        {row.captionLeft}
      </text>
      <text x={RIGHT_X} y={top - 8} fontSize={15} fill="var(--fg)">
        {row.captionRight}
      </text>
      <ConfigurationBoxes config={row.left} x={LEFT_X} y={top} width={CFG_W} maxSize={size} />
      <text x={ARROW_X} y={mid} fontSize={20} fill="var(--fg-muted)" textAnchor="middle" dominantBaseline="middle">
        →
      </text>
      <ConfigurationBoxes config={row.right} x={RIGHT_X} y={top} width={CFG_W} maxSize={size} />
      <text x={LEFT_X} y={top + h + 18} fontSize={14} fill="var(--fg-muted)">
        {`${row.pairsLeft} parallel pairs`}
      </text>
      <text x={RIGHT_X} y={top + h + 18} fontSize={14} fill="var(--fg-muted)">
        {`${row.pairsRight} parallel pairs`}
      </text>
      <text x={VALUE_X} y={mid - 10} fontSize={14} fill="var(--fg-muted)" dominantBaseline="middle">
        {LEVEL_LABEL[row.level]}
      </text>
      <text x={VALUE_X} y={mid + 12} fontSize={16} fontWeight={600} fill="var(--fg)" dominantBaseline="middle">
        {String(row.value)}
      </text>
    </g>
  )
}

/** One box size for every configuration in a Step: the smallest that fits any of them, so the rows match. */
function stepBoxSize(rows: readonly RowSpec[]): number {
  const fits = rows.flatMap((row) => [configurationLayout(row.left, CFG_W, CFG_MAX).size, configurationLayout(row.right, CFG_W, CFG_MAX).size])
  return Math.min(CFG_MAX, ...fits)
}

/** Top edge of each row: rows stack down from ROWS_TOP, each taking the Step's box height plus a fixed gap. */
function rowTops(rows: readonly RowSpec[], size: number): { row: RowSpec; top: number }[] {
  const gap = rows.length <= 2 ? ROW_GAP_TWO : ROW_GAP
  return rows.map((row, i) => ({ row, top: ROWS_TOP + i * (size + gap) }))
}

export function IonisationSteps({ step }: IonisationStepsProps) {
  const state = getIonisationStepState(step)
  const frame = state.layout === 'full' ? FULL : SPLIT
  const levels: IeLevel[] = [1, 2, 3]

  const size = stepBoxSize(state.rows)
  const rowNodes = rowTops(state.rows, size).map(({ row, top }) => (
    <RowBlock key={`${row.element}-${row.level}`} row={row} top={top} size={size} />
  ))

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label="Ionisation enthalpies across the 3d row, with the configurations of the ions in the highlighted step"
      style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
    >
      <Legend lit={state.lit} />
      <PlotFrame
        {...frame}
        domain={DOMAIN}
        xTicks={X_TICKS}
        yTicks={Y_TICKS}
        xTickFormat={(v) => SYMBOLS[Math.round(v)] ?? ''}
        yTitle="IE / kJ mol⁻¹"
        xTitle={state.layout === 'full' ? 'Element, 3d row' : undefined}
      >
        {levels.map((level) => (
          <PlotCurve
            key={level}
            points={SERIES_VALUES.map((v, i) => [i, v[level]] as const)}
            tone={TONE[level]}
            width={3}
            opacity={levelOpacity(state.lit, level)}
          />
        ))}
        {levels.map((level) => (
          <LevelDots key={level} level={level} opacity={levelOpacity(state.lit, level)} />
        ))}
        {state.marks.map((mark) => (
          <PlotPoint
            key={`${mark.element}-${mark.level}`}
            at={markPoint(mark)}
            tone={TONE[mark.level]}
            label={markLabel(mark)}
            side={mark.side ?? 'above'}
          />
        ))}
        {state.bracket ? (
          <GapBracket
            from={markPoint({ element: state.bracket[0], level: 3, label: 'value' })}
            to={markPoint({ element: state.bracket[1], level: 3, label: 'value' })}
            gap={gapOf(state.bracket[0], state.bracket[1], 3)}
          />
        ) : null}
      </PlotFrame>
      {rowNodes}
    </svg>
  )
}
