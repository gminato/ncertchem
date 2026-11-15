'use client'

import { SkeletalFormula, Wedge3D } from '@/components/organic'
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
            <g transform="translate(290 220) scale(1.5)">
              <Wedge3D captions={false} />
            </g>
            <Label x={290} y={370} fontSize={18} fill="var(--fg)">
              {subscriptDigits(ms[0].formula)}
            </Label>
            <Label x={290} y={396} fontSize={17} fill="var(--fg-muted)">
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
