'use client'

import type { ReactElement } from 'react'
import { OrbitalBox, PlotFrame } from '@/components/vocab'
import { SERIES_TONE, fillSubshell } from '@/components/vocab/dblock'
import { makePlotScale, type Box, type Domain, type PlotScale } from '@/components/vocab/kinetics/geometry'
import { FIG_4_2_READING_UNCERTAINTY_KJ, SERIES_MEMBERS } from '@/lib/chem/dblock-series-data'
import {
  HF_RADIUS_PM,
  TI_RADIUS_PM,
  ZR_RADIUS_PM,
  atomisation3d,
  atomisationApprox,
  density3dVtoZn,
  m3PlusRadius3d,
  meltingPointsC,
  metallicRadius3d,
  physicalViewForStep,
  pointFor,
  unpaired3d,
  type PhysicalView,
  type TrendPoint,
} from './physical-steps'

export interface PhysicalTrendsProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

const W = 580
const H = 440
/** The data window of every trend plot: x = position in the row, labels sit in the right margin. */
const BOX: Box = { left: 66, top: 44, width: 400, height: 276 }
const BOTTOM = BOX.top + BOX.height
const LABEL_X = 478

const ALL_POSITIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const groupTick = (v: number) => String(Math.round(v) + 2)
const TONE_3D = SERIES_TONE['3d']
const TONE_4D = SERIES_TONE['4d']
const TONE_5D = SERIES_TONE['5d']

/** Scale for the x positions of the row (only x is used, by the symbol rows under the ticks). */
const ROW_X = makePlotScale({ xMin: 0.5, xMax: 10.5, yMin: 0, yMax: 1 }, BOX)
/** Element symbols under each group tick, one line per series, in the series tone. */
const SYMBOL_ROWS: readonly { tone: string; symbols: readonly string[] }[] = [
  { tone: TONE_3D, symbols: SERIES_MEMBERS['3d'] },
  { tone: TONE_4D, symbols: SERIES_MEMBERS['4d'] },
  { tone: TONE_5D, symbols: SERIES_MEMBERS['5d'] },
]

const ARIA: Record<PhysicalView, string> = {
  melting: 'Melting points of the 3d, 4d and 5d series across groups 3 to 12, each series in its own tone',
  configs: 'Ten 3d configuration rows from Sc to Zn with the number of unpaired electrons under each',
  enthalpy: 'Enthalpies of atomisation of the 3d series (Table 4.2) with approximate 4d and 5d curves',
  radii3d: 'Metallic radii and M³⁺ radii of the 3d series, falling across the row',
  sizes: 'Circles to scale for Ti, Zr and Hf: Zr and Hf almost the same size',
  density: 'Densities of V to Zn, rising to Ni and Cu and falling at Zn',
}

/** A value as label text: whole numbers with a true minus sign, "≈" when approximate. */
function valueText(p: TrendPoint, approx = false): string {
  const digits = String(Math.round(p.y)).replace('-', '−')
  return `${p.symbol} ${approx ? '≈' : ''}${digits}`
}

/** Stacks labels so none overlap; keeps each label within `gap` of the one above it. */
function stackLabels(ys: readonly number[], gap: number): number[] {
  const order = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y)
  const out: number[] = ys.map(() => 0)
  let prev = -Infinity
  for (const { y, i } of order) {
    const placed = Math.max(y, prev + gap)
    out[i] = placed
    prev = placed
  }
  return out
}

interface EdgeItem {
  key: string
  pointY: number
  text: string
}

/** A right-margin label for one point. */
function edgeItem(p: TrendPoint, scale: PlotScale, approx = false): EdgeItem {
  return { key: p.symbol, pointY: scale.y(p.y), text: valueText(p, approx) }
}

/** Labels in the right margin, joined to their points by thin leaders. */
function EdgeLabels({ items, pointX }: { items: readonly EdgeItem[]; pointX: number }) {
  const labelY = stackLabels(
    items.map((it) => it.pointY),
    18
  )
  return (
    <g>
      {items.map((it, i) => (
        <g key={it.key}>
          <line x1={pointX + 6} y1={it.pointY} x2={LABEL_X - 5} y2={labelY[i]} stroke="var(--fg-muted)" strokeWidth={1} />
          <text x={LABEL_X} y={labelY[i]} dominantBaseline="middle" fontSize={14} fill="var(--fg)">
            {it.text}
          </text>
        </g>
      ))}
    </g>
  )
}

function Trend({
  pts,
  scale,
  tone,
  dashed = false,
  hollow = false,
}: {
  pts: readonly TrendPoint[]
  scale: PlotScale
  tone: string
  dashed?: boolean
  hollow?: boolean
}) {
  const line = pts.map((p) => `${scale.x(p.x)},${scale.y(p.y)}`).join(' ')
  return (
    <g>
      <polyline points={line} fill="none" stroke={tone} strokeWidth={2.4} strokeDasharray={dashed ? '7 5' : undefined} />
      {pts.map((p) => (
        <circle
          key={p.symbol}
          cx={scale.x(p.x)}
          cy={scale.y(p.y)}
          r={4.6}
          fill={hollow ? 'var(--surface)' : tone}
          stroke={tone}
          strokeWidth={2}
        />
      ))}
    </g>
  )
}

function Legend({ items }: { items: readonly { label: string; tone: string; dashed?: boolean; hollow?: boolean }[] }) {
  return (
    <g>
      {items.map((it, i) => {
        const x = BOX.left + i * 150
        return (
          <g key={it.label}>
            <line x1={x} y1={22} x2={x + 26} y2={22} stroke={it.tone} strokeWidth={2.4} strokeDasharray={it.dashed ? '7 5' : undefined} />
            <circle cx={x + 13} cy={22} r={4.6} fill={it.hollow ? 'var(--surface)' : it.tone} stroke={it.tone} strokeWidth={2} />
            <text x={x + 34} y={22} dominantBaseline="middle" fontSize={14} fill="var(--fg)">
              {it.label}
            </text>
          </g>
        )
      })}
    </g>
  )
}

/** Element symbols under the group ticks, one line per series, in the series tone. */
function SymbolRows() {
  return (
    <g>
      {SYMBOL_ROWS.map((row, r) =>
        row.symbols.map((symbol, i) => (
          <text
            key={`${r}-${symbol}`}
            x={ROW_X.x(i + 1)}
            y={BOTTOM + 38 + 16 * r}
            textAnchor="middle"
            fontSize={14}
            fill={row.tone}
          >
            {symbol}
          </text>
        ))
      )}
    </g>
  )
}

/** Axis title placed below the symbol rows (PlotFrame's own title would sit on them). */
function RowAxisTitle({ text }: { text: string }) {
  return (
    <text x={BOX.left + BOX.width / 2} y={BOTTOM + 88} textAnchor="middle" fontSize={15} fill="var(--fg)">
      {text}
    </text>
  )
}

/** Solid faint gridlines at the given values (PlotFrame's grid is off where a dashed guide replaces one). */
function Gridlines({ scale, xs, ys }: { scale: PlotScale; xs: readonly number[]; ys: readonly number[] }) {
  return (
    <g>
      {xs.map((v) => (
        <line key={`gx${v}`} x1={scale.x(v)} x2={scale.x(v)} y1={BOX.top} y2={BOTTOM} stroke="var(--kin-grid)" strokeWidth={1} />
      ))}
      {ys.map((v) => (
        <line key={`gy${v}`} x1={BOX.left} x2={BOX.left + BOX.width} y1={scale.y(v)} y2={scale.y(v)} stroke="var(--kin-grid)" strokeWidth={1} />
      ))}
    </g>
  )
}

function MeltingView() {
  const domain: Domain = { xMin: 0.5, xMax: 10.5, yMin: -100, yMax: 3900 }
  const scale = makePlotScale(domain, BOX)
  const pts3 = meltingPointsC('3d')
  const pts4 = meltingPointsC('4d')
  const pts5 = meltingPointsC('5d')
  const peaks = [pointFor(pts3, 'V'), pointFor(pts4, 'Mo'), pointFor(pts5, 'W')]
  const lows = [pointFor(pts3, 'Zn'), pointFor(pts4, 'Cd'), pointFor(pts5, 'Hg')]
  const series = [
    { key: '3d', tone: TONE_3D, pts: pts3 },
    { key: '4d', tone: TONE_4D, pts: pts4 },
    { key: '5d', tone: TONE_5D, pts: pts5 },
  ] as const
  return (
    <g>
      <Legend items={[{ label: '3d', tone: TONE_3D }, { label: '4d', tone: TONE_4D }, { label: '5d', tone: TONE_5D }]} />
      <PlotFrame
        x={BOX.left}
        y={BOX.top}
        width={BOX.width}
        height={BOX.height}
        domain={domain}
        grid={false}
        xTicks={ALL_POSITIONS}
        yTicks={[0, 1000, 2000, 3000]}
        xTickFormat={groupTick}
        yTitle="melting point / °C"
      >
        <Gridlines scale={scale} xs={ALL_POSITIONS} ys={[1000, 2000, 3000]} />
        {/* 0 °C as a faint dashed guide; the x-axis itself sits at the bottom of the window (−100 °C) */}
        <line
          x1={BOX.left}
          x2={BOX.left + BOX.width}
          y1={scale.y(0)}
          y2={scale.y(0)}
          stroke="var(--kin-axis)"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
        {series.map((s) => (
          <Trend key={s.key} pts={s.pts} scale={scale} tone={s.tone} />
        ))}
        {peaks.map((p) => (
          <text key={p.symbol} x={scale.x(p.x)} y={scale.y(p.y) - 12} textAnchor="middle" fontSize={14} fill="var(--fg)">
            {valueText(p)}
          </text>
        ))}
      </PlotFrame>
      <SymbolRows />
      <RowAxisTitle text="group, 3 to 12" />
      <EdgeLabels items={lows.map((p) => edgeItem(p, scale))} pointX={scale.x(10)} />
    </g>
  )
}

function ConfigsView() {
  const cells = unpaired3d()
  return (
    <g>
      {cells.map((r, i) => {
        const col = i % 4
        const rowIndex = Math.floor(i / 4)
        const cellX = col * 145
        const topY = 40 + rowIndex * 120
        const rowTop = topY + 12
        return (
          <g key={r.symbol}>
            <text x={cellX + 72} y={topY} textAnchor="middle" fontSize={18} fill="var(--fg)">
              {r.symbol}
            </text>
            <OrbitalBox orbitals={fillSubshell(r.dCount, 5)} x={cellX + 19} y={rowTop} size={18} gap={4} fontSize={14} />
            <text x={cellX + 72} y={rowTop + 18 + 26} textAnchor="middle" fontSize={14} fill="var(--fg)">
              {`${r.unpaired} unpaired`}
            </text>
          </g>
        )
      })}
      <text x={W / 2} y={H - 14} textAnchor="middle" fontSize={14} fill="var(--fg-muted)">
        3d set only (4s not drawn). Hund: fill singly, then pair.
      </text>
    </g>
  )
}

function EnthalpyView() {
  const domain: Domain = { xMin: 0.5, xMax: 10.5, yMin: 0, yMax: 950 }
  const scale = makePlotScale(domain, BOX)
  const solid = atomisation3d()
  const d4 = atomisationApprox('4d')
  const d5 = atomisationApprox('5d')
  const v = pointFor(solid, 'V')
  const mn = pointFor(solid, 'Mn')
  const zn = pointFor(solid, 'Zn')
  const nb = pointFor(d4, 'Nb')
  const cd = pointFor(d4, 'Cd')
  const w = pointFor(d5, 'W')
  const hg = pointFor(d5, 'Hg')
  return (
    <g>
      <Legend
        items={[
          { label: '3d', tone: TONE_3D },
          { label: '4d ≈', tone: TONE_4D, dashed: true },
          { label: '5d ≈', tone: TONE_5D, dashed: true },
        ]}
      />
      <PlotFrame
        x={BOX.left}
        y={BOX.top}
        width={BOX.width}
        height={BOX.height}
        domain={domain}
        xTicks={ALL_POSITIONS}
        yTicks={[0, 200, 400, 600, 800]}
        xTickFormat={groupTick}
        yTitle="ΔaH / kJ mol⁻¹"
      >
        <Trend pts={solid} scale={scale} tone={TONE_3D} />
        <Trend pts={d4} scale={scale} tone={TONE_4D} dashed />
        <Trend pts={d5} scale={scale} tone={TONE_5D} dashed />
        <text x={scale.x(v.x)} y={scale.y(v.y) - 12} textAnchor="middle" fontSize={14} fill="var(--fg)">
          {valueText(v)}
        </text>
        <text x={scale.x(mn.x)} y={scale.y(mn.y) + 22} textAnchor="middle" fontSize={14} fill="var(--fg)">
          {valueText(mn)}
        </text>
        <text x={scale.x(nb.x) + 8} y={scale.y(nb.y) - 6} fontSize={14} fill="var(--fg)">
          {valueText(nb, true)}
        </text>
        <text x={scale.x(w.x) - 8} y={scale.y(w.y) - 6} textAnchor="end" fontSize={14} fill="var(--fg)">
          {valueText(w, true)}
        </text>
      </PlotFrame>
      <SymbolRows />
      <RowAxisTitle text="group, 3 to 12" />
      <EdgeLabels items={[edgeItem(zn, scale), edgeItem(cd, scale, true), edgeItem(hg, scale, true)]} pointX={scale.x(10)} />
      <text x={W / 2} y={H - 14} textAnchor="middle" fontSize={14} fill="var(--fg-muted)">
        {`≈ 4d and 5d values are read off NCERT Fig. 4.2 (±${FIG_4_2_READING_UNCERTAINTY_KJ} kJ mol⁻¹).`}
      </text>
    </g>
  )
}

function RadiiView() {
  const domain: Domain = { xMin: 0.5, xMax: 10.5, yMin: 50, yMax: 180 }
  const scale = makePlotScale(domain, BOX)
  const metal = metallicRadius3d()
  const m3 = m3PlusRadius3d()
  const sc = pointFor(metal, 'Sc')
  const sc3 = pointFor(m3, 'Sc')
  const co = pointFor(metal, 'Co')
  const mn3 = pointFor(m3, 'Mn')
  const zn = pointFor(metal, 'Zn')
  return (
    <g>
      <Legend items={[{ label: 'metal atom', tone: TONE_3D }, { label: 'M³⁺ ion', tone: TONE_3D, dashed: true, hollow: true }]} />
      <PlotFrame
        x={BOX.left}
        y={BOX.top}
        width={BOX.width}
        height={BOX.height}
        domain={domain}
        xTicks={ALL_POSITIONS}
        yTicks={[60, 100, 140, 180]}
        xTickFormat={groupTick}
        xTitle="group, 3 to 12"
        yTitle="radius / pm"
      >
        <Trend pts={metal} scale={scale} tone={TONE_3D} />
        <Trend pts={m3} scale={scale} tone={TONE_3D} dashed hollow />
        <text x={scale.x(sc.x) + 6} y={scale.y(sc.y) - 12} fontSize={14} fill="var(--fg)">
          {`Sc ${sc.y}`}
        </text>
        <text x={scale.x(sc3.x) + 6} y={scale.y(sc3.y) - 12} fontSize={14} fill="var(--fg)">
          {`Sc³⁺ ${sc3.y}`}
        </text>
        {/* Co and Ni share the same metallic radius in Table 4.2 */}
        <text x={scale.x(7.5)} y={scale.y(co.y) - 12} textAnchor="middle" fontSize={14} fill="var(--fg)">
          {`Co, Ni ${co.y}`}
        </text>
        {/* Mn and Fe share the same M³⁺ radius in Table 4.2 */}
        <text x={scale.x(5.5)} y={scale.y(mn3.y) + 22} textAnchor="middle" fontSize={14} fill="var(--fg)">
          {`Mn, Fe ${mn3.y}`}
        </text>
      </PlotFrame>
      <EdgeLabels items={[edgeItem(zn, scale)]} pointX={scale.x(10)} />
    </g>
  )
}

function SizesView() {
  const SCALE = 0.55
  const atoms = [
    { sym: 'Ti', pm: TI_RADIUS_PM, cx: 110, tone: TONE_3D },
    { sym: 'Zr', pm: ZR_RADIUS_PM, cx: 290, tone: TONE_4D },
    { sym: 'Hf', pm: HF_RADIUS_PM, cx: 470, tone: TONE_5D },
  ]
  const CY = 214
  return (
    <g>
      {atoms.map((a) => {
        const r = SCALE * a.pm
        return (
          <g key={a.sym}>
            <circle cx={a.cx} cy={CY} r={r} fill={a.tone} fillOpacity={0.35} stroke={a.tone} strokeWidth={2.4} />
            <text x={a.cx} y={CY + r + 26} textAnchor="middle" fontSize={15} fill="var(--fg)">
              {`${a.sym} ${a.pm} pm`}
            </text>
          </g>
        )
      })}
      <path d="M120 108 L278 108" stroke="var(--fg-muted)" strokeWidth={1.6} fill="none" />
      <path d="M284 108 L274 103 L274 113 Z" fill="var(--fg-muted)" />
      <text x={200} y={94} textAnchor="middle" fontSize={14} fill="var(--fg)">
        4d is larger than 3d
      </text>
      <path d="M290 76 V66 H470 V76" stroke="var(--fg-muted)" strokeWidth={1.4} fill="none" />
      <text x={380} y={52} textAnchor="middle" fontSize={14} fill="var(--fg)">
        Zr and Hf: lanthanoid contraction
      </text>
      <text x={W / 2} y={H - 14} textAnchor="middle" fontSize={14} fill="var(--fg-muted)">
        Circles drawn to scale: diameter follows the metallic radius.
      </text>
    </g>
  )
}

function DensityView() {
  const symbols: readonly string[] = SERIES_MEMBERS['3d']
  const domain: Domain = { xMin: 0.5, xMax: 8.5, yMin: 0, yMax: 11.5 }
  const scale = makePlotScale(domain, BOX)
  const bars = density3dVtoZn()
  const ni = pointFor(bars, 'Ni')
  const symbolTick = (v: number) => symbols[Math.round(v) + 1] ?? ''
  return (
    <g>
      <PlotFrame
        x={BOX.left}
        y={BOX.top}
        width={BOX.width}
        height={BOX.height}
        domain={domain}
        xTicks={[1, 2, 3, 4, 5, 6, 7, 8]}
        yTicks={[0, 2, 4, 6, 8, 10]}
        xTickFormat={symbolTick}
        xTitle="element"
        yTitle="density / g cm⁻³"
      >
        {bars.map((b) => (
          <g key={b.symbol}>
            <rect
              x={scale.x(b.x - 0.32)}
              y={scale.y(b.y)}
              width={scale.x(b.x + 0.32) - scale.x(b.x - 0.32)}
              height={scale.y(0) - scale.y(b.y)}
              fill={TONE_3D}
              fillOpacity={0.85}
            />
            <text x={scale.x(b.x)} y={scale.y(b.y) - 8} textAnchor="middle" fontSize={14} fill="var(--fg)">
              {String(b.y)}
            </text>
          </g>
        ))}
        <text x={scale.x(6.2)} y={scale.y(10.9)} textAnchor="middle" fontSize={14} fill="var(--fg)">
          {`Ni and Cu tie at ${ni.y}; Zn falls back`}
        </text>
      </PlotFrame>
    </g>
  )
}

const VIEW_COMPONENTS: Record<PhysicalView, () => ReactElement> = {
  melting: MeltingView,
  configs: ConfigsView,
  enthalpy: EnthalpyView,
  radii3d: RadiiView,
  sizes: SizesView,
  density: DensityView,
}

/** One drawing for the whole Scrolly: the view changes with the Step (instant cut; no tween). */
export function PhysicalTrends({ step }: PhysicalTrendsProps) {
  const view = physicalViewForStep(step)
  const View = VIEW_COMPONENTS[view]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={ARIA[view]}>
      <View />
    </svg>
  )
}
