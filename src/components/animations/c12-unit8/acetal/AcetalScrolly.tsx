'use client'

import type { ReactNode } from 'react'
import { TABLE_8_2_DERIVATIVES } from '@/lib/chem/ncert-c12-unit8-data'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import { CurvedArrow, SkeletalFormula, deltaText, lonePairAnchor } from '@/components/organic'
import { ROLE_TONE } from '@/components/vocab/organic6'
import { STEP_MOLECULES, W, H, atomPoint, type PlacedMolecule } from './acetal-steps'

export interface AcetalScrollyProps {
  /** 0-based Step index from Scrolly. */
  step: number
  /** Reduced motion: every Step is a cut, so this drawing has no tweens to switch off. */
  reducedMotion: boolean
}

type Point = { x: number; y: number }

const INK = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const UP = -Math.PI / 2

function Mol({ p, highlightAtoms }: { p: PlacedMolecule; highlightAtoms?: number[] }) {
  return (
    <SkeletalFormula
      graph={parseSmiles(p.smiles)}
      scale={p.scale}
      x={p.cx}
      y={p.cy}
      showLonePairs
      highlightAtoms={highlightAtoms}
    />
  )
}

/** A δ⁺ mark and a soft tone disc on the electrophilic carbonyl carbon. The δ⁺ sits where the Step has no bond. */
function Electrophile({ at, tx, ty, anchor = 'start' }: { at: Point; tx?: number; ty?: number; anchor?: 'start' | 'middle' | 'end' }) {
  return (
    <g>
      <circle cx={at.x} cy={at.y} r={20} fill={ROLE_TONE.electrophilicCarbon} fillOpacity={0.22} />
      <text x={tx ?? at.x + 18} y={ty ?? at.y - 16} textAnchor={anchor} fontSize={16} fill={ROLE_TONE.electrophilicCarbon}>
        {deltaText('δ⁺')}
      </text>
    </g>
  )
}

/** Methanol as written text (the carbon is written, not hidden). Its O lone pair is drawn above the O. */
function MethanolText({ p }: { p: PlacedMolecule }) {
  const o = methanolO(p)
  return (
    <g>
      <text x={p.cx} y={p.cy} textAnchor="middle" dominantBaseline="central" fontSize={18} fill={INK}>CH₃OH</text>
      <circle cx={o.x - 4} cy={o.y - 18} r={2.4} fill={INK} />
      <circle cx={o.x + 4} cy={o.y - 18} r={2.4} fill={INK} />
    </g>
  )
}

/** The oxygen of MethanolText, about 10.5 units right of the centre of "CH₃OH" at 18 px. */
function methanolO(p: PlacedMolecule): Point {
  return { x: p.cx + 10.5, y: p.cy }
}

/** Water written as text, with its "+" on the product side, on the product's baseline. */
function WaterText({ p }: { p: PlacedMolecule }) {
  return (
    <text x={p.cx} y={p.cy} dominantBaseline="central" fontSize={18} fill={INK}>+ H₂O</text>
  )
}

/** Electron-pair arrow from the top of atom `index` of `from`, starting just beyond its lone-pair dots. */
function PairArrow({ from, index, to, bend = -0.3 }: { from: PlacedMolecule; index: number; to: Point; bend?: number }) {
  const start = lonePairAnchor(atomPoint(from, index), UP, 40)
  return <CurvedArrow from={start} to={to} bend={bend} gap={6} />
}

/** A straight down arrow with its label on the right, for a lost small molecule or H⁺. */
function DownArrow({ x, y1, y2, label }: { x: number; y1: number; y2: number; label: ReactNode }) {
  return (
    <g>
      <line x1={x} y1={y1} x2={x} y2={y2 - 9} stroke={INK} strokeWidth={2} />
      <polygon points={`${x - 6},${y2 - 10} ${x + 6},${y2 - 10} ${x},${y2}`} fill={INK} />
      <text x={x + 12} y={(y1 + y2) / 2 + 5} fontSize={16} fill={INK}>
        {label}
      </text>
    </g>
  )
}

function Caption({ children }: { children: ReactNode }) {
  return (
    <text x={W / 2} y={572} textAnchor="middle" fontSize={15} fill={MUTED}>
      {children}
    </text>
  )
}

function Frame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} style={{ width: '100%', height: 'auto', display: 'block' }}>
      {children}
    </svg>
  )
}

/** Table 8.2 as a text table: the Z column is highlighted, and the 2,4-DNP row has its swatch. */
function DerivativeTable() {
  const rowTop = 118
  const rowH = 52
  return (
    <g>
      <text x={40} y={92} fontSize={15} fill={MUTED}>Z group</text>
      <text x={200} y={92} fontSize={15} fill={MUTED}>Product (reagent H₂N–Z)</text>
      {TABLE_8_2_DERIVATIVES.map((row, i) => {
        const y = rowTop + i * rowH
        const isDnp = row.product.startsWith('2,4-Dinitro')
        return (
          <g key={row.z}>
            <rect x={28} y={y - 6} width={150} height={rowH - 10} rx={6} fill="var(--accent)" fillOpacity={0.14} />
            <text x={40} y={y + 20} fontSize={15} fill={INK}>{row.z}</text>
            <text x={200} y={y + 20} fontSize={15} fill={INK}>{row.product}</text>
            {isDnp && (
              <g>
                <rect x={470} y={y - 2} width={70} height={22} rx={4} fill={ROLE_TONE.leavingGroup} />
                <text x={505} y={y + 14} textAnchor="middle" fontSize={14} fill={INK}>solid</text>
              </g>
            )}
          </g>
        )
      })}
      <text x={W / 2} y={560} textAnchor="middle" fontSize={15} fill={MUTED}>
        2,4-DNP derivatives: yellow, orange or red solids
      </text>
    </g>
  )
}

export function AcetalScrolly({ step }: AcetalScrollyProps) {
  const index = Math.min(STEP_MOLECULES.length - 1, Math.max(0, Math.round(step)))
  const mols = STEP_MOLECULES[index]
  const get = (id: string): PlacedMolecule => {
    const p = mols.find((m) => m.id === id)
    if (!p) throw new Error(`Step ${index + 1} has no ${id}`)
    return p
  }

  if (index === 0) {
    const propanal = get('propanal')
    const pro = get('pro')
    const e = atomPoint(pro, 2)
    return (
      <Frame label="Dry HCl protonates the carbonyl oxygen of propanal">
        <Mol p={propanal} />
        <text x={326} y={100} textAnchor="middle" dominantBaseline="central" fontSize={18} fill={INK}>H</text>
        <line x1={340} y1={100} x2={420} y2={100} stroke={INK} strokeWidth={2} />
        <text x={434} y={100} textAnchor="middle" dominantBaseline="central" fontSize={18} fill={INK}>Cl</text>
        <PairArrow from={propanal} index={3} to={{ x: 316, y: 100 }} bend={0.3} />
        <CurvedArrow from={{ x: 380, y: 100 }} to={{ x: 434, y: 120 }} bend={-0.3} gap={4} />
        <DownArrow x={210} y1={210} y2={320} label="H⁺" />
        <Mol p={pro} />
        <Electrophile at={e} tx={e.x} ty={e.y + 36} anchor="middle" />
        <text x={340} y={400} dominantBaseline="central" fontSize={18} fill={INK}>+ Cl⁻</text>
        <Caption>Dry HCl: H⁺ goes onto the carbonyl oxygen</Caption>
      </Frame>
    )
  }

  if (index === 1) {
    const pro = get('pro')
    const meoh = get('meoh')
    const oxo = get('oxo')
    const hemi = get('hemi')
    const e = atomPoint(pro, 2)
    const o = methanolO(meoh)
    return (
      <Frame label="Methanol adds to protonated propanal, the oxonium ion loses H⁺ and gives the hemiacetal">
        <Mol p={pro} />
        <MethanolText p={meoh} />
        <Electrophile at={e} tx={e.x - 22} ty={e.y + 28} anchor="end" />
        <CurvedArrow from={{ x: o.x, y: o.y - 34 }} to={e} bend={0.3} gap={8} />
        <Mol p={oxo} />
        <DownArrow x={290} y1={392} y2={452} label="−H⁺" />
        <Mol p={hemi} />
        <Caption>Hemiacetal: one C with an OH and an OCH₃</Caption>
      </Frame>
    )
  }

  if (index === 2) {
    const hemi = get('hemi')
    const meoh = get('meoh')
    const acetal = get('acetal')
    const water = get('water')
    return (
      <Frame label="Hemiacetal and methanol give the acetal and water, in dry HCl">
        <Mol p={hemi} />
        <text x={300} y={150} textAnchor="middle" dominantBaseline="central" fontSize={22} fill={INK}>+</text>
        <MethanolText p={meoh} />
        <DownArrow x={290} y1={236} y2={316} label="dry HCl" />
        <Mol p={acetal} />
        <WaterText p={water} />
        <Caption>Acetal, 1,1-dimethoxypropane: C₅H₁₂O₂</Caption>
      </Frame>
    )
  }

  if (index === 3) {
    const ketone = get('ketone')
    const glycol = get('glycol')
    const ketal = get('ketal')
    const water = get('water')
    return (
      <Frame label="Butan-2-one and ethylene glycol give a cyclic ketal; the two ring oxygens are highlighted">
        <Mol p={ketone} />
        <Mol p={glycol} />
        <Electrophile at={atomPoint(ketone, 2)} />
        <PairArrow from={glycol} index={0} to={atomPoint(ketone, 2)} />
        <DownArrow x={290} y1={206} y2={300} label="−H₂O" />
        <Mol p={ketal} highlightAtoms={[4, 7]} />
        <WaterText p={water} />
        <Caption>Cyclic ethylene glycol ketal: C₆H₁₂O₂</Caption>
      </Frame>
    )
  }

  if (index === 4) {
    const propanal = get('propanal')
    const nh3 = get('nh3')
    const hemiaminal = get('hemiaminal')
    const imine = get('imine')
    const water = get('water')
    return (
      <Frame label="Ammonia adds to propanal, the intermediate loses water and gives propanimine">
        <Mol p={propanal} />
        <Mol p={nh3} />
        <Electrophile at={atomPoint(propanal, 2)} />
        <PairArrow from={nh3} index={0} to={atomPoint(propanal, 2)} />
        <Mol p={hemiaminal} />
        <DownArrow x={300} y1={410} y2={460} label="−H₂O" />
        <Mol p={imine} />
        <WaterText p={water} />
        <Caption>Propanimine, CH₃CH₂CH=NH: C=N in place of C=O</Caption>
      </Frame>
    )
  }

  return (
    <Frame label="Table 8.2: the Z group of each H₂N–Z reagent, with the 2,4-DNP derivative as a coloured solid">
      <DerivativeTable />
    </Frame>
  )
}
