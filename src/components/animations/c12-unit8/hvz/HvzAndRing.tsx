'use client'

import type { CSSProperties, ReactNode } from 'react'
import { BenzeneRing, CurvedArrow, lonePairAnchor, SkeletalFormula } from '@/components/organic'
import { ROLE_TONE } from '@/components/vocab/organic6'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import { unit8Name } from '@/lib/chem/ncert-c12-unit8-data'
import { HVZ_MOLECULES, HVZ_STEP_STATES, type HvzMoleculeKey } from './hvz-steps'

export interface HvzAndRingProps {
  /** 0-based Step index from Scrolly. */
  step: number
  /** Reduced motion is a cut: every Step is a still picture, so this prop changes nothing. */
  reducedMotion: boolean
}

/** One viewBox for every Step, so the panel keeps its size as the reader scrolls. */
const W = 580
const H = 460
const INK = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
/** Highlight wash of the α-carbon and the meta carbon: a tint of the accent, readable in both themes. */
const HIGHLIGHT: CSSProperties = { ['--highlight' as string]: 'color-mix(in srgb, var(--accent) 26%, transparent)' }
const RING_R = 92
/** y of the reaction arrow, and of the skeletal drawings' centres. */
const Y = 200

/** Vertex of a benzene ring: position 1 is the top, positions run clockwise (as BenzeneRing draws them). */
function ringPoint(cx: number, cy: number, position: number) {
  const a = ((-90 + (position - 1) * 60) * Math.PI) / 180
  return { x: cx + RING_R * Math.cos(a), y: cy + RING_R * Math.sin(a) }
}

function Caption({ y, children, muted = false }: { y: number; children: ReactNode; muted?: boolean }) {
  return (
    <text x={W / 2} y={y} textAnchor="middle" fontSize={15} fill={muted ? MUTED : INK}>
      {children}
    </text>
  )
}

function Molecule({ id, x, scale, highlight }: { id: HvzMoleculeKey; x: number; scale: number; highlight?: readonly number[] }) {
  const graph = parseSmiles(HVZ_MOLECULES[id].smiles)
  return (
    <g style={HIGHLIGHT}>
      <SkeletalFormula graph={graph} scale={scale} x={x} y={Y} highlightAtoms={highlight} />
    </g>
  )
}

/** Plain reaction arrow, with a label above (reagents) and below (by-product). */
function ReactionArrow({ x1, x2, y, above, below }: { x1: number; x2: number; y: number; above?: string; below?: string }) {
  const mid = (x1 + x2) / 2
  return (
    <g>
      <line x1={x1} y1={y} x2={x2 - 8} y2={y} stroke={MUTED} strokeWidth={2} />
      <polygon points={`${x2},${y} ${x2 - 11},${y - 5} ${x2 - 11},${y + 5}`} fill={MUTED} />
      {above ? (
        <text x={mid} y={y - 26} textAnchor="middle" fontSize={14} fill={INK}>
          {above}
        </text>
      ) : null}
      {below ? (
        <text x={mid} y={y + 22} textAnchor="middle" fontSize={14} fill={INK}>
          {below}
        </text>
      ) : null}
    </g>
  )
}

function Cross({ cx, cy, r = 14 }: { cx: number; cy: number; r?: number }) {
  return (
    <g stroke={INK} strokeWidth={3} strokeLinecap="round">
      <line x1={cx - r} y1={cy - r} x2={cx + r} y2={cy + r} />
      <line x1={cx + r} y1={cy - r} x2={cx - r} y2={cy + r} />
    </g>
  )
}

/** Step 1: butanoic acid, its α-carbon shaded. */
function StepAcid() {
  return (
    <g>
      <Molecule id="butanoic" x={W / 2} scale={72} highlight={[2]} />
      <Caption y={380}>Shaded: the α-carbon, the carbon next to COOH</Caption>
      <Caption y={414} muted>
        Its α-hydrogens are the ones that can be swapped
      </Caption>
    </g>
  )
}

/** Step 2: HVZ. One α-hydrogen is swapped for Br. */
function StepHvz() {
  return (
    <g>
      <Molecule id="butanoic" x={135} scale={64} highlight={[2]} />
      <ReactionArrow x1={250} x2={326} y={Y} above="Br₂, red P" />
      <Molecule id="bromobutanoic" x={445} scale={64} highlight={[2]} />
      <text x={445} y={344} textAnchor="middle" fontSize={14} fill={INK}>
        {`${unit8Name(HVZ_MOLECULES.bromobutanoic.smiles)} + HBr`}
      </text>
      <Caption y={380}>Br replaces one α-hydrogen</Caption>
      <Caption y={414} muted>
        HBr is the by-product; the COOH group is unchanged
      </Caption>
    </g>
  )
}

/** Step 3: no α-hydrogen, so no reaction. */
function StepNoAlpha() {
  return (
    <g>
      <Molecule id="dimethylpropanoic" x={135} scale={60} highlight={[1]} />
      <ReactionArrow x1={250} x2={326} y={Y} above="Br₂, red P" />
      <Cross cx={288} cy={Y} />
      <Molecule id="dimethylpropanoic" x={445} scale={60} highlight={[1]} />
      <Caption y={380}>No α-hydrogen, so no bromine can take a place</Caption>
      <Caption y={414} muted>
        The flask stays as it was
      </Caption>
    </g>
  )
}

/** Step 4: benzoic acid ring, meta carbon 3 chosen; 3-nitrobenzoic acid drawn. */
function StepRingNitration() {
  const cx = 130
  const cy = 220
  const meta = ringPoint(cx, cy, 3)
  const outward = { x: cx + (RING_R + 26) * Math.cos(Math.PI / 6), y: cy + (RING_R + 26) * Math.sin(Math.PI / 6) }
  return (
    <g>
      <BenzeneRing variant="hexagon" substituents={[{ position: 1, label: 'COOH' }]} x={cx} y={cy} />
      <g style={HIGHLIGHT}>
        <circle cx={meta.x} cy={meta.y} r={17} fill="var(--highlight)" />
      </g>
      {[2, 4, 6].map((p) => {
        const q = ringPoint(cx, cy, p)
        return <circle key={p} cx={q.x} cy={q.y} r={7} fill={MUTED} opacity={0.35} />
      })}
      <text x={outward.x} y={outward.y} textAnchor="middle" dominantBaseline="central" fontSize={15} fill={INK}>
        3
      </text>
      <ReactionArrow x1={222} x2={312} y={cy} above="HNO₃, H₂SO₄" />
      <BenzeneRing variant="hexagon" substituents={[{ position: 1, label: 'COOH' }, { position: 3, label: 'NO₂' }]} x={410} y={cy} />
      <Caption y={380}>{`NO₂ enters at carbon 3, the meta position: ${unit8Name(HVZ_MOLECULES.nitrobenzoic.smiles)}`}</Caption>
      <Caption y={414} muted>
        The ortho and para positions (faded) are not chosen
      </Caption>
    </g>
  )
}

/** A line from `from` (t0 to t1 along the way to `to`), shifted `off` units sideways: one line of a double bond. */
function segment(from: { x: number; y: number }, to: { x: number; y: number }, t0: number, t1: number, off: number) {
  const len = Math.hypot(to.x - from.x, to.y - from.y)
  const ux = (to.x - from.x) / len
  const uy = (to.y - from.y) / len
  const at = (t: number) => ({ x: from.x + ux * t - uy * off, y: from.y + uy * t + ux * off })
  const a = at(t0)
  const b = at(t1)
  return { x1: a.x, y1: a.y, x2: b.x, y2: b.y }
}

/**
 * Step 5: Friedel–Crafts. Benzoic acid at Step 4's scale (bond = ring radius) and orientation, its
 * C=O drawn double. AlCl₃ binds to the carbonyl oxygen; the ring is left bare.
 */
function StepFriedelCrafts() {
  const cx = 240
  const cy = 290
  const top = ringPoint(cx, cy, 1)
  const c = { x: top.x, y: top.y - RING_R }
  const oxo = { x: c.x - Math.cos(Math.PI / 6) * RING_R, y: c.y - RING_R / 2 }
  const oh = { x: c.x + Math.cos(Math.PI / 6) * RING_R, y: c.y - RING_R / 2 }
  const al = { x: 78, y: 40 }
  const start = lonePairAnchor(oxo, Math.atan2(al.y - oxo.y, al.x - oxo.x), 16)
  const carbonylUp = segment(c, oxo, 0, RING_R - 12, 3.5)
  const carbonylDown = segment(c, oxo, 0, RING_R - 12, -3.5)
  const hydroxyl = segment(c, oh, 0, RING_R - 18, 0)
  return (
    <g>
      <BenzeneRing variant="hexagon" x={cx} y={cy} />
      <line x1={top.x} y1={top.y} x2={c.x} y2={c.y} stroke={INK} strokeWidth={2} />
      <line {...carbonylUp} stroke={INK} strokeWidth={2} />
      <line {...carbonylDown} stroke={INK} strokeWidth={2} />
      <line {...hydroxyl} stroke={INK} strokeWidth={2} />
      <text x={oxo.x} y={oxo.y} textAnchor="middle" dominantBaseline="central" fontSize={15} fill={INK}>
        O
      </text>
      <text x={oh.x} y={oh.y} textAnchor="middle" dominantBaseline="central" fontSize={15} fill={INK}>
        OH
      </text>
      <text x={al.x} y={al.y} textAnchor="end" dominantBaseline="central" fontSize={15} fontWeight={600} fill={ROLE_TONE.electrophilicCarbon}>
        AlCl₃
      </text>
      <CurvedArrow from={start} to={{ x: al.x + 4, y: al.y }} bend={-0.25} />
      <text x={470} y={200} textAnchor="middle" fontSize={15} fill={INK}>
        CH₃Cl
      </text>
      <Cross cx={470} cy={250} />
      <Caption y={408}>AlCl₃ binds to the carboxyl oxygen</Caption>
      <Caption y={438} muted>
        No methyl group is added: the ring stays bare
      </Caption>
    </g>
  )
}

const USES: readonly { formula: string; uses: readonly string[] }[] = [
  { formula: 'HCOOH', uses: ['rubber, textiles, dyeing, leather,', 'and electroplating'] },
  { formula: 'CH₃COOH', uses: ['solvent, and vinegar in food'] },
  { formula: 'HOOC(CH₂)₄COOH', uses: ['nylon-6,6'] },
  { formula: 'C₆H₅COOR', uses: ['esters for perfumery'] },
  { formula: 'C₆H₅COONa', uses: ['food preservative (sodium benzoate)'] },
  { formula: 'CH₃(CH₂)₁₆COOH', uses: ['soaps and detergents'] },
]

/** Step 6: a board of acids beside their uses. */
function StepUses() {
  return (
    <g>
      <text x={40} y={40} fontSize={16} fontWeight={600} fill={INK}>
        Acids and their uses
      </text>
      {USES.map((row, k) => {
        const y0 = 84 + k * 62
        return (
          <g key={row.formula}>
            <text x={40} y={y0} fontSize={17} fontWeight={600} fill={INK}>
              {row.formula}
            </text>
            {row.uses.map((line, i) => (
              <text key={line} x={250} y={y0 + i * 20} fontSize={15} fill={MUTED}>
                {line}
              </text>
            ))}
          </g>
        )
      })}
    </g>
  )
}

const STEP_VIEW: readonly (() => ReactNode)[] = [StepAcid, StepHvz, StepNoAlpha, StepRingNitration, StepFriedelCrafts, StepUses]

export function HvzAndRing({ step }: HvzAndRingProps) {
  const index = Math.min(Math.max(step, 0), HVZ_STEP_STATES.length - 1)
  const View = STEP_VIEW[index]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Acids: Step ${index + 1} of ${HVZ_STEP_STATES.length}`} data-step={index}>
      <View />
    </svg>
  )
}
