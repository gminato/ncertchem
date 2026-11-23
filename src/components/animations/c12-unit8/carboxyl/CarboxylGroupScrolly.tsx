'use client'

import {
  CurvedArrow,
  lonePairPoint,
  outwardAngle,
  SkeletalFormula,
  skeletalFrame,
} from '@/components/organic'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import {
  ACETIC_ACID,
  ACID_ANHYDRIDE,
  ACYL_CHLORIDE,
  AMIDE,
  BENZOIC_ACID,
  commonNameOf,
  ESTER,
  HEPTANEDIOIC_ACID,
  iupacOf,
  METHYLPENTANOIC_ACID,
  PHTHALIC_ACID,
  RESONANCE_NEUTRAL,
  RESONANCE_ZWITTERION,
  SOURCE_NOTES,
} from './carboxyl-steps'

// One viewBox for every Step, so the panel keeps its size as the reader scrolls.
const W = 560
const H = 420
const FG = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const DIM = 'var(--fg-subtle)'
const STEP_COUNT = 6

interface Pt {
  x: number
  y: number
}

const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

/** A drawn molecule at a centre (cx, cy), with the same frame used for its arrows and arcs. */
function Mol({
  smiles,
  cx,
  cy,
  scale,
  highlightAtoms,
  locants,
  innerCircles,
  showLonePairs = true,
}: {
  smiles: string
  cx: number
  cy: number
  scale: number
  highlightAtoms?: readonly number[]
  locants?: readonly { atom: number; label: string }[]
  innerCircles?: boolean
  showLonePairs?: boolean
}) {
  const graph = parseSmiles(smiles)
  return (
    <SkeletalFormula
      graph={graph}
      x={cx}
      y={cy}
      scale={scale}
      showLonePairs={showLonePairs}
      highlightAtoms={highlightAtoms}
      locants={locants}
      innerCircles={innerCircles}
    />
  )
}

/** Short arc between two bonds at atom `c`, with its angle label on the bisector. Frame coordinates. */
function bondArc(c: Pt, a: Pt, b: Pt, r: number): { d: string; label: Pt } {
  const ta = Math.atan2(a.y - c.y, a.x - c.x)
  const tb = Math.atan2(b.y - c.y, b.x - c.x)
  let delta = tb - ta
  while (delta > Math.PI) delta -= 2 * Math.PI
  while (delta <= -Math.PI) delta += 2 * Math.PI
  const sweep = delta > 0 ? 1 : 0
  const p1 = { x: c.x + r * Math.cos(ta), y: c.y + r * Math.sin(ta) }
  const p2 = { x: c.x + r * Math.cos(tb), y: c.y + r * Math.sin(tb) }
  const tm = ta + delta / 2
  const label = { x: c.x + (r + 24) * Math.cos(tm), y: c.y + (r + 24) * Math.sin(tm) }
  return { d: `M ${p1.x} ${p1.y} A ${r} ${r} 0 0 ${sweep} ${p2.x} ${p2.y}`, label }
}

const S1 = 56

/** Step 1: acetic acid with its carboxyl group in full, the three bonds at about 120 degrees. */
function Step1() {
  const graph = parseSmiles(ACETIC_ACID)
  const f = skeletalFrame(graph, S1)
  const P = f.points
  const arc = bondArc(P[1], P[2], P[3], 30)
  const cx = 280
  const cy = 200
  return (
    <g>
      <Mol smiles={ACETIC_ACID} cx={cx} cy={cy} scale={S1} />
      <g transform={`translate(${cx} ${cy})`}>
        <path d={arc.d} fill="none" stroke={MUTED} strokeWidth={2} />
        <text x={arc.label.x} y={arc.label.y} fontSize={18} fill={FG} textAnchor="middle" dominantBaseline="middle">
          120°
        </text>
      </g>
      <text x={280} y={372} fontSize={18} fill={MUTED} textAnchor="middle">
        CH₃COOH: carboxyl carbon with C=O, –OH and CH₃
      </text>
    </g>
  )
}

const S2 = 70

/** Step 2: the neutral form, the charge-separated form, and the two curved arrows between them. */
function Step2() {
  const gA = parseSmiles(RESONANCE_NEUTRAL)
  const fA = skeletalFrame(gA, S2)
  const P = fA.points
  const ax = 140
  const ay = 200
  // Start 30 units out, clear of the OH label, and bow below the C–O bond on the way to its midpoint.
  const lone = lonePairPoint(P[2], outwardAngle(P, fA.adj, 2), 30)
  const bx = 420
  return (
    <g>
      <g transform={`translate(${ax} ${ay})`}>
        <CurvedArrow from={lone} to={mid(P[1], P[2])} gap={6} bend={0.5} />
        <CurvedArrow from={mid(P[1], P[3])} to={lonePairPoint(P[3], -Math.PI / 4, 18)} gap={4} bend={0.5} />
      </g>
      <Mol smiles={RESONANCE_NEUTRAL} cx={ax} cy={ay} scale={S2} />
      <Mol smiles={RESONANCE_ZWITTERION} cx={bx} cy={ay} scale={S2} />
      <line x1={232} y1={ay} x2={328} y2={ay} stroke={MUTED} strokeWidth={2} />
      <polygon points={`226,${ay} 240,${ay - 7} 240,${ay + 7}`} fill={MUTED} />
      <polygon points={`334,${ay} 320,${ay - 7} 320,${ay + 7}`} fill={MUTED} />
      <text x={280} y={ay - 16} fontSize={16} fill={MUTED} textAnchor="middle">
        resonance
      </text>
      <text x={ax} y={350} fontSize={18} fill={FG} textAnchor="middle">
        neutral form
      </text>
      <text x={bx} y={350} fontSize={18} fill={FG} textAnchor="middle">
        charge-separated form
      </text>
    </g>
  )
}

/** Step 3: three acids, their sources and the Latin words behind their common names. */
const CONDENSED = ['HCOOH', 'CH₃COOH', 'CH₃CH₂CH₂COOH'] as const

function Step3() {
  return (
    <g>
      {SOURCE_NOTES.map((note, i) => {
        const y = 105 + i * 105
        return (
          <g key={note.smiles}>
            {i > 0 ? <line x1={40} x2={520} y1={y - 52} y2={y - 52} stroke={DIM} strokeWidth={1} /> : null}
            <text x={60} y={y + 8} fontSize={26} fill={FG}>
              {CONDENSED[i]}
            </text>
            <text x={290} y={y - 4} fontSize={20} fill={FG}>
              {commonNameOf(note.smiles) ?? ''}
            </text>
            <text x={290} y={y + 24} fontSize={16} fill={MUTED}>
              from {note.source} (Latin {note.latin})
            </text>
          </g>
        )
      })}
    </g>
  )
}

const S4 = 50

/** Step 4: 3-methylpentanoic acid with the chain numbered from the carboxyl carbon. */
function Step4() {
  const locants = [
    { atom: 5, label: '1' },
    { atom: 4, label: '2' },
    { atom: 2, label: '3' },
    { atom: 1, label: '4' },
    { atom: 0, label: '5' },
  ]
  return (
    <g>
      <Mol smiles={METHYLPENTANOIC_ACID} cx={280} cy={170} scale={S4} locants={locants} />
      <text x={280} y={336} fontSize={22} fill={FG} textAnchor="middle">
        {iupacOf(METHYLPENTANOIC_ACID)}
      </text>
      <text x={280} y={368} fontSize={16} fill={MUTED} textAnchor="middle">
        the carboxyl carbon is always carbon 1
      </text>
    </g>
  )
}

const S5 = 40

/** Step 5: a dicarboxylic acid, a ring acid and the ring diacid, each with its name. */
function Step5() {
  return (
    <g>
      <Mol smiles={HEPTANEDIOIC_ACID} cx={280} cy={70} scale={S5} />
      <text x={280} y={150} fontSize={18} fill={FG} textAnchor="middle">
        {iupacOf(HEPTANEDIOIC_ACID)}
      </text>
      <Mol smiles={BENZOIC_ACID} cx={150} cy={262} scale={S5} innerCircles />
      <text x={150} y={370} fontSize={18} fill={FG} textAnchor="middle">
        {iupacOf(BENZOIC_ACID)}
      </text>
      <Mol
        smiles={PHTHALIC_ACID}
        cx={410}
        cy={262}
        scale={S5}
        innerCircles
        locants={[
          { atom: 3, label: '1' },
          { atom: 8, label: '2' },
        ]}
      />
      <text x={410} y={370} fontSize={16} fill={FG} textAnchor="middle">
        {iupacOf(PHTHALIC_ACID)}
      </text>
      <text x={410} y={394} fontSize={16} fill={MUTED} textAnchor="middle">
        phthalic acid
      </text>
    </g>
  )
}

const S6 = 44

/** Step 6: the four derivatives, each with its CH₃CO– group highlighted. */
function Step6() {
  const cells: { smiles: string; cx: number; cy: number; acyl: readonly number[]; label: string }[] = [
    { smiles: ACYL_CHLORIDE, cx: 140, cy: 92, acyl: [0, 1, 2], label: 'acyl chloride' },
    { smiles: ACID_ANHYDRIDE, cx: 420, cy: 92, acyl: [0, 1, 2], label: 'acid anhydride' },
    { smiles: ESTER, cx: 140, cy: 302, acyl: [3, 4, 5], label: 'ester (R = ethyl)' },
    { smiles: AMIDE, cx: 420, cy: 302, acyl: [0, 1, 3], label: 'amide' },
  ]
  return (
    <g>
      {cells.map((c) => (
        <g key={c.smiles}>
          <Mol smiles={c.smiles} cx={c.cx} cy={c.cy} scale={S6} highlightAtoms={c.acyl} />
          <text x={c.cx} y={c.cy + 80} fontSize={18} fill={FG} textAnchor="middle">
            {c.label}
          </text>
        </g>
      ))}
    </g>
  )
}

const VIEWS = [Step1, Step2, Step3, Step4, Step5, Step6] as const

const ALT: readonly string[] = [
  'Acetic acid with its carboxyl group drawn in full',
  'Two resonance forms of the carboxyl group',
  'Formic, acetic and butyric acids with their sources',
  '3-methylpentanoic acid, numbered from the carboxyl carbon',
  'Heptanedioic, benzoic and phthalic acids',
  'Acyl chloride, acid anhydride, ester and amide of one acyl group',
]

/** Scrolly visual for Class 12 Unit 8 Section 6: the carboxyl group, its naming and its derivatives. */
export function CarboxylGroupScrolly({ step }: { step: number }) {
  const index = Math.min(STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const View = VIEWS[index]
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`${ALT[index]}, Step ${index + 1} of ${STEP_COUNT}`}
      data-step={index}
      style={{ display: 'block', width: '100%', height: 'auto' }}
    >
      <View />
    </svg>
  )
}
