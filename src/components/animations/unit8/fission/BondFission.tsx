'use client'

import type { ReactNode } from 'react'
import { CurvedArrow, IntermediateOrbital, SkeletalFormula, ease, skeletalFrame, type Point } from '@/components/organic'
import { findBond } from '@/lib/chem/arrow-push'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import { useTweenedNumber } from '../../unit5/gibbs/useTweenedNumber'
import { INTACT_SMILES, fissionPoses, ladderRows, type BondPose, type FissionPose, type LadderRow } from './fission-steps'

export interface BondFissionProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 580
const VIEW_HEIGHT = 440
const POSES = fissionPoses()
const CATION_ROWS = ladderRows('carbocation')
const RADICAL_ROWS = ladderRows('radical')

/** The intact molecule, drawn at a bond length that fills the panel. */
const MOL_SCALE = 165
const MOL_T = { x: VIEW_WIDTH / 2, y: 205 }
/** The bond that breaks is drawn with its fragments at this centre. */
const BOND_T = { x: VIEW_WIDTH / 2, y: 205 }
const HALF_BOND = 70
const SEPARATION = 130
/** The intermediate is scaled so its drawing fills about two thirds of the panel width. */
const ORBITAL_T = { x: VIEW_WIDTH / 2, y: 218, s: 1.6 }

/** A label whose last character is a charge or a dot is drawn with that mark raised, after its atom. */
function chemText(text: string, raised: boolean): ReactNode {
  const last = text.slice(-1)
  if (!raised || !'⁺⁻•'.includes(last)) return text
  return (
    <>
      {text.slice(0, -1)}
      <tspan baselineShift="super" fontSize={17} fontWeight={600} dx={1}>
        {last}
      </tspan>
    </>
  )
}

function Title({ text }: { text: string }) {
  return (
    <text x={VIEW_WIDTH / 2} y={28} textAnchor="middle" fontSize={17} fontWeight={600} fill="var(--fg)" fontFamily="var(--font-sans)">
      {text}
    </text>
  )
}

function Caption({ text, y }: { text: string; y: number }) {
  return (
    <text x={0} y={y} textAnchor="middle" fontSize={15} fontWeight={500} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
      {text}
    </text>
  )
}

/** The intact 2-bromopropane: the C–Br bond is highlighted and carries its shared pair. */
function IntactMolecule({ title }: { title: string }) {
  const graph = parseSmiles(INTACT_SMILES)
  const bond = findBond(graph, ['C', 'Br'])
  const frame = skeletalFrame(graph, MOL_SCALE)
  const b = graph.bonds[bond]
  const p = frame.points[b.a]
  const q = frame.points[b.b]
  const mid = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }
  const len = Math.hypot(q.x - p.x, q.y - p.y) || 1
  const n = { x: -(q.y - p.y) / len, y: (q.x - p.x) / len }
  const dot = (c: Point, key: string) => <circle key={key} cx={c.x} cy={c.y} r={4} fill="var(--fg)" />
  const pair = (
    <g>
      {dot({ x: mid.x + n.x * 9, y: mid.y + n.y * 9 }, 'a')}
      {dot({ x: mid.x - n.x * 9, y: mid.y - n.y * 9 }, 'b')}
    </g>
  )
  return (
    <g>
      <Title text={title} />
      <g transform={`translate(${MOL_T.x}, ${MOL_T.y})`}>
        <SkeletalFormula graph={graph} scale={MOL_SCALE} highlightBonds={[bond]} overlay={pair} />
      </g>
      <text x={VIEW_WIDTH / 2} y={370} textAnchor="middle" fontSize={15} fontWeight={500} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        The highlighted C–Br bond holds two electrons, one from each atom
      </text>
    </g>
  )
}

/** A bond breaking. The fragments carry their charges or dots only once the bond has broken. */
function BondBreak({ pose, progress }: { pose: BondPose; progress: number }) {
  const e = ease(progress)
  const xl = -HALF_BOND - e * SEPARATION * 0.5
  const xr = HALF_BOND + e * SEPARATION * 0.5
  const bondOpacity = 1 - e * (1 - 0.22)
  const broken = progress >= 0.98
  const heterolytic = pose.mode === 'heterolytic'
  return (
    <g>
      <Title text={pose.title} />
      <g transform={`translate(${BOND_T.x}, ${BOND_T.y})`}>
        <line x1={-HALF_BOND} y1={0} x2={HALF_BOND} y2={0} stroke="var(--fg)" strokeWidth={2.8} strokeLinecap="round" opacity={bondOpacity} />
        <text x={xl + 6} y={0} textAnchor="end" dominantBaseline="central" fontSize={24} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
          {chemText(pose.left, broken)}
        </text>
        <text x={xr - 6} y={0} textAnchor="start" dominantBaseline="central" fontSize={24} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
          {chemText(pose.right, broken)}
        </text>
        {heterolytic ? (
          <CurvedArrow from={{ x: 0, y: 0 }} to={{ x: xr - 12, y: -34 }} bend={-0.35} kind="pair" progress={progress} gap={2} />
        ) : (
          <g>
            <CurvedArrow from={{ x: 0, y: 0 }} to={{ x: xl + 10, y: -34 }} bend={0.35} kind="radical" progress={progress} gap={2} />
            <CurvedArrow from={{ x: 0, y: 0 }} to={{ x: xr - 10, y: -34 }} bend={-0.35} kind="radical" progress={progress} gap={2} />
          </g>
        )}
        <Caption text={pose.caption} y={70} />
      </g>
    </g>
  )
}

/** The stability ladder for carbocations and radicals. Each species is a labelled condensed formula. */
function Ladder({ title }: { title: string }) {
  const rows = CATION_ROWS.map((row, i) => ({ cation: row, radical: RADICAL_ROWS[i] }))
  const top = 70
  const rowH = 84
  const header = (x: number, text: string) => (
    <text x={x} y={56} textAnchor="middle" fontSize={14} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
      {text}
    </text>
  )
  const species = (row: LadderRow, x: number, cy: number) => (
    <text x={x} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={600} fill="var(--fg)" fontFamily="var(--font-sans)">
      {chemText(row.label, true)}
    </text>
  )
  return (
    <g>
      <Title text={title} />
      <text x={24} y={56} fontSize={14} fill="var(--fg-muted)" fontFamily="var(--font-sans)">Substituent</text>
      {header(226, 'Carbocation')}
      {header(384, 'Radical')}
      {header(530, 'α-H · alkyl')}
      {rows.map(({ cation, radical }, i) => {
        const cy = top + i * rowH + rowH / 2
        return (
          <g key={cation.id} data-row={cation.id}>
            {i > 0 && <line x1={20} y1={top + i * rowH} x2={VIEW_WIDTH - 20} y2={top + i * rowH} stroke="var(--border)" strokeWidth={1} />}
            <text x={24} y={cy} dominantBaseline="central" fontSize={17} fontWeight={600} fill="var(--fg)" fontFamily="var(--font-sans)">
              {cation.degree}
            </text>
            {species(cation, 226, cy)}
            {species(radical, 384, cy)}
            <text x={530} y={cy - 9} textAnchor="middle" dominantBaseline="central" fontSize={16} fill="var(--fg)" fontFamily="var(--font-sans)">
              {`${cation.alphaH} α-H`}
            </text>
            <text x={530} y={cy + 13} textAnchor="middle" dominantBaseline="central" fontSize={16} fill="var(--fg)" fontFamily="var(--font-sans)">
              {`${cation.alkylGroups} alkyl`}
            </text>
          </g>
        )
      })}
      <text x={VIEW_WIDTH / 2} y={VIEW_HEIGHT - 16} textAnchor="middle" fontSize={13} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
        α-H: hydrogens on the neighbouring carbons. Alkyl: carbons on the centre.
      </text>
    </g>
  )
}

function Drawing({ pose, progress }: { pose: FissionPose; progress: number }) {
  if (pose.view === 'molecule') return <IntactMolecule title={pose.title} />
  if (pose.view === 'bond') return <BondBreak pose={pose} progress={progress} />
  if (pose.view === 'orbital') {
    return (
      <g>
        <Title text={pose.title} />
        <g transform={`translate(${ORBITAL_T.x}, ${ORBITAL_T.y}) scale(${ORBITAL_T.s})`}>
          <IntermediateOrbital kind={pose.kind} scale={80} />
        </g>
      </g>
    )
  }
  return <Ladder title={pose.title} />
}

/**
 * The fission Scrolly: the intact molecule, the C–Br bond breaking heterolytically (charges on the
 * fragments), the carbocation and carbanion it leaves, the same bond breaking homolytically (dots),
 * and the stability ladder from the lib. The bond tweens from intact to broken between Steps.
 */
export function BondFission({ step, reducedMotion }: BondFissionProps) {
  const index = Math.min(POSES.length - 1, Math.max(0, Math.round(step)))
  const pose = POSES[index]
  const bondTarget = pose.view === 'bond' ? pose.progress : 0
  const progress = useTweenedNumber(bondTarget, reducedMotion, 1.2)
  const shown = pose.view === 'bond' ? progress : 0
  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={`${pose.view === 'bond' ? pose.title : POSES[index].view === 'molecule' ? 'One covalent C–Br bond' : pose.view}.`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-testid="bond-fission-scene"
      data-step={index}
      data-view={pose.view}
    >
      <Drawing pose={pose} progress={shown} />
    </svg>
  )
}
