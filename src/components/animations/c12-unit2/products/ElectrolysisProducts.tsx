'use client'

import { Fragment } from 'react'
import { useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import {
  Beaker,
  DcSource,
  Electrode,
  GasBubbles,
  Ion,
  VocabDefs,
  Wire,
  beakerGeometry,
  dcTerminals,
} from '@/components/vocab'
import {
  clampElectrolysisStep,
  getElectrolysisStepState,
  type IonSet,
  type RedoxCard,
  type RowTone,
} from './electrolysis-steps'

export interface ElectrolysisProductsProps {
  step: number
  reducedMotion: boolean
}

const ANODE_X = 215
const CATHODE_X = 365
const ELECTRODE_TOP = 178
const ELECTRODE_LENGTH = 200
const BEAKER = { x: 150, y: 152, width: 280, height: 248, level: 0.8 }
const SOURCE = { x: 240, y: 30, width: 120, height: 56 }
const CARD_W = 196
const CARD_Y = 18
const CARD_LEFT_X = 8
const CARD_RIGHT_X = 376

interface IonSpec {
  readonly formula: string
  readonly charge: string
  readonly kind: 'cation' | 'anion'
  readonly lo: number
  readonly hi: number
  readonly y: number
  readonly phase: number
}

const ION_SETS: Record<IonSet, readonly IonSpec[]> = {
  melt: [
    { formula: 'Na', charge: '+', kind: 'cation', lo: 262, hi: 332, y: 246, phase: 0 },
    { formula: 'Na', charge: '+', kind: 'cation', lo: 262, hi: 332, y: 300, phase: 0.45 },
    { formula: 'Cl', charge: '−', kind: 'anion', lo: 252, hi: 322, y: 270, phase: 0.2 },
    { formula: 'Cl', charge: '−', kind: 'anion', lo: 252, hi: 322, y: 340, phase: 0.7 },
  ],
  aqueous: [
    { formula: 'Na', charge: '+', kind: 'cation', lo: 256, hi: 300, y: 250, phase: 0.1 },
    { formula: 'Cl', charge: '−', kind: 'anion', lo: 262, hi: 318, y: 318, phase: 0.6 },
    { formula: 'OH', charge: '−', kind: 'anion', lo: 312, hi: 334, y: 232, phase: 0.35 },
    { formula: 'Na', charge: '+', kind: 'cation', lo: 256, hi: 330, y: 364, phase: 0.3 },
  ],
  persulphate: [
    { formula: 'H', charge: '+', kind: 'cation', lo: 256, hi: 300, y: 236, phase: 0.15 },
    { formula: 'H', charge: '+', kind: 'cation', lo: 300, hi: 330, y: 282, phase: 0.55 },
    { formula: 'SO4', charge: '2−', kind: 'anion', lo: 262, hi: 330, y: 322, phase: 0.8 },
    { formula: 'S2O8', charge: '2−', kind: 'anion', lo: 262, hi: 286, y: 362, phase: 0.4 },
  ],
}

/** Triangle wave in [0, 1] with period 1, so an ion drifts one way and then back. */
function triangle(u: number): number {
  const f = u - Math.floor(u)
  return 1 - Math.abs(2 * f - 1)
}

const TONE_OPACITY: Record<RowTone, number> = { win: 1, dim: 0.5, idle: 0.7 }

function RedoxCardView({ card, x, anchorSide }: { card: RedoxCard; x: number; anchorSide: 'left' | 'right' }) {
  const rowHeights = card.rows.map((r) => (r.note ? 36 : 18))
  const height = 26 + rowHeights.reduce((a, b) => a + b, 0) + 6
  const rowTops: number[] = []
  let top = CARD_Y + 22
  for (const h of rowHeights) {
    rowTops.push(top)
    top += h
  }
  return (
    <g data-testid="redox-card" data-side={anchorSide}>
      <rect
        x={x}
        y={CARD_Y}
        width={CARD_W}
        height={height}
        rx={8}
        fill="var(--surface-raised)"
        stroke="var(--border)"
        strokeWidth={1}
      />
      <text x={x + 10} y={CARD_Y + 16} fontSize={13} fill="var(--fg-muted)">
        {card.title}
      </text>
      {card.rows.map((row, i) => {
        const rowY = rowTops[i] + 14
        const isWin = row.tone === 'win'
        return (
          <Fragment key={`${row.label}-${i}`}>
            {isWin && (
              <rect x={x + 6} y={rowY - 14} width={CARD_W - 12} height={20} rx={5} fill="var(--accent-soft)" />
            )}
            <g opacity={TONE_OPACITY[row.tone]}>
              <text x={x + 10} y={rowY} fontSize={14} fill="var(--fg)" fontWeight={isWin ? 600 : 400}>
                {row.label}
              </text>
              <text x={x + CARD_W - 10} y={rowY} fontSize={14} fill="var(--fg)" textAnchor="end" fontWeight={isWin ? 600 : 400}>
                {row.value}
              </text>
              {row.note && (
                <text x={x + 10} y={rowY + 16} fontSize={13} fill="var(--fg-muted)">
                  {row.note}
                </text>
              )}
            </g>
          </Fragment>
        )
      })}
    </g>
  )
}

export function ElectrolysisProducts({ step, reducedMotion }: ElectrolysisProductsProps) {
  const index = clampElectrolysisStep(step)
  const state = getElectrolysisStepState(index)
  const t = useAmbientTime(reducedMotion)

  const geo = beakerGeometry(BEAKER)
  const cathodeShade = useTweenedNumber(state.alkalineMode === 'cathode' ? 0.42 : 0, reducedMotion, 0.38)
  const bulkShade = useTweenedNumber(state.alkalineMode === 'bulk' ? 0.22 : 0, reducedMotion, 0.38)
  const beadOpacity = useTweenedNumber(state.sodiumBeads ? 1 : 0, reducedMotion, 0.38)

  const terminals = dcTerminals(SOURCE.x, SOURCE.y, SOURCE.width)
  // Electrons leave the anode and return to the + terminal (reverse), and leave the − terminal for the cathode.
  const plusWire = [
    terminals.plus,
    { x: terminals.plus.x, y: 8 },
    { x: ANODE_X, y: 8 },
    { x: ANODE_X, y: ELECTRODE_TOP },
  ]
  const minusWire = [
    terminals.minus,
    { x: terminals.minus.x, y: 8 },
    { x: CATHODE_X, y: 8 },
    { x: CATHODE_X, y: ELECTRODE_TOP },
  ]
  const sway = (phase: number, lo: number, hi: number) => lo + (hi - lo) * triangle(t * 0.07 + phase)

  const anodeGasBase = { x: ANODE_X, y: 362 }
  const cathodeGasBase = { x: CATHODE_X, y: 362 }

  return (
    <svg
      viewBox="0 0 580 480"
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label={state.ariaLabel}
      data-testid="electrolysis-products"
      data-step={index}
    >
      <VocabDefs />

      <DcSource
        x={SOURCE.x}
        y={SOURCE.y}
        width={SOURCE.width}
        height={SOURCE.height}
        display="DC supply"
      />
      <Wire corners={plusWire} t={t} electrons dots={3} direction="reverse" />
      <Wire corners={minusWire} t={t} electrons dots={3} direction="forward" />

      <Beaker
        x={BEAKER.x}
        y={BEAKER.y}
        width={BEAKER.width}
        height={BEAKER.height}
        level={BEAKER.level}
        tint="clear"
        label={state.beakerLabel}
      />

      {/* Alkalinity: pink tint around the cathode, or through the whole liquid at the net stage */}
      <ellipse cx={CATHODE_X} cy={300} rx={64} ry={92} fill="var(--sol-pink)" opacity={cathodeShade} />
      <rect
        x={geo.innerLeft}
        y={geo.liquidTop}
        width={geo.innerRight - geo.innerLeft}
        height={geo.innerBottom - geo.liquidTop}
        fill="var(--sol-pink)"
        opacity={bulkShade}
      />

      <Electrode
        x={ANODE_X}
        top={ELECTRODE_TOP}
        length={ELECTRODE_LENGTH}
        width={16}
        material="graphite"
        polarity="+"
        role="anode"
      />
      <Electrode
        x={CATHODE_X}
        top={ELECTRODE_TOP}
        length={ELECTRODE_LENGTH}
        width={16}
        material="graphite"
        polarity="−"
        role="cathode"
      />

      {ION_SETS[state.ionSet].map((ion, i) => (
        <Ion
          key={`${ion.formula}-${ion.charge}-${i}`}
          x={sway(ion.phase, ion.lo, ion.hi)}
          y={ion.y}
          kind={ion.kind}
          formula={ion.formula}
          charge={ion.charge}
          fontSize={14}
        />
      ))}

      {state.anodeGas && (
        <GasBubbles
          x={anodeGasBase.x}
          y={anodeGasBase.y}
          width={40}
          height={130}
          count={6}
          t={t}
          formula={state.anodeGas}
        />
      )}
      {state.cathodeGas && (
        <GasBubbles
          x={cathodeGasBase.x}
          y={cathodeGasBase.y}
          width={40}
          height={130}
          count={6}
          t={t}
          formula={state.cathodeGas}
        />
      )}

      <g opacity={beadOpacity} data-testid="sodium-beads">
        {[
          { cx: 350, cy: 388 },
          { cx: 364, cy: 392 },
          { cx: 378, cy: 387 },
        ].map((b) => (
          <circle key={`${b.cx}-${b.cy}`} cx={b.cx} cy={b.cy} r={5.5} fill="var(--el-Na)" />
        ))}
        <text x={392} y={392} fontSize={14} fill="var(--fg)">
          Na(l)
        </text>
      </g>

      {state.anodeCard && <RedoxCardView card={state.anodeCard} x={CARD_LEFT_X} anchorSide="left" />}
      {state.cathodeCard && <RedoxCardView card={state.cathodeCard} x={CARD_RIGHT_X} anchorSide="right" />}

      {state.equation && (
        <text x={290} y={462} fontSize={16} fill="var(--fg)" textAnchor="middle" data-testid="net-equation">
          {state.equation}
        </text>
      )}
    </svg>
  )
}

