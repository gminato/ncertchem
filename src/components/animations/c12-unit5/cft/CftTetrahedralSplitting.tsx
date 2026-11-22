'use client'

import React from 'react'
import {
  CFT_COLOR,
  DOrbitalIcon,
  EnergyAxis,
  OrbitalLevelSet,
  SplitDoubleArrow,
} from './cft-svg-helpers'
import { tetrahedralStepState } from './cft-tetrahedral-steps'

export interface CftTetrahedralSplittingProps {
  step: number
  reducedMotion: boolean
}

const W = 540
const H = 456

/**
 * Isometric cube with metal M at centre and 4 tetrahedral ligands on alternate corners (between axes).
 */
function TetrahedralCube({ cx, cy, scale = 1 }: { cx: number; cy: number; scale?: number }) {
  // Isometric 3D -> 2D projection tuned so all 4 alternate corners sit clearly away from M
  const proj = (x: number, y: number, z: number): [number, number] => {
    const s = 48 * scale
    const px = cx + (x * 0.94 - y * 0.36) * s
    const py = cy + (-z * 0.92 + x * 0.1 + y * 0.42) * s
    return [px, py]
  }

  // Cube corners (+-1, +-1, +-1)
  const p = {
    ppp: proj(1, 1, 1),
    ppm: proj(1, 1, -1),
    pmp: proj(1, -1, 1),
    pmm: proj(1, -1, -1),
    mpp: proj(-1, 1, 1),
    mpm: proj(-1, 1, -1),
    mmp: proj(-1, -1, 1),
    mmm: proj(-1, -1, -1),
  }

  // Axes through face centres
  const xPos = proj(1.35, 0, 0)
  const xNeg = proj(-1.35, 0, 0)
  const yPos = proj(0, 1.35, 0)
  const yNeg = proj(0, -1.35, 0)
  const zPos = proj(0, 0, 1.35)
  const zNeg = proj(0, 0, -1.35)

  // 4 alternate corners for tetrahedron: (+,+,+), (+,-,-), (-,+,-), (-,-,+)
  const ligands = [p.ppp, p.pmm, p.mpm, p.mmp]

  const edge = (a: [number, number], b: [number, number], dashed = false) => (
    <line
      x1={a[0]}
      y1={a[1]}
      x2={b[0]}
      y2={b[1]}
      stroke={CFT_COLOR.subtle}
      strokeWidth={1.3}
      strokeDasharray={dashed ? '4 4' : undefined}
      strokeOpacity={dashed ? 0.55 : 0.75}
    />
  )

  return (
    <g>
      {/* Back cube edges (dashed) */}
      {edge(p.mmm, p.pmm, true)}
      {edge(p.mmm, p.mpm, true)}
      {edge(p.mmm, p.mmp, true)}

      {/* Coordinate axes through face centres */}
      <line x1={xNeg[0]} y1={xNeg[1]} x2={xPos[0]} y2={xPos[1]} stroke={CFT_COLOR.lowRepulsion} strokeWidth={1.5} strokeDasharray="3 3" />
      <line x1={yNeg[0]} y1={yNeg[1]} x2={yPos[0]} y2={yPos[1]} stroke={CFT_COLOR.lowRepulsion} strokeWidth={1.5} strokeDasharray="3 3" />
      <line x1={zNeg[0]} y1={zNeg[1]} x2={zPos[0]} y2={zPos[1]} stroke={CFT_COLOR.lowRepulsion} strokeWidth={1.5} strokeDasharray="3 3" />

      {/* Front cube edges */}
      {edge(p.ppp, p.ppm)}
      {edge(p.ppp, p.pmp)}
      {edge(p.ppp, p.mpp)}
      {edge(p.ppm, p.pmm)}
      {edge(p.ppm, p.mpm)}
      {edge(p.pmp, p.pmm)}
      {edge(p.pmp, p.mmp)}
      {edge(p.mpp, p.mpm)}
      {edge(p.mpp, p.mmp)}

      {/* Bonds from M to the 4 tetrahedral ligands */}
      {ligands.map(([lx, ly], idx) => (
        <line
          key={`bond-${idx}`}
          x1={cx}
          y1={cy}
          x2={lx}
          y2={ly}
          stroke={CFT_COLOR.ligand}
          strokeWidth={2.2}
          strokeOpacity={0.85}
        />
      ))}

      {/* Central metal ion */}
      <circle cx={cx} cy={cy} r={16 * scale} fill={CFT_COLOR.metal} fillOpacity={0.26} stroke={CFT_COLOR.metal} strokeWidth={2} />
      <text x={cx} y={cy + 5.5} textAnchor="middle" fontSize={15} fontWeight={700} fill={CFT_COLOR.fg}>
        M
      </text>

      {/* Four ligands at alternate corners */}
      {ligands.map(([lx, ly], idx) => (
        <g key={`lig-${idx}`} transform={`translate(${lx}, ${ly})`}>
          <circle r={11.5 * scale} fill={CFT_COLOR.ligand} fillOpacity={0.22} stroke={CFT_COLOR.ligand} strokeWidth={2} />
          <text x={0} y={5} textAnchor="middle" fontSize={15} fontWeight={700} fill={CFT_COLOR.ligand}>
            L
          </text>
        </g>
      ))}
    </g>
  )
}

export function CftTetrahedralSplitting({ step, reducedMotion }: CftTetrahedralSplittingProps) {
  const s = tetrahedralStepState(step)
  const tStyle: React.CSSProperties | undefined = reducedMotion
    ? undefined
    : { transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease' }

  if (s.kind === 'cube-geometry') {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label={s.ariaLabel}>
        <text x={130} y={34} textAnchor="middle" fontSize={16} fontWeight={600} fill={CFT_COLOR.fg}>
          Tetrahedron in a cube
        </text>
        <TetrahedralCube cx={130} cy={206} scale={1} />
        <text x={130} y={346} textAnchor="middle" fontSize={15} fill={CFT_COLOR.muted}>
          4 ligands on alternate corners
        </text>
        <text x={130} y={366} textAnchor="middle" fontSize={15} fill={CFT_COLOR.muted}>
          (between the x, y, z axes)
        </text>

        <line x1={250} y1={28} x2={250} y2={382} stroke={CFT_COLOR.border} strokeWidth={1.2} />

        <text x={392} y={34} textAnchor="middle" fontSize={16} fontWeight={600} fill={CFT_COLOR.fg}>
          Reversed repulsion
        </text>

        {/* Upper repulsion card: dxy, dyz, dxz closer to corners */}
        <rect
          x={268}
          y={62}
          width={250}
          height={136}
          rx={10}
          fill={CFT_COLOR.highRepulsion}
          fillOpacity={0.09}
          stroke={CFT_COLOR.highRepulsion}
          strokeWidth={1.6}
        />
        <DOrbitalIcon cx={304} cy={108} r={17} angleDeg={45} color={CFT_COLOR.highRepulsion} />
        <DOrbitalIcon cx={344} cy={108} r={17} angleDeg={45} color={CFT_COLOR.highRepulsion} />
        <DOrbitalIcon cx={384} cy={108} r={17} angleDeg={45} color={CFT_COLOR.highRepulsion} />
        <text x={410} y={104} fontSize={16} fontWeight={700} fill={CFT_COLOR.highRepulsion}>
          t₂ set
        </text>
        <text x={410} y={124} fontSize={15} fill={CFT_COLOR.fg}>
          dxy, dyz, dxz
        </text>
        <text x={393} y={168} textAnchor="middle" fontSize={15} fontWeight={600} fill={CFT_COLOR.highRepulsion}>
          Closer to ligands: higher energy
        </text>

        {/* Lower repulsion card: dx2-y2, dz2 along axes, away from corners */}
        <rect
          x={268}
          y={216}
          width={250}
          height={136}
          rx={10}
          fill={CFT_COLOR.lowRepulsion}
          fillOpacity={0.09}
          stroke={CFT_COLOR.lowRepulsion}
          strokeWidth={1.6}
        />
        <DOrbitalIcon cx={314} cy={262} r={18} angleDeg={0} color={CFT_COLOR.lowRepulsion} />
        <DOrbitalIcon cx={366} cy={262} r={18} variant="dz2" color={CFT_COLOR.lowRepulsion} />
        <text x={402} y={258} fontSize={16} fontWeight={700} fill={CFT_COLOR.lowRepulsion}>
          e set
        </text>
        <text x={402} y={278} fontSize={15} fill={CFT_COLOR.fg}>
          dx²−y², dz²
        </text>
        <text x={393} y={322} textAnchor="middle" fontSize={15} fontWeight={600} fill={CFT_COLOR.lowRepulsion}>
          Along axes: lower energy
        </text>

        <rect x={24} y={394} width={492} height={44} rx={10} fill={CFT_COLOR.raised} stroke={CFT_COLOR.border} strokeWidth={1.2} />
        <text x={W / 2} y={421} textAnchor="middle" fontSize={15} fill={CFT_COLOR.muted}>
          No ligand sits directly on an orbital lobe, so splitting is smaller
        </text>
      </svg>
    )
  }

  if (s.kind === 'inverted-split') {
    const baryY = 204
    const gapPx = 156
    const t2Y = baryY - s.t2Shift * gapPx // +2/5 Δt above barycentre
    const eY = baryY - s.eShift * gapPx   // -3/5 Δt below barycentre

    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label={s.ariaLabel}>
        <text x={110} y={34} textAnchor="middle" fontSize={16} fontWeight={600} fill={CFT_COLOR.fg}>
          Tetrahedral
        </text>
        <TetrahedralCube cx={110} cy={210} scale={0.86} />
        <text x={110} y={338} textAnchor="middle" fontSize={15} fill={CFT_COLOR.muted}>
          No centre of
        </text>
        <text x={110} y={358} textAnchor="middle" fontSize={15} fill={CFT_COLOR.muted}>
          symmetry (no g)
        </text>

        <line x1={206} y1={28} x2={206} y2={378} stroke={CFT_COLOR.border} strokeWidth={1.2} />

        <text x={378} y={34} textAnchor="middle" fontSize={16} fontWeight={600} fill={CFT_COLOR.fg}>
          Inverted splitting (Δt)
        </text>

        <EnergyAxis x={234} yTop={54} yBottom={356} />

        {/* Dashed barycentre */}
        <line x1={250} y1={baryY} x2={516} y2={baryY} stroke={CFT_COLOR.subtle} strokeWidth={1.6} strokeDasharray="6 5" />
        <text x={344} y={baryY - 8} textAnchor="middle" fontSize={15} fill={CFT_COLOR.muted}>
          Barycentre
        </text>

        {/* Upper t2 triple (+2/5 Δt) */}
        <OrbitalLevelSet
          cx={344}
          y={t2Y}
          slots={3}
          slotWidth={36}
          slotGap={10}
          stroke={CFT_COLOR.highRepulsion}
          transitionStyle={tStyle}
        />
        <text x={344} y={t2Y - 14} textAnchor="middle" fontSize={15} fill={CFT_COLOR.highRepulsion}>
          dxy, dyz, dxz
        </text>
        <text x={422} y={t2Y + 5} fontSize={17} fontWeight={700} fill={CFT_COLOR.highRepulsion}>
          t₂
        </text>

        {/* Lower e pair (-3/5 Δt) */}
        <OrbitalLevelSet
          cx={344}
          y={eY}
          slots={2}
          slotWidth={42}
          slotGap={14}
          stroke={CFT_COLOR.lowRepulsion}
          transitionStyle={tStyle}
        />
        <text x={344} y={eY + 24} textAnchor="middle" fontSize={15} fill={CFT_COLOR.lowRepulsion}>
          dx²−y², dz²
        </text>
        <text x={410} y={eY + 5} fontSize={17} fontWeight={700} fill={CFT_COLOR.lowRepulsion}>
          e
        </text>

        {/* Shift arrows */}
        <SplitDoubleArrow x={448} yTop={t2Y} yBottom={baryY} color={CFT_COLOR.highRepulsion} transitionStyle={tStyle} />
        <text x={458} y={(t2Y + baryY) / 2 + 5} fontSize={15} fontWeight={600} fill={CFT_COLOR.highRepulsion}>
          +2/5 Δt
        </text>

        <SplitDoubleArrow x={448} yTop={baryY} yBottom={eY} color={CFT_COLOR.lowRepulsion} transitionStyle={tStyle} />
        <text x={458} y={(baryY + eY) / 2 + 5} fontSize={15} fontWeight={600} fill={CFT_COLOR.lowRepulsion}>
          −3/5 Δt
        </text>

        {/* Total Δt arrow */}
        <SplitDoubleArrow x={262} yTop={t2Y} yBottom={eY} color={CFT_COLOR.fg} transitionStyle={tStyle} />
        <text x={272} y={eY - 26} fontSize={17} fontWeight={700} fill={CFT_COLOR.fg}>
          Δt
        </text>

        <rect x={24} y={392} width={492} height={46} rx={10} fill={CFT_COLOR.raised} stroke={CFT_COLOR.border} strokeWidth={1.2} />
        <text x={W / 2} y={420} textAnchor="middle" fontSize={15} fill={CFT_COLOR.muted}>
          3 × (+2/5 Δt) + 2 × (−3/5 Δt) = 0 (inverted relative to octahedral)
        </text>
      </svg>
    )
  }

  // Step 2: Side-by-side comparison to ONE exact vertical energy scale: Δt = (4/9) Δo
  const baryY = 232
  const octGap = 180
  const tetGap = Math.round(octGap * s.ratio) // 80 px

  const octEgY = baryY - s.octEgShift * octGap   // 232 - 108 = 124
  const octT2gY = baryY - s.octT2gShift * octGap // 232 + 72 = 304

  const tetT2Y = baryY - s.t2Shift * tetGap // 232 - 32 = 200
  const tetEY = baryY - s.eShift * tetGap   // 232 + 48 = 280

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label={s.ariaLabel}>
      <text x={W / 2} y={34} textAnchor="middle" fontSize={16} fontWeight={600} fill={CFT_COLOR.fg}>
        Same energy scale: octahedral vs tetrahedral
      </text>

      <EnergyAxis x={34} yTop={64} yBottom={352} />

      {/* Shared barycentre line */}
      <line x1={52} y1={baryY} x2={520} y2={baryY} stroke={CFT_COLOR.subtle} strokeWidth={1.5} strokeDasharray="6 5" />
      <text x={276} y={baryY - 8} textAnchor="middle" fontSize={15} fill={CFT_COLOR.muted}>
        Barycentre
      </text>

      {/* Left: Octahedral */}
      <text x={144} y={76} textAnchor="middle" fontSize={16} fontWeight={700} fill={CFT_COLOR.fg}>
        Octahedral (Δo)
      </text>
      <OrbitalLevelSet cx={144} y={octEgY} slots={2} slotWidth={34} slotGap={10} stroke={CFT_COLOR.highRepulsion} />
      <text x={196} y={octEgY + 5} fontSize={16} fontWeight={700} fill={CFT_COLOR.highRepulsion}>
        eg
      </text>
      <OrbitalLevelSet cx={144} y={octT2gY} slots={3} slotWidth={30} slotGap={8} stroke={CFT_COLOR.lowRepulsion} />
      <text x={208} y={octT2gY + 5} fontSize={16} fontWeight={700} fill={CFT_COLOR.lowRepulsion}>
        t₂g
      </text>
      <SplitDoubleArrow x={70} yTop={octEgY} yBottom={octT2gY} color={CFT_COLOR.fg} />
      <text x={80} y={octEgY + 34} fontSize={16} fontWeight={700} fill={CFT_COLOR.fg}>
        Δo
      </text>

      {/* Centre relation callout */}
      <rect x={232} y={136} width={114} height={40} rx={8} fill={CFT_COLOR.accentSoft} stroke={CFT_COLOR.accent} strokeWidth={1.4} />
      <text x={289} y={162} textAnchor="middle" fontSize={16} fontWeight={700} fill={CFT_COLOR.accent}>
        Δt = (4/9) Δo
      </text>

      {/* Right: Tetrahedral */}
      <text x={424} y={76} textAnchor="middle" fontSize={16} fontWeight={700} fill={CFT_COLOR.fg}>
        Tetrahedral (Δt)
      </text>
      <OrbitalLevelSet cx={424} y={tetT2Y} slots={3} slotWidth={30} slotGap={8} stroke={CFT_COLOR.highRepulsion} />
      <text x={488} y={tetT2Y + 5} fontSize={16} fontWeight={700} fill={CFT_COLOR.highRepulsion}>
        t₂
      </text>
      <OrbitalLevelSet cx={424} y={tetEY} slots={2} slotWidth={34} slotGap={10} stroke={CFT_COLOR.lowRepulsion} />
      <text x={476} y={tetEY + 5} fontSize={16} fontWeight={700} fill={CFT_COLOR.lowRepulsion}>
        e
      </text>
      <SplitDoubleArrow x={352} yTop={tetT2Y} yBottom={tetEY} color={CFT_COLOR.fg} />
      <text x={342} y={(tetT2Y + tetEY) / 2 + 5} textAnchor="end" fontSize={16} fontWeight={700} fill={CFT_COLOR.fg}>
        Δt
      </text>

      {/* Bottom takeaway */}
      <rect x={24} y={376} width={492} height={62} rx={10} fill={CFT_COLOR.raised} stroke={CFT_COLOR.border} strokeWidth={1.2} />
      <text x={W / 2} y={401} textAnchor="middle" fontSize={15} fontWeight={600} fill={CFT_COLOR.fg}>
        Δt is less than half of Δo for the same metal and ligands
      </text>
      <text x={W / 2} y={424} textAnchor="middle" fontSize={15} fill={CFT_COLOR.muted}>
        Rarely exceeds P, so tetrahedral complexes are almost always high spin
      </text>
    </svg>
  )
}
