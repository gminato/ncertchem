'use client'

import { NI_EN_SWATCHES, niEnStepState } from './ni-en-steps'

export interface NiEnColourSeriesProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

const W = 560
const H = 440
const FG = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const SURFACE = 'var(--surface)'

/** Six octahedral corner positions around (cx, cy). Pairs (0,1), (2,3), (4,5) are adjacent cis pairs for bidentate en. */
const CORNERS = [
  { id: 0, dx: 0, dy: -82 },    // top
  { id: 1, dx: 82, dy: -22 },   // right-front
  { id: 2, dx: 0, dy: 82 },     // bottom
  { id: 3, dx: -82, dy: 22 },   // left-front
  { id: 4, dx: -66, dy: -46 },  // back-left
  { id: 5, dx: 66, dy: 46 },    // back-right
] as const

const EN_PAIRS: readonly [number, number][] = [
  [0, 1],
  [2, 5],
  [3, 4],
]

/**
 * Section 5.5.5 Scrolly 2: Progressive displacement of H2O by bidentate en in
 * [Ni(H2O)6]2+, showing the test tube colour shift (green -> pale blue -> blue/purple -> violet)
 * and the octahedral chelate rings forming two waters at a time.
 */
export function NiEnColourSeries({ step, reducedMotion }: NiEnColourSeriesProps) {
  const s = niEnStepState(step)
  const tr = reducedMotion ? 'none' : 'all 420ms cubic-bezier(0.22, 1, 0.36, 1)'

  // Test tube on the left
  const tubeX = 64
  const tubeY = 104
  const tubeW = 54
  const tubeH = 190
  const tubeR = tubeW / 2

  // Octahedron centre on the right
  const cx = 368
  const cy = 176

  // Which corners are occupied by en?
  const enCorners = new Set<number>()
  for (let i = 0; i < s.enCount; i++) {
    enCorners.add(EN_PAIRS[i][0])
    enCorners.add(EN_PAIRS[i][1])
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={s.ariaLabel}>
      {/* Top formula & ratio header */}
      <text x={W / 2} y={32} textAnchor="middle" fontSize={18} fontWeight={700} fill={FG}>
        {s.formulaDisplay}
      </text>
      <text x={W / 2} y={56} textAnchor="middle" fontSize={16} fill={MUTED}>
        {`${s.ratioLabel}  |  Waters left: ${s.waterLeft}`}
      </text>

      {/* Dropper adding en on Steps 1..3 */}
      <g style={{ opacity: s.showDropper ? 1 : 0, transition: tr }}>
        <rect x={tubeX + 18} y={64} width={18} height={14} rx={5} fill="var(--accent)" />
        <path d={`M ${tubeX + 22} 78 L ${tubeX + 32} 78 L ${tubeX + 29} 96 L ${tubeX + 25} 96 Z`} fill="var(--glass-wall)" />
        <circle cx={tubeX + 27} cy={104} r={4} fill="var(--el-N)" />
        <text x={tubeX + 52} y={88} fontSize={16} fontWeight={600} fill={FG}>
          + en
        </text>
      </g>

      {/* Test tube */}
      <g>
        {/* Solution fill */}
        <path
          d={`M ${tubeX + 4} ${tubeY + 56} H ${tubeX + tubeW - 4} V ${tubeY + tubeH - tubeR} A ${tubeR - 4} ${tubeR - 4} 0 0 1 ${tubeX + 4} ${tubeY + tubeH - tubeR} Z`}
          fill={s.tubeFill}
          style={{ transition: tr }}
        />
        {/* Glass outline */}
        <path
          d={`M ${tubeX - 4} ${tubeY} H ${tubeX + tubeW + 4} M ${tubeX} ${tubeY} V ${tubeY + tubeH - tubeR} A ${tubeR} ${tubeR} 0 0 0 ${tubeX + tubeW} ${tubeY + tubeH - tubeR} V ${tubeY}`}
          fill="var(--glass-fill)"
          fillOpacity={0.14}
          stroke="var(--glass-wall)"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <line
          x1={tubeX + 10}
          y1={tubeY + 18}
          x2={tubeX + 10}
          y2={tubeY + tubeH - tubeR - 8}
          stroke="var(--glass-sheen)"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <text x={tubeX + tubeW / 2} y={tubeY + tubeH + 26} textAnchor="middle" fontSize={16} fontWeight={600} fill={FG}>
          {s.colourLabel}
        </text>
      </g>

      {/* Octahedral complex drawing */}
      <g>
        {/* Subtle octahedral equatorial plane */}
        <polygon
          points={`${cx + CORNERS[1].dx},${cy + CORNERS[1].dy} ${cx + CORNERS[5].dx},${cy + CORNERS[5].dy} ${cx + CORNERS[3].dx},${cy + CORNERS[3].dy} ${cx + CORNERS[4].dx},${cy + CORNERS[4].dy}`}
          fill="none"
          stroke="var(--border)"
          strokeWidth={1.5}
          strokeDasharray="4 4"
        />

        {/* Coordination bonds from Ni2+ to all 6 corners */}
        {CORNERS.map((c) => (
          <line
            key={`bond-${c.id}`}
            x1={cx}
            y1={cy}
            x2={cx + c.dx}
            y2={cy + c.dy}
            stroke="var(--bond)"
            strokeWidth={2.2}
          />
        ))}

        {/* Bidentate en chelate bridges */}
        {EN_PAIRS.map(([a, b], idx) => {
          const active = idx < s.enCount
          const ca = CORNERS[a]
          const cb = CORNERS[b]
          const mx = (ca.dx + cb.dx) * 0.85
          const my = (ca.dy + cb.dy) * 0.85
          return (
            <g key={`en-${idx}`} style={{ opacity: active ? 1 : 0, transition: tr }}>
              <path
                d={`M ${cx + ca.dx} ${cy + ca.dy} Q ${cx + mx} ${cy + my} ${cx + cb.dx} ${cy + cb.dy}`}
                fill="none"
                stroke="var(--el-N)"
                strokeWidth={5}
                strokeLinecap="round"
              />
              <circle cx={cx + ca.dx} cy={cy + ca.dy} r={9} fill="var(--el-N)" stroke={SURFACE} strokeWidth={1.5} />
              <circle cx={cx + cb.dx} cy={cy + cb.dy} r={9} fill="var(--el-N)" stroke={SURFACE} strokeWidth={1.5} />
              <text x={cx + ca.dx} y={cy + ca.dy + 5} textAnchor="middle" fontSize={16} fontWeight={700} fill={SURFACE}>
                N
              </text>
              <text x={cx + cb.dx} y={cy + cb.dy + 5} textAnchor="middle" fontSize={16} fontWeight={700} fill={SURFACE}>
                N
              </text>
            </g>
          )
        })}

        {/* Water ligands (peel outward and fade when displaced by en) */}
        {CORNERS.map((c) => {
          const displaced = enCorners.has(c.id)
          const mult = displaced ? 1.38 : 1
          const wx = cx + c.dx * mult
          const wy = cy + c.dy * mult
          return (
            <g
              key={`h2o-${c.id}`}
              style={{
                transform: `translate(${wx.toFixed(1)}px, ${wy.toFixed(1)}px)`,
                opacity: displaced ? 0.2 : 1,
                transition: tr,
              }}
            >
              <circle cx={0} cy={0} r={10} fill="var(--spec-blue)" stroke={SURFACE} strokeWidth={1.5} />
              <circle cx={-8} cy={7} r={4.5} fill="var(--el-H)" stroke={FG} strokeWidth={0.8} />
              <circle cx={8} cy={7} r={4.5} fill="var(--el-H)" stroke={FG} strokeWidth={0.8} />
            </g>
          )
        })}

        {/* Central Ni2+ ion */}
        <circle cx={cx} cy={cy} r={22} fill="var(--surface-raised)" stroke={FG} strokeWidth={2.5} />
        <text x={cx} y={cy + 6} textAnchor="middle" fontSize={17} fontWeight={700} fill={FG}>
          Ni²⁺
        </text>
      </g>

      {/* Legend under octahedron */}
      <g>
        <circle cx={244} cy={320} r={7} fill="var(--spec-blue)" />
        <text x={258} y={326} fontSize={16} fill={MUTED}>
          H₂O
        </text>
        <line x1={322} y1={320} x2={352} y2={320} stroke="var(--el-N)" strokeWidth={5} strokeLinecap="round" />
        <text x={360} y={326} fontSize={16} fill={MUTED}>
          en (bidentate)
        </text>
      </g>

      {/* Bottom row of 4 colour swatches */}
      <g>
        {NI_EN_SWATCHES.map((sw, idx) => {
          const boxW = 122
          const gap = 10
          const startX = (W - (boxW * 4 + gap * 3)) / 2
          const x = startX + idx * (boxW + gap)
          const y = 346
          const isCurrent = idx === s.step
          const visible = s.showAllSwatches || idx <= s.step
          return (
            <g key={sw.enPerNi} style={{ opacity: visible ? 1 : 0.35, transition: tr }}>
              <rect
                x={x}
                y={y}
                width={boxW}
                height={74}
                rx={10}
                fill="var(--surface-raised)"
                stroke={isCurrent ? FG : 'var(--border)'}
                strokeWidth={isCurrent ? 2.5 : 1.2}
              />
              <rect x={x + 10} y={y + 10} width={boxW - 20} height={24} rx={6} fill={sw.fill} stroke="var(--border)" />
              <text x={x + boxW / 2} y={y + 56} textAnchor="middle" fontSize={16} fontWeight={isCurrent ? 700 : 500} fill={FG}>
                {sw.label}
              </text>
            </g>
          )
        })}
      </g>
    </svg>
  )
}
