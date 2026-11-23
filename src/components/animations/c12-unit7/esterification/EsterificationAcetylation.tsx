'use client'

import { useId, type ReactNode } from 'react'
import { CurvedArrow } from '@/components/organic'
import { useReveal } from '@/components/animations/unit4/vbt/useStepTween'
import { ringVertex } from '../acidity/PhenolicRingSvg'
import { ASPIRIN_REACTION, ESTERIFICATION_STEP_COUNT } from './esterification-steps'

export function CleanReactionFlask({
  x,
  y,
  width = 120,
  height = 120,
  level = 0.6,
}: {
  x: number
  y: number
  width?: number
  height?: number
  level?: number
}) {
  const clipId = `clean-flask-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const fill = Math.min(1, Math.max(0, level))
  const top = -height / 2
  const bottom = height / 2
  const left = -width / 2
  const right = width / 2
  const neckW = width * 0.28
  const shoulderY = top + height * 0.42
  const corner = Math.min(10, width / 6)
  const surfaceY = bottom - fill * height

  const closed = [
    `M ${-neckW / 2} ${top}`,
    `L ${-neckW / 2} ${shoulderY}`,
    `L ${left} ${bottom - corner}`,
    `Q ${left} ${bottom} ${left + corner} ${bottom}`,
    `L ${right - corner} ${bottom}`,
    `Q ${right} ${bottom} ${right} ${bottom - corner}`,
    `L ${neckW / 2} ${shoulderY}`,
    `L ${neckW / 2} ${top}`,
    'Z',
  ].join(' ')

  const open = [
    `M ${-neckW / 2 - 4} ${top}`,
    `L ${-neckW / 2} ${top + 4}`,
    `L ${-neckW / 2} ${shoulderY}`,
    `L ${left} ${bottom - corner}`,
    `Q ${left} ${bottom} ${left + corner} ${bottom}`,
    `L ${right - corner} ${bottom}`,
    `Q ${right} ${bottom} ${right} ${bottom - corner}`,
    `L ${neckW / 2} ${shoulderY}`,
    `L ${neckW / 2} ${top + 4}`,
    `L ${neckW / 2 + 4} ${top}`,
  ].join(' ')

  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <clipPath id={clipId}>
          <path d={closed} />
        </clipPath>
      </defs>
      <path d={closed} fill="var(--glass-fill)" />
      {fill > 0 && (
        <g clipPath={`url(#${clipId})`}>
          <rect
            x={left - 8}
            y={surfaceY}
            width={width + 16}
            height={bottom - surfaceY + 8}
            fill="var(--liquid)"
          />
          <line
            x1={left - 8}
            x2={right + 8}
            y1={surfaceY}
            y2={surfaceY}
            stroke="var(--liquid-edge)"
            strokeWidth={1.6}
          />
        </g>
      )}
      <path
        d={open}
        fill="none"
        stroke="var(--glass-wall)"
        strokeWidth={1.8}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Subtle sheen tucked inside the left neck */}
      <line
        x1={-neckW * 0.26}
        y1={top + 10}
        x2={-neckW * 0.26}
        y2={shoulderY - 4}
        stroke="var(--glass-sheen)"
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </g>
  )
}

export interface EsterificationAcetylationProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

const W = 580
const H = 495
const FONT = 'var(--font-sans)'

function Header({ children }: { children: ReactNode }) {
  return (
    <text x={W / 2} y={28} textAnchor="middle" fontSize={18} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
      {children}
    </text>
  )
}

function CardBox({
  x,
  y,
  w,
  h,
  accent,
}: {
  x: number
  y: number
  w: number
  h: number
  accent?: string
}) {
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={12}
      fill="var(--surface-raised)"
      stroke={accent ?? 'var(--border)'}
      strokeWidth={accent ? 1.8 : 1.3}
    />
  )
}

function ReversibleArrow({
  x1,
  x2,
  y,
  above,
  below,
  forwardBias = 0,
}: {
  x1: number
  x2: number
  y: number
  above?: string
  below?: string
  /** -1..1: positive makes forward top arrow stronger and reverse bottom arrow fainter. */
  forwardBias?: number
}) {
  const mid = (x1 + x2) / 2
  const fwdWidth = forwardBias > 0 ? 3 : 2
  const revOpacity = forwardBias > 0.4 ? 0.35 : 0.9
  return (
    <g>
      <line x1={x1} y1={y - 4} x2={x2 - 8} y2={y - 4} stroke="var(--fwd)" strokeWidth={fwdWidth} strokeLinecap="round" />
      <polygon points={`${x2},${y - 4} ${x2 - 9},${y - 9} ${x2 - 9},${y + 1}`} fill="var(--fwd)" />
      <line
        x1={x2}
        y1={y + 5}
        x2={x1 + 8}
        y2={y + 5}
        stroke="var(--rev)"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={revOpacity}
      />
      <polygon
        points={`${x1},${y + 5} ${x1 + 9},${y} ${x1 + 9},${y + 10}`}
        fill="var(--rev)"
        opacity={revOpacity}
      />
      {above && (
        <text x={mid} y={y - 16} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
          {above}
        </text>
      )}
      {below && (
        <text x={mid} y={y + 24} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
          {below}
        </text>
      )}
    </g>
  )
}

function ForwardArrow({
  x1,
  x2,
  y,
  above,
  below,
}: {
  x1: number
  x2: number
  y: number
  above?: string
  below?: string
}) {
  const mid = (x1 + x2) / 2
  return (
    <g>
      <line x1={x1} y1={y} x2={x2 - 10} y2={y} stroke="var(--fwd)" strokeWidth={2.6} strokeLinecap="round" />
      <polygon points={`${x2},${y} ${x2 - 11},${y - 6} ${x2 - 11},${y + 6}`} fill="var(--fwd)" />
      {above && (
        <text x={mid} y={y - 14} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
          {above}
        </text>
      )}
      {below && (
        <text x={mid} y={y + 22} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
          {below}
        </text>
      )}
    </g>
  )
}

function Step0ThreeRoutes({ reveal }: { reveal: number }) {
  const rows = [
    {
      y: 52,
      title: '1. Carboxylic acid (reversible)',
      left: "HO–C(=O)R'",
      arrowType: 'rev' as const,
      cond: 'H⁺ (conc. H₂SO₄)',
      byproduct: 'H₂O',
      accent: 'var(--accent)',
    },
    {
      y: 184,
      title: '2. Acid anhydride (reversible)',
      left: "R'CO–O–COR'",
      arrowType: 'rev' as const,
      cond: 'H⁺ (conc. H₂SO₄)',
      byproduct: "R'COOH",
      accent: 'var(--orbital-neg)',
    },
    {
      y: 316,
      title: '3. Acid chloride (base-assisted)',
      left: "Cl–C(=O)R'",
      arrowType: 'fwd' as const,
      cond: 'Pyridine',
      byproduct: 'HCl',
      accent: 'var(--fwd)',
    },
  ]

  return (
    <g opacity={reveal}>
      <Header>All three acylating routes cleave the O–H bond</Header>

      {rows.map((row) => (
        <g key={row.title}>
          <CardBox x={14} y={row.y} w={552} h={116} accent={row.accent} />
          <text x={30} y={row.y + 26} fontSize={15} fontWeight={700} fontFamily={FONT} fill={row.accent}>
            {row.title}
          </text>

          {/* Substrate with highlighted O-H cleavage */}
          <text x={24} y={row.y + 72} fontSize={16} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
            Ar/R–
          </text>
          <text x={72} y={row.y + 72} fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--atom-o)">
            O
          </text>
          <line x1={87} y1={row.y + 66} x2={106} y2={row.y + 66} stroke="var(--fg)" strokeWidth={2} />
          <line
            x1={93}
            y1={row.y + 77}
            x2={101}
            y2={row.y + 55}
            stroke="var(--rev)"
            strokeWidth={2.4}
            strokeDasharray="3 2"
          />
          <text x={110} y={row.y + 72} fontSize={16} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
            H
          </text>

          <text x={134} y={row.y + 72} textAnchor="middle" fontSize={16} fontFamily={FONT} fill="var(--fg-muted)">
            +
          </text>

          {/* Acylating partner */}
          <text x={198} y={row.y + 72} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily={FONT} fill="var(--accent)">
            {row.left}
          </text>

          {/* Reaction arrow */}
          {row.arrowType === 'rev' ? (
            <ReversibleArrow x1={258} x2={334} y={row.y + 66} above={row.cond} />
          ) : (
            <ForwardArrow x1={258} x2={334} y={row.y + 66} above={row.cond} />
          )}

          {/* Ester product + byproduct */}
          <text x={346} y={row.y + 72} fontSize={16} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
            Ar/R–
          </text>
          <text x={394} y={row.y + 72} fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--atom-o)">
            O
          </text>
          <text x={408} y={row.y + 72} fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--accent)">
            –COR&apos;
          </text>
          <text x={474} y={row.y + 72} fontSize={16} fontFamily={FONT} fill="var(--fg-muted)">
            + {row.byproduct}
          </text>
        </g>
      ))}

      <text x={W / 2} y={456} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        Alcohol or phenol oxygen stays in the ester;
      </text>
      <text x={W / 2} y={478} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        only the O–H hydrogen leaves with the acyl byproduct.
      </text>
    </g>
  )
}

function Step1WaterRemoval({ reveal }: { reveal: number }) {
  return (
    <g opacity={reveal}>
      <Header>Removing H₂O shifts acid-catalysed esterification right</Header>

      {/* Balanced reaction banner */}
      <CardBox x={14} y={44} w={552} h={68} />
      <text x={228} y={84} textAnchor="end" fontSize={17} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        Ar/R–OH + R&apos;–COOH
      </text>
      <ReversibleArrow x1={238} x2={322} y={78} above="conc. H₂SO₄" />
      <text x={332} y={84} textAnchor="start" fontSize={17} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        Ar/R–OCOR&apos; + H₂O
      </text>

      {/* Left flask: Water retained -> reversible back-hydrolysis */}
      <CardBox x={14} y={124} w={268} h={310} accent="var(--rev)" />
      <text x={148} y={150} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--rev)">
        H₂O stays in flask
      </text>
      <CleanReactionFlask x={148} y={252} width={136} height={116} level={0.62} />
      <text x={148} y={286} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        H₂O + Ester
      </text>
      <ReversibleArrow x1={98} x2={198} y={346} above="Hydrolysis back" />
      <text x={148} y={394} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg)">
        H₂O attacks ester back
      </text>
      <text x={148} y={418} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily={FONT} fill="var(--rev)">
        Equilibrium stalls midway
      </text>

      {/* Right flask: Water removed continuously -> Le Chatelier shift right */}
      <CardBox x={298} y={124} w={268} h={310} accent="var(--fwd)" />
      <text x={432} y={150} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--fwd)">
        H₂O removed continuously
      </text>
      <CleanReactionFlask x={432} y={252} width={136} height={116} level={0.58} />
      <text x={432} y={286} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill="var(--fwd)">
        Ester builds up
      </text>
      {/* Upward vapour removal arrow */}
      <line x1={432} y1={190} x2={432} y2={168} stroke="var(--accent)" strokeWidth={2.6} strokeLinecap="round" />
      <polygon points="432,162 426,172 438,172" fill="var(--accent)" />
      <text x={452} y={182} textAnchor="start" fontSize={15} fontWeight={700} fontFamily={FONT} fill="var(--accent)">
        H₂O ↑ out
      </text>

      <ReversibleArrow x1={382} x2={482} y={346} forwardBias={0.8} above="Shifted right" />
      <text x={432} y={394} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg)">
        Reverse hydrolysis blocked
      </text>
      <text x={432} y={418} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily={FONT} fill="var(--fwd)">
        High ester yield
      </text>

      <text x={W / 2} y={456} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        Le Chatelier principle: removing H₂O as it forms
      </text>
      <text x={W / 2} y={478} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        shifts the reversible equilibrium toward the ester.
      </text>
    </g>
  )
}

function PyridineRing({ cx, cy, r = 34 }: { cx: number; cy: number; r?: number }) {
  const verts = Array.from({ length: 6 }, (_, k) => ringVertex(cx, cy, r, k))
  // Nitrogen sits at vertex 3 (bottom)
  const doublePairs: [number, number][] = [
    [0, 1],
    [2, 3],
    [4, 5],
  ]
  return (
    <g>
      {verts.map((p, i) => {
        const q = verts[(i + 1) % 6]
        // Shorten edges meeting N at vertex 3
        const shrinkA = i === 3 ? 0.24 : 0
        const shrinkB = (i + 1) % 6 === 3 ? 0.24 : 0
        const x1 = p.x + (q.x - p.x) * shrinkA
        const y1 = p.y + (q.y - p.y) * shrinkA
        const x2 = q.x - (q.x - p.x) * shrinkB
        const y2 = q.y - (q.y - p.y) * shrinkB
        return <line key={`ps-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
      })}
      {doublePairs.map(([a, b], idx) => {
        const p = verts[a]
        const q = verts[b]
        const mx = (p.x + q.x) / 2
        const my = (p.y + q.y) / 2
        const dx = q.x - p.x
        const dy = q.y - p.y
        const len = Math.hypot(dx, dy) || 1
        let nx = -dy / len
        let ny = dx / len
        if (nx * (cx - mx) + ny * (cy - my) < 0) {
          nx = -nx
          ny = -ny
        }
        return (
          <line
            key={`pd-${idx}`}
            x1={p.x + dx * 0.2 + nx * 6}
            y1={p.y + dy * 0.2 + ny * 6}
            x2={q.x - dx * 0.2 + nx * 6}
            y2={q.y - dy * 0.2 + ny * 6}
            stroke="var(--fg)"
            strokeWidth={2}
            strokeLinecap="round"
          />
        )
      })}
      <circle cx={verts[3].x} cy={verts[3].y} r={10} fill="var(--surface-raised)" />
      <text
        x={verts[3].x}
        y={verts[3].y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={16}
        fontWeight={700}
        fontFamily={FONT}
        fill="var(--atom-n)"
      >
        N
      </text>
      <circle cx={verts[3].x - 3} cy={verts[3].y + 13} r={2.2} fill="var(--atom-n)" />
      <circle cx={verts[3].x + 3} cy={verts[3].y + 13} r={2.2} fill="var(--atom-n)" />
    </g>
  )
}

function Step2Pyridine({ reveal }: { reveal: number }) {
  return (
    <g opacity={reveal}>
      <Header>Pyridine neutralises HCl to drive esterification right</Header>

      {/* Top main reaction */}
      <CardBox x={14} y={48} w={552} h={134} accent="var(--accent)" />
      <text x={290} y={76} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill="var(--accent)">
        Acyl chloride route (fast O–H acylation)
      </text>
      <text x={232} y={120} textAnchor="end" fontSize={18} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        R/Ar–OH + R&apos;–COCl
      </text>
      <ForwardArrow x1={244} x2={326} y={114} above="Pyridine" />
      <text x={338} y={120} textAnchor="start" fontSize={18} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        R/Ar–OCOR&apos; + HCl
      </text>
      <text x={290} y={160} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        Strong acylating partner; HCl byproduct must be trapped immediately.
      </text>

      {/* Bottom Pyridine trapping mechanism */}
      <CardBox x={14} y={200} w={552} h={236} />
      <text x={290} y={228} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        How pyridine pulls equilibrium right
      </text>

      <PyridineRing cx={110} cy={306} r={36} />
      <text x={110} y={388} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        Pyridine (base)
      </text>

      <text x={182} y={320} textAnchor="middle" fontSize={18} fontFamily={FONT} fill="var(--fg-muted)">
        +
      </text>

      <text x={236} y={320} textAnchor="middle" fontSize={18} fontWeight={700} fontFamily={FONT} fill="var(--rev)">
        H–Cl
      </text>
      <text x={236} y={388} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        Acid byproduct
      </text>

      <CurvedArrow from={{ x: 112, y: 358 }} to={{ x: 214, y: 326 }} bend={0.45} gap={2} headSize={9} />
      <CurvedArrow from={{ x: 236, y: 311 }} to={{ x: 252, y: 306 }} bend={-0.55} gap={2} headSize={8} />

      <ForwardArrow x1={276} x2={344} y={316} above="Neutralises" />

      <CardBox x={358} y={258} w={194} h={110} accent="var(--fwd)" />
      <text x={455} y={300} textAnchor="middle" fontSize={17} fontWeight={700} fontFamily={FONT} fill="var(--fwd)">
        C₅H₅NH⁺ Cl⁻
      </text>
      <text x={455} y={330} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg)">
        Pyridinium chloride
      </text>
      <text x={455} y={352} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        (HCl removed as salt)
      </text>

      <text x={W / 2} y={456} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        Neutralising HCl continuously as it forms
      </text>
      <text x={W / 2} y={478} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        drives the reaction cleanly to the right.
      </text>
    </g>
  )
}

function SalicylicOrAspirinRing({
  cx,
  cy,
  r = 38,
  acetylated,
}: {
  cx: number
  cy: number
  r?: number
  acetylated: boolean
}) {
  const verts = Array.from({ length: 6 }, (_, k) => ringVertex(cx, cy, r, k))
  const c1 = verts[0]
  const c2 = verts[1]
  const innerR = r * (Math.sqrt(3) / 2) * 0.68
  const c1Top = { x: c1.x, y: c1.y - 24 }
  const c2Out = { x: c2.x + 22, y: c2.y - 12 }

  return (
    <g>
      <polygon
        points={verts.map((v) => `${v.x.toFixed(1)},${v.y.toFixed(1)}`).join(' ')}
        fill="none"
        stroke="var(--fg)"
        strokeWidth={2.3}
        strokeLinejoin="round"
      />
      <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="var(--fg)" strokeWidth={1.8} />

      {/* C1: COOH untouched */}
      <line x1={c1.x} y1={c1.y} x2={c1Top.x} y2={c1Top.y + 8} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
      <text
        x={c1Top.x}
        y={c1Top.y - 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={16}
        fontWeight={700}
        fontFamily={FONT}
        fill="var(--fg)"
      >
        COOH
      </text>

      {/* C2: phenolic OH (cleaved) or OCOCH3 (aspirin) */}
      <line x1={c2.x} y1={c2.y} x2={c2Out.x} y2={c2Out.y} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
      {acetylated ? (
        <g>
          <rect
            x={c2Out.x + 2}
            y={c2Out.y - 15}
            width={82}
            height={26}
            rx={6}
            fill="var(--accent-soft)"
            stroke="var(--accent)"
            strokeWidth={1.3}
          />
          <text
            x={c2Out.x + 43}
            y={c2Out.y - 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={15}
            fontWeight={700}
            fontFamily={FONT}
            fill="var(--accent)"
          >
            OCOCH₃
          </text>
        </g>
      ) : (
        <g>
          <circle cx={c2Out.x + 16} cy={c2Out.y - 2} r={14} fill="var(--highlight)" />
          <text
            x={c2Out.x + 16}
            y={c2Out.y - 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={16}
            fontWeight={700}
            fontFamily={FONT}
            fill="var(--atom-o)"
          >
            OH
          </text>
        </g>
      )}
    </g>
  )
}

function Step3Aspirin({ reveal }: { reveal: number }) {
  return (
    <g opacity={reveal}>
      <Header>Acetylation of salicylic acid produces Aspirin</Header>

      <CardBox x={14} y={46} w={552} h={286} />

      <text x={106} y={84} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily={FONT} fill="var(--fg-muted)">
        –COOH untouched
      </text>
      <SalicylicOrAspirinRing cx={98} cy={196} r={38} acetylated={false} />
      <text x={108} y={266} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        Salicylic acid
      </text>
      <text x={108} y={288} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        2-Hydroxybenzoic acid
      </text>

      <text x={186} y={200} textAnchor="middle" fontSize={18} fontFamily={FONT} fill="var(--fg-muted)">
        +
      </text>

      {/* Acetic anhydride */}
      <rect x={198} y={176} width={96} height={38} rx={8} fill="var(--surface)" stroke="var(--accent)" strokeWidth={1.4} />
      <text x={246} y={200} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--accent)">
        (CH₃CO)₂O
      </text>
      <text x={246} y={236} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        Acetic anhydride
      </text>

      <ForwardArrow x1={302} x2={352} y={196} above={ASPIRIN_REACTION.catalyst} />

      <SalicylicOrAspirinRing cx={408} cy={196} r={38} acetylated />
      <text x={432} y={266} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill="var(--accent)">
        Acetylsalicylic acid (Aspirin)
      </text>
      <text x={432} y={292} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        +  {ASPIRIN_REACTION.byproduct}  (Acetic acid)
      </text>

      {/* Medicinal properties strip (NCERT p. 208 sidebar) */}
      <CardBox x={14} y={348} w={552} h={92} accent="var(--fwd)" />
      <text x={290} y={376} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--fwd)">
        Why aspirin is used in medicine (NCERT 7.4.4)
      </text>
      <rect x={28} y={392} width={174} height={32} rx={8} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.1} />
      <text x={115} y={408} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        Analgesic (pain relief)
      </text>
      <rect x={212} y={392} width={160} height={32} rx={8} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.1} />
      <text x={292} y={408} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        Anti-inflammatory
      </text>
      <rect x={382} y={392} width={170} height={32} rx={8} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.1} />
      <text x={467} y={408} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        Antipyretic (fever)
      </text>

      <text x={W / 2} y={456} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        Only phenolic –OH is acetylated to –OCOCH₃;
      </text>
      <text x={W / 2} y={478} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        the carboxylic acid (–COOH) group stays untouched.
      </text>
    </g>
  )
}

export function EsterificationAcetylation({ step, reducedMotion }: EsterificationAcetylationProps) {
  const index = Math.min(Math.max(Math.trunc(step), 0), ESTERIFICATION_STEP_COUNT - 1)
  const reveal = useReveal(index, reducedMotion, 0.55)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Esterification and acetylation, step ${index + 1} of ${ESTERIFICATION_STEP_COUNT}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {index === 0 && <Step0ThreeRoutes reveal={reveal} />}
      {index === 1 && <Step1WaterRemoval reveal={reveal} />}
      {index === 2 && <Step2Pyridine reveal={reveal} />}
      {index === 3 && <Step3Aspirin reveal={reveal} />}
    </svg>
  )
}
