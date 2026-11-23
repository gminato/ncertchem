'use client'

import {
  LonePairDots,
  StatusPill,
  SvgCard,
  SvgHeader,
  clampStep,
} from '../ether-svg-helpers'
import {
  ETHER_GEOMETRY,
  ETHER_PROPERTIES_STEPS,
  PROPERTIES_RECORDS,
} from './ether-properties-steps'

export interface EtherPropertiesScrollyProps {
  step: number
  reducedMotion: boolean
}

const W = 560
const H = 472

function StepDipoleNoSelfHBond() {
  // Bent C-O-C at 111.7 deg around O(260, 126)
  const ox = 248
  const oy = 124
  const halfAngleRad = ((ETHER_GEOMETRY.angleDeg / 2) * Math.PI) / 180
  const bondLen = 78
  const leftCx = ox - Math.sin(halfAngleRad) * bondLen
  const leftCy = oy + Math.cos(halfAngleRad) * bondLen
  const rightCx = ox + Math.sin(halfAngleRad) * bondLen
  const rightCy = oy + Math.cos(halfAngleRad) * bondLen

  return (
    <g>
      <SvgHeader
        width={W}
        title={ETHER_PROPERTIES_STEPS[0].title}
        subtitle={ETHER_PROPERTIES_STEPS[0].subtitle}
      />

      {/* Top bent geometry + dipoles card */}
      <SvgCard x={20} y={76} width={520} height={172} />

      {/* C-O bonds */}
      <line x1={leftCx + 14} y1={leftCy - 10} x2={ox - 10} y2={oy + 7} stroke="var(--fg)" strokeWidth={2.8} strokeLinecap="round" />
      <line x1={rightCx - 14} y1={rightCy - 10} x2={ox + 10} y2={oy + 7} stroke="var(--fg)" strokeWidth={2.8} strokeLinecap="round" />

      {/* Angle arc for 111.7 deg */}
      <path
        d={`M ${(ox - 24).toFixed(1)} ${(oy + 17).toFixed(1)} A 28 28 0 0 0 ${(ox + 24).toFixed(1)} ${(oy + 17).toFixed(1)}`}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={2}
      />
      <text x={ox} y={oy + 44} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--accent)">
        {`${ETHER_GEOMETRY.angleDeg}°`}
      </text>

      {/* Bond dipole arrows pointing C -> O */}
      <line x1={leftCx + 8} y1={leftCy - 24} x2={ox - 20} y2={oy - 6} stroke="var(--dipole)" strokeWidth={2} />
      <polygon points={`${ox - 20},${oy - 6} ${ox - 30},${oy - 4} ${ox - 25},${oy + 5}`} fill="var(--dipole)" />
      <line x1={rightCx - 8} y1={rightCy - 24} x2={ox + 20} y2={oy - 6} stroke="var(--dipole)" strokeWidth={2} />
      <polygon points={`${ox + 20},${oy - 6} ${ox + 30},${oy - 4} ${ox + 25},${oy + 5}`} fill="var(--dipole)" />

      {/* Oxygen and methyl labels */}
      <text x={ox} y={oy} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--atom-o)">
        O
      </text>
      <LonePairDots cx={ox} cy={oy} angleDeg={-120} radius={18} />
      <LonePairDots cx={ox} cy={oy} angleDeg={-60} radius={18} />
      <text x={ox + 28} y={oy - 22} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--delta-minus)">
        δ⁻
      </text>

      <text x={leftCx} y={leftCy} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        CH₃
      </text>
      <text x={leftCx - 30} y={leftCy} textAnchor="end" dominantBaseline="central" fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--delta-plus)">
        δ⁺
      </text>

      <text x={rightCx} y={rightCy} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        CH₃
      </text>
      <text x={rightCx + 30} y={rightCy} textAnchor="start" dominantBaseline="central" fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--delta-plus)">
        δ⁺
      </text>

      {/* Net dipole resultant */}
      <line x1={436} y1={202} x2={436} y2={116} stroke="var(--dipole)" strokeWidth={2.8} strokeLinecap="round" />
      <polygon points="436,106 429,118 443,118" fill="var(--dipole)" />
      <text x={436} y={222} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--dipole)">
        Net dipole &gt; 0
      </text>
      <text x={248} y={224} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        {`C–O bond: ${ETHER_GEOMETRY.coLengthPm} pm`}
      </text>

      {/* Pure ether vs Pure alcohol comparison */}
      <SvgCard x={20} y={262} width={250} height={146} tone="caution" />
      <text x={145} y={288} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--caution)">
        Pure Ether (R₂O)
      </text>
      <text x={82} y={326} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        R–O–R
      </text>
      <text x={145} y={326} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--caution)">
        ×
      </text>
      <text x={208} y={326} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        R–O–R
      </text>
      <text x={145} y={358} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        No hydrogen on oxygen
      </text>
      <text x={145} y={384} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--caution)">
        No self H-bonding
      </text>

      <SvgCard x={290} y={262} width={250} height={146} tone="success" />
      <text x={415} y={288} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--success)">
        Pure Alcohol (ROH)
      </text>
      <text x={346} y={326} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        R–O–H
      </text>
      <line x1={380} y1={321} x2={428} y2={321} stroke="var(--accent)" strokeWidth={2.6} strokeDasharray="5 4" />
      <text x={476} y={326} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        O(H)–R
      </text>
      <text x={415} y={358} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        Carries polar O–H group
      </text>
      <text x={415} y={384} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily="var(--success)">
        Strong O–H⋯O network
      </text>

      <StatusPill cx={W / 2} cy={440} width={450} tone="accent">
        Weak dipole-dipole forces → alkane-like boiling point
      </StatusPill>
    </g>
  )
}

function StepBoilingPointBars() {
  const chartX = 86
  const chartY = 92
  const chartW = 446
  const chartH = 228
  const maxK = 440
  const ticks = [0, 100, 200, 300, 400]
  const yOf = (bpK: number) => chartY + chartH - (bpK / maxK) * chartH
  const barCenters = [164, 310, 456]
  const barW = 58
  const barFills = ['var(--fg-muted)', 'var(--accent)', 'var(--success)']

  const etherY = yOf(307.6)
  const alcoholY = yOf(390)

  return (
    <g>
      <SvgHeader
        width={W}
        title={ETHER_PROPERTIES_STEPS[1].title}
        subtitle={ETHER_PROPERTIES_STEPS[1].subtitle}
      />

      {/* Chart background */}
      <rect
        x={chartX}
        y={chartY}
        width={chartW}
        height={chartH}
        rx={6}
        fill="var(--surface-raised)"
        fillOpacity={0.45}
        stroke="var(--border)"
        strokeWidth={1}
      />

      {/* Horizontal grid & y-axis ticks */}
      {ticks.map((t) => {
        const ty = yOf(t)
        return (
          <g key={t}>
            <line x1={chartX} y1={ty} x2={chartX + chartW} y2={ty} stroke="var(--border)" strokeWidth={1} />
            <text x={chartX - 10} y={ty} textAnchor="end" dominantBaseline="central" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
              {t}
            </text>
          </g>
        )
      })}

      {/* Y-axis title */}
      <text
        transform={`translate(26 ${chartY + chartH / 2}) rotate(-90)`}
        textAnchor="middle"
        fontSize={15}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill="var(--fg)"
      >
        Boiling point / K
      </text>

      {/* Axes */}
      <line x1={chartX} y1={chartY} x2={chartX} y2={chartY + chartH} stroke="var(--fg-muted)" strokeWidth={1.8} />
      <line x1={chartX} y1={chartY + chartH} x2={chartX + chartW} y2={chartY + chartH} stroke="var(--fg-muted)" strokeWidth={1.8} />

      {/* Dashed reference line from ethoxyethane bp across to alcohol column */}
      <line
        x1={barCenters[1]}
        y1={etherY}
        x2={barCenters[2] - 34}
        y2={etherY}
        stroke="var(--accent)"
        strokeWidth={1.6}
        strokeDasharray="5 4"
      />
      {/* Vertical gap indicator */}
      <line x1={386} y1={alcoholY} x2={386} y2={etherY} stroke="var(--success)" strokeWidth={2} />
      <line x1={380} y1={alcoholY} x2={392} y2={alcoholY} stroke="var(--success)" strokeWidth={2} />
      <line x1={380} y1={etherY} x2={392} y2={etherY} stroke="var(--success)" strokeWidth={2} />
      <text x={386} y={(alcoholY + etherY) / 2} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--success)" stroke="var(--surface)" strokeWidth={5} paintOrder="stroke">
        +82.4 K
      </text>

      {/* Bars */}
      {PROPERTIES_RECORDS.map((rec, i) => {
        const cx = barCenters[i]
        const top = yOf(rec.bpK)
        const h = chartY + chartH - top
        return (
          <g key={rec.id}>
            <rect
              x={cx - barW / 2}
              y={top}
              width={barW}
              height={h}
              rx={4}
              fill={barFills[i]}
              fillOpacity={0.85}
            />
            <text
              x={cx}
              y={top - 12}
              textAnchor="middle"
              fontSize={16}
              fontWeight={700}
              fontFamily="var(--font-sans)"
              fill="var(--fg)"
              stroke="var(--surface)"
              strokeWidth={4}
              paintOrder="stroke"
            >
              {`${rec.printedBp} K`}
            </text>
            <text x={cx} y={chartY + chartH + 22} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
              {rec.name}
            </text>
            <text x={cx} y={chartY + chartH + 46} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
              {rec.formula}
            </text>
          </g>
        )
      })}

      <StatusPill cx={W / 2} cy={436} width={456} tone="accent">
        {`1.5 K gap (alkane vs ether) vs +${ETHER_GEOMETRY.alcoholEtherBpGapK} K (alcohol)`}
      </StatusPill>
    </g>
  )
}

function MiniBeaker({
  cx,
  topY,
  title,
  value,
  note,
  mode,
}: {
  cx: number
  topY: number
  title: string
  value: string
  note: string
  mode: 'immiscible' | 'ether' | 'alcohol'
}) {
  const bx = cx - 32
  const by = topY + 26
  const bw = 64
  const bh = 68
  return (
    <g>
      <text x={cx} y={topY + 12} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        {title}
      </text>
      {/* Glass beaker */}
      <rect x={bx} y={by} width={bw} height={bh} rx={6} fill="var(--glass-fill)" stroke="var(--glass-wall)" strokeWidth={1.8} />
      {mode === 'immiscible' ? (
        <>
          <rect x={bx + 2} y={by + 12} width={bw - 4} height={20} fill="var(--caution-soft)" stroke="var(--caution)" strokeWidth={1.2} />
          <rect x={bx + 2} y={by + 32} width={bw - 4} height={34} rx={4} fill="var(--liquid)" />
        </>
      ) : (
        <rect
          x={bx + 2}
          y={by + 14}
          width={bw - 4}
          height={52}
          rx={4}
          fill={mode === 'ether' ? 'var(--accent-soft)' : 'var(--success-soft)'}
          stroke={mode === 'ether' ? 'var(--accent)' : 'var(--success)'}
          strokeWidth={1.2}
        />
      )}
      <text x={cx} y={by + bh + 20} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill={mode === 'immiscible' ? 'var(--caution)' : mode === 'ether' ? 'var(--accent)' : 'var(--success)'}>
        {value}
      </text>
      <text x={cx} y={by + bh + 42} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        {note}
      </text>
    </g>
  )
}

function StepWaterMiscibility() {
  return (
    <g>
      <SvgHeader
        width={W}
        title={ETHER_PROPERTIES_STEPS[2].title}
        subtitle={ETHER_PROPERTIES_STEPS[2].subtitle}
      />

      {/* Top H-bond diagram: R-O-R accepting H-bond from H2O (NCERT p. 217) */}
      <SvgCard x={20} y={76} width={520} height={144} tone="accent" />

      <text x={118} y={118} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        C₂H₅
      </text>
      <line x1={144} y1={124} x2={178} y2={140} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />

      <text x={118} y={176} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        C₂H₅
      </text>
      <line x1={144} y1={168} x2={178} y2={152} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />

      <text x={194} y={146} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--atom-o)">
        O
      </text>
      <LonePairDots cx={194} cy={146} angleDeg={0} radius={18} />
      <LonePairDots cx={194} cy={146} angleDeg={-85} radius={18} />

      {/* Dashed H-bond to water H */}
      <line x1={218} y1={146} x2={292} y2={146} stroke="var(--accent)" strokeWidth={2.6} strokeDasharray="6 4" />
      <text x={255} y={128} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--accent)">
        H-bond
      </text>

      {/* Water molecule H-O-H */}
      <text x={308} y={146} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        H
      </text>
      <text x={308} y={170} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--delta-plus)">
        δ⁺
      </text>
      <line x1={320} y1={146} x2={358} y2={158} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />
      <text x={374} y={162} textAnchor="middle" dominantBaseline="central" fontSize={19} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--atom-o)">
        O
      </text>
      <text x={374} y={188} textAnchor="middle" fontSize={15} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--delta-minus)">
        δ⁻
      </text>
      <line x1={388} y1={154} x2={420} y2={136} stroke="var(--fg)" strokeWidth={2.4} strokeLinecap="round" />
      <text x={436} y={132} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
        H
      </text>
      <text x={464} y={162} textAnchor="start" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        (H₂O)
      </text>

      {/* Three miscibility beakers */}
      <SvgCard x={20} y={232} width={164} height={176} tone="caution" />
      <MiniBeaker cx={102} topY={240} title="n-Pentane" value="Immiscible" note="No O atom" mode="immiscible" />

      <SvgCard x={198} y={232} width={164} height={176} tone="accent" />
      <MiniBeaker cx={280} topY={240} title="Ethoxyethane" value="7.5 g / 100 mL" note="Accepts H-bond" mode="ether" />

      <SvgCard x={376} y={232} width={164} height={176} tone="success" />
      <MiniBeaker cx={458} topY={240} title="Butan-1-ol" value="9 g / 100 mL" note="Donor &amp; acceptor" mode="alcohol" />

      <StatusPill cx={W / 2} cy={440} width={446} tone="success">
        Lower ethers show alcohol-like miscibility in water
      </StatusPill>
    </g>
  )
}

export function EtherPropertiesScrolly({ step }: EtherPropertiesScrollyProps) {
  const index = clampStep(step, ETHER_PROPERTIES_STEPS.length)
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={`Physical properties of ethers: ${ETHER_PROPERTIES_STEPS[index].title}`}
      data-step={index}
      style={{ display: 'block', width: '100%', height: 'auto' }}
    >
      {index === 0 ? (
        <StepDipoleNoSelfHBond />
      ) : index === 1 ? (
        <StepBoilingPointBars />
      ) : (
        <StepWaterMiscibility />
      )}
    </svg>
  )
}
