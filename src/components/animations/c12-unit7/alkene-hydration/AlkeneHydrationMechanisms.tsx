'use client'

import { CurvedArrow, SkeletalFormula } from '@/components/organic'
import { useReveal } from '@/components/animations/unit4/vbt/useStepTween'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import {
  ChargeBadge,
  DownReactionArrow,
  LonePairDots,
  PathwayHeader,
  PillLabel,
  RightReactionArrow,
  SCROLLY_H,
  SCROLLY_W,
  StepCaption,
  StepCard,
} from '../MechSvgPrimitives'
import {
  ALKENE_HYDRATION_STEPS,
  ALKENE_HYDRATION_STEP_COUNT,
  HYDRATION_SPECIES,
} from './alkene-hydration-steps'

export interface AlkeneHydrationMechanismsProps {
  step: number
  reducedMotion: boolean
}

const PROPAN_2_OL = parseSmiles(HYDRATION_SPECIES.propan2ol)
const PROPAN_1_OL = parseSmiles(HYDRATION_SPECIES.propan1ol)

function AtomText({
  x,
  y,
  children,
  fill = 'var(--fg)',
  size = 18,
  weight = 600,
}: {
  x: number
  y: number
  children: string
  fill?: string
  size?: number
  weight?: number
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
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

function Step1Protonation({ arrowProgress }: { arrowProgress: number }) {
  return (
    <g>
      <StepCard y={96} height={134}>
        {/* Propene */}
        <circle cx={142} cy={176} r={19} fill="var(--highlight)" />
        <AtomText x={76} y={176}>CH₃</AtomText>
        <line x1={98} y1={176} x2={122} y2={176} stroke="var(--bond)" strokeWidth={2.4} />
        <AtomText x={142} y={176}>CH</AtomText>
        <line x1={162} y1={172} x2={198} y2={172} stroke="var(--bond)" strokeWidth={2.4} />
        <line x1={162} y1={180} x2={198} y2={180} stroke="var(--bond)" strokeWidth={2.4} />
        <AtomText x={222} y={176}>CH₂</AtomText>
        <AtomText x={142} y={208} size={15} weight={500} fill="var(--fg-muted)">C-2</AtomText>
        <AtomText x={222} y={208} size={15} weight={500} fill="var(--fg-muted)">C-1</AtomText>

        <AtomText x={274} y={176} size={20} fill="var(--fg-muted)">+</AtomText>

        {/* Hydronium ion H-O+(H)2 */}
        <AtomText x={316} y={176}>H</AtomText>
        <line x1={328} y1={176} x2={364} y2={176} stroke="var(--bond)" strokeWidth={2.4} />
        <AtomText x={380} y={176} fill="var(--atom-o)">O</AtomText>
        <LonePairDots cx={372} cy={150} angleDeg={0} />
        <ChargeBadge x={402} y={148} sign="+" />
        <line x1={394} y1={176} x2={414} y2={176} stroke="var(--bond)" strokeWidth={2.4} />
        <AtomText x={426} y={176}>H</AtomText>
        <line x1={380} y1={190} x2={380} y2={204} stroke="var(--bond)" strokeWidth={2.4} />
        <AtomText x={380} y={216}>H</AtomText>
        <AtomText x={466} y={176} size={15} weight={500} fill="var(--fg-muted)">(H₃O⁺)</AtomText>

        {/* Electron-pushing curved arrows */}
        <CurvedArrow from={{ x: 180, y: 164 }} to={{ x: 310, y: 162 }} bend={-0.36} progress={arrowProgress} />
        <CurvedArrow from={{ x: 346, y: 168 }} to={{ x: 374, y: 164 }} bend={-0.62} progress={arrowProgress} />
      </StepCard>

      <DownReactionArrow y1={236} y2={278} equilibrium labelRight="Step 1 (slow)" />

      <StepCard y={284} height={134} highlight tone="accent" dashed>
        {/* Empty p-orbital lobes on planar C-2 */}
        <ellipse
          cx={182}
          cy={320}
          rx={8}
          ry={13}
          fill="var(--orbital-pos)"
          fillOpacity={0.22}
          stroke="var(--orbital-pos)"
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
        <ellipse
          cx={182}
          cy={374}
          rx={8}
          ry={13}
          fill="var(--orbital-neg)"
          fillOpacity={0.22}
          stroke="var(--orbital-neg)"
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
        <circle cx={182} cy={347} r={18} fill="var(--highlight)" />
        <AtomText x={100} y={347}>CH₃</AtomText>
        <line x1={122} y1={347} x2={160} y2={347} stroke="var(--bond)" strokeWidth={2.4} />
        <AtomText x={182} y={347}>CH</AtomText>
        <ChargeBadge x={204} y={327} sign="+" />
        <line x1={204} y1={347} x2={242} y2={347} stroke="var(--bond)" strokeWidth={2.4} />
        <AtomText x={264} y={347}>CH₃</AtomText>

        <AtomText x={324} y={347} size={20} fill="var(--fg-muted)">+</AtomText>
        <AtomText x={378} y={347} fill="var(--atom-o)">H₂O</AtomText>
        <LonePairDots cx={378} cy={325} angleDeg={90} />
        <LonePairDots cx={378} cy={369} angleDeg={90} />

        <PillLabel cx={464} cy={347} text="2° cation" tone="accent" />
        <AtomText x={182} y={405} size={15} weight={600} fill="var(--accent)">
          More stable 2° carbocation (vs 1°)
        </AtomText>
      </StepCard>
    </g>
  )
}

function Step2NucleophilicAttack({ arrowProgress }: { arrowProgress: number }) {
  return (
    <g>
      <StepCard y={96} height={134}>
        <ellipse
          cx={164}
          cy={138}
          rx={9}
          ry={14}
          fill="var(--orbital-pos)"
          fillOpacity={0.22}
          stroke="var(--orbital-pos)"
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
        <ellipse
          cx={164}
          cy={194}
          rx={9}
          ry={14}
          fill="var(--orbital-neg)"
          fillOpacity={0.22}
          stroke="var(--orbital-neg)"
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />
        <circle cx={164} cy={166} r={18} fill="var(--highlight)" />
        <AtomText x={84} y={166}>CH₃</AtomText>
        <line x1={106} y1={166} x2={142} y2={166} stroke="var(--bond)" strokeWidth={2.4} />
        <AtomText x={164} y={166}>CH</AtomText>
        <ChargeBadge x={186} y={146} sign="+" />
        <line x1={186} y1={166} x2={222} y2={166} stroke="var(--bond)" strokeWidth={2.4} />
        <AtomText x={244} y={166}>CH₃</AtomText>
        <AtomText x={164} y={216} size={15} weight={500} fill="var(--fg-muted)">planar sp² carbon</AtomText>

        <AtomText x={306} y={166} size={20} fill="var(--fg-muted)">+</AtomText>

        <LonePairDots cx={358} cy={166} angleDeg={0} />
        <AtomText x={392} y={166} fill="var(--atom-o)">OH₂</AtomText>
        <LonePairDots cx={392} cy={190} angleDeg={90} />
        <AtomText x={392} y={216} size={15} weight={600} fill="var(--lone-pair)">nucleophile</AtomText>

        <CurvedArrow from={{ x: 352, y: 156 }} to={{ x: 170, y: 144 }} bend={0.34} progress={arrowProgress} />
      </StepCard>

      <DownReactionArrow y1={236} y2={278} equilibrium labelRight="Step 2 (fast)" />

      <StepCard y={284} height={134} highlight tone="accent" dashed>
        <AtomText x={118} y={326}>CH₃</AtomText>
        <line x1={140} y1={326} x2={176} y2={326} stroke="var(--bond)" strokeWidth={2.4} />
        <AtomText x={198} y={326}>CH</AtomText>
        <line x1={220} y1={326} x2={256} y2={326} stroke="var(--bond)" strokeWidth={2.4} />
        <AtomText x={278} y={326}>CH₃</AtomText>

        {/* Highlighted newly formed C-O bond */}
        <line x1={198} y1={340} x2={198} y2={376} stroke="var(--highlight)" strokeWidth={14} strokeLinecap="round" />
        <line x1={198} y1={340} x2={198} y2={376} stroke="var(--accent)" strokeWidth={2.8} strokeLinecap="round" />
        <AtomText x={198} y={392} fill="var(--atom-o)">OH₂</AtomText>
        <ChargeBadge x={228} y={386} sign="+" />

        <PillLabel cx={426} cy={334} text="Oxonium ion" tone="accent" />
        <AtomText x={426} y={372} size={15} weight={500} fill="var(--fg-muted)">
          New C-O bond formed
        </AtomText>
      </StepCard>
    </g>
  )
}

function Step3Deprotonation({ arrowProgress }: { arrowProgress: number }) {
  return (
    <g>
      <StepCard y={96} height={140}>
        <AtomText x={76} y={136}>CH₃</AtomText>
        <line x1={98} y1={136} x2={130} y2={136} stroke="var(--bond)" strokeWidth={2.4} />
        <AtomText x={150} y={136}>CH</AtomText>
        <line x1={170} y1={136} x2={202} y2={136} stroke="var(--bond)" strokeWidth={2.4} />
        <AtomText x={224} y={136}>CH₃</AtomText>

        <line x1={150} y1={148} x2={150} y2={174} stroke="var(--bond)" strokeWidth={2.4} />
        <AtomText x={136} y={190} fill="var(--atom-o)">HO</AtomText>
        <ChargeBadge x={110} y={208} sign="+" />
        <line x1={156} y1={190} x2={204} y2={190} stroke="var(--bond)" strokeWidth={2.4} />
        <AtomText x={218} y={190}>H</AtomText>

        <AtomText x={274} y={190} size={20} fill="var(--fg-muted)">+</AtomText>
        <LonePairDots cx={326} cy={190} angleDeg={0} />
        <AtomText x={360} y={190} fill="var(--atom-o)">OH₂</AtomText>
        <AtomText x={360} y={216} size={15} weight={500} fill="var(--lone-pair)">base removes H⁺</AtomText>

        {/* Curved arrows: water lone pair grabs H, O-H pair returns to O */}
        <CurvedArrow from={{ x: 322, y: 180 }} to={{ x: 226, y: 178 }} bend={0.42} progress={arrowProgress} />
        <CurvedArrow from={{ x: 180, y: 182 }} to={{ x: 150, y: 176 }} bend={0.62} progress={arrowProgress} />
      </StepCard>

      <DownReactionArrow y1={242} y2={278} labelRight="Step 3 (catalyst regenerated)" />

      <StepCard y={284} height={134} highlight tone="accent">
        <SkeletalFormula
          graph={PROPAN_2_OL}
          scale={46}
          x={136}
          y={346}
          highlightAtoms={[1, 2]}
          highlightBonds={[1]}
        />
        <AtomText x={238} y={352} size={20} fill="var(--fg-muted)">+</AtomText>
        <PillLabel cx={298} cy={352} text="H₃O⁺" tone="caution" />

        <PillLabel cx={434} cy={318} text="Markovnikov" tone="accent" />
        <AtomText x={434} y={354} size={17} weight={600}>Propan-2-ol (2°)</AtomText>
        <AtomText x={434} y={380} size={15} weight={500} fill="var(--fg-muted)">
          -OH on C-2; H₃O⁺ back
        </AtomText>
      </StepCard>
    </g>
  )
}

function Step4Hydroboration({ arrowProgress }: { arrowProgress: number }) {
  return (
    <g>
      {/* Top card: concerted regioselective addition */}
      <StepCard y={96} height={142}>
        <AtomText x={102} y={136}>CH₃</AtomText>
        <line x1={124} y1={136} x2={156} y2={136} stroke="var(--bond)" strokeWidth={2.4} />
        <AtomText x={176} y={136}>CH</AtomText>
        <line x1={196} y1={132} x2={236} y2={132} stroke="var(--bond)" strokeWidth={2.4} />
        <line x1={196} y1={140} x2={236} y2={140} stroke="var(--bond)" strokeWidth={2.4} />
        <AtomText x={260} y={136}>CH₂</AtomText>

        {/* Forming dashed B-C and H-C alignments */}
        <line x1={176} y1={150} x2={176} y2={182} stroke="var(--accent)" strokeWidth={2} strokeDasharray="4 4" />
        <line x1={260} y1={150} x2={260} y2={182} stroke="var(--success)" strokeWidth={2} strokeDasharray="4 4" />

        <circle cx={260} cy={198} r={18} fill="var(--highlight)" />
        <AtomText x={176} y={198}>H</AtomText>
        <line x1={190} y1={198} x2={236} y2={198} stroke="var(--bond)" strokeWidth={2.4} />
        <AtomText x={260} y={198} fill="var(--caution)">BH₂</AtomText>

        <CurvedArrow from={{ x: 218, y: 146 }} to={{ x: 254, y: 184 }} bend={-0.3} progress={arrowProgress} />

        <PillLabel cx={424} cy={136} text="B adds to C-1" tone="success" />
        <AtomText x={424} y={172} size={15} weight={500} fill="var(--fg-muted)">
          Less substituted sp² C
        </AtomText>
        <AtomText x={424} y={196} size={15} weight={500} fill="var(--fg-muted)">
          from ½ (BH₃)₂
        </AtomText>
      </StepCard>

      {/* Bottom cascade: propylborane -> dipropylborane -> tripropylborane */}
      <StepCard y={252} height={166} highlight tone="success" dashed>
        <AtomText x={122} y={294} size={16}>CH₃CH₂CH₂-BH₂</AtomText>
        <RightReactionArrow x1={206} x2={316} y={294} above="+ propene" />
        <AtomText x={424} y={294} size={16}>(CH₃CH₂CH₂)₂BH</AtomText>

        <RightReactionArrow x1={144} x2={262} y={366} above="+ propene" below="3rd alkene adds" />
        <rect x={282} y={336} width={226} height={58} rx={10} fill="var(--surface)" stroke="var(--success)" strokeWidth={1.6} />
        <AtomText x={395} y={356} size={17} weight={700} fill="var(--fg)">
          (CH₃-CH₂-CH₂)₃B
        </AtomText>
        <AtomText x={395} y={380} size={15} weight={600} fill="var(--success)">
          Tripropylborane
        </AtomText>
      </StepCard>
    </g>
  )
}

function Step5Oxidation() {
  return (
    <g>
      <StepCard y={96} height={84}>
        <rect x={160} y={108} width={240} height={36} rx={8} fill="var(--highlight)" />
        <AtomText x={280} y={126} size={18} weight={700}>
          (CH₃–CH₂–CH₂)₃B
        </AtomText>
        <AtomText x={280} y={158} size={15} weight={500} fill="var(--fg-muted)">
          Three C-B bonds oxidised simultaneously
        </AtomText>
      </StepCard>

      <DownReactionArrow y1={186} y2={232} labelLeft="3 H₂O₂" labelRight="OH⁻, H₂O" />

      <StepCard y={238} height={180} highlight tone="success">
        <AtomText x={54} y={302} size={19} weight={700} fill="var(--success)">3×</AtomText>
        <SkeletalFormula
          graph={PROPAN_1_OL}
          scale={44}
          x={150}
          y={302}
          highlightAtoms={[2, 3]}
          highlightBonds={[2]}
        />
        <AtomText x={248} y={302} size={20} fill="var(--fg-muted)">+</AtomText>
        <PillLabel cx={314} cy={302} text="B(OH)₃" tone="caution" />

        <PillLabel cx={444} cy={272} text="Anti-Markovnikov" tone="success" />
        <AtomText x={444} y={308} size={17} weight={600}>Propan-1-ol (1°)</AtomText>
        <AtomText x={444} y={334} size={15} weight={500} fill="var(--fg-muted)">
          + boric acid
        </AtomText>

        <line x1={38} y1={362} x2={522} y2={362} stroke="var(--border)" strokeWidth={1} />
        <AtomText x={162} y={390} size={15} weight={600} fill="var(--accent)">
          Acid hydration → C-2 (2°)
        </AtomText>
        <AtomText x={398} y={390} size={15} weight={600} fill="var(--success)">
          Hydroboration → C-1 (1°)
        </AtomText>
      </StepCard>
    </g>
  )
}

export function AlkeneHydrationMechanisms({ step, reducedMotion }: AlkeneHydrationMechanismsProps) {
  const index = Math.min(ALKENE_HYDRATION_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const meta = ALKENE_HYDRATION_STEPS[index]
  const arrowProgress = useReveal(index, reducedMotion)

  return (
    <svg
      viewBox={`0 0 ${SCROLLY_W} ${SCROLLY_H}`}
      role="img"
      aria-label={meta.ariaLabel}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-step={index}
      data-testid="alkene-hydration-visual"
    >
      <PathwayHeader
        badge={meta.badge}
        tone={meta.pathway === 'acid' ? 'accent' : 'success'}
        stepIndex={index}
        stepCount={ALKENE_HYDRATION_STEP_COUNT}
        title={meta.title}
      />

      {index === 0 ? <Step1Protonation arrowProgress={arrowProgress} /> : null}
      {index === 1 ? <Step2NucleophilicAttack arrowProgress={arrowProgress} /> : null}
      {index === 2 ? <Step3Deprotonation arrowProgress={arrowProgress} /> : null}
      {index === 3 ? <Step4Hydroboration arrowProgress={arrowProgress} /> : null}
      {index === 4 ? <Step5Oxidation /> : null}

      <StepCaption line={meta.caption} />
    </svg>
  )
}
