'use client'

import { useState } from 'react'
import {
  COUNTER_VALUES,
  denticityStepInfo,
  type NitriteMode,
  type ThiocyanateMode,
} from './denticity-steps'

export interface LigandDenticityGalleryProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

const W = 540
const H = 456

const FG = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const SURFACE = 'var(--surface)'
const RAISED = 'var(--surface-raised)'
const BORDER = 'var(--border)'
const METAL = 'var(--db-3d)'
const CL = 'var(--el-Cl)'
const N_COL = 'var(--el-N)'
const O_COL = 'var(--el-O)'
const S_COL = 'var(--el-S)'
const C_COL = 'var(--bond)'
const ACCENT = 'var(--accent)'
const HIGHLIGHT = 'var(--highlight)'

const ARROW_ACCENT = 's52-dent-arrow-accent'
const ARROW_N = 's52-dent-arrow-n'
const ARROW_O = 's52-dent-arrow-o'
const ARROW_CL = 's52-dent-arrow-cl'
const ARROW_S = 's52-dent-arrow-s'

function ArrowDefs() {
  const markers: readonly [string, string][] = [
    [ARROW_ACCENT, ACCENT],
    [ARROW_N, N_COL],
    [ARROW_O, O_COL],
    [ARROW_CL, CL],
    [ARROW_S, S_COL],
  ]
  return (
    <defs>
      {markers.map(([id, fill]) => (
        <marker
          key={id}
          id={id}
          viewBox="0 0 10 10"
          refX="8.5"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M0 1 L9 5 L0 9 z" fill={fill} />
        </marker>
      ))}
    </defs>
  )
}

/** Shortens a donor arrow from (x1,y1) to (x2,y2) so it starts outside the donor circle and ends at the metal rim. */
function DonorArrow({
  x1,
  y1,
  x2,
  y2,
  startPad,
  endPad,
  color,
  markerId,
  opacity = 1,
  strokeWidth = 2.6,
}: {
  x1: number
  y1: number
  x2: number
  y2: number
  startPad: number
  endPad: number
  color: string
  markerId: string
  opacity?: number
  strokeWidth?: number
}) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const sx = x1 + ux * startPad
  const sy = y1 + uy * startPad
  const ex = x2 - ux * endPad
  const ey = y2 - uy * endPad
  return (
    <line
      x1={sx}
      y1={sy}
      x2={ex}
      y2={ey}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      markerEnd={`url(#${markerId})`}
      opacity={opacity}
    />
  )
}

function MetalNode({ cx, cy, r = 28, label = 'Mⁿ⁺', opacity = 1 }: { cx: number; cy: number; r?: number; label?: string; opacity?: number }) {
  return (
    <g opacity={opacity}>
      <circle cx={cx} cy={cy} r={r} fill={SURFACE} />
      <circle cx={cx} cy={cy} r={r} fill={METAL} fillOpacity={0.2} stroke={METAL} strokeWidth={2.4} />
      <text x={cx} y={cy + 6} textAnchor="middle" fontSize={17} fontWeight={700} fill={FG}>
        {label}
      </text>
    </g>
  )
}

function DonorNode({
  cx,
  cy,
  r = 17,
  label,
  color,
  opacity = 1,
}: {
  cx: number
  cy: number
  r?: number
  label: string
  color: string
  opacity?: number
}) {
  return (
    <g opacity={opacity}>
      <circle cx={cx} cy={cy} r={r} fill={SURFACE} />
      <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity={0.22} stroke={color} strokeWidth={2.2} />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize={15} fontWeight={600} fill={FG}>
        {label}
      </text>
    </g>
  )
}

function DenticityCounter({ activeCount, isAmbidentate }: { activeCount: number; isAmbidentate: boolean }) {
  return (
    <g>
      <rect x={346} y={14} width={180} height={52} rx={10} fill={RAISED} stroke={BORDER} strokeWidth={1.2} />
      <text x={436} y={34} textAnchor="middle" fontSize={14} fontWeight={600} fill={MUTED}>
        {isAmbidentate ? 'Ambidentate' : 'Denticity'}
      </text>
      {isAmbidentate ? (
        <text x={436} y={56} textAnchor="middle" fontSize={15} fontWeight={700} fill={ACCENT}>
          1 donor at a time
        </text>
      ) : (
        COUNTER_VALUES.map((val, i) => {
          const x = 368 + i * 44
          const active = val === activeCount
          return (
            <g key={val}>
              {active && <circle cx={x} cy={51} r={12} fill={ACCENT} fillOpacity={0.18} stroke={ACCENT} strokeWidth={1.6} />}
              <text
                x={x}
                y={56}
                textAnchor="middle"
                fontSize={15}
                fontWeight={active ? 700 : 500}
                fill={active ? ACCENT : MUTED}
              >
                {val}
              </text>
            </g>
          )
        })
      )}
    </g>
  )
}

function CaptionFooter({ caption, subtitle }: { caption: string; subtitle: string }) {
  return (
    <g>
      <text x={W / 2} y={416} textAnchor="middle" fontSize={17} fontWeight={700} fill={FG}>
        {caption}
      </text>
      <text x={W / 2} y={440} textAnchor="middle" fontSize={15} fill={MUTED}>
        {subtitle}
      </text>
    </g>
  )
}

// ----- Step 0: Unidentate -----
function UnidentateScene() {
  const mx = 190
  const my = 165
  const clx = 365
  const cly = 165
  return (
    <g>
      <text x={20} y={38} fontSize={16} fontWeight={700} fill={FG}>
        Unidentate ligand
      </text>
      <MetalNode cx={mx} cy={my} r={32} />
      <DonorNode cx={clx} cy={cly} r={24} label="Cl⁻" color={CL} />
      <DonorArrow x1={clx} y1={cly} x2={mx} y2={my} startPad={26} endPad={36} color={CL} markerId={ARROW_CL} strokeWidth={3} />
      <text x={(mx + clx) / 2} y={my - 14} textAnchor="middle" fontSize={15} fontWeight={600} fill={FG}>
        1 donor atom
      </text>

      {/* Faded alternatives: H2O and NH3 */}
      <g opacity={0.55}>
        <rect x={44} y={260} width={210} height={112} rx={10} fill={RAISED} stroke={BORDER} strokeWidth={1} />
        <MetalNode cx={98} cy={312} r={20} label="M" />
        <DonorNode cx={198} cy={312} r={20} label="O" color={O_COL} />
        <DonorArrow x1={198} y1={312} x2={98} y2={312} startPad={22} endPad={24} color={O_COL} markerId={ARROW_O} strokeWidth={2.2} />
        <text x={149} y={358} textAnchor="middle" fontSize={15} fill={FG}>
          H₂O (1 donor)
        </text>
      </g>

      <g opacity={0.55}>
        <rect x={286} y={260} width={210} height={112} rx={10} fill={RAISED} stroke={BORDER} strokeWidth={1} />
        <MetalNode cx={340} cy={312} r={20} label="M" />
        <DonorNode cx={440} cy={312} r={20} label="N" color={N_COL} />
        <DonorArrow x1={440} y1={312} x2={340} y2={312} startPad={22} endPad={24} color={N_COL} markerId={ARROW_N} strokeWidth={2.2} />
        <text x={391} y={358} textAnchor="middle" fontSize={15} fill={FG}>
          NH₃ (1 donor)
        </text>
      </g>
    </g>
  )
}

// ----- Step 1: Didentate (en + faded oxalate) -----
function DidentateScene() {
  const mx = 128
  const my = 200
  const n1 = { x: 222, y: 128 }
  const n2 = { x: 222, y: 272 }
  const c1 = { x: 306, y: 158 }
  const c2 = { x: 306, y: 242 }

  return (
    <g>
      <text x={20} y={38} fontSize={16} fontWeight={700} fill={FG}>
        Ethane-1,2-diamine (en)
      </text>

      {/* Highlighted 5-membered chelate ring */}
      <polygon
        points={`${mx},${my} ${n1.x},${n1.y} ${c1.x},${c1.y} ${c2.x},${c2.y} ${n2.x},${n2.y}`}
        fill={HIGHLIGHT}
        stroke={ACCENT}
        strokeWidth={1.6}
        strokeDasharray="6 4"
      />
      <text x={224} y={205} textAnchor="middle" fontSize={14} fontWeight={600} fill={FG}>
        chelate ring
      </text>

      {/* Carbon-nitrogen and carbon-carbon backbone */}
      <line x1={n1.x} y1={n1.y} x2={c1.x} y2={c1.y} stroke={C_COL} strokeWidth={3} strokeLinecap="round" />
      <line x1={c1.x} y1={c1.y} x2={c2.x} y2={c2.y} stroke={C_COL} strokeWidth={3} strokeLinecap="round" />
      <line x1={c2.x} y1={c2.y} x2={n2.x} y2={n2.y} stroke={C_COL} strokeWidth={3} strokeLinecap="round" />

      {/* Two donor arrows */}
      <DonorArrow x1={n1.x} y1={n1.y} x2={mx} y2={my} startPad={20} endPad={33} color={N_COL} markerId={ARROW_N} strokeWidth={2.8} />
      <DonorArrow x1={n2.x} y1={n2.y} x2={mx} y2={my} startPad={20} endPad={33} color={N_COL} markerId={ARROW_N} strokeWidth={2.8} />

      <MetalNode cx={mx} cy={my} r={29} />
      <DonorNode cx={n1.x} cy={n1.y} r={19} label="N" color={N_COL} />
      <DonorNode cx={n2.x} cy={n2.y} r={19} label="N" color={N_COL} />

      <circle cx={c1.x} cy={c1.y} r={17} fill={SURFACE} stroke={C_COL} strokeWidth={2} />
      <text x={c1.x} y={c1.y + 5} textAnchor="middle" fontSize={14} fontWeight={600} fill={FG}>
        CH₂
      </text>
      <circle cx={c2.x} cy={c2.y} r={17} fill={SURFACE} stroke={C_COL} strokeWidth={2} />
      <text x={c2.x} y={c2.y + 5} textAnchor="middle" fontSize={14} fontWeight={600} fill={FG}>
        CH₂
      </text>

      <text x={222} y={96} textAnchor="middle" fontSize={14} fill={MUTED}>
        H₂N
      </text>
      <text x={222} y={310} textAnchor="middle" fontSize={14} fill={MUTED}>
        H₂N
      </text>

      {/* Faded oxalate beside it */}
      <g opacity={0.55}>
        <rect x={358} y={114} width={166} height={198} rx={10} fill={RAISED} stroke={BORDER} strokeWidth={1} />
        <text x={441} y={140} textAnchor="middle" fontSize={15} fontWeight={600} fill={FG}>
          Oxalate (C₂O₄²⁻)
        </text>
        <line x1={454} y1={182} x2={492} y2={198} stroke={C_COL} strokeWidth={2} />
        <line x1={492} y1={198} x2={492} y2={242} stroke={C_COL} strokeWidth={2} />
        <line x1={492} y1={242} x2={454} y2={258} stroke={C_COL} strokeWidth={2} />
        <DonorArrow x1={454} y1={182} x2={394} y2={220} startPad={15} endPad={22} color={O_COL} markerId={ARROW_O} strokeWidth={2.2} />
        <DonorArrow x1={454} y1={258} x2={394} y2={220} startPad={15} endPad={22} color={O_COL} markerId={ARROW_O} strokeWidth={2.2} />
        <MetalNode cx={394} cy={220} r={18} label="M" />
        <DonorNode cx={454} cy={182} r={14} label="O" color={O_COL} />
        <DonorNode cx={454} cy={258} r={14} label="O" color={O_COL} />
        <text x={441} y={298} textAnchor="middle" fontSize={14} fill={MUTED}>
          2 O donors
        </text>
      </g>
    </g>
  )
}

// ----- Step 2: Polydentate N(CH2CH2NH2)3 -----
function PolydentateScene() {
  const mx = 270
  const my = 212
  const nTop = { x: 270, y: 92 }
  const nLeft = { x: 136, y: 212 }
  const nRight = { x: 404, y: 212 }
  const nBot = { x: 270, y: 334 }

  return (
    <g>
      <text x={20} y={38} fontSize={16} fontWeight={700} fill={FG}>
        N(CH₂CH₂NH₂)₃
      </text>

      {/* Three curved ethylene arms from central N to the three terminal NH2 nitrogens */}
      <path
        d={`M ${nTop.x - 16} ${nTop.y + 4} Q 146 98 ${nLeft.x} ${nLeft.y - 18}`}
        fill="none"
        stroke={C_COL}
        strokeWidth={3}
      />
      <path
        d={`M ${nTop.x + 16} ${nTop.y + 4} Q 394 98 ${nRight.x} ${nRight.y - 18}`}
        fill="none"
        stroke={C_COL}
        strokeWidth={3}
      />
      <path
        d={`M ${nTop.x + 12} ${nTop.y - 12} C 470 50, 486 346, ${nBot.x + 18} ${nBot.y}`}
        fill="none"
        stroke={C_COL}
        strokeWidth={3}
        strokeDasharray="7 4"
      />

      {/* Arm labels */}
      <text x={136} y={108} textAnchor="middle" fontSize={14} fill={MUTED} stroke={SURFACE} strokeWidth={4} paintOrder="stroke">
        CH₂CH₂
      </text>
      <text x={402} y={108} textAnchor="middle" fontSize={14} fill={MUTED} stroke={SURFACE} strokeWidth={4} paintOrder="stroke">
        CH₂CH₂
      </text>
      <text x={442} y={322} textAnchor="middle" fontSize={14} fill={MUTED} stroke={SURFACE} strokeWidth={4} paintOrder="stroke">
        CH₂CH₂
      </text>

      {/* Four donor arrows to central metal */}
      <DonorArrow x1={nTop.x} y1={nTop.y} x2={mx} y2={my} startPad={20} endPad={32} color={N_COL} markerId={ARROW_N} strokeWidth={2.8} />
      <DonorArrow x1={nLeft.x} y1={nLeft.y} x2={mx} y2={my} startPad={20} endPad={32} color={N_COL} markerId={ARROW_N} strokeWidth={2.8} />
      <DonorArrow x1={nRight.x} y1={nRight.y} x2={mx} y2={my} startPad={20} endPad={32} color={N_COL} markerId={ARROW_N} strokeWidth={2.8} />
      <DonorArrow x1={nBot.x} y1={nBot.y} x2={mx} y2={my} startPad={20} endPad={32} color={N_COL} markerId={ARROW_N} strokeWidth={2.8} />

      <MetalNode cx={mx} cy={my} r={28} />
      <DonorNode cx={nTop.x} cy={nTop.y} r={18} label="N" color={N_COL} />
      <DonorNode cx={nLeft.x} cy={nLeft.y} r={18} label="N" color={N_COL} />
      <DonorNode cx={nRight.x} cy={nRight.y} r={18} label="N" color={N_COL} />
      <DonorNode cx={nBot.x} cy={nBot.y} r={18} label="N" color={N_COL} />

      <text x={94} y={217} textAnchor="end" fontSize={14} fill={MUTED}>
        H₂N
      </text>
      <text x={446} y={217} textAnchor="start" fontSize={14} fill={MUTED}>
        NH₂
      </text>
      <text x={270} y={372} textAnchor="middle" fontSize={14} fill={MUTED}>
        NH₂ · 4 donor atoms
      </text>
    </g>
  )
}

// ----- Step 3: Hexadentate EDTA4- -----
function HexadentateScene() {
  const mx = 270
  const my = 212
  const nL = { x: 186, y: 292 }
  const nR = { x: 354, y: 292 }
  const o1 = { x: 132, y: 192 }
  const o2 = { x: 194, y: 108 }
  const o3 = { x: 346, y: 108 }
  const o4 = { x: 408, y: 192 }

  return (
    <g>
      <text x={20} y={38} fontSize={16} fontWeight={700} fill={FG}>
        EDTA⁴⁻ cage
      </text>

      {/* Subtle cage envelope */}
      <ellipse cx={mx} cy={my} rx={158} ry={124} fill={HIGHLIGHT} fillOpacity={0.35} stroke={BORDER} strokeWidth={1.2} strokeDasharray="6 4" />

      {/* Ethylene bridge between the two N donors */}
      <path d={`M ${nL.x + 14} ${nL.y + 8} Q ${mx} 348 ${nR.x - 14} ${nR.y + 8}`} fill="none" stroke={C_COL} strokeWidth={3} />
      <text x={mx} y={346} textAnchor="middle" fontSize={14} fill={MUTED}>
        CH₂-CH₂
      </text>

      {/* Four acetate arms: two from nL, two from nR */}
      <path d={`M ${nL.x - 14} ${nL.y - 8} Q 108 264 ${o1.x - 6} ${o1.y + 14}`} fill="none" stroke={C_COL} strokeWidth={2.6} />
      <path d={`M ${nL.x - 10} ${nL.y - 14} C 78 210, 102 104, ${o2.x - 16} ${o2.y}`} fill="none" stroke={C_COL} strokeWidth={2.6} />
      <path d={`M ${nR.x + 10} ${nR.y - 14} C 462 210, 438 104, ${o3.x + 16} ${o3.y}`} fill="none" stroke={C_COL} strokeWidth={2.6} />
      <path d={`M ${nR.x + 14} ${nR.y - 8} Q 432 264 ${o4.x + 6} ${o4.y + 14}`} fill="none" stroke={C_COL} strokeWidth={2.6} />

      {/* Six donor arrows: 2 N (blue) + 4 O (red) */}
      <DonorArrow x1={nL.x} y1={nL.y} x2={mx} y2={my} startPad={19} endPad={31} color={N_COL} markerId={ARROW_N} strokeWidth={2.6} />
      <DonorArrow x1={nR.x} y1={nR.y} x2={mx} y2={my} startPad={19} endPad={31} color={N_COL} markerId={ARROW_N} strokeWidth={2.6} />
      <DonorArrow x1={o1.x} y1={o1.y} x2={mx} y2={my} startPad={19} endPad={31} color={O_COL} markerId={ARROW_O} strokeWidth={2.6} />
      <DonorArrow x1={o2.x} y1={o2.y} x2={mx} y2={my} startPad={19} endPad={31} color={O_COL} markerId={ARROW_O} strokeWidth={2.6} />
      <DonorArrow x1={o3.x} y1={o3.y} x2={mx} y2={my} startPad={19} endPad={31} color={O_COL} markerId={ARROW_O} strokeWidth={2.6} />
      <DonorArrow x1={o4.x} y1={o4.y} x2={mx} y2={my} startPad={19} endPad={31} color={O_COL} markerId={ARROW_O} strokeWidth={2.6} />

      <MetalNode cx={mx} cy={my} r={27} />
      <DonorNode cx={nL.x} cy={nL.y} r={17} label="N" color={N_COL} />
      <DonorNode cx={nR.x} cy={nR.y} r={17} label="N" color={N_COL} />
      <DonorNode cx={o1.x} cy={o1.y} r={17} label="O⁻" color={O_COL} />
      <DonorNode cx={o2.x} cy={o2.y} r={17} label="O⁻" color={O_COL} />
      <DonorNode cx={o3.x} cy={o3.y} r={17} label="O⁻" color={O_COL} />
      <DonorNode cx={o4.x} cy={o4.y} r={17} label="O⁻" color={O_COL} />

      {/* Compact legend for 2 N + 4 O */}
      <g>
        <circle cx={140} cy={378} r={7} fill={N_COL} />
        <text x={154} y={383} fontSize={14} fontWeight={600} fill={FG}>
          2 N donors
        </text>
        <circle cx={292} cy={378} r={7} fill={O_COL} />
        <text x={306} y={383} fontSize={14} fontWeight={600} fill={FG}>
          4 O donors (acetate)
        </text>
      </g>
    </g>
  )
}

// ----- Step 4: Ambidentate (NO2- and SCN-) with interactive toggles -----
function AmbidentateScene({
  no2Mode,
  setNo2Mode,
  scnMode,
  setScnMode,
}: {
  no2Mode: NitriteMode
  setNo2Mode: (m: NitriteMode) => void
  scnMode: ThiocyanateMode
  setScnMode: (m: ThiocyanateMode) => void
}) {
  const isNitritoN = no2Mode === 'nitrito-N'
  const isThioS = scnMode === 'thiocyanato-S'

  return (
    <g>
      <text x={20} y={38} fontSize={16} fontWeight={700} fill={FG}>
        Ambidentate ligands
      </text>

      {/* Row 1: NO2- */}
      <rect x={16} y={78} width={508} height={144} rx={12} fill={RAISED} stroke={BORDER} strokeWidth={1.2} />
      <text x={32} y={104} fontSize={15} fontWeight={700} fill={FG}>
        Nitrite (NO₂⁻)
      </text>

      {/* Toggle pills for NO2- */}
      <g style={{ pointerEvents: 'auto', cursor: 'pointer' }} role="group" aria-label="Nitrite donor mode">
        <g onClick={() => setNo2Mode('nitrito-N')} role="button" tabIndex={0} aria-pressed={isNitritoN}>
          <rect
            x={256}
            y={84}
            width={118}
            height={30}
            rx={15}
            fill={isNitritoN ? ACCENT : SURFACE}
            stroke={isNitritoN ? ACCENT : BORDER}
            strokeWidth={1.4}
          />
          <text x={315} y={104} textAnchor="middle" fontSize={14} fontWeight={600} fill={isNitritoN ? 'var(--accent-fg)' : FG}>
            nitrito-N
          </text>
        </g>
        <g onClick={() => setNo2Mode('nitrito-O')} role="button" tabIndex={0} aria-pressed={!isNitritoN}>
          <rect
            x={384}
            y={84}
            width={118}
            height={30}
            rx={15}
            fill={!isNitritoN ? ACCENT : SURFACE}
            stroke={!isNitritoN ? ACCENT : BORDER}
            strokeWidth={1.4}
          />
          <text x={443} y={104} textAnchor="middle" fontSize={14} fontWeight={600} fill={!isNitritoN ? 'var(--accent-fg)' : FG}>
            nitrito-O
          </text>
        </g>
      </g>

      {/* NO2- diagram */}
      <MetalNode cx={96} cy={166} r={24} label="M" />
      {isNitritoN ? (
        <g>
          <DonorArrow x1={226} y1={166} x2={96} y2={166} startPad={20} endPad={28} color={N_COL} markerId={ARROW_N} strokeWidth={2.8} />
          <line x1={242} y1={156} x2={294} y2={136} stroke={C_COL} strokeWidth={2.4} />
          <line x1={242} y1={174} x2={294} y2={192} stroke={C_COL} strokeWidth={2.4} />
          <line x1={244} y1={179} x2={290} y2={197} stroke={C_COL} strokeWidth={2.4} />
          <DonorNode cx={226} cy={166} r={18} label="N" color={N_COL} />
          <DonorNode cx={310} cy={134} r={16} label="O" color={O_COL} opacity={0.35} />
          <DonorNode cx={310} cy={196} r={16} label="O" color={O_COL} opacity={0.35} />
          <text x={428} y={170} textAnchor="middle" fontSize={14} fill={MUTED}>
            N binds · O unused
          </text>
        </g>
      ) : (
        <g>
          <DonorArrow x1={216} y1={166} x2={96} y2={166} startPad={20} endPad={28} color={O_COL} markerId={ARROW_O} strokeWidth={2.8} />
          <line x1={234} y1={166} x2={278} y2={166} stroke={C_COL} strokeWidth={2.4} />
          <line x1={314} y1={162} x2={352} y2={162} stroke={C_COL} strokeWidth={2.4} />
          <line x1={314} y1={170} x2={352} y2={170} stroke={C_COL} strokeWidth={2.4} />
          <DonorNode cx={216} cy={166} r={18} label="O" color={O_COL} />
          <DonorNode cx={296} cy={166} r={17} label="N" color={N_COL} opacity={0.35} />
          <DonorNode cx={368} cy={166} r={16} label="O" color={O_COL} opacity={0.35} />
          <text x={456} y={170} textAnchor="middle" fontSize={14} fill={MUTED}>
            O binds
          </text>
        </g>
      )}

      {/* Row 2: SCN- */}
      <rect x={16} y={236} width={508} height={144} rx={12} fill={RAISED} stroke={BORDER} strokeWidth={1.2} />
      <text x={32} y={262} fontSize={15} fontWeight={700} fill={FG}>
        Thiocyanate (SCN⁻)
      </text>

      {/* Toggle pills for SCN- */}
      <g style={{ pointerEvents: 'auto', cursor: 'pointer' }} role="group" aria-label="Thiocyanate donor mode">
        <g onClick={() => setScnMode('thiocyanato-S')} role="button" tabIndex={0} aria-pressed={isThioS}>
          <rect
            x={216}
            y={242}
            width={138}
            height={30}
            rx={15}
            fill={isThioS ? ACCENT : SURFACE}
            stroke={isThioS ? ACCENT : BORDER}
            strokeWidth={1.4}
          />
          <text x={285} y={262} textAnchor="middle" fontSize={14} fontWeight={600} fill={isThioS ? 'var(--accent-fg)' : FG}>
            thiocyanato-S
          </text>
        </g>
        <g onClick={() => setScnMode('thiocyanato-N')} role="button" tabIndex={0} aria-pressed={!isThioS}>
          <rect
            x={364}
            y={242}
            width={144}
            height={30}
            rx={15}
            fill={!isThioS ? ACCENT : SURFACE}
            stroke={!isThioS ? ACCENT : BORDER}
            strokeWidth={1.4}
          />
          <text x={436} y={262} textAnchor="middle" fontSize={14} fontWeight={600} fill={!isThioS ? 'var(--accent-fg)' : FG}>
            thiocyanato-N
          </text>
        </g>
      </g>

      {/* SCN- diagram */}
      <MetalNode cx={96} cy={326} r={24} label="M" />
      {isThioS ? (
        <g>
          <DonorArrow x1={216} y1={326} x2={96} y2={326} startPad={20} endPad={28} color={S_COL} markerId={ARROW_S} strokeWidth={2.8} />
          <line x1={234} y1={326} x2={276} y2={326} stroke={C_COL} strokeWidth={2.4} />
          <line x1={312} y1={321} x2={348} y2={321} stroke={C_COL} strokeWidth={2} />
          <line x1={312} y1={326} x2={348} y2={326} stroke={C_COL} strokeWidth={2} />
          <line x1={312} y1={331} x2={348} y2={331} stroke={C_COL} strokeWidth={2} />
          <DonorNode cx={216} cy={326} r={18} label="S" color={S_COL} />
          <circle cx={294} cy={326} r={16} fill={SURFACE} stroke={C_COL} strokeWidth={2} />
          <text x={294} y={331} textAnchor="middle" fontSize={15} fontWeight={600} fill={FG}>
            C
          </text>
          <DonorNode cx={366} cy={326} r={17} label="N" color={N_COL} opacity={0.35} />
          <text x={456} y={330} textAnchor="middle" fontSize={14} fill={MUTED}>
            S binds
          </text>
        </g>
      ) : (
        <g>
          <DonorArrow x1={216} y1={326} x2={96} y2={326} startPad={20} endPad={28} color={N_COL} markerId={ARROW_N} strokeWidth={2.8} />
          <line x1={234} y1={322} x2={276} y2={322} stroke={C_COL} strokeWidth={2.2} />
          <line x1={234} y1={330} x2={276} y2={330} stroke={C_COL} strokeWidth={2.2} />
          <line x1={312} y1={322} x2={348} y2={322} stroke={C_COL} strokeWidth={2.2} />
          <line x1={312} y1={330} x2={348} y2={330} stroke={C_COL} strokeWidth={2.2} />
          <DonorNode cx={216} cy={326} r={18} label="N" color={N_COL} />
          <circle cx={294} cy={326} r={16} fill={SURFACE} stroke={C_COL} strokeWidth={2} />
          <text x={294} y={331} textAnchor="middle" fontSize={15} fontWeight={600} fill={FG}>
            C
          </text>
          <DonorNode cx={366} cy={326} r={17} label="S" color={S_COL} opacity={0.35} />
          <text x={456} y={330} textAnchor="middle" fontSize={14} fill={MUTED}>
            N binds
          </text>
        </g>
      )}
    </g>
  )
}

export function LigandDenticityGallery({ step }: LigandDenticityGalleryProps) {
  const [no2Mode, setNo2Mode] = useState<NitriteMode>('nitrito-N')
  const [scnMode, setScnMode] = useState<ThiocyanateMode>('thiocyanato-S')
  const info = denticityStepInfo(step)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={`Ligand denticity: ${info.caption}`}
      style={{ display: 'block', width: '100%', height: '100%' }}
    >
      <ArrowDefs />
      <DenticityCounter activeCount={info.denticity} isAmbidentate={info.visual === 'ambidentate'} />
      {info.visual === 'unidentate' && <UnidentateScene />}
      {info.visual === 'didentate' && <DidentateScene />}
      {info.visual === 'polydentate' && <PolydentateScene />}
      {info.visual === 'hexadentate' && <HexadentateScene />}
      {info.visual === 'ambidentate' && (
        <AmbidentateScene
          no2Mode={no2Mode}
          setNo2Mode={setNo2Mode}
          scnMode={scnMode}
          setScnMode={setScnMode}
        />
      )}
      <CaptionFooter caption={info.caption} subtitle={info.subtitle} />
    </svg>
  )
}
