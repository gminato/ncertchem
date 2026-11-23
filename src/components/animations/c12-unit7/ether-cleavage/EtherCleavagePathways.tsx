'use client'

import type { ReactNode } from 'react'
import { CurvedArrow } from '@/components/organic'
import { CLEAVAGE_STEP_COUNT, getCleavageStep } from './cleavage-steps'

export interface EtherCleavagePathwaysProps {
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
const BOND = 'var(--bond)'
const O_TONE = 'var(--atom-o)'
const I_TONE = 'var(--el-I)'
const SUCCESS = 'var(--success)'
const SUCCESS_SOFT = 'var(--success-soft)'
const CAUTION = 'var(--caution)'
const CAUTION_SOFT = 'var(--caution-soft)'
const ORB_POS = 'var(--orbital-pos)'
const ORB_NEG = 'var(--orbital-neg)'
const D_PLUS = 'var(--delta-plus)'
const D_MINUS = 'var(--delta-minus)'

function Card({
  x,
  y,
  w,
  h,
  label,
  tone = 'neutral',
}: {
  x: number
  y: number
  w: number
  h: number
  label: string
  tone?: 'neutral' | 'accent' | 'caution' | 'success'
}) {
  const stroke =
    tone === 'accent'
      ? ACCENT
      : tone === 'caution'
        ? CAUTION
        : tone === 'success'
          ? SUCCESS
          : BORDER
  const fill =
    tone === 'accent'
      ? ACCENT_SOFT
      : tone === 'caution'
        ? CAUTION_SOFT
        : tone === 'success'
          ? SUCCESS_SOFT
          : RAISED
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={12} fill={SURFACE} stroke={BORDER} strokeWidth={1.3} />
      <rect x={x} y={y} width={w} height={36} rx={12} fill={fill} stroke="none" />
      <rect x={x} y={y + 22} width={w} height={14} fill={fill} stroke="none" />
      <line x1={x} y1={y + 36} x2={x + w} y2={y + 36} stroke={stroke} strokeOpacity={0.35} strokeWidth={1} />
      <text
        x={x + 14}
        y={y + 19}
        dominantBaseline="central"
        fontSize={16}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill={FG}
      >
        {label}
      </text>
    </g>
  )
}

function Pill({
  cx,
  cy,
  w,
  h,
  text,
  tone = 'accent',
}: {
  cx: number
  cy: number
  w: number
  h: number
  text: string
  tone?: 'accent' | 'success' | 'caution' | 'iodide'
}) {
  const fill =
    tone === 'success'
      ? SUCCESS_SOFT
      : tone === 'caution'
        ? CAUTION_SOFT
        : ACCENT_SOFT
  const stroke =
    tone === 'success'
      ? SUCCESS
      : tone === 'caution'
        ? CAUTION
        : tone === 'iodide'
          ? I_TONE
          : ACCENT
  return (
    <g>
      <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={h / 2} fill={fill} stroke={stroke} strokeWidth={1.4} />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={16}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill={FG}
      >
        {text}
      </text>
    </g>
  )
}

function LonePairDots({ x, y }: { x: number; y: number }) {
  return (
    <g fill={ACCENT}>
      <circle cx={x - 4.2} cy={y} r={2.5} />
      <circle cx={x + 4.2} cy={y} r={2.5} />
    </g>
  )
}

function Formula({
  x,
  y,
  children,
  size = 19,
  weight = 600,
  fill = FG,
  anchor = 'middle',
}: {
  x: number
  y: number
  children: ReactNode
  size?: number
  weight?: number
  fill?: string
  anchor?: 'start' | 'middle' | 'end'
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      dominantBaseline="central"
      fontSize={size}
      fontWeight={weight}
      fontFamily="var(--font-sans)"
      fill={fill}
    >
      {children}
    </text>
  )
}

function EqHarpoons({ x, y, len = 44 }: { x: number; y: number; len?: number }) {
  const half = len / 2
  return (
    <g stroke={MUTED} strokeWidth={1.8} strokeLinecap="round" fill="none">
      <line x1={x - half} y1={y - 4} x2={x + half} y2={y - 4} />
      <polyline points={`${x + half - 7},${y - 9} ${x + half},${y - 4}`} />
      <line x1={x - half} y1={y + 4} x2={x + half} y2={y + 4} />
      <polyline points={`${x - half + 7},${y + 9} ${x - half},${y + 4}`} />
    </g>
  )
}

function ReactionArrow({
  x1,
  x2,
  y,
  topLabel,
  bottomLabel,
}: {
  x1: number
  x2: number
  y: number
  topLabel?: string
  bottomLabel?: string
}) {
  const mx = (x1 + x2) / 2
  return (
    <g>
      <line x1={x1} y1={y} x2={x2 - 8} y2={y} stroke={FG} strokeWidth={2.2} strokeLinecap="round" />
      <polygon points={`${x2 - 9},${y - 5} ${x2},${y} ${x2 - 9},${y + 5}`} fill={FG} />
      {topLabel && (
        <text
          x={mx}
          y={y - 16}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={16}
          fontWeight={600}
          fontFamily="var(--font-sans)"
          fill={MUTED}
        >
          {topLabel}
        </text>
      )}
      {bottomLabel && (
        <text
          x={mx}
          y={y + 18}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={16}
          fontWeight={500}
          fontFamily="var(--font-sans)"
          fill={MUTED}
        >
          {bottomLabel}
        </text>
      )}
    </g>
  )
}

function HorizontalBenzene({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const pts = [0, 1, 2, 3, 4, 5].map((k) => {
    const th = (k * 60 * Math.PI) / 180
    return { x: cx + r * Math.cos(th), y: cy + r * Math.sin(th) }
  })
  const innerLine = (i: number) => {
    const p = pts[i]
    const q = pts[(i + 1) % 6]
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
    const off = 6.5
    const s = 0.16
    return {
      x1: p.x + dx * s + nx * off,
      y1: p.y + dy * s + ny * off,
      x2: q.x - dx * s + nx * off,
      y2: q.y - dy * s + ny * off,
    }
  }
  return (
    <g>
      <polygon
        points={pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
        fill="none"
        stroke={FG}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {[0, 2, 4].map((i) => {
        const l = innerLine(i)
        return (
          <line
            key={i}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke={FG}
            strokeWidth={2}
            strokeLinecap="round"
          />
        )
      })}
    </g>
  )
}

function Step0Protonation() {
  return (
    <g>
      <Card x={14} y={50} w={532} h={188} label="1. Oxygen lone pair accepts H⁺ from HI" tone="accent" />
      <Formula x={78} y={154} size={19}>CH₃</Formula>
      <line x1={106} y1={154} x2={138} y2={154} stroke={BOND} strokeWidth={2.6} strokeLinecap="round" />
      <Formula x={154} y={154} size={20} fill={O_TONE} weight={700}>O</Formula>
      <LonePairDots x={154} y={134} />
      <LonePairDots x={154} y={174} />
      <line x1={170} y1={154} x2={200} y2={154} stroke={BOND} strokeWidth={2.6} strokeLinecap="round" />
      <Formula x={244} y={154} size={19}>CH₂CH₃</Formula>

      <Formula x={316} y={154} size={20} fill={MUTED}>+</Formula>

      <Formula x={358} y={154} size={20} weight={700}>H</Formula>
      <text x={358} y={128} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fill={D_PLUS}>
        δ+
      </text>
      <line x1={372} y1={154} x2={410} y2={154} stroke={BOND} strokeWidth={2.6} strokeLinecap="round" />
      <Formula x={426} y={154} size={20} fill={I_TONE} weight={700}>I</Formula>
      <text x={426} y={128} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fill={D_MINUS}>
        δ−
      </text>

      {/* Left-to-right: negative bend arcs UP in SVG */}
      <CurvedArrow from={{ x: 160, y: 126 }} to={{ x: 350, y: 142 }} bend={-0.28} />
      {/* Left-to-right: positive bend arcs DOWN onto I */}
      <CurvedArrow from={{ x: 390, y: 156 }} to={{ x: 422, y: 174 }} bend={0.55} />

      <Pill cx={464} cy={210} w={136} h={28} text="HI > HBr > HCl" tone="accent" />

      <Card x={14} y={248} w={532} h={188} label="2. Equilibrium gives methyl(ethyl)oxonium ion" tone="success" />
      <EqHarpoons x={64} y={338} len={44} />

      <Formula x={136} y={338} size={19}>CH₃</Formula>
      <line x1={164} y1={338} x2={194} y2={338} stroke={BOND} strokeWidth={2.6} strokeLinecap="round" />
      <Formula x={212} y={338} size={20} fill={O_TONE} weight={700}>O⁺</Formula>
      <LonePairDots x={212} y={358} />
      <line x1={212} y1={322} x2={212} y2={304} stroke={BOND} strokeWidth={2.2} strokeLinecap="round" />
      <Formula x={212} y={292} size={17}>H</Formula>
      <line x1={230} y1={338} x2={260} y2={338} stroke={BOND} strokeWidth={2.6} strokeLinecap="round" />

      <rect x={264} y={316} width={110} height={44} rx={10} fill={SUCCESS_SOFT} stroke={SUCCESS} strokeWidth={1.6} />
      <Formula x={319} y={338} size={19}>CH₂CH₃</Formula>

      <Formula x={406} y={338} size={20} fill={MUTED}>+</Formula>
      <Formula x={448} y={338} size={20} fill={I_TONE} weight={700}>I⁻</Formula>

      <Pill cx={280} cy={404} w={330} h={30} text="Good leaving group: neutral CH₃CH₂OH" tone="success" />
    </g>
  )
}

function Step1Sn2Cleavage() {
  return (
    <g>
      <Card x={14} y={50} w={532} h={188} label="1. Backside SN2 attack avoids crowded -CH₂CH₃" tone="accent" />
      <Formula x={58} y={148} size={21} fill={I_TONE} weight={700}>I⁻</Formula>

      <rect x={140} y={126} width={60} height={42} rx={10} fill={ACCENT_SOFT} stroke={ACCENT} strokeWidth={1.5} />
      <Formula x={170} y={148} size={19}>CH₃</Formula>

      <line x1={202} y1={148} x2={236} y2={148} stroke={BOND} strokeWidth={2.6} strokeLinecap="round" />
      <Formula x={256} y={148} size={20} fill={O_TONE} weight={700}>O⁺</Formula>
      <line x1={256} y1={132} x2={256} y2={114} stroke={BOND} strokeWidth={2.2} strokeLinecap="round" />
      <Formula x={256} y={102} size={17}>H</Formula>
      <line x1={276} y1={148} x2={310} y2={148} stroke={BOND} strokeWidth={2.6} strokeLinecap="round" />

      <rect x={314} y={126} width={110} height={42} rx={12} fill={CAUTION_SOFT} stroke={CAUTION} strokeDasharray="4 3" strokeWidth={1.5} />
      <Formula x={369} y={148} size={19}>CH₂CH₃</Formula>

      {/* Electron-pushing arrows */}
      <CurvedArrow from={{ x: 76, y: 144 }} to={{ x: 142, y: 144 }} bend={-0.38} />
      <CurvedArrow from={{ x: 218, y: 150 }} to={{ x: 252, y: 168 }} bend={0.55} />

      <Pill cx={158} cy={208} w={212} h={28} text="Less hindered target" tone="accent" />
      <Pill cx={402} cy={208} w={224} h={28} text="Bulkier group: shielded" tone="caution" />

      {/* Bottom card: Transition state and products */}
      <Card x={14} y={248} w={532} h={188} label="2. Concerted transition state yields CH₃I + CH₃CH₂OH" tone="success" />

      {/* TS bracket [ I ... CH3 ... O(H)R ]‡ */}
      <path d="M 42,306 L 32,306 L 32,380 L 42,380" fill="none" stroke={MUTED} strokeWidth={2} />
      <path d="M 270,306 L 280,306 L 280,380 L 270,380" fill="none" stroke={MUTED} strokeWidth={2} />
      <text x={288} y={308} dominantBaseline="central" fontSize={18} fontWeight={700} fill={MUTED}>‡</text>

      <Formula x={54} y={342} size={19} fill={I_TONE} weight={700}>I</Formula>
      <text x={54} y={318} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fill={D_MINUS}>δ−</text>
      <line x1={66} y1={342} x2={98} y2={342} stroke={ACCENT} strokeWidth={2.4} strokeDasharray="4 4" />
      <Formula x={124} y={342} size={18}>CH₃</Formula>
      <line x1={148} y1={342} x2={178} y2={342} stroke={BOND} strokeWidth={2.4} strokeDasharray="4 4" />
      <Formula x={224} y={342} size={17} fill={O_TONE}>O(H)C₂H₅</Formula>
      <text x={212} y={318} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fill={D_PLUS}>δ+</text>

      <ReactionArrow x1={296} x2={344} y={342} />

      <Pill cx={444} cy={318} w={154} h={32} text="CH₃-I (iodide)" tone="iodide" />
      <Formula x={358} y={366} size={18} fill={MUTED}>+</Formula>
      <Pill cx={454} cy={366} w={152} h={32} text="CH₃CH₂OH (alc.)" tone="success" />

      <Formula x={280} y={414} size={16} weight={500} fill={MUTED}>
        Concerted bond making and bond breaking in one step
      </Formula>
    </g>
  )
}

function Step2ExcessHi() {
  return (
    <g>
      <Card x={14} y={50} w={532} h={188} label="1. Excess conc. HI, high T protonates ethanol" tone="caution" />
      <Formula x={62} y={148} size={18}>CH₃CH₂</Formula>
      <line x1={100} y1={148} x2={124} y2={148} stroke={BOND} strokeWidth={2.6} strokeLinecap="round" />
      <Formula x={136} y={148} size={20} fill={O_TONE} weight={700}>O</Formula>
      <LonePairDots x={136} y={128} />
      <LonePairDots x={136} y={168} />
      <line x1={148} y1={148} x2={170} y2={148} stroke={BOND} strokeWidth={2.6} strokeLinecap="round" />
      <Formula x={180} y={148} size={18}>H</Formula>

      <Formula x={206} y={148} size={19} fill={MUTED}>+</Formula>
      <Formula x={230} y={148} size={19} weight={700}>H</Formula>
      <line x1={240} y1={148} x2={266} y2={148} stroke={BOND} strokeWidth={2.6} strokeLinecap="round" />
      <Formula x={276} y={148} size={20} fill={I_TONE} weight={700}>I</Formula>

      <CurvedArrow from={{ x: 140, y: 122 }} to={{ x: 224, y: 136 }} bend={-0.3} />
      <CurvedArrow from={{ x: 253, y: 150 }} to={{ x: 274, y: 168 }} bend={0.55} />

      <EqHarpoons x={312} y={148} len={32} />
      <Formula x={412} y={148} size={18} fill={FG}>CH₃CH₂-O⁺H₂</Formula>
      <Formula x={490} y={148} size={19} fill={MUTED}>+</Formula>
      <Formula x={518} y={148} size={20} fill={I_TONE} weight={700}>I⁻</Formula>

      <Pill cx={426} cy={210} w={216} h={28} text="Excess conc. HI + heat" tone="caution" />

      <Card x={14} y={248} w={532} h={188} label="2. Second SN2 attack displaces neutral H₂O" tone="success" />
      <Formula x={58} y={340} size={21} fill={I_TONE} weight={700}>I⁻</Formula>
      <Formula x={164} y={340} size={18}>CH₃CH₂</Formula>
      <line x1={206} y1={340} x2={236} y2={340} stroke={BOND} strokeWidth={2.6} strokeLinecap="round" />
      <Formula x={268} y={340} size={19} fill={O_TONE} weight={700}>O⁺H₂</Formula>

      <CurvedArrow from={{ x: 76, y: 330 }} to={{ x: 136, y: 326 }} bend={-0.36} />
      <CurvedArrow from={{ x: 220, y: 342 }} to={{ x: 258, y: 360 }} bend={0.55} />

      <ReactionArrow x1={314} x2={364} y={340} topLabel="SN2" />

      <Pill cx={454} cy={320} w={144} h={32} text="CH₃CH₂-I" tone="iodide" />
      <Pill cx={454} cy={366} w={144} h={32} text="+ H₂O (leaves)" tone="success" />

      <Formula x={280} y={414} size={16} weight={600} fill={MUTED}>
        Overall: CH₃-O-CH₂CH₃ + 2 HI → CH₃I + CH₃CH₂I + H₂O
      </Formula>
    </g>
  )
}

function Step3Sn1Tertiary() {
  return (
    <g>
      <Card x={14} y={50} w={532} h={188} label="1. Slow loss of CH₃OH reveals planar (CH₃)₃C⁺" tone="caution" />

      <Formula x={78} y={142} size={18}>(CH₃)₃C</Formula>
      <line x1={120} y1={142} x2={150} y2={142} stroke={BOND} strokeWidth={2.6} strokeLinecap="round" />
      <Formula x={168} y={142} size={20} fill={O_TONE} weight={700}>O⁺</Formula>
      <line x1={168} y1={126} x2={168} y2={108} stroke={BOND} strokeWidth={2.2} strokeLinecap="round" />
      <Formula x={168} y={97} size={16}>H</Formula>
      <line x1={186} y1={142} x2={212} y2={142} stroke={BOND} strokeWidth={2.6} strokeLinecap="round" />
      <Formula x={236} y={142} size={18}>CH₃</Formula>

      {/* C-O cleavage arrow onto O+ */}
      <CurvedArrow from={{ x: 134, y: 144 }} to={{ x: 164, y: 162 }} bend={0.55} />
      <Pill cx={116} cy={208} w={176} h={28} text="SN2 blocked at 3° C" tone="caution" />

      <ReactionArrow x1={266} x2={334} y={142} topLabel="slow" bottomLabel="RDS" />

      {/* Planar trigonal carbocation (CH3)3C+ with empty p-orbital lobes */}
      <ellipse cx={428} cy={142} rx={62} ry={18} fill={ACCENT_SOFT} stroke={BORDER} strokeDasharray="3 3" />
      <ellipse cx={428} cy={112} rx={10} ry={16} fill={ORB_POS} fillOpacity={0.22} stroke={ORB_POS} strokeWidth={1.6} strokeDasharray="3 3" />
      <ellipse cx={428} cy={172} rx={10} ry={16} fill={ORB_NEG} fillOpacity={0.22} stroke={ORB_NEG} strokeWidth={1.6} strokeDasharray="3 3" />
      <line x1={438} y1={142} x2={474} y2={142} stroke={BOND} strokeWidth={2.4} />
      <line x1={418} y1={138} x2={388} y2={122} stroke={BOND} strokeWidth={2.4} />
      <line x1={418} y1={146} x2={388} y2={162} stroke={BOND} strokeWidth={2.4} />
      <circle cx={428} cy={142} r={11} fill={SURFACE} stroke={FG} strokeWidth={1.4} />
      <Formula x={428} y={142} size={16} weight={700}>C⁺</Formula>
      <Formula x={504} y={142} size={16}>CH₃</Formula>
      <Formula x={364} y={118} size={16}>CH₃</Formula>
      <Formula x={364} y={166} size={16}>CH₃</Formula>

      <Formula x={436} y={210} size={16} weight={600} fill={SUCCESS}>
        Planar (CH₃)₃C⁺ + CH₃OH
      </Formula>

      {/* Bottom card: Fast I- capture */}
      <Card x={14} y={248} w={532} h={188} label="2. Fast I⁻ capture gives tertiary iodide (CH₃)₃C-I" tone="success" />
      <Formula x={70} y={336} size={21} fill={I_TONE} weight={700}>I⁻</Formula>
      <Formula x={106} y={336} size={19} fill={MUTED}>+</Formula>
      <Formula x={182} y={336} size={19} weight={700}>(CH₃)₃C⁺</Formula>

      <CurvedArrow from={{ x: 84, y: 318 }} to={{ x: 162, y: 318 }} bend={-0.35} />

      <ReactionArrow x1={250} x2={318} y={336} topLabel="fast" />

      <Pill cx={428} cy={322} w={172} h={34} text="(CH₃)₃C-I (major)" tone="iodide" />
      <Pill cx={428} cy={368} w={140} h={30} text="+ CH₃OH" tone="success" />

      <Formula x={280} y={414} size={16} weight={500} fill={MUTED}>
        Carbocation stability (3° &gt; 2° &gt; 1°) drives SN1 cleavage
      </Formula>
    </g>
  )
}

function Step4Anisole() {
  return (
    <g>
      <Card x={14} y={50} w={532} h={188} label="1. Partial C=O character strengthens O-C₆H₅" tone="accent" />
      <HorizontalBenzene cx={90} cy={166} r={38} />
      <text x={90} y={166} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fill={ACCENT}>
        sp²
      </text>

      {/* Strong partial-double O-C6H5 bond */}
      <line x1={128} y1={166} x2={192} y2={166} stroke={FG} strokeWidth={2.8} strokeLinecap="round" />
      <line x1={134} y1={174} x2={186} y2={174} stroke={ACCENT} strokeWidth={2.2} strokeDasharray="5 4" />

      <Formula x={210} y={166} size={20} fill={O_TONE} weight={700}>O⁺</Formula>
      <line x1={210} y1={182} x2={210} y2={200} stroke={BOND} strokeWidth={2.2} strokeLinecap="round" />
      <Formula x={210} y={214} size={17}>H</Formula>

      {/* Weaker O-CH3 bond */}
      <line x1={230} y1={166} x2={276} y2={166} stroke={BOND} strokeWidth={2.6} strokeLinecap="round" />
      <Formula x={304} y={166} size={19}>CH₃</Formula>

      <Formula x={454} y={166} size={22} fill={I_TONE} weight={700}>I⁻</Formula>

      {/* Right-to-left: positive bend arcs UP in SVG */}
      <CurvedArrow from={{ x: 434, y: 154 }} to={{ x: 330, y: 154 }} bend={0.34} />
      <CurvedArrow from={{ x: 254, y: 162 }} to={{ x: 220, y: 146 }} bend={0.55} />

      <Pill cx={246} cy={104} w={218} h={28} text="O-C₆H₅ locked (strong)" tone="accent" />
      <Pill cx={386} cy={214} w={194} h={28} text="Cleaves O-CH₃ only" tone="iodide" />

      {/* Bottom card: Phenol + CH3I and blocked substitution */}
      <Card x={14} y={248} w={532} h={188} label="2. Products: phenol + CH₃I (phenol resists HI)" tone="success" />
      <HorizontalBenzene cx={80} cy={354} r={34} />
      <line x1={114} y1={354} x2={140} y2={354} stroke={BOND} strokeWidth={2.6} strokeLinecap="round" />
      <Formula x={160} y={354} size={19} fill={O_TONE} weight={700}>OH</Formula>

      <Formula x={198} y={354} size={20} fill={MUTED}>+</Formula>
      <Pill cx={260} cy={354} w={84} h={34} text="CH₃-I" tone="iodide" />

      <rect x={324} y={302} width={206} height={112} rx={10} fill={CAUTION_SOFT} stroke={CAUTION} strokeWidth={1.5} />
      <Formula x={427} y={326} size={16} weight={700} fill={FG}>
        Phenol + excess HI
      </Formula>
      <Formula x={427} y={356} size={17} weight={700} fill={D_PLUS}>
        No C₆H₅-I formed
      </Formula>
      <Formula x={427} y={388} size={16} weight={500} fill={MUTED}>
        sp² C blocks SN2 / SN1
      </Formula>
    </g>
  )
}

const VIEWS = [
  Step0Protonation,
  Step1Sn2Cleavage,
  Step2ExcessHi,
  Step3Sn1Tertiary,
  Step4Anisole,
] as const

export function EtherCleavagePathways({ step, reducedMotion }: EtherCleavagePathwaysProps) {
  const spec = getCleavageStep(step)
  const View = VIEWS[spec.index]
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Ether cleavage with HI, ${spec.badge}: ${spec.title}`}
      data-step={spec.index}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        transition: reducedMotion ? 'none' : 'opacity 0.35s ease',
      }}
    >
      {/* Header strip */}
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

      {/* Footer takeaway */}
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

export { CLEAVAGE_STEP_COUNT }
