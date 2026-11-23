'use client'

import type { ReactNode } from 'react'
import { CurvedArrow, deltaText } from '@/components/organic'
import {
  PHENOL_NAMED_REDOX_STEP_COUNT,
  STRUCT_BENZAL_INTERMEDIATE,
  STRUCT_BENZENE,
  STRUCT_BENZOQUINONE,
  STRUCT_FORMYL_PHENOXIDE,
  STRUCT_PHENOL,
  STRUCT_PHENOL_PLAIN,
  STRUCT_PHENOXIDE,
  STRUCT_SALICYLALDEHYDE,
  STRUCT_SALICYLIC_ACID,
  clampStep,
} from '@/lib/chem/c12-u7-s9-phenols'
import { PhenolRing, ReactionArrow } from './PhenolStructureSvg'
import styles from './PhenolNamedRedox.module.css'

export interface PhenolNamedRedoxProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

const W = 560
const H = 470

const STEP_ALT = [
  'Phenol reacts with NaOH to form the more strongly activating sodium phenoxide ion',
  'Kolbe reaction converts sodium phenoxide with CO2 and H plus into 2-hydroxybenzoic acid or salicylic acid',
  'Reimer-Tiemann step 1 with CHCl3 and aqueous NaOH forms the ortho-substituted benzal chloride intermediate',
  'Alkaline hydrolysis with NaOH converts the benzal chloride intermediate into an ortho-CHO phenoxide, and H plus yields salicylaldehyde',
  'Heating phenol with zinc dust reduces it to benzene plus ZnO, while chromic acid oxidises phenol to benzoquinone',
] as const

function Frame({
  title,
  caption,
  children,
}: {
  title: string
  caption: string
  children: ReactNode
}) {
  return (
    <>
      <text
        x={W / 2}
        y={28}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={18}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill="var(--fg)"
      >
        {title}
      </text>
      {children}
      <text
        x={W / 2}
        y={446}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={15}
        fontFamily="var(--font-sans)"
        fill="var(--fg-muted)"
      >
        {caption}
      </text>
    </>
  )
}

function Step0() {
  return (
    <Frame
      title="Phenoxide ion super-activates the aromatic ring"
      caption="Negative charge on O boosts o and p density even more."
    >
      <PhenolRing spec={STRUCT_PHENOL} cx={98} cy={196} radius={42} showName />
      <ReactionArrow x1={164} x2={278} y={196} above="NaOH" below="− H₂O" />
      <PhenolRing spec={STRUCT_PHENOXIDE} cx={392} cy={196} radius={46} showName nameYOffset={96} />
      <CurvedArrow from={{ x: 364, y: 112 }} to={{ x: 389, y: 138 }} bend={-0.38} />

      <rect x={36} y={346} width={488} height={60} rx={12} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.2} />
      <text x={280} y={366} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        Phenoxide (-O⁻) is more reactive than neutral phenol (-OH)
      </text>
      <text x={280} y={388} textAnchor="middle" dominantBaseline="central" fontSize={15} fontFamily="var(--font-sans)" fill="var(--delta-minus)">
        {deltaText('Enhanced δ− at ortho/para enables attack on weak electrophiles')}
      </text>
    </Frame>
  )
}

function Step1() {
  return (
    <Frame
      title={"Kolbe's reaction: phenoxide captures CO₂"}
      caption="CO₂ then H⁺ gives salicylic acid as the major product."
    >
      <PhenolRing spec={STRUCT_PHENOXIDE} cx={96} cy={210} radius={40} showName nameYOffset={90} />

      {/* Weak electrophile O=C=O near ortho carbon */}
      <rect x={162} y={88} width={116} height={42} rx={10} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.2} />
      <text x={220} y={109} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        {deltaText('O=C(δ+)=O')}
      </text>
      <CurvedArrow from={{ x: 132, y: 184 }} to={{ x: 204, y: 132 }} bend={-0.35} />

      <ReactionArrow x1={182} x2={308} y={210} above="(i) CO₂" below="(ii) H⁺" />
      <PhenolRing spec={STRUCT_SALICYLIC_ACID} cx={416} cy={210} radius={40} showName nameYOffset={90} />
    </Frame>
  )
}

function Step2() {
  return (
    <Frame
      title="Reimer-Tiemann: substituted benzal chloride intermediate"
      caption="CHCl₃ + aq. NaOH installs -CHCl₂ ortho to -O⁻Na⁺."
    >
      <PhenolRing spec={STRUCT_PHENOL} cx={104} cy={204} radius={44} showName />
      <ReactionArrow
        x1={174}
        x2={316}
        y={204}
        above="CHCl₃ + aq. NaOH"
        below="Ortho substitution"
      />
      <PhenolRing spec={STRUCT_BENZAL_INTERMEDIATE} cx={420} cy={204} radius={40} showName nameYOffset={96} />
    </Frame>
  )
}

function Step3() {
  return (
    <Frame
      title="Alkaline hydrolysis and acidification to salicylaldehyde"
      caption="NaOH converts -CHCl₂ to -CHO; H⁺ restores -OH."
    >
      {/* Top row: Step 2 hydrolysis */}
      <rect x={16} y={54} width={528} height={172} rx={12} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.2} />
      <text x={32} y={76} fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        Step 2: Alkaline hydrolysis (-CHCl₂ to -CHO)
      </text>
      <PhenolRing spec={STRUCT_BENZAL_INTERMEDIATE} cx={120} cy={146} radius={24} />
      <ReactionArrow x1={222} x2={342} y={146} above="NaOH" below="hydrolysis" />
      <PhenolRing spec={STRUCT_FORMYL_PHENOXIDE} cx={418} cy={146} radius={24} />
      <text x={120} y={208} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        o-(CHCl₂)C₆H₄O⁻Na⁺
      </text>
      <text x={418} y={208} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        o-(CHO)C₆H₄O⁻Na⁺
      </text>

      {/* Bottom row: Step 3 acidification */}
      <rect x={16} y={240} width={528} height={176} rx={12} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.2} />
      <text x={32} y={262} fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--accent)">
        Step 3: Acidification restores -OH
      </text>
      <PhenolRing spec={STRUCT_FORMYL_PHENOXIDE} cx={120} cy={334} radius={26} />
      <ReactionArrow x1={216} x2={336} y={334} above="H⁺" below="acidify" />
      <PhenolRing spec={STRUCT_SALICYLALDEHYDE} cx={408} cy={330} radius={26} />
      <text x={378} y={396} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        Salicylaldehyde (2-hydroxybenzaldehyde)
      </text>
    </Frame>
  )
}

function Step4() {
  return (
    <Frame
      title="Zinc dust reduction vs chromic acid oxidation"
      caption="Zn yields benzene + ZnO; chromic acid yields benzoquinone."
    >
      {/* Top card: Reduction with Zn dust */}
      <rect x={16} y={52} width={528} height={164} rx={12} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.2} />
      <text x={32} y={74} fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--accent)">
        Reduction with zinc dust (deoxygenation)
      </text>

      <PhenolRing spec={STRUCT_PHENOL_PLAIN} cx={78} cy={142} radius={25} />
      <text x={144} y={142} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        + Zn
      </text>
      <ReactionArrow x1={182} x2={290} y={142} above="Heat (Δ)" />
      <PhenolRing spec={STRUCT_BENZENE} cx={354} cy={142} radius={25} />
      <text x={426} y={142} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        + ZnO
      </text>
      <text x={354} y={194} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        Benzene (C₆H₆)
      </text>

      {/* Bottom card: Oxidation with chromic acid */}
      <rect x={16} y={228} width={528} height={188} rx={12} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.2} />
      <text x={32} y={248} fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--ox)">
        Oxidation with chromic acid (loss of aromaticity)
      </text>

      <PhenolRing spec={STRUCT_PHENOL_PLAIN} cx={84} cy={318} radius={25} />
      <ReactionArrow x1={144} x2={278} y={318} above="Na₂Cr₂O₇" below="H₂SO₄" />
      <PhenolRing spec={STRUCT_BENZOQUINONE} cx={344} cy={312} radius={24} />
      <text x={344} y={396} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        Benzoquinone (diketone)
      </text>

      <text x={412} y={310} fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        Slow air exposure
      </text>
      <text x={412} y={332} fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        also gives dark
      </text>
      <text x={412} y={354} fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        quinone mixtures
      </text>
    </Frame>
  )
}

const STEPS = [Step0, Step1, Step2, Step3, Step4] as const

/** Scrolly animation for Section 7.4.4(c): Phenoxide, Kolbe, Reimer-Tiemann, Zn & Oxidation. */
export function PhenolNamedRedox({ step, reducedMotion }: PhenolNamedRedoxProps) {
  const index = clampStep(step, PHENOL_NAMED_REDOX_STEP_COUNT)
  const Scene = STEPS[index]

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={STEP_ALT[index]}
      className={styles.drawing}
      data-step={index}
    >
      <g key={index} className={reducedMotion ? undefined : styles.enter}>
        <Scene />
      </g>
    </svg>
  )
}
