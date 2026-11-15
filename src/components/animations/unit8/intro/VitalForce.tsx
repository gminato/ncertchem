'use client'

import { SkeletalFormula, stereoPath } from '@/components/organic'
import { Label, VocabDefs } from '@/components/vocab'
import { useReveal } from '@/components/animations/unit4/vbt/useStepTween'
import { subscriptDigits } from '@/lib/chem/carbon-shapes'
import { INTRO_STEP_COUNT, introStep, type IntroMolecule } from './vital-force-steps'

export interface VitalForceProps {
  step: number
  reducedMotion: boolean
}

/** Pixels per bond length for the single large molecule and for the three small ones. */
const LARGE = 74
const SMALL = 42

/** Lengths and angles of the methane drawing: 120 px bonds, two in the plane at 110° and two out of it. */
const TET_C = { x: 290, y: 190 }
const TET_LEN = 120
const TET_HALF = 6.5
const TET_DEG = (deg: number) => (deg * Math.PI) / 180

/**
 * Methane in the bond-line convention of NCERT's Figure 8.1: two C–H bonds in the plane of the
 * page, forming a V at about 110°, and a wedge and a dash splayed apart below them. The wedge
 * comes towards the reader and the dash goes away.
 */
function Tetrahedral() {
  const up = TET_DEG(55)
  const down = TET_DEG(35)
  const at = (sx: number, sy: number, len: number) => ({ x: TET_C.x + sx * len, y: TET_C.y + sy * len })
  const inPlaneL = at(-Math.sin(up), -Math.cos(up), TET_LEN)
  const inPlaneR = at(Math.sin(up), -Math.cos(up), TET_LEN)
  const wedgeEnd = at(-Math.sin(down), Math.cos(down), TET_LEN)
  const dashEnd = at(Math.sin(down), Math.cos(down), TET_LEN)
  const start = { x: TET_C.x, y: TET_C.y }
  /** Moves a point `by` units back along the bond towards C, so strokes stop short of the C label. */
  const shorten = (to: { x: number; y: number }, by: number) => {
    const d = Math.hypot(to.x - start.x, to.y - start.y)
    return { x: to.x - ((to.x - start.x) * by) / d, y: to.y - ((to.y - start.y) * by) / d }
  }
  const from = (to: { x: number; y: number }) => {
    const d = Math.hypot(to.x - start.x, to.y - start.y)
    return { x: start.x + ((to.x - start.x) * 13) / d, y: start.y + ((to.y - start.y) * 13) / d }
  }
  const label = (p: { x: number; y: number }, text: string) => (
    <Label x={p.x + (p.x - TET_C.x) * 0.16} y={p.y + (p.y - TET_C.y) * 0.16} fontSize={22} fill="var(--fg)" fontWeight={600}>
      {text}
    </Label>
  )
  return (
    <g data-testid="methane-tetrahedral">
      <line x1={from(inPlaneL).x} y1={from(inPlaneL).y} x2={shorten(inPlaneL, 18).x} y2={shorten(inPlaneL, 18).y} strokeWidth={2.6} strokeLinecap="round" style={{ stroke: 'var(--fg)' }} />
      <line x1={from(inPlaneR).x} y1={from(inPlaneR).y} x2={shorten(inPlaneR, 18).x} y2={shorten(inPlaneR, 18).y} strokeWidth={2.6} strokeLinecap="round" style={{ stroke: 'var(--fg)' }} />
      <path d={stereoPath(from(wedgeEnd), shorten(wedgeEnd, 18), 'wedge', TET_HALF)} fill="var(--fg)" stroke="var(--fg)" strokeWidth={0.8} strokeLinejoin="round" />
      <path d={stereoPath(from(dashEnd), shorten(dashEnd, 18), 'dash', TET_HALF)} fill="none" stroke="var(--fg)" strokeWidth={2} strokeLinejoin="round" />
      {label(inPlaneL, 'H')}
      {label(inPlaneR, 'H')}
      {label(wedgeEnd, 'H')}
      {label(dashEnd, 'H')}
      <Label x={TET_C.x} y={TET_C.y} fontSize={24} fill="var(--fg)" fontWeight={600}>
        C
      </Label>
    </g>
  )
}

/** The name line under a molecule: the common name when NCERT Table 8.1 gives one, then the IUPAC name. */
function nameLine(m: IntroMolecule): string {
  return m.common ? `${m.common} (IUPAC: ${m.iupac})` : m.iupac
}

/** A molecule drawn at (x, y), with its formula and name beneath it. */
function Specimen({ m, x, y, scale, nameSize = 15 }: { m: IntroMolecule; x: number; y: number; scale: number; nameSize?: number }) {
  return (
    <g>
      <SkeletalFormula graph={m.graph} x={x} y={y} scale={scale} />
      <Label x={x} y={y + 168} fontSize={18} fill="var(--fg)">
        {subscriptDigits(m.formula)}
      </Label>
      <Label x={x} y={y + 194} fontSize={nameSize} fill="var(--fg-muted)">
        {nameLine(m)}
      </Label>
    </g>
  )
}

/**
 * The vital-force Scrolly: urea from ammonium cyanate (1828), acetic acid (1845), methane
 * (1856), then carbon's chains, branches and rings. Each Step fades its molecules in; reduced
 * motion shows them at once.
 */
export function VitalForce({ step, reducedMotion }: VitalForceProps) {
  const index = Math.min(INTRO_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const current = introStep(index)
  const reveal = useReveal(index, reducedMotion)
  const ms = current.molecules

  return (
    <svg viewBox="0 0 580 440" role="img" aria-label={`${current.year}: ${current.title}. ${current.caption}`} style={{ width: '100%', height: 'auto', display: 'block' }} data-step={index}>
      <VocabDefs />
      <Label x={290} y={40} fontSize={24} fill="var(--fg)" data-testid="intro-year">
        {current.year}
      </Label>
      <Label x={290} y={70} fontSize={18} fill="var(--fg-muted)">
        {current.title}
      </Label>
      <g opacity={reveal}>
        {index === 0 && (
          <>
            <Label x={84} y={230} fontSize={22} fill="var(--fg)">
              NH₄CNO
            </Label>
            <Label x={84} y={258} fontSize={15} fill="var(--fg-muted)">
              ammonium cyanate
            </Label>
            <line x1={160} x2={290} y1={230} y2={230} strokeWidth={2.4} style={{ stroke: 'var(--fg-muted)' }} />
            <polygon points="278,224 290,230 278,236" style={{ fill: 'var(--fg-muted)' }} />
            <Label x={225} y={208} fontSize={15} fill="var(--fg-muted)">
              heat
            </Label>
            <Specimen m={ms[0]} x={436} y={230} scale={LARGE * 1.3} nameSize={17} />
          </>
        )}
        {index === 1 && <Specimen m={ms[0]} x={290} y={230} scale={LARGE * 1.15} nameSize={17} />}
        {index === 2 && (
          <>
            <Tetrahedral />
            <Label x={290} y={356} fontSize={18} fill="var(--fg)">
              {subscriptDigits(ms[0].formula)}
            </Label>
            <Label x={290} y={384} fontSize={17} fill="var(--fg-muted)">
              {nameLine(ms[0])}
            </Label>
          </>
        )}
        {index === 3 && (
          <>
            <Specimen m={ms[0]} x={114} y={230} scale={SMALL} />
            <Specimen m={ms[1]} x={290} y={230} scale={SMALL} />
            <Specimen m={ms[2]} x={466} y={230} scale={SMALL} />
          </>
        )}
      </g>
    </svg>
  )
}
