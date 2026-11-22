'use client'

import React from 'react'
import {
  CFT_COLOR,
  DOrbitalIcon,
  EnergyAxis,
  OrbitalLevelSet,
  SplitDoubleArrow,
} from './cft-svg-helpers'
import { octahedralStepState } from './cft-octahedral-steps'

export interface CftOctahedralSplittingProps {
  step: number
  reducedMotion: boolean
}

const W = 540
const H = 456

/**
 * Left schematic: spherical field (step 0) transitioning to 6 octahedral ligands on +-x, +-y, +-z (steps 1-3).
 */
function OctahedralGeometryPanel({
  showSphere,
  ligandProgress,
  highlightRepulsion,
  reducedMotion,
}: {
  showSphere: boolean
  ligandProgress: number
  highlightRepulsion: boolean
  reducedMotion: boolean
}) {
  const cx = 114
  const cy = 224
  const tStyle: React.CSSProperties | undefined = reducedMotion
    ? undefined
    : { transition: 'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease' }

  // 3D-projected octahedral ligand positions around (cx, cy):
  // +z (top), -z (bottom), +x (front-right), -x (back-left), +y (back-right), -y (front-left)
  const verts = [
    { id: '+z', dx: 0, dy: -66, label: '+z' },
    { id: '-z', dx: 0, dy: 66, label: '-z' },
    { id: '+x', dx: 54, dy: 20, label: '+x' },
    { id: '-x', dx: -54, dy: -20, label: '-x' },
    { id: '+y', dx: 48, dy: -22, label: '+y' },
    { id: '-y', dx: -48, dy: 22, label: '-y' },
  ]

  const slideFactor = 1 + (1 - ligandProgress) * 0.45

  return (
    <g>
      <text x={cx} y={36} textAnchor="middle" fontSize={16} fontWeight={600} fill={CFT_COLOR.fg}>
        {showSphere ? 'Spherical field' : 'Octahedral field'}
      </text>

      {/* Spherical negative charge shell (Step 0) */}
      <g opacity={showSphere ? 1 : 0} style={tStyle}>
        <circle
          cx={cx}
          cy={cy}
          r={76}
          fill={CFT_COLOR.ligand}
          fillOpacity={0.11}
          stroke={CFT_COLOR.ligand}
          strokeWidth={2}
          strokeDasharray="6 5"
        />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
          const rad = (deg * Math.PI) / 180
          const px = cx + 76 * Math.cos(rad)
          const py = cy + 76 * Math.sin(rad)
          return (
            <g key={deg}>
              <circle cx={px} cy={py} r={8.5} fill={CFT_COLOR.surface} stroke={CFT_COLOR.ligand} strokeWidth={1.5} />
              <text x={px} y={py + 5} textAnchor="middle" fontSize={15} fontWeight={700} fill={CFT_COLOR.ligand}>
                −
              </text>
            </g>
          )
        })}
        <text x={cx} y={336} textAnchor="middle" fontSize={15} fill={CFT_COLOR.muted}>
          Uniform negative
        </text>
        <text x={cx} y={356} textAnchor="middle" fontSize={15} fill={CFT_COLOR.muted}>
          shell around Mⁿ⁺
        </text>
      </g>

      {/* Octahedral axes, equatorial square, and 6 ligands (Steps 1-3) */}
      <g opacity={ligandProgress > 0 ? 1 : 0} style={tStyle}>
        {/* Subtle equatorial plane */}
        <polygon
          points={`${cx + 54},${cy + 20} ${cx + 48},${cy - 22} ${cx - 54},${cy - 20} ${cx - 48},${cy + 22}`}
          fill={CFT_COLOR.accentSoft}
          stroke={CFT_COLOR.subtle}
          strokeWidth={1.2}
          strokeDasharray="4 3"
        />
        {/* Axes through metal */}
        {verts.map((v) => (
          <line
            key={`ax-${v.id}`}
            x1={cx}
            y1={cy}
            x2={cx + v.dx}
            y2={cy + v.dy}
            stroke={highlightRepulsion ? CFT_COLOR.highRepulsion : CFT_COLOR.subtle}
            strokeWidth={highlightRepulsion ? 2.2 : 1.5}
            strokeOpacity={highlightRepulsion ? 0.85 : 0.75}
          />
        ))}

        {/* Repulsion highlight lobes on axes in Step 1 */}
        {highlightRepulsion && (
          <g>
            <ellipse
              cx={cx}
              cy={cy - 34}
              rx={10}
              ry={22}
              fill={CFT_COLOR.highRepulsion}
              fillOpacity={0.32}
              stroke={CFT_COLOR.highRepulsion}
              strokeWidth={1.6}
            />
            <ellipse
              cx={cx}
              cy={cy + 34}
              rx={10}
              ry={22}
              fill={CFT_COLOR.highRepulsion}
              fillOpacity={0.32}
              stroke={CFT_COLOR.highRepulsion}
              strokeWidth={1.6}
            />
            <ellipse
              cx={cx + 28}
              cy={cy + 10}
              rx={20}
              ry={9}
              fill={CFT_COLOR.highRepulsion}
              fillOpacity={0.32}
              stroke={CFT_COLOR.highRepulsion}
              strokeWidth={1.6}
              transform={`rotate(20, ${cx + 28}, ${cy + 10})`}
            />
            <ellipse
              cx={cx - 28}
              cy={cy - 10}
              rx={20}
              ry={9}
              fill={CFT_COLOR.highRepulsion}
              fillOpacity={0.32}
              stroke={CFT_COLOR.highRepulsion}
              strokeWidth={1.6}
              transform={`rotate(20, ${cx - 28}, ${cy - 10})`}
            />
          </g>
        )}

        {/* Six ligand spheres */}
        {verts.map((v) => {
          const lx = cx + v.dx * slideFactor
          const ly = cy + v.dy * slideFactor
          return (
            <g key={`lig-${v.id}`} transform={`translate(${lx}, ${ly})`} style={tStyle}>
              <circle r={12.5} fill={CFT_COLOR.ligand} fillOpacity={0.2} stroke={CFT_COLOR.ligand} strokeWidth={2} />
              <text x={0} y={5} textAnchor="middle" fontSize={15} fontWeight={700} fill={CFT_COLOR.ligand}>
                L
              </text>
            </g>
          )
        })}

        <text x={cx} y={336} textAnchor="middle" fontSize={15} fill={CFT_COLOR.muted}>
          6 ligands along
        </text>
        <text x={cx} y={356} textAnchor="middle" fontSize={15} fill={CFT_COLOR.muted}>
          ±x, ±y, ±z axes
        </text>
      </g>

      {/* Central metal ion Mⁿ⁺ */}
      <circle cx={cx} cy={cy} r={19} fill={CFT_COLOR.metal} fillOpacity={0.24} stroke={CFT_COLOR.metal} strokeWidth={2.2} />
      <text x={cx} y={cy + 5.5} textAnchor="middle" fontSize={16} fontWeight={700} fill={CFT_COLOR.fg}>
        M
      </text>
    </g>
  )
}

export function CftOctahedralSplitting({ step, reducedMotion }: CftOctahedralSplittingProps) {
  const s = octahedralStepState(step)
  const tStyle: React.CSSProperties | undefined = reducedMotion
    ? undefined
    : { transition: 'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.4s ease' }

  const baryY = 236
  const fullGap = 175 // px for Δo
  const egY = baryY - s.splitFraction * s.egShift * fullGap
  const t2gY = baryY - s.splitFraction * s.t2gShift * fullGap // t2gShift is -0.4, so +0.4 * fullGap

  const diagCx = 360

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" role="img" aria-label={s.ariaLabel}>
      {/* Left: geometry panel */}
      <OctahedralGeometryPanel
        showSphere={s.showSphere}
        ligandProgress={s.ligandProgress}
        highlightRepulsion={s.highlightRepulsion}
        reducedMotion={reducedMotion}
      />

      {/* Divider */}
      <line x1={212} y1={28} x2={212} y2={382} stroke={CFT_COLOR.border} strokeWidth={1.2} />

      {/* Right: Energy level diagram */}
      <EnergyAxis x={238} yTop={56} yBottom={360} />

      {/* Step 0: Degenerate 5 d-orbitals */}
      {s.kind === 'spherical' && (
        <g>
          <text x={diagCx} y={36} textAnchor="middle" fontSize={16} fontWeight={600} fill={CFT_COLOR.fg}>
            Five degenerate d orbitals
          </text>
          <line x1={256} y1={baryY} x2={514} y2={baryY} stroke={CFT_COLOR.subtle} strokeWidth={1.5} strokeDasharray="5 4" />
          <OrbitalLevelSet cx={385} y={baryY} slots={5} slotWidth={36} slotGap={10} stroke={CFT_COLOR.fg} />
          {/* Five d-orbital icons above the degenerate line */}
          <DOrbitalIcon cx={293} cy={176} r={16} angleDeg={45} color={CFT_COLOR.lowRepulsion} />
          <DOrbitalIcon cx={339} cy={176} r={16} angleDeg={45} color={CFT_COLOR.lowRepulsion} />
          <DOrbitalIcon cx={385} cy={176} r={16} angleDeg={45} color={CFT_COLOR.lowRepulsion} />
          <DOrbitalIcon cx={431} cy={176} r={16} angleDeg={0} color={CFT_COLOR.highRepulsion} />
          <DOrbitalIcon cx={477} cy={176} r={16} variant="dz2" color={CFT_COLOR.highRepulsion} />

          <text x={385} y={266} textAnchor="middle" fontSize={15} fill={CFT_COLOR.muted}>
            dxy, dyz, dxz, dx²−y², dz²
          </text>
          <text x={385} y={294} textAnchor="middle" fontSize={15} fill={CFT_COLOR.fg}>
            All five sit at the same energy
          </text>
        </g>
      )}

      {/* Step 1: Six ligands arrive - repulsion comparison */}
      {s.kind === 'ligands-arrive' && (
        <g>
          <text x={382} y={36} textAnchor="middle" fontSize={16} fontWeight={600} fill={CFT_COLOR.fg}>
            Two repulsion groups
          </text>

          {/* Upper card: axis-pointing orbitals */}
          <rect
            x={258}
            y={64}
            width={262}
            height={128}
            rx={10}
            fill={CFT_COLOR.highRepulsion}
            fillOpacity={0.09}
            stroke={CFT_COLOR.highRepulsion}
            strokeWidth={1.6}
          />
          <DOrbitalIcon cx={304} cy={112} r={20} angleDeg={0} color={CFT_COLOR.highRepulsion} />
          <DOrbitalIcon cx={358} cy={112} r={20} variant="dz2" color={CFT_COLOR.highRepulsion} />
          <text x={392} y={104} fontSize={16} fontWeight={700} fill={CFT_COLOR.highRepulsion}>
            dx²−y², dz²
          </text>
          <text x={392} y={126} fontSize={15} fill={CFT_COLOR.fg}>
            Along axes
          </text>
          <text x={389} y={172} textAnchor="middle" fontSize={15} fontWeight={600} fill={CFT_COLOR.highRepulsion}>
            Strong repulsion: energy rises
          </text>

          {/* Lower card: in-between orbitals */}
          <rect
            x={258}
            y={214}
            width={262}
            height={136}
            rx={10}
            fill={CFT_COLOR.lowRepulsion}
            fillOpacity={0.09}
            stroke={CFT_COLOR.lowRepulsion}
            strokeWidth={1.6}
          />
          <DOrbitalIcon cx={294} cy={262} r={18} angleDeg={45} color={CFT_COLOR.lowRepulsion} />
          <DOrbitalIcon cx={336} cy={262} r={18} angleDeg={45} color={CFT_COLOR.lowRepulsion} />
          <DOrbitalIcon cx={378} cy={262} r={18} angleDeg={45} color={CFT_COLOR.lowRepulsion} />
          <text x={406} y={254} fontSize={16} fontWeight={700} fill={CFT_COLOR.lowRepulsion}>
            dxy, dyz, dxz
          </text>
          <text x={406} y={276} fontSize={15} fill={CFT_COLOR.fg}>
            Between axes
          </text>
          <text x={389} y={326} textAnchor="middle" fontSize={15} fontWeight={600} fill={CFT_COLOR.lowRepulsion}>
            Weak repulsion: energy drops
          </text>
        </g>
      )}

      {/* Steps 2 & 3: Split levels + optional shift balance brackets */}
      {(s.kind === 'levels-split' || s.kind === 'energy-balance') && (
        <g>
          <text x={382} y={36} textAnchor="middle" fontSize={16} fontWeight={600} fill={CFT_COLOR.fg}>
            {s.showShiftBrackets ? 'Barycentre energy balance' : 'Octahedral splitting (Δo)'}
          </text>

          {/* Dashed barycentre line */}
          <line x1={256} y1={baryY} x2={516} y2={baryY} stroke={CFT_COLOR.subtle} strokeWidth={1.6} strokeDasharray="6 5" />
          <text x={346} y={baryY - 8} textAnchor="middle" fontSize={15} fill={CFT_COLOR.muted}>
            Barycentre
          </text>

          {/* Upper eg level (+3/5 Δo) */}
          <OrbitalLevelSet
            cx={346}
            y={egY}
            slots={2}
            slotWidth={42}
            slotGap={12}
            stroke={CFT_COLOR.highRepulsion}
            transitionStyle={tStyle}
          />
          <text x={346} y={egY - 14} textAnchor="middle" fontSize={15} fill={CFT_COLOR.highRepulsion}>
            dx²−y², dz²
          </text>
          <text x={410} y={egY + 5} fontSize={17} fontWeight={700} fill={CFT_COLOR.highRepulsion}>
            eg
          </text>

          {/* Lower t2g level (-2/5 Δo) */}
          <OrbitalLevelSet
            cx={346}
            y={t2gY}
            slots={3}
            slotWidth={36}
            slotGap={10}
            stroke={CFT_COLOR.lowRepulsion}
            transitionStyle={tStyle}
          />
          <text x={346} y={t2gY + 24} textAnchor="middle" fontSize={15} fill={CFT_COLOR.lowRepulsion}>
            dxy, dyz, dxz
          </text>
          <text x={426} y={t2gY + 5} fontSize={17} fontWeight={700} fill={CFT_COLOR.lowRepulsion}>
            t₂g
          </text>

          {/* Shift arrows from barycentre */}
          <SplitDoubleArrow x={450} yTop={egY} yBottom={baryY} color={CFT_COLOR.highRepulsion} transitionStyle={tStyle} />
          <text x={460} y={(egY + baryY) / 2 + 5} fontSize={15} fontWeight={600} fill={CFT_COLOR.highRepulsion}>
            +3/5 Δo
          </text>

          <SplitDoubleArrow x={450} yTop={baryY} yBottom={t2gY} color={CFT_COLOR.lowRepulsion} transitionStyle={tStyle} />
          <text x={460} y={(baryY + t2gY) / 2 + 5} fontSize={15} fontWeight={600} fill={CFT_COLOR.lowRepulsion}>
            −2/5 Δo
          </text>

          {/* Total Δo double arrow on the left of the levels */}
          <SplitDoubleArrow x={264} yTop={egY} yBottom={t2gY} color={CFT_COLOR.fg} transitionStyle={tStyle} />
          <text x={274} y={egY + 34} fontSize={17} fontWeight={700} fill={CFT_COLOR.fg}>
            Δo
          </text>
        </g>
      )}

      {/* Bottom summary bar */}
      {s.showShiftBrackets ? (
        <g>
          <rect
            x={24}
            y={390}
            width={492}
            height={52}
            rx={10}
            fill={CFT_COLOR.raised}
            stroke={CFT_COLOR.border}
            strokeWidth={1.2}
          />
          <text x={W / 2} y={412} textAnchor="middle" fontSize={15} fontWeight={600} fill={CFT_COLOR.fg}>
            2 × (+3/5 Δo) + 3 × (−2/5 Δo) = +6/5 Δo − 6/5 Δo = 0
          </text>
          <text x={W / 2} y={434} textAnchor="middle" fontSize={15} fill={CFT_COLOR.muted}>
            Total shift is zero: the average energy is conserved
          </text>
        </g>
      ) : (
        <g>
          <rect
            x={24}
            y={396}
            width={492}
            height={44}
            rx={10}
            fill={CFT_COLOR.raised}
            stroke={CFT_COLOR.border}
            strokeWidth={1.2}
          />
          <text x={W / 2} y={423} textAnchor="middle" fontSize={15} fill={CFT_COLOR.muted}>
            {s.kind === 'spherical' && 'Spherical field raises all 5 d orbitals equally (degenerate)'}
            {s.kind === 'ligands-arrive' && 'Six point charges break spherical symmetry into two sets'}
            {s.kind === 'levels-split' && 'Octahedral splitting: eg rises by 3/5 Δo, t₂g drops by 2/5 Δo'}
          </text>
        </g>
      )}
    </svg>
  )
}
