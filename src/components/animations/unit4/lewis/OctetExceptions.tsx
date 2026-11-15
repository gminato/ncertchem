'use client'

import { Label } from '@/components/vocab'
import { LewisDiagram, type LewisAtom as DiagramAtom } from '@/components/molecule/LewisDiagram'
import type { LewisBondSpec } from '@/components/molecule/lewis-geometry'
import { applyFit, fitLayout, sectionStructure } from '@/lib/chem/lewis-learning'
import { OCTET_STEP_COUNT, octetFrame } from './lewis-steps'
import styles from './lewis.module.css'

export interface OctetExceptionsProps {
  step: number
  reducedMotion: boolean
}

// Sized for a ~570 px visual panel. Symbols are 28 units and the species box is about 60% of the width.
const VIEW_WIDTH = 560
const VIEW_HEIGHT = 430
const BOX = { width: 380, height: 330 }
const BOX_LEFT = (VIEW_WIDTH - BOX.width) / 2
const BOX_TOP = 64
/** Room around each atom's centre for its symbol, lone pairs and dots. */
const REACH = 34
const MAX_SCALE = 300
const SYMBOL_FONT = 28
const DOT_RADIUS = 3
const LONE_PAIR_RADIUS = 12

/**
 * The four octet exceptions of Section 4.1.5, one per Step: an incomplete octet (BeCl₂), a
 * second incomplete octet (BCl₃), an odd-electron molecule (NO) and an expanded octet (PCl₅).
 * The readout names the atom the Step is about and its electron count, in the accent colour.
 */
export function OctetExceptions({ step, reducedMotion }: OctetExceptionsProps) {
  const s = Math.min(OCTET_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const frame = octetFrame(s)
  const structure = sectionStructure(frame.key)

  const fit = fitLayout(
    structure.atoms.map((a) => ({ x: a.x, y: a.y })),
    BOX.width,
    BOX.height,
    REACH,
    MAX_SCALE
  )

  const atoms: DiagramAtom[] = structure.atoms.map((atom, i) => {
    const p = applyFit(fit, { x: atom.x, y: atom.y })
    return {
      id: `a${i}`,
      element: atom.element,
      x: p.x,
      y: p.y,
      lonePairs: atom.lonePairs,
      unpaired: atom.unpairedElectrons,
    }
  })
  const bonds: LewisBondSpec[] = structure.bonds.map((bond) => ({
    a: `a${bond.a}`,
    b: `a${bond.b}`,
    order: bond.order,
  }))

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.svg}
        role="img"
        aria-label={`${frame.label} as a Lewis structure. ${frame.readout}.`}
        data-testid="octet-exceptions"
        data-step={s}
        data-species={frame.key}
      >
        <Label x={24} y={40} fontSize={24} fill="var(--fg)" textAnchor="start">
          {frame.label}
        </Label>

        <g transform={`translate(${BOX_LEFT} ${BOX_TOP})`}>
          <LewisDiagram
            key={`species-${frame.key}`}
            className={reducedMotion ? undefined : styles.fadeIn}
            atoms={atoms}
            bonds={bonds}
            colourByOrigin={false}
            fontSize={SYMBOL_FONT}
            dotRadius={DOT_RADIUS}
            lonePairRadius={LONE_PAIR_RADIUS}
          />
        </g>

        <Label x={VIEW_WIDTH / 2} y={VIEW_HEIGHT - 16} fontSize={18} fill="var(--accent)">
          {frame.readout}
        </Label>
      </svg>
    </div>
  )
}
