'use client'

import React from 'react'
import {
  ALPHA_H_SUMMARY,
  COPPER_573K_TRACKS,
  COPPER_TEMPERATURE_K,
  OXIDATION_STEPS,
  PCC_ALLYLIC_EXAMPLE,
} from './oxidation-steps'

export interface AlcoholOxidationProps {
  step: number
  reducedMotion: boolean
}

const W = 600
const H = 500
const FONT = 'var(--font-sans)'
const INK = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const BOND = 'var(--bond)'
const OXYGEN = 'var(--atom-o)'
const ACCENT = 'var(--accent)'
const SUCCESS = 'var(--success)'
const OX = 'var(--ox)'
const PROTON = 'var(--proton)'
const KMNO4 = 'var(--kmno4)'
const FWD = 'var(--fwd)'
const CU = 'var(--el-Cu)'

function Header({ stepIndex }: { stepIndex: number }) {
  const meta = OXIDATION_STEPS[stepIndex]
  return (
    <g>
      <text x={W / 2} y={32} textAnchor="middle" fontSize={20} fontWeight={700} fontFamily={FONT} fill={INK}>
        {meta.title}
      </text>
      <text x={W / 2} y={56} textAnchor="middle" fontSize={16} fontWeight={500} fontFamily={FONT} fill={MUTED}>
        {meta.subtitle}
      </text>
    </g>
  )
}

function StraightArrow({
  x0,
  x1,
  y,
  topText,
  bottomText,
  tone = MUTED,
}: {
  x0: number
  x1: number
  y: number
  topText?: string
  bottomText?: string
  tone?: string
}) {
  const mx = (x0 + x1) / 2
  return (
    <g>
      <line x1={x0} y1={y} x2={x1 - 3} y2={y} stroke={tone} strokeWidth={2.4} strokeLinecap="round" />
      <polygon points={`${x1 - 11},${y - 5.5} ${x1},${y} ${x1 - 11},${y + 5.5}`} fill={tone} />
      {topText && (
        <text x={mx} y={y - 14} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill={tone}>
          {topText}
        </text>
      )}
      {bottomText && (
        <text x={mx} y={y + 24} textAnchor="middle" fontSize={16} fontWeight={500} fontFamily={FONT} fill={MUTED}>
          {bottomText}
        </text>
      )}
    </g>
  )
}

function StepAlphaRule() {
  return (
    <g>
      <rect x={16} y={76} width={568} height={224} rx={14} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.2} />

      {/* Left: H - C(alpha) - O - H with two breaking bond markers */}
      <text x={144} y={114} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill={ACCENT}>
        α-carbon
      </text>
      {/* Top and bottom stubs on C */}
      <line x1={144} y1={126} x2={144} y2={156} stroke={BOND} strokeWidth={2.6} strokeLinecap="round" />
      <line x1={144} y1={194} x2={144} y2={224} stroke={BOND} strokeWidth={2.6} strokeLinecap="round" />

      {/* H - C bond (breaks) */}
      <line x1={74} y1={175} x2={126} y2={175} stroke={OX} strokeWidth={12} strokeLinecap="round" opacity={0.28} />
      <line x1={74} y1={175} x2={126} y2={175} stroke={OX} strokeWidth={2.8} strokeDasharray="5 4" />
      <line x1={96} y1={162} x2={106} y2={188} stroke={PROTON} strokeWidth={2.4} strokeLinecap="round" />
      <text x={58} y={181} textAnchor="middle" fontSize={20} fontWeight={700} fontFamily={FONT} fill={OX}>
        H
      </text>

      <text x={144} y={182} textAnchor="middle" fontSize={22} fontWeight={700} fontFamily={FONT} fill={INK}>
        C
      </text>

      {/* C - O bond (stays and becomes C=O) */}
      <line x1={160} y1={175} x2={204} y2={175} stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <text x={220} y={182} textAnchor="middle" fontSize={22} fontWeight={700} fontFamily={FONT} fill={OXYGEN}>
        O
      </text>

      {/* O - H bond (breaks) */}
      <line x1={236} y1={175} x2={284} y2={175} stroke={OX} strokeWidth={12} strokeLinecap="round" opacity={0.28} />
      <line x1={236} y1={175} x2={284} y2={175} stroke={OX} strokeWidth={2.8} strokeDasharray="5 4" />
      <line x1={255} y1={162} x2={265} y2={188} stroke={PROTON} strokeWidth={2.4} strokeLinecap="round" />
      <text x={298} y={181} textAnchor="middle" fontSize={20} fontWeight={700} fontFamily={FONT} fill={OX}>
        H
      </text>

      <text x={180} y={266} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily={FONT} fill={PROTON}>
        α-C-H and O-H break together
      </text>

      <StraightArrow x0={324} x1={386} y={175} topText="Oxidation" bottomText="− H₂" tone={ACCENT} />

      {/* Right: >C=O + H2 */}
      <line x1={408} y1={144} x2={434} y2={168} stroke={BOND} strokeWidth={2.6} strokeLinecap="round" />
      <line x1={408} y1={206} x2={434} y2={182} stroke={BOND} strokeWidth={2.6} strokeLinecap="round" />
      <text x={446} y={182} textAnchor="middle" fontSize={22} fontWeight={700} fontFamily={FONT} fill={INK}>
        C
      </text>
      <line x1={462} y1={170} x2={504} y2={170} stroke={ACCENT} strokeWidth={3} strokeLinecap="round" />
      <line x1={462} y1={180} x2={504} y2={180} stroke={ACCENT} strokeWidth={3} strokeLinecap="round" />
      <text x={518} y={182} textAnchor="middle" fontSize={22} fontWeight={700} fontFamily={FONT} fill={OXYGEN}>
        O
      </text>
      <text x={556} y={181} textAnchor="middle" fontSize={18} fontWeight={700} fontFamily={FONT} fill={MUTED}>
        + H₂
      </text>
      <text x={482} y={266} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily={FONT} fill={ACCENT}>
        Carbonyl C=O forms
      </text>

      {/* Bottom 3-class alpha-H cards */}
      {ALPHA_H_SUMMARY.map((item, i) => {
        const w = 178
        const x = 18 + i * (w + 15)
        const cx = x + w / 2
        const tone = item.alphaH === 0 ? PROTON : item.alphaH === 1 ? ACCENT : SUCCESS
        return (
          <g key={item.degree}>
            <rect x={x} y={320} width={w} height={158} rx={12} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.2} />
            <text x={cx} y={350} textAnchor="middle" fontSize={17} fontWeight={700} fontFamily={FONT} fill={INK}>
              {`${item.degree} ${item.formula}`}
            </text>
            <rect x={cx - 46} y={368} width={92} height={34} rx={8} fill={tone} fillOpacity={0.14} stroke={tone} strokeWidth={1.4} />
            <text x={cx} y={391} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill={tone}>
              {`${item.alphaH} α-H`}
            </text>
            <text x={cx} y={436} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily={FONT} fill={MUTED}>
              {item.note}
            </text>
          </g>
        )
      })}
    </g>
  )
}

function StepPrimaryBranching() {
  return (
    <g>
      <rect x={16} y={76} width={568} height={228} rx={14} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.2} />

      {/* Starting 1° alcohol box */}
      <rect x={24} y={148} width={156} height={84} rx={12} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.4} />
      <text x={102} y={178} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill={MUTED}>
        1° Alcohol (2 α-H)
      </text>
      <text x={102} y={208} textAnchor="middle" fontSize={18} fontWeight={700} fontFamily={FONT} fill={INK}>
        R-CH₂OH
      </text>

      {/* Upper path: Acidified KMnO4 -> RCOOH */}
      <path d="M 182 172 L 222 126 L 378 126" fill="none" stroke={KMNO4} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
      <polygon points="370,120 382,126 370,132" fill={KMNO4} />
      <text x={300} y={113} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill={KMNO4}>
        Acidified KMnO₄
      </text>
      <rect x={388} y={90} width={180} height={74} rx={12} fill={KMNO4} fillOpacity={0.1} stroke={KMNO4} strokeWidth={1.8} />
      <text x={478} y={118} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill={KMNO4}>
        Carboxylic acid
      </text>
      <text x={478} y={144} textAnchor="middle" fontSize={18} fontWeight={700} fontFamily={FONT} fill={INK}>
        R-COOH
      </text>

      {/* Lower path: Anhydrous CrO3 / PCC -> RCHO */}
      <path d="M 182 208 L 222 252 L 378 252" fill="none" stroke={ACCENT} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
      <polygon points="370,246 382,252 370,258" fill={ACCENT} />
      <text x={300} y={239} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill={ACCENT}>
        Anhyd. CrO₃ / PCC
      </text>
      <rect x={388} y={214} width={180} height={74} rx={12} fill={ACCENT} fillOpacity={0.1} stroke={ACCENT} strokeWidth={1.8} />
      <text x={478} y={242} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill={ACCENT}>
        Aldehyde (stops)
      </text>
      <text x={478} y={268} textAnchor="middle" fontSize={18} fontWeight={700} fontFamily={FONT} fill={INK}>
        R-CHO
      </text>

      {/* Bottom NCERT PCC Selectivity Card */}
      <rect x={16} y={322} width={568} height={160} rx={14} fill="var(--surface)" stroke={SUCCESS} strokeWidth={1.8} />
      <text x={W / 2} y={352} textAnchor="middle" fontSize={17} fontWeight={700} fontFamily={FONT} fill={SUCCESS}>
        PCC preserves C=C double bonds (good yield)
      </text>

      {/* Left substrate with exact green pill around CH=CH */}
      <rect x={26} y={374} width={226} height={50} rx={10} fill="var(--surface-raised)" stroke="var(--border)" />
      <text x={78} y={405} textAnchor="end" fontSize={16} fontWeight={700} fontFamily={FONT} fill={INK}>
        CH₃-
      </text>
      <rect x={80} y={381} width={64} height={36} rx={7} fill={SUCCESS} fillOpacity={0.16} stroke={SUCCESS} strokeWidth={1.5} />
      <text x={112} y={405} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill={SUCCESS}>
        CH=CH
      </text>
      <text x={146} y={405} textAnchor="start" fontSize={16} fontWeight={700} fontFamily={FONT} fill={INK}>
        -CH₂OH
      </text>

      <StraightArrow x0={260} x1={334} y={399} topText="PCC" tone={ACCENT} />

      {/* Right product with exact green pill around CH=CH */}
      <rect x={342} y={374} width={228} height={50} rx={10} fill="var(--surface-raised)" stroke="var(--border)" />
      <text x={402} y={405} textAnchor="end" fontSize={16} fontWeight={700} fontFamily={FONT} fill={INK}>
        CH₃-
      </text>
      <rect x={404} y={381} width={64} height={36} rx={7} fill={SUCCESS} fillOpacity={0.16} stroke={SUCCESS} strokeWidth={1.5} />
      <text x={436} y={405} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill={SUCCESS}>
        CH=CH
      </text>
      <text x={470} y={405} textAnchor="start" fontSize={16} fontWeight={700} fontFamily={FONT} fill={INK}>
        -CHO
      </text>

      <text x={W / 2} y={460} textAnchor="middle" fontSize={16} fontWeight={500} fontFamily={FONT} fill={MUTED}>
        {PCC_ALLYLIC_EXAMPLE.note}
      </text>
    </g>
  )
}

function StepSecondaryTertiary() {
  return (
    <g>
      {/* Top card: 2° alcohol -> ketone */}
      <rect x={16} y={76} width={568} height={152} rx={14} fill="var(--surface)" stroke={ACCENT} strokeWidth={1.5} />
      <text x={36} y={108} textAnchor="start" fontSize={16} fontWeight={700} fontFamily={FONT} fill={ACCENT}>
        Secondary (2°) alcohol: 1 α-hydrogen
      </text>

      <rect x={36} y={128} width={174} height={54} rx={10} fill="var(--surface-raised)" stroke="var(--border)" />
      <text x={123} y={161} textAnchor="middle" fontSize={18} fontWeight={700} fontFamily={FONT} fill={INK}>
        R-CH(OH)-R′
      </text>

      <StraightArrow x0={224} x1={332} y={155} topText="CrO₃" tone={ACCENT} />

      <rect x={346} y={128} width={218} height={54} rx={10} fill={ACCENT} fillOpacity={0.1} stroke={ACCENT} strokeWidth={1.6} />
      <text x={455} y={161} textAnchor="middle" fontSize={18} fontWeight={700} fontFamily={FONT} fill={INK}>
        R-CO-R′ (Ketone)
      </text>

      <text x={300} y={210} textAnchor="middle" fontSize={16} fontWeight={500} fontFamily={FONT} fill={MUTED}>
        Cleaves O-H and the single α-C-H, then stops at the ketone
      </text>

      {/* Bottom card: 3° alcohol */}
      <rect x={16} y={248} width={568} height={234} rx={14} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.4} />
      <text x={36} y={280} textAnchor="start" fontSize={16} fontWeight={700} fontFamily={FONT} fill={PROTON}>
        Tertiary (3°) alcohol: 0 α-hydrogens
      </text>

      <rect x={32} y={334} width={154} height={74} rx={12} fill="var(--surface-raised)" stroke="var(--border)" />
      <text x={109} y={366} textAnchor="middle" fontSize={18} fontWeight={700} fontFamily={FONT} fill={INK}>
        (CH₃)₃C-OH
      </text>
      <text x={109} y={392} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily={FONT} fill={PROTON}>
        No α-H on C
      </text>

      {/* Upper branch: mild reagents fail */}
      <path d="M 188 356 L 238 320 L 348 320" fill="none" stroke={MUTED} strokeWidth={2.4} />
      <polygon points="340,314 352,320 340,326" fill={MUTED} />
      <text x={290} y={308} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily={FONT} fill={MUTED}>
        CrO₃ / PCC
      </text>
      <rect x={360} y={294} width={206} height={54} rx={10} fill="var(--surface-raised)" stroke="var(--border)" />
      <text x={463} y={326} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill={MUTED}>
        No reaction
      </text>

      {/* Lower branch: harsh KMnO4 + heat */}
      <path d="M 188 388 L 238 424 L 348 424" fill="none" stroke={PROTON} strokeWidth={2.4} />
      <polygon points="340,418 352,424 340,430" fill={PROTON} />
      <text x={286} y={410} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill={PROTON}>
        KMnO₄ + heat
      </text>
      <rect x={360} y={394} width={206} height={68} rx={10} fill={PROTON} fillOpacity={0.1} stroke={PROTON} strokeWidth={1.6} />
      <text x={463} y={422} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill={PROTON}>
        C-C bonds cleave
      </text>
      <text x={463} y={448} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily={FONT} fill={INK}>
        Shorter acids (&lt; 4 C)
      </text>
    </g>
  )
}

function StepCopper573K() {
  return (
    <g>
      {/* Central hot copper catalyst band */}
      <rect x={228} y={76} width={116} height={368} rx={12} fill={CU} fillOpacity={0.14} stroke={CU} strokeWidth={2} />
      <text x={286} y={102} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill={CU}>
        {`Cu · ${COPPER_TEMPERATURE_K} K`}
      </text>

      {COPPER_573K_TRACKS.map((row, idx) => {
        const y = 118 + idx * 108
        const cy = y + 48
        const isDehydration = row.degree === '3°'
        const tone = isDehydration ? OX : FWD
        return (
          <g key={row.degree}>
            <rect
              x={16}
              y={y}
              width={568}
              height={94}
              rx={12}
              fill="var(--surface)"
              fillOpacity={0.78}
              stroke={isDehydration ? OX : 'var(--border)'}
              strokeWidth={isDehydration ? 1.8 : 1.2}
            />

            {/* Substrate pill */}
            <text x={32} y={y + 28} textAnchor="start" fontSize={16} fontWeight={700} fontFamily={FONT} fill={tone}>
              {`${row.degree} alcohol`}
            </text>
            <text x={32} y={y + 62} textAnchor="start" fontSize={18} fontWeight={700} fontFamily={FONT} fill={INK}>
              {row.substrateFormula}
            </text>

            {/* Arrow across heated Cu */}
            <line x1={236} y1={cy} x2={332} y2={cy} stroke={CU} strokeWidth={2.8} strokeLinecap="round" />
            <polygon points={`324,${cy - 6} 336,${cy} 324,${cy + 6}`} fill={CU} />
            <text x={286} y={cy - 14} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill={CU}>
              Cu, 573 K
            </text>

            {/* Product + reaction badge */}
            <text x={354} y={y + 34} textAnchor="start" fontSize={17} fontWeight={700} fontFamily={FONT} fill={INK}>
              {`${row.productFormula} + ${row.byProduct}`}
            </text>
            <rect x={354} y={y + 48} width={206} height={32} rx={8} fill={tone} fillOpacity={0.14} />
            <text x={457} y={y + 70} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill={tone}>
              {row.reactionKind}
            </text>
          </g>
        )
      })}

      <rect x={16} y={452} width={568} height={38} rx={10} fill="var(--surface)" stroke="var(--border)" />
      <text x={W / 2} y={477} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily={FONT} fill={INK}>
        1° &amp; 2° lose H₂ (dehydrogenation); 3° loses H₂O (dehydration)
      </text>
    </g>
  )
}

export function AlcoholOxidation({ step }: AlcoholOxidationProps) {
  const k = Math.max(0, Math.min(OXIDATION_STEPS.length - 1, Math.round(step)))
  const meta = OXIDATION_STEPS[k]
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={`Alcohol oxidation pathways: ${meta.title}`}
      data-step={k}
      style={{ display: 'block', height: 'auto' }}
    >
      <Header stepIndex={k} />
      {k === 0 && <StepAlphaRule />}
      {k === 1 && <StepPrimaryBranching />}
      {k === 2 && <StepSecondaryTertiary />}
      {k === 3 && <StepCopper573K />}
    </svg>
  )
}
