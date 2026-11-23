'use client'

import { useId } from 'react'
import { cftLimitationsStepState } from './cft-limitations-steps'

export interface CftLimitationsProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

const W = 560
const H = 440
const FG = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const SURFACE = 'var(--surface)'

function SplittingChart({
  x,
  y,
  title,
  clHeight,
  h2oHeight,
  transition,
}: {
  x: number
  y: number
  title: string
  clHeight: number
  h2oHeight: number
  transition: string
}) {
  const chartW = 220
  const baseY = y + 176
  const barW = 54
  return (
    <g>
      <rect x={x} y={y} width={chartW} height={224} rx={12} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.5} />
      <text x={x + chartW / 2} y={y + 28} textAnchor="middle" fontSize={16} fontWeight={700} fill={FG}>
        {title}
      </text>
      {/* Baseline */}
      <line x1={x + 22} y1={baseY} x2={x + chartW - 22} y2={baseY} stroke={MUTED} strokeWidth={2} />
      {/* Cl- bar */}
      <rect
        x={x + 38}
        y={baseY - clHeight}
        width={barW}
        height={clHeight}
        rx={6}
        fill="var(--el-Cl)"
        style={{ transition }}
      />
      <text x={x + 38 + barW / 2} y={baseY + 24} textAnchor="middle" fontSize={16} fontWeight={600} fill={FG}>
        Cl⁻
      </text>
      {/* H2O bar */}
      <rect
        x={x + 128}
        y={baseY - h2oHeight}
        width={barW}
        height={h2oHeight}
        rx={6}
        fill="var(--spec-blue)"
        style={{ transition }}
      />
      <text x={x + 128 + barW / 2} y={baseY + 24} textAnchor="middle" fontSize={16} fontWeight={600} fill={FG}>
        H₂O
      </text>
    </g>
  )
}

/**
 * Section 5.5.6 Scrolly 3: Two honest limitations of Crystal Field Theory
 * (point-charge prediction vs observed spectrochemical series, and omitted covalent
 * orbital overlap) and how LFT and MOT resolve them.
 */
export function CftLimitations({ step, reducedMotion }: CftLimitationsProps) {
  const uid = useId().replace(/:/g, '')
  const arrowId = `cft-lim-arr-${uid}`
  const s = cftLimitationsStepState(step)
  const tr = reducedMotion ? 'none' : 'all 420ms cubic-bezier(0.22, 1, 0.36, 1)'

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={s.ariaLabel}>
      <defs>
        <marker id={arrowId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0 L10 5 L0 10 Z" fill="var(--success)" />
        </marker>
      </defs>

      {/* Step 0: Point-charge model + predicted splitting bar chart */}
      {s.kind === 'prediction' && (
        <g>
          <text x={W / 2} y={34} textAnchor="middle" fontSize={18} fontWeight={700} fill={FG}>
            Limitation 1: Point-charge prediction
          </text>

          {/* Left side: M ion and two ligands with charges */}
          <g>
            <circle cx={216} cy={184} r={28} fill="var(--accent)" fillOpacity={0.22} stroke="var(--accent)" strokeWidth={2.5} />
            <text x={216} y={190} textAnchor="middle" fontSize={17} fontWeight={700} fill={FG}>
              Mⁿ⁺
            </text>

            {/* Cl- with big minus sign */}
            <circle cx={76} cy={130} r={26} fill="var(--el-Cl)" fillOpacity={0.25} stroke="var(--el-Cl)" strokeWidth={2.5} />
            <text x={76} y={136} textAnchor="middle" fontSize={17} fontWeight={700} fill={FG}>
              Cl⁻
            </text>
            <text x={76} y={96} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--proton)">
              Full -1 charge
            </text>
            <line x1={106} y1={142} x2={184} y2={172} stroke={MUTED} strokeWidth={2} strokeDasharray="5 4" />

            {/* H2O with small partial charge */}
            <circle cx={76} cy={246} r={24} fill="var(--spec-blue)" fillOpacity={0.22} stroke="var(--spec-blue)" strokeWidth={2.2} />
            <text x={76} y={252} textAnchor="middle" fontSize={17} fontWeight={700} fill={FG}>
              H₂O
            </text>
            <text x={76} y={292} textAnchor="middle" fontSize={16} fill={MUTED}>
              Neutral (δ-)
            </text>
            <line x1={104} y1={234} x2={184} y2={196} stroke={MUTED} strokeWidth={2} strokeDasharray="5 4" />
          </g>

          {/* Right side: Predicted chart */}
          <SplittingChart x={312} y={76} title="Predicted by CFT" clHeight={116} h2oHeight={52} transition={tr} />

          <text x={W / 2} y={366} textAnchor="middle" fontSize={16} fill={FG}>
            Point charges predict Cl⁻ should repel d electrons harder than H₂O.
          </text>
        </g>
      )}

      {/* Step 1: Predicted vs Observed bar charts with mismatch cross */}
      {s.kind === 'measurement' && (
        <g>
          <text x={W / 2} y={34} textAnchor="middle" fontSize={18} fontWeight={700} fill={FG}>
            Experiment reverses the order
          </text>

          <SplittingChart x={24} y={68} title="Predicted (charges)" clHeight={116} h2oHeight={52} transition={tr} />
          <SplittingChart x={316} y={68} title="Observed (series)" clHeight={48} h2oHeight={114} transition={tr} />

          {/* Red mismatch cross between the two charts */}
          <g>
            <circle cx={280} cy={180} r={22} fill="var(--surface-raised)" stroke="var(--proton)" strokeWidth={2.5} />
            <line x1={270} y1={170} x2={290} y2={190} stroke="var(--proton)" strokeWidth={3.5} strokeLinecap="round" />
            <line x1={290} y1={170} x2={270} y2={190} stroke="var(--proton)" strokeWidth={3.5} strokeLinecap="round" />
          </g>

          <text x={W / 2} y={346} textAnchor="middle" fontSize={16} fontWeight={600} fill={FG}>
            Anionic ligands (Cl⁻, OH⁻) sit at the weak-field end.
          </text>
          <text x={W / 2} y={374} textAnchor="middle" fontSize={16} fill={MUTED}>
            Pure point charges cannot explain the spectrochemical series.
          </text>
        </g>
      )}

      {/* Steps 2 & 3: Metal d orbital + ligand orbital covalent overlap */}
      {(s.kind === 'covalency' || s.kind === 'way-forward') && (
        <g>
          <text x={W / 2} y={32} textAnchor="middle" fontSize={18} fontWeight={700} fill={FG}>
            {s.kind === 'covalency'
              ? 'Limitation 2: Covalent orbital overlap is ignored'
              : 'The way forward: LFT and MOT'}
          </text>

          {/* Orbital overlap diagram */}
          <g transform={`translate(0, ${s.kind === 'way-forward' ? -18 : 24})`} style={{ transition: tr }}>
            {/* Metal d orbital (4 lobes) around (188, 170) */}
            <ellipse cx={188} cy={112} rx={22} ry={42} fill="var(--orbital-neg)" fillOpacity={0.42} stroke="var(--orbital-neg)" strokeWidth={2} />
            <ellipse cx={188} cy={228} rx={22} ry={42} fill="var(--orbital-neg)" fillOpacity={0.42} stroke="var(--orbital-neg)" strokeWidth={2} />
            <ellipse cx={128} cy={170} rx={44} ry={22} fill="var(--orbital-pos)" fillOpacity={0.42} stroke="var(--orbital-pos)" strokeWidth={2} />
            <ellipse cx={248} cy={170} rx={44} ry={22} fill="var(--orbital-pos)" fillOpacity={0.45} stroke="var(--orbital-pos)" strokeWidth={2} />

            {/* Ligand donor orbital lobe around (346, 170) overlapping metal right lobe */}
            <ellipse cx={306} cy={170} rx={46} ry={24} fill="var(--orbital-pos)" fillOpacity={0.42} stroke="var(--orbital-pos)" strokeWidth={2} />
            <ellipse cx={392} cy={170} rx={30} ry={18} fill="var(--orbital-neg)" fillOpacity={0.35} stroke="var(--orbital-neg)" strokeWidth={2} />

            {/* Highlighted shared covalent overlap region */}
            <ellipse
              cx={276}
              cy={170}
              rx={20}
              ry={16}
              fill="var(--highlight)"
              stroke={FG}
              strokeWidth={2}
              strokeDasharray="4 3"
            />

            {/* Nuclei */}
            <circle cx={188} cy={170} r={16} fill="var(--surface)" stroke={FG} strokeWidth={2.2} />
            <text x={188} y={176} textAnchor="middle" fontSize={17} fontWeight={700} fill={FG}>
              M
            </text>
            <circle cx={354} cy={170} r={16} fill="var(--surface)" stroke={FG} strokeWidth={2.2} />
            <text x={354} y={176} textAnchor="middle" fontSize={17} fontWeight={700} fill={FG}>
              L
            </text>

            {/* Labels */}
            <text x={106} y={100} textAnchor="middle" fontSize={16} fill={MUTED}>
              Metal d orbital
            </text>
            <text x={442} y={128} textAnchor="middle" fontSize={16} fill={MUTED}>
              Ligand orbital
            </text>
            <text x={286} y={128} textAnchor="middle" fontSize={16} fontWeight={700} fill={FG}>
              Shared cloud
            </text>
          </g>

          {s.kind === 'covalency' && (
            <g>
              <text x={W / 2} y={348} textAnchor="middle" fontSize={16} fontWeight={600} fill={FG}>
                Real metal to ligand bonds have covalent character.
              </text>
              <text x={W / 2} y={376} textAnchor="middle" fontSize={16} fill={MUTED}>
                CFT treats the bond as purely electrostatic and leaves this overlap out.
              </text>
            </g>
          )}

          {s.kind === 'way-forward' && (
            <g>
              {/* Arrows pointing from LFT and MOT boxes up to the shared overlap */}
              <line x1={154} y1={276} x2={260} y2={212} stroke="var(--success)" strokeWidth={2.5} markerEnd={`url(#${arrowId})`} />
              <line x1={406} y1={276} x2={292} y2={212} stroke="var(--success)" strokeWidth={2.5} markerEnd={`url(#${arrowId})`} />

              {/* Box 1: Ligand Field Theory */}
              <rect x={24} y={280} width={246} height={96} rx={12} fill="var(--surface-raised)" stroke="var(--success)" strokeWidth={2} />
              <text x={147} y={308} textAnchor="middle" fontSize={17} fontWeight={700} fill={FG}>
                Ligand Field Theory
              </text>
              <text x={42} y={336} fontSize={16} fontWeight={700} fill="var(--success)">
                ✓
              </text>
              <text x={62} y={336} fontSize={16} fill={FG}>
                Spectrochemical order
              </text>
              <text x={42} y={362} fontSize={16} fontWeight={700} fill="var(--success)">
                ✓
              </text>
              <text x={62} y={362} fontSize={16} fill={FG}>
                Covalent overlap
              </text>

              {/* Box 2: Molecular Orbital Theory */}
              <rect x={290} y={280} width={246} height={96} rx={12} fill="var(--surface-raised)" stroke="var(--success)" strokeWidth={2} />
              <text x={413} y={308} textAnchor="middle" fontSize={17} fontWeight={700} fill={FG}>
                Molecular Orbital Theory
              </text>
              <text x={308} y={336} fontSize={16} fontWeight={700} fill="var(--success)">
                ✓
              </text>
              <text x={328} y={336} fontSize={16} fill={FG}>
                Spectrochemical order
              </text>
              <text x={308} y={362} fontSize={16} fontWeight={700} fill="var(--success)">
                ✓
              </text>
              <text x={328} y={362} fontSize={16} fill={FG}>
                Covalent overlap
              </text>

              <text x={W / 2} y={416} textAnchor="middle" fontSize={16} fill={MUTED}>
                Both theories bring orbital overlap back in (beyond this course).
              </text>
            </g>
          )}
        </g>
      )}
    </svg>
  )
}
