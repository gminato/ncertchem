'use client'

import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import gsap from 'gsap'
import { Segmented, Toggle } from '@/components/controls'
import { Label } from '@/components/vocab'
import { PeriodicTable, ScaleLegend, TrendChart, type ScaleLegendProps } from '@/components/periodic'
import type { CellStyle } from '@/components/periodic/PeriodicTable'
import {
  CELL,
  GUTTER_LEFT,
  GUTTER_TOP,
  PITCH,
  colLeft,
  rowTop,
} from '@/components/periodic/layout'
import {
  DIVERGING_NEGATIVE,
  DIVERGING_POSITIVE,
  MISSING_FILL,
  SEQUENTIAL_VIRIDIS,
  divergingRamp,
  divergingScale,
  sequentialScale,
} from '@/components/periodic/colour-scale'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { PERIODIC_TABLE, tablePosition, type ElementRecord } from '@/lib/chem/periodic-data'
import {
  EXPLORER_DIRECTION,
  EXPLORER_DOMAIN,
  EXPLORER_UNIT,
  explorerSeries,
  explorerValue,
  formatExplorerValue,
  PUBCHEM_MARK,
  type ExplorerProperty,
} from '@/lib/chem/trends-explorer'
import {
  PROPERTY_NAME,
  chartPoints,
  dipCallouts,
  emptyMessage,
  readoutFor,
  scopeOf,
  type Selection,
} from './trends-explorer-model'
import styles from './trends-explorer.module.css'

// ---------------------------------------------------------------------------
// Geometry: the table's own coordinate system (see PeriodicTable and layout.ts).
// ---------------------------------------------------------------------------

const GROUPS = Array.from({ length: 18 }, (_, i) => i + 1)
const PERIODS = [1, 2, 3, 4, 5, 6, 7]
/** Rows 1 to 7 of the main table: the outline and the trend arrows stay inside these. */
const MAIN_BOTTOM = GUTTER_TOP + rowTop(7) + CELL

const PROPERTY_OPTIONS: { value: ExplorerProperty; label: string }[] = [
  { value: 'radius', label: 'Atomic radius' },
  { value: 'ionization', label: 'First ionization enthalpy' },
  { value: 'gainEnthalpy', label: 'Electron gain enthalpy' },
  { value: 'electronegativity', label: 'Electronegativity' },
]

const CHART_W = 720
const CHART_H = 300

const scales: Record<ExplorerProperty, (v: number | null) => string | null> = {
  radius: sequentialScale(EXPLORER_DOMAIN.radius, SEQUENTIAL_VIRIDIS),
  ionization: sequentialScale(EXPLORER_DOMAIN.ionization, SEQUENTIAL_VIRIDIS),
  gainEnthalpy: divergingScale(EXPLORER_DOMAIN.gainEnthalpy, 0),
  electronegativity: sequentialScale(EXPLORER_DOMAIN.electronegativity, SEQUENTIAL_VIRIDIS),
}

/** Heatmap cell for one element: colour from the scale, and the value line with its source mark. */
function cellFor(property: ExplorerProperty): (el: ElementRecord) => CellStyle {
  return (el) => {
    const v = explorerValue(el, property)
    if (!v) return { fill: MISSING_FILL, value: '–' }
    const fill = scales[property](v.value) ?? MISSING_FILL
    return { fill, value: formatExplorerValue(v, property) }
  }
}

function legendFor(property: ExplorerProperty): ScaleLegendProps {
  if (property === 'gainEnthalpy') {
    return {
      stops: divergingRamp(DIVERGING_NEGATIVE, DIVERGING_POSITIVE),
      domain: EXPLORER_DOMAIN.gainEnthalpy,
      unit: EXPLORER_UNIT.gainEnthalpy,
      label: PROPERTY_NAME.gainEnthalpy,
      kind: 'diverging',
      midpoint: 0,
    }
  }
  return {
    stops: SEQUENTIAL_VIRIDIS,
    domain: EXPLORER_DOMAIN[property],
    unit: EXPLORER_UNIT[property],
    label: PROPERTY_NAME[property],
    kind: 'sequential',
  }
}

/** Y-axis title for each property's chart, with its unit. */
function yLabelFor(property: ExplorerProperty) {
  switch (property) {
    case 'radius':
      return 'Atomic radius / pm'
    case 'ionization':
      return (
        <>
          <tspan className="sym">ΔᵢH</tspan>
          {' / kJ mol⁻¹'}
        </>
      )
    case 'gainEnthalpy':
      return (
        <>
          <tspan className="sym">Δ</tspan>
          <tspan className="sym" fontSize="0.7em" dy="0.3em">
            eg
          </tspan>
          <tspan className="sym" dy="-0.3em">
            H
          </tspan>
          {' / kJ mol⁻¹'}
        </>
      )
    case 'electronegativity':
      return 'Electronegativity / Pauling'
  }
}

// ---------------------------------------------------------------------------
// Overlay: header hit targets, the selection outline and the trend arrows.
// ---------------------------------------------------------------------------

interface OverlayProps {
  selection: Selection | null
  property: ExplorerProperty
  arrows: boolean
  onPick: (selection: Selection) => void
}

/** Clickable group and period numbers, with an outline on the chosen row or column. */
function Overlay({ selection, property, arrows, onPick }: OverlayProps) {
  const pick = (s: Selection) => {
    // A second press on the same header clears the selection.
    const same = selection && selection.kind === s.kind && selection.n === s.n
    onPick(same ? { kind: s.kind, n: 0 } : s)
  }
  const onKey = (event: KeyboardEvent, s: Selection) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      pick(s)
    }
  }
  const isSelected = (s: Selection) => selection?.kind === s.kind && selection.n === s.n

  const across = EXPLORER_DIRECTION[property].across
  const down = EXPLORER_DIRECTION[property].down
  const arrowY = GUTTER_TOP + rowTop(1) + PITCH / 2 + 10
  const acrossX1 = GUTTER_LEFT + colLeft(3) + 8
  const acrossX2 = GUTTER_LEFT + colLeft(16) + PITCH - 12
  const downX = GUTTER_LEFT + colLeft(3) + PITCH / 2
  const downY1 = GUTTER_TOP + rowTop(2) + PITCH / 2 + 12
  const downY2 = GUTTER_TOP + rowTop(3) + PITCH / 2 + 4

  return (
    <g className={styles.overlay}>
      {GROUPS.map((g) => (
        <g
          key={`gh${g}`}
          role="button"
          tabIndex={0}
          aria-label={`Show the trend down group ${g}`}
          aria-pressed={isSelected({ kind: 'group', n: g })}
          className={styles.hit}
          data-testid="group-header"
          data-group={g}
          onClick={() => pick({ kind: 'group', n: g })}
          onKeyDown={(e) => onKey(e, { kind: 'group', n: g })}
        >
          <rect
            x={GUTTER_LEFT + colLeft(g)}
            y={2}
            width={PITCH}
            height={GUTTER_TOP - 6}
            rx={6}
            className={styles.hitRect}
          />
        </g>
      ))}
      {PERIODS.map((p) => (
        <g
          key={`ph${p}`}
          role="button"
          tabIndex={0}
          aria-label={`Show the trend across period ${p}`}
          aria-pressed={isSelected({ kind: 'period', n: p })}
          className={styles.hit}
          data-testid="period-header"
          data-period={p}
          onClick={() => pick({ kind: 'period', n: p })}
          onKeyDown={(e) => onKey(e, { kind: 'period', n: p })}
        >
          <rect
            x={2}
            y={GUTTER_TOP + rowTop(p)}
            width={GUTTER_LEFT - 6}
            height={CELL}
            rx={6}
            className={styles.hitRect}
          />
        </g>
      ))}

      {selection?.kind === 'group' && selection.n > 0 && (
        <rect
          x={GUTTER_LEFT + colLeft(selection.n) + 1}
          y={GUTTER_TOP + 1}
          width={CELL + 4}
          height={MAIN_BOTTOM - GUTTER_TOP - 2}
          rx={9}
          className={styles.outline}
          data-testid="selection-outline"
        />
      )}
      {selection?.kind === 'period' && selection.n > 0 && (
        <rect
          x={GUTTER_LEFT + 1}
          y={GUTTER_TOP + rowTop(selection.n) + 1}
          width={colLeft(18) + CELL + 4}
          height={CELL + 4}
          rx={9}
          className={styles.outline}
          data-testid="selection-outline"
        />
      )}

      {arrows && (
        <g className={styles.arrows} data-testid="trend-arrows">
          <line x1={acrossX1} x2={acrossX2} y1={arrowY} y2={arrowY} className={styles.arrow} />
          <polygon
            points={`${acrossX2},${arrowY} ${acrossX2 - 12},${arrowY - 6} ${acrossX2 - 12},${arrowY + 6}`}
            className={styles.arrowHead}
          />
          <Label x={(acrossX1 + acrossX2) / 2} y={arrowY - 14} fontSize={15} fill="var(--accent)" halo>
            {`Across a period, ${PROPERTY_NAME[property].toLowerCase()} ${across}`}
          </Label>
          <line x1={downX} x2={downX} y1={downY1} y2={downY2} className={styles.arrow} />
          <polygon
            points={`${downX},${downY2} ${downX - 6},${downY2 - 12} ${downX + 6},${downY2 - 12}`}
            className={styles.arrowHead}
          />
          <Label x={downX + 16} y={(downY1 + downY2) / 2} textAnchor="start" fontSize={15} fill="var(--accent)" halo>
            {`Down a group, ${PROPERTY_NAME[property].toLowerCase()} ${down}`}
          </Label>
        </g>
      )}
    </g>
  )
}

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------

/**
 * TrendsExplorer: the whole periodic table as a heatmap of one property. Pick a period or a
 * group number to see its trend beneath the table, with the ionization dips called out.
 * Trend arrows show the general direction across a period and down a group.
 */
export function TrendsExplorer({ reducedMotion }: SimulationProps) {
  const [property, setProperty] = useState<ExplorerProperty>('ionization')
  const [selection, setSelection] = useState<Selection | null>({ kind: 'period', n: 2 })
  const [arrows, setArrows] = useState(false)
  const [draw, setDraw] = useState(0)

  // Selection cleared by a second press is stored as n = 0, which means "none".
  const active = selection && selection.n > 0 ? selection : null
  const scope = scopeOf(active)

  const series = useMemo(
    () => (scope ? explorerSeries(property, scope) : []),
    // `scope` is rebuilt each render, so key on the selection itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [property, active?.kind, active?.n]
  )

  // The chart draws in whenever its row, column or property changes.
  useEffect(() => {
    if (reducedMotion) {
      const settle = gsap.delayedCall(0, () => setDraw(1))
      return () => {
        settle.kill()
      }
    }
    const proxy = { v: 0 }
    const tween = gsap.to(proxy, {
      v: 1,
      duration: 0.9,
      ease: 'power2.out',
      onUpdate: () => setDraw(proxy.v),
    })
    return () => {
      tween.kill()
    }
  }, [property, active?.kind, active?.n, reducedMotion])

  const cell = useMemo(() => cellFor(property), [property])
  const message = active ? emptyMessage(property, active, series) : null
  const callouts = active ? dipCallouts(property, active, series) : []
  const points = active ? chartPoints(series, active) : []
  const summary = readoutFor(property, active, series)

  return (
    <div className={styles.root} data-testid="trends-explorer" data-property={property}>
      <SimulationControls>
        <Segmented
          label="Property"
          options={PROPERTY_OPTIONS}
          value={property}
          onChange={setProperty}
        />
        <Toggle label="Trend arrows" checked={arrows} onChange={setArrows} />
      </SimulationControls>

      <PeriodicTable
        elements={PERIODIC_TABLE}
        position={tablePosition}
        cell={cell}
        variant="compact"
        showGroupNumbers
        showPeriodNumbers
        categoryShading={false}
        title={`Periodic table coloured by ${PROPERTY_NAME[property].toLowerCase()}`}
        className={styles.table}
        layer={
          <Overlay
            selection={active}
            property={property}
            arrows={arrows}
            onPick={(s) => setSelection(s.n === 0 ? null : s)}
          />
        }
      />

      <ScaleLegend {...legendFor(property)} className={styles.legend} />

      <div className={styles.chartWrap} data-testid="trend-chart">
        {!active && <p className={styles.prompt}>Pick a period number or a group number on the table to see its trend here.</p>}
        {active && message && <p className={styles.prompt}>{message}</p>}
        {active && !message && (
          <div style={{ opacity: draw, width: '100%' }}>
            <TrendChart
              points={points}
              xLabel={active.kind === 'period' ? `Element across period ${active.n}` : `Period (group ${active.n}, top to bottom)`}
              yLabel={yLabelFor(property)}
              yDomain={undefined}
              progress={draw}
              highlight={callouts}
              width={CHART_W}
              height={CHART_H}
              title={`${PROPERTY_NAME[property]} along ${active.kind} ${active.n}`}
              className={styles.chart}
            />
          </div>
        )}
      </div>

      <p className={styles.summary} aria-live="polite">
        {summary}
      </p>
      <p className={styles.source}>
        Values with no mark are NCERT&rsquo;s printed values. Values marked {PUBCHEM_MARK} are from PubChem
        (Data: PubChem), where NCERT prints none. Atomic radii are NCERT Table 3.6 only, so blank cells are not printed.
      </p>
    </div>
  )
}
