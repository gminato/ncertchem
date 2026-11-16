import React, { forwardRef } from 'react'
import { CurvedArrow } from './CurvedArrow'
import { SkeletalFormula, skeletalFrame } from './SkeletalFormula'
import { AreniumIon, areniumAnchors } from './AreniumIon'
import { bondAnchor } from './arrows'
import { NITRONIUM, arenium, BENZENE_KEKULE_A, nitrobenzene } from './hydrocarbon-fixture'
import { stageAt, stageOpacity, unitClamp } from './hydrocarbon-geometry'

/** Size of the nitration mechanism strip, for a parent viewBox. */
export const EAS_MECHANISM_SIZE = { width: 900, height: 280 } as const

/** Bond length in px for every structure in the strip. */
const SCALE = 36
const CY = 116
/** Centres of benzene, the plus sign, NO₂⁺, the σ-complex and nitrobenzene. */
const X_BENZENE = 84
const X_PLUS = 170
const X_NITRONIUM = 262
const X_SIGMA = 468
const X_NITRO = 770
/** Centres of the three stage captions. */
const STAGE_CX = [172, X_SIGMA, X_NITRO] as const

export interface EASMechanismProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** 0 to 1: the three arrows are drawn in one after another, and each stage appears as it is reached. */
  progress?: number
  x?: number
  y?: number
}

function ReactionArrow({ x0, x1, y }: { x0: number; x1: number; y: number }) {
  return (
    <g>
      <line x1={x0} x2={x1 - 2} y1={y} y2={y} stroke="var(--fg-muted)" strokeWidth={2.2} />
      <path d={`M${x1 - 12},${y - 7} L${x1},${y} L${x1 - 12},${y + 7}`} fill="none" stroke="var(--fg-muted)" strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
    </g>
  )
}

/**
 * Electrophilic substitution, nitration of benzene, in three stages: the nitronium ion takes
 * electrons from the π cloud; the σ-complex forms, its H and the NO₂ on the sp³ carbon; and a
 * base removes H⁺ so the ring is restored. `progress` draws the arrows in order.
 */
export const EASMechanism = forwardRef<SVGGElement, EASMechanismProps>(function EASMechanism(
  { progress = 1, x = 0, y = 0, ...rest },
  ref
) {
  const p = unitClamp(progress)
  const a1 = unitClamp(p * 3)
  const a2 = unitClamp(p * 3 - 1)
  const a3 = unitClamp(p * 3 - 2)
  const stage = stageAt(p, 3).index

  const benzFrame = skeletalFrame(BENZENE_KEKULE_A, SCALE)
  const nitroFrame = skeletalFrame(NITRONIUM, SCALE)
  const anchors = areniumAnchors(arenium('NO2'), SCALE)

  // Stage 1: from the middle of a π bond in benzene to the nitrogen of NO₂⁺.
  const piMid = bondAnchor(benzFrame.points[0], benzFrame.points[1], 0.5)
  const from1 = { x: piMid.x + X_BENZENE, y: piMid.y + CY }
  const n = nitroFrame.points[1]
  const to1 = { x: n.x + X_NITRONIUM, y: n.y + CY }

  // Stage 2: the C–H bond feeds the ring, then a base takes the H.
  const ch = bondAnchor(anchors.C0, anchors.H, 0.5)
  const ringBond = anchors.bond01
  const base = anchors.base
  const H = anchors.H
  const at = (q: { x: number; y: number }, dx: number) => ({ x: q.x + dx, y: q.y + CY })

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
      {/* Stage 1: benzene + NO₂⁺ */}
      <g opacity={stageOpacity(p, 3, 0)}>
        <g transform={`translate(${X_BENZENE}, ${CY})`}>
          <SkeletalFormula graph={BENZENE_KEKULE_A} scale={SCALE} />
        </g>
        <text x={X_PLUS} y={CY} textAnchor="middle" dominantBaseline="central" fontSize={24} fontFamily="var(--font-sans)" fill="var(--fg)">
          +
        </text>
        <g transform={`translate(${X_NITRONIUM}, ${CY})`}>
          <SkeletalFormula graph={NITRONIUM} scale={SCALE} />
        </g>
      </g>
      <CurvedArrow from={from1} to={to1} bend={-0.35} progress={a1} gap={6} />

      <ReactionArrow x0={318} x1={358} y={CY} />

      {/* Stage 2: the σ-complex, with the two arrows that re-form the ring */}
      <g opacity={stageOpacity(p, 3, 1)}>
        <AreniumIon electrophile="NO2" scale={SCALE} x={X_SIGMA} y={CY} />
        <CurvedArrow from={at(ch, X_SIGMA)} to={at(ringBond, X_SIGMA)} bend={0.4} progress={a2} gap={4} />
        <CurvedArrow from={at(base, X_SIGMA)} to={at(H, X_SIGMA)} bend={0.35} progress={a3} gap={12} />
        <text x={at(base, X_SIGMA).x} y={at(base, X_SIGMA).y} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
          B:
        </text>
      </g>

      <ReactionArrow x0={600} x1={640} y={CY} />

      {/* Stage 3: nitrobenzene, the ring restored */}
      <g opacity={stageOpacity(p, 3, 2)}>
        <g transform={`translate(${X_NITRO}, ${CY})`}>
          <SkeletalFormula graph={nitrobenzene()} scale={SCALE} />
        </g>
        <text x={X_NITRO} y={CY + 84} textAnchor="middle" dominantBaseline="central" fontSize={18} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
          + H–B⁺
        </text>
      </g>

      {/* Stage captions: the current stage is in full ink */}
      {[
        ['1', 'The π cloud attacks NO₂⁺'],
        ['2', 'σ-complex: aromaticity is lost'],
        ['3', 'Base removes H⁺: ring restored'],
      ].map(([num, text], i) => (
        <text
          key={`cap-${i}`}
          x={STAGE_CX[i]}
          y={CY + 130}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={16}
          fontFamily="var(--font-sans)"
          fill={i === stage ? 'var(--fg)' : 'var(--fg-muted)'}
          opacity={i === stage ? 1 : 0.75}
        >
          {`${num}  ${text}`}
        </text>
      ))}
    </g>
  )
})
