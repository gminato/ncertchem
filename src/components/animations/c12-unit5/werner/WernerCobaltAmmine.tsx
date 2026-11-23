'use client'

import {
  wernerStepState,
  type ComplexStepData,
  type ConductivityStepData,
  type IsomersStepData,
  type LigandKind,
} from './werner-steps'

export interface WernerCobaltAmmineProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

const W = 560
const H = 480

const FG = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const SURFACE = 'var(--surface)'
const BORDER = 'var(--border)'
const BOND = 'var(--bond)'
const N_TONE = 'var(--el-N)'
const CL_TONE = 'var(--el-Cl)'
const CO_TONE = 'var(--accent)'
const AGCL_BG = 'var(--agcl-white)'

const COMPOUND_SWATCH: Record<string, string> = {
  Yellow: '#D9A006',
  Purple: '#9333EA',
  Green: '#16A34A',
  Violet: '#7C3AED',
}

/** Six regular-hexagon / octahedral-projection angles in degrees: top, TR, BR, bottom, BL, TL. */
const SITE_ANGLES_DEG = [-90, -30, 30, 90, 150, -150] as const

function sitePoint(cx: number, cy: number, radius: number, index: number): { x: number; y: number } {
  const rad = (SITE_ANGLES_DEG[index] * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  }
}

function LigandNode({
  x,
  y,
  kind,
  compact = false,
}: {
  x: number
  y: number
  kind: LigandKind
  compact?: boolean
}) {
  const isCl = kind === 'Cl'
  const tone = isCl ? CL_TONE : N_TONE
  const pillW = isCl ? (compact ? 38 : 42) : compact ? 44 : 48
  const pillH = compact ? 26 : 28
  return (
    <g>
      <rect
        x={x - pillW / 2}
        y={y - pillH / 2}
        width={pillW}
        height={pillH}
        rx={pillH / 2}
        fill={SURFACE}
        stroke={tone}
        strokeWidth={2.2}
      />
      <rect
        x={x - pillW / 2}
        y={y - pillH / 2}
        width={pillW}
        height={pillH}
        rx={pillH / 2}
        fill={tone}
        fillOpacity={0.18}
        stroke="none"
      />
      <text
        x={x}
        y={y + 5}
        textAnchor="middle"
        fontSize={15}
        fontWeight={600}
        fill={FG}
      >
        {isCl ? 'Cl⁻' : 'NH₃'}
      </text>
    </g>
  )
}

function OctahedralRing({
  cx,
  cy,
  ringR,
  ligandR,
  sites,
  swatch,
  compact = false,
  highlightPair,
}: {
  cx: number
  cy: number
  ringR: number
  ligandR: number
  sites: readonly LigandKind[]
  swatch: string
  compact?: boolean
  highlightPair?: { a: number; b: number; label: string }
}) {
  const pts = sites.map((_, i) => sitePoint(cx, cy, ligandR, i))
  const eqPts = [pts[1], pts[2], pts[4], pts[5]]
  const eqPath = `M ${eqPts[0].x.toFixed(1)} ${eqPts[0].y.toFixed(1)} L ${eqPts[1].x.toFixed(1)} ${eqPts[1].y.toFixed(1)} L ${eqPts[2].x.toFixed(1)} ${eqPts[2].y.toFixed(1)} L ${eqPts[3].x.toFixed(1)} ${eqPts[3].y.toFixed(1)} Z`

  return (
    <g>
      {/* Coordination sphere ring */}
      <circle
        cx={cx}
        cy={cy}
        r={ringR}
        fill={swatch}
        fillOpacity={0.07}
        stroke={swatch}
        strokeOpacity={0.55}
        strokeWidth={2}
        strokeDasharray="6 5"
      />
      {/* Equatorial octahedral outline */}
      <path d={eqPath} fill="none" stroke={BORDER} strokeWidth={1.5} />

      {/* Highlight connector between two Cl ligands in isomer comparison */}
      {highlightPair && (
        <line
          x1={pts[highlightPair.a].x}
          y1={pts[highlightPair.a].y}
          x2={pts[highlightPair.b].x}
          y2={pts[highlightPair.b].y}
          stroke={CL_TONE}
          strokeWidth={2.4}
          strokeDasharray="4 3"
          opacity={0.7}
        />
      )}

      {/* Solid secondary-valence bonds from Co to all 6 ligands */}
      {pts.map((p, i) => (
        <line
          key={`bond-${i}`}
          x1={cx}
          y1={cy}
          x2={p.x}
          y2={p.y}
          stroke={sites[i] === 'Cl' ? CL_TONE : BOND}
          strokeWidth={sites[i] === 'Cl' ? 2.6 : 2}
        />
      ))}

      {/* Central Co3+ ion */}
      <circle cx={cx} cy={cy} r={compact ? 21 : 24} fill={SURFACE} stroke={CO_TONE} strokeWidth={2.5} />
      <circle cx={cx} cy={cy} r={compact ? 21 : 24} fill={CO_TONE} fillOpacity={0.18} stroke="none" />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize={15} fontWeight={700} fill={FG}>
        Co³⁺
      </text>

      {/* Six ligands */}
      {pts.map((p, i) => (
        <LigandNode key={`lig-${i}`} x={p.x} y={p.y} kind={sites[i]} compact={compact} />
      ))}
    </g>
  )
}

function ComplexScene({ data, reducedMotion }: { data: ComplexStepData; reducedMotion: boolean }) {
  const swatch = COMPOUND_SWATCH[data.row.colour] ?? CO_TONE
  const count = data.row.counterIons
  const spacing = 74
  const startY = 205 - ((count - 1) * spacing) / 2
  const transitionStyle = reducedMotion ? undefined : { transition: 'opacity 280ms ease' }

  return (
    <g style={transitionStyle}>
      {/* Title header */}
      <circle cx={34} cy={28} r={9} fill={swatch} stroke={BORDER} strokeWidth={1.5} />
      <text x={52} y={34} fontSize={17} fontWeight={700} fill={FG}>
        {`${data.row.colour} · ${data.row.empirical.replace('3.', '₃·').replace('NH3', 'NH₃')}`}
      </text>
      <text x={542} y={34} textAnchor="end" fontSize={15} fill={MUTED}>
        {`${data.row.agclMoles} mol AgCl`}
      </text>

      {/* Left: coordination sphere */}
      <OctahedralRing cx={175} cy={205} ringR={116} ligandR={82} sites={data.sites} swatch={swatch} />

      {/* Right: outside counter Cl- ions + Ag+ arrows -> AgCl(s) */}
      <text x={436} y={76} textAnchor="middle" fontSize={15} fontWeight={600} fill={MUTED}>
        Outside ring + AgNO₃
      </text>
      {Array.from({ length: count }, (_, i) => {
        const y = startY + i * spacing
        return (
          <g key={`counter-${i}`}>
            {/* Free Cl- ion */}
            <circle cx={356} cy={y} r={20} fill={SURFACE} stroke={CL_TONE} strokeWidth={2} strokeDasharray="4 3" />
            <circle cx={356} cy={y} r={20} fill={CL_TONE} fillOpacity={0.14} stroke="none" />
            <text x={356} y={y + 5} textAnchor="middle" fontSize={15} fontWeight={600} fill={FG}>
              Cl⁻
            </text>

            {/* Ag+ arrow */}
            <text x={412} y={y - 9} textAnchor="middle" fontSize={15} fill={MUTED}>
              Ag⁺
            </text>
            <line
              x1={382}
              y1={y}
              x2={440}
              y2={y}
              stroke={MUTED}
              strokeWidth={2}
              markerEnd="url(#werner-arrow)"
            />

            {/* White AgCl(s) precipitate */}
            <rect
              x={448}
              y={y - 16}
              width={90}
              height={32}
              rx={6}
              fill={AGCL_BG}
              stroke={MUTED}
              strokeWidth={1.6}
            />
            <text x={493} y={y + 5} textAnchor="middle" fontSize={15} fontWeight={600} fill="#1F2023">
              AgCl(s)
            </text>
          </g>
        )
      })}

      {/* Formula bar */}
      <rect x={24} y={346} width={512} height={44} rx={8} fill="var(--surface-raised)" stroke={BORDER} strokeWidth={1.2} />
      <text x={280} y={374} textAnchor="middle" fontSize={17} fontWeight={700} fill={FG}>
        {`${data.bracketDisplay}   +   ${data.counterDisplay}`}
      </text>

      {/* Captions */}
      <text x={280} y={420} textAnchor="middle" fontSize={15} fontWeight={600} fill={FG}>
        {data.captionPrimary}
      </text>
      <text x={280} y={448} textAnchor="middle" fontSize={15} fill={MUTED}>
        {data.captionSecondary}
      </text>
    </g>
  )
}

function IsomersScene({ data }: { data: IsomersStepData }) {
  return (
    <g>
      <text x={280} y={32} textAnchor="middle" fontSize={17} fontWeight={700} fill={FG}>
        Same formula, two arrangements (isomers)
      </text>

      {/* Left panel: Green (opposite) */}
      <circle cx={66} cy={62} r={7} fill={COMPOUND_SWATCH.Green} />
      <text x={80} y={68} fontSize={16} fontWeight={700} fill={FG}>
        Green: opposite Cl⁻
      </text>
      <OctahedralRing
        cx={142}
        cy={192}
        ringR={92}
        ligandR={64}
        sites={data.greenSites}
        swatch={COMPOUND_SWATCH.Green}
        compact
        highlightPair={{ a: 0, b: 3, label: 'opposite' }}
      />
      <text x={142} y={310} textAnchor="middle" fontSize={15} fill={MUTED}>
        1 outer Cl⁻ → 1 AgCl(s)
      </text>

      {/* Vertical divider */}
      <line x1={280} y1={56} x2={280} y2={318} stroke={BORDER} strokeWidth={1.2} strokeDasharray="4 4" />

      {/* Right panel: Violet (neighbouring) */}
      <circle cx={322} cy={62} r={7} fill={COMPOUND_SWATCH.Violet} />
      <text x={336} y={68} fontSize={16} fontWeight={700} fill={FG}>
        Violet: neighbouring Cl⁻
      </text>
      <OctahedralRing
        cx={418}
        cy={192}
        ringR={92}
        ligandR={64}
        sites={data.violetSites}
        swatch={COMPOUND_SWATCH.Violet}
        compact
        highlightPair={{ a: 0, b: 1, label: 'neighbouring' }}
      />
      <text x={418} y={310} textAnchor="middle" fontSize={15} fill={MUTED}>
        1 outer Cl⁻ → 1 AgCl(s)
      </text>

      {/* Shared formula bar */}
      <rect x={24} y={340} width={512} height={44} rx={8} fill="var(--surface-raised)" stroke={BORDER} strokeWidth={1.2} />
      <text x={280} y={368} textAnchor="middle" fontSize={17} fontWeight={700} fill={FG}>
        {`Both: ${data.bracketDisplay}  +  ${data.counterDisplay}  (4 + 2 = 6)`}
      </text>

      {/* Captions */}
      <text x={280} y={416} textAnchor="middle" fontSize={15} fontWeight={600} fill={FG}>
        Equal formulas with different properties are called isomers.
      </text>
      <text x={280} y={444} textAnchor="middle" fontSize={15} fill={MUTED}>
        Both precipitate 1 mol AgCl and behave as 1:1 electrolytes.
      </text>
    </g>
  )
}

function ConductivityScene({ data }: { data: ConductivityStepData }) {
  const baseY = 330
  const blockH = 48
  const blockGap = 6
  const barW = 84
  const centers = [86, 215, 345, 474]

  return (
    <g>
      <text x={280} y={32} textAnchor="middle" fontSize={17} fontWeight={700} fill={FG}>
        Conductivity: ions per formula unit
      </text>
      <text x={280} y={56} textAnchor="middle" fontSize={15} fill={MUTED}>
        Each bar splits into 1 coordination entity plus its counter Cl⁻ ions
      </text>

      {/* Baseline */}
      <line x1={26} y1={baseY} x2={534} y2={baseY} stroke={MUTED} strokeWidth={1.6} />

      {data.bars.map((bar, idx) => {
        const cx = centers[idx]
        const x = cx - barW / 2
        const swatch = COMPOUND_SWATCH[bar.colour] ?? CO_TONE
        const entityY = baseY - blockH
        const topOfBar = baseY - bar.totalIons * blockH - (bar.totalIons - 1) * blockGap

        return (
          <g key={bar.colour}>
            {/* Ratio & total ion count above bar */}
            <text x={cx} y={topOfBar - 12} textAnchor="middle" fontSize={16} fontWeight={700} fill={FG}>
              {`${bar.totalIons} (${bar.electrolyte})`}
            </text>

            {/* Lower block: coordination entity */}
            <rect
              x={x}
              y={entityY}
              width={barW}
              height={blockH}
              rx={6}
              fill={swatch}
              fillOpacity={0.22}
              stroke={swatch}
              strokeWidth={2}
            />
            <text x={cx} y={entityY + 30} textAnchor="middle" fontSize={15} fontWeight={700} fill={FG}>
              entity
            </text>

            {/* Upper blocks: counter Cl- ions */}
            {Array.from({ length: bar.counterIons }, (_, cIdx) => {
              const by = entityY - (cIdx + 1) * (blockH + blockGap)
              return (
                <g key={`ion-${cIdx}`}>
                  <rect
                    x={x}
                    y={by}
                    width={barW}
                    height={blockH}
                    rx={6}
                    fill={CL_TONE}
                    fillOpacity={0.2}
                    stroke={CL_TONE}
                    strokeWidth={2}
                  />
                  <text x={cx} y={by + 30} textAnchor="middle" fontSize={15} fontWeight={600} fill={FG}>
                    Cl⁻
                  </text>
                </g>
              )
            })}

            {/* Labels below baseline */}
            <circle cx={cx - 30} cy={baseY + 24} r={6} fill={swatch} />
            <text x={cx - 18} y={baseY + 30} fontSize={15} fontWeight={700} fill={FG}>
              {bar.colour}
            </text>
            <text x={cx} y={baseY + 54} textAnchor="middle" fontSize={15} fill={MUTED}>
              {`${bar.agclMoles} AgCl`}
            </text>
          </g>
        )
      })}

      {/* Legend */}
      <text x={280} y={428} textAnchor="middle" fontSize={15} fontWeight={600} fill={FG}>
        Upper Cl⁻ blocks match the AgCl moles: 3, 2, 1 and 1.
      </text>
      <text x={280} y={454} textAnchor="middle" fontSize={15} fill={MUTED}>
        Conductivity and silver nitrate precipitation tell the same story.
      </text>
    </g>
  )
}

function describeStep(step: number): string {
  const s = wernerStepState(step)
  if (s.kind === 'complex') {
    return `${s.row.colour} cobalt complex ${s.bracketDisplay} with ${s.counterDisplay} outside the ring precipitating ${s.row.agclMoles} mol AgCl`
  }
  if (s.kind === 'isomers') {
    return 'Green and violet isomers of [CoCl2(NH3)4]Cl: two bound chlorides opposite in green and neighbouring in violet'
  }
  return 'Conductivity bar chart showing 4, 3, 2 and 2 ions per formula unit for yellow, purple, green and violet cobalt complexes'
}

export function WernerCobaltAmmine({ step, reducedMotion }: WernerCobaltAmmineProps) {
  const state = wernerStepState(step)
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={describeStep(step)}
      style={{ display: 'block' }}
    >
      <defs>
        <marker
          id="werner-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill={MUTED} />
        </marker>
      </defs>
      {state.kind === 'complex' && <ComplexScene data={state} reducedMotion={reducedMotion} />}
      {state.kind === 'isomers' && <IsomersScene data={state} />}
      {state.kind === 'conductivity' && <ConductivityScene data={state} />}
    </svg>
  )
}
