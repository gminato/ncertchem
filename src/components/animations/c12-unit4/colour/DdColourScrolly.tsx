'use client'

import {
  ColourWheel,
  ION_COLOUR_TOKEN,
  MetalLattice,
  SERIES_TONE,
  SolutionColour,
  SPECTRAL_KEYS,
  SPECTRAL_TOKEN,
  type SpectralKey,
} from '@/components/vocab/dblock'
import { colourStepState, type ColourStep } from './colour-steps'

export interface DdColourScrollyProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

const W = 580
const H = 460
const MUTED = 'var(--fg-muted)'
const FG = 'var(--fg)'
const TEXT_SIZE = 15
const ARROW = 'c7-arrow'

function Arrowhead() {
  return (
    <defs>
      <marker id={ARROW} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
        <path d="M0 0 L10 5 L0 10 z" fill={MUTED} />
      </marker>
    </defs>
  )
}

function AbsorbScene({ s }: { s: Extract<ColourStep, { kind: 'absorb' }> }) {
  const stripX = 40
  const stripW = 500
  const segW = stripW / SPECTRAL_KEYS.length
  const absorbedIndex = SPECTRAL_KEYS.indexOf(s.absorbed)
  const seenIndex = SPECTRAL_KEYS.indexOf(s.seen)
  return (
    <>
      <SolutionColour x={0} y={30} width={190} ion={s.key} light label="Cu²⁺(aq)" />
      <ColourWheel cx={355} cy={150} radius={70} absorbed={s.absorbed} seen={s.seen} />
      <text x={stripX} y={316} fill={FG} fontSize={TEXT_SIZE}>
        White light, split into its colours
      </text>
      {SPECTRAL_KEYS.map((key: SpectralKey, i) => {
        const x = stripX + i * segW
        const isAbsorbed = i === absorbedIndex
        return isAbsorbed ? (
          <rect
            key={key}
            data-band="absorbed"
            x={x}
            y={328}
            width={segW}
            height={40}
            fill="none"
            stroke={MUTED}
            strokeDasharray="4 3"
            strokeWidth={2}
          />
        ) : (
          <rect key={key} x={x} y={328} width={segW} height={40} fill={SPECTRAL_TOKEN[key]} />
        )
      })}
      <text
        x={stripX + (absorbedIndex + 0.5) * segW}
        y={392}
        textAnchor="middle"
        fill={FG}
        fontSize={TEXT_SIZE}
      >
        absorbed
      </text>
      <text
        x={stripX + (seenIndex + 0.5) * segW}
        y={392}
        textAnchor="middle"
        fill={FG}
        fontSize={TEXT_SIZE}
      >
        seen
      </text>
    </>
  )
}

function LadderScene({ s }: { s: Extract<ColourStep, { kind: 'ladder' }> }) {
  const left = 170
  const right = 410
  const upperY = 130
  const lowerY = 300
  const mid = (left + right) / 2
  // Wavy photon, drawn as a sine path from the left edge to the lower-left of the ladder.
  const waveY = 215
  const waveEnd = 140
  let wave = `M 20 ${waveY}`
  for (let x = 20; x <= waveEnd; x += 4) {
    const y = waveY + 9 * Math.sin(((x - 20) / 14) * Math.PI)
    wave += ` L ${x} ${y.toFixed(1)}`
  }
  return (
    <>
      <text x={W / 2} y={62} textAnchor="middle" fill={FG} fontSize={TEXT_SIZE}>
        One {s.ion}(aq) ion, zoomed in
      </text>
      <path d={wave} fill="none" stroke="var(--spec-orange)" strokeWidth={3} />
      <text x={20} y={180} fill={MUTED} fontSize={TEXT_SIZE}>
        photon of the gap energy
      </text>
      <line x1={left} y1={upperY} x2={right} y2={upperY} stroke={FG} strokeWidth={3} />
      <line x1={left} y1={lowerY} x2={right} y2={lowerY} stroke={FG} strokeWidth={3} />
      <text x={right + 16} y={upperY + 5} fill={FG} fontSize={TEXT_SIZE}>
        upper d level
      </text>
      <text x={right + 16} y={lowerY + 5} fill={FG} fontSize={TEXT_SIZE}>
        lower d level
      </text>
      <circle cx={mid} cy={lowerY - 16} r={12} fill="var(--accent)" />
      <text x={mid} y={lowerY - 12} textAnchor="middle" fill="var(--accent-fg)" fontSize={14}>
        e⁻
      </text>
      <line
        x1={mid}
        y1={lowerY - 34}
        x2={mid}
        y2={upperY + 10}
        stroke={MUTED}
        strokeWidth={2.5}
        strokeDasharray="6 5"
        markerEnd={`url(#${ARROW})`}
      />
      <text x={mid + 14} y={(lowerY + upperY) / 2 + 5} fill={FG} fontSize={TEXT_SIZE}>
        gap
      </text>
      <text x={W / 2} y={400} textAnchor="middle" fill={MUTED} fontSize={TEXT_SIZE}>
        Simplified two-level picture; no splitting theory
      </text>
    </>
  )
}

function ColourlessScene({ s }: { s: Extract<ColourStep, { kind: 'colourless' }> }) {
  const width = 190
  return (
    <>
      {s.ions.map((ion, i) => {
        const x = i * 195
        return (
          <g key={ion.label}>
            <SolutionColour x={x} y={20} width={width} ion={ion.key} light label={ion.label} />
            <text x={x + width / 2} y={262} textAnchor="middle" fill={FG} fontSize={TEXT_SIZE}>
              d electrons: {ion.dCount}
            </text>
          </g>
        )
      })}
      <text x={W / 2} y={340} textAnchor="middle" fill={MUTED} fontSize={TEXT_SIZE}>
        A full or empty d shell gives no d–d jump,
      </text>
      <text x={W / 2} y={366} textAnchor="middle" fill={MUTED} fontSize={TEXT_SIZE}>
        so white light passes through unchanged.
      </text>
    </>
  )
}

function LoopScene({ s }: { s: Extract<ColourStep, { kind: 'loop' }> }) {
  return (
    <>
      <path d="M 182 170 Q 290 50 398 170" fill="none" stroke={MUTED} strokeWidth={2.5} markerEnd={`url(#${ARROW})`} />
      <path d="M 398 210 Q 290 330 182 210" fill="none" stroke={MUTED} strokeWidth={2.5} markerEnd={`url(#${ARROW})`} />
      <text x={290} y={70} textAnchor="middle" fill={FG} fontSize={TEXT_SIZE}>
        {s.step1}
      </text>
      <text x={290} y={302} textAnchor="middle" fill={FG} fontSize={TEXT_SIZE}>
        {s.step2}
      </text>
      <g>
        <circle cx={140} cy={190} r={40} fill={ION_COLOUR_TOKEN.fe3} stroke={MUTED} strokeWidth={1.5} />
        <text x={140} y={196} textAnchor="middle" fill={FG} fontSize={17}>
          Fe³⁺
        </text>
      </g>
      <g>
        <circle cx={440} cy={190} r={40} fill={ION_COLOUR_TOKEN.fe2} stroke={MUTED} strokeWidth={1.5} />
        <text x={440} y={196} textAnchor="middle" fill={FG} fontSize={17}>
          Fe²⁺
        </text>
      </g>
      <text x={W / 2} y={384} textAnchor="middle" fill={FG} fontSize={TEXT_SIZE}>
        Overall: {s.overall}
      </text>
      <text x={W / 2} y={414} textAnchor="middle" fill={MUTED} fontSize={TEXT_SIZE}>
        Fe³⁺ starts and ends each cycle unchanged.
      </text>
    </>
  )
}

function LatticeScene({ s }: { s: Extract<ColourStep, { kind: 'lattice' }> }) {
  const host = SERIES_TONE['3d']
  return (
    <>
      <MetalLattice x={30} y={120} rows={5} cols={6} tone={host} interstitial={s.interstitial} />
      <MetalLattice x={310} y={120} rows={5} cols={6} tone={host} alloy={{ symbol: s.alloySymbol, tone: 'var(--spec-orange)' }} />
      <text x={150} y={100} textAnchor="middle" fill={FG} fontSize={TEXT_SIZE}>
        {s.interstitialFormula}: C in the holes
      </text>
      <text x={430} y={100} textAnchor="middle" fill={FG} fontSize={TEXT_SIZE}>
        Brass: Zn in a Cu lattice
      </text>
      <text x={150} y={370} textAnchor="middle" fill={MUTED} fontSize={TEXT_SIZE}>
        Interstitial: small atoms fill holes
      </text>
      <text x={430} y={370} textAnchor="middle" fill={MUTED} fontSize={TEXT_SIZE}>
        Alloy: some sites are swapped
      </text>
    </>
  )
}

function describe(s: ColourStep): string {
  switch (s.kind) {
    case 'absorb':
      return `Cu²⁺(aq) beaker: ${s.absorbed} band absorbed, ${s.seen} seen`
    case 'ladder':
      return 'Two d levels with an electron jumping across a photon-sized gap'
    case 'colourless':
      return 'Zn²⁺, Sc³⁺ and Ti⁴⁺ beakers: all light passes through'
    case 'loop':
      return 'Iron(III) and iron(II) catalytic loop for iodide and peroxodisulphate'
    case 'lattice':
      return 'Metal lattice with C in the holes (TiC), and a brass alloy lattice'
  }
}

/** Section 7 Scrolly: colour from d–d, complementary colour, the Fe³⁺/Fe²⁺ loop, lattices and alloys. */
export function DdColourScrolly({ step }: DdColourScrollyProps) {
  const s = colourStepState(step)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={describe(s)}>
      <Arrowhead />
      {s.kind === 'absorb' && <AbsorbScene s={s} />}
      {s.kind === 'ladder' && <LadderScene s={s} />}
      {s.kind === 'colourless' && <ColourlessScene s={s} />}
      {s.kind === 'loop' && <LoopScene s={s} />}
      {s.kind === 'lattice' && <LatticeScene s={s} />}
    </svg>
  )
}
