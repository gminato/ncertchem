'use client'

import type { ReactNode } from 'react'
import { benzeneExoAngle, benzeneVertices, deltaText } from '@/components/organic'
import type {
  PhenolStructureSpec,
  RingPosition,
  RingSubstituentSpec,
} from '@/lib/chem/c12-u7-s9-phenols'

const TONE_FILL: Record<NonNullable<RingSubstituentSpec['tone']>, string> = {
  o: 'var(--atom-o)',
  n: 'var(--atom-n)',
  hal: 'var(--atom-hal)',
  s: 'var(--atom-s)',
  na: 'var(--ion-cation)',
  c: 'var(--fg)',
}

const TAG_FILL: Record<NonNullable<PhenolStructureSpec['tagTone']>, string> = {
  accent: 'var(--accent)',
  muted: 'var(--fg-muted)',
  caution: 'var(--caution)',
  success: 'var(--success)',
}

function posIndex(pos: RingPosition): number {
  return pos - 1
}

function innerDoubleBond(
  p: { x: number; y: number },
  q: { x: number; y: number },
  offset: number,
  shrink = 0.16,
) {
  const dx = q.x - p.x
  const dy = q.y - p.y
  const len = Math.hypot(dx, dy) || 1
  let nx = -dy / len
  let ny = dx / len
  const mx = (p.x + q.x) / 2
  const my = (p.y + q.y) / 2
  if (nx * mx + ny * my > 0) {
    nx = -nx
    ny = -ny
  }
  return {
    x1: p.x + dx * shrink + nx * offset,
    y1: p.y + dy * shrink + ny * offset,
    x2: q.x - dx * shrink + nx * offset,
    y2: q.y - dy * shrink + ny * offset,
  }
}

export interface PhenolRingProps {
  spec: PhenolStructureSpec
  cx: number
  cy: number
  /** Circumradius of the hexagon in viewBox units. */
  radius?: number
  /** Show compound name (and optional subtitle) below the drawing. */
  showName?: boolean
  /** Vertical distance from ring centre to the name text (overrides auto calculation). */
  nameYOffset?: number
  /** Overall group opacity for step reveal. */
  opacity?: number
  /** Optional extra SVG elements in the ring's local coordinate system (centred at 0,0). */
  overlay?: ReactNode
}

/**
 * Renders a pointy-top aromatic ring, phenoxide, intermediate, or p-benzoquinone
 * matching NCERT Class 12 Section 7.4.4 conventions and theme tokens.
 */
export function PhenolRing({
  spec,
  cx,
  cy,
  radius = 36,
  showName = false,
  nameYOffset,
  opacity = 1,
  overlay,
}: PhenolRingProps) {
  const R = radius
  const verts = benzeneVertices(R)
  const bondLen = Math.max(18, R * 0.54)
  const bondStroke = Math.max(2, R * 0.068)
  const innerOffset = Math.max(6, R * 0.21)
  const subFont = R >= 46 ? 18 : R >= 34 ? 16 : 15
  const hasBottomSub = spec.substituents.some((s) => s.position === 4)
  const hasLeftSub = spec.substituents.some((s) => s.position === 5 || s.position === 6)
  const hasRightSub = spec.substituents.some((s) => s.position === 2 || s.position === 3)

  const doubleEdges: readonly number[] =
    spec.ringMode === 'kekule-a'
      ? [0, 2, 4]
      : spec.ringMode === 'kekule-b'
        ? [1, 3, 5]
        : spec.ringMode === 'quinone'
          ? [1, 4]
          : []

  const autoNameOffset = hasBottomSub ? R + bondLen + 38 : R + 28
  const finalNameOffset = nameYOffset ?? autoNameOffset

  // Bracket extents for Reimer-Tiemann / ionic intermediates
  const brLeft = -(R * 0.866 + (hasLeftSub ? bondLen + 36 : 16))
  const brRight = R * 0.866 + (hasRightSub ? bondLen + 68 : 18)
  const brTop = -(R + bondLen + 22)
  const brBottom = R + (hasBottomSub ? bondLen + 20 : 12)

  return (
    <g transform={`translate(${cx}, ${cy})`} opacity={opacity}>
      {/* Activated site highlight halos */}
      {spec.highlightPositions?.map((pos) => {
        const v = verts[posIndex(pos)]
        return (
          <circle
            key={`hi-${pos}`}
            cx={v.x}
            cy={v.y}
            r={R * 0.31}
            fill="var(--highlight)"
          />
        )
      })}

      {/* Outer hexagon edges */}
      {verts.map((p, i) => {
        const q = verts[(i + 1) % 6]
        return (
          <line
            key={`edge-${i}`}
            x1={p.x}
            y1={p.y}
            x2={q.x}
            y2={q.y}
            stroke="var(--fg)"
            strokeWidth={bondStroke}
            strokeLinecap="round"
          />
        )
      })}

      {/* Aromatic circle or Kekule / quinone double bonds */}
      {spec.ringMode === 'circle' || spec.ringMode === 'hybrid' ? (
        <circle
          cx={0}
          cy={0}
          r={R * 0.56}
          fill="none"
          stroke={spec.ringMode === 'hybrid' ? 'var(--accent)' : 'var(--fg)'}
          strokeWidth={Math.max(1.8, bondStroke * 0.82)}
          strokeDasharray={spec.ringMode === 'hybrid' ? '5 4' : undefined}
        />
      ) : (
        doubleEdges.map((edgeIdx) => {
          const seg = innerDoubleBond(verts[edgeIdx], verts[(edgeIdx + 1) % 6], innerOffset)
          return (
            <line
              key={`dbl-${edgeIdx}`}
              x1={seg.x1}
              y1={seg.y1}
              x2={seg.x2}
              y2={seg.y2}
              stroke="var(--fg)"
              strokeWidth={Math.max(1.8, bondStroke * 0.82)}
              strokeLinecap="round"
            />
          )
        })
      )}

      {/* Exocyclic substituents */}
      {spec.substituents.map((sub) => {
        const v = verts[posIndex(sub.position)]
        const deg = benzeneExoAngle(sub.position)
        const rad = (deg * Math.PI) / 180
        const ux = Math.cos(rad)
        const uy = Math.sin(rad)
        const endX = v.x + ux * bondLen
        const endY = v.y + uy * bondLen
        const fill = sub.tone ? TONE_FILL[sub.tone] : 'var(--fg)'

        const isTop = sub.position === 1
        const isBottom = sub.position === 4
        const isRight = sub.position === 2 || sub.position === 3
        const anchor = isRight ? 'start' : isTop || isBottom ? 'middle' : 'end'

        const labelX = isTop || isBottom ? endX : endX + (isRight ? 6 : -6)
        const labelY = isTop ? endY - 12 : isBottom ? endY + 13 : endY

        // Double bond (=O in p-benzoquinone)
        const nx = -uy
        const ny = ux
        const dblGap = 3.2

        return (
          <g key={`sub-${sub.position}`}>
            {sub.bondOrder === 2 ? (
              <>
                <line
                  x1={v.x + nx * dblGap}
                  y1={v.y + ny * dblGap}
                  x2={endX + nx * dblGap}
                  y2={endY + ny * dblGap}
                  stroke="var(--fg)"
                  strokeWidth={bondStroke}
                  strokeLinecap="round"
                />
                <line
                  x1={v.x - nx * dblGap}
                  y1={v.y - ny * dblGap}
                  x2={endX - nx * dblGap}
                  y2={endY - ny * dblGap}
                  stroke="var(--fg)"
                  strokeWidth={bondStroke}
                  strokeLinecap="round"
                />
              </>
            ) : (
              <line
                x1={v.x}
                y1={v.y}
                x2={endX}
                y2={endY}
                stroke="var(--fg)"
                strokeWidth={bondStroke}
                strokeLinecap="round"
              />
            )}

            <text
              x={labelX}
              y={labelY}
              textAnchor={anchor}
              dominantBaseline="central"
              fontSize={subFont}
              fontWeight={600}
              fontFamily="var(--font-sans)"
              fill={fill}
            >
              {sub.label}
            </text>

            {/* Optional lone pairs on top oxygen (OH or ONa) */}
            {sub.lonePairs && sub.lonePairs > 0 && isTop ? (
              <g fill="var(--lone-pair-edge)">
                <circle cx={labelX - 20} cy={labelY - 4} r={2.3} />
                <circle cx={labelX - 20} cy={labelY + 4} r={2.3} />
                {sub.lonePairs > 1 ? (
                  <>
                    <circle cx={labelX - 5} cy={labelY - 14} r={2.3} />
                    <circle cx={labelX + 3} cy={labelY - 14} r={2.3} />
                  </>
                ) : null}
              </g>
            ) : null}

            {sub.charge && isTop ? (
              <text
                x={labelX + 20}
                y={labelY - 8}
                textAnchor="start"
                dominantBaseline="central"
                fontSize={15}
                fontWeight={700}
                fontFamily="var(--font-sans)"
                fill="var(--delta-minus)"
              >
                {sub.charge}
              </text>
            ) : null}
          </g>
        )
      })}

      {/* Partial negative/positive charges outside ring carbons */}
      {spec.ringCharges?.map((rc) => {
        const deg = benzeneExoAngle(rc.position)
        const rad = (deg * Math.PI) / 180
        const hasSubHere = spec.substituents.some((s) => s.position === rc.position)
        const rOut = hasSubHere ? R + bondLen + 26 : R + 16
        const angle = hasSubHere ? rad + 0.35 : rad
        const qx = rOut * Math.cos(angle)
        const qy = rOut * Math.sin(angle)
        const posCharge = rc.label.includes('+')
        return (
          <text
            key={`rc-${rc.position}`}
            x={qx}
            y={qy}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={15}
            fontWeight={700}
            fontFamily="var(--font-sans)"
            fill={posCharge ? 'var(--delta-plus)' : 'var(--delta-minus)'}
          >
            {deltaText(rc.label)}
          </text>
        )
      })}

      {/* Optional square brackets for Reimer-Tiemann intermediates */}
      {spec.bracketed ? (
        <g stroke="var(--fg-muted)" strokeWidth={2} fill="none" strokeLinecap="square">
          <path d={`M ${brLeft + 9} ${brTop} L ${brLeft} ${brTop} L ${brLeft} ${brBottom} L ${brLeft + 9} ${brBottom}`} />
          <path d={`M ${brRight - 9} ${brTop} L ${brRight} ${brTop} L ${brRight} ${brBottom} L ${brRight - 9} ${brBottom}`} />
        </g>
      ) : null}

      {overlay}

      {/* Optional name, subtitle, and NCERT tag */}
      {showName ? (
        <>
          <text
            x={0}
            y={finalNameOffset}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={15}
            fontWeight={600}
            fontFamily="var(--font-sans)"
            fill="var(--fg)"
          >
            {spec.name}
          </text>
          {spec.subtitle ? (
            <text
              x={0}
              y={finalNameOffset + 20}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={15}
              fontFamily="var(--font-sans)"
              fill="var(--fg-muted)"
            >
              {spec.subtitle}
            </text>
          ) : null}
          {spec.tag ? (
            <text
              x={0}
              y={finalNameOffset + (spec.subtitle ? 40 : 20)}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={15}
              fontWeight={600}
              fontStyle="italic"
              fontFamily="var(--font-sans)"
              fill={TAG_FILL[spec.tagTone ?? 'muted']}
            >
              {spec.tag}
            </text>
          ) : null}
        </>
      ) : null}
    </g>
  )
}

export interface ReactionArrowProps {
  x1: number
  x2: number
  y: number
  above?: string
  below?: string
  aboveTone?: string
  belowTone?: string
}

/** Clean reaction arrow with reagent above and condition/temperature below. */
export function ReactionArrow({
  x1,
  x2,
  y,
  above,
  below,
  aboveTone = 'var(--fg)',
  belowTone = 'var(--fg-muted)',
}: ReactionArrowProps) {
  const mid = (x1 + x2) / 2
  return (
    <g>
      <line x1={x1} y1={y} x2={x2 - 10} y2={y} stroke="var(--fg-muted)" strokeWidth={2.4} strokeLinecap="round" />
      <polygon points={`${x2},${y} ${x2 - 12},${y - 6} ${x2 - 12},${y + 6}`} fill="var(--fg-muted)" />
      {above ? (
        <text
          x={mid}
          y={y - 18}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={15}
          fontWeight={600}
          fontFamily="var(--font-sans)"
          fill={aboveTone}
        >
          {above}
        </text>
      ) : null}
      {below ? (
        <text
          x={mid}
          y={y + 20}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={15}
          fontFamily="var(--font-sans)"
          fill={belowTone}
        >
          {below}
        </text>
      ) : null}
    </g>
  )
}

/**
 * Intramolecular H-bonding in o-nitrophenol vs intermolecular H-bonding chain in
 * p-nitrophenol, matching NCERT Class 12 p. 211.
 */
export function HBondNitrophenolComparison({
  variant,
}: {
  variant: 'stacked' | 'side-by-side'
}) {
  if (variant === 'stacked') {
    // Fits nicely inside 560 x 470 Scrolly (y: 52..412)
    return (
      <g>
        {/* Top card: o-Nitrophenol */}
        <rect x={16} y={54} width={528} height={164} rx={12} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.2} />
        <text x={32} y={72} dominantBaseline="central" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--accent)">
          o-Nitrophenol (Intramolecular H-bonding)
        </text>

        {/* Hexagon at (110, 162), R=32 with 6-membered H-bond loop */}
        <g transform="translate(110, 162)">
          <PhenolRing
            spec={{ id: 'o-hbond-ring', name: '', ringMode: 'kekule-a', substituents: [] }}
            cx={0}
            cy={0}
            radius={32}
          />
          {/* C1-O-H */}
          <line x1={0} y1={-32} x2={0} y2={-54} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
          <text x={0} y={-62} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--atom-o)">
            O
          </text>
          <line x1={9} y1={-62} x2={24} y2={-62} stroke="var(--fg)" strokeWidth={2} strokeLinecap="round" />
          <text x={31} y={-62} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
            H
          </text>
          {/* C2-N(=O)-O */}
          <line x1={27.7} y1={-16} x2={48} y2={-28} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
          <text x={57} y={-32} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--atom-n)">
            N
          </text>
          <line x1={57} y1={-40} x2={57} y2={-54} stroke="var(--fg)" strokeWidth={2} strokeLinecap="round" />
          <text x={57} y={-62} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--atom-o)">
            O
          </text>
          <line x1={65} y1={-28} x2={79} y2={-20} stroke="var(--fg)" strokeWidth={2} strokeLinecap="round" />
          <line x1={67} y1={-32} x2={81} y2={-24} stroke="var(--fg)" strokeWidth={2} strokeLinecap="round" />
          <text x={89} y={-17} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--atom-o)">
            O
          </text>
          {/* Intramolecular dashed H-bond */}
          <line x1={38} y1={-62} x2={50} y2={-62} stroke="var(--accent)" strokeWidth={2.5} strokeDasharray="3 3" strokeLinecap="round" />
        </g>

        <text x={224} y={118} fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
          Self-contained molecule
        </text>
        <text x={224} y={142} fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
          H-bond closes a 6-membered ring
        </text>
        <text x={224} y={166} fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
          Weak attraction to neighbours
        </text>
        <rect x={224} y={180} width={196} height={26} rx={13} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={1} />
        <text x={322} y={193} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--accent)">
          Steam volatile (distils)
        </text>

        {/* Bottom card: p-Nitrophenol chain */}
        <rect x={16} y={230} width={528} height={184} rx={12} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.2} />
        <text x={32} y={254} fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
          p-Nitrophenol (Intermolecular H-bonding)
        </text>

        {/* Two horizontal linked units: ... HO - ring - N(=O)O ... HO - ring - N(=O)O ... */}
        <text x={42} y={316} textAnchor="end" dominantBaseline="central" fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--accent)">
          ···
        </text>
        <text x={68} y={316} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--atom-o)">
          HO
        </text>
        <line x1={84} y1={316} x2={100} y2={316} stroke="var(--fg)" strokeWidth={2.2} />
        <g transform="translate(128, 316) rotate(90)">
          <PhenolRing spec={{ id: 'p-chain-1', name: '', ringMode: 'kekule-a', substituents: [] }} cx={0} cy={0} radius={28} />
        </g>
        <line x1={156} y1={316} x2={174} y2={316} stroke="var(--fg)" strokeWidth={2.2} />
        <text x={184} y={316} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--atom-n)">
          N
        </text>
        <line x1={191} y1={309} x2={205} y2={297} stroke="var(--fg)" strokeWidth={2} />
        <line x1={194} y1={312} x2={208} y2={300} stroke="var(--fg)" strokeWidth={2} />
        <text x={215} y={295} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--atom-o)">
          O
        </text>
        <line x1={192} y1={321} x2={208} y2={331} stroke="var(--fg)" strokeWidth={2} />
        <text x={218} y={335} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--atom-o)">
          O
        </text>

        {/* Intermolecular H-bond between O and next HO */}
        <line x1={228} y1={335} x2={278} y2={316} stroke="var(--accent)" strokeWidth={2.6} strokeDasharray="4 4" strokeLinecap="round" />

        <text x={298} y={316} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--atom-o)">
          HO
        </text>
        <line x1={314} y1={316} x2={330} y2={316} stroke="var(--fg)" strokeWidth={2.2} />
        <g transform="translate(358, 316) rotate(90)">
          <PhenolRing spec={{ id: 'p-chain-2', name: '', ringMode: 'kekule-a', substituents: [] }} cx={0} cy={0} radius={28} />
        </g>
        <line x1={386} y1={316} x2={404} y2={316} stroke="var(--fg)" strokeWidth={2.2} />
        <text x={414} y={316} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--atom-n)">
          N
        </text>
        <line x1={421} y1={309} x2={435} y2={297} stroke="var(--fg)" strokeWidth={2} />
        <line x1={424} y1={312} x2={438} y2={300} stroke="var(--fg)" strokeWidth={2} />
        <text x={445} y={295} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--atom-o)">
          O
        </text>
        <line x1={422} y1={321} x2={438} y2={331} stroke="var(--fg)" strokeWidth={2} />
        <text x={448} y={335} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--atom-o)">
          O
        </text>
        <text x={464} y={335} textAnchor="start" dominantBaseline="central" fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--accent)">
          ···
        </text>

        <text x={32} y={388} fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
          Molecules associate into chains → Less volatile (stays in flask)
        </text>
      </g>
    )
  }

  // Side-by-side inside 620 x 245 Simulation lower stage
  return (
    <g>
      <text x={310} y={22} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        Steam Distillation: Intramolecular vs Intermolecular H-Bonding
      </text>

      {/* Left card: o-Nitrophenol */}
      <rect x={12} y={42} width={286} height={190} rx={10} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.2} />
      <text x={155} y={62} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--accent)">
        o-Nitrophenol (Intramolecular)
      </text>

      <g transform="translate(128, 146)">
        <PhenolRing spec={{ id: 'sim-o-hbond', name: '', ringMode: 'kekule-a', substituents: [] }} cx={0} cy={0} radius={26} />
        <line x1={0} y1={-26} x2={0} y2={-44} stroke="var(--fg)" strokeWidth={2} />
        <text x={0} y={-52} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--atom-o)">
          O
        </text>
        <line x1={8} y1={-52} x2={21} y2={-52} stroke="var(--fg)" strokeWidth={2} />
        <text x={28} y={-52} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
          H
        </text>
        <line x1={22.5} y1={-13} x2={42} y2={-24} stroke="var(--fg)" strokeWidth={2} />
        <text x={50} y={-27} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--atom-n)">
          N
        </text>
        <line x1={50} y1={-34} x2={50} y2={-44} stroke="var(--fg)" strokeWidth={2} />
        <text x={50} y={-52} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--atom-o)">
          O
        </text>
        <line x1={57} y1={-23} x2={70} y2={-16} stroke="var(--fg)" strokeWidth={1.8} />
        <line x1={59} y1={-27} x2={72} y2={-20} stroke="var(--fg)" strokeWidth={1.8} />
        <text x={79} y={-14} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--atom-o)">
          O
        </text>
        <line x1={35} y1={-52} x2={43} y2={-52} stroke="var(--accent)" strokeWidth={2.4} strokeDasharray="3 3" />
      </g>
      <text x={155} y={208} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        Steam volatile (discrete molecule)
      </text>

      {/* Right card: p-Nitrophenol */}
      <rect x={312} y={42} width={296} height={190} rx={10} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.2} />
      <text x={460} y={62} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        p-Nitrophenol (Intermolecular)
      </text>

      {/* Two compact horizontal units */}
      <text x={332} y={134} textAnchor="end" dominantBaseline="central" fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--accent)">
        ··
      </text>
      <text x={348} y={134} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--atom-o)">
        HO
      </text>
      <line x1={362} y1={134} x2={372} y2={134} stroke="var(--fg)" strokeWidth={2} />
      <g transform="translate(390, 134) rotate(90)">
        <PhenolRing spec={{ id: 'sim-p1', name: '', ringMode: 'kekule-a', substituents: [] }} cx={0} cy={0} radius={18} />
      </g>
      <line x1={408} y1={134} x2={418} y2={134} stroke="var(--fg)" strokeWidth={2} />
      <text x={432} y={134} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--atom-n)">
        NO₂
      </text>

      <line x1={448} y1={134} x2={474} y2={134} stroke="var(--accent)" strokeWidth={2.4} strokeDasharray="3 3" />

      <text x={490} y={134} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--atom-o)">
        HO
      </text>
      <line x1={504} y1={134} x2={514} y2={134} stroke="var(--fg)" strokeWidth={2} />
      <g transform="translate(532, 134) rotate(90)">
        <PhenolRing spec={{ id: 'sim-p2', name: '', ringMode: 'kekule-a', substituents: [] }} cx={0} cy={0} radius={18} />
      </g>
      <line x1={550} y1={134} x2={560} y2={134} stroke="var(--fg)" strokeWidth={2} />
      <text x={576} y={134} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--atom-n)">
        NO₂
      </text>
      <text x={594} y={134} textAnchor="start" dominantBaseline="central" fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--accent)">
        ··
      </text>

      <text x={460} y={208} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        Associated chains (less volatile)
      </text>
    </g>
  )
}

/**
 * Comparison diagram for Simulation Bromination Mechanistic Toggle:
 * Phenol polarises Br₂ directly without FeBr₃ vs Benzene requiring FeBr₃.
 */
export function Br2PolarisationComparison({ aqueous = false }: { aqueous?: boolean }) {
  return (
    <g>
      <text x={310} y={22} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        Why Phenol Polarises Br₂ Without a Lewis Acid Catalyst
      </text>

      {/* Left: Phenol */}
      <rect x={12} y={42} width={292} height={190} rx={10} fill="var(--surface)" stroke="var(--accent)" strokeWidth={1.4} />
      <text x={158} y={62} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--accent)">
        Phenol: No FeBr₃ needed
      </text>

      <PhenolRing
        spec={{
          id: 'br-comp-phenol',
          name: '',
          ringMode: 'hybrid',
          substituents: [{ position: 1, label: aqueous ? 'OH / O⁻' : 'OH', tone: 'o', lonePairs: 2 }],
          highlightPositions: [2, 4, 6],
        }}
        cx={96}
        cy={156}
        radius={24}
      />

      {/* Polarised Br2 approaching */}
      <text x={196} y={142} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--delta-plus)">
        {deltaText('Brδ+')}
      </text>
      <line x1={218} y1={142} x2={236} y2={142} stroke="var(--fg)" strokeWidth={2.2} />
      <text x={260} y={142} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--delta-minus)">
        {deltaText('Brδ−')}
      </text>

      {/* Arrow from ring C-2 to Br delta+ */}
      <path
        d="M 122 142 Q 148 110 176 132"
        fill="none"
        stroke="var(--e-arrow)"
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <polygon points="180,136 169,134 176,125" fill="var(--e-arrow)" />

      <text x={158} y={214} textAnchor="middle" dominantBaseline="central" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg)">
        {aqueous ? 'Water + O⁻ drives 2,4,6-trisubstitution' : 'Electron-rich ring polarises Br-Br'}
      </text>

      {/* Right: Benzene */}
      <rect x={316} y={42} width={292} height={190} rx={10} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.2} />
      <text x={462} y={62} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        Benzene: Requires FeBr₃
      </text>

      <PhenolRing
        spec={{ id: 'br-comp-benzene', name: '', ringMode: 'kekule-a', substituents: [] }}
        cx={386}
        cy={148}
        radius={26}
      />

      <text x={462} y={142} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        Br-Br
      </text>
      <rect x={510} y={126} width={76} height={32} rx={8} fill="var(--surface-raised)" stroke="var(--caution)" strokeWidth={1.4} />
      <text x={548} y={142} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--caution)">
        FeBr₃
      </text>

      <text x={462} y={214} textAnchor="middle" dominantBaseline="central" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        Lewis acid needed to polarise Br₂
      </text>
    </g>
  )
}
