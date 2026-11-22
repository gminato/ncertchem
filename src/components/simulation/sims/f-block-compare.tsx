'use client'

import { useState } from 'react'
import { Slider } from '@/components/controls'
import { PlotCurve, PlotFrame, usePlotScale } from '@/components/vocab'
import { ConfigurationBoxes, configurationLayout, SERIES_TONE } from '@/components/vocab/dblock'
import {
  F_SERIES_POSITIONS,
  actinoidSymbols,
  fBlockPosition,
  firstActinoidAhead,
  lanthanoidSymbols,
  type FBlockPosition,
} from '@/lib/chem/f-block-compare'
import styles from './f-block-compare.module.css'

const POSITIONS = Array.from({ length: F_SERIES_POSITIONS }, (_, i) => fBlockPosition(i + 1))
const LN_SYMBOLS = lanthanoidSymbols()
const AN_SYMBOLS = actinoidSymbols()
const STATE_COLUMNS = [2, 3, 4, 5, 6, 7] as const
const COLUMN_WIDTH = 284
const LEFT_X = 6
const RIGHT_X = 322
const BOX_WIDTH = 260
const BOX_MAX = 36
const FIRST_AHEAD = firstActinoidAhead()

/** Radius points (position, pm) for the plot, one list per series. Missing printed radii are left out, never drawn. */
const LN_RADIUS_POINTS: Array<[number, number]> = POSITIONS.flatMap((p) =>
  p.lanthanoid.radiusM3PlusPm === null ? [] : [[p.position, p.lanthanoid.radiusM3PlusPm] as [number, number]],
)
const AN_RADIUS_POINTS: Array<[number, number]> = POSITIONS.flatMap((p) =>
  p.actinoid.radiusM3PlusPm === null ? [] : [[p.position, p.actinoid.radiusM3PlusPm] as [number, number]],
)

const PLOT = { x: 84, y: 362, width: 496, height: 200 }
const PLOT_DOMAIN = { xMin: 0.5, xMax: F_SERIES_POSITIONS + 0.5, yMin: 84, yMax: 106 }
const RADIUS_TICKS = [86, 90, 94, 98, 102, 106]

/** Dots for one series, drawn through the frame's scale and tinted with the series tone. */
function SeriesDots({ points, tone }: { points: ReadonlyArray<readonly [number, number]>; tone: string }) {
  const s = usePlotScale()
  return (
    <g>
      {points.map(([px, py]) => (
        <circle key={`${tone}-${px}`} cx={s.x(px)} cy={s.y(py)} r={6} fill={tone} stroke="var(--surface)" strokeWidth={2} />
      ))}
    </g>
  )
}

/** Dashed vertical marker at the chosen position. */
function PositionMarker({ position }: { position: number }) {
  const s = usePlotScale()
  return (
    <line
      x1={s.x(position)}
      x2={s.x(position)}
      y1={s.y(PLOT_DOMAIN.yMin)}
      y2={s.y(PLOT_DOMAIN.yMax)}
      stroke="var(--accent)"
      strokeWidth={2}
      strokeDasharray="6 5"
    />
  )
}

interface SideProps {
  x: number
  member: FBlockPosition['lanthanoid']
  kind: 'ln' | 'an'
  f3Subshell: '4f' | '5f'
}

/** One element's column: atom configuration, M³⁺ f-electrons drawn as boxes, radius, and the oxidation-state ladder. */
function ElementColumn({ x, member, kind, f3Subshell }: SideProps) {
  const tone = kind === 'ln' ? SERIES_TONE.ln : SERIES_TONE.an
  const tag = kind === 'ln' ? 'Lanthanoid' : 'Actinoid'
  const f3 = [{ subshell: f3Subshell, electrons: member.f3Count }]
  const layout = configurationLayout(f3, BOX_WIDTH, BOX_MAX)
  const boxY = 128
  const ionY = boxY + layout.height + 28
  const radiusY = ionY + 28
  const ladderTitleY = radiusY + 34
  const dotY = ladderTitleY + 30
  const labelY = dotY + 34
  const radiusText = member.radiusM3PlusPm === null ? 'not printed' : `${member.radiusM3PlusPm} pm`
  return (
    <g transform={`translate(${x} 0)`} data-testid={`column-${kind}`}>
      <text x={0} y={42} fontSize={40} fontWeight={700} fill="var(--fg)">
        {member.symbol}
      </text>
      <text x={72} y={24} fontSize={16} fill="var(--fg-muted)">
        {member.name}
      </text>
      <text x={72} y={46} fontSize={16} fontWeight={700} fill={tone}>
        {tag}
      </text>
      <text x={0} y={88} fontSize={16} fill="var(--fg)">
        <tspan fill="var(--fg-muted)">Atom </tspan>
        {member.atomConfig}
      </text>
      <text x={0} y={114} fontSize={16} fill="var(--fg-muted)">
        M³⁺ f electrons
      </text>
      <g transform={`translate(0 ${boxY})`}>
        <ConfigurationBoxes config={f3} x={0} y={0} width={BOX_WIDTH} maxSize={BOX_MAX} fontSize={16} />
      </g>
      <text x={0} y={ionY} fontSize={18} fill="var(--fg)">
        {member.ion3Label}: {member.ion3Config}
      </text>
      <text x={0} y={radiusY} fontSize={16} fill="var(--fg)">
        <tspan fill="var(--fg-muted)">M³⁺ radius </tspan>
        {radiusText}
      </text>
      <text x={0} y={ladderTitleY} fontSize={16} fill="var(--fg-muted)">
        Oxidation states (highest +{member.maxState})
      </text>
      {STATE_COLUMNS.map((state, i) => {
        const cx = 22 + i * 44
        const has = member.states.includes(state)
        const top = state === member.maxState
        return (
          <g key={state} data-testid={`state-${kind}-${state}`} data-present={has ? 'yes' : 'no'}>
            <circle
              cx={cx}
              cy={dotY}
              r={top ? 11 : 9}
              fill={has ? tone : 'none'}
              stroke={has ? tone : 'var(--border)'}
              strokeWidth={has ? 1 : 2}
            />
            <text x={cx} y={labelY} fontSize={16} textAnchor="middle" fill={has ? 'var(--fg)' : 'var(--fg-subtle)'}>
              +{state}
            </text>
          </g>
        )
      })}
    </g>
  )
}

export function FBlockCompare() {
  const [position, setPosition] = useState(1)
  const current = fBlockPosition(position)
  const lnPoint = LN_RADIUS_POINTS
  const anPoint = AN_RADIUS_POINTS

  return (
    <div className={styles.sim}>
      <div className={styles.controls}>
        <Slider
          label="Position in the f-series"
          value={position}
          min={1}
          max={F_SERIES_POSITIONS}
          step={1}
          onChange={setPosition}
          format={(v) => `${v} of ${F_SERIES_POSITIONS}: ${LN_SYMBOLS[v - 1]} and ${AN_SYMBOLS[v - 1]}`}
        />
      </div>

      <div className={styles.stage}>
        <svg
          className={styles.scene}
          viewBox="0 0 600 645"
          role="img"
          aria-label={`Lanthanoid ${current.lanthanoid.symbol} and actinoid ${current.actinoid.symbol} side by side at position ${position}`}
        >
          <line x1={310} x2={310} y1={0} y2={310} stroke="var(--border)" strokeWidth={1.5} />
          <ElementColumn x={LEFT_X} member={current.lanthanoid} kind="ln" f3Subshell="4f" />
          <ElementColumn x={RIGHT_X} member={current.actinoid} kind="an" f3Subshell="5f" />

          <PlotFrame
            x={PLOT.x}
            y={PLOT.y}
            width={PLOT.width}
            height={PLOT.height}
            domain={PLOT_DOMAIN}
            xTicks={POSITIONS.map((p) => p.position)}
            yTicks={RADIUS_TICKS}
            xTickFormat={(v) => String(v)}
            yTickFormat={(v) => String(v)}
            xTitle="position in the f-series (1 = Ce or Th)"
            yTitle="M³⁺ radius / pm"
          >
            <PlotCurve points={lnPoint} stroke={SERIES_TONE.ln} width={3} />
            <PlotCurve points={anPoint} stroke={SERIES_TONE.an} width={3} />
            <SeriesDots points={lnPoint} tone={SERIES_TONE.ln} />
            <SeriesDots points={anPoint} tone={SERIES_TONE.an} />
            <PositionMarker position={position} />
          </PlotFrame>
          <g fontSize={16}>
            <circle cx={70} cy={630} r={6} fill={SERIES_TONE.ln} />
            <text x={82} y={635} fill="var(--fg)">
              Ln³⁺ (Ce to Yb)
            </text>
            <circle cx={260} cy={630} r={6} fill={SERIES_TONE.an} />
            <text x={272} y={635} fill="var(--fg)">
              An³⁺ (U to Cf)
            </text>
          </g>
        </svg>
      </div>

      <div className={styles.readout}>
        <p className={styles.summary} aria-live="polite">
          {current.summary}
        </p>
        <p className={styles.note}>
          Dots mark only the radii NCERT prints. The actinoid top state first passes the lanthanoid one at position {FIRST_AHEAD ?? 'none'}{' '}
          ({FIRST_AHEAD === null ? '' : `${LN_SYMBOLS[FIRST_AHEAD - 1]} and ${AN_SYMBOLS[FIRST_AHEAD - 1]}`}). Filled dots are oxidation states NCERT names: lanthanoids are +3, Ce, Pr, Nd, Tb and Dy also reach +4, and Sm, Eu and Yb also reach +2. Other Table 4.9 Ln²⁺ and Ln⁴⁺ configurations are not drawn. The larger dot is the highest.
        </p>
      </div>
    </div>
  )
}
