'use client'

import { Fragment } from 'react'
import { useSweptNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import { CombustionTrain, DumasApparatus } from '@/components/organic/lab'
import { CariusDrawing } from './CariusDrawing'
import { KjeldahlDrawing } from './KjeldahlDrawing'
import { analysisReadouts, analysisStepTargets, EXAMPLE_READINGS } from './quantitative-steps'

export interface CombustionAnalysisProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 580
const VIEW_HEIGHT = 470
const TITLE_Y = 26

/**
 * Where each Step's apparatus sits: its scale, its top edge, the first readout line and the x of
 * the readouts. Each drawing is about 300 to 360 units wide natively, so a scale of 1.15 to 1.3
 * fills most of the panel. The Carius tube is tall and narrow, so its readouts sit in a column
 * beside it.
 */
const LAYOUT = [
  { scale: 1.2, top: 36, firstLine: 352, drawX: null, textX: 290, anchor: 'middle' },
  { scale: 1.15, top: 34, firstLine: 396, drawX: null, textX: 290, anchor: 'middle' },
  { scale: 1.15, top: 34, firstLine: 404, drawX: null, textX: 290, anchor: 'middle' },
  { scale: 1.25, top: 36, firstLine: 200, drawX: 30, textX: 320, anchor: 'start' },
] as const

/** Symbols in readouts are KaTeX-italic (class "sym"); numbers and units stay upright. */
const SYMBOL = /(V₁|\bV\b|\bm\b|p₁|\bT\b)/g

function Readout({ line, x, y, anchor }: { line: string; x: number; y: number; anchor: 'start' | 'middle' }) {
  const parts = line.split(SYMBOL)
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={15} fill="var(--fg)" fontFamily="var(--font-sans)">
      {parts.map((part, i) =>
        SYMBOL.test(part) ? (
          <tspan key={i} className="sym">
            {part}
          </tspan>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </text>
  )
}

/**
 * The combustion analysis of the worked sample, one apparatus per Step: the Liebig train, the
 * Dumas nitrometer, the Kjeldahl titration and the Carius tube. Each Step sweeps from zero to its
 * target state; reduced motion jumps straight to the target. The numbers are the lib's readings.
 */
export function CombustionAnalysis({ step, reducedMotion }: CombustionAnalysisProps) {
  const targets = analysisStepTargets()
  const index = Math.min(targets.length - 1, Math.max(0, Math.round(step)))
  const target = targets[index]
  const readouts = analysisReadouts()[index]
  const v = useSweptNumber(index, 0, 1, reducedMotion)
  const r = EXAMPLE_READINGS

  let drawing
  if (index === 0) {
    drawing = (
      <CombustionTrain
        progress={target.progress * v}
        h2oGain={`+${r.combustion.massH2O.toFixed(4)} g`}
        co2Gain={`+${r.combustion.massCO2.toFixed(4)} g`}
        title="Liebig train: CaCl₂ tube gains water, KOH bulbs gain carbon dioxide"
      />
    )
  } else if (index === 1) {
    drawing = (
      <DumasApparatus
        volume={target.volumeFraction * v}
        volumeLabel={`${(r.dumas.volumeMl * v).toFixed(1)} mL`}
        progress={v}
        title="Dumas nitrometer collecting nitrogen over KOH"
      />
    )
  } else if (index === 2) {
    drawing = <KjeldahlDrawing titrantMl={target.titrantMl * v} endPoint={v > 0.98} title="Kjeldahl back-titration of the excess acid" />
  } else {
    drawing = (
      <CariusDrawing
        progress={target.progress * v}
        precipitateColor="var(--agcl-white)"
        caption="The silver salt settles out"
        title="Carius tube in a furnace: silver chloride settling out"
      />
    )
  }

  const layout = LAYOUT[index]
  const drawWidth = index === 3 ? 300 : 360
  const xOffset = layout.drawX ?? (VIEW_WIDTH - drawWidth * layout.scale) / 2

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={`${target.title}. ${readouts.join('. ')}.`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-testid="combustion-analysis"
      data-step={index}
    >
      <text x={VIEW_WIDTH / 2} y={TITLE_Y} textAnchor="middle" fontSize={17} fontWeight={600} fill="var(--fg)" fontFamily="var(--font-sans)">
        {target.title}
      </text>
      <g transform={`translate(${xOffset}, ${layout.top}) scale(${layout.scale})`}>{drawing}</g>
      {readouts.map((line, i) => (
        <Readout key={i} line={line} x={layout.textX} y={layout.firstLine + 26 * i} anchor={layout.anchor} />
      ))}
    </svg>
  )
}
