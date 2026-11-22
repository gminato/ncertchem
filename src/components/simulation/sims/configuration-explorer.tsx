'use client'

import { useMemo, useState } from 'react'
import { Segmented, type SegmentedOption } from '@/components/controls'
import {
  ConfigurationBoxes,
  DBlockStrip,
  DBLOCK_STRIP_WIDTH,
  configurationLayout,
  dBlockCells,
  dBlockStripHeight,
} from '@/components/vocab/dblock'
import {
  EXPLORER_SERIES,
  explorerState,
  seriesOfSymbol,
  type ExplorerState,
} from '@/lib/chem/configuration-explorer'
import { dBlockSeries } from '@/lib/chem/dblock'
import type { TransitionSeries } from '@/lib/chem/ncert-c12-unit4-tables'
import styles from './configuration-explorer.module.css'

const VIEW_W = 600
const MARGIN = 14
const STRIP_H = dBlockStripHeight(false)
const BOX_MAX = 44
const CONFIG_GAP = 22

type ChargeKey = '0' | '1' | '2' | '3'

const SERIES_OPTIONS: readonly SegmentedOption<TransitionSeries>[] = EXPLORER_SERIES.map((s) => ({ value: s, label: s }))
const CHARGE_OPTIONS: readonly SegmentedOption<ChargeKey>[] = [
  { value: '0', label: '0' },
  { value: '1', label: '+1' },
  { value: '2', label: '+2' },
  { value: '3', label: '+3' },
]

const ALL_D_SYMBOLS = dBlockCells(false).main.map((e) => e.symbol)

export function ConfigurationExplorer() {
  const [series, setSeries] = useState<TransitionSeries>('3d')
  const [symbol, setSymbol] = useState('Cr')
  const [charge, setCharge] = useState(0)

  const state: ExplorerState = explorerState(symbol, charge)
  const members = dBlockSeries(series)
  const dim = useMemo(() => ALL_D_SYMBOLS.filter((s) => !members.includes(s)), [members])
  const configHeight = configurationLayout(state.subshells, VIEW_W - 2 * MARGIN, BOX_MAX).height

  const chooseSeries = (next: TransitionSeries) => {
    setSeries(next)
    if (!dBlockSeries(next).includes(symbol)) setSymbol(dBlockSeries(next)[0])
  }

  const pick = (picked: string) => {
    const next = seriesOfSymbol(picked)
    if (next !== null) setSeries(next)
    setSymbol(picked)
  }

  return (
    <div className={styles.sim}>
      <div className={styles.controls}>
        <div className={styles.group}>
          <span className={styles.caption} aria-hidden="true">
            Series
          </span>
          <Segmented label="Series" options={SERIES_OPTIONS} value={series} onChange={chooseSeries} />
        </div>
        <div className={styles.group}>
          <span className={styles.caption} aria-hidden="true">
            Ion charge
          </span>
          <Segmented label="Ion charge" options={CHARGE_OPTIONS} value={String(charge) as ChargeKey} onChange={(v) => setCharge(Number(v))} />
        </div>
      </div>

      <div className={styles.stage}>
        <svg
          className={styles.scene}
          viewBox={`0 0 ${VIEW_W} ${STRIP_H + 8}`}
          role="group"
          aria-label="d-block periodic strip: choose an element"
        >
          <DBlockStrip x={MARGIN} y={0} highlight={[symbol]} dim={dim} onSelect={pick} />
        </svg>
        <svg
          className={styles.scene}
          viewBox={`0 0 ${VIEW_W} ${configHeight + CONFIG_GAP}`}
          role="img"
          aria-label={`Configuration boxes for ${state.label}: ${state.display}`}
        >
          <ConfigurationBoxes config={state.subshells} x={MARGIN} y={CONFIG_GAP / 2} width={DBLOCK_STRIP_WIDTH} maxSize={BOX_MAX} />
        </svg>
      </div>

      <div className={styles.readout}>
        <p className={styles.species}>
          <span className={styles.name}>{state.label}</span>
          <span className={styles.config}>{state.display}</span>
        </p>

        {state.charge === 0 ? (
          <p className={styles.sum}>
            d + s = {state.groupSum.d} + {state.groupSum.s} = {state.groupSum.d + state.groupSum.s}
            {state.groupSum.group !== null ? `, the group number ${state.groupSum.group}` : ''}
          </p>
        ) : null}

        <p className={styles.verdict} data-transition={state.verdict ? 'yes' : 'no'}>
          <span className={styles.chip}>{state.verdict ? 'Transition' : 'Not transition'}</span>
          <span>{state.verdictText}</span>
        </p>

        <p className={styles.note}>
          Configurations come from Table 4.1. An ion loses its ns electrons first, then its (n−1)d electrons. The same rule
          applies to the 4d and 5d ions.
        </p>
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {state.summary}
      </p>
    </div>
  )
}
