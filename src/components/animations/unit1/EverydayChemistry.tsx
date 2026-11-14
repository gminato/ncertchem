'use client'

import { Label, Molecule, VocabDefs } from '@/components/vocab'
import { useTweenedValues } from './useTweenedValues'
import { EVERYDAY_STEP_COUNT, clampEverydayStep, everydayStepText } from './everyday-steps'
import styles from './unit1.module.css'

export interface EverydayChemistryProps {
  step: number
  reducedMotion: boolean
}

const VIEW_W = 640
const VIEW_H = 540
const DEFS = 'everyday'

const TITLE_Y = 66
const CAPTION_Y = 100
const PANEL = { x: 14, y: 14, w: VIEW_W - 28, h: VIEW_H - 28, r: 18 }

/** Arrow between two groups: a line with a filled head pointing right. */
function RightArrow({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  const head = 12
  const half = 6
  return (
    <g>
      <line
        x1={x1}
        x2={x2 - head}
        y1={y}
        y2={y}
        strokeWidth={2}
        strokeLinecap="round"
        style={{ stroke: 'var(--fg-subtle)' }}
      />
      <path
        d={`M${x2},${y} L${x2 - head},${y - half} L${x2 - head},${y + half} Z`}
        style={{ fill: 'var(--fg-subtle)' }}
      />
    </g>
  )
}

/**
 * Four Steps of everyday chemistry, each one a cross-fade between pictures of
 * vocabulary molecules. The last Step shows the reactants and products of the
 * ammonia reaction, so the same atoms can be counted on either side.
 */
export function EverydayChemistry({ step, reducedMotion }: EverydayChemistryProps) {
  const active = clampEverydayStep(step)
  const opacity = useTweenedValues(
    Array.from({ length: EVERYDAY_STEP_COUNT }, (_, i) => (i === active ? 1 : 0)),
    reducedMotion
  )
  const text = everydayStepText(active)

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className={styles.svg}
        role="img"
        aria-label={`${text.title}. ${text.description}`}
        data-testid="everyday-chemistry"
        data-step={active}
      >
        <VocabDefs idPrefix={DEFS} />
        <rect
          x={PANEL.x}
          y={PANEL.y}
          width={PANEL.w}
          height={PANEL.h}
          rx={PANEL.r}
          style={{ fill: 'var(--surface-raised)', stroke: 'var(--border)' }}
        />

        {/* Step 0: stomach acid */}
        <g opacity={opacity[0]}>
          <Label x={VIEW_W / 2} y={TITLE_Y} fontSize={24} fill="var(--fg)">
            {everydayStepText(0).title}
          </Label>
          <Label x={VIEW_W / 2} y={CAPTION_Y} fontSize={16} halo>
            {everydayStepText(0).caption}
          </Label>
          <Molecule
            formula="HCl"
            x={VIEW_W / 2}
            y={300}
            scale={3.2}
            style="ball-and-stick"
            defsPrefix={DEFS}
          />
        </g>

        {/* Step 1: ammonia and fertilisers */}
        <g opacity={opacity[1]}>
          <Label x={VIEW_W / 2} y={TITLE_Y} fontSize={24} fill="var(--fg)">
            {everydayStepText(1).title}
          </Label>
          <Label x={VIEW_W / 2} y={CAPTION_Y} fontSize={16} halo>
            {everydayStepText(1).caption}
          </Label>
          <Molecule
            formula="NH3"
            x={VIEW_W / 2}
            y={300}
            scale={3.2}
            style="ball-and-stick"
            defsPrefix={DEFS}
          />
        </g>

        {/* Step 2: greenhouse gases */}
        <g opacity={opacity[2]}>
          <Label x={VIEW_W / 2} y={TITLE_Y} fontSize={24} fill="var(--fg)">
            {everydayStepText(2).title}
          </Label>
          <Label x={VIEW_W / 2} y={CAPTION_Y} fontSize={16} halo>
            {everydayStepText(2).caption}
          </Label>
          <Molecule formula="CO2" x={170} y={290} scale={2.8} style="ball-and-stick" defsPrefix={DEFS} />
          <Molecule formula="CH4" x={470} y={290} scale={2.8} style="ball-and-stick" defsPrefix={DEFS} />
          <Label x={170} y={410} fontSize={20} fill="var(--fg)">
            CO₂
          </Label>
          <Label x={470} y={410} fontSize={20} fill="var(--fg)">
            CH₄
          </Label>
        </g>

        {/* Step 3: the same atoms, regrouped */}
        <g opacity={opacity[3]}>
          <Label x={VIEW_W / 2} y={TITLE_Y} fontSize={24} fill="var(--fg)">
            {everydayStepText(3).title}
          </Label>
          <Label x={VIEW_W / 2} y={CAPTION_Y} fontSize={16} halo>
            {everydayStepText(3).caption}
          </Label>
          <Molecule formula="N2" x={150} y={230} scale={2.2} style="ball-and-stick" defsPrefix={DEFS} />
          <Molecule formula="H2" x={96} y={340} scale={2.2} style="ball-and-stick" defsPrefix={DEFS} />
          <Molecule formula="H2" x={206} y={340} scale={2.2} style="ball-and-stick" defsPrefix={DEFS} />
          <Molecule formula="H2" x={150} y={432} scale={2.2} style="ball-and-stick" defsPrefix={DEFS} />
          <RightArrow x1={300} x2={356} y={300} />
          <Molecule formula="NH3" x={440} y={230} scale={2.2} style="ball-and-stick" defsPrefix={DEFS} />
          <Molecule formula="NH3" x={440} y={372} scale={2.2} style="ball-and-stick" defsPrefix={DEFS} />
          <Label x={VIEW_W / 2} y={496} fontSize={20} fill="var(--fg)">
            N₂ + 3 H₂ → 2 NH₃
          </Label>
        </g>
      </svg>

      <p className={styles.srOnly} aria-live="polite">
        {text.description}
      </p>
    </div>
  )
}
