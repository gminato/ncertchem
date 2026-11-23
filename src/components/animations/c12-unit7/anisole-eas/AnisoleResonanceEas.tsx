'use client'

import { BenzeneRing, CurvedArrow, benzeneVertices, deltaText } from '@/components/organic'
import { ANISOLE_STEP_COUNT, getAnisoleStep } from './anisole-steps'

export interface AnisoleResonanceEasProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

const W = 560
const H = 476

const FG = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const SURFACE = 'var(--surface)'
const RAISED = 'var(--surface-raised)'
const BORDER = 'var(--border)'
const ACCENT = 'var(--accent)'
const ACCENT_SOFT = 'var(--accent-soft)'
const O_TONE = 'var(--atom-o)'
const SUCCESS = 'var(--success)'
const SUCCESS_SOFT = 'var(--success-soft)'
const D_PLUS = 'var(--delta-plus)'
const D_MINUS = 'var(--delta-minus)'
const HIGHLIGHT = 'var(--highlight)'

/**
 * Draws a cyclohexadienyl-like ring for resonance contributors II, III, IV with exact
 * double-bond positions (0-indexed edges: 0 is 1-2, 1 is 2-3, 2 is 3-4, 3 is 4-5, 4 is 5-6, 5 is 6-1).
 */
function PartialDoubleRing({
  cx,
  cy,
  r,
  doubleEdges,
}: {
  cx: number
  cy: number
  r: number
  doubleEdges: readonly number[]
}) {
  const verts = benzeneVertices(r).map((p) => ({ x: cx + p.x, y: cy + p.y }))
  const dblSet = new Set(doubleEdges)

  const innerLine = (i: number) => {
    const p = verts[i]
    const q = verts[(i + 1) % 6]
    const dx = q.x - p.x
    const dy = q.y - p.y
    const len = Math.hypot(dx, dy)
    let nx = -dy / len
    let ny = dx / len
    const mx = (p.x + q.x) / 2 - cx
    const my = (p.y + q.y) / 2 - cy
    if (nx * mx + ny * my > 0) {
      nx = -nx
      ny = -ny
    }
    const off = 9
    const shrink = 0.14
    return {
      x1: p.x + dx * shrink + nx * off,
      y1: p.y + dy * shrink + ny * off,
      x2: q.x - dx * shrink + nx * off,
      y2: q.y - dy * shrink + ny * off,
    }
  }

  return (
    <g>
      <polygon
        points={verts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
        fill="none"
        stroke={FG}
        strokeWidth={2.6}
        strokeLinejoin="round"
      />
      {verts.map((_, i) => {
        if (!dblSet.has(i)) return null
        const l = innerLine(i)
        return (
          <line
            key={`dbl-${i}`}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke={FG}
            strokeWidth={2.2}
            strokeLinecap="round"
          />
        )
      })}
    </g>
  )
}

function LonePairDots({ x, y, horizontal = true }: { x: number; y: number; horizontal?: boolean }) {
  const dx = horizontal ? 4.2 : 0
  const dy = horizontal ? 0 : 4.2
  return (
    <g fill={ACCENT}>
      <circle cx={x - dx} cy={y - dy} r={2.5} />
      <circle cx={x + dx} cy={y + dy} r={2.5} />
    </g>
  )
}

function NegativeSiteBadge({ x, y, labelX, labelY }: { x: number; y: number; labelX: number; labelY: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={14} fill={HIGHLIGHT} />
      <circle cx={labelX} cy={labelY} r={11} fill={SURFACE} stroke={D_MINUS} strokeWidth={1.6} />
      <text
        x={labelX}
        y={labelY}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={17}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        fill={D_MINUS}
      >
        −
      </text>
    </g>
  )
}

function ResonanceHarpoons({ x, y }: { x: number; y: number }) {
  return (
    <g stroke={MUTED} fill={MUTED} strokeWidth={2}>
      <line x1={x - 24} y1={y} x2={x + 24} y2={y} strokeLinecap="round" />
      <polygon points={`${x - 28},${y} ${x - 16},${y - 5.5} ${x - 16},${y + 5.5}`} stroke="none" />
      <polygon points={`${x + 28},${y} ${x + 16},${y - 5.5} ${x + 16},${y + 5.5}`} stroke="none" />
    </g>
  )
}

function DoubleBondOxonium({ xTop, yTop, rLabel = 'R' }: { xTop: number; yTop: number; rLabel?: string }) {
  return (
    <g>
      <line x1={xTop - 3.5} y1={yTop} x2={xTop - 3.5} y2={yTop - 34} stroke={FG} strokeWidth={2.4} strokeLinecap="round" />
      <line x1={xTop + 3.5} y1={yTop} x2={xTop + 3.5} y2={yTop - 34} stroke={FG} strokeWidth={2.4} strokeLinecap="round" />
      <text
        x={xTop}
        y={yTop - 48}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={19}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        fill={O_TONE}
      >
        O⁺
      </text>
      <LonePairDots x={xTop - 18} y={yTop - 48} horizontal={false} />
      <line x1={xTop + 12} y1={yTop - 52} x2={xTop + 34} y2={yTop - 62} stroke={FG} strokeWidth={2.4} strokeLinecap="round" />
      <text
        x={xTop + 42}
        y={yTop - 64}
        textAnchor="start"
        dominantBaseline="central"
        fontSize={18}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill={FG}
      >
        {rLabel}
      </text>
    </g>
  )
}

function Step0Neutral() {
  const cx = 280
  const cy = 248
  const R = 92
  const verts = benzeneVertices(R).map((p) => ({ x: cx + p.x, y: cy + p.y }))
  return (
    <g>
      <rect x={18} y={50} width={524} height={382} rx={12} fill={RAISED} stroke={BORDER} strokeWidth={1.3} />

      {/* Hero Kekule BenzeneRing (full 1:1 scale) */}
      <BenzeneRing variant="kekule" kekuleMix={0} x={cx} y={cy} />

      {/* C1-O orbital overlap glow */}
      <ellipse cx={cx} cy={cy - R - 20} rx={18} ry={28} fill={ACCENT_SOFT} stroke={ACCENT} strokeDasharray="4 3" strokeWidth={1.3} />
      <line x1={cx} y1={cy - R} x2={cx} y2={cy - R - 40} stroke={FG} strokeWidth={2.8} strokeLinecap="round" />
      <text
        x={cx}
        y={cy - R - 54}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={20}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        fill={O_TONE}
      >
        O
      </text>
      <LonePairDots x={cx - 18} y={cy - R - 54} horizontal={false} />
      <LonePairDots x={cx} y={cy - R - 74} />
      <line x1={cx + 12} y1={cy - R - 58} x2={cx + 42} y2={cy - R - 72} stroke={FG} strokeWidth={2.6} strokeLinecap="round" />
      <text
        x={cx + 48}
        y={cy - R - 74}
        textAnchor="start"
        dominantBaseline="central"
        fontSize={19}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill={FG}
      >
        R
      </text>

      {/* Subtle conjugation readiness arrow */}
      <CurvedArrow from={{ x: cx - 22, y: cy - R - 52 }} to={{ x: cx - 4, y: cy - R - 20 }} bend={0.45} />

      {/* Position labels around the ring */}
      {[
        { idx: 1, tag: 'o (C-2)' },
        { idx: 2, tag: 'm (C-3)' },
        { idx: 3, tag: 'p (C-4)' },
        { idx: 4, tag: 'm (C-5)' },
        { idx: 5, tag: 'o (C-6)' },
      ].map(({ idx, tag }) => {
        const p = verts[idx]
        const dx = p.x - cx
        const dy = p.y - cy
        const len = Math.hypot(dx, dy)
        const lx = p.x + (dx / len) * 32
        const ly = p.y + (dy / len) * 30
        const anchor = Math.abs(dx) < 5 ? 'middle' : dx > 0 ? 'start' : 'end'
        const isOrthoPara = tag.startsWith('o') || tag.startsWith('p')
        return (
          <text
            key={tag}
            x={lx}
            y={ly}
            textAnchor={anchor}
            dominantBaseline="central"
            fontSize={16}
            fontWeight={isOrthoPara ? 700 : 500}
            fontFamily="var(--font-sans)"
            fill={isOrthoPara ? ACCENT : MUTED}
          >
            {tag}
          </text>
        )
      })}

      <text x={W / 2} y={408} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fill={FG}>
        Contributor I: lone pairs on :OR sit next to the aromatic π cloud
      </text>
    </g>
  )
}

function Step1OrthoCharge() {
  const r = 62
  const c1 = { x: 142, y: 248 }
  const c2 = { x: 418, y: 248 }
  const v2 = benzeneVertices(r).map((p) => ({ x: c2.x + p.x, y: c2.y + p.y }))

  return (
    <g>
      <rect x={18} y={50} width={524} height={382} rx={12} fill={RAISED} stroke={BORDER} strokeWidth={1.3} />

      {/* Contributor I on left */}
      <g transform={`translate(${c1.x} ${c1.y}) scale(${(r / 92).toFixed(3)})`}>
        <BenzeneRing variant="kekule" kekuleMix={0} />
      </g>
      <line x1={c1.x} y1={c1.y - r} x2={c1.x} y2={c1.y - r - 34} stroke={FG} strokeWidth={2.5} strokeLinecap="round" />
      <text x={c1.x} y={c1.y - r - 48} textAnchor="middle" dominantBaseline="central" fontSize={19} fontWeight={700} fill={O_TONE}>
        O
      </text>
      <LonePairDots x={c1.x - 18} y={c1.y - r - 48} horizontal={false} />
      <LonePairDots x={c1.x} y={c1.y - r - 68} />
      <line x1={c1.x + 12} y1={c1.y - r - 52} x2={c1.x + 34} y2={c1.y - r - 62} stroke={FG} strokeWidth={2.4} strokeLinecap="round" />
      <text x={c1.x + 40} y={c1.y - r - 64} textAnchor="start" dominantBaseline="central" fontSize={18} fontWeight={600} fill={FG}>
        R
      </text>

      {/* Curved arrows on Contributor I */}
      <CurvedArrow from={{ x: c1.x - 22, y: c1.y - r - 44 }} to={{ x: c1.x - 4, y: c1.y - r - 14 }} bend={0.5} />
      <CurvedArrow from={{ x: c1.x + 30, y: c1.y - r + 14 }} to={{ x: c1.x + 62, y: c1.y - r + 28 }} bend={-0.6} />

      <ResonanceHarpoons x={280} y={248} />

      {/* Contributor II on right */}
      <PartialDoubleRing cx={c2.x} cy={c2.y} r={r} doubleEdges={[2, 4]} />
      <DoubleBondOxonium xTop={c2.x} yTop={c2.y - r} />
      <NegativeSiteBadge x={v2[1].x} y={v2[1].y} labelX={v2[1].x + 24} labelY={v2[1].y - 12} />
      <LonePairDots x={v2[1].x + 12} y={v2[1].y + 8} horizontal={false} />

      <text x={c1.x} y={354} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fill={FG}>
        Contributor I
      </text>
      <text x={c2.x} y={354} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fill={D_MINUS}>
        Contributor II (ortho C-2)
      </text>

      <rect x={44} y={380} width={472} height={36} rx={10} fill={SURFACE} stroke={BORDER} />
      <text x={W / 2} y={398} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fill={FG}>
        C=O⁺R forms; ortho C-2 gains a lone pair and − charge
      </text>
    </g>
  )
}

function Step2ParaAndOrtho() {
  const r = 58
  const c3 = { x: 142, y: 220 }
  const c4 = { x: 418, y: 220 }
  const v3 = benzeneVertices(r).map((p) => ({ x: c3.x + p.x, y: c3.y + p.y }))
  const v4 = benzeneVertices(r).map((p) => ({ x: c4.x + p.x, y: c4.y + p.y }))

  return (
    <g>
      <rect x={18} y={50} width={524} height={382} rx={12} fill={RAISED} stroke={BORDER} strokeWidth={1.3} />

      {/* Contributor III: negative charge at para C-4 (v3[3]) */}
      <PartialDoubleRing cx={c3.x} cy={c3.y} r={r} doubleEdges={[1, 4]} />
      <DoubleBondOxonium xTop={c3.x} yTop={c3.y - r} />
      <NegativeSiteBadge x={v3[3].x} y={v3[3].y} labelX={v3[3].x + 22} labelY={v3[3].y + 16} />
      <LonePairDots x={v3[3].x - 16} y={v3[3].y + 14} />

      {/* Curved arrows pushing charge from C-4 -> C-6 */}
      <CurvedArrow from={{ x: v3[3].x - 16, y: v3[3].y + 12 }} to={{ x: c3.x - 28, y: c3.y + 44 }} bend={-0.55} />
      <CurvedArrow from={{ x: c3.x - 56, y: c3.y }} to={{ x: v3[5].x - 10, y: v3[5].y }} bend={-0.55} />

      {/* Uncharged meta labels on III */}
      <text x={v3[2].x + 18} y={v3[2].y} textAnchor="start" dominantBaseline="central" fontSize={16} fill={MUTED}>
        m
      </text>
      <text x={v3[4].x - 18} y={v3[4].y} textAnchor="end" dominantBaseline="central" fontSize={16} fill={MUTED}>
        m
      </text>

      <ResonanceHarpoons x={280} y={220} />

      {/* Contributor IV: negative charge at ortho C-6 (v4[5]) */}
      <PartialDoubleRing cx={c4.x} cy={c4.y} r={r} doubleEdges={[1, 3]} />
      <DoubleBondOxonium xTop={c4.x} yTop={c4.y - r} />
      <NegativeSiteBadge x={v4[5].x} y={v4[5].y} labelX={v4[5].x - 24} labelY={v4[5].y - 12} />
      <LonePairDots x={v4[5].x - 12} y={v4[5].y + 8} horizontal={false} />

      {/* Uncharged meta labels on IV */}
      <text x={v4[2].x + 16} y={v4[2].y} textAnchor="start" dominantBaseline="central" fontSize={16} fill={MUTED}>
        m
      </text>
      <text x={v4[4].x - 16} y={v4[4].y} textAnchor="end" dominantBaseline="central" fontSize={16} fill={MUTED}>
        m
      </text>

      <text x={c3.x} y={326} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fill={D_MINUS}>
        Contributor III (para C-4)
      </text>
      <text x={c4.x} y={326} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fill={D_MINUS}>
        Contributor IV (ortho C-6)
      </text>

      <rect x={34} y={356} width={492} height={60} rx={10} fill={SURFACE} stroke={BORDER} />
      <text x={W / 2} y={376} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fill={FG}>
        Meta positions (C-3, C-5) remain uncharged
      </text>
      <text x={W / 2} y={400} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={500} fill={MUTED}>
        Negative charge visits only C-2, C-4, and C-6
      </text>
    </g>
  )
}

function MiniProductRing({
  cx,
  cy,
  r,
  subLabel,
  position,
}: {
  cx: number
  cy: number
  r: number
  subLabel: string
  position: 'ortho' | 'para'
}) {
  const verts = benzeneVertices(r).map((p) => ({ x: cx + p.x, y: cy + p.y }))
  const target = position === 'ortho' ? verts[1] : verts[3]
  const ex = position === 'ortho' ? target.x + 22 : target.x
  const ey = position === 'ortho' ? target.y - 12 : target.y + 24

  return (
    <g>
      <polygon
        points={verts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
        fill="none"
        stroke={FG}
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      <circle cx={cx} cy={cy} r={r * 0.56} fill="none" stroke={FG} strokeWidth={1.6} />

      {/* Top -OR */}
      <line x1={verts[0].x} y1={verts[0].y} x2={verts[0].x} y2={verts[0].y - 15} stroke={FG} strokeWidth={2.2} />
      <text x={verts[0].x} y={verts[0].y - 26} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fill={O_TONE}>
        OR
      </text>

      {/* Incoming E */}
      <line x1={target.x} y1={target.y} x2={ex} y2={ey} stroke={FG} strokeWidth={2.2} />
      <text
        x={position === 'ortho' ? ex + 10 : ex}
        y={position === 'ortho' ? ey - 4 : ey + 9}
        textAnchor={position === 'ortho' ? 'start' : 'middle'}
        dominantBaseline="central"
        fontSize={16}
        fontWeight={700}
        fill={ACCENT}
      >
        {subLabel}
      </text>
    </g>
  )
}

function Step3EasAttack() {
  const cx = 136
  const cy = 232
  const R = 68
  const verts = benzeneVertices(R).map((p) => ({ x: cx + p.x, y: cy + p.y }))

  return (
    <g>
      <rect x={18} y={50} width={524} height={382} rx={12} fill={RAISED} stroke={BORDER} strokeWidth={1.3} />

      {/* Activated hybrid ring */}
      <g transform={`translate(${cx} ${cy}) scale(${(R / 92).toFixed(3)})`}>
        <BenzeneRing variant="hexagon" />
      </g>

      {/* Partial double-bond C-OR */}
      <line x1={cx} y1={cy - R} x2={cx} y2={cy - R - 34} stroke={FG} strokeWidth={2.6} strokeLinecap="round" />
      <line x1={cx + 6} y1={cy - R - 4} x2={cx + 6} y2={cy - R - 30} stroke={ACCENT} strokeWidth={2} strokeDasharray="4 3" />
      <text x={cx} y={cy - R - 48} textAnchor="middle" dominantBaseline="central" fontSize={19} fontWeight={700} fill={O_TONE}>
        OR
      </text>
      <text x={cx + 26} y={cy - R - 48} textAnchor="start" dominantBaseline="central" fontSize={16} fontWeight={700} fill={D_PLUS}>
        {deltaText('δ+')}
      </text>

      {/* Highlighted ortho and para sites */}
      {[1, 3, 5].map((idx) => (
        <circle key={`hi-${idx}`} cx={verts[idx].x} cy={verts[idx].y} r={14} fill={HIGHLIGHT} />
      ))}
      <text x={verts[1].x + 20} y={verts[1].y - 12} textAnchor="start" dominantBaseline="central" fontSize={16} fontWeight={700} fill={D_MINUS}>
        {deltaText('δ−')}
      </text>
      <text x={verts[3].x} y={verts[3].y + 24} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fill={D_MINUS}>
        {deltaText('δ−')}
      </text>
      <text x={verts[5].x - 20} y={verts[5].y - 12} textAnchor="end" dominantBaseline="central" fontSize={16} fontWeight={700} fill={D_MINUS}>
        {deltaText('δ−')}
      </text>

      {/* Dimmed meta positions */}
      <text x={verts[2].x + 18} y={verts[2].y + 4} textAnchor="start" dominantBaseline="central" fontSize={16} fill={MUTED}>
        m
      </text>
      <text x={verts[4].x - 18} y={verts[4].y + 4} textAnchor="end" dominantBaseline="central" fontSize={16} fill={MUTED}>
        m
      </text>

      {/* Incoming E+ arrows */}
      <text x={294} y={148} textAnchor="middle" dominantBaseline="central" fontSize={19} fontWeight={700} fill={ACCENT}>
        E⁺
      </text>
      <CurvedArrow from={{ x: verts[1].x + 10, y: verts[1].y - 2 }} to={{ x: 274, y: 150 }} bend={-0.25} />

      <text x={294} y={322} textAnchor="middle" dominantBaseline="central" fontSize={19} fontWeight={700} fill={ACCENT}>
        E⁺
      </text>
      <CurvedArrow from={{ x: verts[3].x + 10, y: verts[3].y + 6 }} to={{ x: 274, y: 318 }} bend={0.25} />

      {/* Right side: Ortho (Minor) and Para (Major) product cards */}
      <rect x={340} y={64} width={186} height={154} rx={10} fill={SURFACE} stroke={BORDER} strokeWidth={1.3} />
      <text x={433} y={82} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fill={MUTED}>
        Ortho (minor)
      </text>
      <MiniProductRing cx={420} cy={160} r={22} subLabel="E" position="ortho" />

      <rect x={340} y={232} width={186} height={192} rx={10} fill={SURFACE} stroke={SUCCESS} strokeWidth={1.8} />
      <rect x={340} y={232} width={186} height={32} rx={10} fill={SUCCESS_SOFT} stroke="none" />
      <rect x={340} y={252} width={186} height={12} fill={SUCCESS_SOFT} stroke="none" />
      <text x={433} y={248} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fill={FG}>
        Para (major)
      </text>
      <MiniProductRing cx={433} cy={330} r={21} subLabel="E" position="para" />
      <text x={433} y={408} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={500} fill={SUCCESS}>
        Less steric hindrance
      </text>
    </g>
  )
}

const VIEWS = [Step0Neutral, Step1OrthoCharge, Step2ParaAndOrtho, Step3EasAttack] as const

export function AnisoleResonanceEas({ step, reducedMotion }: AnisoleResonanceEasProps) {
  const spec = getAnisoleStep(step)
  const View = VIEWS[spec.index]
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Anisole resonance and EAS directing effect, ${spec.badge}: ${spec.title}`}
      data-step={spec.index}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        transition: reducedMotion ? 'none' : 'opacity 0.35s ease',
      }}
    >
      <rect x={14} y={10} width={104} height={28} rx={14} fill={ACCENT_SOFT} stroke={ACCENT} strokeWidth={1.2} />
      <text
        x={66}
        y={24}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={16}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        fill={FG}
      >
        {spec.badge}
      </text>
      <text
        x={130}
        y={24}
        dominantBaseline="central"
        fontSize={18}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        fill={FG}
      >
        {spec.title}
      </text>

      <View />

      <text
        x={W / 2}
        y={458}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={16}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill={MUTED}
      >
        {spec.footer}
      </text>
    </svg>
  )
}

export { ANISOLE_STEP_COUNT }
