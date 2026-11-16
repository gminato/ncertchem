'use client'

import { useId } from 'react'
import { PiBondOrbitals, SkeletalFormula } from '@/components/organic'
import { useStepTween } from '@/components/animations/unit4/vbt/useStepTween'
import { alkeneStep, BUTENE_VERDICT, C4H8_ISOMERS, butene } from './alkene-steps'
import { subscriptDigits, IsomerDrawing, ISOMER_SCALE, NCERT_CIS_DIPOLE_D } from './alkene-draw'
import type { AlkeneIsomer } from '@/lib/chem/alkene-geometry'

export interface AlkeneStructureProps {
  step: number
  reducedMotion: boolean
}

const PI_SCALE = 2.2
const CENTRE = { x: 290, y: 200 }

/** The sigma framework and pi cloud of ethene, seen from above at a slant (the lib's PiBondOrbitals). */
function FrameView({ merge }: { merge: number }) {
  return (
    <g transform={`translate(${CENTRE.x} ${CENTRE.y - 4}) scale(${PI_SCALE})`}>
      <PiBondOrbitals molecule="ethene" merge={merge} showAngles={false} />
    </g>
  )
}

/**
 * The end-on picture: the two p orbitals of the C=C, drawn as lobes above and below each carbon.
 * The right carbon's lobes turn about the C=C axis by `twist` degrees. Parallel lobes overlap
 * sideways; perpendicular lobes do not, so the pi bond is broken.
 */
function EndOnView({ twist }: { twist: number }) {
  const left = { x: 254, y: 200 }
  const right = { x: 326, y: 200 }
  const lobe = (cx: number, cy: number, key: string, fill: string) => (
    <g key={key}>
      <ellipse cx={cx} cy={cy - 80} rx={36} ry={62} fill={fill} fillOpacity={0.3} stroke={fill} strokeWidth={2.5} />
      <ellipse cx={cx} cy={cy + 80} rx={36} ry={62} fill={fill} fillOpacity={0.3} stroke={fill} strokeWidth={2.5} />
    </g>
  )
  return (
    <g>
      {lobe(left.x, left.y, 'left', 'var(--pi-lobe)')}
      <g transform={`rotate(${twist} ${right.x} ${right.y})`}>{lobe(right.x, right.y, 'right', 'var(--highlight)')}</g>
      <circle cx={left.x} cy={left.y} r={13} fill="var(--sigma-bond)" stroke="var(--surface)" strokeWidth={2} />
      <circle cx={right.x} cy={right.y} r={13} fill="var(--sigma-bond)" stroke="var(--surface)" strokeWidth={2} />
      <text x={CENTRE.x} y={CENTRE.y - 176} textAnchor="middle" fontSize={18} fontWeight={600} fill="var(--fg)" fontFamily="var(--font-sans)">
        {twist === 0 ? 'Parallel: the sideways overlap is the π bond' : 'Perpendicular: no overlap, no π bond'}
      </text>
    </g>
  )
}

/** Three C4H8 alkenes, each drawn from its SMILES and named by the lib. */
function IsomerRow() {
  const xs = [102, 290, 478]
  return (
    <g>
      {C4H8_ISOMERS.map((iso, k) => (
        <g key={iso.smiles}>
          <SkeletalFormula graph={iso.graph} scale={ISOMER_SCALE} x={xs[k]} y={CENTRE.y - 36} />
          <text x={xs[k]} y={CENTRE.y + 104} textAnchor="middle" fontSize={17} fontWeight={600} fill="var(--fg)" fontFamily="var(--font-sans)">
            {iso.name}
          </text>
          <text x={xs[k]} y={CENTRE.y + 128} textAnchor="middle" fontSize={15} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
            {subscriptDigits(iso.formula)}
          </text>
        </g>
      ))}
    </g>
  )
}

function ButeneRow({ tipId }: { tipId: string }) {
  const cis = butene('cis')
  const trans = butene('trans')
  if (!cis || !trans || !BUTENE_VERDICT.exists) return null
  const note = (i: AlkeneIsomer) =>
    i.polar
      ? `net dipole, NCERT: ${NCERT_CIS_DIPOLE_D} D`
      : 'no net dipole: the dipoles cancel'
  return (
    <g>
      <IsomerDrawing placed={cis.placed} dipole={cis.dipole} polar={cis.polar} title={cis.name} note={note(cis)} cx={150} cy={146} tipId={tipId} />
      <IsomerDrawing placed={trans.placed} dipole={trans.dipole} polar={trans.polar} title={trans.name} note={note(trans)} cx={430} cy={146} tipId={tipId} />
    </g>
  )
}

/**
 * The double-bond Scrolly: the sigma framework and pi cloud of ethene, the end-on twist that breaks
 * the pi overlap, the C4H8 isomers, and the cis and trans forms of but-2-ene with dipole arrows.
 * The drawings are tweened between steps; reduced motion cuts straight to each target.
 */
export function AlkeneStructure({ step, reducedMotion }: AlkeneStructureProps) {
  const id = useId().replace(/:/g, '')
  const current = alkeneStep(step)
  const eased = useStepTween({ merge: current.merge, twist: current.twist }, reducedMotion)

  return (
    <svg viewBox="0 0 580 400" role="img" aria-label={`Alkene structure. ${current.caption}`} data-step={Math.round(step)}>
      <defs>
        <marker id={`${id}-tip`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--dipole)" />
        </marker>
      </defs>
      {current.view === 'frame' && <FrameView merge={eased.merge} />}
      {current.view === 'end-on' && <EndOnView twist={eased.twist} />}
      {current.view === 'isomers' && <IsomerRow />}
      {current.view === 'geometry' && <ButeneRow tipId={`${id}-tip`} />}
      <text x={CENTRE.x} y={384} textAnchor="middle" fontSize={15} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
        {current.caption}
      </text>
    </svg>
  )
}
