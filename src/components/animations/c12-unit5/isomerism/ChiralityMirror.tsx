'use client'

import { useEffect, useState } from 'react'
import { chiralityStepVisual } from './isomer-steps'
import { OctahedralComplex, TONE, type ChelateArcSpec, type LigandStyle } from './ComplexDiagrams'

export interface ChiralityMirrorProps {
  step: number
  reducedMotion: boolean
}

const W = 540
const H = 450

const LIG_N: LigandStyle = { label: 'N', fill: TONE.en }
const LIG_CL: LigandStyle = { label: 'Cl', fill: TONE.x }

const TRIS_LIGANDS: readonly [LigandStyle, LigandStyle, LigandStyle, LigandStyle, LigandStyle, LigandStyle] = [
  LIG_N, LIG_N, LIG_N, LIG_N, LIG_N, LIG_N,
]

/** Three en arcs spanning adjacent vertices in a clockwise propeller twist. */
const TRIS_CHELATES: readonly ChelateArcSpec[] = [
  { from: 0, to: 2, label: 'en' },
  { from: 3, to: 4, label: 'en' },
  { from: 1, to: 5, label: 'en' },
]

function StepPropellers() {
  return (
    <g>
      <text x={W / 2} y={32} textAnchor="middle" fontSize={18} fontWeight={700} fill={TONE.fg}>
        Optical isomers of [Co(en)₃]³⁺
      </text>
      <text x={W / 2} y={56} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        Mirror-image propellers (NCERT Fig. 5.6)
      </text>

      {/* Left propeller: d */}
      <OctahedralComplex
        cx={134}
        cy={226}
        radius={72}
        metal="Co"
        ligands={TRIS_LIGANDS}
        chelates={TRIS_CHELATES}
        fontSize={16}
      />
      <text x={134} y={350} textAnchor="middle" fontSize={18} fontWeight={700} fill={TONE.fg}>
        d (dextro)
      </text>
      <text x={134} y={374} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        Clockwise twist
      </text>

      {/* Central mirror line */}
      <line x1={W / 2} y1={84} x2={W / 2} y2={376} stroke={TONE.accent} strokeWidth={2.4} strokeDasharray="8 6" />
      <rect x={W / 2 - 38} y={84} width={76} height={28} rx={14} fill={TONE.surface} stroke={TONE.accent} strokeWidth={1.6} />
      <text x={W / 2} y={104} textAnchor="middle" fontSize={16} fontWeight={700} fill={TONE.accent}>
        Mirror
      </text>

      {/* Right propeller: l */}
      <OctahedralComplex
        cx={406}
        cy={226}
        radius={72}
        metal="Co"
        ligands={TRIS_LIGANDS}
        chelates={TRIS_CHELATES}
        mirrored
        fontSize={16}
      />
      <text x={406} y={350} textAnchor="middle" fontSize={18} fontWeight={700} fill={TONE.fg}>
        l (laevo)
      </text>
      <text x={406} y={374} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        Anticlockwise twist
      </text>

      <text x={W / 2} y={420} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        Three didentate en rings wrap round Co in opposite senses.
      </text>
    </g>
  )
}

function StepSuperimpose({ reducedMotion }: { reducedMotion: boolean }) {
  const [phase, setPhase] = useState(1)

  useEffect(() => {
    if (reducedMotion) return
    let raf = 0
    let start: number | null = null
    const tick = (t: number) => {
      if (start === null) start = t
      const s = ((t - start) / 1000) % 4
      // Slide across over 1.5s, hold overlapped for 2.5s
      setPhase(s < 1.5 ? s / 1.5 : 1)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reducedMotion])

  const ghostX = 136 + phase * (382 - 136)
  const mismatchChelates: readonly ChelateArcSpec[] = TRIS_CHELATES.map((c, idx) => ({
    ...c,
    highlight: idx !== 1,
    tone: idx !== 1 ? TONE.enMismatch : TONE.en,
  }))

  return (
    <g>
      <text x={W / 2} y={32} textAnchor="middle" fontSize={18} fontWeight={700} fill={TONE.fg}>
        Try to superimpose d onto l
      </text>
      <text x={W / 2} y={56} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        Slide and rotate: the en rings fail to match
      </text>

      {/* Left origin outline */}
      <OctahedralComplex
        cx={136}
        cy={216}
        radius={66}
        metal="Co"
        ligands={TRIS_LIGANDS}
        chelates={TRIS_CHELATES}
        opacity={0.35}
        fontSize={16}
      />

      {/* Slide arrow */}
      <line x1={210} y1={216} x2={290} y2={216} stroke={TONE.accent} strokeWidth={2.4} strokeDasharray="5 4" />
      <polygon points="296,216 284,209 284,223" fill={TONE.accent} />

      {/* Target l complex */}
      <OctahedralComplex
        cx={382}
        cy={216}
        radius={66}
        metal="Co"
        ligands={TRIS_LIGANDS}
        chelates={TRIS_CHELATES}
        mirrored
        fontSize={16}
      />

      {/* Sliding translucent copy of d with glowing mismatched arcs */}
      <OctahedralComplex
        cx={ghostX}
        cy={216}
        radius={66}
        metal="Co"
        ligands={TRIS_LIGANDS}
        chelates={mismatchChelates}
        opacity={0.78}
        fontSize={16}
      />

      {/* Result banner */}
      <rect x={86} y={356} width={368} height={58} rx={12} fill={TONE.enMismatch} fillOpacity={0.14} stroke={TONE.enMismatch} strokeWidth={1.8} />
      <text x={W / 2} y={382} textAnchor="middle" fontSize={18} fontWeight={700} fill={TONE.fg}>
        Not superimposable: chiral
      </text>
      <text x={W / 2} y={404} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        Glowing arcs clash however you rotate the copy
      </text>
    </g>
  )
}

function PolarimeterCell({
  cx,
  title,
  angleDeg,
  readout,
  tone,
}: {
  cx: number
  title: string
  angleDeg: number
  readout: string
  tone: string
}) {
  const cy = 266
  const r = 46
  const rad = ((angleDeg - 90) * Math.PI) / 180
  const dx = Math.cos(rad) * (r - 8)
  const dy = Math.sin(rad) * (r - 8)
  return (
    <g>
      <rect x={cx - 76} y={144} width={152} height={248} rx={12} fill={TONE.raised} stroke={TONE.guide} strokeWidth={1.5} />
      <text x={cx} y={176} textAnchor="middle" fontSize={17} fontWeight={700} fill={TONE.fg}>
        {title}
      </text>
      {/* Dial circle */}
      <circle cx={cx} cy={cy} r={r} fill={TONE.surface} stroke={TONE.bond} strokeWidth={1.8} />
      {/* Incident vertical plane */}
      <line x1={cx} y1={cy - r + 6} x2={cx} y2={cy + r - 6} stroke={TONE.muted} strokeWidth={1.8} strokeDasharray="4 4" />
      {/* Rotated plane */}
      <line x1={cx - dx} y1={cy - dy} x2={cx + dx} y2={cy + dy} stroke={tone} strokeWidth={3.4} strokeLinecap="round" />
      <circle cx={cx + dx} cy={cy + dy} r={4.5} fill={tone} />
      <text x={cx} y={344} textAnchor="middle" fontSize={17} fontWeight={700} fill={tone}>
        {readout}
      </text>
      <text x={cx} y={372} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        {angleDeg === 0 ? 'Unrotated' : angleDeg > 0 ? 'Tilts right' : 'Tilts left'}
      </text>
    </g>
  )
}

function StepPolarimeter() {
  return (
    <g>
      <text x={W / 2} y={34} textAnchor="middle" fontSize={18} fontWeight={700} fill={TONE.fg}>
        Plane-polarised light in a polarimeter
      </text>
      <text x={W / 2} y={60} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        Enantiomers rotate the plane by equal and opposite angles
      </text>

      {/* Legend */}
      <line x1={128} y1={104} x2={164} y2={104} stroke={TONE.muted} strokeWidth={2} strokeDasharray="4 4" />
      <text x={174} y={110} fontSize={16} fill={TONE.muted}>
        Incident plane
      </text>
      <line x1={314} y1={104} x2={350} y2={104} stroke={TONE.accent} strokeWidth={3.4} />
      <text x={360} y={110} fontSize={16} fill={TONE.fg}>
        Emergent plane
      </text>

      <PolarimeterCell cx={96} title="d solution" angleDeg={32} readout="+θ" tone={TONE.accent} />
      <PolarimeterCell cx={270} title="l solution" angleDeg={-32} readout="-θ" tone={TONE.b} />
      <PolarimeterCell cx={444} title="Equal d + l" angleDeg={0} readout="0°" tone={TONE.success} />

      <text x={W / 2} y={424} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        Equal amounts of d and l cancel out: zero net rotation.
      </text>
    </g>
  )
}

function StepCisVsTransPt() {
  const cisLigands: readonly [LigandStyle, LigandStyle, LigandStyle, LigandStyle, LigandStyle, LigandStyle] = [
    LIG_CL, LIG_N, LIG_N, LIG_CL, LIG_N, LIG_N,
  ]
  const cisChelates: readonly ChelateArcSpec[] = [
    { from: 1, to: 2, label: 'en' },
    { from: 4, to: 5, label: 'en' },
  ]
  const transLigands: readonly [LigandStyle, LigandStyle, LigandStyle, LigandStyle, LigandStyle, LigandStyle] = [
    LIG_CL, LIG_CL, LIG_N, LIG_N, LIG_N, LIG_N,
  ]
  const transChelates: readonly ChelateArcSpec[] = [
    { from: 2, to: 3, label: 'en' },
    { from: 4, to: 5, label: 'en' },
  ]

  return (
    <g>
      <text x={W / 2} y={28} textAnchor="middle" fontSize={17} fontWeight={700} fill={TONE.fg}>
        [PtCl₂(en)₂]²⁺: cis vs trans (NCERT Fig. 5.7)
      </text>

      {/* Top box: cis pair (chiral) */}
      <rect x={16} y={42} width={508} height={192} rx={12} fill={TONE.raised} stroke={TONE.en} strokeWidth={1.6} />
      <OctahedralComplex cx={136} cy={126} radius={52} metal="Pt" ligands={cisLigands} chelates={cisChelates} fontSize={16} />
      <line x1={270} y1={56} x2={270} y2={190} stroke={TONE.accent} strokeWidth={2} strokeDasharray="6 4" />
      <OctahedralComplex cx={404} cy={126} radius={52} metal="Pt" ligands={cisLigands} chelates={cisChelates} mirrored fontSize={16} />
      <text x={44} y={70} fontSize={16} fontWeight={700} fill={TONE.en}>
        d
      </text>
      <text x={496} y={70} textAnchor="end" fontSize={16} fontWeight={700} fill={TONE.en}>
        l
      </text>
      <text x={W / 2} y={222} textAnchor="middle" fontSize={16} fontWeight={700} fill={TONE.fg}>
        cis: chiral, optically active (non-superimposable)
      </text>

      {/* Bottom box: trans (achiral with mirror plane) */}
      <rect x={16} y={246} width={508} height={192} rx={12} fill={TONE.raised} stroke={TONE.guide} strokeWidth={1.6} />
      <OctahedralComplex
        cx={176}
        cy={330}
        radius={52}
        metal="Pt"
        ligands={transLigands}
        chelates={transChelates}
        showMirrorPlane
        fontSize={16}
      />
      <text x={388} y={310} textAnchor="middle" fontSize={17} fontWeight={700} fill={TONE.fg}>
        trans: achiral
      </text>
      <text x={388} y={336} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        Dashed mirror plane cuts
      </text>
      <text x={388} y={360} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        both Cl and Pt: matches
      </text>
      <text x={388} y={384} textAnchor="middle" fontSize={16} fill={TONE.muted}>
        its own reflection.
      </text>
    </g>
  )
}

export function ChiralityMirror({ step, reducedMotion }: ChiralityMirrorProps) {
  const visual = chiralityStepVisual(step)
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label="Optical isomerism: d and l propellers of [Co(en)3]3+, non-superimposability, polarised light rotation, and cis versus trans [PtCl2(en)2]2+"
      style={{ display: 'block' }}
    >
      {visual === 'propellers' && <StepPropellers />}
      {visual === 'superimpose' && <StepSuperimpose reducedMotion={reducedMotion} />}
      {visual === 'polarimeter' && <StepPolarimeter />}
      {visual === 'cis-vs-trans' && <StepCisVsTransPt />}
    </svg>
  )
}
