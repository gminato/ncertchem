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

// Sized for a ~570 px visual panel. Symbols are 28 units, so the pair spans about two thirds of the width.
const VIEW_WIDTH = 560
const VIEW_HEIGHT = 380
const CENTRE_Y = 190
/** Atom centres in panel units. Na sits left of centre and the bracketed Cl⁻ right of it. */
const NA = { x: 135, y: CENTRE_Y }
const CL = { x: 420, y: CENTRE_Y }
const SYMBOL_FONT = 28
const DOT_RADIUS = 3
/** Lone pairs sit clear of the symbol, and the ion brackets pad out to their dots. */
const LONE_PAIR_RADIUS = 12

/** One headline per Step, in the words the Learner reads on screen. */
const HEADLINES: readonly string[] = [
  'Na is one electron past neon. Cl is one short of argon.',
  'The sodium electron moves across to chlorine.',
  'Both ions now have a noble-gas configuration.',
  'Opposite charges attract: this is the ionic bond.',
]

/** The sign drawn on the bracketed chloride ion, at a size the brackets can carry. */
const MINUS = (
  <tspan fontSize={22} dy="-4">
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
      x: NA.x,
      y: NA.y,
      lonePairs: 0,
      unpaired: frame.sodiumDot ? 1 : 0,
      ionCharge: frame.transferred ? '+' : undefined,
      pairOrigins: [],
    },
    {
      id: 'cl',
      element: 'Cl',
      x: CL.x,
      y: CL.y,
      lonePairs: frame.transferred ? 4 : 3,
      unpaired: frame.transferred ? 0 : 1,
      // The transferred electron is one dot of the fourth pair, coloured as sodium's own dot is.
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
  const captionY = CENTRE_Y + 104
  const noteY = CENTRE_Y + 128
  // The attraction arrow runs between the two ions, stopping short of the symbol and the bracket.
  const arrowFrom = NA.x + 40
  const arrowTo = CL.x - 54

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
        <Label x={VIEW_WIDTH / 2} y={58} fontSize={17} fill="var(--fg)">
          {headline}
        </Label>

        <LewisDiagram
          key={`frame-${s}`}
          className={fadeClass}
          atoms={atoms}
          bonds={[]}
          brackets={brackets}
          transfer={transfer}
          colourByOrigin
          fontSize={SYMBOL_FONT}
          dotRadius={DOT_RADIUS}
          lonePairRadius={LONE_PAIR_RADIUS}
        />

        {frame.attraction && (
          <g data-testid="kossel-attraction">
            <line
              x1={arrowFrom}
              y1={NA.y}
              x2={arrowTo}
              y2={NA.y}
              strokeWidth={1.6}
              style={{ stroke: 'var(--accent)' }}
            />
            <path d={`M${arrowFrom},${NA.y} l9,-5 v10 Z`} style={{ fill: 'var(--accent)' }} />
            <path d={`M${arrowTo},${NA.y} l-9,-5 v10 Z`} style={{ fill: 'var(--accent)' }} />
            <Label x={(NA.x + CL.x) / 2} y={NA.y - 40} fontSize={16} fill="var(--accent)">
              electrostatic attraction
            </Label>
          </g>
        )}

        <Label x={NA.x} y={captionY} fontSize={18} fill="var(--fg)">
          {captions.na}
        </Label>
        <Label x={NA.x} y={noteY} fontSize={16} fill="var(--fg-muted)">
          {captions.naNote}
        </Label>
        <Label x={CL.x} y={captionY} fontSize={18} fill="var(--fg)">
          {captions.cl}
        </Label>
        <Label x={CL.x} y={noteY} fontSize={16} fill="var(--fg-muted)">
          {captions.clNote}
        </Label>
      </svg>
    </div>
  )
}
