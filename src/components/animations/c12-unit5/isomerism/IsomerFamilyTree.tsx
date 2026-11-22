'use client'

import { familyTreeStepVisual } from './isomer-steps'
import { TONE } from './ComplexDiagrams'

export interface IsomerFamilyTreeProps {
  step: number
  reducedMotion: boolean
}

const W = 540
const H = 450

const STRUCTURAL_CHIPS = [
  { name: 'Linkage', section: '5.4.3', cue: 'Swap donor atom' },
  { name: 'Coordination', section: '5.4.4', cue: 'Swap between metals' },
  { name: 'Ionisation', section: '5.4.5', cue: 'Swap with counter ion' },
  { name: 'Solvate', section: '5.4.6', cue: 'Water inside vs lattice' },
] as const

/** Miniature square planar cis/trans icon (no tiny text). */
function GeoThumb({ x, y }: { x: number; y: number }) {
  const drawMini = (cx: number, cy: number, trans: boolean) => {
    const r = 13
    const corners = [
      { dx: -r, dy: -r, isX: true },
      { dx: r, dy: -r, isX: !trans },
      { dx: r, dy: r, isX: trans },
      { dx: -r, dy: r, isX: false },
    ]
    return (
      <g>
        {corners.map((c, i) => (
          <line key={i} x1={cx} y1={cy} x2={cx + c.dx} y2={cy + c.dy} stroke={TONE.bond} strokeWidth={1.6} />
        ))}
        <circle cx={cx} cy={cy} r={4.5} fill={TONE.metal} />
        {corners.map((c, i) => (
          <circle key={`d-${i}`} cx={cx + c.dx} cy={cy + c.dy} r={4} fill={c.isX ? TONE.x : TONE.l} />
        ))}
      </g>
    )
  }
  return (
    <g>
      {drawMini(x + 20, y + 20, false)}
      {drawMini(x + 62, y + 20, true)}
    </g>
  )
}

/** Miniature mirror-image propeller icon (no tiny text). */
function OpticalThumb({ x, y }: { x: number; y: number }) {
  const drawProp = (cx: number, cy: number, flip: number) => (
    <g>
      <circle cx={cx} cy={cy} r={4.5} fill={TONE.metal} />
      <path
        d={`M ${cx} ${cy - 14} Q ${cx + flip * 16} ${cy - 8} ${cx + flip * 12} ${cy + 4}`}
        fill="none"
        stroke={TONE.en}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <path
        d={`M ${cx - flip * 12} ${cy + 4} Q ${cx - flip * 10} ${cy + 16} ${cx + flip * 4} ${cy + 14}`}
        fill="none"
        stroke={TONE.en}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <path
        d={`M ${cx} ${cy - 14} Q ${cx - flip * 16} ${cy - 6} ${cx - flip * 12} ${cy + 4}`}
        fill="none"
        stroke={TONE.accent}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </g>
  )
  return (
    <g>
      {drawProp(x + 20, y + 20, 1)}
      <line x1={x + 41} y1={y + 4} x2={x + 41} y2={y + 36} stroke={TONE.muted} strokeWidth={1.6} strokeDasharray="3 3" />
      {drawProp(x + 62, y + 20, -1)}
    </g>
  )
}

export function IsomerFamilyTree({ step, reducedMotion }: IsomerFamilyTreeProps) {
  const visual = familyTreeStepVisual(step)
  const stereoActive = visual === 'stereo'
  const structActive = visual === 'structural'
  const showStereoChips = visual === 'stereo' || visual === 'structural'
  const showStructChips = visual === 'structural'
  const tr = reducedMotion ? undefined : { transition: 'opacity 0.35s ease' }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label="Classification of coordination compound isomers into stereoisomers (geometrical and optical) and structural isomers (linkage, coordination, ionisation, and solvate)"
      style={{ display: 'block' }}
    >
      {/* Top root card */}
      <rect
        x={60}
        y={14}
        width={420}
        height={62}
        rx={12}
        fill={TONE.raised}
        stroke={TONE.accent}
        strokeWidth={2}
      />
      <text x={W / 2} y={40} textAnchor="middle" fontSize={17} fontWeight={700} fill={TONE.fg}>
        Same formula, different arrangement
      </text>
      <text x={W / 2} y={64} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        Two principal isomer families
      </text>

      {/* Branch connectors */}
      <path
        d="M 270 76 L 270 96 L 136 96 L 136 112"
        fill="none"
        stroke={stereoActive ? TONE.accent : TONE.bond}
        strokeWidth={stereoActive ? 2.8 : 1.8}
      />
      <path
        d="M 270 76 L 270 96 L 404 96 L 404 112"
        fill="none"
        stroke={structActive ? TONE.b : TONE.bond}
        strokeWidth={structActive ? 2.8 : 1.8}
      />

      {/* Left panel: Stereoisomers */}
      <g opacity={visual === 'overview' ? 0.5 : stereoActive ? 1 : 0.58} style={tr}>
        <rect
          x={14}
          y={112}
          width={246}
          height={324}
          rx={12}
          fill={TONE.surface}
          stroke={stereoActive ? TONE.accent : TONE.bond}
          strokeWidth={stereoActive ? 2.6 : 1.4}
        />
        <rect
          x={14}
          y={112}
          width={246}
          height={60}
          rx={12}
          fill={TONE.accent}
          fillOpacity={stereoActive ? 0.14 : 0.06}
        />
        <text x={137} y={138} textAnchor="middle" fontSize={17} fontWeight={700} fill={TONE.fg}>
          Stereoisomers
        </text>
        <text x={137} y={160} textAnchor="middle" fontSize={16} fill={TONE.muted}>
          Same bonds, diff. space
        </text>

        {showStereoChips && (
          <g>
            {/* Geometrical chip */}
            <rect
              x={26}
              y={186}
              width={222}
              height={110}
              rx={10}
              fill={TONE.raised}
              stroke={TONE.accent}
              strokeWidth={1.6}
            />
            <text x={38} y={212} fontSize={17} fontWeight={700} fill={TONE.fg}>
              Geometrical
            </text>
            <text x={236} y={212} textAnchor="end" fontSize={16} fontWeight={600} fill={TONE.accent}>
              5.4.1
            </text>
            <text x={38} y={236} fontSize={16} fill={TONE.muted}>
              cis / trans, fac / mer
            </text>
            <GeoThumb x={94} y={248} />

            {/* Optical chip */}
            <rect
              x={26}
              y={310}
              width={222}
              height={110}
              rx={10}
              fill={TONE.raised}
              stroke={TONE.en}
              strokeWidth={1.6}
            />
            <text x={38} y={336} fontSize={17} fontWeight={700} fill={TONE.fg}>
              Optical
            </text>
            <text x={236} y={336} textAnchor="end" fontSize={16} fontWeight={600} fill={TONE.en}>
              5.4.2
            </text>
            <text x={38} y={360} fontSize={16} fill={TONE.muted}>
              Mirror pair (d and l)
            </text>
            <OpticalThumb x={94} y={372} />
          </g>
        )}
      </g>

      {/* Right panel: Structural isomers */}
      <g opacity={visual === 'overview' ? 0.5 : structActive ? 1 : 0.42} style={tr}>
        <rect
          x={276}
          y={112}
          width={250}
          height={324}
          rx={12}
          fill={TONE.surface}
          stroke={structActive ? TONE.b : TONE.bond}
          strokeWidth={structActive ? 2.6 : 1.4}
        />
        <rect
          x={276}
          y={112}
          width={250}
          height={60}
          rx={12}
          fill={TONE.b}
          fillOpacity={structActive ? 0.16 : 0.06}
        />
        <text x={401} y={138} textAnchor="middle" fontSize={17} fontWeight={700} fill={TONE.fg}>
          Structural isomers
        </text>
        <text x={401} y={160} textAnchor="middle" fontSize={16} fill={TONE.muted}>
          Different bonds
        </text>

        {showStructChips &&
          STRUCTURAL_CHIPS.map((chip, idx) => {
            const cy = 184 + idx * 60
            return (
              <g key={chip.name}>
                <rect
                  x={288}
                  y={cy}
                  width={226}
                  height={52}
                  rx={9}
                  fill={TONE.raised}
                  stroke={TONE.b}
                  strokeWidth={1.4}
                />
                <text x={298} y={cy + 22} fontSize={16} fontWeight={700} fill={TONE.fg}>
                  {chip.name}
                </text>
                <text x={504} y={cy + 22} textAnchor="end" fontSize={16} fontWeight={600} fill={TONE.b}>
                  {chip.section}
                </text>
                <text x={298} y={cy + 44} fontSize={16} fill={TONE.muted}>
                  {chip.cue}
                </text>
              </g>
            )
          })}
      </g>
    </svg>
  )
}
