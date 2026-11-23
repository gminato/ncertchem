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
import { DEHYDRATION_GRAPHS, DEHYDRATION_STEPS } from './dehydration-steps'

export interface EtherDehydrationScrollyProps {
  step: number
  reducedMotion: boolean
}

const W = 560
const H = 472

function StepProtonation() {
  return (
    <g>
      <SvgHeader
        width={W}
        title={DEHYDRATION_STEPS[0].title}
        subtitle={DEHYDRATION_STEPS[0].subtitle}
      />

      <SvgCard x={20} y={78} width={520} height={212} />

      {/* Reactant: Ethanol */}
      <text
        x={38}
        y={184}
        fontSize={18}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill="var(--fg)"
        dominantBaseline="central"
      >
        CH₃–CH₂–
      </text>
      <text
        x={140}
        y={184}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={20}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        fill="var(--atom-o)"
      >
        O
      </text>
      <LonePairDots cx={140} cy={184} angleDeg={-90} radius={18} />
      <LonePairDots cx={140} cy={184} angleDeg={90} radius={18} />
      <line x1={152} y1={184} x2={172} y2={184} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />
      <text
        x={182}
        y={184}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={18}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill="var(--fg)"
      >
        H
      </text>

      {/* Plus H+ */}
      <text
        x={208}
        y={184}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={18}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill="var(--fg-muted)"
      >
        +
      </text>
      <circle cx={242} cy={184} r={17} fill="var(--accent-soft)" stroke="var(--acid)" strokeWidth={1.8} />
      <text
        x={242}
        y={184}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={17}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        fill="var(--acid)"
      >
        H⁺
      </text>

      {/* Curved arrow from oxygen lone pair to H+ */}
      <CurvedArrow from={{ x: 142, y: 158 }} to={{ x: 234, y: 164 }} bend={-0.38} />

      <ChemArrow x1={272} x2={320} y={184} />

      {/* Product: Ethyl oxonium ion */}
      <rect
        x={414}
        y={128}
        width={102}
        height={84}
        rx={12}
        fill="var(--success-soft)"
        stroke="var(--success)"
        strokeWidth={1.6}
      />
      <text
        x={330}
        y={184}
        fontSize={18}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill="var(--fg)"
        dominantBaseline="central"
      >
        CH₃–CH₂–
      </text>
      <text
        x={438}
        y={184}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={20}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        fill="var(--atom-o)"
      >
        O
      </text>
      <text
        x={452}
        y={162}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={16}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        fill="var(--acid)"
      >
        ⁺
      </text>
      <line x1={438} y1={170} x2={438} y2={153} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
      <text
        x={438}
        y={142}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={17}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill="var(--fg)"
      >
        H
      </text>
      <line x1={450} y1={184} x2={470} y2={184} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
      <text
        x={484}
        y={184}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={17}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill="var(--fg)"
      >
        H
      </text>
      <text
        x={462}
        y={230}
        textAnchor="middle"
        fontSize={15}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill="var(--success)"
      >
        Good leaving group
      </text>

      {/* Leaving-group comparison cards */}
      <SvgCard x={20} y={310} width={248} height={96} tone="caution" />
      <text x={144} y={342} textAnchor="middle" fontSize={17} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--caution)">
        –OH (Before protonation)
      </text>
      <text x={144} y={372} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        Strong base, poor leaving group
      </text>

      <SvgCard x={292} y={310} width={248} height={96} tone="success" />
      <text x={416} y={342} textAnchor="middle" fontSize={17} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--success)">
        –OH₂⁺ (After protonation)
      </text>
      <text x={416} y={372} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        Departs cleanly as neutral H₂O
      </text>

      <StatusPill cx={W / 2} cy={440} width={416} tone="accent">
        Acid catalyst prepares the α-carbon for attack
      </StatusPill>
    </g>
  )
}

function StepSn2Ether() {
  return (
    <g>
      <SvgHeader
        width={W}
        title={DEHYDRATION_STEPS[1].title}
        subtitle={DEHYDRATION_STEPS[1].subtitle}
      />

      {/* Top reaction stage: SN2 backside attack */}
      <SvgCard x={20} y={76} width={520} height={176} />

      <text x={42} y={144} fontSize={17} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)" dominantBaseline="central">
        CH₃CH₂–
      </text>
      <text x={136} y={144} textAnchor="middle" dominantBaseline="central" fontSize={19} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--atom-o)">
        O
      </text>
      <LonePairDots cx={136} cy={144} angleDeg={0} radius={18} />
      <line x1={136} y1={158} x2={136} y2={176} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
      <text x={136} y={188} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        H
      </text>
      <text x={84} y={214} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--lone-pair-edge)">
        Nucleophile
      </text>

      {/* Protonated ethanol substrate */}
      <text x={242} y={106} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        CH₃
      </text>
      <line x1={258} y1={116} x2={278} y2={136} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
      <circle cx={288} cy={144} r={14} fill="var(--highlight)" />
      <text x={288} y={144} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        CH₂
      </text>
      <text x={288} y={176} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--delta-plus)">
        δ⁺ (α-C)
      </text>

      <line x1={312} y1={144} x2={366} y2={144} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />
      <text x={412} y={144} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--atom-o)">
        ⁺OH₂
      </text>
      <text x={412} y={176} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--ox)">
        H₂O leaves
      </text>

      {/* Curved arrows */}
      <CurvedArrow from={{ x: 162, y: 138 }} to={{ x: 266, y: 140 }} bend={-0.34} />
      <CurvedArrow from={{ x: 338, y: 142 }} to={{ x: 386, y: 132 }} bend={-0.38} />

      <text x={280} y={238} textAnchor="middle" fontSize={15} fontWeight={500} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        Backside SN2 displacement at 413 K
      </text>

      {/* Down arrow */}
      <line x1={280} y1={254} x2={280} y2={282} stroke="var(--fg-muted)" strokeWidth={2.4} strokeLinecap="round" />
      <polygon points="280,290 274,279 286,279" fill="var(--fg-muted)" />
      <text x={300} y={274} fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        + H₂O
      </text>

      {/* Bottom deprotonation card */}
      <SvgCard x={20} y={296} width={520} height={112} tone="success" />
      <text x={144} y={338} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        CH₃CH₂–O⁺(H)–CH₂CH₃
      </text>
      <ChemArrow x1={264} x2={326} y={338} topLabel="−H⁺" />
      <text x={436} y={338} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--success)">
        C₂H₅–O–C₂H₅
      </text>
      <text x={436} y={374} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        Ethoxyethane
      </text>
      <text x={144} y={374} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        Protonated ether intermediate
      </text>

      <StatusPill cx={W / 2} cy={440} width={396} tone="success">
        413 K → SN2 Substitution (Major ether)
      </StatusPill>
    </g>
  )
}

function StepEliminationAlkene() {
  return (
    <g>
      <SvgHeader
        width={W}
        title={DEHYDRATION_STEPS[2].title}
        subtitle={DEHYDRATION_STEPS[2].subtitle}
      />

      <SvgCard x={20} y={76} width={520} height={186} tone="caution" />

      {/* Beta H and alpha C-OH2+ */}
      <circle cx={112} cy={120} r={16} fill="var(--success-soft)" stroke="var(--success)" strokeWidth={1.6} />
      <text x={112} y={120} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--success)">
        H
      </text>
      <text x={68} y={120} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--success)">
        β-H
      </text>
      <line x1={124} y1={134} x2={150} y2={166} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />

      <text x={166} y={178} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        CH₂
      </text>
      <text x={166} y={206} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        β-C
      </text>

      {/* C-C bond + forming pi bond */}
      <line x1={194} y1={178} x2={266} y2={178} stroke="var(--fg)" strokeWidth={2.6} strokeLinecap="round" />
      <line
        x1={198}
        y1={168}
        x2={262}
        y2={168}
        stroke="var(--accent)"
        strokeWidth={2.6}
        strokeDasharray="6 4"
        strokeLinecap="round"
      />

      <text x={292} y={178} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        CH₂
      </text>
      <text x={292} y={206} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        α-C
      </text>

      <line x1={318} y1={178} x2={376} y2={178} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />
      <text x={418} y={178} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--atom-o)">
        ⁺OH₂
      </text>
      <text x={418} y={206} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--ox)">
        H₂O departs
      </text>

      {/* Electron-pushing arrows */}
      <CurvedArrow from={{ x: 138, y: 152 }} to={{ x: 228, y: 162 }} bend={0.35} />
      <CurvedArrow from={{ x: 348, y: 174 }} to={{ x: 396, y: 162 }} bend={-0.35} />

      <text x={280} y={242} textAnchor="middle" fontSize={15} fontWeight={500} fontFamily="var(--font-sans)" fill="var(--fg)">
        Thermal energy at 443 K drives β-elimination instead of SN2 attack
      </text>

      {/* Down arrow */}
      <line x1={280} y1={268} x2={280} y2={298} stroke="var(--caution)" strokeWidth={2.4} strokeLinecap="round" />
      <polygon points="280,306 274,295 286,295" fill="var(--caution)" />
      <text x={324} y={290} fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--caution)">
        443 K (H₂SO₄)
      </text>

      {/* Product card */}
      <SvgCard x={20} y={312} width={520} height={96} />
      <SkeletalFormula graph={DEHYDRATION_GRAPHS.ethene} scale={52} x={136} y={360} />
      <text x={352} y={348} textAnchor="middle" fontSize={18} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        CH₂=CH₂  +  H₂O  +  H⁺
      </text>
      <text x={352} y={380} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--caution)">
        Ethene (alkene, 0% ether)
      </text>

      <StatusPill cx={W / 2} cy={440} width={396} tone="caution">
        443 K → Elimination dominates (Ethene)
      </StatusPill>
    </g>
  )
}

function StepScopeLimits() {
  return (
    <g>
      <SvgHeader
        width={W}
        title={DEHYDRATION_STEPS[3].title}
        subtitle={DEHYDRATION_STEPS[3].subtitle}
      />

      {/* Limitation 1: 2° / 3° branching */}
      <SvgCard x={20} y={76} width={520} height={154} tone="caution" />
      <text x={40} y={102} fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        1. Branched 2° / 3° alcohols eliminate to alkenes
      </text>

      <SkeletalFormula graph={DEHYDRATION_GRAPHS.tertButanol} scale={42} x={118} y={156} />
      <text x={118} y={214} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        (CH₃)₃COH (3°)
      </text>

      <ChemArrow x1={206} x2={304} y={156} topLabel="H⁺, heat" bottomLabel="SN1 / elim." />

      <SkeletalFormula graph={DEHYDRATION_GRAPHS.isobutene} scale={42} x={412} y={156} />
      <text x={412} y={214} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--caution)">
        CH₂=C(CH₃)₂ (Alkene)
      </text>

      {/* Limitation 2: Mixed 1° alcohols */}
      <SvgCard x={20} y={244} width={520} height={210} />
      <text x={40} y={270} fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        2. Mixing CH₃OH + C₂H₅OH gives 3 ethers at 413 K
      </text>

      <text x={118} y={336} textAnchor="middle" fontSize={17} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        CH₃OH
      </text>
      <text x={118} y={360} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        +
      </text>
      <text x={118} y={384} textAnchor="middle" fontSize={17} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        C₂H₅OH
      </text>

      <ChemArrow x1={188} x2={266} y={356} topLabel="H₂SO₄" bottomLabel="413 K" />

      <rect x={284} y={292} width={236} height={34} rx={8} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.4} />
      <text x={402} y={309} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        CH₃–O–CH₃ (symmetrical)
      </text>

      <rect x={284} y={334} width={236} height={34} rx={8} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={1.6} />
      <text x={402} y={351} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--accent)">
        CH₃–O–C₂H₅ (mixed ether)
      </text>

      <rect x={284} y={376} width={236} height={34} rx={8} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.4} />
      <text x={402} y={393} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        C₂H₅–O–C₂H₅ (symmetrical)
      </text>

      <text x={280} y={436} textAnchor="middle" fontSize={15} fontWeight={500} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        Hard-to-separate mixture → use Williamson synthesis instead
      </text>
    </g>
  )
}

export function EtherDehydrationScrolly({ step }: EtherDehydrationScrollyProps) {
  const index = clampStep(step, DEHYDRATION_STEPS.length)
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={`Acid-catalysed dehydration of alcohols: ${DEHYDRATION_STEPS[index].title}`}
      data-step={index}
      style={{ display: 'block', width: '100%', height: 'auto' }}
    >
      {index === 0 ? (
        <StepProtonation />
      ) : index === 1 ? (
        <StepSn2Ether />
      ) : index === 2 ? (
        <StepEliminationAlkene />
      ) : (
        <StepScopeLimits />
      )}
    </svg>
  )
}
