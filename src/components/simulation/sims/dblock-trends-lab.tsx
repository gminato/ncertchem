'use client'

import { useState, type ReactNode } from 'react'
import { Segmented, Toggle } from '@/components/controls'
import { PlotFrame, usePlotScale } from '@/components/vocab'
import { SERIES_TONE } from '@/components/vocab/dblock'
import { SERIES_MEMBERS } from '@/lib/chem/dblock-series-data'
import {
  TREND_LABEL,
  TREND_UNIT,
  formatTrendValue,
  pointReading,
  seriesFor,
  shapeNote,
  trendPoints,
  type TrendPoint,
  type TrendProperty,
  type TrendSeries,
} from '@/lib/chem/dblock-trends'
import styles from './dblock-trends-lab.module.css'

const VIEW_W = 560
const VIEW_H = 400
const FRAME = { x: 82, y: 18, width: 456, height: 262 }
const BOTTOM = FRAME.y + FRAME.height
const ALL_SERIES: readonly TrendSeries[] = ['3d', '4d', '5d']
const ALL_POSITIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

/** Subscript at full size, so the glyph keeps the 14 px floor (Sub in ChemSvg shrinks it to 72 %). */
function SubFull({ children }: { children: ReactNode }) {
  return <tspan baselineShift="sub">{children}</tspan>
}

const PROPERTY_OPTIONS: { value: TrendProperty; label: ReactNode }[] = [
  { value: 'melting', label: 'Melting point' },
  { value: 'atomisation', label: <>Δ<span className={styles.sub}>a</span>H</> },
  { value: 'radius', label: 'Metallic radius' },
  { value: 'density', label: 'Density' },
]

const AXIS: Record<TrendProperty, { yMin: number; yMax: number; ticks: number[]; yTitle: ReactNode }> = {
  melting: { yMin: -100, yMax: 3700, ticks: [0, 1000, 2000, 3000], yTitle: 'Melting point / °C' },
  atomisation: { yMin: 0, yMax: 1000, ticks: [0, 200, 400, 600, 800, 1000], yTitle: <>Δ<SubFull>a</SubFull>H / kJ mol⁻¹</> },
  radius: { yMin: 120, yMax: 200, ticks: [120, 140, 160, 180, 200], yTitle: 'Metallic radius / pm' },
  density: { yMin: 5, yMax: 9.5, ticks: [5, 6, 7, 8, 9], yTitle: 'Density / g cm⁻³' },
}

const LEGEND_NOTE: Record<TrendProperty, string> = {
  melting: 'Melting points: PubChem, shown in °C. Each series is one row of ten elements.',
  atomisation: 'Dashed, hollow 4d and 5d points are ≈ values read from NCERT Fig. 4.2. The 3d values are exact (Table 4.2).',
  radius: '3d radii: NCERT Table 4.2. 4d and 5d radii: 12-coordinate metallic radii, so they differ slightly in source.',
  density: 'Density is shown for the 3d series only, from V to Zn (NCERT Table 4.2).',
}

interface Item extends TrendPoint {
  key: string
}

/** One curve through a series' points, drawn in data coordinates by the surrounding PlotFrame. */
function SeriesCurve({ points, tone, dashed }: { points: readonly TrendPoint[]; tone: string; dashed: boolean }) {
  const scale = usePlotScale()
  if (points.length < 2) return null
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${scale.x(p.position).toFixed(1)} ${scale.y(p.value).toFixed(1)}`).join(' ')
  return (
    <path
      d={d}
      fill="none"
      stroke={tone}
      strokeWidth={2.6}
      strokeLinejoin="round"
      strokeLinecap="round"
      strokeDasharray={dashed ? '7 6' : undefined}
    />
  )
}

interface PointLayerProps {
  items: readonly Item[]
  property: TrendProperty
  selectedKey: string | undefined
  inspectedKey: string | undefined
  hoverKey: string | null
  onHover: (key: string | null) => void
  onPick: (key: string) => void
}

/** Markers for every visible point. Hovering previews a value; clicking selects it (the Element menu is the keyboard route). */
function PointLayer({ items, property, selectedKey, inspectedKey, hoverKey, onHover, onPick }: PointLayerProps) {
  const scale = usePlotScale()
  return (
    <>
      {items.map((it) => {
        const cx = scale.x(it.position)
        const cy = scale.y(it.value)
        const tone = SERIES_TONE[it.series]
        const isInspected = it.key === inspectedKey
        const short = formatTrendValue(property, it.value, it.approx).replace(` ${TREND_UNIT[property]}`, '')
        return (
          <g
            key={it.key}
            className={styles.point}
            onPointerEnter={() => onHover(it.key)}
            onPointerLeave={() => onHover(null)}
            onClick={() => onPick(it.key)}
          >
            <circle cx={cx} cy={cy} r={14} fill="transparent" />
            <circle cx={cx} cy={cy} r={6.5} fill={it.approx ? 'var(--surface)' : tone} stroke={tone} strokeWidth={it.approx ? 2.2 : 1.5} />
            {it.key === selectedKey && <circle cx={cx} cy={cy} r={11} fill="none" stroke="var(--fg)" strokeWidth={2} />}
            {it.key === hoverKey && <circle cx={cx} cy={cy} r={11} fill="none" stroke="var(--fg)" strokeWidth={1.4} strokeDasharray="3 3" />}
            {isInspected && (
              <text
                x={cx}
                y={cy - 16}
                textAnchor="middle"
                fontSize={15}
                fill="var(--fg)"
                stroke="var(--surface)"
                strokeWidth={4}
                paintOrder="stroke"
                strokeLinejoin="round"
              >
                {it.symbol} {short}
              </text>
            )}
          </g>
        )
      })}
    </>
  )
}

export function DBlockTrendsLab() {
  const [property, setProperty] = useState<TrendProperty>('melting')
  const [on, setOn] = useState<Record<TrendSeries, boolean>>({ '3d': true, '4d': true, '5d': true })
  const [selectedKey, setSelectedKey] = useState('3d:V')
  const [hoverKey, setHoverKey] = useState<string | null>(null)

  const isDensity = property === 'density'
  const visible = isDensity ? seriesFor('density') : ALL_SERIES.filter((s) => on[s])
  const onCount = ALL_SERIES.filter((s) => on[s]).length
  const items: Item[] = visible.flatMap((s) => trendPoints(property, s).map((p) => ({ ...p, key: `${p.series}:${p.symbol}` })))
  const selected = items.find((i) => i.key === selectedKey) ?? items[0]
  const inspected = items.find((i) => i.key === hoverKey) ?? selected

  const axis = AXIS[property]
  const xMin = isDensity ? 2.5 : 0.5
  const positions = ALL_POSITIONS.filter((p) => p > xMin)
  const xSpan = 10.5 - xMin
  const xPx = (pos: number) => FRAME.x + ((pos - xMin) / xSpan) * FRAME.width

  const shape = shapeNote(property, visible)
  const readingLine = inspected ? `${pointReading(property, inspected)} ${shape}` : shape

  return (
    <div className={styles.sim}>
      <div className={styles.controls}>
        <Segmented label="Property" options={PROPERTY_OPTIONS} value={property} onChange={setProperty} />
        <div className={styles.row}>
          {ALL_SERIES.map((s) => (
            <Toggle
              key={s}
              label={`${s} series`}
              checked={isDensity ? s === '3d' : on[s]}
              disabled={isDensity || (on[s] && onCount === 1)}
              onChange={(checked) => setOn((prev) => ({ ...prev, [s]: checked }))}
            />
          ))}
          <label className={styles.selectLabel}>
            Element
            <select className={styles.select} value={selected?.key ?? ''} onChange={(e) => setSelectedKey(e.target.value)}>
              {visible.map((s) => (
                <optgroup key={s} label={`${s} row`}>
                  {items
                    .filter((i) => i.series === s)
                    .map((i) => (
                      <option key={i.key} value={i.key}>
                        {i.symbol}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className={styles.stage}>
        <svg className={styles.scene} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label={`${TREND_LABEL[property]} across the ${visible.join(', ')} row${visible.length === 1 ? '' : 's'}`}>
          <PlotFrame
            x={FRAME.x}
            y={FRAME.y}
            width={FRAME.width}
            height={FRAME.height}
            domain={{ xMin, xMax: 10.5, yMin: axis.yMin, yMax: axis.yMax }}
            xTicks={positions}
            yTicks={axis.ticks}
            xTickFormat={() => ''}
            yTickFormat={(v) => String(v)}
            yTitle={axis.yTitle}
          >
            {visible.map((s) => (
              <SeriesCurve key={s} points={items.filter((i) => i.series === s)} tone={SERIES_TONE[s]} dashed={s !== '3d' && property === 'atomisation'} />
            ))}
            <PointLayer
              items={items}
              property={property}
              selectedKey={selected?.key}
              inspectedKey={inspected?.key}
              hoverKey={hoverKey}
              onHover={setHoverKey}
              onPick={setSelectedKey}
            />
          </PlotFrame>
          {visible.map((s, row) =>
            positions.map((pos) => (
              <text key={`${s}-${pos}`} x={xPx(pos)} y={BOTTOM + 22 + row * 16} textAnchor="middle" fontSize={14} fill={SERIES_TONE[s]}>
                {SERIES_MEMBERS[s][pos - 1]}
              </text>
            ))
          )}
          <text x={FRAME.x + FRAME.width / 2} y={VIEW_H - 14} textAnchor="middle" fontSize={15} fill="var(--fg)">
            Group 3 to 12 along each row
          </text>
        </svg>
        <div className={styles.legend}>
          {visible.map((s) => (
            <span key={s} className={styles.chip}>
              <i style={{ background: SERIES_TONE[s] }} aria-hidden="true" /> {s}
            </span>
          ))}
          <span className={styles.legendNote}>{LEGEND_NOTE[property]}</span>
        </div>
      </div>

      <div className={styles.readout}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>
            {inspected ? `${inspected.symbol} (${inspected.series}), ${TREND_LABEL[property].toLowerCase()}` : 'No point selected'}
          </span>
          <span className={styles.statValue}>{inspected ? formatTrendValue(property, inspected.value, inspected.approx) : '—'}</span>
        </div>
        <p className={styles.note}>{shape}</p>
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {readingLine}
      </p>
    </div>
  )
}
