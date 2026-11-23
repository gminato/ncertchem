'use client'

import type { ReactNode } from 'react'
import { CurvedArrow, deltaText } from '@/components/organic'
import { useReveal } from '@/components/animations/unit4/vbt/useStepTween'
import {
  LonePairDots,
  PathwayHeader,
  PillLabel,
  RightReactionArrow,
  DownReactionArrow,
  SCROLLY_H,
  SCROLLY_W,
  StepCaption,
  StepCard,
} from '../MechSvgPrimitives'
import {
  CARBONYL_GRIGNARD_STEPS,
  CARBONYL_GRIGNARD_STEP_COUNT,
} from './carbonyl-grignard-steps'

export interface CarbonylReductionAndGrignardProps {
  step: number
  reducedMotion: boolean
}

function LabelText({
  x,
  y,
  children,
  fill = 'var(--fg)',
  size = 17,
  weight = 600,
  anchor = 'middle',
}: {
  x: number
  y: number
  children: ReactNode
  fill?: string
  size?: number
  weight?: number
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

function Step1AldehydesKetones() {
  return (
    <g>
      <StepCard y={94} height={36}>
        <LabelText x={SCROLLY_W / 2} y={112} size={15} weight={600}>
          Reagents: H₂ (Pt / Pd / Ni), NaBH₄, or LiAlH₄ · ΔC = 0
        </LabelText>
      </StepCard>

      {/* Aldehyde -> 1° alcohol */}
      <StepCard y={142} height={132} highlight tone="success">
        <LabelText x={106} y={176} size={18} weight={700}>R–CH=O</LabelText>
        <LabelText x={106} y={204} size={15} weight={500} fill="var(--fg-muted)">Aldehyde</LabelText>
        <LabelText x={106} y={244} size={15} weight={500} fill="var(--fg-muted)">e.g. CH₃CHO</LabelText>

        <RightReactionArrow x1={174} x2={288} y={182} above="H₂ / Pd" below="or NaBH₄" />

        <LabelText x={364} y={176} size={18} weight={700}>R–CH₂–OH</LabelText>
        <LabelText x={364} y={204} size={15} weight={500} fill="var(--fg-muted)">2 H added across C=O</LabelText>
        <LabelText x={364} y={244} size={15} weight={600} fill="var(--success)">→ CH₃CH₂OH</LabelText>
        <PillLabel cx={476} cy={176} text="1° alcohol" tone="success" />
      </StepCard>

      {/* Ketone -> 2° alcohol */}
      <StepCard y={286} height={132} highlight tone="accent">
        <LabelText x={106} y={320} size={18} weight={700}>R–CO–R&apos;</LabelText>
        <LabelText x={106} y={348} size={15} weight={500} fill="var(--fg-muted)">Ketone</LabelText>
        <LabelText x={106} y={388} size={15} weight={500} fill="var(--fg-muted)">e.g. CH₃COCH₃</LabelText>

        <RightReactionArrow x1={174} x2={288} y={326} above="NaBH₄" below="or LiAlH₄" />

        <LabelText x={364} y={320} size={17} weight={700}>R–CH(OH)–R&apos;</LabelText>
        <LabelText x={364} y={348} size={15} weight={500} fill="var(--fg-muted)">O-H &amp; C-H formed</LabelText>
        <LabelText x={364} y={388} size={15} weight={600} fill="var(--accent)">→ CH₃CH(OH)CH₃</LabelText>
        <PillLabel cx={476} cy={320} text="2° alcohol" tone="accent" />
      </StepCard>
    </g>
  )
}

function Step2CarboxylicAcids() {
  return (
    <g>
      <StepCard y={94} height={36} highlight tone="caution">
        <LabelText x={SCROLLY_W / 2} y={112} size={15} weight={600} fill="var(--caution)">
          NaBH₄ is too mild for RCOOH (no reaction)
        </LabelText>
      </StepCard>

      {/* Lab route */}
      <StepCard y={142} height={128} highlight tone="accent">
        <LabelText x={38} y={164} size={15} weight={600} fill="var(--accent)" anchor="start">
          Laboratory route (expensive; high yield)
        </LabelText>
        <LabelText x={84} y={208} size={18} weight={700}>R–COOH</LabelText>
        <RightReactionArrow x1={142} x2={278} y={208} above="(i) LiAlH₄" below="(ii) H₂O" />
        <LabelText x={346} y={208} size={18} weight={700}>R–CH₂OH</LabelText>
        <PillLabel cx={466} cy={208} text="1° alcohol" tone="accent" />
        <LabelText x={SCROLLY_W / 2} y={248} size={15} weight={500} fill="var(--fg-muted)">
          Add (ii) H₂O only after (i) LiAlH₄ finishes reacting
        </LabelText>
      </StepCard>

      {/* Commercial route */}
      <StepCard y={282} height={136} highlight tone="success">
        <LabelText x={38} y={306} size={15} weight={600} fill="var(--success)" anchor="start">
          Commercial route (via esterification + H₂)
        </LabelText>
        <LabelText x={68} y={354} size={17} weight={700}>RCOOH</LabelText>
        <RightReactionArrow x1={110} x2={198} y={354} above="R'OH" below="H⁺" />
        <LabelText x={246} y={354} size={17} weight={700}>RCOOR&apos;</LabelText>
        <RightReactionArrow x1={296} x2={382} y={354} above="H₂" below="Catalyst" />
        <LabelText x={456} y={354} size={16} weight={700}>RCH₂OH + R&apos;OH</LabelText>
        <LabelText x={SCROLLY_W / 2} y={396} size={15} weight={500} fill="var(--fg-muted)">
          Ester hydrogenation recovers R&apos;OH economically
        </LabelText>
      </StepCard>
    </g>
  )
}

function Step3GrignardAdduct({ arrowProgress }: { arrowProgress: number }) {
  return (
    <g>
      <StepCard y={96} height={148}>
        {/* Carbonyl >C=O */}
        <line x1={82} y1={150} x2={110} y2={166} stroke="var(--bond)" strokeWidth={2.4} strokeLinecap="round" />
        <line x1={82} y1={198} x2={110} y2={182} stroke="var(--bond)" strokeWidth={2.4} strokeLinecap="round" />
        <circle cx={124} cy={174} r={16} fill="var(--highlight)" />
        <LabelText x={124} y={174} size={19} weight={700}>C</LabelText>
        <LabelText x={124} y={146} size={15} weight={700} fill="var(--delta-plus)">
          {deltaText('δ⁺')}
        </LabelText>

        <line x1={140} y1={170} x2={182} y2={170} stroke="var(--bond)" strokeWidth={2.4} />
        <line x1={140} y1={178} x2={182} y2={178} stroke="var(--bond)" strokeWidth={2.4} />
        <LabelText x={198} y={174} size={19} weight={700} fill="var(--atom-o)">O</LabelText>
        <LonePairDots cx={198} cy={150} angleDeg={90} />
        <LonePairDots cx={222} cy={174} angleDeg={0} />
        <LabelText x={198} y={202} size={15} weight={700} fill="var(--delta-minus)">
          {deltaText('δ⁻')}
        </LabelText>

        <LabelText x={256} y={174} size={20} fill="var(--fg-muted)">+</LabelText>

        {/* Polarised Grignard reagent R(d-)-Mg(d+)-X */}
        <circle cx={306} cy={174} r={16} fill="var(--highlight)" />
        <LabelText x={306} y={174} size={19} weight={700} fill="var(--accent)">R</LabelText>
        <LabelText x={306} y={202} size={15} weight={700} fill="var(--delta-minus)">
          {deltaText('δ⁻')}
        </LabelText>
        <line x1={322} y1={174} x2={376} y2={174} stroke="var(--bond)" strokeWidth={2.6} />
        <LabelText x={398} y={174} size={18} weight={700}>Mg</LabelText>
        <LabelText x={398} y={202} size={15} weight={700} fill="var(--delta-plus)">
          {deltaText('δ⁺')}
        </LabelText>
        <line x1={420} y1={174} x2={448} y2={174} stroke="var(--bond)" strokeWidth={2.4} />
        <LabelText x={464} y={174} size={18} weight={700} fill="var(--atom-hal)">X</LabelText>

        {/* Curved arrows: R-Mg bond attacks C(delta+), C=O pi moves onto O */}
        <CurvedArrow from={{ x: 344, y: 164 }} to={{ x: 134, y: 156 }} bend={0.34} progress={arrowProgress} />
        <CurvedArrow from={{ x: 162, y: 164 }} to={{ x: 196, y: 158 }} bend={-0.62} progress={arrowProgress} />
      </StepCard>

      <DownReactionArrow y1={250} y2={288} labelRight="Step (i): dry ether" />

      {/* Adduct bracket */}
      <StepCard y={294} height={124} highlight tone="accent" dashed>
        {/* Left & right brackets */}
        <path d="M 78 310 L 66 310 L 66 404 L 78 404" fill="none" stroke="var(--fg)" strokeWidth={2} />
        <path d="M 326 310 L 338 310 L 338 404 L 326 404" fill="none" stroke="var(--fg)" strokeWidth={2} />

        <line x1={86} y1={322} x2={112} y2={336} stroke="var(--bond)" strokeWidth={2.4} strokeLinecap="round" />
        <line x1={86} y1={362} x2={112} y2={348} stroke="var(--bond)" strokeWidth={2.4} strokeLinecap="round" />
        <LabelText x={126} y={342} size={18} weight={700}>C</LabelText>

        {/* Highlighted newly formed C-R bond */}
        <line x1={126} y1={356} x2={126} y2={382} stroke="var(--highlight)" strokeWidth={13} strokeLinecap="round" />
        <line x1={126} y1={356} x2={126} y2={382} stroke="var(--success)" strokeWidth={2.8} strokeLinecap="round" />
        <LabelText x={126} y={396} size={18} weight={700} fill="var(--accent)">R</LabelText>

        <line x1={142} y1={342} x2={182} y2={342} stroke="var(--bond)" strokeWidth={2.4} />
        <LabelText x={200} y={342} size={18} weight={700} fill="var(--atom-o)">O⁻</LabelText>
        <LabelText x={274} y={342} size={17} weight={700}>Mg⁺–X</LabelText>

        <PillLabel cx={438} cy={334} text="Alkoxide adduct" tone="accent" />
        <LabelText x={438} y={374} size={15} weight={600} fill="var(--success)">
          New C-C bond formed
        </LabelText>
      </StepCard>
    </g>
  )
}

function Step4GrignardHydrolysis() {
  const rows = [
    {
      y: 164,
      carbonyl: 'Methanal (HCHO)',
      reagent: "+ R'MgX",
      product: "R'–CH₂–OH",
      degree: '1° alcohol',
      tone: 'success' as const,
    },
    {
      y: 250,
      carbonyl: 'Other RCHO',
      reagent: "+ R'MgX",
      product: "R–CH(OH)–R'",
      degree: '2° alcohol',
      tone: 'accent' as const,
    },
    {
      y: 336,
      carbonyl: 'Ketone (RCOR)',
      reagent: "+ R'MgX",
      product: "R₂C(OH)–R'",
      degree: '3° alcohol',
      tone: 'caution' as const,
    },
  ]

  return (
    <g>
      <StepCard y={94} height={56}>
        <LabelText x={124} y={122} size={16} weight={600}>
          [ &gt;C(R)–O⁻ Mg⁺X ]
        </LabelText>
        <RightReactionArrow x1={216} x2={292} y={122} above="H₂O" />
        <LabelText x={414} y={122} size={16} weight={700}>
          &gt;C(R)–OH + Mg(OH)X
        </LabelText>
      </StepCard>

      {rows.map((row) => (
        <StepCard key={row.degree} y={row.y} height={78} highlight tone={row.tone}>
          <LabelText x={106} y={row.y + 27} size={16} weight={700}>
            {row.carbonyl}
          </LabelText>
          <LabelText x={106} y={row.y + 52} size={15} weight={500} fill="var(--fg-muted)">
            {row.reagent}
          </LabelText>

          <RightReactionArrow x1={194} x2={256} y={row.y + 39} above="H₂O" />

          <LabelText x={334} y={row.y + 27} size={16} weight={700}>
            {row.product}
          </LabelText>
          <LabelText x={334} y={row.y + 52} size={15} weight={500} fill="var(--fg-muted)">
            + Mg(OH)X
          </LabelText>

          <PillLabel cx={470} cy={row.y + 39} text={row.degree} tone={row.tone} />
        </StepCard>
      ))}
    </g>
  )
}

export function CarbonylReductionAndGrignard({
  step,
  reducedMotion,
}: CarbonylReductionAndGrignardProps) {
  const index = Math.min(CARBONYL_GRIGNARD_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const meta = CARBONYL_GRIGNARD_STEPS[index]
  const arrowProgress = useReveal(index, reducedMotion)

  return (
    <svg
      viewBox={`0 0 ${SCROLLY_W} ${SCROLLY_H}`}
      role="img"
      aria-label={meta.ariaLabel}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-step={index}
      data-testid="carbonyl-grignard-visual"
    >
      <PathwayHeader
        badge={meta.badge}
        tone={meta.tone}
        stepIndex={index}
        stepCount={CARBONYL_GRIGNARD_STEP_COUNT}
        title={meta.title}
      />

      {index === 0 ? <Step1AldehydesKetones /> : null}
      {index === 1 ? <Step2CarboxylicAcids /> : null}
      {index === 2 ? <Step3GrignardAdduct arrowProgress={arrowProgress} /> : null}
      {index === 3 ? <Step4GrignardHydrolysis /> : null}

      <StepCaption line={meta.caption} />
    </svg>
  )
}
