'use client'

import { Calorimeter } from '@/components/thermo'
import { Label, VocabDefs } from '@/components/vocab'
import { BOMB_EXAMPLE, signedText } from '@/lib/chem/calorimetry-examples'
import { BOMB_SCALE_MAX_K, bombSnapshotForStep, clampBombStep } from './bomb-steps'
import { useTweenedNumber } from './useTweenedNumber'

export interface ThermoBombProps {
  step: number
  reducedMotion: boolean
}

/** The bomb sits in the left part of the panel, scaled up so it fills the drawing. */
const BOMB = { x: 200, y: 205, scale: 1.5 } as const

/** The reading card on the right: its left edge, top edge and width. */
const CARD = { x: 390, y: 60, width: 198, height: 206 } as const
const TEXT_X = CARD.x + 16

/** What the card says at each Step. Symbols are italic (className="sym"); units and numbers are upright. */
const CARD_TEXT = [
  {
    title: 'Sealed steel bomb',
    body: <><tspan className="sym">V</tspan> fixed, so <tspan className="sym">w</tspan> = 0</>,
    line: 'Sample and O₂ inside',
  },
  {
    title: 'Ignition',
    body: 'A spark starts the burn',
    line: 'Heat goes into the bath',
  },
  {
    title: 'Water bath warms',
    body: 'The thermometer reads',
    big: <><tspan className="sym">ΔT</tspan> = {signedText(BOMB_EXAMPLE.deltaTK, 2)} K</>,
  },
  {
    title: 'Heat balance',
    body: `The bath gains +${BOMB_EXAMPLE.qCalorimeterKJ.toFixed(2)} kJ`,
    big: <><tspan className="sym">q</tspan> = {signedText(BOMB_EXAMPLE.qReactionKJ, 2)} kJ</>,
  },
  {
    title: 'Per mole',
    body: `n = ${BOMB_EXAMPLE.molesReacted.toExponential(2).replace('e-3', ' × 10⁻³')} mol`,
    big: <><tspan className="sym">ΔU</tspan> = {signedText(BOMB_EXAMPLE.deltaUKJPerMol, 0)}</>,
    line: 'kJ mol⁻¹',
  },
] as const

/**
 * The bomb calorimeter sequence: a sealed bomb with fixed volume, ignition, the water bath
 * warming, the heat balance q = −C ΔT, and the per-mole ΔU. The thermometer tweens to ΔT. The
 * numbers come from the worked example in calorimetry-examples.ts.
 */
export function ThermoBomb({ step, reducedMotion }: ThermoBombProps) {
  const index = clampBombStep(step)
  const target = bombSnapshotForStep(index)
  const tempRise = useTweenedNumber(target.tempRise, reducedMotion)
  const text = CARD_TEXT[index]

  return (
    <svg
      viewBox="0 0 600 400"
      role="img"
      aria-label={`Bomb calorimeter, Step ${index + 1} of 5: ${text.title}. ${typeof text.body === 'string' ? text.body : ''}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-step={index}
    >
      <VocabDefs />
      <g transform={`translate(${BOMB.x} ${BOMB.y}) scale(${BOMB.scale})`}>
        <Calorimeter variant="bomb" tempRise={tempRise} scaleMax={BOMB_SCALE_MAX_K} glow={target.glow} />
      </g>

      {/* Reading card */}
      <rect
        x={CARD.x}
        y={CARD.y}
        width={CARD.width}
        height={CARD.height}
        rx={14}
        style={{ fill: 'var(--surface-raised)', stroke: 'var(--glass-wall)' }}
        strokeWidth={1.4}
      />
      <Label x={TEXT_X} y={CARD.y + 34} textAnchor="start" fontSize={16} fill="var(--fg)">
        {text.title}
      </Label>
      <Label x={TEXT_X} y={CARD.y + 70} textAnchor="start" fontSize={14} fill="var(--fg-muted)">
        {text.body}
      </Label>
      {'line' in text && (
        <Label x={TEXT_X} y={CARD.y + 98} textAnchor="start" fontSize={14} fill="var(--fg-muted)">
          {text.line}
        </Label>
      )}
      {'big' in text && (
        <Label x={TEXT_X} y={CARD.y + 150} textAnchor="start" fontSize={22} fill="var(--fg)" data-testid="bomb-readout">
          {text.big}
        </Label>
      )}
      <Label x={TEXT_X} y={CARD.y + 182} textAnchor="start" fontSize={14} fill="var(--fg-subtle)">
        {`Step ${index + 1} of 5`}
      </Label>
    </svg>
  )
}
