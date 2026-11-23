'use client'

import type { ReactNode } from 'react'
import { CurvedArrow } from '@/components/organic'
import { useReveal } from '@/components/animations/unit4/vbt/useStepTween'
import { AromaticRing, StraightArrow, TagPill } from '../phenol-prep/PhenolChemSvg'
import { CUMENE_STEP_COUNT, cumeneStepMeta } from './cumene-steps'

export interface CumeneCleavageProps {
  step: number
  reducedMotion: boolean
}

const W = 640
const H = 540

function Frame({ title, captions, children }: { title: string; captions: readonly string[]; children: ReactNode }) {
  return (
    <>
      <text
        x={W / 2}
        y={36}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={20}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        fill="var(--fg)"
      >
        {title}
      </text>
      {children}
      {captions.map((line, i) => (
        <text
          key={i}
          x={W / 2}
          y={H - 48 + i * 24}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={17}
          fontFamily="var(--font-sans)"
          fill="var(--fg-muted)"
        >
          {line}
        </text>
      ))}
    </>
  )
}

function StepCumene() {
  const rx = 225
  const ry = 355
  const r = 62
  const cx = rx
  const cy = 224

  return (
    <Frame
      title="1. Cumene: the reactive 3° benzylic C–H bond"
      captions={[
        'Two –CH₃ groups and a phenyl ring flank the 3° C–H.',
        'That benzylic C–H bond is the selective O₂ site.',
      ]}
    >
      <AromaticRing
        x={rx}
        y={ry}
        r={r}
        variant="kekule"
        caption="Cumene (isopropylbenzene)"
      />
      {/* C(ring) to C(benzylic) bond */}
      <line x1={rx} y1={ry - r} x2={cx} y2={cy + 16} stroke="var(--fg)" strokeWidth={2.8} strokeLinecap="round" />

      {/* Methyl left-up */}
      <line x1={cx - 12} y1={cy - 8} x2={166} y2={188} stroke="var(--fg)" strokeWidth={2.8} strokeLinecap="round" />
      <text x={138} y={172} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        CH₃
      </text>

      {/* Methyl up */}
      <line x1={cx} y1={cy - 16} x2={cx} y2={150} stroke="var(--fg)" strokeWidth={2.8} strokeLinecap="round" />
      <text x={cx} y={130} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        CH₃
      </text>

      {/* Highlighted C-H bond */}
      <line x1={cx + 15} y1={cy} x2={308} y2={cy} stroke="var(--highlight)" strokeWidth={18} strokeLinecap="round" />
      <line x1={cx + 15} y1={cy} x2={304} y2={cy} stroke="var(--fg)" strokeWidth={3} strokeLinecap="round" />

      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        C
      </text>
      <text x={324} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--ox)">
        H
      </text>

      {/* Callout card */}
      <line x1={342} y1={cy} x2={382} y2={cy} stroke="var(--ox)" strokeWidth={2} strokeDasharray="5 4" />
      <rect x={382} y={176} width={226} height={96} rx={12} fill="var(--surface-raised)" stroke="var(--ox)" strokeWidth={1.6} />
      <text x={495} y={208} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--ox)">
        3° benzylic C–H
      </text>
      <text x={495} y={240} textAnchor="middle" dominantBaseline="central" fontSize={17} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        target for O₂ insertion
      </text>
    </Frame>
  )
}

function StepHydroperoxide({ reveal }: { reveal: number }) {
  const rx = 185
  const ry = 355
  const r = 60
  const cx = rx
  const cy = 224
  const o1 = { x: 274, y: 198 }
  const o2 = { x: 356, y: 234 }
  const hPos = { x: 432, y: 202 }

  return (
    <Frame
      title="2. Air oxidation builds cumene hydroperoxide"
      captions={[
        'O₂ from air inserts into the benzylic C–H bond.',
        'The weak O–O peroxide linkage primes cleavage.',
      ]}
    >
      <AromaticRing
        x={rx}
        y={ry}
        r={r}
        variant="kekule"
        caption="Cumene hydroperoxide"
      />
      <line x1={rx} y1={ry - r} x2={cx} y2={cy + 16} stroke="var(--fg)" strokeWidth={2.8} strokeLinecap="round" />

      <line x1={cx - 12} y1={cy - 8} x2={132} y2={188} stroke="var(--fg)" strokeWidth={2.8} strokeLinecap="round" />
      <text x={106} y={172} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        CH₃
      </text>

      <line x1={cx} y1={cy - 16} x2={cx} y2={150} stroke="var(--fg)" strokeWidth={2.8} strokeLinecap="round" />
      <text x={cx} y={130} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        CH₃
      </text>

      {/* Weak O-O zone box */}
      <rect
        x={248}
        y={168}
        width={136}
        height={92}
        rx={12}
        fill="var(--caution-soft)"
        stroke="var(--caution)"
        strokeWidth={1.6}
        strokeDasharray="6 4"
        opacity={reveal}
      />

      {/* C - O - O - H bonds */}
      <line x1={cx + 15} y1={cy - 4} x2={o1.x - 16} y2={o1.y + 4} stroke="var(--fg)" strokeWidth={2.8} strokeLinecap="round" />
      <line x1={o1.x + 15} y1={o1.y + 7} x2={o2.x - 15} y2={o2.y - 7} stroke="var(--atom-o)" strokeWidth={3} strokeLinecap="round" />
      <line x1={o2.x + 15} y1={o2.y - 6} x2={hPos.x - 15} y2={hPos.y + 6} stroke="var(--fg)" strokeWidth={2.8} strokeLinecap="round" />

      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        C
      </text>
      <text x={o1.x} y={o1.y} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--atom-o)">
        O
      </text>
      <text x={o2.x} y={o2.y} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--atom-o)">
        O
      </text>
      <text x={hPos.x} y={hPos.y} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        H
      </text>

      {/* Incoming O2 cue */}
      <TagPill
        x={495}
        y={104}
        text="O₂ (from air)"
        width={142}
        fill="var(--accent-soft)"
        stroke="var(--accent)"
        textColor="var(--accent)"
      />
      <StraightArrow x1={432} y1={116} x2={342} y2={162} color="var(--accent)" />

      <text x={316} y={284} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--caution)">
        weak O–O bond
      </text>
      <text x={495} y={355} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        C₆H₅–C(CH₃)₂–O–O–H
      </text>
    </Frame>
  )
}

function StepCleavage({ reveal }: { reveal: number }) {
  const rx = 165
  const ry = 356
  const r = 56
  const cx = rx
  const cy = 224
  const o1 = { x: 256, y: 196 }
  const o2 = { x: 356, y: 226 }

  return (
    <Frame
      title="3. Dilute acid triggers O–O cleavage & phenyl shift"
      captions={[
        'Acid protonates outer O, forming a H₂O leaving group.',
        'Phenyl shifts onto O as the weak O–O bond cleaves.',
      ]}
    >
      <AromaticRing
        x={rx}
        y={ry}
        r={r}
        variant="kekule"
        highlightRing
        caption="Phenyl shifts onto O"
      />
      {/* Migrating C(ring)-C bond highlighted */}
      <line x1={rx} y1={ry - r} x2={cx} y2={cy + 16} stroke="var(--highlight)" strokeWidth={12} strokeLinecap="round" />
      <line x1={rx} y1={ry - r} x2={cx} y2={cy + 16} stroke="var(--fg)" strokeWidth={2.8} strokeLinecap="round" />

      <line x1={cx - 12} y1={cy - 8} x2={114} y2={188} stroke="var(--fg)" strokeWidth={2.8} strokeLinecap="round" />
      <text x={90} y={172} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        CH₃
      </text>

      <line x1={cx} y1={cy - 16} x2={cx} y2={150} stroke="var(--fg)" strokeWidth={2.8} strokeLinecap="round" />
      <text x={cx} y={130} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        CH₃
      </text>

      {/* C - O1 - OH2+ */}
      <line x1={cx + 15} y1={cy - 4} x2={o1.x - 15} y2={o1.y + 4} stroke="var(--fg)" strokeWidth={2.8} strokeLinecap="round" />
      <line x1={o1.x + 15} y1={o1.y + 5} x2={o2.x - 32} y2={o2.y - 8} stroke="var(--atom-o)" strokeWidth={2.8} strokeLinecap="round" strokeDasharray="5 4" />

      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        C
      </text>
      <text x={o1.x} y={o1.y} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--atom-o)">
        O
      </text>
      <text x={o2.x + 6} y={o2.y} textAnchor="middle" dominantBaseline="central" fontSize={19} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--accent)">
        OH₂⁺
      </text>

      {/* Protonation cue */}
      <TagPill
        x={368}
        y={96}
        text="H⁺ / H₂O"
        width={114}
        fill="var(--accent-soft)"
        stroke="var(--accent)"
        textColor="var(--accent)"
      />
      <StraightArrow x1={368} y1={118} x2={368} y2={204} color="var(--accent)" />

      {/* Electron-pushing curved arrows */}
      <CurvedArrow
        from={{ x: rx, y: 270 }}
        to={{ x: o1.x - 4, y: o1.y + 14 }}
        bend={0.42}
        progress={reveal}
        headSize={12}
      />
      <CurvedArrow
        from={{ x: 292, y: 209 }}
        to={{ x: 342, y: 210 }}
        bend={-0.55}
        progress={reveal}
        headSize={12}
      />

      {/* Mechanism summary card on right */}
      <rect x={422} y={170} width={196} height={152} rx={12} fill="var(--surface-raised)" stroke="var(--border)" />
      <text x={436} y={200} textAnchor="start" dominantBaseline="central" fontSize={17} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        1. H⁺ protonates O
      </text>
      <text x={436} y={242} textAnchor="start" dominantBaseline="central" fontSize={17} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--e-arrow)">
        2. Phenyl shifts to O
      </text>
      <text x={436} y={284} textAnchor="start" dominantBaseline="central" fontSize={17} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--accent)">
        3. H₂O leaves (O–O)
      </text>
    </Frame>
  )
}

function StepDualProducts({ reveal }: { reveal: number }) {
  const acetoneX = 456
  const acetoneY = 264
  return (
    <Frame
      title="4. Hydrolysis delivers phenol and acetone"
      captions={[
        'Water splits the intermediate into phenol and acetone.',
        'Cheap O₂ and dual products drive global production.',
      ]}
    >
      <TagPill
        x={W / 2}
        y={92}
        text="H₂O hydrolysis completes cleavage"
        width={334}
        fill="var(--accent-soft)"
        stroke="var(--accent)"
        textColor="var(--accent)"
      />

      {/* Phenol */}
      <g opacity={reveal}>
        <AromaticRing
          x={168}
          y={278}
          r={50}
          variant="kekule"
          highlightRing
          ringFill="var(--success-soft)"
          topSubstituent={{ label: 'OH', color: 'var(--atom-o)', anchor: 'first-atom' }}
          caption="Phenol"
          subcaption="C₆H₅OH"
          captionColor="var(--success)"
        />
      </g>

      <text
        x={306}
        y={264}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={28}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        fill="var(--fg-muted)"
      >
        +
      </text>

      {/* Acetone: trigonal planar carbonyl */}
      <g opacity={reveal}>
        <line x1={acetoneX - 4} y1={acetoneY - 16} x2={acetoneX - 4} y2={acetoneY - 70} stroke="var(--atom-o)" strokeWidth={2.8} strokeLinecap="round" />
        <line x1={acetoneX + 4} y1={acetoneY - 16} x2={acetoneX + 4} y2={acetoneY - 70} stroke="var(--atom-o)" strokeWidth={2.8} strokeLinecap="round" />
        <text x={acetoneX} y={acetoneY - 88} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--atom-o)">
          O
        </text>

        <line x1={acetoneX - 13} y1={acetoneY + 8} x2={acetoneX - 58} y2={acetoneY + 34} stroke="var(--fg)" strokeWidth={2.8} strokeLinecap="round" />
        <line x1={acetoneX + 13} y1={acetoneY + 8} x2={acetoneX + 58} y2={acetoneY + 34} stroke="var(--fg)" strokeWidth={2.8} strokeLinecap="round" />

        <text x={acetoneX} y={acetoneY} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
          C
        </text>
        <text x={acetoneX - 78} y={acetoneY + 46} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
          CH₃
        </text>
        <text x={acetoneX + 78} y={acetoneY + 46} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
          CH₃
        </text>

        <text x={acetoneX} y={352} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--accent)">
          Acetone
        </text>
        <text x={acetoneX} y={375} textAnchor="middle" dominantBaseline="central" fontSize={17} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
          CH₃COCH₃
        </text>
      </g>

      <TagPill
        x={172}
        y={434}
        text="Primary product: Phenol"
        width={244}
        fill="var(--success-soft)"
        stroke="var(--success)"
        textColor="var(--success)"
      />
      <TagPill
        x={468}
        y={434}
        text="Co-product: Acetone"
        width={236}
        fill="var(--accent-soft)"
        stroke="var(--accent)"
        textColor="var(--accent)"
      />
    </Frame>
  )
}

/**
 * Scrolly 2 visual for Section 7.4.2 ("Preparation of Phenols"): molecular zoom of the
 * industrial cumene route from the reactive 3° benzylic C–H bond to cumene hydroperoxide,
 * acid-catalysed rearrangement, and dual release of phenol and acetone.
 */
export function CumeneCleavage({ step, reducedMotion }: CumeneCleavageProps) {
  const index = Math.min(CUMENE_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const reveal = useReveal(index, reducedMotion)
  const meta = cumeneStepMeta(index)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={meta.ariaLabel}
      data-step={index}
      style={{ display: 'block', width: '100%', height: 'auto' }}
    >
      {index === 0 && <StepCumene />}
      {index === 1 && <StepHydroperoxide reveal={reveal} />}
      {index === 2 && <StepCleavage reveal={reveal} />}
      {index === 3 && <StepDualProducts reveal={reveal} />}
    </svg>
  )
}
