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

// Sized for a ~570 px visual panel: the species name is 22 units and the readout 15.
const VIEW_WIDTH = 560
const VIEW_HEIGHT = 400
const DIAGRAM_BOX = { x: 0, y: 64, width: VIEW_WIDTH, height: 300 }
const PADDING = 40
const MAX_SCALE = 110
/** The diagram's bond clearances are sized for its 16-unit default symbol font. */
const SYMBOL_FONT = 16

/**
 * The four octet exceptions of Section 4.1.5, one per Step: an incomplete octet (BeCl₂), a
 * second incomplete octet (BCl₃), an odd-electron molecule (NO) and an expanded octet (PCl₅).
 * Each Step points at the focus atom and reads its electron count from the octet check.
 */
export function OctetExceptions({ step, reducedMotion }: OctetExceptionsProps) {
  const s = Math.min(OCTET_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const frame = octetFrame(s)
  const structure = sectionStructure(frame.key)

  const fit = fitLayout(
    structure.atoms.map((a) => ({ x: a.x, y: a.y })),
    DIAGRAM_BOX.width,
    DIAGRAM_BOX.height,
    PADDING,
    MAX_SCALE
  )

  const placed = structure.atoms.map((atom, i) => ({
    atom,
    p: applyFit(fit, { x: atom.x, y: atom.y }),
    id: `a${i}`,
  }))
  const atoms: DiagramAtom[] = placed.map(({ atom, p, id }) => ({
    id,
    element: atom.element,
    x: p.x,
    y: DIAGRAM_BOX.y + p.y,
    lonePairs: atom.lonePairs,
    unpaired: atom.unpairedElectrons,
  }))
  const bonds: LewisBondSpec[] = structure.bonds.map((bond) => ({
    a: `a${bond.a}`,
    b: `a${bond.b}`,
    order: bond.order,
  }))

  const focus = placed[frame.focusIndex]
  const focusX = focus.p.x
  const focusY = DIAGRAM_BOX.y + focus.p.y

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
        <Label x={24} y={40} fontSize={22} fill="var(--fg)" textAnchor="start">
          {frame.label}
        </Label>

        <LewisDiagram
          key={`species-${frame.key}`}
          className={reducedMotion ? undefined : styles.fadeIn}
          atoms={atoms}
          bonds={bonds}
          colourByOrigin={false}
          fontSize={SYMBOL_FONT}
          dotRadius={2.2}
          pairHalfGap={2.8}
          lonePairRadius={10}
        />

        <circle
          cx={focusX}
          cy={focusY}
          r={34}
          className={styles.focusRing}
          data-testid="octet-focus"
        />

        <Label x={VIEW_WIDTH / 2} y={384} fontSize={16} fill="var(--accent)">
          {frame.readout}
        </Label>
      </svg>
    </div>
  )
}
