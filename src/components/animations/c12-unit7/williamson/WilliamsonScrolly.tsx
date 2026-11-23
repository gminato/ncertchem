'use client'

import { CurvedArrow, SkeletalFormula } from '@/components/organic'
import {
  ChemArrow,
  LonePairDots,
  StatusPill,
  SvgCard,
  SvgHeader,
  clampStep,
} from '../ether-svg-helpers'
import { WILLIAMSON_GRAPHS, WILLIAMSON_STEPS } from './williamson-steps'

export interface WilliamsonScrollyProps {
  step: number
  reducedMotion: boolean
}

const W = 560
const H = 472

/** Draw a clean benzene hexagon centred at (cx, cy) with circumradius r. */
function PhenylHexagon({ cx, cy, r = 34 }: { cx: number; cy: number; r?: number }) {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = ((-90 + 60 * i) * Math.PI) / 180
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`
  }).join(' ')
  return (
    <g>
      <polygon
        points={pts}
        fill="none"
        stroke="var(--fg)"
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.62}
        fill="none"
        stroke="var(--fg)"
        strokeWidth={1.8}
      />
    </g>
  )
}

function StepGeneralSn2() {
  return (
    <g>
      <SvgHeader
        width={W}
        title={WILLIAMSON_STEPS[0].title}
        subtitle={WILLIAMSON_STEPS[0].subtitle}
      />

      {/* General equation banner */}
      <SvgCard x={20} y={76} width={520} height={48} tone="accent" />
      <text x={280} y={100} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        R–X  +  R′–O⁻Na⁺  →  R–O–R′  +  NaX
      </text>

      {/* Mechanistic SN2 stage */}
      <SvgCard x={20} y={138} width={520} height={200} />

      <text x={72} y={226} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        R′–
      </text>
      <text x={118} y={226} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--atom-o)">
        O⁻
      </text>
      <LonePairDots cx={116} cy={226} angleDeg={0} radius={20} />
      <LonePairDots cx={116} cy={226} angleDeg={-90} radius={18} />
      <text x={108} y={266} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--ion-cation)">
        Na⁺
      </text>
      <text x={112} y={292} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--lone-pair-edge)">
        Alkoxide nucleophile
      </text>

      {/* Primary alkyl halide R-CH2-X */}
      <text x={256} y={176} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        R
      </text>
      <line x1={270} y1={188} x2={292} y2={214} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />

      <circle cx={304} cy={226} r={16} fill="var(--highlight)" />
      <text x={304} y={226} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        CH₂
      </text>
      <text x={304} y={258} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--delta-plus)">
        δ⁺ (1° C)
      </text>

      <line x1={328} y1={226} x2={394} y2={226} stroke="var(--fg)" strokeWidth={2.6} strokeLinecap="round" />
      <text x={414} y={226} textAnchor="middle" dominantBaseline="central" fontSize={19} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--el-Br)">
        X
      </text>
      <text x={414} y={258} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--delta-minus)">
        δ⁻
      </text>
      <text x={364} y={292} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        180° leaving group
      </text>

      {/* Curved arrows */}
      <CurvedArrow from={{ x: 146, y: 218 }} to={{ x: 282, y: 222 }} bend={-0.34} />
      <CurvedArrow from={{ x: 362, y: 222 }} to={{ x: 414, y: 204 }} bend={-0.38} />

      <text x={280} y={320} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        Simultaneous C–O bond formation and C–X cleavage
      </text>

      {/* Product outcome strip */}
      <SvgCard x={20} y={352} width={520} height={54} tone="success" />
      <text x={280} y={379} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--success)">
        Product: R–O–R′ (ether) + Na⁺X⁻
      </text>

      <StatusPill cx={W / 2} cy={438} width={446} tone="accent">
        Works for both symmetrical &amp; unsymmetrical ethers
      </StatusPill>
    </g>
  )
}

function StepBulkyAlkoxide() {
  return (
    <g>
      <SvgHeader
        width={W}
        title={WILLIAMSON_STEPS[1].title}
        subtitle={WILLIAMSON_STEPS[1].subtitle}
      />

      {/* Top mechanistic panel */}
      <SvgCard x={20} y={76} width={520} height={180} />

      {/* tert-Butoxide group */}
      <text x={110} y={102} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        CH₃
      </text>
      <line x1={110} y1={116} x2={110} y2={144} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />

      <text x={54} y={160} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        CH₃
      </text>
      <line x1={74} y1={160} x2={98} y2={160} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />

      <text x={110} y={160} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        C
      </text>

      <line x1={110} y1={174} x2={110} y2={202} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
      <text x={110} y={216} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        CH₃
      </text>

      <line x1={122} y1={160} x2={156} y2={160} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />
      <text x={176} y={160} textAnchor="middle" dominantBaseline="central" fontSize={19} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--atom-o)">
        O⁻
      </text>
      <LonePairDots cx={174} cy={160} angleDeg={0} radius={20} />
      <text x={176} y={124} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--ion-cation)">
        Na⁺
      </text>

      {/* Unhindered CH3-Br */}
      <circle cx={324} cy={160} r={16} fill="var(--highlight)" />
      <text x={324} y={160} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        CH₃
      </text>
      <text x={324} y={194} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--delta-plus)">
        δ⁺ (1°)
      </text>
      <line x1={348} y1={160} x2={406} y2={160} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />
      <text x={426} y={160} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--el-Br)">
        Br
      </text>
      <text x={426} y={194} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--delta-minus)">
        δ⁻
      </text>

      <CurvedArrow from={{ x: 204, y: 154 }} to={{ x: 304, y: 156 }} bend={-0.36} />
      <CurvedArrow from={{ x: 378, y: 156 }} to={{ x: 426, y: 140 }} bend={-0.38} />

      <text x={280} y={240} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        Bulky nucleophile attacks unhindered methyl carbon smoothly
      </text>

      {/* Down arrow */}
      <line x1={280} y1={262} x2={280} y2={288} stroke="var(--success)" strokeWidth={2.4} strokeLinecap="round" />
      <polygon points="280,296 274,285 286,285" fill="var(--success)" />

      {/* Product card */}
      <SvgCard x={20} y={302} width={520} height={106} tone="success" />
      <SkeletalFormula graph={WILLIAMSON_GRAPHS.tertButylMethylEther} scale={42} x={118} y={355} />
      <text x={358} y={338} textAnchor="middle" fontSize={18} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--success)">
        (CH₃)₃C–O–CH₃  +  NaBr
      </text>
      <text x={358} y={366} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        tert-Butyl methyl ether
      </text>
      <text x={358} y={390} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        2-Methoxy-2-methylpropane
      </text>

      <StatusPill cx={W / 2} cy={438} width={356} tone="success">
        SN2 succeeds: keep the alkyl halide primary
      </StatusPill>
    </g>
  )
}

function StepTertiaryElimination() {
  return (
    <g>
      <SvgHeader
        width={W}
        title={WILLIAMSON_STEPS[2].title}
        subtitle={WILLIAMSON_STEPS[2].subtitle}
      />

      <SvgCard x={20} y={76} width={520} height={184} tone="caution" />

      {/* Methoxide strong base */}
      <text x={58} y={196} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        CH₃–
      </text>
      <text x={102} y={196} textAnchor="middle" dominantBaseline="central" fontSize={19} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--atom-o)">
        O⁻
      </text>
      <LonePairDots cx={102} cy={196} angleDeg={-55} radius={18} />
      <text x={102} y={228} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--ion-cation)">
        Na⁺
      </text>
      <text x={92} y={248} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--base)">
        Strong base
      </text>

      {/* Steric shield blocking backside SN2 */}
      <path
        d="M 218 158 A 48 48 0 0 0 218 234"
        fill="none"
        stroke="var(--caution)"
        strokeWidth={2.4}
        strokeDasharray="5 4"
      />
      <text x={182} y={208} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--caution)">
        SN2
      </text>
      <text x={182} y={226} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--caution)">
        blocked
      </text>

      {/* tert-Butyl bromide with exposed beta-H */}
      <circle cx={216} cy={112} r={15} fill="var(--success-soft)" stroke="var(--success)" strokeWidth={1.6} />
      <text x={216} y={112} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--success)">
        H
      </text>
      <line x1={232} y1={116} x2={268} y2={126} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />

      <text x={294} y={128} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        CH₂
      </text>
      <line x1={294} y1={142} x2={294} y2={180} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />
      <line
        x1={303}
        y1={146}
        x2={303}
        y2={176}
        stroke="var(--accent)"
        strokeWidth={2.4}
        strokeDasharray="5 4"
      />

      <text x={294} y={196} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        C
      </text>

      <line x1={284} y1={208} x2={256} y2={232} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
      <text x={242} y={244} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        CH₃
      </text>

      <line x1={304} y1={208} x2={330} y2={232} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
      <text x={346} y={244} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        CH₃
      </text>

      <line x1={310} y1={196} x2={376} y2={196} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />
      <text x={396} y={196} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--el-Br)">
        Br
      </text>
      <text x={458} y={196} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        (3° halide)
      </text>

      {/* Curved arrows for elimination */}
      <CurvedArrow from={{ x: 118, y: 176 }} to={{ x: 202, y: 120 }} bend={-0.25} />
      <CurvedArrow from={{ x: 244, y: 124 }} to={{ x: 292, y: 162 }} bend={0.35} />
      <CurvedArrow from={{ x: 344, y: 192 }} to={{ x: 394, y: 176 }} bend={-0.38} />

      {/* Down arrow */}
      <line x1={280} y1={266} x2={280} y2={292} stroke="var(--caution)" strokeWidth={2.4} strokeLinecap="round" />
      <polygon points="280,300 274,289 286,289" fill="var(--caution)" />

      {/* Product card */}
      <SvgCard x={20} y={306} width={520} height={102} tone="caution" />
      <SkeletalFormula graph={WILLIAMSON_GRAPHS.isobutene} scale={42} x={110} y={356} />
      <text x={352} y={338} textAnchor="middle" fontSize={17} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--caution)">
        CH₂=C(CH₃)₂  +  NaBr  +  CH₃OH
      </text>
      <text x={352} y={370} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        2-Methylpropene (sole organic product)
      </text>

      <StatusPill cx={W / 2} cy={438} width={428} tone="caution">
        3° halide + alkoxide → 0% ether (elimination only)
      </StatusPill>
    </g>
  )
}

function StepPhenolArylEther() {
  return (
    <g>
      <SvgHeader
        width={W}
        title={WILLIAMSON_STEPS[3].title}
        subtitle={WILLIAMSON_STEPS[3].subtitle}
      />

      <SvgCard x={20} y={76} width={520} height={240} />

      {/* Stage 1: Phenol */}
      <text x={92} y={108} textAnchor="middle" fontSize={17} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--atom-o)">
        OH
      </text>
      <line x1={92} y1={120} x2={92} y2={146} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />
      <PhenylHexagon cx={92} cy={180} r={34} />
      <text x={92} y={240} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        Phenol
      </text>
      <text x={92} y={262} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        C₆H₅OH
      </text>

      <ChemArrow x1={134} x2={206} y={180} topLabel="+ NaOH" bottomLabel="−H₂O" />

      {/* Stage 2: Sodium phenoxide */}
      <text x={274} y={108} textAnchor="middle" fontSize={17} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--atom-o)">
        O⁻Na⁺
      </text>
      <LonePairDots cx={260} cy={108} angleDeg={180} radius={16} />
      <line x1={264} y1={120} x2={264} y2={146} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />
      <PhenylHexagon cx={264} cy={180} r={34} />
      <text x={264} y={240} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        Sodium phenoxide
      </text>
      <text x={264} y={262} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        Nucleophile
      </text>

      {/* Arrow to aryl ether with R-X */}
      <ChemArrow x1={308} x2={394} y={180} topLabel="R–X (1°)" bottomLabel="SN2" />
      <CurvedArrow from={{ x: 298, y: 118 }} to={{ x: 344, y: 156 }} bend={-0.3} />

      {/* Stage 3: Alkyl aryl ether */}
      <text x={456} y={108} textAnchor="middle" fontSize={17} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--atom-o)">
        O–R
      </text>
      <line x1={452} y1={120} x2={452} y2={146} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />
      <PhenylHexagon cx={452} cy={180} r={34} />
      <text x={452} y={240} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--success)">
        Alkyl aryl ether
      </text>
      <text x={452} y={262} textAnchor="middle" fontSize={15} fontFamily="var(--fg-muted)">
        C₆H₅–O–R + NaX
      </text>

      <text x={280} y={298} textAnchor="middle" fontSize={15} fontWeight={500} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        With CH₃–I or CH₃–Br, phenoxide yields anisole (C₆H₅OCH₃)
      </text>

      {/* Summary card */}
      <SvgCard x={20} y={330} width={520} height={74} tone="success" />
      <text x={280} y={356} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--success)">
        Always place the aryl or bulky group on the oxygen partner
      </text>
      <text x={280} y={384} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        Aryl halides resist SN2; phenoxide + 1° alkyl halide succeeds cleanly
      </text>

      <StatusPill cx={W / 2} cy={438} width={404} tone="success">
        Phenol + NaOH + R–X → C₆H₅–O–R + NaX
      </StatusPill>
    </g>
  )
}

export function WilliamsonScrolly({ step }: WilliamsonScrollyProps) {
  const index = clampStep(step, WILLIAMSON_STEPS.length)
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={`Williamson synthesis: ${WILLIAMSON_STEPS[index].title}`}
      data-step={index}
      style={{ display: 'block', width: '100%', height: 'auto' }}
    >
      {index === 0 ? (
        <StepGeneralSn2 />
      ) : index === 1 ? (
        <StepBulkyAlkoxide />
      ) : index === 2 ? (
        <StepTertiaryElimination />
      ) : (
        <StepPhenolArylEther />
      )}
    </svg>
  )
}
