'use client'

import { useEffect, useState } from 'react'
import gsap from 'gsap'
import { Label, Molecule, VocabDefs } from '@/components/vocab'
import {
  AVOGADRO_LABEL,
  READING_EQUATION,
  clampReadingStep,
  massLabel,
  readingSnapshotForStep,
  stepDescription,
  totalMasses,
  type ReadingSnapshot,
} from './reaction-reading-steps'
import styles from './ReactionReading.module.css'

export interface ReactionReadingProps {
  step: number
  reducedMotion: boolean
}

// ---------------------------------------------------------------------------
// Geometry (SVG viewBox 640 x 360, content centred in the Scrolly panel)
// ---------------------------------------------------------------------------

const VIEW_WIDTH = 640
const VIEW_HEIGHT = 360
const VIEW_TOP = -15

/** Molecule centres on the row y = MOL_Y. Reactants on the left, products on the right. */
const MOL_Y = 118
const MOLECULES = {
  ch4: { x: 70, formula: 'CH4' },
  o2a: { x: 166, formula: 'O2' },
  o2b: { x: 238, formula: 'O2' },
  co2: { x: 372, formula: 'CO2' },
  h2oa: { x: 452, formula: 'H2O' },
  h2ob: { x: 536, formula: 'H2O' },
} as const

const MOLECULE_SCALE = 1.15

/** Column centres for the labels that sit under each species. */
const GROUP_X = { ch4: 70, o2: 202, co2: 372, h2o: 494 } as const
const TITLE_Y = 40
const QUANTITY_Y = 182
const BANNER_Y = 232
const BAR_Y = 262
const BAR_TOTAL_Y = 300
const BAR = { leftX: 40, rightX: 340, length: 260, height: 12 }

const ARROW = { x1: 292, x2: 330, y: MOL_Y }

/**
 * ReactionReading: one balanced equation, CH₄ + 2O₂ → CO₂ + 2H₂O, read three ways.
 * The molecules stay put; the labels under them change from counts of molecules,
 * to moles, to grams, and finally two bars show that the total mass is unchanged.
 */
export function ReactionReading({ step, reducedMotion }: ReactionReadingProps) {
  const activeStep = clampReadingStep(step)

  // The live state is a mutable object that GSAP tweens; `view` is a React copy.
  const [state] = useState<ReadingSnapshot>(() => readingSnapshotForStep(activeStep))
  const [view, setView] = useState<ReadingSnapshot>(() => ({ ...state }))

  useEffect(() => {
    if (reducedMotion) {
      // Cut straight to the Step's end state; redraw on the next tick.
      Object.assign(state, readingSnapshotForStep(activeStep))
      const redraw = gsap.delayedCall(0, () => setView({ ...state }))
      return () => {
        redraw.kill()
      }
    }
    const tween = gsap.to(state, {
      ...readingSnapshotForStep(activeStep),
      duration: 0.6,
      ease: 'power2.inOut',
      onUpdate: () => setView({ ...state }),
    })
    return () => {
      tween.kill()
    }
    // `state` is stable for the component lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, reducedMotion])

  const totals = totalMasses()
  const bothBars = BAR.length

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 ${VIEW_TOP} ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.svg}
        role="img"
        aria-label="The equation CH₄ + 2O₂ → CO₂ + 2H₂O shown as molecules, moles and grams, with reactant and product masses equal"
        data-testid="reaction-reading"
        data-step={activeStep}
      >
        <VocabDefs idPrefix="reading" />

        {/* Species titles */}
        <Label x={GROUP_X.ch4} y={TITLE_Y} fontSize={18} fill="var(--fg)">
          CH<Label.Sub>4</Label.Sub>
        </Label>
        <Label x={GROUP_X.o2} y={TITLE_Y} fontSize={18} fill="var(--fg)">
          O<Label.Sub>2</Label.Sub>
        </Label>
        <Label x={GROUP_X.co2} y={TITLE_Y} fontSize={18} fill="var(--fg)">
          CO<Label.Sub>2</Label.Sub>
        </Label>
        <Label x={GROUP_X.h2o} y={TITLE_Y} fontSize={18} fill="var(--fg)">
          H<Label.Sub>2</Label.Sub>O
        </Label>

        {/* Molecules: the same drawing at every Step */}
        <Molecule
          formula={MOLECULES.ch4.formula}
          style="ball-and-stick"
          x={MOLECULES.ch4.x}
          y={MOL_Y}
          scale={MOLECULE_SCALE}
          defsPrefix="reading"
        />
        <Molecule
          formula={MOLECULES.o2a.formula}
          style="ball-and-stick"
          x={MOLECULES.o2a.x}
          y={MOL_Y}
          scale={MOLECULE_SCALE}
          defsPrefix="reading"
        />
        <Molecule
          formula={MOLECULES.o2b.formula}
          style="ball-and-stick"
          x={MOLECULES.o2b.x}
          y={MOL_Y}
          scale={MOLECULE_SCALE}
          defsPrefix="reading"
        />
        <Molecule
          formula={MOLECULES.co2.formula}
          style="ball-and-stick"
          x={MOLECULES.co2.x}
          y={MOL_Y}
          scale={MOLECULE_SCALE}
          defsPrefix="reading"
        />
        <Molecule
          formula={MOLECULES.h2oa.formula}
          style="ball-and-stick"
          x={MOLECULES.h2oa.x}
          y={MOL_Y}
          scale={MOLECULE_SCALE}
          defsPrefix="reading"
        />
        <Molecule
          formula={MOLECULES.h2ob.formula}
          style="ball-and-stick"
          x={MOLECULES.h2ob.x}
          y={MOL_Y}
          scale={MOLECULE_SCALE}
          defsPrefix="reading"
        />

        {/* Reaction arrow and plus signs */}
        <line
          x1={ARROW.x1}
          x2={ARROW.x2 - 6}
          y1={ARROW.y}
          y2={ARROW.y}
          strokeWidth={2}
          strokeLinecap="round"
          style={{ stroke: 'var(--fg-muted)' }}
        />
        <path
          d={`M${ARROW.x2},${ARROW.y} L${ARROW.x2 - 9},${ARROW.y - 6} L${ARROW.x2 - 9},${ARROW.y + 6} Z`}
          style={{ fill: 'var(--fg-muted)' }}
        />
        <Label x={MOLECULES.o2a.x - 26} y={MOL_Y} fontSize={18} fill="var(--fg-muted)">
          +
        </Label>
        <Label x={494} y={MOL_Y} fontSize={18} fill="var(--fg-muted)">
          +
        </Label>

        {/* Layer 1: counts of molecules */}
        <g opacity={view.molecules}>
          <Label x={GROUP_X.ch4} y={QUANTITY_Y} fontSize={16}>
            1 molecule
          </Label>
          <Label x={GROUP_X.o2} y={QUANTITY_Y} fontSize={16}>
            2 molecules
          </Label>
          <Label x={GROUP_X.co2} y={QUANTITY_Y} fontSize={16}>
            1 molecule
          </Label>
          <Label x={GROUP_X.h2o} y={QUANTITY_Y} fontSize={16}>
            2 molecules
          </Label>
        </g>

        {/* Layer 2: moles, with the Avogadro banner */}
        <g opacity={view.moles}>
          <Label x={GROUP_X.ch4} y={QUANTITY_Y} fontSize={16} fill="var(--orbit-active)">
            1 mol
          </Label>
          <Label x={GROUP_X.o2} y={QUANTITY_Y} fontSize={16} fill="var(--orbit-active)">
            2 mol
          </Label>
          <Label x={GROUP_X.co2} y={QUANTITY_Y} fontSize={16} fill="var(--orbit-active)">
            1 mol
          </Label>
          <Label x={GROUP_X.h2o} y={QUANTITY_Y} fontSize={16} fill="var(--orbit-active)">
            2 mol
          </Label>
          <Label x={VIEW_WIDTH / 2} y={BANNER_Y} fontSize={16} fill="var(--fg-muted)">
            1 mol = {AVOGADRO_LABEL} molecules
          </Label>
        </g>

        {/* Layer 3: grams, from molar masses */}
        <g opacity={view.grams}>
          <Label x={GROUP_X.ch4} y={QUANTITY_Y} fontSize={16} fill="var(--fg)">
            {massLabel('CH4', READING_EQUATION.reactants[0].coeff)}
          </Label>
          <Label x={GROUP_X.o2} y={QUANTITY_Y} fontSize={16} fill="var(--fg)">
            {massLabel('O2', READING_EQUATION.reactants[1].coeff)}
          </Label>
          <Label x={GROUP_X.co2} y={QUANTITY_Y} fontSize={16} fill="var(--fg)">
            {massLabel('CO2', READING_EQUATION.products[0].coeff)}
          </Label>
          <Label x={GROUP_X.h2o} y={QUANTITY_Y} fontSize={16} fill="var(--fg)">
            {massLabel('H2O', READING_EQUATION.products[1].coeff)}
          </Label>
        </g>

        {/* Layer 4: mass balance, two equal bars */}
        <g opacity={view.balance}>
          <rect
            x={BAR.leftX}
            y={BAR_Y}
            width={bothBars}
            height={BAR.height}
            rx={BAR.height / 2}
            style={{ fill: 'var(--orbit-active)', opacity: 0.85 }}
          />
          <rect
            x={BAR.rightX}
            y={BAR_Y}
            width={bothBars}
            height={BAR.height}
            rx={BAR.height / 2}
            style={{ fill: 'var(--orbit-active)', opacity: 0.85 }}
          />
          <Label x={BAR.leftX + BAR.length / 2} y={BAR_TOTAL_Y} fontSize={16}>
            Reactants {totals.reactants} g
          </Label>
          <Label x={BAR.rightX + BAR.length / 2} y={BAR_TOTAL_Y} fontSize={16}>
            Products {totals.products} g
          </Label>
        </g>
      </svg>

      <p className={styles.srOnly} aria-live="polite">
        {stepDescription(activeStep)}
      </p>
    </div>
  )
}
