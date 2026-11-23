'use client'

import type { ReactNode } from 'react'
import { CurvedArrow } from '@/components/organic'
import { useReveal } from '@/components/animations/unit4/vbt/useStepTween'
import {
  ACIDITY_STEP_COUNT,
  SUBSTITUENT_PKA_ITEMS,
} from './acidity-steps'
import {
  ChargeBadge,
  LonePairDots,
  PHENOL_RESONANCE_FORMS,
  PHENOXIDE_RESONANCE_FORMS,
  ResonanceArrow,
  SubstitutedPhenoxideHybrid,
  UprightPhenolicContributor,
} from './PhenolicRingSvg'

export interface AlcoholPhenolAcidityProps {
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

function CleavageSlash({ x, y1, y2 }: { x: number; y1: number; y2: number }) {
  return (
    <line
      x1={x - 5}
      y1={y2}
      x2={x + 5}
      y2={y1}
      stroke="var(--rev)"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeDasharray="4 3"
    />
  )
}

function Step0Cleavage({ reveal }: { reveal: number }) {
  return (
    <g opacity={reveal}>
      <Header>Two cleavage modes &amp; Brønsted proton transfer</Header>

      {/* Left card: O-H cleavage (nucleophile / acid) */}
      <CardBox x={14} y={48} w={268} h={198} accent="var(--accent)" />
      <text x={148} y={74} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill="var(--accent)">
        Nucleophile: O–H bond breaks
      </text>
      <text x={44} y={126} fontSize={17} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        R–
      </text>
      <text x={74} y={126} textAnchor="middle" fontSize={17} fontWeight={700} fontFamily={FONT} fill="var(--atom-o)">
        O
      </text>
      <LonePairDots px={74} py={109} angleRad={0} />
      <LonePairDots px={74} py={140} angleRad={0} />
      <line x1={84} y1={120} x2={106} y2={120} stroke="var(--fg)" strokeWidth={2.2} />
      <CleavageSlash x={95} y1={108} y2={132} />
      <text x={115} y={126} fontSize={17} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        H  +  ⁺C−
      </text>
      <CurvedArrow from={{ x: 74, y: 103 }} to={{ x: 162, y: 112 }} bend={-0.38} gap={2} headSize={9} />
      <text x={148} y={182} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        →  R–O–C−  +  H⁺
      </text>
      <text x={148} y={224} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        Acidity &amp; esterification
      </text>

      {/* Right card: C-O cleavage (protonated alcohol as electrophile) */}
      <CardBox x={298} y={48} w={268} h={198} />
      <text x={432} y={74} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill="var(--ox)">
        Electrophile: C–O bond breaks
      </text>
      <text x={432} y={108} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        1) RCH₂–OH + H⁺ → RCH₂–O⁺H₂
      </text>
      <text x={324} y={146} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        Br⁻
      </text>
      <text x={352} y={146} textAnchor="middle" fontSize={16} fontFamily={FONT} fill="var(--fg-muted)">
        +
      </text>
      <text x={412} y={146} textAnchor="end" fontSize={16} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        RCH₂
      </text>
      <line x1={417} y1={140} x2={444} y2={140} stroke="var(--fg)" strokeWidth={2.2} />
      <CleavageSlash x={430} y1={128} y2={152} />
      <text x={449} y={146} textAnchor="start" fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--atom-o)">
        O⁺H₂
      </text>
      <CurvedArrow from={{ x: 326, y: 128 }} to={{ x: 392, y: 131 }} bend={-0.36} gap={2} headSize={9} />
      <CurvedArrow from={{ x: 430, y: 136 }} to={{ x: 458, y: 131 }} bend={-0.5} gap={2} headSize={8} />
      <text x={432} y={186} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        →  Br–CH₂R  +  H₂O
      </text>
      <text x={432} y={224} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        Neutral –OH is a poor leaving group
      </text>

      {/* Bottom Brønsted acid-base equation */}
      <CardBox x={14} y={264} w={552} h={212} />
      <text x={290} y={294} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        Brønsted proton transfer (O–H cleavage)
      </text>

      <text x={72} y={356} textAnchor="middle" fontSize={19} fontWeight={700} fontFamily={FONT} fill="var(--base)">
        B
      </text>
      <LonePairDots px={86} py={350} angleRad={Math.PI / 2} fill="var(--base)" />
      <text x={118} y={356} textAnchor="middle" fontSize={18} fontFamily={FONT} fill="var(--fg-muted)">
        +
      </text>
      <text x={156} y={356} textAnchor="middle" fontSize={19} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        H
      </text>
      <line x1={168} y1={350} x2={192} y2={350} stroke="var(--fg)" strokeWidth={2.4} />
      <CleavageSlash x={180} y1={336} y2={364} />
      <text x={205} y={356} textAnchor="middle" fontSize={19} fontWeight={700} fontFamily={FONT} fill="var(--atom-o)">
        O
      </text>
      <LonePairDots px={205} py={338} angleRad={0} />
      <LonePairDots px={205} py={369} angleRad={0} />
      <text x={215} y={356} textAnchor="start" fontSize={19} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        –R
      </text>

      <CurvedArrow from={{ x: 88, y: 342 }} to={{ x: 152, y: 340 }} bend={-0.38} gap={2} headSize={9} />
      <CurvedArrow from={{ x: 180, y: 346 }} to={{ x: 204, y: 344 }} bend={-0.55} gap={2} headSize={8} />

      <text x={282} y={356} textAnchor="middle" fontSize={20} fontWeight={700} fontFamily={FONT} fill="var(--fg-muted)">
        →
      </text>

      <text x={356} y={356} textAnchor="middle" fontSize={19} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        B–H
      </text>
      <text x={412} y={356} textAnchor="middle" fontSize={18} fontFamily={FONT} fill="var(--fg-muted)">
        +
      </text>
      <text x={468} y={356} textAnchor="middle" fontSize={19} fontWeight={700} fontFamily={FONT} fill="var(--atom-o)">
        O
      </text>
      <LonePairDots px={453} py={350} angleRad={Math.PI / 2} fill="var(--atom-o)" />
      <LonePairDots px={468} py={338} angleRad={0} fill="var(--atom-o)" />
      <LonePairDots px={468} py={369} angleRad={0} fill="var(--atom-o)" />
      <text x={483} y={343} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--delta-minus)">
        ⁻
      </text>
      <text x={479} y={356} textAnchor="start" fontSize={19} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        –R
      </text>

      <text x={76} y={404} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        Base
      </text>
      <text x={192} y={404} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        Acid
      </text>
      <text x={356} y={404} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        Conj. acid
      </text>
      <text x={480} y={404} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        Conj. base
      </text>

      <text x={290} y={450} textAnchor="middle" fontSize={15} fontWeight={500} fontFamily={FONT} fill="var(--fg)">
        Alcohols and phenols donate the O–H proton to a stronger base.
      </text>
    </g>
  )
}

function PlusIArrow({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const px = -uy
  const py = ux
  const mx = (x1 + x2) / 2 + ux * 2
  const my = (y1 + y2) / 2 + uy * 2
  const bx = mx - ux * 7
  const by = my - uy * 7
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
      <polygon
        points={`${mx.toFixed(1)},${my.toFixed(1)} ${(bx + px * 4.5).toFixed(1)},${(by + py * 4.5).toFixed(1)} ${(bx - px * 4.5).toFixed(1)},${(by - py * 4.5).toFixed(1)}`}
        fill="var(--accent)"
      />
    </g>
  )
}

function Step1InductiveWater({ reveal }: { reveal: number }) {
  return (
    <g opacity={reveal}>
      <Header>Alkyl +I effect weakens alcohol acidity below water</Header>

      {/* 1° alcohol card */}
      <CardBox x={14} y={48} w={174} h={210} accent="var(--accent)" />
      <text x={101} y={74} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill="var(--accent)">
        Primary (1°)
      </text>
      <text x={36} y={136} fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        R
      </text>
      <PlusIArrow x1={52} y1={130} x2={86} y2={130} />
      <text x={90} y={136} textAnchor="start" fontSize={16} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        CH₂–OH
      </text>
      <text x={101} y={184} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg)">
        1 +I group
      </text>
      <text x={101} y={210} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily={FONT} fill="var(--fwd)">
        Highest O–H polarity
      </text>
      <text x={101} y={238} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        Strongest among ROH
      </text>

      {/* 2° alcohol card */}
      <CardBox x={203} y={48} w={174} h={210} />
      <text x={290} y={74} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        Secondary (2°)
      </text>
      <text x={224} y={114} fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        R
      </text>
      <text x={224} y={156} fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        R
      </text>
      <PlusIArrow x1={240} y1={110} x2={278} y2={126} />
      <PlusIArrow x1={240} y1={148} x2={278} y2={133} />
      <text x={282} y={136} textAnchor="start" fontSize={16} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        CH–OH
      </text>
      <text x={290} y={184} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg)">
        2 +I groups
      </text>
      <text x={290} y={210} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        Lower O–H polarity
      </text>
      <text x={290} y={238} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        Moderate ROH acid
      </text>

      {/* 3° alcohol card */}
      <CardBox x={392} y={48} w={174} h={210} />
      <text x={479} y={74} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill="var(--fg-muted)">
        Tertiary (3°)
      </text>
      <text x={418} y={108} fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        R
      </text>
      <text x={412} y={136} fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        R
      </text>
      <text x={418} y={164} fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        R
      </text>
      <PlusIArrow x1={434} y1={105} x2={474} y2={125} />
      <PlusIArrow x1={428} y1={130} x2={472} y2={130} />
      <PlusIArrow x1={434} y1={157} x2={474} y2={136} />
      <text x={478} y={136} textAnchor="start" fontSize={16} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        C–OH
      </text>
      <text x={479} y={184} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg)">
        3 +I groups
      </text>
      <text x={479} y={210} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily={FONT} fill="var(--rev)">
        Weakest O–H polarity
      </text>
      <text x={479} y={238} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        Destabilises R₃CO⁻
      </text>

      {/* Order line */}
      <text x={W / 2} y={286} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        Acidity in alcohols:  Primary (1°)  &gt;  Secondary (2°)  ≫  Tertiary (3°)
      </text>

      {/* Alkoxide + H2O reaction */}
      <CardBox x={14} y={306} w={552} h={172} />
      <text x={W / 2} y={334} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        Alkoxide pulls H⁺ from water (water is the stronger acid)
      </text>

      <text x={74} y={386} textAnchor="end" fontSize={18} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        R–
      </text>
      <text x={85} y={386} textAnchor="middle" fontSize={18} fontWeight={700} fontFamily={FONT} fill="var(--delta-minus)">
        O
      </text>
      <LonePairDots px={85} py={368} angleRad={0} fill="var(--delta-minus)" />
      <LonePairDots px={85} py={398} angleRad={0} fill="var(--delta-minus)" />
      <LonePairDots px={99} py={380} angleRad={Math.PI / 2} fill="var(--delta-minus)" />
      <text x={108} y={371} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--delta-minus)">
        ⁻
      </text>
      <text x={142} y={386} textAnchor="middle" fontSize={17} fontFamily={FONT} fill="var(--fg-muted)">
        +
      </text>
      <text x={206} y={386} textAnchor="middle" fontSize={18} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        H–O–H
      </text>
      <CurvedArrow from={{ x: 103, y: 374 }} to={{ x: 176, y: 374 }} bend={-0.36} gap={2} headSize={9} />
      <CurvedArrow from={{ x: 192, y: 379 }} to={{ x: 207, y: 372 }} bend={-0.55} gap={2} headSize={8} />
      <text x={274} y={386} textAnchor="middle" fontSize={20} fontWeight={700} fontFamily={FONT} fill="var(--fwd)">
        →
      </text>
      <text x={342} y={386} textAnchor="middle" fontSize={18} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        R–O–H
      </text>
      <text x={404} y={386} textAnchor="middle" fontSize={17} fontFamily={FONT} fill="var(--fg-muted)">
        +
      </text>
      <text x={456} y={386} textAnchor="middle" fontSize={18} fontWeight={700} fontFamily={FONT} fill="var(--atom-o)">
        O
      </text>
      <LonePairDots px={441} py={380} angleRad={Math.PI / 2} fill="var(--atom-o)" />
      <LonePairDots px={456} py={368} angleRad={0} fill="var(--atom-o)" />
      <LonePairDots px={456} py={398} angleRad={0} fill="var(--atom-o)" />
      <text x={474} y={386} textAnchor="middle" fontSize={18} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        H
      </text>
      <text x={486} y={373} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--atom-o)">
        ⁻
      </text>

      <text x={82} y={418} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        Stronger base
      </text>
      <text x={206} y={418} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        Stronger acid
      </text>
      <text x={342} y={418} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        Weaker acid
      </text>
      <text x={464} y={418} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        Weaker base
      </text>

      <text x={W / 2} y={456} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--accent)">
        Brønsted order:  Phenols  &gt;  Water  &gt;  Alcohols
      </text>
    </g>
  )
}

function Step2NeutralPhenol({ reveal }: { reveal: number }) {
  const row1X = [104, 290, 476]
  return (
    <g opacity={reveal}>
      <Header>Neutral phenol: sp² C–O &amp; charge-separated contributors</Header>

      {PHENOL_RESONANCE_FORMS.slice(0, 3).map((form, i) => (
        <UprightPhenolicContributor
          key={form.label}
          cx={row1X[i]}
          cy={136}
          r={34}
          form={form}
          highlightC1={i === 0}
        />
      ))}
      <ResonanceArrow x={197} y={136} />
      <ResonanceArrow x={383} y={136} />

      <UprightPhenolicContributor cx={104} cy={328} r={34} form={PHENOL_RESONANCE_FORMS[3]} />
      <ResonanceArrow x={197} y={328} />
      <UprightPhenolicContributor cx={290} cy={328} r={34} form={PHENOL_RESONANCE_FORMS[4]} />

      {/* Explanatory callout box */}
      <CardBox x={364} y={258} w={202} h={164} accent="var(--caution)" />
      <text x={465} y={286} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill="var(--caution)">
        Charge separation
      </text>
      <text x={465} y={316} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg)">
        sp² ring C pulls e⁻ density
      </text>
      <text x={465} y={342} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg)">
        from O (136 pm C–O).
      </text>
      <text x={465} y={374} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        II–IV separate + (on O)
      </text>
      <text x={465} y={398} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        and − (on o/p carbons).
      </text>

      <text x={W / 2} y={462} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        δ+ on oxygen increases O–H polarity and favours H⁺ loss.
      </text>
    </g>
  )
}

function Step3PhenoxideVsEthoxide({ reveal }: { reveal: number }) {
  const row1X = [104, 290, 476]
  return (
    <g opacity={reveal}>
      <Header>Phenoxide spreads − charge (I–V) without charge separation</Header>

      {PHENOXIDE_RESONANCE_FORMS.slice(0, 3).map((form, i) => (
        <UprightPhenolicContributor key={form.label} cx={row1X[i]} cy={136} r={34} form={form} />
      ))}
      <ResonanceArrow x={197} y={136} />
      <ResonanceArrow x={383} y={136} />

      <UprightPhenolicContributor cx={104} cy={328} r={34} form={PHENOXIDE_RESONANCE_FORMS[3]} />
      <ResonanceArrow x={197} y={328} />
      <UprightPhenolicContributor cx={290} cy={328} r={34} form={PHENOXIDE_RESONANCE_FORMS[4]} />

      {/* Contrast box: Ethoxide ion */}
      <CardBox x={364} y={258} w={202} h={164} accent="var(--rev)" />
      <text x={465} y={286} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill="var(--rev)">
        Ethoxide: localised on O
      </text>
      <circle cx={512} cy={338} r={20} fill="var(--highlight)" />
      <text x={446} y={344} textAnchor="middle" fontSize={17} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        CH₃–CH₂–
      </text>
      <text x={512} y={344} textAnchor="middle" fontSize={18} fontWeight={700} fontFamily={FONT} fill="var(--atom-o)">
        O
      </text>
      <LonePairDots px={512} py={325} angleRad={0} />
      <LonePairDots px={512} py={351} angleRad={0} />
      <LonePairDots px={526} py={338} angleRad={Math.PI / 2} />
      <ChargeBadge x={542} y={321} sign="−" tone="var(--delta-minus)" />
      <text x={465} y={384} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        Negative charge stays
      </text>
      <text x={465} y={406} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        trapped on one O atom.
      </text>

      <text x={W / 2} y={456} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        Phenoxide shares − over O + 3 ring carbons (2 ortho, 1 para)
      </text>
      <text x={W / 2} y={478} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        making phenol roughly 10⁶× more acidic than ethanol.
      </text>
    </g>
  )
}

function Step4Substituents({ reveal }: { reveal: number }) {
  const minPka = 6
  const maxPka = 16.5
  const x0 = 140
  const x1 = 534
  const barX = (pka: number) => x0 + ((pka - minPka) / (maxPka - minPka)) * (x1 - x0)

  return (
    <g opacity={reveal}>
      <Header>Substituents tune phenoxide stability (Table 7.3)</Header>

      {/* Card 1: p-Nitrophenol */}
      <CardBox x={14} y={44} w={174} h={224} accent="var(--fwd)" />
      <text x={101} y={66} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill="var(--fwd)">
        p-NO₂ (pKₐ 7.1)
      </text>
      <SubstitutedPhenoxideHybrid
        cx={101}
        cy={140}
        r={32}
        substituent={{ position: 4, label: 'NO₂', tone: 'var(--atom-n)', flow: 'out-of-ring' }}
      />
      <text x={101} y={234} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        −R &amp; −I: captures −
      </text>
      <text x={101} y={256} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        o-NO₂: 7.2  |  p-NO₂: 7.1
      </text>

      {/* Card 2: m-Nitrophenol */}
      <CardBox x={203} y={44} w={174} h={224} accent="var(--accent)" />
      <text x={290} y={66} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill="var(--accent)">
        m-NO₂ (pKₐ 8.3)
      </text>
      <SubstitutedPhenoxideHybrid
        cx={274}
        cy={140}
        r={32}
        substituent={{ position: 3, label: 'NO₂', tone: 'var(--atom-n)', flow: 'out-of-ring' }}
      />
      <text x={290} y={234} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        −I only: off o/p path
      </text>
      <text x={290} y={256} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        Weaker than o/p-NO₂
      </text>

      {/* Card 3: Cresol */}
      <CardBox x={392} y={44} w={174} h={224} accent="var(--rev)" />
      <text x={479} y={66} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill="var(--rev)">
        p-Cresol (pKₐ 10.2)
      </text>
      <SubstitutedPhenoxideHybrid
        cx={479}
        cy={140}
        r={32}
        substituent={{ position: 4, label: 'CH₃', tone: 'var(--rev)', flow: 'into-ring' }}
      />
      <text x={479} y={234} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        +I: destabilises −
      </text>
      <text x={479} y={256} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
        Cresols: 10.1–10.2
      </text>

      {/* Mini Table 7.3 bar comparison */}
      <CardBox x={14} y={280} w={552} h={204} />
      <text x={290} y={304} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        Table 7.3 pKₐ comparison (smaller pKₐ = stronger acid)
      </text>
      {SUBSTITUENT_PKA_ITEMS.map((item, idx) => {
        const y = 328 + idx * 22
        const fill =
          item.category === 'nitro'
            ? 'var(--fwd)'
            : item.category === 'phenol'
              ? 'var(--accent)'
              : item.category === 'cresol'
                ? 'var(--caution)'
                : 'var(--rev)'
        return (
          <g key={item.label}>
            <text x={128} y={y + 4} textAnchor="end" fontSize={15} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
              {item.label}
            </text>
            <rect
              x={x0}
              y={y - 7}
              width={Math.max(16, barX(item.pKa) - x0)}
              height={13}
              rx={6}
              fill={fill}
            />
            <text
              x={barX(item.pKa) + 8}
              y={y + 4}
              textAnchor="start"
              fontSize={15}
              fontWeight={600}
              fontFamily={FONT}
              fill="var(--fg)"
            >
              {item.label === 'o/p-Cresol' ? '10.2' : item.printed}
            </text>
          </g>
        )
      })}
    </g>
  )
}

export function AlcoholPhenolAcidity({ step, reducedMotion }: AlcoholPhenolAcidityProps) {
  const index = Math.min(Math.max(Math.trunc(step), 0), ACIDITY_STEP_COUNT - 1)
  const reveal = useReveal(index, reducedMotion, 0.55)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Acidity of alcohols and phenols, step ${index + 1} of ${ACIDITY_STEP_COUNT}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {index === 0 && <Step0Cleavage reveal={reveal} />}
      {index === 1 && <Step1InductiveWater reveal={reveal} />}
      {index === 2 && <Step2NeutralPhenol reveal={reveal} />}
      {index === 3 && <Step3PhenoxideVsEthoxide reveal={reveal} />}
      {index === 4 && <Step4Substituents reveal={reveal} />}
    </svg>
  )
}
