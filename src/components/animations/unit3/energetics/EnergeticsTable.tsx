'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { PeriodicTable, ScaleLegend, type ScaleLegendProps } from '@/components/periodic'
import type { CellStyle } from '@/components/periodic/PeriodicTable'
import {
  DIVERGING_NEGATIVE,
  DIVERGING_POSITIVE,
  MISSING_FILL,
  SEQUENTIAL_VIRIDIS,
  divergingRamp,
  divergingScale,
  sequentialScale,
} from '@/components/periodic/colour-scale'
import { cellRevealOrder } from '@/components/periodic/layout'
import { PERIODIC_TABLE, elementBySymbol, tablePosition, type ElementRecord } from '@/lib/chem/periodic-data'
import {
  EXPLORER_DOMAIN,
  EXPLORER_UNIT,
  explorerValue,
  formatExplorerValue,
} from '@/lib/chem/trends-explorer'
import {
  HALOGEN_Z,
  TABLE_START,
  clampTableStep,
  tableStepDescription,
  tableTargetForStep,
  type TableSnapshot,
} from './table-steps'
import styles from './energetics.module.css'

export interface EnergeticsTableProps {
  step: number
  reducedMotion: boolean
}

const gainFill = divergingScale(EXPLORER_DOMAIN.gainEnthalpy, 0)
const electronegativityFill = sequentialScale(EXPLORER_DOMAIN.electronegativity, SEQUENTIAL_VIRIDIS)

/** Reveal order by group, so the colour sweeps across the table from the left. */
const REVEAL_ORDER = cellRevealOrder(PERIODIC_TABLE, 'group')

function revealed(Z: number, reveal: number): boolean {
  const order = REVEAL_ORDER.get(Z) ?? 0
  return order < reveal * PERIODIC_TABLE.length
}

/** Fill for one cell under the current view. Unrevealed cells are dimmed, not filled. */
function cellStyleFor(el: ElementRecord, snapshot: TableSnapshot): CellStyle {
  const isOn = revealed(el.Z, snapshot.reveal)
  const dim = !isOn || (snapshot.halogensOnly && !HALOGEN_Z.includes(el.Z as (typeof HALOGEN_Z)[number]))
  if (snapshot.view === 'category') return { dim }
  const property = snapshot.view === 'gainEnthalpy' ? 'gainEnthalpy' : 'electronegativity'
  const v = explorerValue(el, property)
  const fill = v === null
    ? MISSING_FILL
    : snapshot.view === 'gainEnthalpy'
      ? (gainFill(v.value) ?? MISSING_FILL)
      : (electronegativityFill(v.value) ?? MISSING_FILL)
  return { fill: isOn ? fill : undefined, dim }
}

/** The readout line under the table, from the same values the heatmap uses. */
function caption(step: number): string {
  const gain = (symbol: string) => {
    const el = elementBySymbol(symbol)
    const v = el ? explorerValue(el, 'gainEnthalpy') : null
    return v ? `${symbol} ${formatExplorerValue(v, 'gainEnthalpy')}` : symbol
  }
  switch (clampTableStep(step)) {
    case 0:
      return 'Electron gain enthalpy, kJ mol⁻¹. Teal cells release energy; orange cells need it. The noble gases are orange.'
    case 1:
      return `Halogens: ${['F', 'Cl', 'Br', 'I'].map(gain).join(', ')}. Chlorine is the most negative.`
    case 2:
      return 'Pauling electronegativity. Fluorine has the highest value, 4.0, and the values fall towards the lower left.'
    default:
      return 'Metals fill the left and the bottom of the table. Non-metals sit at the upper right, and metalloids lie on the boundary.'
  }
}

/**
 * EnergeticsTable: the whole periodic table lights up group by group, first with electron
 * gain enthalpy, then with electronegativity, and last with metal and non-metal shading.
 * The halogens are picked out in Step 1.
 */
export function EnergeticsTable({ step, reducedMotion }: EnergeticsTableProps) {
  const activeStep = clampTableStep(step)

  // The live snapshot lives in a ref, so the tween can mutate it between renders.
  const stateRef = useRef<TableSnapshot>({ ...TABLE_START })
  const [view, setView] = useState<TableSnapshot>(TABLE_START)
  const render = () => setView({ ...stateRef.current })

  useEffect(() => {
    const state = stateRef.current
    const target = tableTargetForStep(activeStep)
    if (reducedMotion) {
      Object.assign(state, target)
      const redraw = gsap.delayedCall(0, render)
      return () => {
        redraw.kill()
      }
    }
    if (state.view !== target.view) {
      // A new property sweeps in from nothing, so reset the reveal before the tween.
      state.view = target.view
      state.reveal = 0
    }
    state.halogensOnly = target.halogensOnly
    const tl = gsap.timeline({ onUpdate: render })
    tl.to(state, { reveal: target.reveal, duration: 1.6, ease: 'none' }, 0)
    return () => {
      tl.kill()
    }
    // `render` is stable for the component lifetime.
  }, [activeStep, reducedMotion])

  const cell = useMemo(() => (el: ElementRecord) => cellStyleFor(el, view), [view])
  const highlight = view.halogensOnly ? [...HALOGEN_Z] : undefined
  const legend: ScaleLegendProps | null = view.view === 'gainEnthalpy'
    ? {
        stops: divergingRamp(DIVERGING_NEGATIVE, DIVERGING_POSITIVE),
        domain: EXPLORER_DOMAIN.gainEnthalpy,
        unit: EXPLORER_UNIT.gainEnthalpy,
        label: 'Electron gain enthalpy',
        kind: 'diverging',
        midpoint: 0,
      }
    : view.view === 'electronegativity'
      ? {
          stops: SEQUENTIAL_VIRIDIS,
          domain: EXPLORER_DOMAIN.electronegativity,
          unit: EXPLORER_UNIT.electronegativity,
          label: 'Electronegativity',
          kind: 'sequential',
        }
      : null

  return (
    <div className={styles.tableStage} data-testid="energetics-table" data-view={view.view} data-step={activeStep}>
      <PeriodicTable
        elements={PERIODIC_TABLE}
        position={tablePosition}
        cell={cell}
        highlight={highlight}
        variant="compact"
        categoryShading={view.view === 'category'}
        title="Periodic table, coloured by the property of the Step"
        className={styles.tableSvg}
      />
      {legend && <ScaleLegend {...legend} className={styles.legend} />}
      <p className={styles.caption}>{caption(activeStep)}</p>
      <p className={styles.srOnly} aria-live="polite">
        {tableStepDescription(activeStep)}
      </p>
    </div>
  )
}

