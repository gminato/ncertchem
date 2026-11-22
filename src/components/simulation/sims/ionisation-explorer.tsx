'use client'

import { useState } from 'react'
import { Segmented, Slider } from '@/components/controls'
import { PlotFrame, PlotPoint, TONE_VAR, usePlotScale, type PlotTone } from '@/components/vocab'
import { ConfigurationBoxes, configurationLayout, type SubshellConfig } from '@/components/vocab/dblock'
import {
  FIRST_SERIES_SYMBOLS,
  firstSeriesIe,
  ionisationState,
  subshellLosingElectron,
} from '@/lib/chem/ionisation-explorer'
import styles from './ionisation-explorer.module.css'

const STEP_OPTIONS = [
  { value: '0', label: 'Atom' },
  { value: '1', label: '1st removed' },
  { value: '2', label: '2nd removed' },
  { value: '3', label: '3rd removed' },
] as const

const DEFAULT_INDEX = FIRST_SERIES_SYMBOLS.indexOf('Mn')
const DEFAULT_STEP = 2
const ENERGY_MAX = 4000
const BAR_MAX = 330
const IE_TONES: readonly PlotTone[] = ['reactant', 'product', 'catalyst']
const IE_SUB = ['₁', '₂', '₃'] as const

/** One IE series drawn as a polyline across the 3d elements (one tone per series). */
function IeLine({ values, tone }: { values: readonly number[]; tone: PlotTone }) {
  const scale = usePlotScale()
  const d = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${scale.x(i).toFixed(1)} ${scale.y(v).toFixed(1)}`).join(' ')
  return <path d={d} fill="none" stroke={TONE_VAR[tone]} strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
}

const BOX_WIDTH = 520
const BOX_SIZE = 40
const BOX_X = 20
const BOX_Y = 52
const BAR_X = 84
const BAR_ROW_Y = [206, 242, 278] as const
const PLOT = { x: 76, y: 318, width: 460, height: 180 }

export function IonisationExplorer() {
  const [index, setIndex] = useState(DEFAULT_INDEX)
  const [step, setStep] = useState(DEFAULT_STEP)

  const symbol = FIRST_SERIES_SYMBOLS[index]!
  const state = ionisationState(symbol, step)
  const ie = firstSeriesIe(symbol)
  const lost = subshellLosingElectron(symbol, step)

  const config: SubshellConfig[] = state.subshells.map((s) => ({
    subshell: s.subshell,
    electrons: s.electrons,
    removed: s.removed,
  }))
  const boxLayout = configurationLayout(config, BOX_WIDTH, BOX_SIZE)

  const pairsY = BOX_Y + boxLayout.height + 26
  const captionY = pairsY + 22
  const barHeadY = captionY + 36

  const caption =
    step === 0
      ? 'The atom, before any electron leaves.'
      : lost === '4s'
        ? 'A 4s electron leaves first.'
        : 'The 4s set is empty, so a 3d electron leaves.'

  const currentIe = step === 0 ? null : ie[step - 1]!
  const liveSummary =
    step === 0
      ? `${symbol} atom, ${state.display}, ${state.pairs} parallel-spin pairs in the 3d set.`
      : `${state.label}, ${state.display}, ${state.pairs} parallel-spin pairs in the 3d set. Removing electron ${step} costs ${currentIe} kJ mol⁻¹ (IE${IE_SUB[step - 1]}).`

  return (
    <div className={styles.sim}>
      <div className={styles.controls}>
        <Slider
          label="3d element"
          value={index}
          min={0}
          max={FIRST_SERIES_SYMBOLS.length - 1}
          step={1}
          onChange={(v) => setIndex(v)}
          format={(v) => FIRST_SERIES_SYMBOLS[v] ?? ''}
        />
        <Segmented label="Electrons removed" options={STEP_OPTIONS} value={String(step) as '0' | '1' | '2' | '3'} onChange={(v) => setStep(Number(v))} />
      </div>

      <div className={styles.stage}>
        <svg
          className={styles.scene}
          viewBox="0 0 560 560"
          role="img"
          aria-label={`${state.label}, ${state.display}, with ${state.pairs} parallel-spin pairs; IE values for ${symbol} with the step at ${step} marked on the plot`}
        >
          <text x={BOX_X} y={28} className={styles.head}>
            {state.label}: {state.display}
          </text>
          <ConfigurationBoxes
            config={config}
            highlight={lost ? { subshell: lost } : undefined}
            x={BOX_X}
            y={BOX_Y}
            width={BOX_WIDTH}
            maxSize={BOX_SIZE}
            fontSize={15}
          />
          <text x={BOX_X} y={pairsY} className={styles.label}>
            Parallel-spin pairs in the 3d set: <tspan className={styles.strong}>{state.pairs}</tspan>
          </text>
          <text x={BOX_X} y={captionY} className={styles.note}>
            {caption}
          </text>

          <text x={BOX_X} y={barHeadY} className={styles.label}>
            Energy to remove each electron (kJ mol⁻¹)
          </text>
          {ie.map((value, i) => {
            const y = BAR_ROW_Y[i]!
            const done = i < step
            const w = (value / ENERGY_MAX) * BAR_MAX
            return (
              <g key={i} data-testid={`ie-bar-${i + 1}`}>
                <text x={BOX_X} y={y + 15} className={styles.label}>
                  IE{IE_SUB[i]}
                </text>
                <rect x={BAR_X} y={y} width={BAR_MAX} height={20} rx={4} className={styles.track} />
                <rect
                  x={BAR_X}
                  y={y}
                  width={done ? w : 0}
                  height={20}
                  rx={4}
                  className={styles.bar}
                  style={{ fill: TONE_VAR[IE_TONES[i]!] }}
                />
                <text x={BAR_X + BAR_MAX + 10} y={y + 15} className={done ? styles.strong : styles.label}>
                  {value}
                </text>
              </g>
            )
          })}

          <PlotFrame
            x={PLOT.x}
            y={PLOT.y}
            width={PLOT.width}
            height={PLOT.height}
            domain={{ xMin: -0.5, xMax: FIRST_SERIES_SYMBOLS.length - 0.5, yMin: 0, yMax: ENERGY_MAX }}
            xTicks={FIRST_SERIES_SYMBOLS.map((_, i) => i)}
            yTicks={[0, 1000, 2000, 3000, 4000]}
            xTickFormat={(v) => FIRST_SERIES_SYMBOLS[v] ?? ''}
            yTickFormat={(v) => String(v)}
            xTitle="Element, 3d row"
            yTitle="IE / kJ mol⁻¹"
          >
            {IE_TONES.map((tone, k) => (
              <IeLine key={k} values={FIRST_SERIES_SYMBOLS.map((s) => firstSeriesIe(s)[k]!)} tone={tone} />
            ))}
            {currentIe !== null && (
              <PlotPoint
                at={{ x: index, y: currentIe }}
                tone={IE_TONES[step - 1]!}
                label={String(currentIe)}
                side={index > 6 ? 'nw' : 'ne'}
              />
            )}
          </PlotFrame>
        </svg>
      </div>

      <p className={styles.note}>
        Faded arrows show where each removed electron sat. The highlighted subshell is the one losing the electron now.
      </p>

      <p className={styles.srOnly} aria-live="polite">
        {liveSummary}
      </p>
    </div>
  )
}
