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

/** Drawing size. The text sizes below are chosen so they render at 14 px or more in a ~570 px panel. */
const VIEW = { width: 600, height: 460 } as const

/** The bomb: centred in the left part of the panel and scaled so it fills most of the height. */
const BOMB = { x: 196, y: 230, scale: 1.7 } as const

/** The reading card on the right. */
const CARD = { x: 398, y: 118, width: 194, height: 228 } as const
const TEXT_X = CARD.x + 16
/** Font sizes in SVG units. Body text is 16 units (about 14.5 px); headline values are 20 units. */
const TITLE_FONT = 18
const BODY_FONT = 16
const VALUE_FONT = 20

/** What the card says at each Step. Symbols are italic (className="sym"); units and numbers are upright. */
const CARD_TEXT = [
  {
    title: 'Sealed bomb',
    body: <><tspan className="sym">V</tspan> fixed, so <tspan className="sym">w</tspan> = 0</>,
    line: 'Sample + O₂ inside',
  },
  {
    title: 'Ignition',
    body: 'Spark lights it',
    line: 'Heat enters bath',
  },
  {
    title: 'Water bath warms',
    body: 'Thermometer reads',
    big: <><tspan className="sym">ΔT</tspan> = {signedText(BOMB_EXAMPLE.deltaTK, 2)} K</>,
  },
  {
    title: 'Heat balance',
    body: `Bath gains ${BOMB_EXAMPLE.qCalorimeterKJ.toFixed(2)} kJ`,
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
      viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
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
      <Label x={TEXT_X} y={CARD.y + 42} textAnchor="start" fontSize={TITLE_FONT} fill="var(--fg)">
        {text.title}
      </Label>
      <Label x={TEXT_X} y={CARD.y + 84} textAnchor="start" fontSize={BODY_FONT} fill="var(--fg-muted)">
        {text.body}
      </Label>
      {'line' in text && (
        <Label x={TEXT_X} y={CARD.y + 116} textAnchor="start" fontSize={BODY_FONT} fill="var(--fg-muted)">
          {text.line}
        </Label>
      )}
      {'big' in text && (
        <Label x={TEXT_X} y={CARD.y + 178} textAnchor="start" fontSize={VALUE_FONT} fill="var(--fg)" data-testid="bomb-readout">
          {text.big}
        </Label>
      )}
      <Label x={TEXT_X} y={CARD.y + 210} textAnchor="start" fontSize={BODY_FONT} fill="var(--fg-subtle)">
        {`Step ${index + 1} of 5`}
      </Label>
    </svg>
  )
}
