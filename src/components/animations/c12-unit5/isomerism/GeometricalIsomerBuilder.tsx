'use client'

import { useEffect, useState } from 'react'
import { geometricStepVisual } from './isomer-steps'
import {
  OctahedralComplex,
  SquarePlanarComplex,
  TONE,
  TetrahedralComplex,
  type LigandStyle,
} from './ComplexDiagrams'

export interface GeometricalIsomerBuilderProps {
  step: number
  reducedMotion: boolean
}

const W = 540
const H = 450

const LIG_X: LigandStyle = { label: 'X', fill: TONE.x }
const LIG_L: LigandStyle = { label: 'L', fill: TONE.l }
const LIG_A: LigandStyle = { label: 'A', fill: TONE.a }
const LIG_B: LigandStyle = { label: 'B', fill: TONE.b }
const LIG_a: LigandStyle = { label: 'a', fill: TONE.x }
const LIG_b: LigandStyle = { label: 'b', fill: TONE.l }
const LIG_N: LigandStyle = { label: 'N', fill: TONE.en }

function StepSquareCisTrans() {
  return (
    <g>
      <text x={W / 2} y={32} textAnchor="middle" fontSize={18} fontWeight={700} fill={TONE.fg}>
        Square planar [MX2L2]
      </text>
      <text x={W / 2} y={56} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        Example: [Pt(NH3)2Cl2] (NCERT Fig. 5.2)
      </text>

      {/* Left card: cis */}
      <rect x={20} y={76} width={240} height={310} rx={12} fill={TONE.raised} stroke={TONE.guide} strokeWidth={1.5} />
      <SquarePlanarComplex
        cx={140}
        cy={220}
        radius={58}
        metal="Pt"
        ligands={[LIG_X, LIG_X, LIG_L, LIG_L]}
        highlightPair={[0, 1]}
        angleLabel="90 deg"
        fontSize={16}
      />
      <text x={140} y={342} textAnchor="middle" fontSize={18} fontWeight={700} fill={TONE.fg}>
        cis
      </text>
      <text x={140} y={366} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        Two X on adjacent corners
      </text>

      {/* Right card: trans */}
      <rect x={280} y={76} width={240} height={310} rx={12} fill={TONE.raised} stroke={TONE.guide} strokeWidth={1.5} />
      <SquarePlanarComplex
        cx={400}
        cy={220}
        radius={58}
        metal="Pt"
        ligands={[LIG_X, LIG_L, LIG_X, LIG_L]}
        highlightPair={[0, 2]}
        angleLabel="180 deg"
        fontSize={16}
      />
      <text x={400} y={342} textAnchor="middle" fontSize={18} fontWeight={700} fill={TONE.fg}>
        trans
      </text>
      <text x={400} y={366} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        Two X on opposite corners
      </text>

      <text x={W / 2} y={422} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        Green = X (Cl), Blue = L (NH3)
      </text>
    </g>
  )
}

function StepSquareMabxl() {
  const configs: ReadonlyArray<{
    cx: number
    ligands: readonly [LigandStyle, LigandStyle, LigandStyle, LigandStyle]
    caption: string
    opp: string
  }> = [
    { cx: 96, ligands: [LIG_A, LIG_B, LIG_X, LIG_L], caption: 'cis', opp: 'A opp X' },
    { cx: 270, ligands: [LIG_A, LIG_X, LIG_B, LIG_L], caption: 'cis', opp: 'A opp B' },
    { cx: 444, ligands: [LIG_A, LIG_B, LIG_L, LIG_X], caption: 'trans', opp: 'A opp L' },
  ]

  return (
    <g>
      <text x={24} y={34} fontSize={18} fontWeight={700} fill={TONE.fg}>
        Square planar [MABXL]
      </text>
      <rect x={392} y={14} width={128} height={32} rx={16} fill={TONE.accent} fillOpacity={0.14} stroke={TONE.accent} strokeWidth={1.6} />
      <text x={456} y={36} textAnchor="middle" fontSize={16} fontWeight={700} fill={TONE.accent}>
        Count: 3
      </text>
      <text x={24} y={62} fontSize={16} fill={TONE.muted}>
        Fix A at top-left and pick which partner sits opposite A
      </text>

      {configs.map((cfg, idx) => (
        <g key={idx}>
          <rect
            x={cfg.cx - 80}
            y={86}
            width={160}
            height={286}
            rx={12}
            fill={TONE.raised}
            stroke={TONE.guide}
            strokeWidth={1.5}
          />
          <SquarePlanarComplex
            cx={cfg.cx}
            cy={208}
            radius={44}
            metal="M"
            ligands={cfg.ligands}
            highlightPair={[0, 2]}
            fontSize={16}
          />
          <text x={cfg.cx} y={322} textAnchor="middle" fontSize={18} fontWeight={700} fill={TONE.fg}>
            {cfg.caption}
          </text>
          <text x={cfg.cx} y={348} textAnchor="middle" fontSize={16} fill={TONE.muted}>
            {cfg.opp}
          </text>
        </g>
      ))}

      <text x={W / 2} y={414} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        Three distinct partners opposite A give two cis and one trans isomer.
      </text>
    </g>
  )
}

function StepTetrahedral({ reducedMotion }: { reducedMotion: boolean }) {
  const [yaw, setYaw] = useState(24)

  useEffect(() => {
    if (reducedMotion) return
    let raf = 0
    let start: number | null = null
    const tick = (t: number) => {
      if (start === null) start = t
      const elapsed = (t - start) / 1000
      setYaw(24 + Math.sin(elapsed * 0.9) * 55)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reducedMotion])

  return (
    <g>
      <text x={W / 2} y={32} textAnchor="middle" fontSize={18} fontWeight={700} fill={TONE.fg}>
        Tetrahedral [MX2L2]
      </text>
      <text x={W / 2} y={56} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        Rotating returns the same relative arrangement
      </text>

      {/* Left: rotating tetrahedron */}
      <rect x={18} y={76} width={258} height={290} rx={12} fill={TONE.raised} stroke={TONE.guide} strokeWidth={1.5} />
      <TetrahedralComplex
        cx={147}
        cy={218}
        radius={76}
        metal="M"
        ligands={[LIG_X, LIG_X, LIG_L, LIG_L]}
        yawDeg={yaw}
        pitchDeg={14}
        fontSize={16}
      />
      <text x={147} y={346} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        3D rotation gives same isomer
      </text>

      {/* Right: all 6 vertex pairs joined */}
      <rect x={290} y={76} width={232} height={290} rx={12} fill={TONE.raised} stroke={TONE.guide} strokeWidth={1.5} />
      <TetrahedralComplex
        cx={406}
        cy={212}
        radius={70}
        metal="M"
        ligands={[LIG_X, LIG_X, LIG_L, LIG_L]}
        yawDeg={18}
        pitchDeg={16}
        showAllEdges
        fontSize={16}
      />
      <text x={406} y={322} textAnchor="middle" fontSize={16} fontWeight={700} fill={TONE.fg}>
        6 of 6 pairs adjacent
      </text>
      <text x={406} y={346} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        Every angle is 109.5 deg
      </text>

      {/* Bottom note */}
      <rect x={100} y={386} width={340} height={44} rx={10} fill={TONE.caution} fillOpacity={0.14} stroke={TONE.caution} strokeWidth={1.6} />
      <text x={W / 2} y={414} textAnchor="middle" fontSize={17} fontWeight={700} fill={TONE.fg}>
        No geometrical isomers
      </text>
    </g>
  )
}

function StepOctaCisTrans() {
  return (
    <g>
      <text x={W / 2} y={28} textAnchor="middle" fontSize={17} fontWeight={700} fill={TONE.fg}>
        Octahedral [MX2L4] and [MX2(L-L)2]
      </text>

      {/* Top row: [MX2L4] */}
      <rect x={16} y={42} width={248} height={192} rx={10} fill={TONE.raised} stroke={TONE.guide} strokeWidth={1.4} />
      <OctahedralComplex
        cx={140}
        cy={124}
        radius={56}
        metal="Co"
        ligands={[LIG_X, LIG_L, LIG_L, LIG_X, LIG_L, LIG_L]}
        highlightPair={[0, 3]}
        fontSize={16}
      />
      <text x={140} y={222} textAnchor="middle" fontSize={16} fontWeight={700} fill={TONE.fg}>
        cis-[MX2L4] (90 deg)
      </text>

      <rect x={276} y={42} width={248} height={192} rx={10} fill={TONE.raised} stroke={TONE.guide} strokeWidth={1.4} />
      <OctahedralComplex
        cx={400}
        cy={124}
        radius={56}
        metal="Co"
        ligands={[LIG_X, LIG_X, LIG_L, LIG_L, LIG_L, LIG_L]}
        highlightPair={[0, 1]}
        fontSize={16}
      />
      <text x={400} y={222} textAnchor="middle" fontSize={16} fontWeight={700} fill={TONE.fg}>
        trans-[MX2L4] (180 deg)
      </text>

      {/* Bottom row: [MX2(L-L)2] with en arcs */}
      <rect x={16} y={246} width={248} height={192} rx={10} fill={TONE.raised} stroke={TONE.guide} strokeWidth={1.4} />
      <OctahedralComplex
        cx={140}
        cy={328}
        radius={54}
        metal="Co"
        ligands={[LIG_X, LIG_N, LIG_N, LIG_X, LIG_N, LIG_N]}
        chelates={[
          { from: 1, to: 2, label: 'en' },
          { from: 4, to: 5, label: 'en' },
        ]}
        fontSize={16}
      />
      <text x={140} y={426} textAnchor="middle" fontSize={16} fontWeight={700} fill={TONE.fg}>
        cis-[MX2(en)2]
      </text>

      <rect x={276} y={246} width={248} height={192} rx={10} fill={TONE.raised} stroke={TONE.guide} strokeWidth={1.4} />
      <OctahedralComplex
        cx={400}
        cy={328}
        radius={54}
        metal="Co"
        ligands={[LIG_X, LIG_X, LIG_N, LIG_N, LIG_N, LIG_N]}
        chelates={[
          { from: 2, to: 3, label: 'en' },
          { from: 4, to: 5, label: 'en' },
        ]}
        fontSize={16}
      />
      <text x={400} y={426} textAnchor="middle" fontSize={16} fontWeight={700} fill={TONE.fg}>
        trans-[MX2(en)2]
      </text>
    </g>
  )
}

function StepFacMer() {
  return (
    <g>
      <text x={W / 2} y={32} textAnchor="middle" fontSize={18} fontWeight={700} fill={TONE.fg}>
        Octahedral [Ma3b3]: fac and mer
      </text>
      <text x={W / 2} y={56} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        Example: [Co(NH3)3(NO2)3] (NCERT Fig. 5.5)
      </text>

      {/* Left: fac */}
      <rect x={18} y={76} width={244} height={316} rx={12} fill={TONE.raised} stroke={TONE.guide} strokeWidth={1.5} />
      <OctahedralComplex
        cx={140}
        cy={214}
        radius={74}
        metal="Co"
        ligands={[LIG_a, LIG_b, LIG_a, LIG_a, LIG_b, LIG_b]}
        shadedFace={[0, 2, 3]}
        fontSize={16}
      />
      <text x={140} y={342} textAnchor="middle" fontSize={18} fontWeight={700} fill={TONE.fg}>
        fac (facial)
      </text>
      <text x={140} y={368} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        Three a on one face
      </text>

      {/* Right: mer */}
      <rect x={278} y={76} width={244} height={316} rx={12} fill={TONE.raised} stroke={TONE.guide} strokeWidth={1.5} />
      <OctahedralComplex
        cx={400}
        cy={214}
        radius={74}
        metal="Co"
        ligands={[LIG_a, LIG_a, LIG_b, LIG_a, LIG_b, LIG_b]}
        meridianTriple={[0, 3, 1]}
        fontSize={16}
      />
      <text x={400} y={342} textAnchor="middle" fontSize={18} fontWeight={700} fill={TONE.fg}>
        mer (meridional)
      </text>
      <text x={400} y={368} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        Three a along meridian
      </text>

      <text x={W / 2} y={424} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        Green = a (NH3), Blue = b (NO2)
      </text>
    </g>
  )
}

export function GeometricalIsomerBuilder({ step, reducedMotion }: GeometricalIsomerBuilderProps) {
  const visual = geometricStepVisual(step)
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label="Geometrical isomerism in square planar MX2L2 and MABXL, tetrahedral MX2L2, octahedral MX2L4 and MX2(L-L)2, and fac/mer Ma3b3 complexes"
      style={{ display: 'block' }}
    >
      {visual === 'sq-cis-trans' && <StepSquareCisTrans />}
      {visual === 'sq-mabxl' && <StepSquareMabxl />}
      {visual === 'tetrahedral' && <StepTetrahedral reducedMotion={reducedMotion} />}
      {visual === 'oct-cis-trans' && <StepOctaCisTrans />}
      {visual === 'oct-fac-mer' && <StepFacMer />}
    </svg>
  )
}
