'use client'

import type { CSSProperties, ReactNode } from 'react'
import { Label, Vessel } from '@/components/vocab'
import { AVOGADRO } from '@/lib/chem/constants'
import { formatScientific } from '@/lib/chem/mole-bridge'
import {
  LOG_SCALE_DECADES,
  ONE_MOLE_SUBSTANCES,
  logScaleFraction,
  massOfOneMole,
  clampMoleScaleStep,
  targetsForMoleScaleStep,
} from './mole-scale-steps'
import styles from './MoleScale.module.css'

export interface MoleScaleProps {
  step: number
  reducedMotion: boolean
}

// Geometry in SVG units. The viewBox is 640 × 540, the same as the Scrolly panel.
const VIEW_WIDTH = 640
const VIEW_HEIGHT = 540

/** Egg grid: four columns of three, centred on x = 320. */
const EGG = { rx: 22, ry: 30 }
const EGG_COLUMNS = [185, 275, 365, 455]
const EGG_ROWS = [136, 208, 280]

/** Log axis, spanning x from AXIS.left to AXIS.right. */
const AXIS = { left: 60, right: 580, y: 262 }
const xForScale = (fraction: number) => AXIS.left + fraction * (AXIS.right - AXIS.left)
const TICK_EVERY_DECADES = 4

/** Vessel row: three vessels centred on these x values. */
const VESSEL_X = [120, 320, 520]
const VESSEL_Y = 215
const VESSEL = { width: 112, height: 150 }

const ANIMATED_TRANSITION = 'opacity 0.6s var(--ease-out)'

/**
 * MoleScale: the counting analogy that scales. Five Steps move from a dozen
 * eggs, to a ream of paper, to a log scale that places the mole, then to one
 * mole of three substances side by side, and finally to their equal counts.
 * Each group fades to its target opacity for the Step, so the picture
 * cross-fades rather than jumps.
 */
export function MoleScale({ step, reducedMotion }: MoleScaleProps) {
  const targets = targetsForMoleScaleStep(step)
  const transition = reducedMotion ? 'none' : ANIMATED_TRANSITION
  const group = (opacity: number, children: ReactNode, label: string) => (
    <g
      style={{ opacity, transition } as CSSProperties}
      data-group={label}
      data-visible={opacity > 0.5 ? 'true' : 'false'}
    >
      {children}
    </g>
  )

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.svg}
        role="img"
        aria-label="Counting analogy: a dozen eggs, a ream of paper, a logarithmic scale that places the mole, one mole of water, sodium chloride and carbon with different masses but the same number of particles"
        data-testid="mole-scale"
        data-step={clampMoleScaleStep(step)}
      >
        {group(targets.dozen, <DozenEggs />, 'dozen')}
        {group(targets.ream, <Ream />, 'ream')}
        {group(targets.scale, <LogScale />, 'scale')}
        {group(targets.vessels, <OneMoleVessels />, 'vessels')}
        {group(targets.counts, <CountTags />, 'counts')}
      </svg>
    </div>
  )
}

function DozenEggs() {
  const eggs = EGG_ROWS.flatMap((y) => EGG_COLUMNS.map((x) => ({ x, y })))
  return (
    <g>
      {eggs.map((egg, i) => (
        <ellipse
          key={i}
          cx={egg.x}
          cy={egg.y}
          rx={EGG.rx}
          ry={EGG.ry}
          className={styles.egg}
        />
      ))}
      <Label x={320} y={372} fontSize={22} fill="var(--fg)">
        1 dozen = 12 eggs
      </Label>
    </g>
  )
}

function Ream() {
  const sheets = Array.from({ length: 10 }, (_, i) => i)
  return (
    <g>
      {sheets.map((i) => (
        <rect
          key={i}
          x={200 + i * 1.5}
          y={150 + i * 9}
          width={240}
          height={170}
          rx={4}
          className={styles.sheet}
        />
      ))}
      <Label x={320} y={418} fontSize={22} fill="var(--fg)">
        1 ream = 500 sheets
      </Label>
      <Label x={320} y={448} fontSize={16}>
        drawn here as a stack of 10 sheets
      </Label>
    </g>
  )
}

function LogScale() {
  const ticks = Array.from({ length: LOG_SCALE_DECADES / TICK_EVERY_DECADES + 1 }, (_, i) => i * TICK_EVERY_DECADES)
  const dozen = xForScale(logScaleFraction(12))
  const ream = xForScale(logScaleFraction(500))
  const mole = xForScale(logScaleFraction(AVOGADRO))
  return (
    <g>
      <line x1={AXIS.left} x2={AXIS.right} y1={AXIS.y} y2={AXIS.y} className={styles.axis} />
      {ticks.map((exp) => {
        const x = xForScale(exp / LOG_SCALE_DECADES)
        return (
          <g key={exp}>
            <line x1={x} x2={x} y1={AXIS.y - 6} y2={AXIS.y + 6} className={styles.axis} />
            <Label x={x} y={AXIS.y + 26} fontSize={16}>
              10
              <tspan dy="-0.45em" fontSize="0.75em">
                {exp}
              </tspan>
            </Label>
          </g>
        )
      })}
      <circle cx={dozen} cy={AXIS.y} r={9} className={styles.marker} />
      <circle cx={ream} cy={AXIS.y} r={9} className={styles.marker} />
      <circle cx={mole} cy={AXIS.y} r={9} className={styles.markerMole} />
      <Label x={dozen - 4} y={AXIS.y - 36} fontSize={18} textAnchor="start" fill="var(--fg)" halo>
        dozen (12)
      </Label>
      <Label x={ream} y={AXIS.y + 62} fontSize={18} textAnchor="start" fill="var(--fg)" halo>
        ream (500)
      </Label>
      <Label x={mole} y={AXIS.y - 36} fontSize={18} textAnchor="end" fill="var(--orbit-active)" halo>
        mole ({formatScientific(AVOGADRO)})
      </Label>
      <Label x={320} y={160} fontSize={18} fill="var(--fg)">
        Counts on a logarithmic scale
      </Label>
    </g>
  )
}

function OneMoleVessels() {
  return (
    <g>
      {ONE_MOLE_SUBSTANCES.map((substance, i) => {
        const x = VESSEL_X[i]
        const isWater = substance.formula === 'H2O'
        return (
          <g key={substance.formula}>
            <Vessel
              x={x}
              y={VESSEL_Y}
              width={VESSEL.width}
              height={VESSEL.height}
              level={isWater ? 0.7 : 0.4}
              liquid={isWater}
              variant="beaker"
            />
            <Label x={x} y={VESSEL_Y + VESSEL.height / 2 + 30} fontSize={18} fill="var(--fg)">
              {substance.label}
            </Label>
            <Label x={x} y={VESSEL_Y + VESSEL.height / 2 + 56} fontSize={18} fill="var(--fg)">
              {formulaLabel(substance.formula)}: {massOfOneMole(substance)} g
            </Label>
          </g>
        )
      })}
    </g>
  )
}

function CountTags() {
  const bracketY = 468
  const countText = formatScientific(AVOGADRO)
  const units = ['molecules', 'formula units', 'atoms']
  return (
    <g>
      {ONE_MOLE_SUBSTANCES.map((substance, i) => {
        const x = VESSEL_X[i]
        return (
          <g key={substance.formula}>
            <Label x={x} y={bracketY - 40} fontSize={20} fill="var(--orbit-active)">
              {countText}
            </Label>
            <Label x={x} y={bracketY - 16} fontSize={16}>
              {units[i]}
            </Label>
          </g>
        )
      })}
      <line x1={VESSEL_X[0] - 60} x2={VESSEL_X[2] + 60} y1={bracketY} y2={bracketY} className={styles.bracket} />
      <Label x={320} y={bracketY + 30} fontSize={20} fill="var(--fg)">
        equal numbers of particles
      </Label>
    </g>
  )
}

/** Subscript digits for formulas in SVG text, e.g. "H2O" becomes "H₂O". */
function formulaLabel(formula: string): string {
  const subscripts = '₀₁₂₃₄₅₆₇₈₉'
  return formula.replace(/\d/g, (digit) => subscripts[Number(digit)])
}
