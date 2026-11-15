'use client'

import React, { useMemo } from 'react'
import katex from 'katex'
import 'katex/contrib/mhchem'
import { ElectronTransfer } from '@/components/redox/ElectronTransfer'
import { useStepTween } from '@/components/animations/unit4/vbt/useStepTween'
import { transferStep, TRANSFER_STEP_COUNT } from './transfer-steps'
import styles from './RedoxElectronTransfer.module.css'

/** Renders one mhchem reaction with KaTeX. The strings come from the tested step data. */
function Ce({ mhchem }: { mhchem: string }) {
  const html = useMemo(() => katex.renderToString(`\\ce{${mhchem}}`, { throwOnError: false }), [mhchem])
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

export interface RedoxElectronTransferProps {
  step: number
  reducedMotion: boolean
}

/**
 * RedoxElectronTransfer Scrolly Animation for Section 7.2.
 *
 * Shows redox in terms of electron transfer:
 * - Neutral Na and Cl atoms facing off
 * - Valence electron leap across the flight trajectory
 * - Na+ and Cl- octet ion formation
 * - Splitting into oxidation and reduction half-reactions
 * - Identifying oxidant (electron acceptor) and reductant (electron donor)
 *
 * ViewBox: 580 × 430.
 */
export function RedoxElectronTransfer({ step, reducedMotion }: RedoxElectronTransferProps) {
  const index = Math.min(TRANSFER_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const data = transferStep(index)

  // Tween progress smoothly between steps
  const { p } = useStepTween({ p: data.progress }, reducedMotion, 0.75)

  const isHalfReactions = index === 3
  const isAgentRoles = index === 4
  const oxHalf = data.oxHalfMhchem ?? ''
  const redHalf = data.redHalfMhchem ?? ''
  const overall = data.overallMhchem ?? ''

  return (
    <svg
      viewBox="0 0 580 430"
      role="img"
      aria-label={`Electron Transfer Animation: ${data.title}. ${data.conceptDetail}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-step={index}
      data-testid="redox-electron-transfer-svg"
    >
      {/* Background container */}
      <rect
        x={8}
        y={8}
        width={564}
        height={414}
        rx={14}
        fill="var(--surface)"
        stroke="var(--border)"
        strokeWidth={1.2}
      />

      {/* Top Header Row */}
      <g transform="translate(24, 24)">
        {/* Step Badge */}
        <rect
          x={0}
          y={0}
          width={96}
          height={26}
          rx={13}
          fill="var(--surface-raised)"
          stroke="var(--border)"
          strokeWidth={1}
        />
        <text
          x={48}
          y={14}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={12}
          fontWeight={600}
          fontFamily="var(--font-sans)"
          fill="var(--fg-muted)"
          style={{ userSelect: 'none' }}
        >
          {data.stageNumber}
        </text>

        {/* Step Title */}
        <text
          x={112}
          y={14}
          dominantBaseline="central"
          fontSize={16}
          fontWeight={700}
          fontFamily="var(--font-sans)"
          fill="var(--fg)"
        >
          {data.title}
        </text>
      </g>

      {!isHalfReactions && !isAgentRoles ? (
        /* Steps 0, 1, 2: Interactive Electron Transfer Visual */
        <g>
          {/* Main Electron Transfer Component Stage */}
          <g transform="translate(290, 160) scale(1.25)">
            <ElectronTransfer
              donor={{
                symbol: 'Na',
                initialCharge: '',
                finalCharge: '+',
                radius: 40,
              }}
              acceptor={{
                symbol: 'Cl',
                initialCharge: '',
                finalCharge: '−',
                radius: 40,
              }}
              electrons={1}
              progress={p}
              particleDistance={220}
              showFlightArc={true}
              donorCaption={
                <>
                  <tspan x={0} dy={0} fontSize={16} fontWeight={600} fill={p > 0.1 ? 'var(--ox)' : 'var(--fg-muted)'}>
                    {p >= 0.8 ? 'Na⁺ (2, 8)' : 'Na atom (2, 8, 1)'}
                  </tspan>
                  <tspan x={0} dy={21} fontSize={14} fontWeight={500} fill="var(--fg-muted)">
                    {p >= 0.8 ? '[Ne] octet' : 'Low ionisation enthalpy'}
                  </tspan>
                </>
              }
              acceptorCaption={
                <>
                  <tspan x={0} dy={0} fontSize={16} fontWeight={600} fill={p >= 0.7 ? 'var(--red)' : 'var(--fg-muted)'}>
                    {p >= 0.8 ? 'Cl⁻ (2, 8, 8)' : 'Cl atom (2, 8, 7)'}
                  </tspan>
                  <tspan x={0} dy={21} fontSize={14} fontWeight={500} fill="var(--fg-muted)">
                    {p >= 0.8 ? '[Ar] octet' : 'High electron affinity'}
                  </tspan>
                </>
              }
            />
          </g>

          {/* Bottom Narrative / Insight Box */}
          <g transform="translate(24, 284)">
            <rect
              x={0}
              y={0}
              width={532}
              height={130}
              rx={10}
              fill="var(--surface-raised)"
              stroke="var(--border)"
              strokeWidth={1.2}
            />

            <g transform="translate(20, 16)">
              {/* Pillar Label */}
              <text
                x={0}
                y={10}
                fontSize={12}
                fontWeight={700}
                fill="var(--fg-subtle)"
                fontFamily="var(--font-sans)"
                style={{ letterSpacing: '0.04em' }}
              >
                KEY MECHANISM
              </text>
              <text
                x={0}
                y={32}
                fontSize={15}
                fontWeight={700}
                fill="var(--fg)"
                fontFamily="var(--font-sans)"
              >
                {data.conceptTitle}
              </text>
              {/* Wrapped detail text, so long sentences never run past the card */}
              <foreignObject x={0} y={38} width={492} height={46}>
                <div className={styles.detail}>{data.conceptDetail}</div>
              </foreignObject>

              {/* Status indicators */}
              <g transform="translate(0, 96)">
                <circle cx={6} cy={0} r={4} fill={p >= 0.2 ? 'var(--ox)' : 'var(--border)'} />
                <text x={16} y={4} fontSize={12} fontWeight={600} fill="var(--fg)" fontFamily="var(--font-sans)">
                  {p < 0.2
                    ? 'Reactants: Neutral atoms'
                    : p < 0.8
                      ? 'In transit: Single valence electron transferring'
                      : 'Product: Electrostatic ion pair Na⁺Cl⁻'}
                </text>
              </g>
            </g>
          </g>
        </g>
      ) : isHalfReactions ? (
        /* Step 3: Splitting into Half-Reactions */
        <g transform="translate(24, 62)">
          {/* Main Card */}
          <rect
            x={0}
            y={0}
            width={532}
            height={344}
            rx={10}
            fill="var(--surface-raised)"
            stroke="var(--border)"
            strokeWidth={1.2}
          />

          {/* Header */}
          <text x={24} y={30} fontSize={14} fontWeight={700} fill="var(--fg)" fontFamily="var(--font-sans)">
            Two Simultaneous Half-Equations
          </text>
          <text x={24} y={48} fontSize={12} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
            Loss of electrons must exactly equal gain of electrons.
          </text>

          {/* Oxidation half */}
          <g transform="translate(20, 64)">
            <rect x={0} y={0} width={492} height={80} rx={8} fill="var(--surface)" stroke="var(--ox)" strokeWidth={1.6} />
            <rect x={14} y={12} width={150} height={22} rx={4} fill="var(--ox)" />
            <text x={89} y={23} textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700} fill="#ffffff" fontFamily="var(--font-sans)">
              OXIDATION HALF
            </text>
            <text x={176} y={23} dominantBaseline="central" fontSize={14} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
              Loss of 2 electrons
            </text>
            <foreignObject x={16} y={38} width={460} height={40}>
              <div className={styles.halfEq}>
                <Ce mhchem={oxHalf} />
              </div>
            </foreignObject>
          </g>

          {/* Reduction half */}
          <g transform="translate(20, 154)">
            <rect x={0} y={0} width={492} height={80} rx={8} fill="var(--surface)" stroke="var(--red)" strokeWidth={1.6} />
            <rect x={14} y={12} width={150} height={22} rx={4} fill="var(--red)" />
            <text x={89} y={23} textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700} fill="#ffffff" fontFamily="var(--font-sans)">
              REDUCTION HALF
            </text>
            <text x={176} y={23} dominantBaseline="central" fontSize={14} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
              Gain of 2 electrons
            </text>
            <foreignObject x={16} y={38} width={460} height={40}>
              <div className={styles.halfEq}>
                <Ce mhchem={redHalf} />
              </div>
            </foreignObject>
          </g>

          {/* Overall equation */}
          <g transform="translate(20, 244)">
            <rect x={0} y={0} width={492} height={82} rx={8} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.4} />
            <text x={16} y={24} fontSize={12} fontWeight={700} fill="var(--fg-subtle)" fontFamily="var(--font-sans)">
              OVERALL REDOX REACTION (ELECTRONS CANCEL)
            </text>
            <foreignObject x={16} y={32} width={460} height={46}>
              <div className={styles.halfEq}>
                <Ce mhchem={overall} />
              </div>
            </foreignObject>
          </g>
        </g>
      ) : (
        /* Step 4: Oxidant and Reductant Identification */
        <g transform="translate(24, 62)">
          {/* Main Card */}
          <rect
            x={0}
            y={0}
            width={532}
            height={344}
            rx={10}
            fill="var(--surface-raised)"
            stroke="var(--border)"
            strokeWidth={1.2}
          />

          {/* Two Large Side-by-Side Role Cards */}
          {/* Left: Reducing Agent */}
          <g transform="translate(20, 20)">
            <rect x={0} y={0} width={236} height={216} rx={10} fill="var(--surface)" stroke="var(--ox)" strokeWidth={2} />
            <rect x={14} y={14} width={136} height={24} rx={5} fill="var(--ox)" />
            <text x={82} y={26} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700} fill="#ffffff" fontFamily="var(--font-sans)">
              REDUCING AGENT
            </text>

            <text x={14} y={64} fontSize={17} fontWeight={700} fill="var(--fg)" fontFamily="var(--font-sans)">
              Sodium, Na(s)
            </text>

            <g transform="translate(14, 82)">
              <text x={0} y={12} fontSize={12} fontWeight={600} fill="var(--ox)" fontFamily="var(--font-sans)">
                What it does:
              </text>
              <text x={0} y={30} fontSize={12} fill="var(--fg)" fontFamily="var(--font-sans)">
                • Donates electrons to Cl₂
              </text>
              <text x={0} y={48} fontSize={12} fill="var(--fg)" fontFamily="var(--font-sans)">
                • Reduces its partner
              </text>
              <text x={0} y={66} fontSize={12} fill="var(--fg)" fontFamily="var(--font-sans)">
                • Is itself oxidised to Na⁺
              </text>
              <text x={0} y={92} fontSize={11.5} fontWeight={600} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
                Role: Electron Donor
              </text>
            </g>
          </g>

          {/* Right: Oxidising Agent */}
          <g transform="translate(276, 20)">
            <rect x={0} y={0} width={236} height={216} rx={10} fill="var(--surface)" stroke="var(--red)" strokeWidth={2} />
            <rect x={14} y={14} width={136} height={24} rx={5} fill="var(--red)" />
            <text x={82} y={26} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700} fill="#ffffff" fontFamily="var(--font-sans)">
              OXIDISING AGENT
            </text>

            <text x={14} y={64} fontSize={17} fontWeight={700} fill="var(--fg)" fontFamily="var(--font-sans)">
              Chlorine, Cl₂(g)
            </text>

            <g transform="translate(14, 82)">
              <text x={0} y={12} fontSize={12} fontWeight={600} fill="var(--red)" fontFamily="var(--font-sans)">
                What it does:
              </text>
              <text x={0} y={30} fontSize={12} fill="var(--fg)" fontFamily="var(--font-sans)">
                • Accepts electrons from Na
              </text>
              <text x={0} y={48} fontSize={12} fill="var(--fg)" fontFamily="var(--font-sans)">
                • Oxidises its partner
              </text>
              <text x={0} y={66} fontSize={12} fill="var(--fg)" fontFamily="var(--font-sans)">
                • Is itself reduced to Cl⁻
              </text>
              <text x={0} y={92} fontSize={11.5} fontWeight={600} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
                Role: Electron Acceptor
              </text>
            </g>
          </g>

          {/* Bottom Mnemonic Pill Banner */}
          <g transform="translate(20, 252)">
            <rect x={0} y={0} width={492} height={72} rx={8} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.2} />
            <text x={20} y={26} fontSize={14} fontWeight={700} fill="var(--fg)" fontFamily="var(--font-sans)">
              Remember: OIL RIG
            </text>
            <text x={20} y={48} fontSize={12.5} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
              <tspan fontWeight={700} fill="var(--ox)">Oxidation Is Loss</tspan> of electrons;{' '}
              <tspan fontWeight={700} fill="var(--red)">Reduction Is Gain</tspan> of electrons.
            </text>
          </g>
        </g>
      )}
    </svg>
  )
}
