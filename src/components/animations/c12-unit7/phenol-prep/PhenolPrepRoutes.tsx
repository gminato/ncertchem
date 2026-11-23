'use client'

import type { ReactNode } from 'react'
import { useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import { useReveal } from '@/components/animations/unit4/vbt/useStepTween'
import { AromaticRing, StraightArrow, TagPill } from './PhenolChemSvg'
import { PHENOL_PREP_STEP_COUNT, phenolPrepStepMeta } from './phenol-prep-steps'

export interface PhenolPrepRoutesProps {
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

function StepHaloarene({ reveal }: { reveal: number }) {
  const y = 248
  return (
    <Frame
      title="1. From haloarenes: alkali fusion of chlorobenzene"
      captions={[
        'Aryl C(sp²)–Cl resists mild NaOH; forcing heat is required.',
        'Equation prints 300 atm (NCERT text notes 320 atm).',
      ]}
    >
      <TagPill
        x={105}
        y={92}
        text="sp² aryl C–Cl"
        width={142}
        fill="var(--caution-soft)"
        stroke="var(--caution)"
        textColor="var(--fg)"
      />
      <AromaticRing
        x={105}
        y={y}
        r={42}
        topSubstituent={{ label: 'Cl', color: 'var(--atom-hal)', bondHighlight: true }}
        caption="Chlorobenzene"
        subcaption="+ NaOH"
      />

      <StraightArrow
        x1={154}
        y1={y}
        x2={266}
        y2={y}
        above={['NaOH', '623 K']}
        below={['300 atm']}
        color="var(--heat)"
        aboveColor="var(--heat)"
      />

      <AromaticRing
        x={320}
        y={y}
        r={42}
        opacity={0.3 + 0.7 * reveal}
        topSubstituent={{ label: 'O⁻ Na⁺', color: 'var(--atom-o)', anchor: 'first-atom' }}
        caption="Sodium phenoxide"
        subcaption="trapped salt"
      />

      <StraightArrow
        x1={374}
        y1={y}
        x2={474}
        y2={y}
        above={['HCl']}
        below={['protonation']}
        color="var(--accent)"
        aboveColor="var(--accent)"
      />

      <AromaticRing
        x={535}
        y={y}
        r={42}
        opacity={reveal}
        highlightRing
        ringFill="var(--success-soft)"
        topSubstituent={{ label: 'OH', color: 'var(--atom-o)', anchor: 'first-atom' }}
        caption="Phenol"
        subcaption="C₆H₅OH"
        captionColor="var(--success)"
      />
    </Frame>
  )
}

function StepSulphonic({ reveal }: { reveal: number }) {
  const topY = 148
  const botY = 398
  const leftX = 160
  const rightX = 480
  return (
    <Frame
      title="2. From benzenesulphonic acid (via benzene)"
      captions={[
        'Oleum attaches –SO₃H; molten NaOH gives phenoxide.',
        'Acidification (H⁺) restores neutral phenol.',
      ]}
    >
      <AromaticRing
        x={leftX}
        y={topY}
        r={34}
        caption="Benzene"
        subcaption="C₆H₆"
      />

      <StraightArrow
        x1={212}
        y1={topY}
        x2={424}
        y2={topY}
        above={['Oleum']}
        below={['(fuming H₂SO₄)']}
        color="var(--el-S)"
      />

      <AromaticRing
        x={rightX}
        y={topY}
        r={34}
        opacity={0.35 + 0.65 * reveal}
        topSubstituent={{ label: 'SO₃H', color: 'var(--atom-s)', anchor: 'first-atom' }}
        caption="Benzenesulphonic acid"
      />

      {/* Downward step from Benzenesulphonic acid (top-right) to Sodium phenoxide (bottom-right) */}
      <StraightArrow
        x1={rightX}
        y1={226}
        x2={rightX}
        y2={294}
        color="var(--heat)"
      />
      <text
        x={rightX - 18}
        y={260}
        textAnchor="end"
        dominantBaseline="central"
        fontSize={17}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill="var(--heat)"
      >
        (i) molten NaOH, heat
      </text>

      <AromaticRing
        x={rightX}
        y={botY}
        r={34}
        opacity={0.35 + 0.65 * reveal}
        topSubstituent={{ label: 'O⁻ Na⁺', color: 'var(--atom-o)', anchor: 'first-atom' }}
        caption="Sodium phenoxide"
      />

      <StraightArrow
        x1={424}
        y1={botY}
        x2={212}
        y2={botY}
        above={['(ii) H⁺']}
        below={['acid workup']}
        color="var(--accent)"
        aboveColor="var(--accent)"
      />

      <AromaticRing
        x={leftX}
        y={botY}
        r={34}
        opacity={reveal}
        highlightRing
        ringFill="var(--success-soft)"
        topSubstituent={{ label: 'OH', color: 'var(--atom-o)', anchor: 'first-atom' }}
        caption="Phenol"
        captionColor="var(--success)"
      />
    </Frame>
  )
}

function StepDiazonium({ reveal, time, reducedMotion }: { reveal: number; time: number; reducedMotion: boolean }) {
  const y = 252
  const drift = reducedMotion ? 0 : Math.sin(time * 2.2) * 4
  return (
    <Frame
      title="3. From diazonium salts (cold then warm)"
      captions={[
        'Ice-bath cooling (273-278 K) keeps the salt intact.',
        'Warming with H₂O releases N₂ gas and forms phenol.',
      ]}
    >
      <TagPill
        x={210}
        y={92}
        text="Ice bath: 273-278 K"
        width={194}
        fill="var(--accent-soft)"
        stroke="var(--accent)"
        textColor="var(--accent)"
      />

      <AromaticRing
        x={100}
        y={y}
        r={42}
        topSubstituent={{ label: 'NH₂', color: 'var(--atom-n)', anchor: 'first-atom' }}
        caption="Aniline"
        subcaption="C₆H₅NH₂"
      />

      <StraightArrow
        x1={152}
        y1={y}
        x2={262}
        y2={y}
        above={['NaNO₂ + HCl']}
        below={['273-278 K']}
        color="var(--coolant)"
        belowColor="var(--accent)"
      />

      <AromaticRing
        x={320}
        y={y}
        r={42}
        opacity={0.35 + 0.65 * reveal}
        topSubstituent={{ label: 'N₂⁺ Cl⁻', color: 'var(--atom-n)', anchor: 'first-atom' }}
        caption="Benzene diazonium"
        subcaption="chloride"
      />

      <StraightArrow
        x1={374}
        y1={y}
        x2={474}
        y2={y}
        above={['H₂O']}
        below={['warm']}
        color="var(--heat)"
        belowColor="var(--heat)"
      />

      <g transform={`translate(0, ${drift.toFixed(2)})`} opacity={reveal}>
        <TagPill
          x={424}
          y={110}
          text="N₂ ↑ gas"
          width={106}
          fill="var(--success-soft)"
          stroke="var(--success)"
          textColor="var(--success)"
        />
      </g>
      <g opacity={reveal}>
        <TagPill
          x={538}
          y={110}
          text="+ HCl"
          width={86}
          fill="var(--surface-raised)"
          stroke="var(--border)"
          textColor="var(--fg)"
        />
      </g>

      <AromaticRing
        x={536}
        y={y}
        r={42}
        opacity={reveal}
        highlightRing
        ringFill="var(--success-soft)"
        topSubstituent={{ label: 'OH', color: 'var(--atom-o)', anchor: 'first-atom' }}
        caption="Phenol"
        subcaption="C₆H₅OH"
        captionColor="var(--success)"
      />
    </Frame>
  )
}

function StepWorkupComparison({ reveal }: { reveal: number }) {
  return (
    <Frame
      title="4. Comparing workups: trapped phenoxide vs direct release"
      captions={[
        'Excess NaOH traps phenoxide until HCl / H⁺ is added.',
        'Diazonium hydrolysis gives phenol directly in water.',
      ]}
    >
      {/* Top comparison lane: Basic alkali fusion routes */}
      <rect
        x={28}
        y={74}
        width={584}
        height={186}
        rx={14}
        fill="var(--surface-raised)"
        stroke="var(--border)"
      />
      <text
        x={48}
        y={98}
        textAnchor="start"
        dominantBaseline="central"
        fontSize={17}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        fill="var(--fg)"
      >
        Routes 1 & 2 (Alkali fusion in excess NaOH)
      </text>

      <AromaticRing
        x={124}
        y={192}
        r={30}
        topSubstituent={{ label: 'O⁻ Na⁺', color: 'var(--atom-o)', bondHighlight: true, haloColor: 'var(--caution-soft)', anchor: 'first-atom' }}
        caption="Trapped phenoxide"
      />
      <StraightArrow
        x1={194}
        y1={192}
        x2={446}
        y2={192}
        above={['Acid workup (HCl / H⁺)']}
        below={['protonates C₆H₅O⁻']}
        color="var(--accent)"
        aboveColor="var(--accent)"
      />
      <AromaticRing
        x={516}
        y={192}
        r={30}
        opacity={reveal}
        highlightRing
        ringFill="var(--success-soft)"
        topSubstituent={{ label: 'OH', color: 'var(--atom-o)', anchor: 'first-atom' }}
        caption="Free phenol"
        captionColor="var(--success)"
      />

      {/* Bottom comparison lane: Diazonium hydrolysis */}
      <rect
        x={28}
        y={278}
        width={584}
        height={186}
        rx={14}
        fill="var(--surface-raised)"
        stroke="var(--border)"
      />
      <text
        x={48}
        y={302}
        textAnchor="start"
        dominantBaseline="central"
        fontSize={17}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        fill="var(--fg)"
      >
        Route 3 (Diazonium hydrolysis in warm water)
      </text>

      <AromaticRing
        x={124}
        y={394}
        r={30}
        topSubstituent={{ label: 'N₂⁺ Cl⁻', color: 'var(--atom-n)', anchor: 'first-atom' }}
        caption="Diazonium salt"
      />
      <StraightArrow
        x1={194}
        y1={394}
        x2={446}
        y2={394}
        above={['H₂O, warm (direct hydrolysis)']}
        below={['releases N₂ ↑ + HCl']}
        color="var(--success)"
        aboveColor="var(--success)"
      />
      <AromaticRing
        x={516}
        y={394}
        r={30}
        opacity={reveal}
        highlightRing
        ringFill="var(--success-soft)"
        topSubstituent={{ label: 'OH', color: 'var(--atom-o)', anchor: 'first-atom' }}
        caption="Direct phenol"
        captionColor="var(--success)"
      />
    </Frame>
  )
}

/**
 * Scrolly 1 visual for Section 7.4.2 ("Preparation of Phenols"): compares the three classic
 * benzene-derivative routes (chlorobenzene alkali fusion, benzenesulphonic acid, diazonium salt)
 * and contrasts phenoxide trapping with direct diazonium hydrolysis.
 */
export function PhenolPrepRoutes({ step, reducedMotion }: PhenolPrepRoutesProps) {
  const index = Math.min(PHENOL_PREP_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const reveal = useReveal(index, reducedMotion)
  const time = useAmbientTime(reducedMotion || index !== 2)
  const meta = phenolPrepStepMeta(index)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={meta.ariaLabel}
      data-step={index}
      style={{ display: 'block', width: '100%', height: 'auto' }}
    >
      {index === 0 && <StepHaloarene reveal={reveal} />}
      {index === 1 && <StepSulphonic reveal={reveal} />}
      {index === 2 && <StepDiazonium reveal={reveal} time={time} reducedMotion={reducedMotion} />}
      {index === 3 && <StepWorkupComparison reveal={reveal} />}
    </svg>
  )
}
