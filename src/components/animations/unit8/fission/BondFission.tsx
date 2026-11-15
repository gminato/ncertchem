'use client'

import { BondCleavage, IntermediateOrbital, SkeletalFormula } from '@/components/organic'
import { useTweenedNumber } from '../../unit5/gibbs/useTweenedNumber'
import { fissionPoses, ladderRows, type FissionPose, type LadderRow } from './fission-steps'

export interface BondFissionProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 580
const VIEW_HEIGHT = 440
const POSES = fissionPoses()
const CATION_ROWS = ladderRows('carbocation')
const RADICAL_ROWS = ladderRows('radical')

/** The bond is drawn at native size, centred under the title. */
const BOND_T = { x: VIEW_WIDTH / 2, y: 215 }
/** The intermediate is scaled so its drawing fills about two thirds of the panel width. */
const ORBITAL_T = { x: VIEW_WIDTH / 2, y: 218, s: 1.6 }

function Title({ text }: { text: string }) {
  return (
    <text x={VIEW_WIDTH / 2} y={28} textAnchor="middle" fontSize={17} fontWeight={600} fill="var(--fg)" fontFamily="var(--font-sans)">
      {text}
    </text>
  )
}

/** The stability ladder for carbocations and radicals, one row per species, most stable first. */
function Ladder({ title }: { title: string }) {
  const rows = CATION_ROWS.map((row, i) => ({ cation: row, radical: RADICAL_ROWS[i] }))
  const top = 70
  const rowH = 84
  return (
    <g>
      <Title text={title} />
      <text x={24} y={56} fontSize={14} fill="var(--fg-muted)" fontFamily="var(--font-sans)">Substituent</text>
      <text x={228} y={56} textAnchor="middle" fontSize={14} fill="var(--fg-muted)" fontFamily="var(--font-sans)">Carbocation</text>
      <text x={386} y={56} textAnchor="middle" fontSize={14} fill="var(--fg-muted)" fontFamily="var(--font-sans)">Radical</text>
      <text x={528} y={56} textAnchor="middle" fontSize={14} fill="var(--fg-muted)" fontFamily="var(--font-sans)">α-H · alkyl</text>
      {rows.map(({ cation, radical }, i) => {
        const cy = top + i * rowH + rowH / 2
        return (
          <g key={cation.id} data-row={cation.id}>
            {i > 0 && <line x1={20} y1={top + i * rowH} x2={VIEW_WIDTH - 20} y2={top + i * rowH} stroke="var(--border)" strokeWidth={1} />}
            <text x={24} y={cy} dominantBaseline="central" fontSize={17} fontWeight={600} fill="var(--fg)" fontFamily="var(--font-sans)">
              {cation.degree}
            </text>
            <g transform={`translate(228, ${cy})`}>
              <SkeletalFormula graph={cation.graph} scale={38} />
            </g>
            <g transform={`translate(386, ${cy})`}>
              <SkeletalFormula graph={radical.graph} scale={38} />
            </g>
            <text x={528} y={cy - 9} textAnchor="middle" dominantBaseline="central" fontSize={16} fill="var(--fg)" fontFamily="var(--font-sans)">
              {`${cation.alphaH} α-H`}
            </text>
            <text x={528} y={cy + 13} textAnchor="middle" dominantBaseline="central" fontSize={16} fill="var(--fg)" fontFamily="var(--font-sans)">
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
  if (pose.view === 'bond') {
    return (
      <g>
        <Title text={pose.title} />
        <g transform={`translate(${BOND_T.x}, ${BOND_T.y})`}>
          <BondCleavage
            kind={pose.mode}
            left={pose.left}
            right={pose.right}
            anionSide={pose.anionSide}
            progress={progress}
            data-testid="bond-cleavage"
          />
        </g>
      </g>
    )
  }
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
 * The fission Scrolly: a bond breaking heterolytically, the carbocation and carbanion it leaves,
 * the same bond breaking homolytically, and the stability ladder from the lib. Bond progress
 * tweens between Steps.
 */
export function BondFission({ step, reducedMotion }: BondFissionProps) {
  const index = Math.min(POSES.length - 1, Math.max(0, Math.round(step)))
  const pose = POSES[index]
  const bondTarget = pose.view === 'bond' ? pose.progress : 1
  const progress = useTweenedNumber(bondTarget, reducedMotion, 1.2)
  const shown = pose.view === 'bond' ? progress : 1
  const label = `${pose.title}.`

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={label}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-testid="bond-fission-scene"
      data-step={index}
      data-view={pose.view}
    >
      <Drawing pose={pose} progress={shown} />
    </svg>
  )
}
