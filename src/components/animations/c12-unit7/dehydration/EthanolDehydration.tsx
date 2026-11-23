'use client'

import React from 'react'
import { CurvedArrow } from '@/components/organic'
import { smoothThrough } from '@/components/vocab/kinetics/geometry'
import {
  DEHYDRATION_COMPARISON,
  DEHYDRATION_STEPS,
  E1_PROFILE_LEVELS,
} from './dehydration-steps'

export interface EthanolDehydrationProps {
  step: number
  reducedMotion: boolean
}

const W = 600
const H = 500
const FONT = 'var(--font-sans)'
const INK = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const BOND = 'var(--bond)'
const OXYGEN = 'var(--atom-o)'
const LONE_PAIR = 'var(--lone-pair)'
const ACCENT = 'var(--accent)'
const SUCCESS = 'var(--success)'
const OX = 'var(--ox)'
const PROTON = 'var(--proton)'
const HIGHLIGHT = 'var(--highlight)'

function TitleBlock({ stepIndex }: { stepIndex: number }) {
  const meta = DEHYDRATION_STEPS[stepIndex]
  return (
    <g>
      <text x={W / 2} y={32} textAnchor="middle" fontSize={20} fontWeight={700} fontFamily={FONT} fill={INK}>
        {meta.title}
      </text>
      <text x={W / 2} y={56} textAnchor="middle" fontSize={16} fontWeight={500} fontFamily={FONT} fill={MUTED}>
        {meta.subtitle}
      </text>
    </g>
  )
}

function EquilibriumArrow({
  x0,
  x1,
  y,
  topLabel,
  tone = MUTED,
}: {
  x0: number
  x1: number
  y: number
  topLabel: string
  tone?: string
}) {
  const mx = (x0 + x1) / 2
  return (
    <g>
      <line x1={x0} y1={y - 4} x2={x1 - 2} y2={y - 4} stroke={tone} strokeWidth={2.2} strokeLinecap="round" />
      <path d={`M ${x1 - 9} ${y - 9} L ${x1} ${y - 4} L ${x1 - 9} ${y + 1}`} fill="none" stroke={tone} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      <line x1={x1} y1={y + 4} x2={x0 + 2} y2={y + 4} stroke={tone} strokeWidth={2.2} strokeLinecap="round" />
      <path d={`M ${x0 + 9} ${y - 1} L ${x0} ${y + 4} L ${x0 + 9} ${y + 9}`} fill="none" stroke={tone} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      <text x={mx} y={y - 18} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill={tone}>
        {topLabel}
      </text>
    </g>
  )
}

function LonePairDots({ x, y, horizontal = true }: { x: number; y: number; horizontal?: boolean }) {
  const dx = horizontal ? 4.5 : 0
  const dy = horizontal ? 0 : 4.5
  return (
    <g>
      <circle cx={x - dx} cy={y - dy} r={2.8} fill={LONE_PAIR} />
      <circle cx={x + dx} cy={y + dy} r={2.8} fill={LONE_PAIR} />
    </g>
  )
}

function ChargeCircle({ x, y, sign = '+', tone = PROTON }: { x: number; y: number; sign?: string; tone?: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={10} fill="var(--surface)" stroke={tone} strokeWidth={1.8} />
      <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fontFamily={FONT} fill={tone}>
        {sign}
      </text>
    </g>
  )
}

function BondLine({
  x1,
  y1,
  x2,
  y2,
  stroke = BOND,
  width = 2.6,
  dashed = false,
  halo,
}: {
  x1: number
  y1: number
  x2: number
  y2: number
  stroke?: string
  width?: number
  dashed?: boolean
  halo?: string
}) {
  return (
    <g>
      {halo && (
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={halo} strokeWidth={12} strokeLinecap="round" opacity={0.45} />
      )}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={stroke}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={dashed ? '5 4' : undefined}
      />
    </g>
  )
}

function AtomText({
  x,
  y,
  label,
  fill = INK,
  size = 18,
}: {
  x: number
  y: number
  label: string
  fill?: string
  size?: number
}) {
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={size} fontWeight={700} fontFamily={FONT} fill={fill}>
      {label}
    </text>
  )
}

/**
 * Draws the 3-step E1 reaction energy diagram along the lower half of Steps 1-3,
 * spotlighting the active stationary point or barrier.
 */
function E1Diagram({ activeStep }: { activeStep: 0 | 1 | 2 }) {
  const px = 64
  const py = 294
  const pw = 496
  const ph = 148
  const bottom = py + ph
  const fractions = [0.06, 0.19, 0.30, 0.54, 0.69, 0.80, 0.92]
  const pts = E1_PROFILE_LEVELS.map((lv, i) => ({
    x: px + fractions[i] * pw,
    y: bottom - lv * (ph - 42) - 10,
  }))
  const curve = smoothThrough([
    { x: px + 8, y: pts[0].y },
    ...pts,
    { x: px + pw - 8, y: pts[pts.length - 1].y },
  ])

  const focusNode = activeStep === 0 ? pts[2] : activeStep === 1 ? pts[3] : pts[6]
  const focusTone = activeStep === 1 ? PROTON : activeStep === 2 ? SUCCESS : ACCENT
  const focusLabel =
    activeStep === 0 ? 'Oxonium ion' : activeStep === 1 ? 'TS 2 (Slow RDS)' : 'Ethene + H⁺'
  const focusLabelX =
    activeStep === 2 ? Math.min(focusNode.x, 514) : Math.min(Math.max(focusNode.x, 128), 494)
  const focusLabelY =
    activeStep === 1 ? pts[3].y - 22 : activeStep === 2 ? focusNode.y - 22 : focusNode.y - 18
  const takeaway = DEHYDRATION_STEPS[activeStep].takeaway

  return (
    <g>
      <rect x={16} y={282} width={568} height={204} rx={14} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.2} />
      <line x1={px} y1={py} x2={px} y2={bottom} stroke="var(--kin-axis)" strokeWidth={1.8} />
      <path d={`M ${px - 4} ${py + 8} L ${px} ${py} L ${px + 4} ${py + 8}`} fill="none" stroke="var(--kin-axis)" strokeWidth={1.8} />
      <line x1={px} y1={bottom} x2={px + pw} y2={bottom} stroke="var(--kin-axis)" strokeWidth={1.8} />
      <path d={`M ${px + pw - 8} ${bottom - 4} L ${px + pw} ${bottom} L ${px + pw - 8} ${bottom + 4}`} fill="none" stroke="var(--kin-axis)" strokeWidth={1.8} />

      <text transform={`translate(${px - 26} ${py + ph / 2}) rotate(-90)`} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily={FONT} fill={MUTED}>
        Energy
      </text>

      <path d={curve} fill="none" stroke={ACCENT} strokeWidth={3.2} strokeLinecap="round" />

      {/* Highlight activation barrier for Step 2 RDS */}
      {activeStep === 1 && (
        <g>
          <line x1={pts[2].x} y1={pts[2].y} x2={pts[3].x} y2={pts[2].y} stroke={PROTON} strokeWidth={1.5} strokeDasharray="4 4" />
          <line x1={pts[3].x} y1={pts[2].y} x2={pts[3].x} y2={pts[3].y + 11} stroke={PROTON} strokeWidth={2.2} />
          <text
            x={pts[3].x - 10}
            y={pts[2].y - 10}
            textAnchor="end"
            fontSize={16}
            fontWeight={700}
            fontFamily={FONT}
            fill={PROTON}
            stroke="var(--surface)"
            strokeWidth={5}
            paintOrder="stroke"
          >
            Highest Eₐ
          </text>
        </g>
      )}

      {/* Key valley / peak markers */}
      <circle cx={pts[2].x} cy={pts[2].y} r={4.5} fill={ACCENT} />
      <circle cx={pts[4].x} cy={pts[4].y} r={4.5} fill={OX} />
      <text x={pts[4].x} y={pts[4].y + 22} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily={FONT} fill={MUTED}>
        CH₃CH₂⁺
      </text>

      {/* Active focus halo */}
      <circle cx={focusNode.x} cy={focusNode.y} r={11} fill={focusTone} fillOpacity={0.2} stroke={focusTone} strokeWidth={2.5} />
      <text
        x={focusLabelX}
        y={focusLabelY}
        textAnchor="middle"
        fontSize={16}
        fontWeight={700}
        fontFamily={FONT}
        fill={focusTone}
        stroke="var(--surface)"
        strokeWidth={4}
        paintOrder="stroke"
      >
        {focusLabel}
      </text>

      <text x={W / 2} y={472} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily={FONT} fill={INK}>
        {takeaway}
      </text>
    </g>
  )
}

function StepProtonation() {
  // Left: Ethanol (CH3-CH2-O-H) + H+
  // C2 at (74, 166), C1 at (114, 166), O at (154, 166), H at (192, 166)
  return (
    <g>
      <rect x={16} y={72} width={568} height={198} rx={14} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.2} />

      {/* C2 hydrogens */}
      <BondLine x1={38} y1={166} x2={64} y2={166} />
      <AtomText x={28} y={166} label="H" size={16} fill={MUTED} />
      <BondLine x1={74} y1={134} x2={74} y2={154} />
      <AtomText x={74} y={122} label="H" size={16} fill={MUTED} />
      <BondLine x1={74} y1={178} x2={74} y2={198} />
      <AtomText x={74} y={210} label="H" size={16} fill={MUTED} />

      {/* C2-C1-O-H */}
      <AtomText x={74} y={166} label="C" size={18} />
      <BondLine x1={84} y1={166} x2={104} y2={166} />
      <AtomText x={114} y={166} label="C" size={18} />
      <BondLine x1={114} y1={134} x2={114} y2={154} />
      <AtomText x={114} y={122} label="H" size={16} fill={MUTED} />
      <BondLine x1={114} y1={178} x2={114} y2={198} />
      <AtomText x={114} y={210} label="H" size={16} fill={MUTED} />

      <BondLine x1={124} y1={166} x2={144} y2={166} />
      <AtomText x={156} y={166} label="O" size={18} fill={OXYGEN} />
      <LonePairDots x={156} y={145} />
      <LonePairDots x={156} y={187} />
      <BondLine x1={168} y1={166} x2={184} y2={166} />
      <AtomText x={194} y={166} label="H" size={16} />

      <AtomText x={218} y={166} label="+" size={18} fill={MUTED} />
      <AtomText x={242} y={166} label="H⁺" size={19} fill={PROTON} />

      {/* Curved arrow from O top lone pair to H+ */}
      <CurvedArrow from={{ x: 162, y: 141 }} to={{ x: 236, y: 152 }} bend={-0.48} />

      <EquilibriumArrow x0={266} x1={322} y={166} topLabel="Fast" tone={ACCENT} />

      {/* Right: Ethyl oxonium ion */}
      <BondLine x1={356} y1={166} x2={378} y2={166} />
      <AtomText x={346} y={166} label="H" size={16} fill={MUTED} />
      <BondLine x1={388} y1={134} x2={388} y2={154} />
      <AtomText x={388} y={122} label="H" size={16} fill={MUTED} />
      <BondLine x1={388} y1={178} x2={388} y2={198} />
      <AtomText x={388} y={210} label="H" size={16} fill={MUTED} />
      <AtomText x={388} y={166} label="C" size={18} />

      <BondLine x1={398} y1={166} x2={418} y2={166} />
      <AtomText x={428} y={166} label="C" size={18} />
      <BondLine x1={428} y1={134} x2={428} y2={154} />
      <AtomText x={428} y={122} label="H" size={16} fill={MUTED} />
      <BondLine x1={428} y1={178} x2={428} y2={198} />
      <AtomText x={428} y={210} label="H" size={16} fill={MUTED} />

      <BondLine x1={438} y1={166} x2={462} y2={166} halo={HIGHLIGHT} />
      <AtomText x={474} y={166} label="O" size={18} fill={OXYGEN} />
      <LonePairDots x={474} y={145} />
      <ChargeCircle x={496} y={144} sign="+" />
      <BondLine x1={486} y1={166} x2={504} y2={166} />
      <AtomText x={515} y={166} label="H" size={16} />
      <BondLine x1={474} y1={178} x2={474} y2={198} />
      <AtomText x={474} y={210} label="H" size={16} fill={PROTON} />

      <text x={132} y={250} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily={FONT} fill={MUTED}>
        Ethanol (CH₃CH₂OH)
      </text>
      <text x={450} y={250} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily={FONT} fill={ACCENT}>
        Ethyl oxonium ion
      </text>

      <E1Diagram activeStep={0} />
    </g>
  )
}

function StepCarbocation() {
  return (
    <g>
      <rect x={16} y={72} width={568} height={198} rx={14} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.2} />

      {/* Left: Ethyl oxonium ion with C-O bond cleaving */}
      <BondLine x1={40} y1={166} x2={64} y2={166} />
      <AtomText x={30} y={166} label="H" size={16} fill={MUTED} />
      <BondLine x1={74} y1={134} x2={74} y2={154} />
      <AtomText x={74} y={122} label="H" size={16} fill={MUTED} />
      <BondLine x1={74} y1={178} x2={74} y2={198} />
      <AtomText x={74} y={210} label="H" size={16} fill={MUTED} />
      <AtomText x={74} y={166} label="C" size={18} />

      <BondLine x1={84} y1={166} x2={106} y2={166} />
      <AtomText x={116} y={166} label="C" size={18} />
      <BondLine x1={116} y1={134} x2={116} y2={154} />
      <AtomText x={116} y={122} label="H" size={16} fill={MUTED} />
      <BondLine x1={116} y1={178} x2={116} y2={198} />
      <AtomText x={116} y={210} label="H" size={16} fill={MUTED} />

      {/* Highlighted heterolytic C-O bond */}
      <BondLine x1={126} y1={166} x2={156} y2={166} stroke={OX} width={3.2} dashed halo={OX} />
      <AtomText x={168} y={166} label="O" size={18} fill={OXYGEN} />
      <LonePairDots x={168} y={145} />
      <ChargeCircle x={190} y={144} sign="+" />
      <BondLine x1={180} y1={166} x2={198} y2={166} />
      <AtomText x={208} y={166} label="H" size={16} />
      <BondLine x1={168} y1={178} x2={168} y2={198} />
      <AtomText x={168} y={210} label="H" size={16} />

      {/* Curved arrow from C-O bond midpoint onto O */}
      <CurvedArrow from={{ x: 141, y: 162 }} to={{ x: 166, y: 152 }} bend={-0.65} />

      <EquilibriumArrow x0={232} x1={296} y={166} topLabel="Slow (RDS)" tone={PROTON} />

      {/* Right: Ethyl carbocation + H2O */}
      <BondLine x1={340} y1={166} x2={364} y2={166} />
      <AtomText x={330} y={166} label="H" size={16} fill={MUTED} />
      <BondLine x1={374} y1={134} x2={374} y2={154} />
      <AtomText x={374} y={122} label="H" size={16} fill={MUTED} />
      <BondLine x1={374} y1={178} x2={374} y2={198} />
      <AtomText x={374} y={210} label="H" size={16} fill={MUTED} />
      <AtomText x={374} y={166} label="C" size={18} />

      <BondLine x1={384} y1={166} x2={406} y2={166} />
      <circle cx={418} cy={166} r={16} fill={PROTON} fillOpacity={0.14} stroke={PROTON} strokeWidth={1.6} />
      <AtomText x={418} y={166} label="C" size={18} fill={PROTON} />
      <ChargeCircle x={436} y={144} sign="+" />
      <BondLine x1={418} y1={134} x2={418} y2={150} />
      <AtomText x={418} y={122} label="H" size={16} fill={MUTED} />
      <BondLine x1={418} y1={182} x2={418} y2={198} />
      <AtomText x={418} y={210} label="H" size={16} fill={MUTED} />

      <AtomText x={464} y={166} label="+" size={18} fill={MUTED} />
      <rect x={484} y={146} width={78} height={40} rx={10} fill="var(--surface-raised)" stroke="var(--border)" />
      <AtomText x={523} y={166} label="H₂O" size={18} fill={OXYGEN} />

      <text x={128} y={250} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily={FONT} fill={MUTED}>
        C-O breaks heterolytically
      </text>
      <text x={440} y={250} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily={FONT} fill={PROTON}>
        Ethyl carbocation + H₂O
      </text>

      <E1Diagram activeStep={1} />
    </g>
  )
}

function StepElimination() {
  return (
    <g>
      <rect x={16} y={72} width={568} height={198} rx={14} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.2} />

      {/* Left: Ethyl carbocation with explicit beta C-H bond cleaving */}
      <BondLine x1={44} y1={166} x2={68} y2={166} />
      <AtomText x={34} y={166} label="H" size={16} fill={MUTED} />

      {/* Highlighted beta C-H bond at top */}
      <BondLine x1={78} y1={132} x2={78} y2={154} stroke={SUCCESS} width={3.2} halo={SUCCESS} />
      <AtomText x={78} y={118} label="H" size={17} fill={SUCCESS} />
      <text x={102} y={116} textAnchor="start" fontSize={16} fontWeight={600} fontFamily={FONT} fill={SUCCESS}>
        β-H
      </text>

      <BondLine x1={78} y1={178} x2={78} y2={198} />
      <AtomText x={78} y={210} label="H" size={16} fill={MUTED} />
      <AtomText x={78} y={166} label="C" size={18} />

      <BondLine x1={88} y1={166} x2={122} y2={166} />
      <AtomText x={134} y={166} label="C" size={18} fill={PROTON} />
      <ChargeCircle x={152} y={144} sign="+" />
      <BondLine x1={134} y1={178} x2={134} y2={198} />
      <AtomText x={134} y={210} label="H" size={16} fill={MUTED} />
      <BondLine x1={146} y1={166} x2={168} y2={166} />
      <AtomText x={178} y={166} label="H" size={16} fill={MUTED} />

      {/* Curved arrow from beta C-H bond midpoint into C-C bond */}
      <CurvedArrow from={{ x: 78, y: 143 }} to={{ x: 105, y: 162 }} bend={-0.6} />

      <EquilibriumArrow x0={206} x1={270} y={166} topLabel="Fast" tone={SUCCESS} />

      {/* Right: Ethene (H2C=CH2) + H+ */}
      <AtomText x={312} y={136} label="H" size={16} fill={MUTED} />
      <BondLine x1={322} y1={142} x2={342} y2={158} />
      <AtomText x={312} y={196} label="H" size={16} fill={MUTED} />
      <BondLine x1={322} y1={190} x2={342} y2={174} />

      <AtomText x={352} y={166} label="C" size={18} />
      {/* Double bond C=C */}
      <BondLine x1={364} y1={162} x2={402} y2={162} stroke={INK} width={2.8} />
      <BondLine x1={364} y1={171} x2={402} y2={171} stroke={SUCCESS} width={2.8} halo={SUCCESS} />
      <AtomText x={414} y={166} label="C" size={18} />

      <BondLine x1={424} y1={158} x2={444} y2={142} />
      <AtomText x={454} y={136} label="H" size={16} fill={MUTED} />
      <BondLine x1={424} y1={174} x2={444} y2={190} />
      <AtomText x={454} y={196} label="H" size={16} fill={MUTED} />

      <AtomText x={482} y={166} label="+" size={18} fill={MUTED} />
      <rect x={498} y={146} width={66} height={40} rx={10} fill={SUCCESS} fillOpacity={0.14} stroke={SUCCESS} strokeWidth={1.8} />
      <AtomText x={531} y={166} label="H⁺" size={19} fill={SUCCESS} />

      <text x={144} y={250} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily={FONT} fill={MUTED}>
        β-C-H forms π bond
      </text>
      <text x={428} y={250} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily={FONT} fill={SUCCESS}>
        Ethene + regenerated H⁺
      </text>

      <E1Diagram activeStep={2} />
    </g>
  )
}

function StepComparison() {
  const cardW = 178
  const cardH = 318
  const gap = 15
  const startX = 18
  const cardY = 80
  const maxBarH = 66
  const barBaseY = cardY + 210

  return (
    <g>
      {DEHYDRATION_COMPARISON.map((c, idx) => {
        const x = startX + idx * (cardW + gap)
        const cx = x + cardW / 2
        const barH = Math.round(maxBarH * c.barrierFraction)
        const tone = idx === 2 ? SUCCESS : idx === 1 ? ACCENT : OX
        const isLongName = c.alcoholName === '2-Methylpropan-2-ol'
        return (
          <g key={c.id}>
            <rect
              x={x}
              y={cardY}
              width={cardW}
              height={cardH}
              rx={14}
              fill="var(--surface)"
              stroke={idx === 2 ? SUCCESS : 'var(--border)'}
              strokeWidth={idx === 2 ? 2 : 1.2}
            />
            <rect x={x + 16} y={cardY + 12} width={cardW - 32} height={26} rx={8} fill={tone} fillOpacity={0.14} />
            <text x={cx} y={cardY + 30} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill={tone}>
              {`${c.degree} alcohol`}
            </text>
            {isLongName ? (
              <>
                <text x={cx} y={cardY + 55} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill={INK}>
                  2-Methyl-
                </text>
                <text x={cx} y={cardY + 73} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill={INK}>
                  propan-2-ol
                </text>
              </>
            ) : (
              <text x={cx} y={cardY + 64} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill={INK}>
                {c.alcoholName}
              </text>
            )}
            <text x={cx} y={cardY + 94} textAnchor="middle" fontSize={16} fontWeight={500} fontFamily={FONT} fill={MUTED}>
              {c.alcoholFormula}
            </text>
            <text x={cx} y={cardY + 116} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily={FONT} fill={tone}>
              {`via ${c.carbocationFormula}`}
            </text>

            {/* E1 activation barrier bar */}
            <rect x={cx - 26} y={barBaseY - maxBarH} width={52} height={maxBarH} rx={6} fill="var(--surface-raised)" stroke="var(--border)" />
            <rect x={cx - 26} y={barBaseY - barH} width={52} height={barH} rx={6} fill={tone} fillOpacity={0.78} />
            <text x={cx} y={barBaseY + 21} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill={tone}>
              {c.barrierLabel}
            </text>

            {/* NCERT Condition and Product */}
            <line x1={x + 14} y1={cardY + 244} x2={x + cardW - 14} y2={cardY + 244} stroke="var(--border)" />
            <text x={cx} y={cardY + 268} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill={INK}>
              {`${c.reagentText}, ${c.temperatureK} K`}
            </text>
            <text x={cx} y={cardY + 296} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily={FONT} fill={MUTED}>
              {`→ ${c.productFormula}`}
            </text>
          </g>
        )
      })}

      {/* Bottom NCERT Reactivity Order banner */}
      <rect x={18} y={416} width={564} height={68} rx={12} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.2} />
      <text x={W / 2} y={444} textAnchor="middle" fontSize={17} fontWeight={700} fontFamily={FONT} fill={INK}>
        Dehydration ease: Tertiary (3°) &gt; Secondary (2°) &gt; Primary (1°)
      </text>
      <text x={W / 2} y={470} textAnchor="middle" fontSize={16} fontWeight={500} fontFamily={FONT} fill={MUTED}>
        Stable 3° carbocation lets reaction run at 358 K (20% H₃PO₄)
      </text>
    </g>
  )
}

export function EthanolDehydration({ step }: EthanolDehydrationProps) {
  const k = Math.max(0, Math.min(DEHYDRATION_STEPS.length - 1, Math.round(step)))
  const meta = DEHYDRATION_STEPS[k]
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={`Ethanol dehydration mechanism: ${meta.title}`}
      data-step={k}
      style={{ display: 'block', height: 'auto' }}
    >
      <TitleBlock stepIndex={k} />
      {k === 0 && <StepProtonation />}
      {k === 1 && <StepCarbocation />}
      {k === 2 && <StepElimination />}
      {k === 3 && <StepComparison />}
    </svg>
  )
}
