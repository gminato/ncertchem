'use client'

import { Label } from '@/components/vocab'
import {
  LewisDiagram,
  type LewisAtom as DiagramAtom,
  type LewisBracket,
  type LewisTransfer,
} from '@/components/molecule/LewisDiagram'
import { kosselFrame, kosselShells, KOSSEL_STEP_COUNT } from './lewis-steps'
import styles from './lewis.module.css'

export interface KosselTransferProps {
  step: number
  reducedMotion: boolean
}

// Sized for a ~570 px visual panel: captions are 15 to 17 units and read at about 15 px.
const VIEW_WIDTH = 560
const VIEW_HEIGHT = 380
const CENTRE = { x: VIEW_WIDTH / 2, y: 190 }
/** Atom centres in layout units, before the diagram is scaled about CENTRE. */
const NA_LAYOUT = { x: 150, y: 190 }
const CL_LAYOUT = { x: 410, y: 190 }
/** The diagram is drawn larger than its default so the Lewis dots read at a glance. */
const DIAGRAM_SCALE = 1.3
/** The diagram's bond clearances are sized for its 16-unit default symbol font. */
const SYMBOL_FONT = 16
/** Lone pairs sit 19 units from the atom centre, clear of the ion brackets 24 units out. */
const LONE_PAIR_RADIUS = 10

/** A layout point mapped to its drawn position on the scaled diagram. */
function drawn(p: { x: number; y: number }): { x: number; y: number } {
  return {
    x: CENTRE.x + (p.x - CENTRE.x) * DIAGRAM_SCALE,
    y: CENTRE.y + (p.y - CENTRE.y) * DIAGRAM_SCALE,
  }
}

const NA = drawn(NA_LAYOUT)
const CL = drawn(CL_LAYOUT)

/** One headline per Step, in the words the Learner reads on screen. */
const HEADLINES: readonly string[] = [
  'Na is one electron past neon. Cl is one short of argon.',
  'The sodium electron moves across to chlorine.',
  'Both ions now have a noble-gas configuration.',
  'Opposite charges attract: this is the ionic bond.',
]

/** The sign drawn on the bracketed chloride ion, at a size the brackets can carry. */
const MINUS = (
  <tspan fontSize={18} dy="-3">
    −
  </tspan>
)

/**
 * Kössel's picture of NaCl: sodium gives its outer electron to chlorine, and each ion is left
 * with a noble-gas configuration. The Lewis dots come from LewisDiagram, and the shell counts
 * come from the configurations in the library.
 */
export function KosselTransfer({ step, reducedMotion }: KosselTransferProps) {
  const s = Math.min(KOSSEL_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const frame = kosselFrame(s)
  const shells = kosselShells()
  const shellText = (shell: number[]) => shell.join(', ')

  const atoms: DiagramAtom[] = [
    {
      id: 'na',
      element: 'Na',
      x: NA_LAYOUT.x,
      y: NA_LAYOUT.y,
      lonePairs: 0,
      unpaired: frame.sodiumDot ? 1 : 0,
      ionCharge: frame.transferred ? '+' : undefined,
      pairOrigins: [],
    },
    {
      id: 'cl',
      element: 'Cl',
      x: CL_LAYOUT.x,
      y: CL_LAYOUT.y,
      lonePairs: frame.transferred ? 4 : 3,
      unpaired: frame.transferred ? 0 : 1,
      pairOrigins: frame.transferred ? [null, null, null, 'na'] : [null, null, null],
    },
  ]
  const brackets: LewisBracket[] = frame.transferred ? [{ atoms: ['cl'], charge: MINUS }] : []
  const transfer: LewisTransfer | undefined = frame.arrow ? { from: 'na', to: 'cl' } : undefined

  const captions = frame.transferred
    ? {
        na: `Na⁺: ${shellText(shells.naIon)}`,
        naNote: 'the neon configuration',
        cl: `Cl⁻: ${shellText(shells.clIon)}`,
        clNote: 'the argon configuration',
      }
    : {
        na: `Na: ${shellText(shells.na)}`,
        naNote: 'one electron beyond neon',
        cl: `Cl: ${shellText(shells.cl)}`,
        clNote: 'one electron short of argon',
      }

  const headline = HEADLINES[s]
  const fadeClass = reducedMotion ? undefined : styles.fadeIn
  const captionY = CENTRE.y + 66
  const noteY = CENTRE.y + 92
  // The attraction arrow runs between the two ions, stopping short of the bracket and the symbol.
  const arrowFrom = NA.x + 30
  const arrowTo = CL.x - 42

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.svg}
        role="img"
        aria-label={`Sodium and chlorine atoms, shown as Lewis dots. ${headline}`}
        data-testid="kossel-transfer"
        data-step={s}
      >
        <Label x={VIEW_WIDTH / 2} y={60} fontSize={16} fill="var(--fg)">
          {headline}
        </Label>

        <g transform={`translate(${CENTRE.x} ${CENTRE.y}) scale(${DIAGRAM_SCALE}) translate(${-CENTRE.x} ${-CENTRE.y})`}>
          <LewisDiagram
            key={`frame-${s}`}
            className={fadeClass}
            atoms={atoms}
            bonds={[]}
            brackets={brackets}
            transfer={transfer}
            colourByOrigin
            fontSize={SYMBOL_FONT}
            dotRadius={2.2}
            pairHalfGap={2.8}
            lonePairRadius={LONE_PAIR_RADIUS}
          />
        </g>

        {frame.attraction && (
          <g data-testid="kossel-attraction">
            <line
              x1={arrowFrom}
              y1={NA.y}
              x2={arrowTo}
              y2={NA.y}
              strokeWidth={1.4}
              style={{ stroke: 'var(--accent)' }}
            />
            <path d={`M${arrowFrom},${NA.y} l8,-4 v8 Z`} style={{ fill: 'var(--accent)' }} />
            <path d={`M${arrowTo},${NA.y} l-8,-4 v8 Z`} style={{ fill: 'var(--accent)' }} />
            <Label x={(NA.x + CL.x) / 2} y={NA.y - 34} fontSize={15} fill="var(--accent)">
              electrostatic attraction
            </Label>
          </g>
        )}

        <Label x={NA.x} y={captionY} fontSize={17} fill="var(--fg)">
          {captions.na}
        </Label>
        <Label x={NA.x} y={noteY} fontSize={15} fill="var(--fg-muted)">
          {captions.naNote}
        </Label>
        <Label x={CL.x} y={captionY} fontSize={17} fill="var(--fg)">
          {captions.cl}
        </Label>
        <Label x={CL.x} y={noteY} fontSize={15} fill="var(--fg-muted)">
          {captions.clNote}
        </Label>
      </svg>
    </div>
  )
}
