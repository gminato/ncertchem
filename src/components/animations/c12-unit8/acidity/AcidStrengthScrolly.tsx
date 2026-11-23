'use client'

import type { ReactNode } from 'react'
import { Sub, Sup } from '@/components/animations/c12-unit1/ChemSvg'
import { CurvedArrow } from '@/components/organic'
import { ROLE_TONE } from '@/components/vocab/organic6'
import { ACID_STRENGTH_ALT, RULER_ACIDS, RULER_BANDS, STRIP_FORMULAS, pkaRow, rulerY } from './acid-strength-steps'

export interface AcidStrengthScrollyProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

type Pt = { x: number; y: number }

/** One viewBox for every Step, so the panel keeps the same size as the reader scrolls. */
const W = 580
const H = 600
const INK = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const HILITE = 'color-mix(in srgb, var(--accent) 28%, transparent)'
/** Half-widths of labels, so bonds stop short of them. */
const LABEL_GAP = 16
const METHYL_GAP = 22
const SQRT3_OVER_2 = Math.sqrt(3) / 2
/** Carboxyl geometry at 120°: C=O straight up, the OH (or O⁻) down-right, the CH₃ down-left. y points down. */
const UP: Pt = { x: 0, y: -1 }
const DOWN_RIGHT: Pt = { x: SQRT3_OVER_2, y: 0.5 }
const DOWN_LEFT: Pt = { x: -SQRT3_OVER_2, y: 0.5 }

/** A point `len` along direction `d` from `c`; `rot` turns the direction by 180°. */
function along(c: Pt, d: Pt, len: number, rot = false): Pt {
  const s = rot ? -1 : 1
  return { x: c.x + s * d.x * len, y: c.y + s * d.y * len }
}

/** The segment from a to b, shortened by sa at a and sb at b. */
function shorten(a: Pt, b: Pt, sa: number, sb: number): [Pt, Pt] {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy)
  const ux = dx / len
  const uy = dy / len
  return [
    { x: a.x + ux * sa, y: a.y + uy * sa },
    { x: b.x - ux * sb, y: b.y - uy * sb },
  ]
}

function Bond({ a, b, sa = 0, sb = 0, order = 1, dashed = false }: { a: Pt; b: Pt; sa?: number; sb?: number; order?: 1 | 2; dashed?: boolean }) {
  const [p, q] = shorten(a, b, sa, sb)
  const len = Math.hypot(q.x - p.x, q.y - p.y)
  const nx = (-(q.y - p.y) / len) * 4.5
  const ny = ((q.x - p.x) / len) * 4.5
  const common = { stroke: INK, strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeDasharray: dashed ? '5 5' : undefined }
  if (order === 1) return <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} {...common} />
  return (
    <g>
      <line x1={p.x + nx} y1={p.y + ny} x2={q.x + nx} y2={q.y + ny} {...common} />
      <line x1={p.x - nx} y1={p.y - ny} x2={q.x - nx} y2={q.y - ny} {...common} />
    </g>
  )
}

function Atom({ at, children, fill = INK, anchor = 'middle' }: { at: Pt; children: ReactNode; fill?: string; anchor?: 'start' | 'middle' | 'end' }) {
  return (
    <text x={at.x} y={at.y} textAnchor={anchor} dominantBaseline="central" fontSize={17} fontWeight={600} fontFamily="var(--font-sans)" fill={fill}>
      {children}
    </text>
  )
}

function Caption({ y, children, fill = INK }: { y: number; children: ReactNode; fill?: string }) {
  return (
    <text x={W / 2} y={y} textAnchor="middle" fontSize={15} fill={fill}>
      {children}
    </text>
  )
}

/** A carboxyl group CH₃–C(=O)–X drawn at 120°. `rot` turns the whole group by 180°. */
function Carboxyl({
  c,
  len,
  rot = false,
  up,
  dr,
}: {
  c: Pt
  len: number
  rot?: boolean
  up: { label: ReactNode; double?: boolean }
  dr: { label: ReactNode; double?: boolean }
}) {
  const oUp = along(c, UP, len, rot)
  const oDr = along(c, DOWN_RIGHT, len, rot)
  const me = along(c, DOWN_LEFT, len, rot)
  return (
    <g>
      <Bond a={c} b={oUp} sb={LABEL_GAP} order={up.double ? 2 : 1} />
      <Bond a={c} b={oDr} sb={LABEL_GAP} order={dr.double ? 2 : 1} />
      <Bond a={c} b={me} sb={METHYL_GAP} />
      <Atom at={oUp}>{up.label}</Atom>
      <Atom at={oDr}>{dr.label}</Atom>
      <Atom at={me}>
        CH<Sub>3</Sub>
      </Atom>
    </g>
  )
}

/** A straight arrow pointing left, for an inductive pull. */
function InductiveArrow({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  return (
    <g stroke={INK} fill={INK}>
      <line x1={x1} y1={y} x2={x2 + 12} y2={y} strokeWidth={2} />
      <polygon points={`${x2},${y} ${x2 + 12},${y - 6} ${x2 + 12},${y + 6}`} />
    </g>
  )
}

/** Two-headed resonance arrow between forms. */
function ResonanceArrow({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  return (
    <g stroke={INK} fill={INK}>
      <line x1={x1 + 8} y1={y} x2={x2 - 8} y2={y} strokeWidth={2} />
      <polygon points={`${x1},${y} ${x1 + 11},${y - 6} ${x1 + 11},${y + 6}`} />
      <polygon points={`${x2},${y} ${x2 - 11},${y - 6} ${x2 - 11},${y + 6}`} />
    </g>
  )
}

/** Step 1: two acetic acids, each the 180° turn of the other, held by two O···H–O hydrogen bonds. */
function Dimer() {
  const P = { x: 290, y: 300 }
  const len = 100
  const A = { x: P.x - 80, y: P.y - 22 }
  const B = { x: P.x + 80, y: P.y + 22 }
  return (
    <g>
      <Carboxyl c={A} len={len} up={{ label: 'O', double: true }} dr={{ label: 'HO' }} />
      <Carboxyl c={B} len={len} rot up={{ label: 'O', double: true }} dr={{ label: 'HO' }} />
      <Bond a={along(A, DOWN_RIGHT, len)} b={along(B, UP, len, true)} sa={LABEL_GAP} sb={LABEL_GAP} dashed />
      <Bond a={along(B, DOWN_RIGHT, len, true)} b={along(A, UP, len)} sa={LABEL_GAP} sb={LABEL_GAP} dashed />
      <Caption y={560} fill={MUTED}>
        Dashed lines: the hydrogen bonds that pair the two molecules
      </Caption>
    </g>
  )
}

/** Step 2: acetic acid gives its proton to water. Arrows: water lone pair to H; O–H bond onto the acid oxygen. */
function ProtonTransfer() {
  const c = { x: 120, y: 170 }
  const len = 80
  const acidO = along(c, DOWN_RIGHT, len)
  const h = { x: 262, y: 210 }
  const water = { x: 340, y: 210 }
  return (
    <g>
      <Carboxyl c={c} len={len} up={{ label: 'O', double: true }} dr={{ label: 'O' }} />
      <Bond a={acidO} b={h} sa={LABEL_GAP} sb={10} />
      <Atom at={h}>H</Atom>
      <Bond a={water} b={{ x: 372, y: 184 }} sa={LABEL_GAP} sb={10} />
      <Bond a={water} b={{ x: 372, y: 236 }} sa={LABEL_GAP} sb={10} />
      <Atom at={water} fill={ROLE_TONE.base}>
        O
      </Atom>
      <Atom at={{ x: 372, y: 184 }}>H</Atom>
      <Atom at={{ x: 372, y: 236 }}>H</Atom>
      <circle cx={326} cy={196} r={2.6} fill={ROLE_TONE.base} />
      <circle cx={326} cy={224} r={2.6} fill={ROLE_TONE.base} />
      <CurvedArrow from={{ x: 324, y: 198 }} to={{ x: 274, y: 205 }} bend={0.45} />
      <CurvedArrow from={{ x: 226, y: 218 }} to={{ x: 200, y: 214 }} bend={0.5} />
      <Atom at={{ x: 290, y: 300 }}>
        CH<Sub>3</Sub>COOH + H<Sub>2</Sub>O ⇌ CH<Sub>3</Sub>COO⁻ + H<Sub>3</Sub>O⁺
      </Atom>
      <Caption y={346}>
        K<Sub>a</Sub> = [H₃O⁺][CH₃COO⁻] / [CH₃COOH]
      </Caption>
      <Caption y={378}>
        pK<Sub>a</Sub> = −log K<Sub>a</Sub>
      </Caption>
      <Caption y={430} fill={MUTED}>
        Water takes the proton, leaving the acetate ion behind
      </Caption>
    </g>
  )
}

/** Step 3: acetate as two equivalent resonance forms. */
function AcetateForms() {
  const len = 90
  const c1 = { x: 150, y: 250 }
  const c2 = { x: 430, y: 250 }
  return (
    <g>
      <Carboxyl c={c1} len={len} up={{ label: 'O', double: true }} dr={{ label: <>O<Sup>−</Sup></> }} />
      <Carboxyl c={c2} len={len} up={{ label: <>O<Sup>−</Sup></> }} dr={{ label: 'O', double: true }} />
      <ResonanceArrow x1={236} x2={344} y={230} />
      <Caption y={400}>Two equivalent resonance forms of CH₃COO⁻</Caption>
      <Caption y={428} fill={MUTED}>
        The two oxygen atoms share the negative charge equally
      </Caption>
    </g>
  )
}

const R = 50
/** Vertex k of a hexagon centred at c, k = 0 at the top, going clockwise. */
function vertex(c: Pt, k: number): Pt {
  const t = ((-90 + 60 * k) * Math.PI) / 180
  return { x: c.x + R * Math.cos(t), y: c.y + R * Math.sin(t) }
}

/**
 * One resonance form of the phenoxide ring. `doubles` lists edges (edge e joins vertex e and e+1)
 * drawn as double bonds; `charge` is the vertex that carries the negative charge; `exo` draws C=O at the top.
 */
function RingForm({ c, doubles, charge, exo }: { c: Pt; doubles: number[]; charge?: number; exo: 'O⁻' | 'O=' }) {
  const v = [0, 1, 2, 3, 4, 5].map((k) => vertex(c, k))
  const top = v[0]
  const oPt = { x: c.x, y: c.y - R - 34 }
  return (
    <g>
      {charge !== undefined ? <circle cx={v[charge].x} cy={v[charge].y} r={12} fill={HILITE} /> : null}
      {v.map((p, e) => (
        <Bond key={`e${e}`} a={p} b={v[(e + 1) % 6]} order={doubles.includes(e) ? 2 : 1} />
      ))}
      <Bond a={top} b={oPt} sb={LABEL_GAP} order={exo === 'O=' ? 2 : 1} />
      <Atom at={oPt}>{exo === 'O⁻' ? <>O<Sup>−</Sup></> : 'O'}</Atom>
      {charge !== undefined ? (
        <text
          x={v[charge].x + ((v[charge].x - c.x) / R) * 26}
          y={v[charge].y + ((v[charge].y - c.y) / R) * 26}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={18}
          fill={INK}
        >
          −
        </text>
      ) : null}
    </g>
  )
}

/** Step 4: phenoxide, the O⁻ form beside the two ring-carbanion forms. */
function PhenoxideForms() {
  const cs = [
    { x: 110, y: 290 },
    { x: 290, y: 290 },
    { x: 470, y: 290 },
  ]
  return (
    <g>
      <RingForm c={cs[0]} doubles={[1, 3, 5]} exo="O⁻" />
      <RingForm c={cs[1]} doubles={[2, 4]} charge={1} exo="O=" />
      <RingForm c={cs[2]} doubles={[1, 4]} charge={3} exo="O=" />
      <ResonanceArrow x1={172} x2={228} y={270} />
      <ResonanceArrow x1={352} x2={408} y={270} />
      <Caption y={70}>C₆H₅O⁻ (phenoxide): three of its resonance forms</Caption>
      <text x={cs[0].x} y={385} textAnchor="middle" fontSize={15} fill={INK}>
        On oxygen
      </text>
      <text x={cs[1].x} y={385} textAnchor="middle" fontSize={15} fill={INK}>
        On ortho carbon
      </text>
      <text x={cs[2].x} y={385} textAnchor="middle" fontSize={15} fill={INK}>
        On para carbon
      </text>
      <Caption y={440} fill={MUTED}>
        Shaded: the ring carbons that carry the charge
      </Caption>
    </g>
  )
}

function fmt(v: number, approx?: boolean): string {
  const s = Number.isInteger(v) ? v.toFixed(1) : v.toFixed(2)
  return (approx ? 'about ' : '') + s.replace('-', '−')
}

/** One tone per band (strong, moderately strong, weak, extremely weak). */
const BAND_TONE = ['var(--ox)', 'var(--success)', 'var(--accent)', 'var(--base)'] as const

/** Step 5: the pKa ruler with NCERT's values and bands. */
function PkaScale() {
  const AX = 300
  const nudge: Record<string, number> = { 'Benzoic acid': -7, 'Acetic acid': 9 }
  return (
    <g>
      <text x={AX} y={78} textAnchor="middle" fontSize={16} fill={INK}>
        pK<Sub>a</Sub> (NCERT values)
      </text>
      {RULER_BANDS.map((b, i) => (
        <g key={b.name}>
          <rect x={10} y={rulerY(b.from)} width={560} height={rulerY(b.to) - rulerY(b.from)} fill={`color-mix(in srgb, ${BAND_TONE[i]} 14%, transparent)`} />
          <text x={16} y={(rulerY(b.from) + rulerY(b.to)) / 2} dominantBaseline="central" fontSize={15} fill={INK}>
            {b.name}
          </text>
        </g>
      ))}
      <line x1={AX} y1={rulerY(-8)} x2={AX} y2={rulerY(17)} stroke={MUTED} strokeWidth={2} />
      {[0, 5, 10, 15].map((t) => (
        <g key={t}>
          <line x1={AX - 6} y1={rulerY(t)} x2={AX + 6} y2={rulerY(t)} stroke={MUTED} strokeWidth={2} />
          <text x={AX - 12} y={rulerY(t)} textAnchor="end" dominantBaseline="central" fontSize={14} fill={MUTED}>
            {t}
          </text>
        </g>
      ))}
      {RULER_ACIDS.map((name) => {
        const row = pkaRow(name)
        const y = rulerY(row.pKa)
        return (
          <g key={name}>
            <circle cx={AX} cy={y} r={4.5} fill={INK} />
            <text x={AX + 18} y={y + (nudge[name] ?? 0)} dominantBaseline="central" fontSize={15} fill={INK}>
              {`${row.name}, ${fmt(row.pKa, row.approx)}`}
            </text>
          </g>
        )
      })}
    </g>
  )
}

/** Step 6: chloroacetic acid with inductive arrows, and the ordered strip. */
function InductiveStrip() {
  const y = 200
  return (
    <g>
      <Atom at={{ x: 110, y }}>Cl</Atom>
      <Atom at={{ x: 200, y }}>
        CH<Sub>2</Sub>
      </Atom>
      <Atom at={{ x: 300, y }}>COOH</Atom>
      <Bond a={{ x: 110, y }} b={{ x: 200, y }} sa={LABEL_GAP} sb={22} />
      <Bond a={{ x: 200, y }} b={{ x: 300, y }} sa={22} sb={26} />
      <InductiveArrow x1={190} x2={132} y={y - 34} />
      <InductiveArrow x1={290} x2={222} y={y - 34} />
      <Caption y={250} fill={MUTED}>
        Arrows: electron density pulled along the chain towards Cl
      </Caption>
      <text x={W / 2} y={310} textAnchor="middle" fontSize={15} fill={INK}>
        Acids from strongest to weakest
      </text>
      {STRIP_FORMULAS.map((f, i) => (
        <g key={f}>
          <text x={200} y={350 + i * 36} textAnchor="end" fontSize={15} fill={MUTED}>
            {i + 1}
          </text>
          <text x={220} y={350 + i * 36} fontSize={15} fill={INK}>
            {f}
          </text>
        </g>
      ))}
      <text x={400} y={350} fontSize={14} fill={MUTED}>
        strongest
      </text>
      <text x={400} y={350 + (STRIP_FORMULAS.length - 1) * 36} fontSize={14} fill={MUTED}>
        weakest
      </text>
    </g>
  )
}

const FRAMES = [Dimer, ProtonTransfer, AcetateForms, PhenoxideForms, PkaScale, InductiveStrip] as const

/** Acid strength Scrolly: one fixed panel, redrawn in the target state of each Step. Reduced motion needs no tween here. */
export function AcidStrengthScrolly({ step }: AcidStrengthScrollyProps) {
  const index = Math.min(Math.max(Math.round(step), 0), FRAMES.length - 1)
  const Frame = FRAMES[index]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={ACID_STRENGTH_ALT[index]} style={{ display: 'block' }}>
      <Frame />
    </svg>
  )
}
