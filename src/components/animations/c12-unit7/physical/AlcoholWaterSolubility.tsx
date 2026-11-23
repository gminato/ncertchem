'use client'

import type { ReactNode } from 'react'
import {
  ALCOHOL_SOLUBILITY_STEP_COUNT,
  ALCOHOL_SOLUBILITY_STEP_TITLES,
} from './alcohol-solubility-steps'

export interface AlcoholWaterSolubilityProps {
  step: number
  reducedMotion: boolean
}

const W = 540
const H = 456

function WaterPill({ cx, cy, muted = false }: { cx: number; cy: number; muted?: boolean }) {
  return (
    <g>
      <rect
        x={cx - 26}
        y={cy - 15}
        width={52}
        height={30}
        rx={15}
        fill={muted ? 'var(--surface)' : 'var(--liquid)'}
        stroke={muted ? 'var(--fg-muted)' : 'var(--liquid-edge)'}
        strokeWidth={1.6}
      />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--fg)">
        H₂O
      </text>
    </g>
  )
}

function BenzeneHex({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const angle = (i * Math.PI) / 3
    return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`
  }).join(' ')
  return (
    <g>
      <polygon points={pts} fill="none" stroke="var(--fg)" strokeWidth={2.2} strokeLinejoin="round" />
      <circle cx={cx} cy={cy} r={r * 0.56} fill="none" stroke="var(--fg)" strokeWidth={1.8} />
    </g>
  )
}

/** Step 1: Propan-1-ol surrounded by three H2O molecules with H-bonds. */
function PropanolHydration() {
  return (
    <g>
      <text x={W / 2} y={26} textAnchor="middle" fontSize={17} fontWeight={600} fill="var(--fg)">
        Propan-1-ol hydrogen bonding with H₂O
      </text>

      <rect
        x={16}
        y={44}
        width={508}
        height={354}
        rx={12}
        fill="var(--surface-raised)"
        stroke="var(--border)"
      />

      <rect
        x={326}
        y={58}
        width={182}
        height={32}
        rx={8}
        fill="var(--accent-soft)"
        stroke="var(--accent)"
        strokeWidth={1.2}
      />
      <text x={417} y={79} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--accent)">
        3 H-bonds with H₂O
      </text>

      {/* Alkyl tail subtle highlight */}
      <rect
        x={28}
        y={180}
        width={186}
        height={58}
        rx={14}
        fill="var(--surface)"
        stroke="var(--border)"
        strokeDasharray="4 4"
      />
      <text x={121} y={262} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
        Propyl tail (nonpolar)
      </text>

      {/* CH3 - CH2 - CH2 - O - H */}
      <text x={54} y={214} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        CH₃
      </text>
      <line x1={74} y1={209} x2={96} y2={209} stroke="var(--fg)" strokeWidth={2.2} />
      <text x={118} y={214} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        CH₂
      </text>
      <line x1={138} y1={209} x2={160} y2={209} stroke="var(--fg)" strokeWidth={2.2} />
      <text x={182} y={214} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        CH₂
      </text>
      <line x1={202} y1={209} x2={240} y2={209} stroke="var(--fg)" strokeWidth={2.2} />

      {/* Hydroxyl oxygen and lone pairs */}
      <text x={256} y={214} textAnchor="middle" fontSize={18} fontWeight={700} fill="var(--atom-o)">
        O
      </text>
      <text x={236} y={186} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--delta-minus)">
        δ⁻
      </text>
      {/* Top lone pair */}
      <circle cx={263} cy={190} r={2.3} fill="var(--lone-pair-edge)" />
      <circle cx={270} cy={194} r={2.3} fill="var(--lone-pair-edge)" />
      {/* Right lone pair */}
      <circle cx={275} cy={205} r={2.3} fill="var(--lone-pair-edge)" />
      <circle cx={275} cy={213} r={2.3} fill="var(--lone-pair-edge)" />

      {/* Covalent O-H */}
      <line x1={264} y1={222} x2={290} y2={256} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
      <text x={298} y={272} textAnchor="middle" fontSize={17} fontWeight={700} fill="var(--fg)">
        H
      </text>
      <text x={274} y={276} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--delta-plus)">
        δ⁺
      </text>

      {/* H2O #1 (top-right, donates H to top lone pair) */}
      <line x1={275} y1={186} x2={316} y2={146} stroke="var(--accent)" strokeWidth={2.6} strokeDasharray="5 4" />
      <text x={324} y={142} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        H
      </text>
      <text x={304} y={136} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--delta-plus)">
        δ⁺
      </text>
      <line x1={336} y1={134} x2={366} y2={122} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
      <text x={378} y={122} textAnchor="middle" fontSize={17} fontWeight={700} fill="var(--atom-o)">
        O
      </text>
      <line x1={390} y1={122} x2={418} y2={138} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
      <text x={428} y={146} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        H
      </text>

      {/* H2O #2 (right, donates H to right lone pair) */}
      <line x1={284} y1={210} x2={354} y2={210} stroke="var(--accent)" strokeWidth={2.6} strokeDasharray="5 4" />
      <text x={368} y={215} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        H
      </text>
      <text x={368} y={193} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--delta-plus)">
        δ⁺
      </text>
      <line x1={380} y1={210} x2={410} y2={210} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
      <text x={424} y={215} textAnchor="middle" fontSize={17} fontWeight={700} fill="var(--atom-o)">
        O
      </text>
      <line x1={432} y1={224} x2={450} y2={252} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
      <text x={456} y={268} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        H
      </text>

      {/* H2O #3 (bottom, accepts H-bond from propan-1-ol O-H) */}
      <line x1={308} y1={276} x2={342} y2={316} stroke="var(--accent)" strokeWidth={2.6} strokeDasharray="5 4" />
      <text x={352} y={334} textAnchor="middle" fontSize={17} fontWeight={700} fill="var(--atom-o)">
        O
      </text>
      <text x={328} y={336} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--delta-minus)">
        δ⁻
      </text>
      <line x1={344} y1={342} x2={326} y2={366} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
      <text x={318} y={382} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        H
      </text>
      <line x1={360} y1={342} x2={378} y2={366} stroke="var(--fg)" strokeWidth={2.2} strokeLinecap="round" />
      <text x={386} y={382} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        H
      </text>

      <text x={W / 2} y={432} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
        Two water protons bind O lone pairs; the -OH proton binds a water oxygen.
      </text>
    </g>
  )
}

/** Step 2: Lower alcohols (methanol, ethanol) dissolve in all proportions. */
function MiscibleLowerAlcohols() {
  const cards = [
    {
      y0: 46,
      title: 'Methanol (CH₃OH)',
      tailText: 'CH₃',
      tailW: 54,
      badge: 'Miscible in all proportions',
      noteTop: 'Minimal',
      noteBottom: 'disruption',
    },
    {
      y0: 224,
      title: 'Ethanol (CH₃CH₂OH)',
      tailText: 'CH₃CH₂',
      tailW: 82,
      badge: 'Miscible in all proportions',
      noteTop: '-OH H-bonds',
      noteBottom: 'win easily',
    },
  ]

  return (
    <g>
      <text x={W / 2} y={26} textAnchor="middle" fontSize={17} fontWeight={600} fill="var(--fg)">
        Small alkyl tails: miscible in all proportions
      </text>

      {cards.map((card) => {
        const cy = card.y0 + 100
        const ohX = 56 + card.tailW + 26
        return (
          <g key={card.title}>
            <rect
              x={16}
              y={card.y0}
              width={508}
              height={162}
              rx={12}
              fill="var(--surface-raised)"
              stroke="var(--border)"
            />
            <text x={32} y={card.y0 + 28} fontSize={16} fontWeight={700} fill="var(--fg)">
              {card.title}
            </text>
            <rect
              x={298}
              y={card.y0 + 10}
              width={212}
              height={28}
              rx={8}
              fill="var(--success-soft)"
              stroke="var(--success)"
              strokeWidth={1.2}
            />
            <text x={404} y={card.y0 + 29} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--success)">
              {card.badge}
            </text>

            {/* Small alkyl pocket */}
            <rect
              x={36}
              y={cy - 22}
              width={card.tailW}
              height={44}
              rx={12}
              fill="var(--surface)"
              stroke="var(--border)"
              strokeDasharray="4 4"
            />
            <text x={36 + card.tailW / 2} y={cy + 5} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--fg)">
              {card.tailText}
            </text>
            <line x1={36 + card.tailW} y1={cy} x2={ohX - 18} y2={cy} stroke="var(--fg)" strokeWidth={2.2} />
            <text x={ohX} y={cy + 6} textAnchor="middle" fontSize={17} fontWeight={700} fill="var(--atom-o)">
              OH
            </text>

            {/* 3 H2O partners comfortably surrounding -OH */}
            <line x1={ohX + 12} y1={cy - 10} x2={244} y2={cy - 30} stroke="var(--accent)" strokeWidth={2.4} strokeDasharray="5 4" />
            <line x1={ohX + 18} y1={cy} x2={252} y2={cy} stroke="var(--accent)" strokeWidth={2.4} strokeDasharray="5 4" />
            <line x1={ohX + 12} y1={cy + 10} x2={244} y2={cy + 30} stroke="var(--accent)" strokeWidth={2.4} strokeDasharray="5 4" />

            <WaterPill cx={278} cy={cy - 32} />
            <WaterPill cx={284} cy={cy} />
            <WaterPill cx={278} cy={cy + 32} />

            {/* Outer connected water lattice */}
            <line x1={304} y1={cy - 38} x2={346} y2={cy - 24} stroke="var(--liquid-edge)" strokeWidth={1.8} strokeDasharray="4 4" />
            <line x1={310} y1={cy} x2={346} y2={cy - 14} stroke="var(--liquid-edge)" strokeWidth={1.8} strokeDasharray="4 4" />
            <line x1={304} y1={cy + 38} x2={346} y2={cy + 24} stroke="var(--liquid-edge)" strokeWidth={1.8} strokeDasharray="4 4" />
            <WaterPill cx={374} cy={cy - 20} />
            <WaterPill cx={374} cy={cy + 24} />

            <text x={412} y={cy + 2} fontSize={15} fill="var(--fg-muted)">
              {card.noteTop}
            </text>
            <text x={412} y={cy + 24} fontSize={15} fill="var(--fg-muted)">
              {card.noteBottom}
            </text>
          </g>
        )
      })}

      <text x={W / 2} y={428} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
        Small alkyl chains fit inside water&apos;s H-bonded network without disruption.
      </text>
    </g>
  )
}

/** Step 3: Larger hydrophobic butyl chain (butan-1-ol) and phenyl ring (phenol). */
function HydrophobicExclusion() {
  return (
    <g>
      <text x={W / 2} y={26} textAnchor="middle" fontSize={17} fontWeight={600} fill="var(--fg)">
        Bulky alkyl and aryl groups lower solubility
      </text>

      {/* Card 1: Butan-1-ol */}
      <rect
        x={16}
        y={46}
        width={508}
        height={162}
        rx={12}
        fill="var(--surface-raised)"
        stroke="var(--border)"
      />
      <text x={32} y={74} fontSize={16} fontWeight={700} fill="var(--fg)">
        Butan-1-ol (CH₃(CH₂)₃OH)
      </text>
      <rect
        x={322}
        y={56}
        width={186}
        height={28}
        rx={8}
        fill="var(--caution-soft)"
        stroke="var(--caution)"
        strokeWidth={1.2}
      />
      <text x={415} y={75} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--caution)">
        9 g per 100 mL water
      </text>

      {/* Large hydrophobic exclusion zone around butyl tail */}
      <rect
        x={32}
        y={104}
        width={230}
        height={64}
        rx={22}
        fill="var(--caution-soft)"
        stroke="var(--caution)"
        strokeWidth={1.6}
        strokeDasharray="6 4"
      />
      <text x={147} y={141} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        CH₃-CH₂-CH₂-CH₂
      </text>
      <text x={147} y={190} textAnchor="middle" fontSize={15} fill="var(--caution)">
        Water-excluding butyl region
      </text>

      <line x1={262} y1={136} x2={292} y2={136} stroke="var(--fg)" strokeWidth={2.2} />
      <text x={312} y={142} textAnchor="middle" fontSize={17} fontWeight={700} fill="var(--atom-o)">
        OH
      </text>
      <line x1={332} y1={130} x2={372} y2={114} stroke="var(--accent)" strokeWidth={2.4} strokeDasharray="5 4" />
      <line x1={332} y1={142} x2={372} y2={158} stroke="var(--accent)" strokeWidth={2.4} strokeDasharray="5 4" />
      <WaterPill cx={402} cy={112} />
      <WaterPill cx={402} cy={160} />
      <WaterPill cx={478} cy={136} muted />

      {/* Card 2: Phenol */}
      <rect
        x={16}
        y={224}
        width={508}
        height={162}
        rx={12}
        fill="var(--surface-raised)"
        stroke="var(--border)"
      />
      <text x={32} y={252} fontSize={16} fontWeight={700} fill="var(--fg)">
        Phenol (C₆H₅OH)
      </text>
      <rect
        x={340}
        y={234}
        width={168}
        height={28}
        rx={8}
        fill="var(--caution-soft)"
        stroke="var(--caution)"
        strokeWidth={1.2}
      />
      <text x={424} y={253} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--caution)">
        Limited solubility
      </text>

      {/* Wide hydrophobic aryl exclusion region */}
      <ellipse
        cx={146}
        cy={318}
        rx={98}
        ry={46}
        fill="var(--caution-soft)"
        stroke="var(--caution)"
        strokeWidth={1.6}
        strokeDasharray="6 4"
      />
      <BenzeneHex cx={146} cy={318} r={32} />
      <text x={146} y={376} textAnchor="middle" fontSize={15} fill="var(--caution)">
        Bulky hydrophobic aryl ring
      </text>

      <line x1={178} y1={318} x2={278} y2={318} stroke="var(--fg)" strokeWidth={2.2} />
      <text x={298} y={324} textAnchor="middle" fontSize={17} fontWeight={700} fill="var(--atom-o)">
        OH
      </text>
      <line x1={318} y1={312} x2={364} y2={294} stroke="var(--accent)" strokeWidth={2.4} strokeDasharray="5 4" />
      <line x1={318} y1={324} x2={364} y2={342} stroke="var(--accent)" strokeWidth={2.4} strokeDasharray="5 4" />
      <WaterPill cx={396} cy={292} />
      <WaterPill cx={396} cy={344} />
      <WaterPill cx={476} cy={318} muted />

      <text x={W / 2} y={428} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
        Growing hydrocarbon size pushes H₂O apart and cuts solubility sharply.
      </text>
    </g>
  )
}

export function AlcoholWaterSolubility({ step }: AlcoholWaterSolubilityProps) {
  const index = Math.min(Math.max(0, step), ALCOHOL_SOLUBILITY_STEP_COUNT - 1)
  let scene: ReactNode
  switch (index) {
    case 0:
      scene = <PropanolHydration />
      break
    case 1:
      scene = <MiscibleLowerAlcohols />
      break
    default:
      scene = <HydrophobicExclusion />
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={ALCOHOL_SOLUBILITY_STEP_TITLES[index]}>
      {scene}
    </svg>
  )
}
