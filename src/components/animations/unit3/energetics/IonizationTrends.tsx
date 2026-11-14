'use client'

import { useEffect, useMemo, useState } from 'react'
import gsap from 'gsap'
import { Label, OrbitalBox, VocabDefs, type OrbitalSpin } from '@/components/vocab'
import { TrendChart } from '@/components/periodic'
import type { TrendHighlight } from '@/components/periodic/TrendChart'
import type { TrendPoint } from '@/components/periodic/trend'
import { elementByZ, ionizationAnomalies } from '@/lib/chem/periodic-data'
import { electronConfiguration, orbitalDiagram } from '@/lib/chem/quantum'
import { explorerSeries, formatExplorerValue, type ExplorerPoint } from '@/lib/chem/trends-explorer'
import {
  IONIZATION_START,
  clampIonizationStep,
  ionizationPairForStep,
  ionizationStepDescription,
  ionizationTargetForStep,
  type IonizationPair,
  type IonizationSnapshot,
} from './ionization-steps'
import styles from './energetics.module.css'

export interface IonizationTrendsProps {
  step: number
  reducedMotion: boolean
}

// ---------------------------------------------------------------------------
// Geometry. The panel is about 570 px wide, so 16-unit labels render at 14 px or more.
// ---------------------------------------------------------------------------

const PANEL_W = 640
const PANEL_H = 540
const CHART_W = 560
const PERIOD_CHART_H = 250
const GROUP_CHART_H = 540
const BOX = 44
const BOX_GAP = 10
const LABEL_W = 30
const COLUMN_CENTRE = { left: 160, right: 480 }
const ROW_Y: Record<'1s' | '2s' | '2p', number> = { '1s': 236, '2s': 306, '2p': 376 }
const ROW_LABEL_FONT = 16
const CAPTION_FONT = 15

/** Y range for the period charts, in kJ mol⁻¹, and for the group 1 chart. */
const PERIOD_Y: [number, number] = [400, 2200]
const GROUP_Y: [number, number] = [350, 600]

/** Orbital diagrams are drawn for these atomic numbers. Their order is left, right. */
const PAIR_ATOMS: Record<Exclude<IonizationPair, 'none'>, [number, number]> = {
  BeB: [4, 5],
  NO: [7, 8],
}

/** Which row and box to pick out in each diagram: the electron that is removed, or the paired one. */
const PAIR_HIGHLIGHT: Record<Exclude<IonizationPair, 'none'>, [Partial<Record<'1s' | '2s' | '2p', number[]>>, Partial<Record<'1s' | '2s' | '2p', number[]>>]> = {
  BeB: [{ '2s': [0] }, { '2p': [0] }],
  NO: [{}, { '2p': [0] }],
}

const PAIR_CAPTION: Record<Exclude<IonizationPair, 'none'>, [string, string]> = {
  BeB: [
    'Beryllium loses a 2s electron. Boron loses a 2p electron.',
    'The 2p electron penetrates less, so the inner core screens it more.',
  ],
  NO: [
    'Nitrogen’s three 2p electrons each take their own orbital.',
    'Oxygen’s fourth 2p electron must pair up, and the repulsion makes it easier to remove.',
  ],
}

/** Labels for the anomaly callouts, from the reason stored in the periodicity model. */
function calloutText(symbol: string, period: number, reason: 'p-electron-shielded' | 'paired-electron-repulsion'): string {
  return reason === 'p-electron-shielded' ? `${symbol}: ${period}p shielded` : `${symbol}: paired ${period}p`
}

/** TrendChart points for a row series, with x as the position along the row. */
function periodPoints(series: readonly ExplorerPoint[]): TrendPoint[] {
  return series.map((p) => ({ x: p.index, y: p.value ? p.value.value : null, label: p.symbol }))
}

/** Dips called out on a period chart: the element after each dip, with its reason. */
function dipHighlights(period: number, series: readonly ExplorerPoint[]): TrendHighlight[] {
  return ionizationAnomalies(period).flatMap((a) => {
    const index = series.findIndex((p) => p.Z === a.to)
    if (index < 0) return []
    return [{ index, text: calloutText(series[index].symbol, period, a.reason) }]
  })
}

/** Spin arrays for one row of an orbital diagram, from the ground-state configuration. */
function rowOrbitals(Z: number, label: '1s' | '2s' | '2p'): OrbitalSpin[] {
  const subshell = orbitalDiagram(Z).find((s) => s.label === label)
  return subshell ? subshell.orbitals.map((cell) => ({ up: cell.up, down: cell.down })) : []
}

function atomHeader(Z: number): { name: string; symbol: string; configuration: string } {
  const el = elementByZ(Z)
  return {
    name: el.ncertName ?? el.name,
    symbol: el.symbol,
    configuration: electronConfiguration(Z).text,
  }
}

function OrbitalColumn({
  Z,
  centreX,
  highlight,
}: {
  Z: number
  centreX: number
  highlight: Partial<Record<'1s' | '2s' | '2p', number[]>>
}) {
  const header = atomHeader(Z)
  const rowWidth = LABEL_W + 3 * BOX + 2 * BOX_GAP
  const x0 = centreX - rowWidth / 2
  const rows: ('1s' | '2s' | '2p')[] = ['1s', '2s', '2p']
  return (
    <g data-testid="orbital-column" data-z={Z}>
      <Label x={centreX} y={160} fontSize={20} fill="var(--fg)">
        {`${header.name} (${header.symbol}), `}
        <tspan className="sym">Z</tspan>
        {` = ${Z}`}
      </Label>
      <Label x={centreX} y={190} fontSize={15} fill="var(--fg-muted)">
        {header.configuration}
      </Label>
      {rows.map((row) => {
        const orbitals = rowOrbitals(Z, row)
        return (
          <OrbitalBox
            key={row}
            orbitals={orbitals}
            label={row}
            x={x0}
            y={ROW_Y[row] - BOX / 2}
            size={BOX}
            gap={BOX_GAP}
            fontSize={ROW_LABEL_FONT}
            highlight={highlight[row] ?? []}
          />
        )
      })}
    </g>
  )
}

/**
 * IonizationTrends: the period 2 and period 3 first ionization enthalpies draw in with
 * their dips called out, then the Be and B pair and the N and O pair are shown as orbital
 * diagrams, and last the group 1 line falls down the group.
 */
export function IonizationTrends({ step, reducedMotion }: IonizationTrendsProps) {
  const activeStep = clampIonizationStep(step)
  const pair = ionizationPairForStep(activeStep)

  const [state] = useState<IonizationSnapshot>(() => ({ ...IONIZATION_START }))
  const [view, setView] = useState<IonizationSnapshot>(() => ({ ...state }))
  const render = () => setView({ ...state })

  useEffect(() => {
    const target = ionizationTargetForStep(activeStep)
    if (reducedMotion) {
      Object.assign(state, target)
      const redraw = gsap.delayedCall(0, render)
      return () => {
        redraw.kill()
      }
    }
    const tl = gsap.timeline({ onUpdate: render })
    tl.to(state, { ...target, duration: 1.1, ease: 'power2.out' }, 0)
    return () => {
      tl.kill()
    }
    // `render` and `state` are stable for the component lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, reducedMotion])

  const period2 = useMemo(() => explorerSeries('ionization', { period: 2 }), [])
  const period3 = useMemo(() => explorerSeries('ionization', { period: 3 }), [])
  const group1 = useMemo(
    () => explorerSeries('ionization', { group: 1 }).filter((p) => p.symbol !== 'H'),
    []
  )

  const group1Points: TrendPoint[] = group1.map((p) => ({
    x: elementByZ(p.Z).period,
    y: p.value ? p.value.value : null,
    label: p.symbol,
  }))
  const period2Callouts = view.dips > 0.5 ? dipHighlights(2, period2) : []
  const period3Callouts = view.dips > 0.5 ? dipHighlights(3, period3) : []

  const group1Ie = (symbol: string) => {
    const point = group1.find((p) => p.symbol === symbol)
    return point?.value ? formatExplorerValue(point.value, 'ionization') : '—'
  }

  const [leftZ, rightZ] = pair === 'none' ? [4, 5] : PAIR_ATOMS[pair]
  const [leftHighlight, rightHighlight] = pair === 'none' ? [{}, {}] : PAIR_HIGHLIGHT[pair]
  const caption = pair === 'none' ? null : PAIR_CAPTION[pair]

  return (
    <div className={styles.stage}>
      <div className={styles.layer} style={{ opacity: view.periodAlpha }} aria-hidden={view.periodAlpha < 0.5}>
        <div className={styles.chartTop}>
          <TrendChart
            points={periodPoints(period2)}
            xLabel="Element across period 2"
            yLabel={
              <>
                <tspan className="sym">ΔᵢH</tspan>
                {' / kJ mol⁻¹'}
              </>
            }
            yDomain={PERIOD_Y}
            progress={view.periodDraw}
            highlight={period2Callouts}
            width={CHART_W}
            height={PERIOD_CHART_H}
            title="First ionization enthalpy across period 2, Li to Ne"
          />
        </div>
        <div className={styles.chartBottom}>
          <TrendChart
            points={periodPoints(period3)}
            xLabel="Element across period 3"
            yLabel={
              <>
                <tspan className="sym">ΔᵢH</tspan>
                {' / kJ mol⁻¹'}
              </>
            }
            yDomain={PERIOD_Y}
            progress={view.periodDraw}
            highlight={period3Callouts}
            width={CHART_W}
            height={PERIOD_CHART_H}
            title="First ionization enthalpy across period 3, Na to Ar"
          />
        </div>
      </div>

      <div className={styles.layer} style={{ opacity: view.boxes, visibility: view.boxes > 0.01 ? 'visible' : 'hidden' }}>
        <svg
          viewBox={`0 0 ${PANEL_W} ${PANEL_H}`}
          className={styles.svg}
          role="img"
          aria-label={
            pair === 'none'
              ? 'Orbital diagrams are hidden in this Step'
              : `Orbital diagrams of ${atomHeader(leftZ).symbol} and ${atomHeader(rightZ).symbol}, with the electron that is removed highlighted`
          }
          data-testid="ionization-orbitals"
          data-pair={pair}
        >
          <VocabDefs idPrefix="ionization" />
          {pair !== 'none' && (
            <>
              <OrbitalColumn Z={leftZ} centreX={COLUMN_CENTRE.left} highlight={leftHighlight} />
              <OrbitalColumn Z={rightZ} centreX={COLUMN_CENTRE.right} highlight={rightHighlight} />
              {caption && (
                <>
                  <Label x={PANEL_W / 2} y={450} fontSize={CAPTION_FONT} fill="var(--fg)">
                    {caption[0]}
                  </Label>
                  <Label x={PANEL_W / 2} y={478} fontSize={CAPTION_FONT} fill="var(--fg-muted)">
                    {caption[1]}
                  </Label>
                </>
              )}
            </>
          )}
        </svg>
      </div>

      <div className={styles.layer} style={{ opacity: view.groupAlpha }} aria-hidden={view.groupAlpha < 0.5}>
        <TrendChart
          points={group1Points}
          xLabel="Period (group 1, top to bottom)"
          yLabel={
            <>
              <tspan className="sym">ΔᵢH</tspan>
              {' / kJ mol⁻¹'}
            </>
          }
          yDomain={GROUP_Y}
          progress={view.groupDraw}
          highlight={[
            { index: group1.findIndex((p) => p.symbol === 'Li'), text: `Li ${group1Ie('Li')}` },
            { index: group1.findIndex((p) => p.symbol === 'Cs'), text: `Cs ${group1Ie('Cs')}` },
          ].filter((h) => h.index >= 0)}
          width={CHART_W}
          height={GROUP_CHART_H}
          title="First ionization enthalpy down group 1, Li to Fr, with hydrogen left out"
        />
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {ionizationStepDescription(activeStep)}
      </p>
    </div>
  )
}
