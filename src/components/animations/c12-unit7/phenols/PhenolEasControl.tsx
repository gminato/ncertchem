'use client'

import type { ReactNode } from 'react'
import { CurvedArrow, deltaText } from '@/components/organic'
import {
  PHENOL_EAS_STEP_COUNT,
  STRUCT_DISULPHONIC,
  STRUCT_O_BROMOPHENOL,
  STRUCT_O_NITROPHENOL,
  STRUCT_P_BROMOPHENOL,
  STRUCT_P_NITROPHENOL,
  STRUCT_PHENOL,
  STRUCT_PHENOL_ACTIVATED,
  STRUCT_PHENOL_PLAIN,
  STRUCT_PICRIC_ACID,
  STRUCT_TRIBROMOPHENOL,
  clampStep,
} from '@/lib/chem/c12-u7-s9-phenols'
import {
  HBondNitrophenolComparison,
  PhenolRing,
  ReactionArrow,
} from './PhenolStructureSvg'
import styles from './PhenolEasControl.module.css'

export interface PhenolEasControlProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

const W = 560
const H = 470

const STEP_ALT = [
  'Phenol lone pair activates ortho and para ring carbons with delta minus and polarises approaching Br2 without FeBr3',
  'Dilute HNO3 at 298 K converts phenol into o-nitrophenol and p-nitrophenol',
  'Intramolecular hydrogen bonding makes o-nitrophenol steam volatile, while intermolecular hydrogen bonding associates p-nitrophenol molecules',
  'Direct concentrated HNO3 gives picric acid in poor yield, whereas sulphonation with concentrated H2SO4 followed by concentrated HNO3 gives high yield',
  'Br2 in CS2 at 273 K gives major p-bromophenol and minor o-bromophenol, whereas bromine water precipitates 2,4,6-tribromophenol',
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
      title="-OH activates o, p positions and polarises Br₂"
      caption="No FeBr₃ needed: -OH feeds π electrons into the ring."
    >
      <PhenolRing spec={STRUCT_PHENOL_ACTIVATED} cx={164} cy={222} radius={58} />

      <text
        x={164}
        y={334}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={16}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill="var(--fg)"
      >
        Phenol (+R effect)
      </text>
      <text
        x={164}
        y={358}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={15}
        fontFamily="var(--font-sans)"
        fill="var(--delta-minus)"
      >
        {deltaText('δ− concentrated at C-2, C-4, C-6')}
      </text>

      {/* Approaching Br-Br molecule being polarised */}
      <rect
        x={308}
        y={144}
        width={224}
        height={102}
        rx={12}
        fill="var(--surface-raised)"
        stroke="var(--border)"
        strokeWidth={1.2}
      />
      <text
        x={420}
        y={166}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={15}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill="var(--fg-muted)"
      >
        Approaching Br₂ molecule
      </text>
      <text
        x={358}
        y={204}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={19}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        fill="var(--delta-plus)"
      >
        {deltaText('Brδ+')}
      </text>
      <line x1={388} y1={204} x2={444} y2={204} stroke="var(--fg)" strokeWidth={2.8} strokeLinecap="round" />
      <text
        x={476}
        y={204}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={19}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        fill="var(--delta-minus)"
      >
        {deltaText('Brδ−')}
      </text>

      {/* Draw curved electron-pushing arrows above the card background */}
      <CurvedArrow from={{ x: 140, y: 122 }} to={{ x: 162, y: 156 }} bend={-0.45} />
      <CurvedArrow from={{ x: 222, y: 196 }} to={{ x: 336, y: 196 }} bend={-0.38} />

      <rect
        x={308}
        y={270}
        width={224}
        height={34}
        rx={17}
        fill="var(--accent-soft)"
        stroke="var(--accent)"
        strokeWidth={1.2}
      />
      <text
        x={420}
        y={287}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={15}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill="var(--accent)"
      >
        No FeBr₃ catalyst required
      </text>
    </Frame>
  )
}

function Step1() {
  return (
    <Frame
      title="Dilute nitration at 298 K gives o- and p-nitrophenol"
      caption="Dilute HNO₃ at 298 K stops at mononitration."
    >
      <PhenolRing spec={STRUCT_PHENOL} cx={78} cy={200} radius={38} showName />
      <ReactionArrow x1={134} x2={244} y={200} above="Dilute HNO₃" below="298 K" />
      <PhenolRing spec={STRUCT_O_NITROPHENOL} cx={332} cy={196} radius={34} showName nameYOffset={96} />
      <text
        x={418}
        y={196}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={20}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill="var(--fg-muted)"
      >
        +
      </text>
      <PhenolRing spec={STRUCT_P_NITROPHENOL} cx={494} cy={196} radius={34} showName nameYOffset={96} />
    </Frame>
  )
}

function Step2() {
  return (
    <Frame
      title="Steam distillation separates o- and p-nitrophenol"
      caption="o-Nitrophenol distils with steam; p-nitrophenol stays."
    >
      <HBondNitrophenolComparison variant="stacked" />
    </Frame>
  )
}

function Step3() {
  return (
    <Frame
      title="Picric acid: direct conc. HNO₃ vs two-step route"
      caption="Sulphonation limits oxidation; 3 -NO₂ make picric acid strong."
    >
      {/* Top card: Direct conc. HNO3 */}
      <rect x={16} y={52} width={528} height={162} rx={12} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.2} />
      <text x={32} y={72} fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        Direct concentrated nitration
      </text>
      <rect x={346} y={58} width={186} height={24} rx={12} fill="var(--caution-soft)" stroke="var(--caution)" strokeWidth={1} />
      <text x={439} y={70} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--caution)">
        Poor yield (oxidation)
      </text>

      <PhenolRing spec={STRUCT_PHENOL_PLAIN} cx={102} cy={146} radius={24} />
      <ReactionArrow x1={154} x2={292} y={146} above="Conc. HNO₃" />
      <PhenolRing spec={STRUCT_PICRIC_ACID} cx={412} cy={146} radius={24} />
      <text x={102} y={196} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        Phenol
      </text>
      <text x={496} y={140} textAnchor="start" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        Picric
      </text>
      <text x={496} y={160} textAnchor="start" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        acid
      </text>

      {/* Bottom card: Modern two-step route */}
      <rect x={16} y={224} width={528} height={192} rx={12} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.2} />
      <text x={32} y={244} fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        Modern two-step synthesis
      </text>
      <rect x={410} y={230} width={122} height={24} rx={12} fill="var(--success-soft)" stroke="var(--success)" strokeWidth={1} />
      <text x={471} y={242} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--success)">
        High yield
      </text>

      <PhenolRing spec={STRUCT_PHENOL_PLAIN} cx={56} cy={324} radius={20} />
      <ReactionArrow x1={88} x2={176} y={324} above="Conc. H₂SO₄" />
      <PhenolRing spec={STRUCT_DISULPHONIC} cx={226} cy={324} radius={20} />
      <ReactionArrow x1={314} x2={402} y={324} above="Conc. HNO₃" />
      <PhenolRing spec={STRUCT_PICRIC_ACID} cx={484} cy={324} radius={20} />

      <text x={226} y={398} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        Phenol-2,4-disulphonic acid
      </text>
      <text x={484} y={398} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        Picric acid
      </text>
    </Frame>
  )
}

function Step4() {
  return (
    <Frame
      title="Solvent polarity decides mono- vs trisubstitution"
      caption="CS₂ gives monobromophenols; bromine water gives white ppt."
    >
      {/* Top card: CS2 / CHCl3 at 273 K */}
      <rect x={16} y={48} width={528} height={184} rx={12} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.2} />
      <text x={32} y={66} fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        Low-polarity (CS₂ or CHCl₃, 273 K)
      </text>

      <PhenolRing spec={STRUCT_PHENOL_PLAIN} cx={68} cy={140} radius={20} />
      <ReactionArrow x1={110} x2={216} y={140} above="Br₂ in CS₂" below="273 K" />
      <PhenolRing spec={STRUCT_O_BROMOPHENOL} cx={304} cy={134} radius={20} showName nameYOffset={68} />
      <text x={374} y={134} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        +
      </text>
      <PhenolRing spec={STRUCT_P_BROMOPHENOL} cx={448} cy={134} radius={20} showName nameYOffset={68} />

      {/* Bottom card: Bromine water */}
      <rect x={16} y={240} width={528} height={184} rx={12} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.2} />
      <text x={32} y={258} fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        Aqueous medium (Bromine water)
      </text>

      <PhenolRing spec={STRUCT_PHENOL_PLAIN} cx={62} cy={326} radius={20} />
      <text x={116} y={326} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        + 3 Br₂
      </text>
      <ReactionArrow x1={156} x2={244} y={326} above="H₂O" below="(aq.)" />
      <PhenolRing spec={STRUCT_TRIBROMOPHENOL} cx={324} cy={316} radius={20} showName nameYOffset={68} />
      <text x={426} y={316} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        + 3 HBr
      </text>

      {/* Precipitate flask indicator */}
      <rect x={474} y={282} width={54} height={74} rx={10} fill="var(--surface)" stroke="var(--bond)" strokeWidth={1.8} />
      <rect x={477} y={332} width={48} height={21} rx={6} fill="var(--precipitate)" />
      <text x={501} y={376} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--success)">
        White solid
      </text>
    </Frame>
  )
}

const STEPS = [Step0, Step1, Step2, Step3, Step4] as const

/** Scrolly animation for Section 7.4.4(c): Nitration & Bromination control in phenol. */
export function PhenolEasControl({ step, reducedMotion }: PhenolEasControlProps) {
  const index = clampStep(step, PHENOL_EAS_STEP_COUNT)
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
